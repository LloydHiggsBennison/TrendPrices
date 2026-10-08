export default function formatDate(value, shortMode = false) {
  if (!value) return '';
  const iso = String(value).slice(0, 10);
  const date = new Date(`${iso}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}${shortMode ? '' : `, ${date.getUTCFullYear()}`}`;
}
