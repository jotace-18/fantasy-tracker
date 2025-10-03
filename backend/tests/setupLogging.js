// Silencia logs ruidosos durante tests (fase afterEnv) y permite restaurar originales.
const orig = global.__ORIG_CONSOLE__ || {
  log: console.log,
  info: console.info,
  debug: console.debug || (()=>{})
};

beforeAll(() => {
  if(process.env.VERBOSE_TESTS === '1') {
    // Restaurar en modo verbose si venimos silenciados del preSetup
    console.log = orig.log;
    console.info = orig.info;
    console.debug = orig.debug;
    return;
  }
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
});

afterAll(() => {
  console.log = orig.log;
  console.info = orig.info;
  console.debug = orig.debug;
});
