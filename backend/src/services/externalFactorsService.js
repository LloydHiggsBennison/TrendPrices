const axios = require('axios');

/**
 * Servicio de Variables Externas (Macroeconómicas)
 * -------------------------------------------------
 * Obtiene indicadores económicos reales de Chile desde mindicador.cl (API pública, gratuita,
 * mantenida por la comunidad y usada ampliamente por proyectos chilenos: dólar observado, UF, UTM, IPC).
 * Estos indicadores se usan para ajustar la proyección de precios a 7 días:
 *  - El tipo de cambio USD/CLP afecta a productos importados (electrónica, tecnología, etc.)
 *  - El IPC (inflación) genera una deriva de largo plazo sobre el nivel general de precios.
 *
 * Se cachea en memoria por un tiempo prudente para no saturar la API externa ni volver
 * lenta cada consulta (estos indicadores no cambian más de una vez al día).
 */

const BASE_URL = 'https://mindicador.cl/api';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

let cache = {
  data: null,
  fetchedAt: 0
};

/**
 * Calcula la pendiente (tendencia) simple de una serie de valores numéricos ordenados cronológicamente.
 * Reutiliza el mismo principio de regresión lineal por mínimos cuadrados que el resto del sistema.
 */
function calculateSeriesTrend(values) {
  const n = values.length;
  if (n < 2) return 0;

  let sumT = 0, sumV = 0, sumTV = 0, sumT2 = 0;
  for (let t = 0; t < n; t++) {
    sumT += t;
    sumV += values[t];
    sumTV += t * values[t];
    sumT2 += t * t;
  }
  const denom = n * sumT2 - sumT * sumT;
  if (denom === 0) return 0;
  return (n * sumTV - sumT * sumV) / denom;
}

/**
 * Valores de respaldo conservadores en caso de que la API externa no esté disponible.
 * Se marcan explícitamente como fallback para que el frontend pueda advertir al usuario
 * que la confiabilidad del ajuste macroeconómico es menor.
 */
function getFallbackIndicators() {
  return {
    dolar: {
      valorActual: 970,
      variacionPorcentual7d: 0,
      serie: [],
      fuente: 'fallback'
    },
    ipc: {
      valorMensual: 0.4, // % mensual, promedio histórico conservador para Chile
      acumulado12m: 4.0,
      fuente: 'fallback'
    },
    fetchedAt: new Date().toISOString(),
    isFallback: true
  };
}

/**
 * Obtiene y calcula los indicadores externos (dólar + IPC), usando caché en memoria.
 * @returns {Promise<Object>}
 */
async function getExternalIndicators() {
  const now = Date.now();
  if (cache.data && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const [dolarRes, ipcRes] = await Promise.all([
      axios.get(`${BASE_URL}/dolar`, { timeout: 8000 }),
      axios.get(`${BASE_URL}/ipc`, { timeout: 8000 })
    ]);

    const dolarSerie = (dolarRes.data?.serie || [])
      .slice(0, 7) // mindicador retorna del más reciente al más antiguo
      .reverse()
      .map(s => s.valor);

    const dolarActual = dolarSerie.length > 0 ? dolarSerie[dolarSerie.length - 1] : 970;
    const dolarTrendAbs = calculateSeriesTrend(dolarSerie); // CLP por día
    const dolarVariacion7d = dolarActual > 0 ? (dolarTrendAbs * 7 / dolarActual) * 100 : 0;

    const ipcSerie = (ipcRes.data?.serie || []).slice(0, 12);
    const ipcMensual = ipcSerie.length > 0 ? ipcSerie[0].valor : 0.4;
    const ipcAcumulado12m = ipcSerie.reduce((acc, s) => acc + (s.valor || 0), 0);

    const result = {
      dolar: {
        valorActual: dolarActual,
        variacionPorcentual7d: parseFloat(dolarVariacion7d.toFixed(3)),
        serie: dolarSerie,
        fuente: 'mindicador.cl'
      },
      ipc: {
        valorMensual: ipcMensual,
        acumulado12m: parseFloat(ipcAcumulado12m.toFixed(2)),
        fuente: 'mindicador.cl'
      },
      fetchedAt: new Date().toISOString(),
      isFallback: false
    };

    cache = { data: result, fetchedAt: now };
    return result;
  } catch (error) {
    console.warn('ExternalFactorsService: No se pudo obtener indicadores de mindicador.cl. Usando fallback. Error:', error.message);
    const fallback = getFallbackIndicators();
    // Cacheamos también el fallback por un tiempo corto para no reintentar en cada request
    cache = { data: fallback, fetchedAt: now - CACHE_TTL_MS + 5 * 60 * 1000 }; // reintenta en 5 min
    return fallback;
  }
}

module.exports = {
  getExternalIndicators,
  calculateSeriesTrend
};
