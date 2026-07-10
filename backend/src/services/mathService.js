const normalizeDate = require('../utils/normalizeDate');

/**
 * Convierte el historial de precios ordenado cronológicamente a un formato de puntos numéricos (t, P)
 * donde t representa los días desde el inicio de la serie (t = 0 para la fecha más antigua).
 * @param {Array} history 
 * @returns {Array<{t: number, p: number, date: string}>}
 */
function getTimelinePoints(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  
  // Clonar y ordenar por fecha ascendente (de más vieja a más nueva)
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const baseDate = new Date(sorted[0].date);
  
  return sorted.map(item => {
    const itemDate = new Date(item.date);
    const diffTime = Math.abs(itemDate - baseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir a días
    return {
      t: diffDays,
      p: item.price,
      date: item.date
    };
  });
}

/**
 * Estima una función lineal P(t) = mt + b usando regresión lineal por mínimos cuadrados.
 * @param {Array} priceHistory 
 * @returns {Object} { m, b, functionText }
 */
function estimateLinearFunction(priceHistory) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  const points = getTimelinePoints(cleanHistory);
  const n = points.length;
  
  if (n < 2) {
    return {
      m: 0,
      b: cleanHistory[0]?.price || 0,
      functionText: `P(t) = 0.00t + ${cleanHistory[0]?.price || 0}`
    };
  }

  let sumT = 0;
  let sumP = 0;
  let sumTP = 0;
  let sumT2 = 0;

  for (let i = 0; i < n; i++) {
    const { t, p } = points[i];
    sumT += t;
    sumP += p;
    sumTP += t * p;
    sumT2 += t * t;
  }

  const denominator = (n * sumT2 - sumT * sumT);
  let m = 0;
  let b = 0;

  if (denominator !== 0) {
    m = (n * sumTP - sumT * sumP) / denominator;
    b = (sumP - m * sumT) / n;
  } else {
    // Evitar división por cero, b es el promedio
    b = sumP / n;
  }

  return {
    m: parseFloat(m.toFixed(2)),
    b: parseFloat(b.toFixed(2)),
    functionText: `P(t) = ${m >= 0 ? '' : '-'}${Math.abs(m).toFixed(2)}t + ${b.toFixed(0)}`
  };
}

function getDerivativeDetails(priceHistory) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  const points = getTimelinePoints(cleanHistory);
  const n = points.length;

  if (n < 2) {
    return { value: 0, startDate: '', endDate: '' };
  }

  // Tomar el último punto y el punto de hace 10 registros (o el primero si hay menos de 10)
  // Esto calcula la tasa de variación promedio de los últimos 10 días registrados, dando consistencia
  const latestIndex = n - 1;
  const prevIndex = Math.max(0, n - 10);
  
  const pLatest = points[latestIndex];
  const pPrev = points[prevIndex];

  const dt = pLatest.t - pPrev.t;
  if (dt === 0) {
    return { value: 0, startDate: pPrev.date, endDate: pLatest.date };
  }

  const dp = pLatest.p - pPrev.p;
  const derivative = dp / dt;
  
  return {
    value: parseFloat(derivative.toFixed(2)),
    startDate: pPrev.date,
    endDate: pLatest.date
  };
}

function calculateApproxDerivative(priceHistory) {
  return getDerivativeDetails(priceHistory).value;
}

/**
 * Calcula el precio promedio de la serie de tiempo.
 * P_prom = (P1 + P2 + ... + Pn) / n
 * @param {Array} priceHistory 
 * @returns {number}
 */
function calculateAveragePrice(priceHistory) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  if (cleanHistory.length === 0) return 0;
  
  const sum = cleanHistory.reduce((acc, curr) => acc + curr.price, 0);
  const avg = sum / cleanHistory.length;
  
  return parseFloat(avg.toFixed(2));
}

/**
 * Estima el límite al infinito usando P(t) = L + k/(t+1).
 * lim t->inf P(t) = L.
 * En términos prácticos, L representa el precio mínimo histórico (soporte)
 * o una estimación asintótica según la tendencia observada.
 * @param {Array} priceHistory 
 * @returns {number} Límite estimado L
 */
function calculateEstimatedLimit(priceHistory) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  if (cleanHistory.length === 0) return 0;
  
  // Límite práctico: el precio mínimo histórico
  const minPrice = Math.min(...cleanHistory.map(h => h.price));
  return minPrice;
}

/**
 * Utiliza la recta tangente en el último punto registrado para proyectar el precio.
 * T(t) = P(a) + P'(a)(t - a)
 * @param {Array} priceHistory 
 * @param {number} daysAhead 
 * @returns {number} precio proyectado
 */
function calculateTangentProjection(priceHistory, daysAhead = 1) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  if (cleanHistory.length === 0) return 0;
  
  // Ordenar para obtener el último
  const sorted = [...cleanHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestPrice = sorted[sorted.length - 1].price;
  
  const approxDerivative = calculateApproxDerivative(cleanHistory);
  
  // T(t) = P(a) + P'(a) * dt
  const projection = latestPrice + approxDerivative * daysAhead;
  
  // El precio no puede ser menor a cero
  return Math.max(0, Math.round(projection));
}

/**
 * Construye la matriz comparativa entre tiendas.
 * @param {Array} storesAnalysis Lista de análisis de cada tienda
 * @returns {Array} Matriz comparativa
 */
function buildComparisonMatrix(storesAnalysis) {
  return storesAnalysis.map(sa => [
    sa.storeName,
    sa.currentPrice,
    sa.minPrice,
    sa.maxPrice,
    sa.discount,
    sa.available,
    sa.derivative,
    sa.averagePrice,
    sa.limitEstimated,
    sa.projectedPrice,
    sa.score
  ]);
}

module.exports = {
  estimateLinearFunction,
  calculateApproxDerivative,
  getDerivativeDetails,
  calculateAveragePrice,
  calculateEstimatedLimit,
  calculateTangentProjection,
  buildComparisonMatrix
};
