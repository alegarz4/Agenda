/* Utilidades de fecha reservadas para la logica de planeacion futura. */

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export { getTodayIsoDate };
