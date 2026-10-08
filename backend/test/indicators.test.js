const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeIndicators } = require('../src/services/externalFactorsService');
const dollars = [{ fecha: '2026-10-08T00:00:00Z', valor: 1100 }, { fecha: '2026-10-01T00:00:00Z', valor: 1000 }];
const months = Array.from({ length: 12 }, (_, index) => ({ fecha: new Date(Date.UTC(2026, 8 - index, 1)).toISOString(), valor: 1 }));
test('exchange variation uses calendar days and IPC compounds twelve monthly rates', () => {
  const result = summarizeIndicators(dollars, months);
  assert.equal(result.dolar.variacionPorcentual7d, 10);
  assert.equal(result.ipc.acumulado12m, 12.68);
});
test('missing or duplicate months do not become a twelve month inflation figure', () => {
  const result = summarizeIndicators(dollars, [...months.slice(0, 11), months[0]]);
  assert.equal(result.ipc.acumulado12m, null);
});
test('empty economic series are rejected instead of inventing dollar and inflation values', () => {
  assert.throws(() => summarizeIndicators([], []), /incompletas/);
});
