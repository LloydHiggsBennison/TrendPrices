const knastaService = require("../services/knastaService");

/**
 * Busca productos en Knasta
 */
async function searchProducts(req, res) {
  try {
    const query =
      typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query || query.length > 200) {
      return res
        .status(400)
        .json({ error: 'El parámetro "query" es requerido.' });
    }

    const result = await knastaService.searchProduct(query, {
      includeMetadata: true,
    });
    return res.json(Array.isArray(result) ? { products: result } : result);
  } catch (error) {
    console.error(
      "ProductController: Error al buscar productos:",
      error.message,
    );
    return res
      .status(500)
      .json({ error: "Error al buscar productos en Knasta.cl" });
  }
}

module.exports = {
  searchProducts,
};
