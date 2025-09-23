// backend/src/services/clockService.js
// Servicio para el reloj interno de la Liga


// Reloj en tiempo real: siempre devuelve la hora real del sistema
function getCurrentTime() {
  return new Date();
}

// Métodos de simulación quedan como no operativos (opcional)
function setCurrentTime(date) {
  // No hace nada en modo real time
}
function advanceMinutes(mins) {
  // No hace nada en modo real time
}

module.exports = {
  getCurrentTime,
  setCurrentTime,
  advanceMinutes,
};
