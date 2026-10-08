// Invalid dates must never become observations dated today.
function normalizeDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : null;
  if (typeof value !== 'string') return null;
  let match = value.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:T.*)?$/);
  if (!match) {
    const reversed = value.trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!reversed) return null;
    match = [reversed[0], reversed[3], reversed[2], reversed[1]];
  }
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}
module.exports = normalizeDate;
