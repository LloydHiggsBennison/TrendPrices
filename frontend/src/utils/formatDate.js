/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español
 * Ejemplo: "2026-07-10" -> "10 Jul, 2026"
 * @param {string} dateString 
 * @param {boolean} shortMode 
 * @returns {string}
 */
export default function formatDate(dateString, shortMode = false) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString + 'T12:00:00'); // Evitar desfase de zona horaria
    if (isNaN(date.getTime())) return dateString;

    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    if (shortMode) {
      return `${day} ${month}`;
    }
    
    return `${day} ${month}, ${year}`;
  } catch (e) {
    return dateString;
  }
}
