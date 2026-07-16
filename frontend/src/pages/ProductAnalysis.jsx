import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductSummary from '../components/ProductSummary';
import StoreComparisonTable from '../components/StoreComparisonTable';
import PriceHistoryChart from '../components/PriceHistoryChart';
import MathResults from '../components/MathResults';
import WeekProjection from '../components/WeekProjection';
import MatrixTable from '../components/MatrixTable';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getAnalysis } from '../services/api';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function ProductAnalysis() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalysis(productId);
      setAnalysisData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo cargar el análisis para este producto.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Barra de Navegación */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </button>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/25 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estados de Carga y Error */}
      {isLoading && <LoadingSpinner message="Cargando Análisis Histórico..." />}
      
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={loadData} 
        />
      )}

      {/* Resultados del Análisis */}
      {!isLoading && analysisData && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <RecommendationCard recommendation={analysisData.recommendation} />
          
          <ProductSummary product={analysisData.product} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StoreComparisonTable stores={analysisData.stores} />
            <PriceHistoryChart priceHistory={analysisData.priceHistory} />
          </div>

          <MathResults mathResults={analysisData.mathResults} />

          <WeekProjection mathResults={analysisData.mathResults} externalFactors={analysisData.externalFactors} />
          
          <MatrixTable comparisonMatrix={analysisData.comparisonMatrix} />
        </div>
      )}
    </div>
  );
}
