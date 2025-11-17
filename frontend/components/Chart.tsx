import React, { useEffect, useMemo, useRef } from "react";

type Row = {
  date: string;
  close: number | null;
  ma_5: number | null;
  ma_10: number | null;
  rsi: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
};

type Props = {
  rows: Row[];
  includeRsi?: boolean;
  isLight?: boolean;
  includeMa5?: boolean;
  includeMa10?: boolean;
  includeBb?: boolean;
};

const Chart: React.FC<Props> = ({ rows, includeRsi = false, isLight = false, includeMa5 = true, includeMa10 = true, includeBb = true }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => {
    const dates = rows.map((r) => r.date);
    const close = rows.map((r) => r.close);
    const ma5 = rows.map((r) => r.ma_5);
    const ma10 = rows.map((r) => r.ma_10);
    const rsi = rows.map((r) => r.rsi);
    const bbUpper = rows.map((r) => r.bb_upper);
    const bbLower = rows.map((r) => r.bb_lower);

    return { dates, close, ma5, ma10, rsi, bbUpper, bbLower };
  }, [rows]);

  useEffect(() => {
    const Plotly = (window as any).Plotly;
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
      } catch {}
      el.innerHTML = "";
      return;
    }

    try {
      const traces: any[] = [
        {
          x: data.dates,
          y: data.close,
          type: "scatter",
          mode: "lines",
          name: "Close",
          line: { color: "#1f77b4", width: 2 }
        }
      ];

      if (includeMa5) {
        traces.push({
          x: data.dates,
          y: data.ma5,
          type: "scatter",
          mode: "lines",
          name: "MA 5",
          line: { color: "#ff7f0e", width: 1.5 }
        });
      }
      if (includeMa10) {
        traces.push({
          x: data.dates,
          y: data.ma10,
          type: "scatter",
          mode: "lines",
          name: "MA 10",
          line: { color: "#2ca02c", width: 1.5 }
        });
      }
      if (includeBb) {
        traces.push({
          x: data.dates,
          y: data.bbUpper,
          type: "scatter",
          mode: "lines",
          name: "BB Upper",
          line: { color: "#9467bd", width: 1, dash: "dot" }
        });
        traces.push({
          x: data.dates,
          y: data.bbLower,
          type: "scatter",
          mode: "lines",
          name: "BB Lower",
          line: { color: "#8c564b", width: 1, dash: "dot" }
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
          line: { color: "#eab308", width: 1.5 }
        });
      }

      const layout: any = {
        title: "株価とテクニカル指標",
        margin: { t: 40, r: 20, b: 40, l: 40 },
        xaxis: {
          title: "Date",
          gridcolor: isLight ? "#e2e8f0" : "#1f2937",
          rangeselector: {
            bgcolor: isLight ? "#f1f5f9" : "#0b1020",
            activecolor: isLight ? "#0ea5e9" : "#22d3ee",
            bordercolor: isLight ? "#cbd5e1" : "#334155",
            font: { color: isLight ? "#0f172a" : "#e5e7eb" },
            buttons: [
              { step: "month", stepmode: "backward", count: 1, label: "1M" },
              { step: "month", stepmode: "backward", count: 3, label: "3M" },
              { step: "month", stepmode: "backward", count: 6, label: "6M" },
              { step: "year", stepmode: "backward", count: 1, label: "1Y" },
              { step: "all", label: "ALL" }
            ]
          },
          rangeslider: { visible: true }
        },
        yaxis: { title: "Price", gridcolor: isLight ? "#e2e8f0" : "#1f2937" },
        legend: { orientation: "h" },
        paper_bgcolor: isLight ? "#ffffff" : "#111827",
        plot_bgcolor: isLight ? "#ffffff" : "#111827",
        font: { color: isLight ? "#0f172a" : "#e5e7eb" },
        hovermode: "x unified"
      };
      if (includeRsi) {
        layout.yaxis2 = {
          title: "RSI",
          overlaying: "y",
          side: "right",
          range: [0, 100],
          gridcolor: isLight ? "#e2e8f0" : "#1f2937"
        };
      }

      // 要素がまだDOMに接続されているか確認
      if (!(el as any).isConnected) return;
      Plotly.react(el, traces, layout, { responsive: true });
    } catch (e) {
      // 例外が出てもUI全体が落ちないようにする
      // console.error(e);
      return;
    }

    const handle = () => {
      try {
        if (!el) return;
        if (!(el as any).isConnected) return;
        Plotly.Plots.resize(el);
      } catch {}
    };
    window.addEventListener("resize", handle, { passive: true });
    return () => {
      window.removeEventListener("resize", handle);
      try {
        if (el) Plotly.purge(el);
      } catch {}
    };
  }, [data, includeRsi, rows]);

  return <div ref={containerRef} style={{ width: "100%", height: 480 }} />;
};

export default Chart;

