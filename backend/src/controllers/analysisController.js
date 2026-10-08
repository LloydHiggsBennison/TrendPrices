const knasta = require("../services/knastaService");
const db = require("../services/supabaseService");
const math = require("../services/mathService");
const forecast = require("../services/forecastService");
const external = require("../services/externalFactorsService");
const recommendations = require("../services/recommendationService");
const normalizeDate = require("../utils/normalizeDate");
const { cleanHistory, SOURCE, todayInChile } = require("../utils/cleanHistory");
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function buildStore(store, history) {
  const clean = cleanHistory(history);
  if (!clean.length) return null;
  const current = clean.at(-1);
  const linear = math.estimateLinearFunction(clean);
  const derivative = math.getDerivativeDetails(clean);
  const week = forecast.project7Days(clean);
  return {
    storeId: store.id,
    storeName: store.nombre,
    storeUrl: store.url_tienda || "",
    currentPrice: current.price,
    normalPrice: current.normalPrice || current.price,
    currentDate: current.date,
    available: current.available !== false,
    discount: current.discount || 0,
    minPrice: Math.min(...clean.map((h) => h.price)),
    maxPrice: Math.max(...clean.map((h) => h.price)),
    linearFunction: linear.functionText,
    regression: linear,
    m: linear.m,
    b: linear.b,
    derivative: derivative.value,
    derivativeStartDate: derivative.startDate,
    derivativeEndDate: derivative.endDate,
    averagePrice: math.calculateAveragePrice(clean),
    limitEstimated: math.calculateEstimatedLimit(clean),
    projectedPrice: week.days[0]?.projectedPrice ?? null,
    weekProjection: week.days,
    projectionConfidence: week.confidence,
    projectionBaseDate: week.baseDate,
    projectionMethod: week.method,
    projectionWarning: week.warning || null,
    insufficientHistory: clean.length < 3 || linear.spanDays < 7,
    stale: current.date < todayInChile(),
  };
}
async function buildResponse(product, history, warnings = []) {
  const groups = new Map();
  // Ignore legacy rows: older versions mixed variants and could save fabricated prices.
  for (const h of history.filter((h) => h.fuente === SOURCE && h.tiendas)) {
    const key = h.tienda_id;
    if (!groups.has(key)) groups.set(key, { store: h.tiendas, history: [] });
    groups.get(key).history.push({
      price: h.precio_actual,
      normalPrice: h.precio_normal,
      discount: h.descuento,
      available: h.disponible,
      date: h.fecha_registro,
    });
  }
  const stores = [...groups.values()]
    .map((g) => buildStore(g.store, g.history))
    .filter(Boolean);
  if (!stores.length) return null;
  const recommendation = recommendations.generateRecommendation(stores);
  const indicators = await external.getExternalIndicators();
  return {
    product,
    stores: recommendation.storesWithScores,
    priceHistory: history.filter(
      (h) =>
        h.fuente === SOURCE &&
        groups.has(h.tienda_id) &&
        Number(h.precio_actual) > 0,
    ),
    mathResults: stores,
    comparisonMatrix: math.buildComparisonMatrix(
      recommendation.storesWithScores,
    ),
    recommendation,
    externalFactors: {
      ...indicators,
      upcomingEvents: [],
      appliedToProjection: false,
    },
    warnings,
    persistence: db.isSupabaseConfigured() ? "supabase" : "memory",
    analysisVersion: 2,
  };
}
async function getAnalysis(req, res) {
  try {
    const product = await db.getProductById(req.params.productId);
    if (!product)
      return res.status(404).json({
        error:
          "Producto no encontrado. Si el almacenamiento es temporal, vuelve a analizarlo.",
      });
    const response = await buildResponse(
      product,
      await db.getProductHistory(product.id),
    );
    if (!response)
      return res.status(404).json({
        error:
          "Este análisis no tiene historial validado. Busca y analiza el producto nuevamente.",
      });
    return res.json(response);
  } catch (error) {
    console.error("getAnalysis:", error.message);
    return res.status(503).json({
      error: "No se pudo recuperar el análisis guardado. Inténtalo nuevamente.",
    });
  }
}
async function runAnalysis(req, res) {
  try {
    const query =
      typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!query || query.length > 200)
      return res
        .status(400)
        .json({ error: "Ingresa una búsqueda de entre 1 y 200 caracteres." });
    const products = await knasta.searchProduct(query);
    if (!products.length)
      return res
        .status(404)
        .json({ error: "No se encontraron productos con precios válidos." });
    const selected = products.find((p) => p.knastaUrl === req.body.productUrl);
    if (!selected)
      return res.status(400).json({
        error:
          "Selecciona un producto de los resultados de búsqueda para evitar mezclar modelos y variantes.",
      });
    // Only compare exactly the selected title (including capacity, color and condition).
    const matches = [
      selected,
      ...products.filter(
        (p) =>
          p.knastaUrl !== selected.knastaUrl &&
          normalizeText(p.name) === normalizeText(selected.name),
      ),
    ];
    const seen = new Set();
    const comparable = matches
      .filter((p) => {
        if (seen.has(p.retail)) return false;
        seen.add(p.retail);
        return true;
      })
      .slice(0, 5);
    const productId = await db.saveProduct({
      name: selected.name,
      brand: selected.brand,
      category: selected.category,
      searchTerm: query,
      urlKnasta: selected.knastaUrl,
      fuente: SOURCE,
    });
    const warnings = [];
    for (const p of comparable) {
      let raw = [];
      let detail = null;
      await knasta.delay(1500);
      try {
        detail = await knasta.getProductDetail(p.knastaUrl);
        raw = knasta.normalizeKnastaHistory(
          detail.dprices,
          p.retailLabel || p.retail,
        );
      } catch {
        warnings.push(
          `No se pudo obtener el historial de ${p.retailLabel || p.retail}; se conserva el historial validado disponible y el precio fechado de la búsqueda.`,
        );
      }
      if (detail && p.knastaUrl === selected.knastaUrl)
        await db.saveProduct({
          name: selected.name,
          brand: detail.brand || selected.brand,
          category: detail.category_name || selected.category,
          searchTerm: query,
          urlKnasta: selected.knastaUrl,
          fuente: SOURCE,
        });
      const snapshot = detail
        ? knasta.normalizeKnastaProduct(detail).stores[0]
        : {
            currentPrice: p.currentPrice,
            normalPrice: p.normalPrice,
            discount: p.discount,
            available: p.available,
          };
      const date = normalizeDate(detail?.current_day) || p.currentDate;
      // Missing source dates are not assigned today's date.
      if (date && snapshot.currentPrice > 0)
        raw.push({
          date,
          price: snapshot.currentPrice,
          normalPrice: snapshot.normalPrice,
          discount: snapshot.discount,
          available: snapshot.available,
          fuente: SOURCE,
        });
      raw = cleanHistory(raw)
        .filter((h) => h.date <= todayInChile())
        .map((h) => ({ ...h, fuente: SOURCE }));
      if (!raw.length) {
        warnings.push(
          `Knasta no proporcionó observaciones válidas y fechadas para ${p.retailLabel || p.retail}.`,
        );
        continue;
      }
      const storeId = await db.saveStore({
        name: p.retailLabel || p.retail,
        storeUrl: p.storeUrl,
      });
      await db.savePriceHistory(productId, storeId, raw);
    }
    const response = await buildResponse(
      await db.getProductById(productId),
      await db.getProductHistory(productId),
      warnings,
    );
    if (!response)
      return res.status(422).json({
        error:
          "No hay historial real y fechado disponible para este producto. No se generaron precios ni recomendaciones ficticias.",
      });
    for (const store of response.stores)
      await db.saveMathAnalysis({
        productId,
        storeId: store.storeId,
        funcionPrecio: store.linearFunction,
        pendienteM: store.m,
        interceptoB: store.b,
        derivadaAproximada: store.derivative,
        precioPromedio: store.averagePrice,
        limiteEstimado: store.limitEstimated,
        precioProyectado: store.projectedPrice,
        proyeccion7d: store.weekProjection,
        confianzaProyeccion: store.projectionConfidence,
        factoresExternos: response.externalFactors,
        puntaje: store.score,
        tendencia:
          store.derivative == null
            ? "Sin datos"
            : store.derivative < 0
              ? "Baja"
              : store.derivative > 0
                ? "Alza"
                : "Estable",
      });
    await db.saveRecommendation({
      productId,
      tiendaRecomendadaId:
        response.recommendation.tienda_recomendada?.id || null,
      decision: response.recommendation.decision,
      descripcion: response.recommendation.descripcion,
      puntajeFinal: response.recommendation.puntaje_final,
    });
    return res.json(response);
  } catch (error) {
    console.error("runAnalysis:", error.message);
    return res.status(503).json({
      error:
        "No se pudo completar la consulta a Knasta o el almacenamiento del análisis. Inténtalo nuevamente.",
    });
  }
}
module.exports = { runAnalysis, getAnalysis, buildStore, buildResponse };
