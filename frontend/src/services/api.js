const base = (
  import.meta.env?.VITE_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");
const API_URL = base.endsWith("/api") ? base : `${base}/api`;
async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    const data = await response.json().catch(() => {
      throw new Error(
        "El servidor no devolvió una respuesta válida. Inténtalo nuevamente.",
      );
    });
    if (!response.ok)
      throw new Error(data.error || "No se pudo completar la solicitud.");
    return data;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "La consulta tardó demasiado. Inténtalo nuevamente en unos momentos.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "No se pudo conectar con el servidor de análisis. Revisa tu conexión e inténtalo nuevamente.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export function searchProducts(query) {
  return request(`/products/search?query=${encodeURIComponent(query)}`);
}
function validatedAnalysis(data) {
  if (data.analysisVersion !== 2)
    throw new Error(
      "El servidor de análisis necesita actualizarse a la versión 2. No se mostrarán resultados de la versión anterior.",
    );
  return data;
}
export async function getAnalysis(productId) {
  return validatedAnalysis(
    await request(`/analysis/${encodeURIComponent(productId)}`),
  );
}
export async function runAnalysis(query, productUrl) {
  return validatedAnalysis(
    await request("/analysis/run", {
      method: "POST",
      body: JSON.stringify({ query, productUrl }),
    }),
  );
}
