import formatCurrency from '../utils/formatCurrency';
import { Award } from 'lucide-react';

export default function MatrixTable({ comparisonMatrix }) {
  if (!comparisonMatrix || comparisonMatrix.length === 0) return null;

  // Encontrar el puntaje máximo para destacar
  const scores = comparisonMatrix.map(row => row[10] || 0);
  const maxScore = Math.max(...scores);

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 overflow-hidden">
      <h2 className="text-2xl font-bold mb-4 text-slate-100 font-sans tracking-wide">
        Matriz Comparativa de Indicadores Matemáticos
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-700/60 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-3">Tienda</th>
              <th className="py-3 px-3 text-right">Precio Act.</th>
              <th className="py-3 px-3 text-right">Mín. Hist.</th>
              <th className="py-3 px-3 text-right">Máx. Hist.</th>
              <th className="py-3 px-3 text-center">Desc.</th>
              <th className="py-3 px-3 text-center">Disp.</th>
              <th className="py-3 px-3 text-right">Derivada</th>
              <th className="py-3 px-3 text-right">Promedio</th>
              <th className="py-3 px-3 text-right">Lím. (L)</th>
              <th className="py-3 px-3 text-right">Proyección</th>
              <th className="py-3 px-3 text-center text-indigo-400 font-extrabold bg-indigo-500/5">Puntaje Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {comparisonMatrix.map((row, index) => {
              const [
                storeName,
                currentPrice,
                minPrice,
                maxPrice,
                discount,
                available,
                derivative,
                averagePrice,
                limitEstimated,
                projectedPrice,
                score
              ] = row;

              const isBest = score === maxScore && maxScore > 0;

              return (
                <tr 
                  key={index} 
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isBest ? 'bg-indigo-500/5 font-semibold text-indigo-200' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3.5 px-3 font-semibold flex items-center gap-1.5">
                    {isBest && <Award size={14} className="text-yellow-400" />}
                    <span>{storeName}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-100 font-bold">
                    {formatCurrency(currentPrice)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-400">
                    {formatCurrency(minPrice)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-400">
                    {formatCurrency(maxPrice)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {discount > 0 ? `${discount}%` : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      available ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} title={available ? 'Disponible' : 'Agotado'} />
                  </td>
                  <td className={`py-3.5 px-3 text-right font-mono ${
                    derivative < 0 ? 'text-emerald-400' : (derivative > 0 ? 'text-rose-400' : 'text-amber-400')
                  }`}>
                    {derivative > 0 ? '+' : ''}{derivative}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                    {formatCurrency(averagePrice)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-400 font-mono">
                    {formatCurrency(limitEstimated)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-200 font-mono font-bold">
                    {formatCurrency(projectedPrice)}
                  </td>
                  <td className={`py-3.5 px-3 text-center font-bold text-sm bg-indigo-500/5 ${
                    isBest ? 'text-indigo-300 font-black' : 'text-slate-400'
                  }`}>
                    {score}/100
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
