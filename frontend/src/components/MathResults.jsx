import { useState } from 'react';
import formatCurrency from '../utils/formatCurrency';
import formatDate from '../utils/formatDate';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Sigma, 
  Activity, 
  Compass, 
  Anchor 
} from 'lucide-react';

export default function MathResults({ mathResults }) {
  const [selectedStore, setSelectedStore] = useState(mathResults?.[0]?.storeName || '');

  if (!mathResults || mathResults.length === 0) return null;

  const currentResult = mathResults.find(r => r.storeName === selectedStore) || mathResults[0];

  const getDerivativeIcon = (val) => {
    if (val < 0) return <TrendingDown className="text-emerald-400" size={24} />;
    if (val > 0) return <TrendingUp className="text-rose-400" size={24} />;
    return <Minus className="text-amber-400" size={24} />;
  };

  const getDerivativeClass = (val) => {
    if (val < 0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val > 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-wide">
          Análisis Matemático Aplicado
        </h2>
        
        {/* Selector de Tienda */}
        <div className="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-700/30">
          {mathResults.map(r => (
            <button
              key={r.storeName}
              onClick={() => setSelectedStore(r.storeName)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                selectedStore === r.storeName
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.storeName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 0. Precio Actual */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                Valor de Mercado
              </span>
              <Compass size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Precio Actual</h3>
            <div className="bg-slate-900/60 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl text-slate-100 border border-slate-700/40 mb-3">
              {formatCurrency(currentResult.currentPrice)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Es el último precio registrado para {currentResult.storeName}. Sirve como valor base de mercado para el análisis.
            </p>
          </div>
        </div>

        {/* 1. Función de Precio */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                Modelo de Regresión
              </span>
              <Compass size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Función de Precio Estimar</h3>
            <div className="bg-slate-900/60 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl text-indigo-300 border border-slate-700/40 mb-3">
              {currentResult.linearFunction}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modela el precio P(t) como función del tiempo en días. Representa la tendencia lineal promedio de los datos de Knasta.
            </p>
          </div>
        </div>

        {/* 2. Derivada Aproximada */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 bg-slate-700/30 px-2.5 py-1 rounded-md">
                Cálculo Diferencial
              </span>
              <Activity size={20} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Derivada Aproximada</h3>
            <div className={`flex items-center justify-center gap-3 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl border mb-3 ${getDerivativeClass(currentResult.derivative)}`}>
              {getDerivativeIcon(currentResult.derivative)}
              <span>
                {currentResult.derivative > 0 ? '+' : ''}
                {currentResult.derivative.toLocaleString('es-CL')} CLP/día
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mide la tasa de variación instantánea del precio: P'(t) ≈ ΔP / Δt. Negativa indica que el precio está disminuyendo.
            </p>
            {currentResult.derivativeStartDate && currentResult.derivativeEndDate && (
              <p className="text-[10px] text-slate-400 font-mono mt-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center">
                Calculado desde: <span className="text-indigo-300 font-bold">{formatDate(currentResult.derivativeStartDate)}</span> hasta <span className="text-indigo-300 font-bold">{formatDate(currentResult.derivativeEndDate)}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Integral / Promedio */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md">
                Cálculo Integral
              </span>
              <Sigma size={20} className="text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Precio Promedio</h3>
            <div className="bg-slate-900/60 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl text-pink-300 border border-slate-700/40 mb-3">
              {formatCurrency(currentResult.averagePrice)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculado como aproximación discreta de la integral definida: P_prom = 1/(b-a) ∫ P(t) dt. Sirve como base neutra de comparación.
            </p>
          </div>
        </div>

        {/* 4. Límite al Infinito */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                Análisis de Límites
              </span>
              <Anchor size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Límite al Infinito (L)</h3>
            <div className="bg-slate-900/60 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl text-emerald-300 border border-slate-700/40 mb-3">
              {formatCurrency(currentResult.limitEstimated)}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modelo de estabilización asintótica: lim (t → ∞) P(t) = L. Indica el precio mínimo histórico (el valor máximo soporte de mercado).
            </p>
          </div>
        </div>

        {/* 5. Proyección */}
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/20 flex flex-col justify-between md:col-span-2 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">
                Proyección Futura
              </span>
              <Sigma size={20} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Proyección a 7 Días (Regresión + Estacionalidad)</h3>
            <div className="bg-slate-900/60 font-mono text-center text-xl font-bold py-3 px-4 rounded-xl text-purple-300 border border-slate-700/40 mb-3">
              Mañana: {formatCurrency(currentResult.projectedPrice)}
              {currentResult.projectionConfidence != null && (
                <span className="block text-xs text-slate-400 font-sans font-normal mt-1">
                  Confiabilidad del modelo: {currentResult.projectionConfidence}/100
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combina la tendencia lineal, el patrón estacional por día de la semana y variables externas (dólar, IPC, eventos de retail). Ver el detalle completo de los 7 días más abajo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
