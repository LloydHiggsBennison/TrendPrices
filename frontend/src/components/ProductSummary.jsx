import { Tag, Bookmark, Layers, HardDrive } from 'lucide-react';

export default function ProductSummary({ product }) {
  if (!product) return null;

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-slate-100 font-sans tracking-wide">
        Resumen del Producto
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Bookmark size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Producto</p>
            <p className="text-base font-semibold text-slate-200 line-clamp-1" title={product.nombre}>
              {product.nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Marca</p>
            <p className="text-base font-semibold text-slate-200">
              {product.marca || 'Genérica'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
          <div className="p-3 bg-pink-500/10 text-pink-400 rounded-lg">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Categoría</p>
            <p className="text-base font-semibold text-slate-200">
              {product.categoria || 'Otros'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Fuente Principal</p>
            <p className="text-base font-semibold text-slate-200">
              Knasta.cl
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
