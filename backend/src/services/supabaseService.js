const { supabase } = require('../config/supabaseClient');
const { cleanHistory, SOURCE } = require('../utils/cleanHistory');
const products = new Map();
const stores = new Map();
const histories = new Map();
let nextProductId = 1;
let nextStoreId = 1;
function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function requireData(result) {
  if (result.error) throw result.error;
  return result.data;
}
async function saveProduct(p) {
  const record = { nombre: p.name, marca: p.brand, categoria: p.category, search_term: p.searchTerm, url_knasta: p.urlKnasta, fuente: SOURCE };
  if (!isSupabaseConfigured()) {
    const existing = [...products.values()].find(value => value.url_knasta === p.urlKnasta);
    const id = existing?.id || nextProductId++;
    products.set(id, { ...record, id });
    return id;
  }
  const existing = requireData(await supabase.from('productos').select('id').eq('url_knasta', p.urlKnasta).maybeSingle());
  const operation = existing ? supabase.from('productos').update({ ...record, fecha_actualizacion: new Date().toISOString() }).eq('id', existing.id) : supabase.from('productos').insert(record);
  return requireData(await operation.select('id').single()).id;
}
async function saveStore(s) {
  const record = { nombre: s.name, url_tienda: s.storeUrl || '' };
  if (!isSupabaseConfigured()) {
    const existing = [...stores.values()].find(value => value.nombre === s.name);
    const id = existing?.id || nextStoreId++;
    stores.set(id, { ...record, id });
    return id;
  }
  return requireData(await supabase.from('tiendas').upsert(record, { onConflict: 'nombre' }).select('id').single()).id;
}
async function savePriceHistory(productId, storeId, history) {
  const rows = cleanHistory(history).map(h => ({ producto_id: productId, tienda_id: storeId, precio_actual: Math.round(h.price), precio_normal: h.normalPrice || h.price, descuento: h.discount || 0, disponible: h.available !== false, fecha_registro: h.date, fuente: SOURCE }));
  if (!rows.length) return;
  if (!isSupabaseConfigured()) {
    for (const row of rows) histories.set(`${productId}:${storeId}:${row.fecha_registro}`, row);
    return;
  }
  requireData(await supabase.from('historial_precios').upsert(rows, { onConflict: 'producto_id,tienda_id,fecha_registro' }));
}
async function getProductById(id) {
  if (!isSupabaseConfigured()) return products.get(Number(id)) || null;
  return requireData(await supabase.from('productos').select('*').eq('id', id).maybeSingle());
}
async function getProductHistory(id) {
  if (!isSupabaseConfigured()) return [...histories.values()].filter(h => h.producto_id === Number(id)).map(h => ({ ...h, tiendas: stores.get(h.tienda_id) })).sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));
  const result = [];
  // Supabase limits a select to 1000 rows by default; load all validated observations.
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const page = requireData(await supabase.from('historial_precios').select('*, tiendas(id,nombre,url_tienda)').eq('producto_id', id).eq('fuente', SOURCE).order('fecha_registro', { ascending: true }).order('id', { ascending: true }).range(from, from + pageSize - 1));
    result.push(...page);
    if (page.length < pageSize) break;
  }
  return result;
}
async function saveMathAnalysis(a) {
  if (!isSupabaseConfigured()) return a;
  return requireData(await supabase.from('analisis_matematico').insert({ producto_id: a.productId, tienda_id: a.storeId, funcion_precio: a.funcionPrecio, pendiente_m: a.pendienteM, intercepto_b: a.interceptoB, derivada_aproximada: a.derivadaAproximada, precio_promedio: a.precioPromedio, limite_estimado: a.limiteEstimado, precio_proyectado: a.precioProyectado, proyeccion_7d: a.proyeccion7d, confianza_proyeccion: a.confianzaProyeccion, factores_externos: a.factoresExternos, puntaje: a.puntaje, tendencia: a.tendencia }).select('*').single());
}
async function saveRecommendation(r) {
  if (!isSupabaseConfigured()) return r;
  return requireData(await supabase.from('recomendaciones').insert({ producto_id: r.productId, tienda_recomendada_id: r.tiendaRecomendadaId, decision: r.decision, descripcion: r.descripcion, puntaje_final: r.puntajeFinal }).select('*').single());
}
module.exports = { isSupabaseConfigured, saveProduct, saveStore, savePriceHistory, getProductById, getProductHistory, saveMathAnalysis, saveRecommendation };
