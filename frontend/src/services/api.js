const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Realiza peticiones HTTP
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Ha ocurrido un error en la solicitud.');
  }
  
  return data;
}

/**
 * Busca productos en Knasta
 */
export async function searchProducts(query) {
  return request(`/products/search?query=${encodeURIComponent(query)}`);
}

/**
 * Obtiene el análisis matemático e historial de un producto guardado
 */
export async function getAnalysis(productId) {
  return request(`/analysis/${productId}`);
}

/**
 * Inicia y ejecuta un análisis matemático completo para un término de búsqueda
 */
export async function runAnalysis(query) {
  return request('/analysis/run', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
