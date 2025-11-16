module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
"[project]/components/Chart.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const Chart = ({ rows, includeRsi = false, isLight = false, includeMa5 = true, includeMa10 = true, includeBb = true })=>{
    const containerRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const data = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useMemo"])(()=>{
        const dates = rows.map((r)=>r.date);
        const close = rows.map((r)=>r.close);
        const ma5 = rows.map((r)=>r.ma_5);
        const ma10 = rows.map((r)=>r.ma_10);
        const rsi = rows.map((r)=>r.rsi);
        const bbUpper = rows.map((r)=>r.bb_upper);
        const bbLower = rows.map((r)=>r.bb_lower);
        return {
            dates,
            close,
            ma5,
            ma10,
            rsi,
            bbUpper,
            bbLower
        };
    }, [
        rows
    ]);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const Plotly = window.Plotly;
        const el = containerRef.current;
        if (!el) return;
        if (!Plotly) {
            // Plotlyが未ロードでもUIを落とさない
            return;
        }
        if (!rows || rows.length === 0) {
            // データが空なら明示的にクリア
            try {
                Plotly.purge(el);
            } catch  {}
            el.innerHTML = "";
            return;
        }
        try {
            const traces = [
                {
                    x: data.dates,
                    y: data.close,
                    type: "scatter",
                    mode: "lines",
                    name: "Close",
                    line: {
                        color: "#1f77b4",
                        width: 2
                    }
                }
            ];
            if (includeMa5) {
                traces.push({
                    x: data.dates,
                    y: data.ma5,
                    type: "scatter",
                    mode: "lines",
                    name: "MA 5",
                    line: {
                        color: "#ff7f0e",
                        width: 1.5
                    }
                });
            }
            if (includeMa10) {
                traces.push({
                    x: data.dates,
                    y: data.ma10,
                    type: "scatter",
                    mode: "lines",
                    name: "MA 10",
                    line: {
                        color: "#2ca02c",
                        width: 1.5
                    }
                });
            }
            if (includeBb) {
                traces.push({
                    x: data.dates,
                    y: data.bbUpper,
                    type: "scatter",
                    mode: "lines",
                    name: "BB Upper",
                    line: {
                        color: "#9467bd",
                        width: 1,
                        dash: "dot"
                    }
                });
                traces.push({
                    x: data.dates,
                    y: data.bbLower,
                    type: "scatter",
                    mode: "lines",
                    name: "BB Lower",
                    line: {
                        color: "#8c564b",
                        width: 1,
                        dash: "dot"
                    }
                });
            }
            if (includeRsi) {
                traces.push({
                    x: data.dates,
                    y: data.rsi,
                    type: "scatter",
                    mode: "lines",
                    name: "RSI",
                    yaxis: "y2",
                    line: {
                        color: "#eab308",
                        width: 1.5
                    }
                });
            }
            const layout = {
                title: "株価とテクニカル指標",
                margin: {
                    t: 40,
                    r: 20,
                    b: 40,
                    l: 40
                },
                xaxis: {
                    title: "Date",
                    gridcolor: isLight ? "#e2e8f0" : "#1f2937",
                    rangeselector: {
                        bgcolor: isLight ? "#f1f5f9" : "#0b1020",
                        activecolor: isLight ? "#0ea5e9" : "#22d3ee",
                        bordercolor: isLight ? "#cbd5e1" : "#334155",
                        font: {
                            color: isLight ? "#0f172a" : "#e5e7eb"
                        },
                        buttons: [
                            {
                                step: "month",
                                stepmode: "backward",
                                count: 1,
                                label: "1M"
                            },
                            {
                                step: "month",
                                stepmode: "backward",
                                count: 3,
                                label: "3M"
                            },
                            {
                                step: "month",
                                stepmode: "backward",
                                count: 6,
                                label: "6M"
                            },
                            {
                                step: "year",
                                stepmode: "backward",
                                count: 1,
                                label: "1Y"
                            },
                            {
                                step: "all",
                                label: "ALL"
                            }
                        ]
                    },
                    rangeslider: {
                        visible: true
                    }
                },
                yaxis: {
                    title: "Price",
                    gridcolor: isLight ? "#e2e8f0" : "#1f2937"
                },
                legend: {
                    orientation: "h"
                },
                paper_bgcolor: isLight ? "#ffffff" : "#111827",
                plot_bgcolor: isLight ? "#ffffff" : "#111827",
                font: {
                    color: isLight ? "#0f172a" : "#e5e7eb"
                },
                hovermode: "x unified"
            };
            if (includeRsi) {
                layout.yaxis2 = {
                    title: "RSI",
                    overlaying: "y",
                    side: "right",
                    range: [
                        0,
                        100
                    ],
                    gridcolor: isLight ? "#e2e8f0" : "#1f2937"
                };
            }
            // 要素がまだDOMに接続されているか確認
            // @ts-expect-error isConnected
            if (!el.isConnected) return;
            Plotly.react(el, traces, layout, {
                responsive: true
            });
        } catch (e) {
            // 例外が出てもUI全体が落ちないようにする
            // console.error(e);
            return;
        }
        const handle = ()=>{
            try {
                if (!el) return;
                // @ts-expect-error isConnected
                if (!el.isConnected) return;
                Plotly.Plots.resize(el);
            } catch  {}
        };
        window.addEventListener("resize", handle, {
            passive: true
        });
        return ()=>{
            window.removeEventListener("resize", handle);
            try {
                if (el) Plotly.purge(el);
            } catch  {}
        };
    }, [
        data,
        includeRsi,
        rows
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        ref: containerRef,
        style: {
            width: "100%",
            height: 480
        }
    }, void 0, false, {
        fileName: "[project]/components/Chart.tsx",
        lineNumber: 182,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Chart;
}),
"[externals]/react-chartjs-2 [external] (react-chartjs-2, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("react-chartjs-2");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/axios [external] (axios, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("axios");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/chart.js [external] (chart.js, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("chart.js");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/components/StockChart.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>StockChart
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$chartjs$2d$2__$5b$external$5d$__$28$react$2d$chartjs$2d$2$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/react-chartjs-2 [external] (react-chartjs-2, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/axios [external] (axios, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/chart.js [external] (chart.js, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$chartjs$2d$2__$5b$external$5d$__$28$react$2d$chartjs$2d$2$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$chartjs$2d$2__$5b$external$5d$__$28$react$2d$chartjs$2d$2$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["Chart"].register(__TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["CategoryScale"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["LinearScale"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["PointElement"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["LineElement"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["Title"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["Tooltip"], __TURBOPACK__imported__module__$5b$externals$5d2f$chart$2e$js__$5b$external$5d$__$28$chart$2e$js$2c$__esm_import$29$__["Legend"]);
// 銘柄選択
const STOCK_OPTIONS = [
    {
        label: "エヌビディア",
        value: "NVDA"
    },
    {
        label: "イオンキュー",
        value: "IONQ"
    },
    {
        label: "Tesla",
        value: "TSLA"
    }
];
function StockChart() {
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [symbol, setSymbol] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("NVDA");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const fetchData = async ()=>{
        setLoading(true);
        try {
            const response = await __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__["default"].post("http://127.0.0.1:8000/download_stock", {
                symbol
            });
            setData(response.data);
        } catch (error) {
            console.error(error);
            alert("データ取得に失敗しました");
        }
        setLoading(false);
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetchData();
    }, []);
    // Chart.js用データ整形
    const chartData = {
        labels: data.map((d)=>d.Date),
        datasets: [
            {
                label: "終値",
                data: data.map((d)=>d.Close),
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)"
            },
            {
                label: "SMA5",
                data: data.map((d)=>d.SMA5),
                borderColor: "orange",
                borderDash: [
                    5,
                    5
                ]
            },
            {
                label: "SMA25",
                data: data.map((d)=>d.SMA25),
                borderColor: "purple",
                borderDash: [
                    5,
                    5
                ]
            },
            {
                label: "EMA12",
                data: data.map((d)=>d.EMA12),
                borderColor: "green",
                borderDash: [
                    5,
                    2
                ]
            },
            {
                label: "EMA26",
                data: data.map((d)=>d.EMA26),
                borderColor: "red",
                borderDash: [
                    5,
                    2
                ]
            },
            {
                label: "BB上限",
                data: data.map((d)=>d.BB_UPPER),
                borderColor: "blue",
                borderDash: [
                    2,
                    2
                ]
            },
            {
                label: "BB下限",
                data: data.map((d)=>d.BB_LOWER),
                borderColor: "blue",
                borderDash: [
                    2,
                    2
                ]
            }
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: (e)=>{
                    e.preventDefault();
                    fetchData();
                },
                style: {
                    marginBottom: "20px"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "銘柄:",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                value: symbol,
                                onChange: (e)=>setSymbol(e.target.value),
                                children: STOCK_OPTIONS.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: opt.value,
                                        children: opt.label
                                    }, opt.value, false, {
                                        fileName: "[project]/components/StockChart.tsx",
                                        lineNumber: 124,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/StockChart.tsx",
                                lineNumber: 122,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/StockChart.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "submit",
                        style: {
                            marginLeft: "10px"
                        },
                        children: loading ? "読み込み中..." : "更新"
                    }, void 0, false, {
                        fileName: "[project]/components/StockChart.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/StockChart.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$chartjs$2d$2__$5b$external$5d$__$28$react$2d$chartjs$2d$2$2c$__esm_import$29$__["Line"], {
                data: chartData
            }, void 0, false, {
                fileName: "[project]/components/StockChart.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/StockChart.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Chart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Chart.tsx [ssr] (ecmascript)"); // 先ほどのPlotlyコンポーネント
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StockChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/StockChart.tsx [ssr] (ecmascript)"); // 先ほどのPlotlyコンポーネント
var __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/axios [external] (axios, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StockChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StockChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const STOCK_OPTIONS = [
    {
        label: "エヌビディア",
        value: "NVDA"
    },
    {
        label: "イオンキュー",
        value: "IONQ"
    },
    {
        label: "Tesla",
        value: "TSLA"
    }
];
const StockChartPlotly = ()=>{
    const [rows, setRows] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [symbol, setSymbol] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("NVDA");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const fetchData = async ()=>{
        setLoading(true);
        try {
            const res = await __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__["default"].post("http://127.0.0.1:8000/download_stock", {
                symbol
            });
            const data = res.data;
            // FastAPI のデータを Chartコンポーネント用に整形
            const formatted = data.map((d)=>({
                    date: d.Date,
                    close: d.Close ?? null,
                    ma_5: d.SMA5 ?? null,
                    ma_10: d.SMA25 ?? null,
                    rsi: d.RSI14 ?? null,
                    bb_upper: d.BB_UPPER ?? null,
                    bb_lower: d.BB_LOWER ?? null
                }));
            setRows(formatted);
        } catch (error) {
            console.error(error);
            alert("データ取得に失敗しました");
        }
        setLoading(false);
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetchData();
    }, [
        symbol
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: (e)=>{
                    e.preventDefault();
                    fetchData();
                },
                style: {
                    marginBottom: 20
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "銘柄:",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                value: symbol,
                                onChange: (e)=>setSymbol(e.target.value),
                                children: STOCK_OPTIONS.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: opt.value,
                                        children: opt.label
                                    }, opt.value, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 69,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 67,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "submit",
                        style: {
                            marginLeft: 10
                        },
                        children: loading ? "読み込み中..." : "更新"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$StockChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                rows: rows,
                includeRsi: true,
                includeMa5: true,
                includeMa10: true,
                includeBb: true,
                isLight: true
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = StockChartPlotly;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__cbfc1cf1._.js.map