export default function formatCurrency(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}
