import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductAnalysis from './pages/ProductAnalysis';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col justify-between">
        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis/:productId" element={<ProductAnalysis />} />
          </Routes>
        </main>
        
        {/* Premium footer */}
        <footer className="py-8 border-t border-slate-800/40 text-center text-xs text-slate-500">
          <div className="container mx-auto px-4">
            <p className="mb-2 font-medium">PriceTrend &copy; {new Date().getFullYear()} - Sistema de Análisis Matemático de Tendencias de Precios</p>
            <p>Utiliza herramientas avanzadas de cálculo diferencial e integral para modelar tendencias de Knasta.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
