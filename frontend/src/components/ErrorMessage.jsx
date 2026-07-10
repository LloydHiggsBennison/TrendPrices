import { AlertOctagon } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="glass-card border-rose-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto mb-6">
      <div className="inline-flex items-center justify-center p-3 bg-rose-500/10 text-rose-400 rounded-xl mb-4 border border-rose-500/20">
        <AlertOctagon size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2">Error de Análisis</h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        {message || 'No se pudo completar el análisis matemático del producto. Por favor, intente con otra consulta o intente más tarde.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-medium transition-colors text-sm"
        >
          Intentar nuevamente
        </button>
      )}
    </div>
  );
}
