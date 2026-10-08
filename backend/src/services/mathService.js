const { cleanHistory } = require('../utils/cleanHistory');
const DAY_MS = 86400000;
function getTimelinePoints(history) {
  const sorted = cleanHistory(history);
  if (!sorted.length) return [];
  const base = Date.parse(sorted[0].date);
  return sorted.map(item => ({ t: (Date.parse(item.date) - base) / DAY_MS, p: item.price, date: item.date }));
}
// Centered least squares; keep full precision and round only for display.
function estimateLinearFunction(history) {
  const points = getTimelinePoints(history);
  const n = points.length;
  const meanT = n ? points.reduce((sum, p) => sum + p.t, 0) / n : 0;
  const meanP = n ? points.reduce((sum, p) => sum + p.p, 0) / n : 0;
  const ssT = points.reduce((sum, p) => sum + (p.t - meanT) ** 2, 0);
  const m = ssT ? points.reduce((sum, p) => sum + (p.t - meanT) * (p.p - meanP), 0) / ssT : 0;
  const b = meanP - m * meanT;
  const ssTot = points.reduce((sum, p) => sum + (p.p - meanP) ** 2, 0);
  const ssRes = points.reduce((sum, p) => sum + (p.p - (m * p.t + b)) ** 2, 0);
  const valid = n >= 2 && ssT > 0;
  const rSquared = valid ? (ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot))) : null;
  return {
    m, b, rSquared, sampleCount: n, valid,
    startDate: points[0]?.date || null, endDate: points.at(-1)?.date || null,
    spanDays: points.at(-1)?.t || 0,
    functionText: valid ? `P(t) = ${m.toFixed(4)}t ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(2)}` : 'Datos insuficientes para regresión',
    fittedPoints: valid ? points.map(p => ({ date: p.date, t: p.t, price: m * p.t + b })) : []
  };
}
function getDerivativeDetails(history) {
  const points = getTimelinePoints(history);
  if (points.length < 2) return { value: null, startDate: null, endDate: null };
  const last = points.at(-1);
  const previous = points[Math.max(0, points.length - 10)];
  return { value: (last.p - previous.p) / (last.t - previous.t), startDate: previous.date, endDate: last.date };
}
function calculateApproxDerivative(history) { return getDerivativeDetails(history).value; }
// Time-weighted trapezoidal average, including irregular observation intervals.
function calculateAveragePrice(history) {
  const points = getTimelinePoints(history);
  if (!points.length) return null;
  if (points.length === 1) return points[0].p;
  let area = 0;
  for (let i = 1; i < points.length; i++) area += (points[i - 1].p + points[i].p) / 2 * (points[i].t - points[i - 1].t);
  return area / points.at(-1).t;
}
// Historical minimum is descriptive; it is not an asymptotic limit.
function calculateEstimatedLimit(history) {
  const points = getTimelinePoints(history);
  return points.length ? Math.min(...points.map(p => p.p)) : null;
}
function calculateTangentProjection(history, daysAhead = 1) {
  const points = getTimelinePoints(history);
  const derivative = calculateApproxDerivative(history);
  if (!points.length || derivative === null) return null;
  return Math.max(0, Math.round(points.at(-1).p + derivative * daysAhead));
}
function buildComparisonMatrix(stores) {
  return stores.map(s => [s.storeName, s.currentPrice, s.minPrice, s.maxPrice, s.discount, s.available, s.derivative, s.averagePrice, s.limitEstimated, s.projectedPrice, s.score]);
}
module.exports = { getTimelinePoints, estimateLinearFunction, getDerivativeDetails, calculateApproxDerivative, calculateAveragePrice, calculateEstimatedLimit, calculateTangentProjection, buildComparisonMatrix };
