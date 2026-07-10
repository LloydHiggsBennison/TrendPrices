/**
 * Calcula sub-puntajes normalizados entre 0 y 100 para los diferentes factores de decisión.
 */

function calculateActualPriceScore(current, min, max) {
  if (max === min) return 100;
  // Mientras más bajo el precio actual (más cerca del mínimo), mayor el puntaje
  const score = 100 * (max - current) / (max - min);
  return Math.min(100, Math.max(0, score));
}

function calculateHistoricalMinScore(current, min) {
  if (current <= 0) return 0;
  if (current <= min) return 100;
  // Relación de cercanía al mínimo histórico
  const ratio = min / current;
  return Math.min(100, Math.max(0, ratio * 100));
}

function calculateTrendScore(derivative) {
  if (derivative < 0) {
    // Si el precio está bajando, conviene esperar (puntaje moderado para no comprar ya)
    return 40;
  } else if (derivative > 0) {
    // Si el precio está subiendo, conviene comprar pronto antes de que suba más
    return 80;
  }
  // Si está estable
  return 70;
}

function calculateAverageScore(current, average) {
  if (average <= 0) return 0;
  if (current < average) {
    // Oportunidad: precio bajo el promedio histórico
    return 100;
  }
  // Precio sobre el promedio
  const ratio = average / current;
  return Math.min(100, Math.max(0, ratio * 100));
}

function calculateProjectionScore(current, projected) {
  if (projected < current) {
    // Se proyecta que baje, conviene esperar
    return 30;
  } else if (projected > current) {
    // Se proyecta que suba, conviene comprar ahora
    return 90;
  }
  return 70;
}

module.exports = {
  calculateActualPriceScore,
  calculateHistoricalMinScore,
  calculateTrendScore,
  calculateAverageScore,
  calculateProjectionScore
};
