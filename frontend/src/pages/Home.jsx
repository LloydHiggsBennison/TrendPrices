import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import ProductSummary from '../components/ProductSummary';
import StoreComparisonTable from '../components/StoreComparisonTable';
import PriceHistoryChart from '../components/PriceHistoryChart';
import MathResults from '../components/MathResults';
import MatrixTable from '../components/MatrixTable';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { runAnalysis } from '../services/api';
import { LineChart, Shield, Calculator, Cpu } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    try {
      const data = await runAnalysis(query);
      setAnalysisData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo completar el análisis en este momento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header / Hero */}
      <header className="text-center mb-12 animate-float">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Cpu size={12} />
          <span>Inteligencia y Cálculo de Precios</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 font-sans bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-purple-200">
          TrendPrices
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Análisis matemático de tendencias de precios basado en <span className="text-indigo-400 font-semibold">Knasta.cl</span>
        </p>
      </header>

      {/* Input de Búsqueda */}
      <div className="mb-16">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        <div className="text-center mt-3 text-xs text-slate-500 flex items-center justify-center gap-1">
          <Shield size={12} />
          <span>Extracción responsable de datos desde Knasta.cl</span>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {/* Resultados del Análisis */}
      {analysisData && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <RecommendationCard recommendation={analysisData.recommendation} />
          
          <ProductSummary product={analysisData.product} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StoreComparisonTable stores={analysisData.stores} />
            <PriceHistoryChart priceHistory={analysisData.priceHistory} />
          </div>

          <MathResults mathResults={analysisData.mathResults} />
          
          <MatrixTable comparisonMatrix={analysisData.comparisonMatrix} />

          <div className="text-center pt-8 border-t border-slate-800">
            <button
              onClick={() => navigate(`/analysis/${analysisData.product.id}`)}
              className="px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl font-bold transition-all text-sm"
            >
              Ver Enlace Permanente de Análisis
            </button>
          </div>
        </div>
      )}

      {/* Landing informativo si no hay análisis */}
      {!isLoading && !analysisData && !error && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-800/60">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-4">
              <Calculator size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Modelado P(t)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Representamos el precio histórico de los retailers como funciones de tiempo continuas estimadas mediante regresión por mínimos cuadrados.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 text-purple-400 rounded-xl mb-4">
              <LineChart size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Tasa de Variación (Derivadas)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Calculamos derivadas discretas instantáneas \(P'(t)\) para detectar si el precio está subiendo, bajando o estabilizándose.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-pink-500/10 text-pink-400 rounded-xl mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">Límites y Recta Tangente</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Linealizamos el precio en el instante actual usando rectas tangentes para predecir el comportamiento y definir el límite de soporte óptimo.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
