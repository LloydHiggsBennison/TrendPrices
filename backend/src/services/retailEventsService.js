/**
 * Servicio de Eventos de Retail
 * -----------------------------
 * Mantiene un calendario de eventos comerciales recurrentes en Chile que históricamente
 * generan caídas de precio anómalas (fuera de la tendencia normal). El motor de proyección
 * usa esto para anticipar bajadas de precio que la sola regresión lineal no vería venir.
 *
 * Las fechas son aproximadas/recurrentes: para eventos con fecha variable (CyberDay, CyberMonday)
 * se usa una ventana histórica típica. Para eventos fijos (Navidad, Fiestas Patrias) se usa la fecha exacta.
 * impactoPromedio es el porcentaje de descuento adicional típico observado en retail chileno durante el evento.
 */

const EVENTS = [
  { nombre: 'CyberDay', mes: 6, diaInicio: 2, diaFin: 4, impactoPromedio: -0.12 },
  { nombre: 'Fiestas Patrias', mes: 9, diaInicio: 16, diaFin: 19, impactoPromedio: -0.05 },
  { nombre: 'CyberMonday', mes: 11, diaInicio: 3, diaFin: 4, impactoPromedio: -0.10 },
  { nombre: 'Black Friday', mes: 11, diaInicio: 24, diaFin: 30, impactoPromedio: -0.15 },
  { nombre: 'CyberDay (edición fin de año)', mes: 10, diaInicio: 6, diaFin: 8, impactoPromedio: -0.10 },
  { nombre: 'Navidad', mes: 12, diaInicio: 20, diaFin: 25, impactoPromedio: -0.08 },
  { nombre: 'Año Nuevo / Liquidaciones de Verano', mes: 1, diaInicio: 1, diaFin: 10, impactoPromedio: -0.06 }
];

/**
 * Revisa si una fecha específica cae dentro de alguna ventana de evento (para cualquier año).
 * @param {Date} date
 * @returns {Object|null} Evento aplicable o null
 */
function getEventForDate(date) {
  const mes = date.getMonth() + 1;
  const dia = date.getDate();

  const match = EVENTS.find(ev => ev.mes === mes && dia >= ev.diaInicio && dia <= ev.diaFin);
  return match || null;
}

/**
 * Devuelve todos los eventos que caen dentro de un rango de N días desde una fecha base.
 * Útil para mostrarle al usuario "hay un CyberDay en 3 días, quizás conviene esperar".
 * @param {Date} baseDate
 * @param {number} daysAhead
 * @returns {Array<{nombre: string, fecha: string, impactoPromedio: number, diasRestantes: number}>}
 */
function getUpcomingEvents(baseDate, daysAhead = 7) {
  const upcoming = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const ev = getEventForDate(d);
    if (ev) {
      upcoming.push({
        nombre: ev.nombre,
        fecha: d.toISOString().split('T')[0],
        impactoPromedio: ev.impactoPromedio,
        diasRestantes: i
      });
    }
  }
  return upcoming;
}

module.exports = {
  getEventForDate,
  getUpcomingEvents
};
