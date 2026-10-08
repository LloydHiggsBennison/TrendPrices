import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import formatDate from "../utils/formatDate";
import formatCurrency from "../utils/formatCurrency";
import { buildHistoryDatasets } from "../utils/historyChartData";
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);
export default function PriceHistoryChart({ priceHistory, mathResults }) {
  const [showRegression, setShowRegression] = useState(true);
  const datasets = buildHistoryDatasets(
    priceHistory,
    mathResults,
    showRegression,
  );
  if (!datasets.length)
    return (
      <p className="text-slate-400">Sin historial válido para graficar.</p>
    );
  const dateLabel = (value) =>
    formatDate(new Date(Number(value)).toISOString().slice(0, 10), true);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#cbd5e1", font: { size: 11 }, boxWidth: 18 },
      },
      tooltip: {
        callbacks: {
          title: (items) => dateLabel(items[0].parsed.x),
          label: (ctx) =>
            `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: Math.min(...datasets.flatMap((d) => d.data.map((p) => p.x))),
        max: Math.max(...datasets.flatMap((d) => d.data.map((p) => p.x))),
        title: {
          display: true,
          text: "Fecha (intervalos reales en días)",
          color: "#94a3b8",
        },
        grid: { color: "rgba(255,255,255,0.03)" },
        ticks: { color: "#94a3b8", maxTicksLimit: 6, callback: dateLabel },
      },
      y: {
        title: { display: true, text: "Precio en CLP", color: "#94a3b8" },
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8", callback: formatCurrency },
      },
    },
  };
  return (
    <section className="glass-card rounded-2xl p-4 sm:p-6 min-w-0">
      <h2 className="text-2xl font-bold mb-3 text-slate-100">
        Historial y Regresión Lineal
      </h2>
      <label className="flex gap-2 items-center text-sm text-slate-300 mb-3">
        <input
          type="checkbox"
          checked={showRegression}
          onChange={(e) => setShowRegression(e.target.checked)}
        />{" "}
        Mostrar regresión lineal
      </label>
      <div className="h-80 w-full relative">
        <Line
          data={{ datasets }}
          options={options}
          role="img"
          aria-label="Gráfico de precios observados y rectas de regresión por tienda"
        />
      </div>
      <p className="text-xs text-slate-400 mt-3">
        Línea continua: observaciones. Línea discontinua: ajuste por mínimos
        cuadrados. No se agregan precios para fechas sin datos.
      </p>
    </section>
  );
}
