/**
 * Normaliza una fecha a formato YYYY-MM-DD
 * Soporta formatos: "DD-MM-YYYY", "YYYY-MM-DD" e instancias de Date.
 * @param {string|Date} dateVal 
 * @returns {string}
 */
function normalizeDate(dateVal) {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  
  if (typeof dateVal === 'string') {
    // Si tiene guión y el formato es DD-MM-YYYY
    const partsDash = dateVal.split('-');
    if (partsDash.length === 3) {
      if (partsDash[0].length === 2 && partsDash[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM-DD
        return `${partsDash[2]}-${partsDash[1]}-${partsDash[0]}`;
      }
      if (partsDash[0].length === 4) {
        // YYYY-MM-DD
        return dateVal;
      }
    }

    // Si tiene slash (/) y el formato es DD/MM/YYYY o YYYY/MM/DD
    const partsSlash = dateVal.split('/');
    if (partsSlash.length === 3) {
      if (partsSlash[0].length === 2 && partsSlash[2].length === 4) {
        return `${partsSlash[2]}-${partsSlash[1]}-${partsSlash[0]}`;
      }
      if (partsSlash[0].length === 4) {
        return `${partsSlash[0]}-${partsSlash[1]}-${partsSlash[2]}`;
      }
    }
  }
  
  // Intento fallback con constructor Date
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // ignorar y retornar fecha de hoy
  }
  
  return new Date().toISOString().split('T')[0];
}

module.exports = normalizeDate;
