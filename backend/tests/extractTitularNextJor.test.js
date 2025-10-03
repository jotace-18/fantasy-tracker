// backend/tests/extractTitularNextJor.test.js (convertido a Jest)
const cheerio = require('cheerio');
// Importamos directamente la función del servicio
// scraperService define extractTitularNextJor dentro del archivo. Para testearla
// sin export explícito podríamos re-requerir con un hack, pero preferimos
// exponerla añadiéndola a module.exports en el servicio si aún no lo está.
// Como ya se usa en tests previos por require('../src/services/scraperService')
// asumimos que está exportada (si no, el test fallará claramente indicando el paso a seguir).
const { extractTitularNextJor } = require('../src/services/scraperService');

describe('extractTitularNextJor', () => {
  test('70% -> 0.7', () => {
    const html = `<div class="cuadro"><strong>Titular J8</strong><div class='probabilidad'><span class='prob-3'>70%</span></div></div>`;
    const $ = cheerio.load(html);
    expect(extractTitularNextJor($)).toBe(0.7);
  });

  test('0% -> 0', () => {
    const html = `<div class='cuadro'><strong>Titular J8</strong><div class='probabilidad'><span class='prob-0'>0%</span></div></div>`;
    const $ = cheerio.load(html);
    expect(extractTitularNextJor($)).toBe(0);
  });

  test('Fallback regex 55% -> 0.55', () => {
    const html = `<div class='cuadro'><strong>Titular J9</strong><div>No span aquí 55% restante</div></div>`;
    const $ = cheerio.load(html);
    expect(extractTitularNextJor($)).toBe(0.55);
  });

  test('Sin bloque -> null', () => {
    const html = `<div><strong>Otra cosa</strong></div>`;
    const $ = cheerio.load(html);
    expect(extractTitularNextJor($)).toBeNull();
  });

  test('Texto inválido -> null', () => {
    const html = `<div class='cuadro'><strong>Titular J10</strong><div class='probabilidad'><span>XX%</span></div></div>`;
    const $ = cheerio.load(html);
    expect(extractTitularNextJor($)).toBeNull();
  });
});
