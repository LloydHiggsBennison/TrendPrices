import test from "node:test";
import assert from "node:assert/strict";
import { buildHistoryDatasets } from "../src/utils/historyChartData.js";
import formatDate from "../src/utils/formatDate.js";
import formatCurrency from "../src/utils/formatCurrency.js";
test("chart preserves real calendar distance, deduplicates and ignores missing prices", () => {
  const row = (date, price) => ({
    tiendas: { nombre: "A" },
    fecha_registro: date,
    precio_actual: price,
  });
  const data = buildHistoryDatasets([
    row("2026-01-11", 110),
    row("2026-01-01", 100),
    row("2026-01-02", null),
    row("2026-01-01", 101),
  ]);
  assert.equal(data[0].data.length, 2);
  assert.equal(data[0].data[1].x - data[0].data[0].x, 10 * 86400000);
  assert.equal(data[0].data[0].y, 101);
  assert.equal(data[0].tension, 0);
});
test("regression toggle uses backend fit without recomputing an inconsistent slope", () => {
  const history = [
    {
      tiendas: { nombre: "A" },
      fecha_registro: "2026-01-01",
      precio_actual: 100,
    },
  ];
  const results = [
    {
      storeName: "A",
      regression: {
        valid: true,
        fittedPoints: [
          { date: "2026-01-01", price: 98 },
          { date: "2026-01-11", price: 105 },
        ],
      },
    },
  ];
  assert.equal(buildHistoryDatasets(history, results, false).length, 1);
  const withFit = buildHistoryDatasets(history, results, true);
  assert.equal(withFit.length, 2);
  assert.equal(withFit[1].data[1].y, 105);
});
test("timestamp dates render without timezone shifts and absent values are not zero prices", () => {
  assert.equal(formatDate("2026-01-01T00:00:00Z"), "1 Ene, 2026");
  assert.equal(formatDate("bad-date"), "");
  assert.equal(formatCurrency(null), "—");
  assert.equal(formatCurrency(NaN), "—");
});
