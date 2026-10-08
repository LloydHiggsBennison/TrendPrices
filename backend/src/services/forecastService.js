const math = require('./mathService');
function calculateWeekdaySeasonality(points, m, b) {
  const buckets = Array.from({ length: 7 }, () => []);
  for (const p of points) buckets[new Date(`${p.date}T00:00:00Z`).getUTCDay()].push(p.p - (m * p.t + b));
  // A weekday pattern requires at least four observations of every weekday.
  if (buckets.some(values => values.length < 4)) return Object.fromEntries(buckets.map((_, day) => [day, 0]));
  const means = buckets.map(values => values.reduce((a, b) => a + b, 0) / values.length);
  const center = means.reduce((a, b) => a + b, 0) / 7;
  return Object.fromEntries(means.map((value, day) => [day, value - center]));
}
function calculateRSquared(points, m, b) {
  if (points.length < 2) return null;
  const mean = points.reduce((a, p) => a + p.p, 0) / points.length;
  const total = points.reduce((a, p) => a + (p.p - mean) ** 2, 0);
  const error = points.reduce((a, p) => a + (p.p - (m * p.t + b)) ** 2, 0);
  return total === 0 ? 1 : Math.max(0, Math.min(1, 1 - error / total));
}
// Descriptive quality index, not a calibrated probability or prediction interval.
function calculateConfidence(points, rSquared) {
  if (points.length < 3 || points.at(-1).t < 7) return 0;
  return Math.round(Math.min(40, points.length / 30 * 40) + (rSquared || 0) * 40);
}
function project7Days(history) {
  const points = math.getTimelinePoints(history);
  const linear = math.estimateLinearFunction(history);
  const empty = { days: [], confidence: 0, rSquared: linear.rSquared, method: 'regresion_lineal', seasonality: {}, externalFactorsApplied: false, baseDate: linear.endDate };
  if (!linear.valid || points.length < 3 || linear.spanDays < 7) return empty;
  const { m, b } = linear;
  const seasonality = calculateWeekdaySeasonality(points, m, b);
  const last = points.at(-1);
  const days = Array.from({ length: 7 }, (_, index) => {
    const offset = index + 1;
    const date = new Date(Date.parse(last.date) + offset * 86400000);
    const weekday = date.getUTCDay();
    const baseTrend = m * (last.t + offset) + b;
    const adjustment = seasonality[weekday];
    const projectedPrice = Math.round(baseTrend + adjustment);
    return { date: date.toISOString().slice(0, 10), weekday, projectedPrice, breakdown: { tendenciaBase: baseTrend, ajusteEstacional: adjustment, ajusteEvento: 0, ajusteMacro: 0 }, evento: null };
  });
  if (days.some(d => !Number.isFinite(d.projectedPrice) || d.projectedPrice <= 0)) return { ...empty, warning: 'El ajuste produce precios no positivos al extrapolar. Se omite esta proyección.' };
  return { ...empty, days, seasonality, confidence: calculateConfidence(points, linear.rSquared), method: Object.values(seasonality).some(v => v !== 0) ? 'regresion_lineal_estacional' : 'regresion_lineal' };
}
module.exports = { project7Days, calculateWeekdaySeasonality, calculateRSquared, calculateConfidence };
