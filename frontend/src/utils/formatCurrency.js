/**
 * Formatea un número como pesos chilenos (CLP)
 * Ejemplo: 99990 -> "$ 99.990"
 * @param {number} value 
 * @returns {string}
 */
export default function formatCurrency(value) {
  if (value === null || value === undefined) return '$ 0';
  
  const rounded = Math.round(value);
  return `$ ${rounded.toLocaleString('es-CL')}`;
}
