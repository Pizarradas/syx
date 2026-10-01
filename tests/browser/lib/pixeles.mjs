/**
 * SYX — Medir en píxeles lo que axe no puede resolver
 * ───────────────────────────────────────────────────
 * axe calcula el contraste leyendo estilos. Cuando el fondo no sale de un
 * `background-color` —un degradado, una imagen, un pseudoelemento, otro
 * elemento encima— no decide y lo deja como «incomplete». Hasta octubre de
 * 2026 eso se tiraba: el arnés solo pedía `violations`, así que todo lo que
 * axe no sabía medir pasaba como si cumpliera.
 *
 * Aquí se mide de verdad: se fotografía el elemento con su texto y sin él
 * (color transparente solo en el elemento; los hijos conservan el suyo). Los
 * píxeles que cambian son los del texto, y en la foto sin texto se ve qué
 * fondo hay EXACTAMENTE detrás de cada uno. El contraste es el del color del
 * texto contra ese fondo, píxel a píxel, y cuenta el peor: un texto que
 * cruza un degradado se lee tan mal como su tramo más claro.
 *
 * Y el foco: dos fotos de un control, sin foco y con foco de teclado, y se
 * cuenta cuántos píxeles cambian y con cuánto contraste entre el antes y el
 * después (WCAG 2.4.11 y 2.4.13). (Auditoría 2026-10 · acción 8)
 */

import { PNG } from 'pngjs';

// ─── Color ───────────────────────────────────────────────────────────────────

const lineal = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminancia = ([r, g, b]) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
export const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Un color con alfa sobre un fondo opaco. */
export const sobre = ([r, g, b, a], [R, G, B]) => {
  const al = a / 255;
  return [r * al + R * (1 - al), g * al + G * (1 - al), b * al + B * (1 - al)];
};
export const hex = (c) => `#${c.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;

const leer = (buf) => PNG.sync.read(buf);

/** El rectángulo visible de un elemento, en coordenadas de la ventana, o null. */
async function caja(page, handle) {
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.floor(r.left)), y = Math.max(0, Math.floor(r.top));
    const w = Math.min(innerWidth, Math.ceil(r.right)) - x, h = Math.min(innerHeight, Math.ceil(r.bottom)) - y;
    return w > 0 && h > 0 ? { x, y, width: w, height: h } : null;
  });
}

const dosFotogramas = (page) => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));

// ─── Contraste de un texto ───────────────────────────────────────────────────

/**
 * Contraste real del texto de un elemento (selector de axe) contra lo que
 * tiene detrás. Devuelve { ratio, requerido, fg, bg, pixeles } o { error }.
 */
export async function contrasteDeTexto(page, selector, { requerido: req } = {}) {
  const el = await page.$(selector);
  if (!el) return { error: 'el selector no encuentra el elemento' };
  await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }));
  await dosFotogramas(page);
  const info = await el.evaluate((e) => {
    const cs = getComputedStyle(e);
    const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = cs.color;
    cv.fillRect(0, 0, 1, 1);
    const tam = parseFloat(cs.fontSize), peso = Number(cs.fontWeight) || 400;
    return { fg: [...cv.getImageData(0, 0, 1, 1).data], grande: tam >= 24 || (tam >= 18.66 && peso >= 700) };
  });
  const clip = await caja(page, el);
  if (!clip) return { error: 'el elemento no tiene caja visible' };

  const con = leer(await page.screenshot({ clip, animations: 'disabled', caret: 'hide' }));
  // Sin el texto del elemento: los hijos se fijan a su color calculado para
  // que no hereden el transparente, y se restaura todo después.
  await el.evaluate((e) => {
    const todos = [e, ...e.querySelectorAll('*')];
    window.__syxEstilos = todos.map((n) => [n, n.getAttribute('style')]);
    for (const n of todos.slice(1)) n.style.setProperty('color', getComputedStyle(n).color, 'important');
    e.style.setProperty('color', 'transparent', 'important');
    e.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
    e.style.setProperty('text-shadow', 'none', 'important');
  });
  await dosFotogramas(page);
  const sin = leer(await page.screenshot({ clip, animations: 'disabled', caret: 'hide' }));
  await el.evaluate(() => {
    for (const [n, s] of window.__syxEstilos) (s === null ? n.removeAttribute('style') : n.setAttribute('style', s));
    delete window.__syxEstilos;
  });

  let peor = Infinity, bgPeor = null, pixeles = 0;
  for (let i = 0; i < con.data.length; i += 4) {
    const a = con.data, b = sin.data;
    if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]) continue;
    pixeles++;
    const bg = [b[i], b[i + 1], b[i + 2]];
    const r = contraste(sobre(info.fg, bg), bg);
    if (r < peor) { peor = r; bgPeor = bg; }
  }
  if (!pixeles) return { error: 'quitar el texto no cambia ningún píxel (texto oculto o fuera de la caja)' };
  return { ratio: +peor.toFixed(2), requerido: req || (info.grande ? 3 : 4.5), fg: hex(info.fg), bg: hex(bgPeor), pixeles };
}

// ─── Apariencia del foco ─────────────────────────────────────────────────────

/**
 * Compara dos fotos (sin foco y con foco) del mismo recorte. Devuelve cuántos
 * píxeles cambian con un contraste ≥ 3:1 entre su color de antes y el de
 * después, que es lo que WCAG 2.4.13 cuenta como «área del indicador».
 */
export function cambioDeFoco(antes, despues) {
  const a = leer(antes), b = leer(despues);
  let cambiados = 0, conContraste = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2]) continue;
    cambiados++;
    if (contraste([a.data[i], a.data[i + 1], a.data[i + 2]], [b.data[i], b.data[i + 1], b.data[i + 2]]) >= 3) conContraste++;
  }
  return { cambiados, conContraste };
}

export { caja, dosFotogramas };
