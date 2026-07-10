const {
  calculateActualPriceScore,
  calculateHistoricalMinScore,
  calculateTrendScore,
  calculateAverageScore,
  calculateProjectionScore
} = require('../utils/calculateScore');

/**
 * Calcula el puntaje de compra para una tienda específica basándose en su análisis.
 * @param {Object} storeAnalysis 
 * @param {boolean} isCheapestStore Si es la tienda con el precio más bajo de todas
 * @returns {number} Puntaje entre 0 y 100
 */
function calculateStoreScore(storeAnalysis, isCheapestStore = false) {
  const {
    currentPrice,
    minPrice,
    maxPrice,
    averagePrice,
    derivative,
    projectedPrice,
    available
  } = storeAnalysis;

  if (!available) {
    return 10; // Puntaje muy bajo si no está disponible
  }

  const precioActualScore = calculateActualPriceScore(currentPrice, minPrice, maxPrice);
  const precioHistoricoScore = calculateHistoricalMinScore(currentPrice, minPrice);
  const tendenciaScore = calculateTrendScore(derivative);
  const promedioScore = calculateAverageScore(currentPrice, averagePrice);
  const proyeccionScore = calculateProjectionScore(currentPrice, projectedPrice);
  const disponibilidadScore = 100; // Si llegó aquí, está disponible

  let score = (
    precioActualScore * 0.25 +
    precioHistoricoScore * 0.20 +
    tendenciaScore * 0.20 +
    promedioScore * 0.15 +
    proyeccionScore * 0.10 +
    disponibilidadScore * 0.10
  );

  // Regla especial: Si una tienda tiene el menor precio actual de todas, aumentar su puntaje
  if (isCheapestStore) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Genera la recomendación final comparando los análisis de todas las tiendas.
 * @param {Array} storesAnalysis Lista de análisis de cada tienda
 * @returns {Object} { decision, descripcion, puntaje_final, tienda_recomendada }
 */
function generateRecommendation(storesAnalysis) {
  if (!Array.isArray(storesAnalysis) || storesAnalysis.length === 0) {
    return {
      decision: 'Esperar',
      descripcion: 'No hay datos de tiendas para analizar.',
      puntaje_final: 0,
      tienda_recomendada: null
    };
  }

  // Encontrar el precio más bajo de todas las tiendas disponibles
  const availableStores = storesAnalysis.filter(s => s.available);
  const minPriceOfAll = availableStores.length > 0 
    ? Math.min(...availableStores.map(s => s.currentPrice))
    : Infinity;

  // Calcular puntajes para cada tienda e identificar la recomendada (mayor puntaje)
  const storesWithScores = storesAnalysis.map(store => {
    const isCheapest = store.available && store.currentPrice === minPriceOfAll;
    const score = calculateStoreScore(store, isCheapest);
    return {
      ...store,
      score
    };
  });

  // Ordenar por puntaje descendente
  storesWithScores.sort((a, b) => b.score - a.score);
  const recommendedStore = storesWithScores[0];

  // Determinar la decisión basándose en el análisis de la tienda recomendada
  let decision = 'Esperar';
  let descripcion = '';

  const {
    currentPrice,
    minPrice,
    averagePrice,
    derivative,
    projectedPrice,
    discount,
    storeName
  } = recommendedStore;

  // Reglas de recomendación estructuradas
  if (!recommendedStore.available) {
    decision = 'Esperar';
    descripcion = `El producto no está disponible en las tiendas analizadas en este momento. Recomendamos activar alertas en Knasta.`;
  } else if (currentPrice <= minPrice * 1.02) {
    // Si el precio actual está cerca del precio mínimo histórico (dentro del 2%)
    decision = 'Comprar ahora';
    descripcion = `¡Excelente oportunidad! El precio actual en ${storeName} ($${currentPrice.toLocaleString()}) está en su mínimo histórico registrado ($${minPrice.toLocaleString()}). Es el mejor momento para comprar.`;
  } else if (projectedPrice < currentPrice && derivative < 0) {
    // Si la derivada es negativa y el precio proyectado es menor
    decision = 'Esperar';
    descripcion = `El precio en ${storeName} está bajando a una tasa de $${Math.abs(derivative).toLocaleString()} por día. Te recomendamos esperar ya que la proyección indica un valor menor ($${projectedPrice.toLocaleString()}) para los próximos días.`;
  } else if (currentPrice < averagePrice) {
    // Si el precio actual está bajo el promedio histórico
    decision = 'Buena oportunidad';
    descripcion = `El precio actual en ${storeName} ($${currentPrice.toLocaleString()}) se encuentra por debajo del promedio histórico de la tienda ($${Math.round(averagePrice).toLocaleString()}). Cuenta con un descuento del ${discount}%.`;
  } else if (derivative > 0) {
    // Si la derivada es positiva (precio subiendo)
    decision = 'Precio en aumento';
    descripcion = `¡Cuidado! El precio en ${storeName} está subiendo. El valor actual es de $${currentPrice.toLocaleString()} y la tendencia diaria es alcista. Si necesitas el producto urgente, compra pronto antes de otra alza.`;
  } else if (projectedPrice > currentPrice) {
    // Si el precio proyectado es mayor que el actual
    decision = 'Comprar pronto';
    descripcion = `La recta tangente proyecta un incremento cercano en el precio de ${storeName} hacia los $${projectedPrice.toLocaleString()}. Sugerimos realizar la compra pronto para evitar el aumento.`;
  } else {
    // Default estable
    decision = 'Esperar';
    descripcion = `El precio actual en ${storeName} es de $${currentPrice.toLocaleString()}, el cual se mantiene estable. Dado que no hay descuentos significativos ni proyecciones de bajada, sugerimos esperar a una mejor oferta.`;
  }

  return {
    decision,
    descripcion,
    puntaje_final: recommendedStore.score,
    tienda_recomendada: {
      id: recommendedStore.storeId,
      nombre: storeName,
      precio: currentPrice
    },
    storesWithScores // Devolvemos también la lista completa con puntajes actualizados
  };
}

module.exports = {
  calculateStoreScore,
  generateRecommendation
};
