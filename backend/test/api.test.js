const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.SUPABASE_URL = ''; // Prevent dotenv from loading real database credentials during tests.
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
const knasta = require('../src/services/knastaService');
const external = require('../src/services/externalFactorsService');
const { todayInChile } = require('../src/utils/cleanHistory');
const sourceProduct = { id: 'test#1', name: 'Phone 128GB Blue', retail: 'test', retailLabel: 'Test Store', currentPrice: 100, normalPrice: 100, currentDate: todayInChile(), knastaUrl: 'https://knasta.cl/detail/test/1/phone', storeUrl: 'https://example.com' };
const variant = { ...sourceProduct, id: 'test#2', name: 'Phone 256GB Blue', retail: 'other', knastaUrl: 'https://knasta.cl/detail/test/2/phone' };
let mode = 'normal';
knasta.searchProduct = async () => [sourceProduct, variant];
knasta.delay = async () => {};
knasta.getProductDetail = async url => {
  assert.equal(url, sourceProduct.knastaUrl);
  if (mode === 'failure') throw new Error('Upstream unavailable');
  const today = todayInChile();
  const earlier = offset => new Date(Date.parse(today) - offset * 86400000).toISOString().slice(0, 10);
  return { title: sourceProduct.name, current_price: 100, current_day: today, dprices: [{ date: earlier(10), price: 120 }, { date: earlier(5), price: 110 }, { date: today, price: 100 }, { date: earlier(4), price: null }] };
};
external.getExternalIndicators = async () => ({ dolar: { valorActual: null }, ipc: { valorMensual: null }, isFallback: true });
const app = require('../src/app');
let server, base;
before(async () => { server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}/api`; });
after(() => new Promise(resolve => server.close(resolve)));
const post = body => fetch(`${base}/analysis/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('API rejects invalid queries and arbitrary product URLs', async () => {
  for (const body of [{}, { query: [] }, { query: ' '.repeat(3) }]) assert.equal((await post(body)).status, 400);
  assert.equal((await post({ query: 'Phone', productUrl: 'http://localhost/internal' })).status, 400);
  assert.equal((await fetch(`${base}/products/search?query[]=`)).status, 400);
});
test('real controller flow keeps exact variant, excludes zero history and preserves POST/GET values', async () => {
  const response = await post({ query: 'Phone', productUrl: sourceProduct.knastaUrl });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.product.nombre, sourceProduct.name); assert.equal(data.stores.length, 1);
  assert.equal(data.stores[0].minPrice, 100); assert.equal(data.stores[0].normalPrice, 100);
  assert.equal(data.mathResults[0].regression.m, -2); assert.equal(data.mathResults[0].regression.rSquared, 1);
  assert.equal(data.priceHistory.length, 3); assert.equal(data.mathResults[0].weekProjection.length, 7);
  const reloaded = await (await fetch(`${base}/analysis/${data.product.id}`)).json();
  assert.deepEqual(reloaded.stores, data.stores); assert.deepEqual(reloaded.priceHistory, data.priceHistory);
  await post({ query: 'Phone', productUrl: sourceProduct.knastaUrl });
  const repeated = await (await fetch(`${base}/analysis/${data.product.id}`)).json();
  assert.equal(repeated.priceHistory.length, 3);
});
test('upstream failure never creates a random historical series', async () => {
  mode = 'failure';
  sourceProduct.knastaUrl = 'https://knasta.cl/detail/test/failure/phone';
  const response = await post({ query: 'Phone', productUrl: sourceProduct.knastaUrl });
  const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.priceHistory.length, 1);
  assert.equal(data.mathResults[0].regression.valid, false); assert.equal(data.mathResults[0].weekProjection.length, 0);
  assert.equal(data.recommendation.decision, 'Datos insuficientes'); assert.equal(data.warnings.length, 1);
});
