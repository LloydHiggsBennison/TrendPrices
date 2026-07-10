/**
 * Normaliza un precio en formato texto o número a un valor entero limpio.
 * Ejemplo: "$ 99.990" -> 99990
 * @param {string|number} priceVal 
 * @returns {number}
 */
function normalizePrice(priceVal) {
  if (priceVal === null || priceVal === undefined) return 0;
  if (typeof priceVal === 'number') return Math.round(priceVal);
  
  // Quitar signo $, puntos, comas, espacios y convertir a entero
  const cleanStr = priceVal.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

module.exports = normalizePrice;
