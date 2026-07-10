import { Line } from 'react-chartjs-2';
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
} from 'chart.js';
import formatDate from '../utils/formatDate';

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

export default function PriceHistoryChart({ priceHistory }) {
  if (!priceHistory || priceHistory.length === 0) return null;

  // Organizar datos por tienda y fecha
  const historyByStore = {};
  const allDatesSet = new Set();

  priceHistory.forEach(item => {
    const storeName = item.tiendas?.nombre || 'Tienda';
    if (!historyByStore[storeName]) {
      historyByStore[storeName] = [];
    }
    historyByStore[storeName].push({
      date: item.fecha_registro,
      price: item.precio_actual
    });
    allDatesSet.add(item.fecha_registro);
  });

  // Ordenar todas las fechas cronológicamente
  const sortedDates = [...allDatesSet].sort((a, b) => new Date(a) - new Date(b));

  // Generar datasets para cada tienda
  const storeColors = [
    { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)' }, // Indigo
    { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.05)' }, // Purple
    { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.05)' }, // Pink
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.05)' }, // Emerald
  ];

  const datasets = Object.keys(historyByStore).map((storeName, index) => {
    const color = storeColors[index % storeColors.length];
    
    // Mapear cada fecha al precio correspondiente (o null si no hay datos ese día)
    const data = sortedDates.map(dateStr => {
      const record = historyByStore[storeName].find(r => r.date === dateStr);
      return record ? record.price : null;
    });

    return {
      label: storeName,
      data,
      borderColor: color.border,
      backgroundColor: color.bg,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
      spanGaps: true // Permite unir puntos si faltan días
    };
  });

  const chartData = {
    labels: sortedDates.map(d => formatDate(d, true)),
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: {
            family: 'Outfit',
            size: 13,
            weight: '500'
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        titleFont: {
          family: 'Outfit',
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter'
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 11
          },
          maxTicksLimit: 12
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 11
          },
          callback: function (value) {
            return '$ ' + value.toLocaleString('es-CL');
          }
        }
      }
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-slate-100 font-sans tracking-wide">
        Evolución Histórica de Precios
      </h2>
      <div className="h-80 w-full relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
