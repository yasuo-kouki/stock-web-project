import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockData {
  Date: string;
  Close: number;
  Open?: number;
  High?: number;
  Low?: number;
  SMA5?: number;
  SMA25?: number;
  EMA12?: number;
  EMA26?: number;
  RSI14?: number;
  BB_UPPER?: number;
  BB_LOWER?: number;
}

interface ForecastResult {
  forecast_date: string;
  bullish_scenario: {
    probability: number;
    condition: string;
    target_range: string;
  };
  bearish_scenario: {
    probability: number;
    condition: string;
    support_range: string;
  };
  comment: string;
}

const STOCK_OPTIONS = [
  { label: "エヌビディア (NVDA)", value: "NVDA" },
  { label: "イオンキュー (IONQ)", value: "IONQ" },
  { label: "Tesla (TSLA)", value: "TSLA" }
];

export default function StockChart() {
  // バックエンドAPIのURL（環境変数から取得、デフォルトはローカル開発用）
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [allData, setAllData] = useState<StockData[]>([]);
  const [data, setData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState("NVDA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100]);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastCached, setForecastCached] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/download_stock`, { symbol });
      const fetchedData = response.data;
      if (!fetchedData || fetchedData.length === 0) {
        setError("データが取得できませんでした。銘柄コードが正しいか確認してください。");
        setLoading(false);
        return;
      }
      setAllData(fetchedData);
      // 初期表示を1年に設定
      if (fetchedData.length > 0) {
        const endDate = new Date(fetchedData[fetchedData.length - 1].Date);
        const startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);
        
        const startIndex = fetchedData.findIndex(d => {
          const date = new Date(d.Date);
          return date >= startDate;
        });
        
        if (startIndex === -1) {
          setDateRange([0, 100]);
          setData(fetchedData);
        } else {
          const startPercent = (startIndex / (fetchedData.length - 1)) * 100;
          setDateRange([startPercent, 100]);
          // 期間フィルタリングはuseEffectで自動的に行われる
        }
      } else {
        setDateRange([0, 100]);
        setData(fetchedData);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response) {
        // サーバーからのエラーレスポンス
        const errorMessage = error.response.data?.detail || error.response.data?.message || "データ取得に失敗しました。";
        setError(errorMessage);
      } else if (error.request) {
        // リクエストは送信されたが、レスポンスが返ってこなかった
        setError("バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。");
      } else {
        // リクエストの設定中にエラーが発生
        setError("データ取得に失敗しました。");
      }
    }
    setLoading(false);
  };

  // 期間フィルタリング
  useEffect(() => {
    if (allData.length > 0) {
      const startIndex = Math.floor((dateRange[0] / 100) * allData.length);
      const endIndex = Math.floor((dateRange[1] / 100) * allData.length);
      const filteredData = allData.slice(startIndex, endIndex + 1);
      setData(filteredData);
    }
  }, [dateRange, allData]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // 予測データを取得
  const fetchForecast = async () => {
    if (allData.length === 0) return;
    
    // 最新のデータを使用（期間選択に関係なく）
    const latestData = allData[allData.length - 1];
    if (!latestData.Open || !latestData.High || !latestData.Low || !latestData.Close) {
      return;
    }

    setForecastLoading(true);
    setForecastError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, {
        symbol: symbol,
        date: latestData.Date,
        open: latestData.Open,
        high: latestData.High,
        low: latestData.Low,
        close: latestData.Close,
        SMA5: latestData.SMA5 ?? null,
        SMA25: latestData.SMA25 ?? null,
        EMA12: latestData.EMA12 ?? null,
        EMA26: latestData.EMA26 ?? null,
        BB_UPPER: latestData.BB_UPPER ?? null,
        BB_LOWER: latestData.BB_LOWER ?? null
      });
      setForecast(response.data.forecast);
      setForecastCached(response.data.cached || false);
    } catch (error: any) {
      console.error(error);
      if (error.response) {
        const errorMessage = error.response.data?.detail || "予測取得に失敗しました。";
        setForecastError(errorMessage);
      } else {
        setForecastError("予測取得に失敗しました。");
      }
    }
    setForecastLoading(false);
  };

  // 自動取得は無効化（ボタンクリック時のみ実行）


  const getChartData = () => {
    // 選択された期間の日数を計算
    let daysDiff = 0;
    if (data.length > 0 && allData.length > 0) {
      const startDate = new Date(data[0].Date);
      const endDate = new Date(data[data.length - 1].Date);
      daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    // 3ヶ月（約90日）以上の場合、プロット点を非表示
    const showPoints = daysDiff < 90;
    const pointRadius = showPoints ? 3 : 0;

    const datasets: any[] = [
      { 
        label: "終値", 
        data: data.map(d => d.Close ?? null), 
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        hidden: false,
        pointRadius: pointRadius,
        pointHoverRadius: showPoints ? 5 : 0
      },
      { 
        label: "SMA5", 
        data: data.map(d => d.SMA5 ?? null), 
        borderColor: "rgb(251, 146, 60)", 
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        spanGaps: false
      },
      { 
        label: "SMA25", 
        data: data.map(d => d.SMA25 ?? null), 
        borderColor: "rgb(168, 85, 247)", 
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        spanGaps: false
      },
      { 
        label: "EMA12", 
        data: data.map(d => d.EMA12 ?? null), 
        borderColor: "rgb(34, 197, 94)", 
        borderDash: [5, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        spanGaps: false
      },
      { 
        label: "EMA26", 
        data: data.map(d => d.EMA26 ?? null), 
        borderColor: "rgb(239, 68, 68)", 
        borderDash: [5, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        spanGaps: false
      },
      { 
        label: "BB上限", 
        data: data.map(d => d.BB_UPPER ?? null), 
        borderColor: "rgba(59, 130, 246, 0.5)", 
        borderDash: [2, 2],
        borderWidth: 1,
        pointRadius: 0,
        spanGaps: false
      },
      { 
        label: "BB下限", 
        data: data.map(d => d.BB_LOWER ?? null), 
        borderColor: "rgba(59, 130, 246, 0.5)", 
        borderDash: [2, 2],
        borderWidth: 1,
        pointRadius: 0,
        spanGaps: false
      }
    ];

    return {
      labels: data.map(d => new Date(d.Date).toLocaleDateString("ja-JP")),
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: { 
        position: "top" as const,
        labels: { 
          boxWidth: 12, 
          padding: 12,
          color: "rgb(148, 163, 184)",
          font: {
            size: 12
          },
          usePointStyle: true
        } 
      },
      tooltip: { 
        mode: "index" as const, 
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold" as const
        },
        bodyFont: {
          size: 12
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: "日付",
          color: "rgb(148, 163, 184)",
          font: {
            size: 12,
            weight: "bold" as const
          }
        },
        ticks: {
          color: "rgb(148, 163, 184)"
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)"
        }
      },
      y: { 
        title: { 
          display: true, 
          text: "価格 (USD)",
          color: "rgb(148, 163, 184)",
          font: {
            size: 12,
            weight: "bold" as const
          }
        },
        beginAtZero: false,
        ticks: {
          color: "rgb(148, 163, 184)"
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)"
        }
      }
    }
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].Close : null;
  const previousPrice = data.length > 1 ? data[data.length - 2].Close : null;
  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : null;
  const priceChangePercent = currentPrice && previousPrice ? ((priceChange! / previousPrice) * 100) : null;

  const getDateLabel = (percentage: number) => {
    if (allData.length === 0) return "";
    const index = Math.floor((percentage / 100) * (allData.length - 1));
    const date = new Date(allData[index].Date);
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
  };

  const setDateRangeByPeriod = (period: string) => {
    if (allData.length === 0) return;
    
    const endDate = new Date(allData[allData.length - 1].Date);
    let startDate = new Date(endDate);
    
    switch (period) {
      case "1日":
        // 前日のデータのみを表示
        const previousDay = new Date(endDate);
        previousDay.setDate(endDate.getDate() - 1);
        previousDay.setHours(0, 0, 0, 0);
        const previousDayEnd = new Date(previousDay);
        previousDayEnd.setHours(23, 59, 59, 999);
        
        // 前日のデータを探す
        const previousDayIndices: number[] = [];
        allData.forEach((d, index) => {
          const date = new Date(d.Date);
          if (date >= previousDay && date <= previousDayEnd) {
            previousDayIndices.push(index);
          }
        });
        
        if (previousDayIndices.length > 0) {
          // 前日のデータが見つかった場合、その日のみ表示
          const startIndex = previousDayIndices[0];
          const endIndex = previousDayIndices[previousDayIndices.length - 1];
          const startPercent = (startIndex / (allData.length - 1)) * 100;
          const endPercent = (endIndex / (allData.length - 1)) * 100;
          setDateRange([startPercent, endPercent]);
          return;
        }
        // 前日のデータが見つからない場合は最新の1日分を表示
        const lastIndex = allData.length - 1;
        const lastPercent = lastIndex > 0 ? ((lastIndex - 1) / (allData.length - 1)) * 100 : 0;
        setDateRange([lastPercent, 100]);
        return;
      case "1週間":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "1ヶ月":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "3ヶ月":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6ヶ月":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "1年":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "3年":
        startDate.setFullYear(endDate.getFullYear() - 3);
        break;
      case "5年":
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case "全期間":
        startDate = new Date(allData[0].Date);
        break;
      default:
        return;
    }
    
    // 開始日と終了日のインデックスを取得
    const startIndex = allData.findIndex(d => {
      const date = new Date(d.Date);
      return date >= startDate;
    });
    const endIndex = allData.length - 1;
    
    if (startIndex === -1) {
      // 開始日が見つからない場合は最初のデータを使用
      setDateRange([0, 100]);
      return;
    }
    
    // パーセンテージに変換
    const startPercent = (startIndex / (allData.length - 1)) * 100;
    const endPercent = 100;
    
    setDateRange([startPercent, endPercent]);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            株価チャート分析
          </h1>
          <p className="text-slate-400">
            リアルタイム株価データとテクニカル指標
          </p>
        </div>

        {/* コントロールパネル */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          <form
            onSubmit={e => { e.preventDefault(); fetchData(); }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-between"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <label className="text-sm font-semibold text-slate-300">
                銘柄選択:
              </label>
              <select 
                value={symbol} 
                onChange={e => setSymbol(e.target.value)}
                className="px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {STOCK_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  読み込み中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  更新
                </>
              )}
            </button>
          </form>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}


        {/* 統計情報カード */}
        {currentPrice && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-slate-400 mb-1">現在価格</div>
              <div className="text-2xl font-bold text-white">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-slate-400 mb-1">変動額</div>
              <div className={`text-2xl font-bold ${priceChange && priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {priceChange && priceChange >= 0 ? "+" : ""}${priceChange?.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="text-sm text-slate-400 mb-1">変動率</div>
              <div className={`text-2xl font-bold ${priceChangePercent && priceChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {priceChangePercent && priceChangePercent >= 0 ? "+" : ""}{priceChangePercent?.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* 期間選択 */}
        {allData.length > 0 && !loading && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              期間選択
            </h3>
            <div className="flex flex-wrap gap-2">
              {["1日", "1週間", "1ヶ月", "3ヶ月", "6ヶ月", "1年", "3年", "5年", "全期間"].map((period) => (
                <button
                  key={period}
                  onClick={() => setDateRangeByPeriod(period)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-blue-500 hover:text-white transition-all duration-200"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* チャート */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-400">データを読み込み中です...</p>
              </div>
            </div>
          ) : data.length > 0 ? (
            <div className="h-96">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-400">データがありません。銘柄を選択して更新してください。</p>
            </div>
          )}
        </div>

        {/* 予測結果 */}
        {data.length > 0 && !loading && (
          <div className="bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  AI予測分析
                </h3>
                {forecastCached && forecast && (
                  <p className="text-xs text-slate-400 mt-1">
                    ※ 本日の予測結果（キャッシュから表示）
                  </p>
                )}
              </div>
              <button
                onClick={fetchForecast}
                disabled={forecastLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {forecastLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    予測中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    予測を取得
                  </>
                )}
              </button>
            </div>
            {forecastLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-400 text-sm">予測を生成中...</p>
                </div>
              </div>
            ) : forecastError ? (
              <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-200 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {forecastError}
                </div>
              </div>
            ) : forecast ? (
              <div className="space-y-6">
                <div className="text-sm text-slate-400 mb-4">
                  予測日: {forecast.forecast_date}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 強気シナリオ */}
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-green-400">強気シナリオ</h4>
                      <span className="text-2xl font-bold text-green-400">{forecast.bullish_scenario.probability}%</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">条件: </span>
                        <span className="text-white">{forecast.bullish_scenario.condition}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">目標範囲: </span>
                        <span className="text-green-300 font-medium">{forecast.bullish_scenario.target_range}</span>
                      </div>
                    </div>
                  </div>

                  {/* 弱気シナリオ */}
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-red-400">弱気シナリオ</h4>
                      <span className="text-2xl font-bold text-red-400">{forecast.bearish_scenario.probability}%</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">条件: </span>
                        <span className="text-white">{forecast.bearish_scenario.condition}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">サポート範囲: </span>
                        <span className="text-red-300 font-medium">{forecast.bearish_scenario.support_range}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* コメント */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">考察</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{forecast.comment}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
