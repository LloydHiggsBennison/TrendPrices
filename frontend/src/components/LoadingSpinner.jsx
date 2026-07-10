import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message }) {
  const steps = [
    'Conectando de forma segura con Knasta.cl...',
    'Obteniendo historial de precios de los retailers...',
    'Estructurando datos y almacenando en Supabase...',
    'Modelando el precio del producto como función del tiempo P(t)...',
    'Calculando derivadas aproximadas y variaciones diarias...',
    'Calculando aproximación discreta de la integral definida para el precio promedio...',
    'Calculando límite al infinito de estabilización de precios...',
    'Proyectando precio futuro cercano usando recta tangente...',
    'Construyendo la matriz comparativa final...'
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto text-center">
      <div className="relative flex items-center justify-center mb-8">
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
        <div className="absolute w-20 h-20 border border-purple-500/30 rounded-full border-dashed animate-spin [animation-duration:10s]" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-200 mb-2">
        {message || 'Analizando Producto'}
      </h3>
      
      <div className="h-10">
        <p className="text-sm text-indigo-400 font-mono transition-all duration-500">
          {steps[currentStep]}
        </p>
      </div>

      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden border border-slate-700/30 mt-6 max-w-xs">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full animate-[shimmer_1.5s_infinite] w-full" style={{
          animationDuration: '2s'
        }} />
      </div>
    </div>
  );
}
