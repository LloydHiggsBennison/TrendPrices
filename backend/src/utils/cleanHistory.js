const normalizeDate = require("./normalizeDate");
const SOURCE = "Knasta:v2";
function cleanHistory(history) {
  const byDate = new Map();
  for (const item of Array.isArray(history) ? history : []) {
    const date = normalizeDate(item.date);
    const price = Number(item.price);
    if (!date || !Number.isFinite(price) || price <= 0) continue;
    byDate.set(date, { ...item, date, price });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
function todayInChile() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
module.exports = { cleanHistory, todayInChile, SOURCE };
