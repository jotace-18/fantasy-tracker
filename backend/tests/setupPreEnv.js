// Se ejecuta antes de cargar módulos de la app para silenciar ruido externo (dotenv, etc.)
if(process.env.VERBOSE_TESTS === '1') {
  // modo verbose: no tocamos nada
} else {
  const noop = () => {};
  // Guardamos originales en variables globales para restaurar luego si hiciera falta
  if(!global.__ORIG_CONSOLE__) {
    global.__ORIG_CONSOLE__ = {
      log: console.log,
      info: console.info,
      debug: console.debug,
    };
  }
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
