// Confirmed calendar, not a recurring guess. End is exclusive, in Chile's UTC-3 offset.
const EVENTS = [
  {
    id: "cybermonday-2026",
    nombre: "CyberMonday 2026",
    startDate: "2026-10-05",
    endDate: "2026-10-07",
    startsAt: "2026-10-05T00:00:00-03:00",
    endsAt: "2026-10-08T00:00:00-03:00",
    timeZone: "America/Santiago",
    sourceUrl: "https://www.ccs.cl/ecommerce/cybermonday-2026/",
    endLabel: "7 de octubre de 2026 a las 23:59 (hora de Chile)",
  },
];
function getCyberContext(now = new Date()) {
  const time = new Date(now).getTime();
  if (!Number.isFinite(time)) return null;
  const event = EVENTS.find(
    (e) =>
      time >= Date.parse(e.startsAt) - 7 * 86400000 &&
      time < Date.parse(e.endsAt) + 7 * 86400000,
  );
  if (!event) return null;
  return {
    ...event,
    status:
      time < Date.parse(event.startsAt)
        ? "upcoming"
        : time < Date.parse(event.endsAt)
          ? "active"
          : "ended",
    checkedAt: new Date(time).toISOString(),
  };
}
function getEventForDate(date) {
  return (
    EVENTS.find(
      (e) =>
        new Date(date).getTime() >= Date.parse(e.startsAt) &&
        new Date(date).getTime() < Date.parse(e.endsAt),
    ) || null
  );
}
function getUpcomingEvents(date = new Date(), daysAhead = 7) {
  const time = new Date(date).getTime();
  return EVENTS.filter(
    (e) =>
      Date.parse(e.startsAt) > time &&
      Date.parse(e.startsAt) <= time + daysAhead * 86400000,
  );
}
function compareEventPrice(history, event) {
  if (!event || !history.length) return null;
  const current = history.at(-1);
  if (current.date < event.startDate) return null;
  const cutoff = Date.parse(event.startDate) - 30 * 86400000;
  const baseline = history
    .filter((h) => h.date < event.startDate && Date.parse(h.date) >= cutoff)
    .at(-1);
  if (!baseline) return { status: "insufficient", eventName: event.nombre };
  const reductionPercent =
    ((baseline.price - current.price) / baseline.price) * 100;
  return {
    status:
      reductionPercent > 0 ? "lower" : reductionPercent < 0 ? "higher" : "same",
    eventName: event.nombre,
    baselineDate: baseline.date,
    baselinePrice: baseline.price,
    currentDate: current.date,
    currentPrice: current.price,
    reductionPercent,
  };
}
module.exports = {
  getCyberContext,
  compareEventPrice,
  getEventForDate,
  getUpcomingEvents,
};
