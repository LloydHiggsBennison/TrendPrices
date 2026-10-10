function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function filterSearchResults(products, query) {
  const normalized = normalize(query);
  // Numeric model identifiers must survive the source's automatic correction.
  const identifiers = normalized.match(/\d+(?:[.,]\d+)?/g) || [];
  const words = normalized.match(/[a-z]+/g) || [];
  return products
    .filter((product) => {
      const numbers = normalize(product.name).match(/\d+(?:[.,]\d+)?/g) || [];
      return identifiers.every((id) => numbers.includes(id));
    })
    .map((product, index) => ({
      product,
      index,
      score: words.filter((word) => normalize(product.name).includes(word))
        .length,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.product);
}
module.exports = { filterSearchResults, normalize };
