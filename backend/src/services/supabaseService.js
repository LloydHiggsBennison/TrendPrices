const { supabase } = require('../config/supabaseClient');
require('dotenv').config();

// En memoria para simulación sin base de datos
const inMemoryProducts = {};
const inMemoryStores = {};
const inMemoryHistory = [];

/**
 * Valida si las credenciales de Supabase son reales y están configuradas.
 */
function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return false;
  if (url.includes('placeholder-project') || key.includes('placeholder_service_role_key')) return false;
  
  return true;
}

/**
 * Guarda o actualiza un producto en Supabase.
 * @param {Object} productData 
 * @returns {Promise<number>} ID del producto
 */
async function saveProduct(productData) {
  const { name, brand, category, searchTerm, urlKnasta, fuente } = productData;

  if (!isSupabaseConfigured()) {
    console.log('[SUPABASE WARNING] Usando base de datos simulada en memoria. Producto:', name);
    const mockId = Math.abs((urlKnasta || name).split('').reduce((acc, char) => { acc = ((acc << 5) - acc) + char.charCodeAt(0); return acc & acc }, 0)) % 100000;
    inMemoryProducts[mockId] = {
      id: mockId,
      nombre: name,
      marca: brand,
      categoria: category,
      search_term: searchTerm,
      url_knasta: urlKnasta,
      fuente: fuente || 'Knasta'
    };
    return mockId;
  }

  try {
    // Buscar si ya existe por url_knasta
    const { data: existing, error: searchError } = await supabase
      .from('productos')
      .select('id')
      .eq('url_knasta', urlKnasta)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existing) {
      // Actualizar
      const { data: updated, error: updateError } = await supabase
        .from('productos')
        .update({
          nombre: name,
          marca: brand,
          categoria: category,
          search_term: searchTerm,
          fuente: fuente || 'Knasta',
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError) throw updateError;
      return updated.id;
    } else {
      // Insertar nuevo
      const { data: inserted, error: insertError } = await supabase
        .from('productos')
        .insert({
          nombre: name,
          marca: brand,
          categoria: category,
          search_term: searchTerm,
          url_knasta: urlKnasta,
          fuente: fuente || 'Knasta'
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return inserted.id;
    }
  } catch (error) {
    console.warn('[SUPABASE FALLBACK] Falló guardado de producto real, usando memoria. Error:', error.message);
    const mockId = Math.abs((urlKnasta || name).split('').reduce((acc, char) => { acc = ((acc << 5) - acc) + char.charCodeAt(0); return acc & acc }, 0)) % 100000;
    inMemoryProducts[mockId] = {
      id: mockId,
      nombre: name,
      marca: brand,
      categoria: category,
      search_term: searchTerm,
      url_knasta: urlKnasta,
      fuente: fuente || 'Knasta'
    };
    return mockId;
  }
}

/**
 * Guarda o actualiza una tienda en Supabase.
 * @param {Object} storeData 
 * @returns {Promise<number>} ID de la tienda
 */
async function saveStore(storeData) {
  const { name, storeUrl } = storeData;

  if (!isSupabaseConfigured()) {
    console.log('[SUPABASE WARNING] Tienda simulada en memoria:', name);
    // Generar un ID numérico hashable a partir del nombre
    const mockId = Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)) % 100000;
    inMemoryStores[mockId] = { id: mockId, nombre: name, url_tienda: storeUrl };
    return mockId;
  }

  try {
    const { data, error } = await supabase
      .from('tiendas')
      .upsert(
        { nombre: name, url_tienda: storeUrl },
        { onConflict: 'nombre' }
      )
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.warn('[SUPABASE FALLBACK] Falló guardado de tienda real, usando memoria. Error:', error.message);
    const mockId = Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)) % 100000;
    inMemoryStores[mockId] = { id: mockId, nombre: name, url_tienda: storeUrl };
    return mockId;
  }
}

/**
 * Guarda múltiples registros en el historial de precios.
 */
async function savePriceHistory(productId, storeId, historyData) {
  if (!Array.isArray(historyData) || historyData.length === 0) return;

  if (!isSupabaseConfigured()) {
    console.log(`[SUPABASE WARNING] Guardando ${historyData.length} registros de historial en memoria.`);
    historyData.forEach(h => {
      inMemoryHistory.push({
        producto_id: productId,
        tienda_id: storeId,
        precio_actual: h.price,
        precio_normal: h.normalPrice || h.price,
        descuento: h.discount || 0,
        disponible: h.available !== false,
        fecha_registro: h.date,
        fuente: h.fuente || 'Knasta',
        // Estructura mock join para consulta
        tiendas: inMemoryStores[storeId] || { id: storeId, nombre: 'Tienda' }
      });
    });
    return;
  }

  try {
    const records = historyData.map(h => ({
      producto_id: productId,
      tienda_id: storeId,
      precio_actual: h.price,
      precio_normal: h.normalPrice || h.price,
      descuento: h.discount || 0,
      disponible: h.available !== false,
      fecha_registro: h.date,
      fuente: h.fuente || 'Knasta'
    }));

    const { error } = await supabase
      .from('historial_precios')
      .upsert(records, {
        onConflict: 'producto_id,tienda_id,fecha_registro'
      });

    if (error) throw error;
  } catch (error) {
    console.warn('[SUPABASE FALLBACK] Falló guardado de historial real, usando memoria. Error:', error.message);
    historyData.forEach(h => {
      inMemoryHistory.push({
        producto_id: productId,
        tienda_id: storeId,
        precio_actual: h.price,
        precio_normal: h.normalPrice || h.price,
        descuento: h.discount || 0,
        disponible: h.available !== false,
        fecha_registro: h.date,
        fuente: h.fuente || 'Knasta',
        tiendas: inMemoryStores[storeId] || { id: storeId, nombre: 'Tienda' }
      });
    });
  }
}

/**
 * Obtiene un producto por ID.
 */
async function getProductById(productId) {
  if (!isSupabaseConfigured()) {
    return inMemoryProducts[productId] || null;
  }

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    return data || inMemoryProducts[productId] || null;
  } catch (error) {
    return inMemoryProducts[productId] || null;
  }
}

/**
 * Obtiene el historial completo de precios de un producto.
 */
async function getProductHistory(productId) {
  if (!isSupabaseConfigured()) {
    return inMemoryHistory.filter(h => h.producto_id === Number(productId));
  }

  try {
    const { data, error } = await supabase
      .from('historial_precios')
      .select(`
        *,
        tiendas (
          id,
          nombre,
          url_tienda
        )
      `)
      .eq('producto_id', productId)
      .order('fecha_registro', { ascending: true });

    if (error) throw error;
    
    // Si no hay datos en BD real pero sí en memoria, retornamos memoria
    if (!data || data.length === 0) {
      return inMemoryHistory.filter(h => h.producto_id === Number(productId));
    }
    
    return data;
  } catch (error) {
    return inMemoryHistory.filter(h => h.producto_id === Number(productId));
  }
}

/**
 * Guarda los resultados del análisis matemático.
 */
async function saveMathAnalysis(analysisData) {
  if (!isSupabaseConfigured()) {
    return { id: 999, ...analysisData };
  }

  try {
    const {
      productId,
      storeId,
      funcionPrecio,
      pendienteM,
      interceptoB,
      derivadaAproximada,
      precioPromedio,
      limiteEstimado,
      precioProyectado,
      puntaje,
      tendencia
    } = analysisData;

    const { data, error } = await supabase
      .from('analisis_matematico')
      .insert({
        producto_id: productId,
        tienda_id: storeId,
        funcion_precio: funcionPrecio,
        pendiente_m: pendienteM,
        intercepto_b: interceptoB,
        derivada_aproximada: derivadaAproximada,
        precio_promedio: precioPromedio,
        limite_estimado: limiteEstimado,
        precio_proyectado: precioProyectado,
        puntaje: puntaje,
        tendencia: tendencia
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return { id: 999, ...analysisData };
  }
}

/**
 * Guarda los resultados de una recomendación de compra.
 */
async function saveRecommendation(recommendationData) {
  if (!isSupabaseConfigured()) {
    return { id: 999, ...recommendationData };
  }

  try {
    const {
      productId,
      tiendaRecomendadaId,
      decision,
      descripcion,
      puntajeFinal
    } = recommendationData;

    const { data, error } = await supabase
      .from('recomendaciones')
      .insert({
        producto_id: productId,
        tienda_recomendada_id: tiendaRecomendadaId,
        decision: decision,
        descripcion: descripcion,
        puntaje_final: puntajeFinal
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return { id: 999, ...recommendationData };
  }
}

module.exports = {
  saveProduct,
  saveStore,
  savePriceHistory,
  getProductById,
  getProductHistory,
  saveMathAnalysis,
  saveRecommendation
};
