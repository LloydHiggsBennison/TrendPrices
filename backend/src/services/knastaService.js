const axios = require('axios');
const cheerio = require('cheerio');
const normalizePrice = require('../utils/normalizePrice');
const normalizeDate = require('../utils/normalizeDate');

// User agent para simular navegación real y ser responsables
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Helper para delay de peticiones
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Convierte un texto en un slug amigable para URLs
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Separar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replace(/[^a-z0-9]+/g, '-') // Cambiar no-alfanuméricos a guiones
    .replace(/(^-|-$)+/g, ''); // Quitar guiones al inicio y final
}

/**
 * Busca productos en Knasta.cl por una query y los devuelve normalizados.
 * @param {string} query 
 * @returns {Promise<Array>}
 */
async function searchProduct(query) {
  try {
    const url = `https://knasta.cl/results?q=${encodeURIComponent(query)}`;
    console.log(`KnastaService: Buscando en Knasta.cl: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es-ES,es;q=0.9',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const scriptText = $('#__NEXT_DATA__').html();
    
    let products = [];
    
    if (scriptText) {
      try {
        const parsed = JSON.parse(scriptText);
        const initialProducts = parsed.props?.pageProps?.initialData?.products || [];
        
        products = initialProducts.map(p => {
          // Obtener o estimar url de Knasta
          const slug = slugify(p.title);
          const knastaUrl = `https://knasta.cl/detail/${p.retail}/${p.product_id}/${slug}`;
          
          // El precio actual es el precio más bajo (con tarjeta o internet)
          const currentPrice = normalizePrice(p.price_card || p.current_price);
          
          // El precio normal es el precio internet o el anterior (last_variation_price)
          let normalPrice = normalizePrice(p.price_internet || p.last_variation_price || p.current_price);
          if (normalPrice < currentPrice) {
            normalPrice = currentPrice;
          }
          
          // Si percent es negativo, es un descuento real. Si es positivo es un alza (se considera 0 de descuento)
          let discount = 0;
          if (p.percent < 0) {
            discount = Math.abs(p.percent);
          } else if (normalPrice > currentPrice) {
            discount = Math.round(100 * (normalPrice - currentPrice) / normalPrice);
          }
          
          // URL absoluta para redirección
          const rawUrl = p.url || '';
          const storeUrl = rawUrl.startsWith('/') ? `https://knasta.cl${rawUrl}` : rawUrl;

          return {
            id: p.kid || `${p.retail}#${p.product_id}`,
            name: p.title,
            brand: p.brand || p.brand_title || 'Genérica',
            category: p.category_name || 'Otros',
            retail: p.retail,
            retailLabel: p.retail_label,
            currentPrice,
            normalPrice,
            discount,
            image: p.image || p.thumbnail_image,
            knastaUrl: knastaUrl,
            storeUrl: storeUrl
          };
        });
      } catch (e) {
        console.error('KnastaService: Error parseando __NEXT_DATA__ de búsqueda:', e.message);
      }
    }

    // Fallback parsing JSON-LD si __NEXT_DATA__ falla
    if (products.length === 0) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const ldData = JSON.parse($(el).html());
          if (ldData['@type'] === 'SearchResultsPage' && ldData.mainEntity?.itemListElement) {
            products = ldData.mainEntity.itemListElement.map(item => {
              const prod = item.item;
              const price = prod.offers?.price ? normalizePrice(prod.offers.price) : 0;
              return {
                id: prod.sku || prod['@id'],
                name: prod.name,
                brand: prod.brand?.name || 'Genérica',
                category: 'Otros',
                retail: prod.offers?.seller?.name?.toLowerCase() || 'desconocida',
                retailLabel: prod.offers?.seller?.name || 'Tienda',
                currentPrice: price,
                normalPrice: price,
                discount: 0,
                image: prod.image?.[0] || prod.image,
                knastaUrl: prod.url || prod['@id'],
                storeUrl: prod.offers?.url || prod.url
              };
            });
          }
        } catch (e) {
          // Ignorar
        }
      });
    }

    return products;
  } catch (error) {
    console.error(`KnastaService: Error en searchProduct para "${query}":`, error.message);
    throw error;
  }
}

/**
 * Obtiene el detalle de un producto específico en Knasta y su historial de precios.
 * @param {string} productUrl 
 * @returns {Promise<Object>}
 */
async function getProductDetail(productUrl) {
  try {
    console.log(`KnastaService: Obteniendo detalle del producto: ${productUrl}`);
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const scriptText = $('#__NEXT_DATA__').html();
    
    if (!scriptText) {
      throw new Error('No se pudo encontrar __NEXT_DATA__ en la página del producto.');
    }
    
    const parsed = JSON.parse(scriptText);
    const productData = parsed.props?.pageProps?.initialData?.product;
    
    if (!productData) {
      throw new Error('No se encontraron datos del producto en __NEXT_DATA__');
    }
    
    return productData;
  } catch (error) {
    console.error(`KnastaService: Error en getProductDetail para "${productUrl}":`, error.message);
    throw error;
  }
}

/**
 * Wrapper de getProductDetail para cumplir la firma getPriceHistory del enunciado
 */
async function getPriceHistory(productUrl) {
  const detail = await getProductDetail(productUrl);
  return detail.dprices || [];
}

/**
 * Normaliza los datos crudos del producto de Knasta al formato requerido por el backend.
 */
function normalizeKnastaProduct(rawData) {
  const brand = rawData.brand || 'Genérica';
  const category = rawData.category_name || 'Otros';
  
  const currentPrice = normalizePrice(rawData.price_card || rawData.current_price);
  let normalPrice = normalizePrice(rawData.price_internet || rawData.last_variation_price || rawData.current_price);
  if (normalPrice < currentPrice) {
    normalPrice = currentPrice;
  }
  
  let discount = 0;
  if (rawData.percent < 0) {
    discount = Math.abs(rawData.percent);
  } else if (normalPrice > currentPrice) {
    discount = Math.round(100 * (normalPrice - currentPrice) / normalPrice);
  }
  
  const rawUrl = rawData.url || '';
  const storeUrl = rawUrl.startsWith('/') ? `https://knasta.cl${rawUrl}` : rawUrl;

  return {
    name: rawData.title,
    brand: brand,
    category: category,
    knastaUrl: rawData.knastaUrl || `https://knasta.cl/detail/${rawData.retail}/${rawData.product_id}/${slugify(rawData.title)}`,
    stores: [
      {
        name: rawData.retail_label || rawData.retail,
        currentPrice: currentPrice,
        normalPrice: normalPrice,
        discount: discount,
        available: true, // Knasta asume disponible si está listado
        storeUrl: storeUrl
      }
    ]
  };
}

/**
 * Normaliza el historial de precios al formato del backend.
 */
function normalizeKnastaHistory(dprices, storeName) {
  if (!Array.isArray(dprices)) return [];
  
  return dprices.map(dp => {
    const price = normalizePrice(dp.price);
    const normalPrice = normalizePrice(dp.price_normal || dp.price);
    let discount = 0;
    
    if (dp.discount) {
      discount = Math.abs(dp.discount);
    } else if (normalPrice > price) {
      discount = Math.round(100 * (normalPrice - price) / normalPrice);
    }

    return {
      store: storeName,
      price: price,
      normalPrice: normalPrice,
      discount: discount,
      available: dp.available !== false,
      date: normalizeDate(dp.date)
    };
  });
}

module.exports = {
  searchProduct,
  getProductDetail,
  getPriceHistory,
  normalizeKnastaProduct,
  normalizeKnastaHistory,
  delay
};
