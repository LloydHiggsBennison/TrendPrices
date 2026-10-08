const test = require('node:test');
const assert = require('node:assert/strict');
const math = require('../src/services/mathService');
const forecast = require('../src/services/forecastService');
const normalizeDate = require('../src/utils/normalizeDate');
const normalizePrice = require('../src/utils/normalizePrice');
const k = require('../src/services/knastaService');
const recommendation = require('../src/services/recommendationService');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
test('price normalization distinguishes decimal zeros from thousands and rejects invalid values', () => {
  for (const value of ['$ 99.990', '99990.00', '99.990,00', 99990]) assert.equal(normalizePrice(value), 99990);
  for (const value of [null, {}, Infinity, -100, '-$99.990', 'Sin precio']) assert.equal(normalizePrice(value), 0);
});
test('least squares respects irregular calendar spacing, input order and full precision', () => {
  const fit = math.estimateLinearFunction([{ date: '2026-01-11', price: 103 }, { date: '2026-01-01', price: 100 }, { date: '2026-01-03', price: 100.6 }]);
  near(fit.m, 0.3); near(fit.b, 100); near(fit.rSquared, 1);
  assert.equal(fit.startDate, '2026-01-01');
  assert.deepEqual(fit.fittedPoints.map(p => p.t), [0, 2, 10]);
});
test('known non-perfect fit reports independently computed R squared', () => {
  const fit = math.estimateLinearFunction([{ date: '2026-01-01', price: 1 }, { date: '2026-01-02', price: 3 }, { date: '2026-01-03', price: 2 }]);
  near(fit.m, 0.5); near(fit.b, 1.5); near(fit.rSquared, 0.25);
});
test('missing, invalid, negative and duplicate observations do not become zero minima', () => {
  const rows = k.normalizeKnastaHistory([{ date: '01-01-2026', price: null }, { date: 'no-date', price: 900 }, { date: '02-01-2026', price: 100 }, { date: '02-01-2026', price: 120 }, { date: '03-01-2026', price: 0 }], 'Store');
  assert.equal(rows.length, 1); assert.equal(math.calculateEstimatedLimit(rows), 120);
  const fit = math.estimateLinearFunction(rows);
  assert.equal(fit.valid, false); assert.equal(fit.rSquared, null);
  assert.equal(forecast.project7Days(rows).days.length, 0);
});
test('invalid calendar dates are rejected, including missing dates and leap day', () => {
  assert.equal(normalizeDate('29-02-2024'), '2024-02-29');
  for (const value of ['29-02-2026', '31/04/2026', 'garbage', null, '']) assert.equal(normalizeDate(value), null);
  assert.equal(normalizeDate('2026-10-08T00:00:00Z'), '2026-10-08');
});
test('integral average uses trapezoidal duration instead of arithmetic sample average', () => {
  const rows = [{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 200 }, { date: '2026-01-11', price: 200 }];
  near(math.calculateAveragePrice(rows), 195);
  near(math.getDerivativeDetails(rows).value, 10);
});
test('constant data fits exactly; empty and same-day data have no regression', () => {
  assert.equal(math.estimateLinearFunction([{ date: '2026-01-01', price: 100 }, { date: '2026-01-02', price: 100 }]).rSquared, 1);
  assert.equal(math.estimateLinearFunction([]).rSquared, null);
  assert.equal(math.estimateLinearFunction([{ date: '2026-01-01', price: 100 }, { date: '2026-01-01', price: 200 }]).valid, false);
});
test('projection is anchored to last observation across year boundary, with no invented event discount', () => {
  const rows = [{ date: '2026-12-21', price: 1000 }, { date: '2026-12-23', price: 1020 }, { date: '2026-12-31', price: 1100 }];
  const result = forecast.project7Days(rows, { dolar: { variacionPorcentual7d: 90 }, ipc: { valorMensual: 80 } });
  assert.equal(result.days[0].date, '2027-01-01'); assert.equal(result.days[6].date, '2027-01-07');
  assert.deepEqual(result.days.map(d => d.projectedPrice), [1110, 1120, 1130, 1140, 1150, 1160, 1170]);
  assert.ok(result.days.every(d => d.evento === null && d.breakdown.ajusteMacro === 0));
});
test('recommendation does not turn a single observation or stale data into buy advice', () => {
  const s = { storeId: 1, storeName: 'Test', available: true, currentPrice: 100, minPrice: 100, maxPrice: 100, averagePrice: 100, derivative: null, projectedPrice: null, insufficientHistory: true };
  assert.equal(recommendation.generateRecommendation([s]).decision, 'Datos insuficientes');
  assert.equal(recommendation.generateRecommendation([{ ...s, insufficientHistory: false, stale: true, currentDate: '2020-01-01' }]).decision, 'Datos desactualizados');
  assert.deepEqual(recommendation.generateRecommendation([]).storesWithScores, []);
});
test('an unphysical linear extrapolation is omitted rather than shown as free prices', () => {
  const result = forecast.project7Days([{ date: '2026-01-01', price: 110 }, { date: '2026-01-06', price: 60 }, { date: '2026-01-11', price: 10 }]);
  assert.equal(result.days.length, 0); assert.match(result.warning, /no positivos/);
});
test('seasonality stays neutral until every weekday has four observations', () => {
  const points = Array.from({ length: 21 }, (_, t) => ({ t, p: 100 + (t % 7), date: new Date(Date.UTC(2026, 0, 1 + t)).toISOString().slice(0, 10) }));
  assert.ok(Object.values(forecast.calculateWeekdaySeasonality(points, 0, 103)).every(v => v === 0));
  const complete = Array.from({ length: 28 }, (_, t) => ({ t, p: 100 + (t % 7), date: new Date(Date.UTC(2026, 0, 1 + t)).toISOString().slice(0, 10) }));
  const seasonal = Object.values(forecast.calculateWeekdaySeasonality(complete, 0, 103));
  assert.ok(seasonal.some(v => v !== 0)); near(seasonal.reduce((a, b) => a + b, 0), 0);
});
