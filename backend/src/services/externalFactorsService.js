const axios = require("axios");
const BASE_URL = "https://mindicador.cl/api";
const TTL = 6 * 60 * 60 * 1000;
let cache = null;
function summarizeIndicators(dollarRows, inflationRows) {
  const dollars = (dollarRows || [])
    .filter(
      (s) =>
        Number.isFinite(s.valor) &&
        s.valor > 0 &&
        Number.isFinite(Date.parse(s.fecha)),
    )
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
  const months = new Map();
  for (const row of (inflationRows || [])
    .filter(
      (s) => Number.isFinite(s.valor) && Number.isFinite(Date.parse(s.fecha)),
    )
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))) {
    const month = row.fecha.slice(0, 7);
    if (!months.has(month)) months.set(month, row);
  }
  const ipc = [...months.values()].slice(0, 12);
  if (dollars.length < 2 || !ipc.length)
    throw new Error("Series económicas incompletas");
  const latest = dollars.at(-1);
  const week = dollars.filter(
    (s) => Date.parse(s.fecha) >= Date.parse(latest.fecha) - 7 * 86400000,
  );
  const first = week[0];
  const days = (Date.parse(latest.fecha) - Date.parse(first.fecha)) / 86400000;
  const change =
    days > 0 ? ((latest.valor / first.valor - 1) * 100 * 7) / days : null;
  const lastMonth = new Date(`${ipc[0].fecha.slice(0, 7)}-01T00:00:00Z`);
  const completeYear =
    ipc.length === 12 &&
    ipc.every((row, index) => {
      const expected = new Date(lastMonth);
      expected.setUTCMonth(lastMonth.getUTCMonth() - index);
      return row.fecha.slice(0, 7) === expected.toISOString().slice(0, 7);
    });
  const accumulated = completeYear
    ? (ipc.reduce((total, row) => total * (1 + row.valor / 100), 1) - 1) * 100
    : null;
  return {
    dolar: {
      valorActual: latest.valor,
      variacionPorcentual7d: change == null ? null : Number(change.toFixed(3)),
      serie: week.map((s) => s.valor),
      fecha: latest.fecha,
      fuente: "mindicador.cl",
      stale: Date.now() - Date.parse(latest.fecha) > 7 * 86400000,
    },
    ipc: {
      valorMensual: ipc[0].valor,
      acumulado12m: accumulated == null ? null : Number(accumulated.toFixed(2)),
      fecha: ipc[0].fecha,
      fuente: "mindicador.cl",
      stale: Date.now() - Date.parse(ipc[0].fecha) > 62 * 86400000,
    },
    fetchedAt: new Date().toISOString(),
    isFallback: false,
  };
}
async function getExternalIndicators() {
  if (cache && Date.now() < cache.expires) return cache.data;
  try {
    const [dollar, ipc] = await Promise.all([
      axios.get(`${BASE_URL}/dolar`, { timeout: 8000 }),
      axios.get(`${BASE_URL}/ipc`, { timeout: 8000 }),
    ]);
    const data = summarizeIndicators(dollar.data?.serie, ipc.data?.serie);
    cache = { data, expires: Date.now() + TTL };
    return data;
  } catch (error) {
    console.warn("Indicadores económicos no disponibles:", error.message);
    const data = {
      dolar: {
        valorActual: null,
        variacionPorcentual7d: null,
        serie: [],
        fuente: "no_disponible",
      },
      ipc: { valorMensual: null, acumulado12m: null, fuente: "no_disponible" },
      fetchedAt: new Date().toISOString(),
      isFallback: true,
    };
    cache = { data, expires: Date.now() + 5 * 60 * 1000 };
    return data;
  }
}
module.exports = { getExternalIndicators, summarizeIndicators };
