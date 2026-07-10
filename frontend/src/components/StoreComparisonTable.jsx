import formatCurrency from '../utils/formatCurrency';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export default function StoreComparisonTable({ stores }) {
  if (!stores || stores.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 overflow-hidden">
      <h2 className="text-2xl font-bold mb-4 text-slate-100 font-sans tracking-wide">
        Precios Actuales y Disponibilidad
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700/60 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <th className="py-4 px-4">Tienda</th>
              <th className="py-4 px-4">Precio Actual</th>
              <th className="py-4 px-4">Precio Normal</th>
              <th className="py-4 px-4 text-center">Descuento</th>
              <th className="py-4 px-4 text-center">Disponibilidad</th>
              <th className="py-4 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stores.map((store, index) => (
              <tr 
                key={store.storeId || index} 
                className="hover:bg-slate-800/30 transition-colors group"
              >
                <td className="py-4 px-4 font-semibold text-slate-200">
                  {store.storeName}
                </td>
                <td className="py-4 px-4 text-base font-bold text-indigo-400">
                  {formatCurrency(store.currentPrice)}
                </td>
                <td className="py-4 px-4 text-slate-400 text-sm line-through">
                  {formatCurrency(store.normalPrice)}
                </td>
                <td className="py-4 px-4 text-center">
                  {store.discount > 0 ? (
                    <span className="inline-block bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded text-xs font-bold">
                      -{store.discount}%
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">-</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center">
                    {store.available ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <CheckCircle size={14} />
                        <span>Disponible</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 text-sm font-semibold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                        <XCircle size={14} />
                        <span>Agotado</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <a
                    href={store.storeUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/25 px-3 py-1.5 rounded-lg transition-all group-hover:translate-x-0.5"
                  >
                    <span>Ir a tienda</span>
                    <ExternalLink size={12} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
