const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getCyberContext,
  getEventForDate,
  compareEventPrice,
} = require("../src/services/retailEventsService");
const {
  generateRecommendation,
} = require("../src/services/recommendationService");
test("Cyber status uses Chile time and ends exactly after October 7", () => {
  assert.equal(getCyberContext("2026-10-04T23:59:59-03:00").status, "upcoming");
  assert.equal(getCyberContext("2026-10-05T00:00:00-03:00").status, "active");
  assert.equal(getCyberContext("2026-10-07T23:59:59-03:00").status, "active");
  assert.equal(getCyberContext("2026-10-08T00:00:00-03:00").status, "ended");
  assert.equal(getEventForDate("2026-10-08T00:00:00-03:00"), null);
  assert.equal(getCyberContext("2027-10-06T00:00:00-03:00"), null);
});
test("observed reduction is measured against the last valid price before Cyber", () => {
  const event = getCyberContext("2026-10-06T10:00:00-03:00");
  const comparison = compareEventPrice(
    [
      { date: "2026-10-03", price: 120 },
      { date: "2026-10-04", price: 100 },
      { date: "2026-10-06", price: 80 },
    ],
    event,
  );
  assert.equal(comparison.baselineDate, "2026-10-04");
  assert.equal(comparison.baselinePrice, 100);
  assert.equal(comparison.reductionPercent, 20);
  assert.equal(comparison.status, "lower");
});
test("a calendar event does not create a discount when prices rise or stay equal", () => {
  const event = getCyberContext("2026-10-06T10:00:00-03:00");
  assert.equal(
    compareEventPrice(
      [
        { date: "2026-10-04", price: 100 },
        { date: "2026-10-06", price: 100 },
      ],
      event,
    ).status,
    "same",
  );
  assert.equal(
    compareEventPrice(
      [
        { date: "2026-10-04", price: 100 },
        { date: "2026-10-06", price: 120 },
      ],
      event,
    ).status,
    "higher",
  );
  assert.equal(
    compareEventPrice(
      [
        { date: "2026-08-01", price: 100 },
        { date: "2026-10-06", price: 80 },
      ],
      event,
    ).status,
    "insufficient",
  );
  assert.equal(
    compareEventPrice([{ date: "2026-10-04", price: 100 }], event),
    null,
  );
});
test("active Cyber highlights an observed reduction near the historical minimum without subtracting another discount", () => {
  const event = getCyberContext("2026-10-06T10:00:00-03:00");
  const result = generateRecommendation(
    [
      {
        storeId: 1,
        storeName: "Test",
        available: true,
        currentPrice: 80,
        minPrice: 80,
        maxPrice: 100,
        averagePrice: 90,
        derivative: -1,
        projectedPrice: 70,
        weekProjection: [{ projectedPrice: 70 }],
        projectionConfidence: 80,
        regression: { rSquared: 0.9 },
        eventPriceComparison: { status: "lower", reductionPercent: 20 },
        stale: false,
        insufficientHistory: false,
      },
    ],
    event,
  );
  assert.equal(result.decision, "Comprar ahora");
  assert.equal(result.tienda_recomendada.precio, 80);
  assert.match(result.descripcion, /ya está en curso/);
  assert.match(result.descripcion, /7 de octubre de 2026/);
});
