const knastaService = require('../services/knastaService');

/**
 * Busca productos en Knasta
 */
async function searchProducts(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'El parámetro "query" es requerido.' });
    }

    const products = await knastaService.searchProduct(query);
    return res.json({ products });
  } catch (error) {
    console.error('ProductController: Error al buscar productos:', error.message);
    return res.status(500).json({ error: 'Error al buscar productos en Knasta.cl' });
  }
}

module.exports = {
  searchProducts
};
