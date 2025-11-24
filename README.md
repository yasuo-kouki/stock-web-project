# 株価チャート分析アプリケーション

このプロジェクトは、株価データを取得・表示し、OpenAI APIを使用して株価予測を行うWebアプリケーションです。

## アーキテクチャ

- **フロントエンド**: Next.js 16 (React 19) + TypeScript + Tailwind CSS
- **バックエンド**: FastAPI (Python 3.11) + SQLite
- **デプロイ**: Azure Container Apps (Docker)

## 前提条件

- Python 3.11以上
- Node.js 20以上
- npm または yarn
- OpenAI APIキー
- (Azureデプロイの場合) Azure CLI、Docker

## セットアップ

### 1. バックエンドのセットアップ

```bash
cd backend
pip install -r requirements.txt
```

#### 環境変数の設定

`backend/.env`ファイルを作成し、以下の内容を追加してください：

```bash
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=http://localhost:3000,http://192.168.1.15:3000,http://127.0.0.1:3000
```

**注意**: 
- `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- `CORS_ORIGINS`は、フロントエンドにアクセスするURLをカンマ区切りで指定します
- ローカル開発では`http://localhost:3000`を含める必要があります

#### バックエンドサーバーの起動

```bash
cd backend
uvicorn main:app --reload
```

バックエンドは `http://127.0.0.1:8000` で起動します。

APIドキュメントは `http://127.0.0.1:8000/docs` で確認できます。

### 2. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

#### 環境変数の設定

`frontend/.env.local`ファイルを作成し、以下の内容を追加してください：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**注意**: 
- `.env.local`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- ローカル開発では`http://localhost:8000`を指定します
- Azureのバックエンドに接続する場合は、AzureのバックエンドURLを指定します

#### フロントエンドサーバーの起動

```bash
cd frontend
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## ローカル開発の手順

1. **バックエンドを起動**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **フロントエンドを起動**（別のターミナルで）
   ```bash
   cd frontend
   npm run dev
   ```

3. **ブラウザでアクセス**
   - フロントエンド: `http://localhost:3000`
   - バックエンドAPI: `http://127.0.0.1:8000/docs`

## APIエンドポイント

### POST /download_stock
株価データを取得します。

**リクエストボディ**:
```json
{
  "symbol": "AAPL",
  "period": "1y"
}
```

**レスポンス**:
```json
{
  "symbol": "AAPL",
  "data": [...],
  "message": "株価データを取得しました"
}
```

### POST /predict
OpenAI APIを使用して株価予測を行います。

**リクエストボディ**:
```json
{
  "symbol": "AAPL",
  "period": "1y"
}
```

**レスポンス**:
```json
{
  "prediction": "予測結果のテキスト",
  "symbol": "AAPL"
}
```

## デプロイメント

### Azure Container Appsへのデプロイ

詳細なデプロイ手順は以下のドキュメントを参照してください：

- **バックエンド**: `AZURE_DOCKER_DEPLOYMENT.md`
- **フロントエンド**: `frontend/DOCKER_DEPLOYMENT.md`

### 環境変数のクイックリファレンス

環境変数の設定方法の詳細は `ENV_VARIABLES_QUICK_REFERENCE.md` を参照してください。

## プロジェクト構造

```
stock-project/
├── backend/              # FastAPIバックエンド
│   ├── main.py          # メインアプリケーション
│   ├── requirements.txt # Python依存関係
│   ├── .env             # 環境変数（ローカル開発用）
│   └── Dockerfile       # Dockerイメージ定義
├── frontend/            # Next.jsフロントエンド
│   ├── app/             # Next.js App Router
│   ├── components/      # Reactコンポーネント
│   ├── package.json     # Node.js依存関係
│   ├── .env.local       # 環境変数（ローカル開発用）
│   ├── Dockerfile       # Dockerイメージ定義
│   └── nginx.conf       # Nginx設定（本番環境用）
├── ENV_VARIABLES_QUICK_REFERENCE.md  # 環境変数リファレンス
├── AZURE_DOCKER_DEPLOYMENT.md        # Azureデプロイガイド
└── README.md            # このファイル
```
## ライセンス

このプロジェクトは個人利用・学習目的で作成されています。
