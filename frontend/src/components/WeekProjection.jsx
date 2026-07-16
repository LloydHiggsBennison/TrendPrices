import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import formatCurrency from '../utils/formatCurrency';
import formatDate from '../utils/formatDate';
import { CalendarClock, ShieldCheck, ShieldAlert, ShieldQuestion, PartyPopper } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function getConfidenceStyle(confidence) {
  if (confidence >= 70) return { icon: ShieldCheck, className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Alta confiabilidad' };
  if (confidence >= 40) return { icon: ShieldQuestion, className: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Confiabilidad moderada' };
  return { icon: ShieldAlert, className: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Confiabilidad baja (pocos datos)' };
}

export default function WeekProjection({ mathResults, externalFactors }) {
  const [selectedStore, setSelectedStore] = useState(mathResults?.[0]?.storeName || '');

  if (!mathResults || mathResults.length === 0) return null;

  const currentResult = mathResults.find(r => r.storeName === selectedStore) || mathResults[0];
  const week = currentResult.weekProjection || [];
  if (week.length === 0) return null;

  const confidence = currentResult.projectionConfidence ?? 0;
  const confidenceStyle = getConfidenceStyle(confidence);
  const ConfidenceIcon = confidenceStyle.icon;

  const chartData = {
    labels: [formatDate(new Date().toISOString().split('T')[0], true), ...week.map(d => formatDate(d.date, true))],
    datasets: [
      {
        label: `Proyección — ${currentResult.storeName}`,
        data: [currentResult.currentPrice, ...week.map(d => d.projectedPrice)],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderDash: [6, 4],
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: week.map(d => d.evento ? '#f59e0b' : '#a855f7'),
        pointHoverRadius: 6
      }
    ]
  };
  // El primer punto (hoy) no tiene evento asociado, lo dejamos con color base
  chartData.datasets[0].pointBackgroundColor.unshift('#6366f1');

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { family: 'Outfit', size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex - 1;
            const day = idx >= 0 ? week[idx] : null;
            let label = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(ctx.parsed.y);
            if (day?.evento) label += ` (${day.evento.nombre})`;
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => '$ ' + value.toLocaleString('es-CL')
        }
      }
    }
  };

  const dolar = externalFactors?.dolar;
  const ipc = externalFactors?.ipc;
  const events = externalFactors?.upcomingEvents || [];

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-wide">
            Proyección de Precio a 7 Días
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Regresión lineal + estacionalidad semanal + variables externas (dólar, IPC, eventos de retail)
          </p>
        </div>

        <div className="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-700/30">
          {mathResults.map(r => (
            <button
              key={r.storeName}
              onClick={() => setSelectedStore(r.storeName)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedStore === r.storeName
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.storeName}
            </button>
          ))}
        </div>
      </div>

      <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border mb-4 ${confidenceStyle.className}`}>
        <ConfidenceIcon size={14} />
        <span>{confidenceStyle.label} — {confidence}/100</span>
      </div>

      <div className="h-72 w-full relative mb-6">
        <Line data={chartData} options={options} />
      </div>

      {/* Desglose día por día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {week.map(d => (
          <div
            key={d.date}
            className={`p-3 rounded-xl border text-center ${
              d.evento
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-800/40 border-slate-700/20'
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{formatDate(d.date, true)}</p>
            <p className="text-sm font-bold text-slate-100 font-mono">{formatCurrency(d.projectedPrice)}</p>
            {d.evento && (
              <p className="text-[9px] text-amber-400 font-semibold mt-1 flex items-center justify-center gap-1">
                <PartyPopper size={10} /> {d.evento.nombre}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Variables externas usadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/20">
          <p className="text-xs uppercase font-bold text-indigo-400 mb-1">Dólar Observado (USD/CLP)</p>
          <p className="text-lg font-bold text-slate-100 font-mono">
            {dolar ? `$${dolar.valorActual.toLocaleString('es-CL')}` : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {dolar ? `Variación proyectada 7d: ${dolar.variacionPorcentual7d > 0 ? '+' : ''}${dolar.variacionPorcentual7d}%` : 'No disponible'}
          </p>
        </div>
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/20">
          <p className="text-xs uppercase font-bold text-pink-400 mb-1">IPC (Inflación)</p>
          <p className="text-lg font-bold text-slate-100 font-mono">
            {ipc ? `${ipc.valorMensual}% mensual` : '—'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {ipc ? `Acumulado 12 meses: ${ipc.acumulado12m}%` : 'No disponible'}
          </p>
        </div>
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/20">
          <p className="text-xs uppercase font-bold text-amber-400 mb-1 flex items-center gap-1">
            <CalendarClock size={12} /> Próximo Evento de Retail
          </p>
          {events.length > 0 ? (
            <>
              <p className="text-lg font-bold text-slate-100">{events[0].nombre}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                En {events[0].diasRestantes} día{events[0].diasRestantes === 1 ? '' : 's'} ({formatDate(events[0].fecha, true)}) · Impacto histórico: {Math.round(events[0].impactoPromedio * 100)}%
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Sin eventos relevantes en los próximos 7 días.</p>
          )}
        </div>
      </div>

      {externalFactors?.isFallback && (
        <p className="text-[11px] text-amber-400 mt-4">
          * No se pudo consultar el indicador económico en tiempo real (mindicador.cl); se usaron valores de respaldo conservadores, lo que reduce la confiabilidad de la proyección.
        </p>
      )}
    </div>
  );
}
