// backend/src/services/clockService.js
/**
 * Clock Service
 * -------------
 * Servicio de tiempo. Actualmente opera en "modo realtime" y devuelve
 * siempre la hora del sistema. Hooks para futuras simulaciones (set/advance).
 */


// Reloj en tiempo real: siempre devuelve la hora real del sistema
/** Devuelve la hora actual (Date) del sistema. */
function getCurrentTime() {
  return new Date();
}

// Métodos de simulación quedan como no operativos (opcional)
/** Placeholder para modo simulado (sin implementación). */
function setCurrentTime(date) {
  // No hace nada en modo real time
}
/** Placeholder para avanzar minutos en modo simulado. */
function advanceMinutes(mins) {
  // No hace nada en modo real time
}

module.exports = {
  getCurrentTime,
  setCurrentTime,
  advanceMinutes,
};
