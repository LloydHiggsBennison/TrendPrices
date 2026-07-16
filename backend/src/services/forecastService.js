const mathService = require('./mathService');
const retailEventsService = require('./retailEventsService');

/**
 * Servicio de Proyección a 7 Días
 * --------------------------------
 * Extiende el modelo matemático original (que solo proyectaba 1 día con la recta tangente)
 * a una proyección de 7 días combinando:
 *
 *  1. Tendencia base: regresión lineal por mínimos cuadrados (igual que mathService).
 *  2. Estacionalidad semanal: se calculan los residuos (precio real - tendencia) agrupados
 *     por día de la semana, para capturar patrones como "los precios bajan los martes/miércoles
 *     por promociones periódicas".
 *  3. Eventos de retail: si un día proyectado cae dentro de una ventana conocida (CyberDay,
 *     Black Friday, Navidad, etc.), se aplica el impacto promedio histórico de ese evento.
 *  4. Variables macroeconómicas: tipo de cambio USD/CLP e IPC, que generan una leve presión
 *     alcista o bajista de fondo sobre el precio (más relevante en categorías importadas).
 *
 * Además calcula un puntaje de confiabilidad (0-100) para que el usuario sepa qué tan
 * sólida es la proyección mostrada (más datos históricos y menor dispersión = mayor confianza).
 */

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Agrupa el historial en puntos (t, p, date) igual que mathService, pero exponiendo también
 * el día de la semana de cada punto.
 */
function getPointsWithWeekday(priceHistory) {
  const cleanHistory = (priceHistory || []).filter(h => h.price > 0);
  if (cleanHistory.length === 0) return [];

  const sorted = [...cleanHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const baseDate = new Date(sorted[0].date);

  return sorted.map(item => {
    const itemDate = new Date(item.date);
    const diffDays = Math.round((itemDate - baseDate) / DAY_MS);
    return {
      t: diffDays,
      p: item.price,
      date: item.date,
      weekday: itemDate.getDay() // 0 = Domingo ... 6 = Sábado
    };
  });
}

/**
 * Calcula los índices estacionales por día de la semana a partir de los residuos
 * (precio real - precio estimado por la tendencia lineal), normalizados para que
 * su promedio sea 0 (es decir, no desplazan el nivel general, solo la forma semanal).
 */
function calculateWeekdaySeasonality(points, m, b) {
  const residualsByWeekday = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  points.forEach(pt => {
    const trendValue = m * pt.t + b;
    residualsByWeekday[pt.weekday].push(pt.p - trendValue);
  });

  const indices = {};
  for (let day = 0; day <= 6; day++) {
    const arr = residualsByWeekday[day];
    indices[day] = arr.length > 0
      ? arr.reduce((a, v) => a + v, 0) / arr.length
      : 0;
  }

  // Normalizar para que el promedio de los índices sea 0 (evita duplicar el efecto de la tendencia)
  const meanIndex = Object.values(indices).reduce((a, v) => a + v, 0) / 7;
  Object.keys(indices).forEach(day => {
    indices[day] = indices[day] - meanIndex;
  });

  return indices;
}

/**
 * Calcula el coeficiente de determinación R² de la regresión lineal, usado como
 * insumo principal para el puntaje de confiabilidad.
 */
function calculateRSquared(points, m, b) {
  const n = points.length;
  if (n < 2) return 0;

  const meanP = points.reduce((a, pt) => a + pt.p, 0) / n;
  let ssTot = 0;
  let ssRes = 0;

  points.forEach(pt => {
    const predicted = m * pt.t + b;
    ssRes += Math.pow(pt.p - predicted, 2);
    ssTot += Math.pow(pt.p - meanP, 2);
  });

  if (ssTot === 0) return 1; // precio constante, el modelo lo explica perfectamente
  return Math.max(0, 1 - (ssRes / ssTot));
}

/**
 * Calcula el ajuste macroeconómico (dólar + IPC) a aplicar sobre la proyección.
 * Es intencionalmente conservador: solo una fracción del movimiento del dólar se traspasa
 * al precio (pass-through parcial, ya que no todos los productos son 100% importados),
 * y el IPC se prorratea a nivel diario como una leve deriva de fondo.
 */
function calculateMacroAdjustmentFactor(externalIndicators, dayIndex) {
  if (!externalIndicators) return 0;

  const dolarVar7d = externalIndicators.dolar?.variacionPorcentual7d || 0;
  const ipcMensual = externalIndicators.ipc?.valorMensual || 0;

  const PASS_THROUGH_DOLAR = 0.3; // 30% del movimiento del dólar se traspasa al precio final
  const dolarDailyFraction = (dolarVar7d * PASS_THROUGH_DOLAR) / 7;

  const ipcDailyFraction = ipcMensual / 30; // Prorrateo diario del IPC mensual

  // El efecto es acumulativo día a día (dayIndex empieza en 1)
  const totalPercent = (dolarDailyFraction + ipcDailyFraction) * dayIndex;
  return totalPercent / 100; // convertir a fracción decimal
}

/**
 * Calcula un puntaje de confiabilidad (0-100) para la proyección de 7 días.
 */
function calculateConfidence(points, rSquared, externalIndicators) {
  let score = 0;

  // Cantidad de datos históricos (hasta 40 puntos)
  const dataScore = Math.min(40, (points.length / 30) * 40);

  // Ajuste del modelo de tendencia (hasta 40 puntos)
  const fitScore = rSquared * 40;

  // Disponibilidad de variables externas reales, no fallback (hasta 20 puntos)
  const externalScore = externalIndicators && !externalIndicators.isFallback ? 20 : 8;

  score = dataScore + fitScore + externalScore;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Genera la proyección de 7 días para un historial de precios de una tienda específica.
 * @param {Array} priceHistory Historial de precios [{price, date, ...}]
 * @param {Object} externalIndicators Salida de externalFactorsService.getExternalIndicators()
 * @returns {Object} { days, confidence, method, seasonality, externalFactorsApplied }
 */
function project7Days(priceHistory, externalIndicators) {
  const points = getPointsWithWeekday(priceHistory);

  if (points.length === 0) {
    return {
      days: [],
      confidence: 0,
      method: 'regresion_lineal_estacional',
      seasonality: {},
      externalFactorsApplied: false
    };
  }

  const linear = mathService.estimateLinearFunction(priceHistory);
  const { m, b } = linear;

  const seasonality = calculateWeekdaySeasonality(points, m, b);
  const rSquared = calculateRSquared(points, m, b);
  const confidence = calculateConfidence(points, rSquared, externalIndicators);

  const lastPoint = points[points.length - 1];
  const lastDate = new Date(lastPoint.date);

  const days = [];
  for (let i = 1; i <= 7; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(lastDate.getDate() + i);
    const futureT = lastPoint.t + i;
    const weekday = futureDate.getDay();

    // 1. Tendencia base (regresión lineal)
    const baseTrend = m * futureT + b;

    // 2. Ajuste estacional por día de la semana
    const seasonalAdjustment = seasonality[weekday] || 0;

    // 3. Evento de retail conocido (CyberDay, Black Friday, Navidad, etc.)
    const event = retailEventsService.getEventForDate(futureDate);
    const eventAdjustment = event ? baseTrend * event.impactoPromedio : 0;

    // 4. Variables macroeconómicas (dólar / IPC)
    const macroFactor = calculateMacroAdjustmentFactor(externalIndicators, i);
    const macroAdjustment = baseTrend * macroFactor;

    let projectedPrice = baseTrend + seasonalAdjustment + eventAdjustment + macroAdjustment;
    projectedPrice = Math.max(0, Math.round(projectedPrice));

    days.push({
      date: futureDate.toISOString().split('T')[0],
      weekday,
      projectedPrice,
      breakdown: {
        tendenciaBase: Math.round(baseTrend),
        ajusteEstacional: Math.round(seasonalAdjustment),
        ajusteEvento: Math.round(eventAdjustment),
        ajusteMacro: Math.round(macroAdjustment)
      },
      evento: event ? { nombre: event.nombre, impactoPromedio: event.impactoPromedio } : null
    });
  }

  return {
    days,
    confidence,
    rSquared: parseFloat(rSquared.toFixed(3)),
    method: 'regresion_lineal_estacional',
    seasonality,
    externalFactorsApplied: !!externalIndicators
  };
}

module.exports = {
  project7Days,
  calculateWeekdaySeasonality,
  calculateRSquared,
  calculateConfidence
};
