import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Clock, 
  Info,
  PartyPopper
} from 'lucide-react';

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const { decision, descripcion, puntaje_final, tienda_recomendada } = recommendation;

  const getStyleConfig = (dec) => {
    switch (dec) {
      case 'Comprar ahora':
        return {
          title: 'COMPRAR AHORA',
          bgColor: 'bg-emerald-500/10 border-emerald-500/30',
          textColor: 'text-emerald-400',
          glowClass: 'glow-border-success',
          icon: <CheckCircle2 size={32} className="text-emerald-400 animate-pulse" />
        };
      case 'Buena oportunidad':
        return {
          title: 'BUENA OPORTUNIDAD',
          bgColor: 'bg-teal-500/10 border-teal-500/30',
          textColor: 'text-teal-400',
          glowClass: 'glow-border-success',
          icon: <CheckCircle2 size={32} className="text-teal-400" />
        };
      case 'Comprar pronto':
        return {
          title: 'COMPRAR PRONTO',
          bgColor: 'bg-amber-500/10 border-amber-500/30',
          textColor: 'text-amber-400',
          glowClass: 'glow-border-warning',
          icon: <Clock size={32} className="text-amber-400" />
        };
      case 'Precio en aumento':
        return {
          title: 'PRECIO EN AUMENTO',
          bgColor: 'bg-orange-500/10 border-orange-500/30',
          textColor: 'text-orange-400',
          glowClass: 'glow-border-warning',
          icon: <AlertTriangle size={32} className="text-orange-400" />
        };
      case 'Esperar evento':
        return {
          title: 'ESPERAR EVENTO DE RETAIL',
          bgColor: 'bg-fuchsia-500/10 border-fuchsia-500/30',
          textColor: 'text-fuchsia-400',
          glowClass: 'glow-border-warning',
          icon: <PartyPopper size={32} className="text-fuchsia-400" />
        };
      case 'Esperar':
      default:
        return {
          title: 'RECOMENDACIÓN: ESPERAR',
          bgColor: 'bg-indigo-500/10 border-indigo-500/30',
          textColor: 'text-indigo-400',
          glowClass: 'glow-border-danger',
          icon: <Clock size={32} className="text-indigo-400" />
        };
    }
  };

  const config = getStyleConfig(decision);

  return (
    <div className={`glass-card rounded-2xl p-6 mb-6 border ${config.bgColor} ${config.glowClass}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        
        {/* Lado izquierdo: Decisión e Icono */}
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/40">
            {config.icon}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Decisión de Compra
            </span>
            <h1 className={`text-3xl font-black tracking-wide ${config.textColor}`}>
              {config.title}
            </h1>
          </div>
        </div>

        {/* Lado derecho: Puntaje de Compra */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 text-center shrink-0 min-w-[150px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Índice de Compra
          </span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-indigo-400">{puntaje_final}</span>
            <span className="text-slate-500 font-semibold text-lg">/100</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800 flex items-start gap-3">
        <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 text-sm leading-relaxed">
          <p className="mb-2 font-medium">{descripcion}</p>
          {tienda_recomendada && (
            <p className="text-xs text-slate-400 font-medium">
              Tienda recomendada: <span className="text-indigo-300 font-bold">{tienda_recomendada.nombre}</span> con un precio de <span className="text-slate-200 font-bold">{tienda_recomendada.precio.toLocaleString('es-CL')} CLP</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
