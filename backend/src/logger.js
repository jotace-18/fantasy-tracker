/**
 * Simple Logger
 * -------------
 * Logger mínimo sin dependencias externas que respeta un nivel de log
 * configurable vía variable de entorno `LOG_LEVEL` (debug|info|warn|error).
 *
 * Diseño:
 *  - Niveles ordenados: debug < info < warn < error.
 *  - Sólo se imprimen mensajes cuyo nivel sea >= LOG_LEVEL.
 *  - Formato uniforme: ISO timestamp + nivel en mayúsculas + mensaje.
 *  - Permite `meta` opcional (objeto u otro valor) que se pasa como segundo argumento a console.log.
 *
 * Uso rápido:
 *  const logger = require('./logger');
 *  logger.info('Servidor iniciado');
 *  logger.debug('Payload', data);
 *
 * En tests se silencia a través de configuración Jest (setup que ajusta LOG_LEVEL o mockea console).
 */
const { LOG_LEVEL } = require('./config');

const LEVELS = ['debug','info','warn','error'];

/** Evalúa si un nivel debe mostrarse según LOG_LEVEL actual. */
function should(level){
  return LEVELS.indexOf(level) >= LEVELS.indexOf(LOG_LEVEL);
}

/** Construye la línea de log con timestamp ISO y nivel. */
function stamp(level, msg){
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${msg}`;
}

/**
 * Imprime un mensaje si procede el nivel.
 * @param {('debug'|'info'|'warn'|'error')} level
 * @param {string} msg Mensaje principal.
 * @param {*} [meta] Información adicional opcional.
 */
function log(level, msg, meta){
  if(!should(level)) return;
  if(meta !== undefined) console.log(stamp(level,msg), meta); else console.log(stamp(level,msg));
}

module.exports = {
  /** Log nivel debug (el más verboso). */
  debug:(m,x)=>log('debug',m,x),
  /** Log informativo estándar. */
  info:(m,x)=>log('info',m,x),
  /** Log de advertencia (no rompe flujo). */
  warn:(m,x)=>log('warn',m,x),
  /** Log de error (condición anómala). */
  error:(m,x)=>log('error',m,x)
};
