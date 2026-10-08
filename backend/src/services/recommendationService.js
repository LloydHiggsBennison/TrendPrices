const {
  calculateActualPriceScore,
  calculateHistoricalMinScore,
  calculateTrendScore,
  calculateAverageScore,
  calculateProjectionScore,
} = require("../utils/calculateScore");

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
    available,
  } = storeAnalysis;

  if (!available || !Number.isFinite(currentPrice) || currentPrice <= 0) {
    return 10; // Puntaje muy bajo si no está disponible
  }

  const precioActualScore = calculateActualPriceScore(
    currentPrice,
    minPrice,
    maxPrice,
  );
  const precioHistoricoScore = calculateHistoricalMinScore(
    currentPrice,
    minPrice,
  );
  const tendenciaScore =
    derivative == null ? 50 : calculateTrendScore(derivative);
  const promedioScore = calculateAverageScore(currentPrice, averagePrice);
  const proyeccionScore =
    projectedPrice == null
      ? 50
      : calculateProjectionScore(currentPrice, projectedPrice);
  const disponibilidadScore = 100; // Si llegó aquí, está disponible

  let score =
    precioActualScore * 0.25 +
    precioHistoricoScore * 0.2 +
    tendenciaScore * 0.2 +
    promedioScore * 0.15 +
    proyeccionScore * 0.1 +
    disponibilidadScore * 0.1;

  // Regla especial: Si una tienda tiene el menor precio actual de todas, aumentar su puntaje
  if (isCheapestStore) {
    score += 10;
  }

  return storeAnalysis.insufficientHistory || storeAnalysis.stale
    ? Math.min(50, Math.round(score))
    : Math.min(100, Math.round(score));
}

/**
 * Genera la recomendación final comparando los análisis de todas las tiendas.
 * @param {Array} storesAnalysis Lista de análisis de cada tienda
 * @param {Array} upcomingEvents Eventos de retail (CyberDay, Black Friday, etc.) dentro de los próximos 7 días
 * @returns {Object} { decision, descripcion, puntaje_final, tienda_recomendada }
 */
function generateRecommendation(storesAnalysis) {
  if (!Array.isArray(storesAnalysis) || storesAnalysis.length === 0) {
    return {
      decision: "Esperar",
      descripcion: "No hay datos de tiendas para analizar.",
      puntaje_final: 0,
      tienda_recomendada: null,
      storesWithScores: [],
    };
  }

  // Encontrar el precio más bajo de todas las tiendas disponibles
  const availableStores = storesAnalysis.filter((s) => s.available);
  const minPriceOfAll =
    availableStores.length > 0
      ? Math.min(...availableStores.map((s) => s.currentPrice))
      : Infinity;

  // Calcular puntajes para cada tienda e identificar la recomendada (mayor puntaje)
  const storesWithScores = storesAnalysis.map((store) => {
    const isCheapest = store.available && store.currentPrice === minPriceOfAll;
    const score = calculateStoreScore(store, isCheapest);
    return {
      ...store,
      score,
    };
  });

  // Ordenar por puntaje descendente
  storesWithScores.sort((a, b) => b.score - a.score);
  const recommendedStore =
    storesWithScores.find((s) => s.available && !s.stale) ||
    storesWithScores[0];

  // Determinar la decisión basándose en el análisis de la tienda recomendada
  let decision = "Esperar";
  let descripcion = "";

  const { currentPrice, minPrice, averagePrice, storeName, weekProjection } =
    recommendedStore;

  const minimumProjected =
    Array.isArray(weekProjection) && weekProjection.length
      ? Math.min(...weekProjection.map((d) => d.projectedPrice))
      : null;
  const usableForecast =
    minimumProjected != null &&
    recommendedStore.projectionConfidence >= 50 &&
    recommendedStore.regression?.rSquared >= 0.5;
  if (!recommendedStore.available) {
    descripcion =
      "No hay publicaciones disponibles en las tiendas analizadas. Consulta la disponibilidad en Knasta.";
  } else if (recommendedStore.stale) {
    decision = "Datos desactualizados";
    descripcion = `El último precio observado es del ${recommendedStore.currentDate}. Consulta la tienda antes de decidir; la proyección parte de esa fecha.`;
  } else if (recommendedStore.insufficientHistory) {
    decision = "Datos insuficientes";
    descripcion =
      "El precio observado se muestra como referencia. Se requieren al menos tres fechas válidas y siete días de historial para proyectar o recomendar una compra.";
  } else if (usableForecast && minimumProjected < currentPrice * 0.98) {
    decision = "Esperar";
    descripcion = `El ajuste histórico estima un precio de hasta $${minimumProjected.toLocaleString("es-CL")} en los próximos siete días desde la última observación. Podría convenir esperar, aunque la extrapolación no garantiza esa bajada.`;
  } else if (currentPrice <= minPrice * 1.02) {
    decision = "Comprar ahora";
    descripcion = `El precio publicado en ${storeName} ($${currentPrice.toLocaleString("es-CL")}) está cerca del mínimo del período observado ($${minPrice.toLocaleString("es-CL")}). Es una oportunidad según este historial; verifica las condiciones en la tienda.`;
  } else if (currentPrice < averagePrice) {
    decision = "Buena oportunidad";
    descripcion = `El precio publicado en ${storeName} ($${currentPrice.toLocaleString("es-CL")}) está bajo el promedio ponderado del período observado ($${Math.round(averagePrice).toLocaleString("es-CL")}). La comparación no garantiza precios futuros.`;
  } else if (usableForecast && minimumProjected > currentPrice * 1.02) {
    decision = "Comprar pronto";
    descripcion = `La regresión estima precios mayores al actual durante los próximos siete días desde la última observación. Si necesitas el producto, considera el precio publicado; la predicción puede fallar.`;
  } else {
    decision = "Sin señal clara";
    descripcion = `El precio publicado en ${storeName} es $${currentPrice.toLocaleString("es-CL")}. Los indicadores no ofrecen una señal suficiente para recomendar comprar o esperar. Revisa el historial, el R² y las condiciones de la tienda.`;
  }

  return {
    decision,
    descripcion,
    puntaje_final: recommendedStore.score,
    tienda_recomendada: {
      id: recommendedStore.storeId,
      nombre: storeName,
      precio: currentPrice,
    },
    storesWithScores, // Devolvemos también la lista completa con puntajes actualizados
  };
}

module.exports = {
  calculateStoreScore,
  generateRecommendation,
};
