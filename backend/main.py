from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import sqlite3
import pandas as pd
import datetime
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# 環境変数を読み込む（backendディレクトリの.envファイルを明示的に指定）
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# OpenAIクライアント初期化（APIキーが設定されている場合のみ）
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print(f"警告: OPENAI_API_KEYが設定されていません。.envファイルのパス: {env_path}")
    print(f".envファイルが存在するか: {os.path.exists(env_path)}")
else:
    print(f"OPENAI_API_KEYが正常に読み込まれました（長さ: {len(OPENAI_API_KEY)}文字）")

client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAIクライアントが正常に初期化されました")
    except Exception as e:
        print(f"OpenAIクライアントの初期化エラー: {e}")

app = FastAPI()

# CORS設定: 環境変数から許可するオリジンを取得
# 複数のオリジンをカンマ区切りで指定可能（例: "http://localhost:3000,https://example.com"）
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
# 空白を削除
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StockRequest(BaseModel):
    symbol: str

class StockData(BaseModel):
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float
    SMA5: float | None = None
    SMA25: float | None = None
    EMA12: float | None = None
    EMA26: float | None = None
    BB_UPPER: float | None = None
    BB_LOWER: float | None = None

# 上場日マッピング
IPO_DATES = {
    "NVDA": "1999-01-22",
    "TSLA": "2010-06-29",
    "IONQ": "2021-10-01",
    "7203.T": "1949-05-01"
}

def init_db():
    conn = sqlite3.connect("stocks.db")
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS stock_data (
            symbol TEXT,
            date TEXT,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume INTEGER,
            PRIMARY KEY(symbol, date)
        )
    """)
    # 予測結果キャッシュ用テーブル
    c.execute("""
        CREATE TABLE IF NOT EXISTS forecast_cache (
            symbol TEXT,
            forecast_date TEXT,
            forecast_json TEXT,
            created_at TEXT,
            PRIMARY KEY(symbol, forecast_date)
        )
    """)
    conn.commit()
    conn.close()

init_db()


import pandas as pd
import numpy as np

def add_technical_indicators(df: pd.DataFrame):
    """代表的なテクニカル指標を追加"""
    df = df.copy()

    # 5日・25日・50日SMA
    df['SMA5'] = df['Close'].rolling(window=5).mean()
    df['SMA25'] = df['Close'].rolling(window=25).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()

    # 12日・26日EMA
    df['EMA12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA26'] = df['Close'].ewm(span=26, adjust=False).mean()

    # RSI (期間14)
    delta = df['Close'].diff()
    up = delta.clip(lower=0)
    down = -1*delta.clip(upper=0)
    roll_up = up.rolling(14).mean()
    roll_down = down.rolling(14).mean()
    RS = roll_up / roll_down
    df['RSI14'] = 100 - (100 / (1 + RS))

    # ボリンジャーバンド（20日・標準偏差2）
    df['BB_MA20'] = df['Close'].rolling(20).mean()
    df['BB_STD20'] = df['Close'].rolling(20).std()
    df['BB_UPPER'] = df['BB_MA20'] + 2 * df['BB_STD20']
    df['BB_LOWER'] = df['BB_MA20'] - 2 * df['BB_STD20']

    # NaN値をNoneに変換（JSON対応）
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    
    return df



def download_stock_data(symbol: str):
    """株価データを取得（上場日から）"""
    try:
        # 上場日を取得
        start_date = IPO_DATES.get(symbol)
        
        if start_date:
            # 上場日から現在まで取得
            df = yf.download(symbol, start=start_date, progress=False)
        else:
            # 上場日が不明な場合は全期間を取得
            df = yf.download(symbol, period='max', progress=False)
        
        if df.empty:
            return None

        # MultiIndex列の場合は単一列に変換
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]

        df.reset_index(inplace=True)
        return df
    except Exception as e:
        print(f"エラー発生: {e}")
        return None

def clean_stock_data(data: pd.DataFrame):
    """株価データ整形"""
    df = data.copy()
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df.sort_values('Date').reset_index(drop=True)
    # 必要な列だけ
    df = df[['Date','Open','High','Low','Close','Volume']]
    return df

@app.post("/download_stock")
def get_stock(req: StockRequest):
    try:
        conn = sqlite3.connect("stocks.db")
        c = conn.cursor()

        # DB確認
        c.execute("SELECT * FROM stock_data WHERE symbol=?", (req.symbol,))
        rows = c.fetchall()
        if rows:
            df = pd.DataFrame(rows, columns=["symbol","Date","Open","High","Low","Close","Volume"])
            # Date列をdatetime型に変換
            df['Date'] = pd.to_datetime(df['Date'])
            # テクニカル指標を計算
            df = add_technical_indicators(df)
            # NaN値をNoneに変換（JSON対応）
            df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
            conn.close()
            return df.to_dict(orient="records")

        # 取得
        df_raw = download_stock_data(req.symbol)
        if df_raw is None or df_raw.empty:
            conn.close()
            raise HTTPException(status_code=404, detail=f"{req.symbol} のデータ取得失敗。銘柄コードが正しいか確認してください。")

        df_clean = clean_stock_data(df_raw)
        if df_clean.empty:
            conn.close()
            raise HTTPException(status_code=404, detail=f"{req.symbol} のデータが空です。")

        df_clean = add_technical_indicators(df_clean)  # 指標追加
        # NaN値をNoneに変換（JSON対応）
        df_clean = df_clean.replace({np.nan: None, np.inf: None, -np.inf: None})

        # DB保存
        for _, row in df_clean.iterrows():
            c.execute("""
                INSERT OR REPLACE INTO stock_data
                (symbol, date, open, high, low, close, volume)
                VALUES (?,?,?,?,?,?,?)
            """, (
                req.symbol, row['Date'].strftime("%Y-%m-%d"),
                row['Open'], row['High'], row['Low'], row['Close'], row['Volume']
            ))
        conn.commit()
        conn.close()

        return df_clean.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        print(f"エラー発生: {e}")
        raise HTTPException(status_code=500, detail=f"サーバーエラー: {str(e)}")

@app.post("/predict")
async def predict_stock(data: StockData):
    """
    株価指標データをもとに翌営業日の上昇／下落シナリオを予測する
    1日1回のみAPIを呼び出し、結果をキャッシュする
    """
    if not client:
        raise HTTPException(
            status_code=503, 
            detail="OpenAI APIキーが設定されていません。.envファイルにOPENAI_API_KEYを設定してください。"
        )
    
    try:
        conn = sqlite3.connect("stocks.db")
        c = conn.cursor()
        
        # 今日の日付を取得
        today = datetime.date.today().strftime("%Y-%m-%d")
        
        # キャッシュをチェック（同じ銘柄、同じ日の予測が既にあるか）
        c.execute("""
            SELECT forecast_json, created_at 
            FROM forecast_cache 
            WHERE symbol=? AND forecast_date=?
        """, (data.symbol, today))
        
        cache_result = c.fetchone()
        if cache_result:
            # キャッシュから返す
            conn.close()
            return {
                "symbol": data.symbol,
                "forecast": json.loads(cache_result[0]),
                "cached": True
            }
        
        # キャッシュがない場合のみAPIを呼び出す
        # ChatGPTへ投げるメッセージ
        system_prompt = (
            "あなたは株価テクニカル分析AIです．"
            "与えられた日足データ（SMA5, SMA25, EMA12, EMA26, BB_UPPER, BB_LOWER, open, high, low, close）から，"
            "次営業日の上昇／下落シナリオを専門的に出力してください．"
            "出力は以下のJSON形式に厳密に従ってください．"
            "数値はUSD単位で推定し，確率は0〜100で整数にしてください．"
            "すべての文字列（condition, target_range, support_range, comment）は日本語で出力してください．\n\n"
            "出力形式:\n"
            "{\n"
            "  \"forecast_date\": \"YYYY-MM-DD\",\n"
            "  \"bullish_scenario\": {\n"
            "    \"probability\": 整数,\n"
            "    \"condition\": \"日本語の文字列\",\n"
            "    \"target_range\": \"日本語の文字列\"\n"
            "  },\n"
            "  \"bearish_scenario\": {\n"
            "    \"probability\": 整数,\n"
            "    \"condition\": \"日本語の文字列\",\n"
            "    \"support_range\": \"日本語の文字列\"\n"
            "  },\n"
            "  \"comment\": \"短期／中期トレンドなどをまとめた日本語の考察\"\n"
            "}"
        )

        # データをJSON形式に変換
        data_dict = data.model_dump()
        user_content = json.dumps(data_dict, indent=2, ensure_ascii=False)

        # ChatGPTにリクエスト
        response = client.chat.completions.create(
            model="gpt-4o",  # gpt-5は存在しないため、gpt-4oに変更
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
        )

        result = response.choices[0].message.content
        result_json = json.loads(result)
        
        # キャッシュに保存
        c.execute("""
            INSERT OR REPLACE INTO forecast_cache
            (symbol, forecast_date, forecast_json, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            data.symbol,
            today,
            json.dumps(result_json, ensure_ascii=False),
            datetime.datetime.now().isoformat()
        ))
        conn.commit()
        conn.close()
        
        return {
            "symbol": data.symbol,
            "forecast": result_json,
            "cached": False
        }
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        print(f"予測エラー発生: {e}")
        raise HTTPException(status_code=500, detail=f"予測エラー: {str(e)}")
