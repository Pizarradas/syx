#!/usr/bin/env node
/**
 * SYX — El foco se ve, y el tabulador recorre sin atascarse
 * ─────────────────────────────────────────────────────────
 * axe no mira el foco: no hay regla suya que compruebe que un control
 * enfocado se distingue de uno que no lo está. stylelint prohíbe tokens de
 * sombra en outline y el mixin focus-ring() existe, pero nada comprobaba que
 * cada componente lo usara de verdad: un `outline: none` sin sustituto pasaba
 * la cadena entera. Esto lo mide en píxeles (auditoría 2026-10, acción 8):
 *
 *   FOCO VISIBLE (WCAG 2.4.7, 2.4.11 y 2.4.13)
 *   Para cada elemento enfocable de cada `usage`, en cada tema y modo: foto
 *   de su sección sin foco y con foco de teclado (:focus-visible). Cuenta los
 *   píxeles que cambian con un contraste ≥ 3:1 entre su color de antes y el de
 *   después, y exige al menos el área de un perímetro de 2 px alrededor del
 *   control (2 × perímetro), que es el mínimo de 2.4.13.
 *
 *   ORDEN Y TRAMPAS (WCAG 2.1.2 y 2.4.3)
 *   Tab desde el principio de la página recorre TODOS los enfocables
 *   (tabindex ≥ 0, visibles, sin inert) en el orden del documento, una vez
 *   cada uno, y sale por el final: ninguno atrapa. Y al revés: un diálogo
 *   abierto con showModal() SÍ debe atrapar —Tab no puede salir de él.
 *
 * Uso (desde la raíz, con el CSS compilado):
 *   node tests/browser/foco.mjs [--temas a,b] [--solo-foco | --solo-orden]
 */

import { MODOS, arg, bandera, temas as leerTemas, servir, lanzar, abrirComponentes, agrupar } from './lib/comun.mjs';
import { cambioDeFoco, dosFotogramas } from './lib/pixeles.mjs';

const temas = leerTemas();
const soloFoco = bandera('--solo-foco'), soloOrden = bandera('--solo-orden');
// A escala 2 cada píxel CSS son cuatro: el borde suavizado de un anillo de
// 2 px (el que no llega a 3:1 porque solo está medio pintado) pesa la mitad
// que a escala 1, y el área medida se acerca a la que define WCAG en px CSS.
const ESCALA = 2;
// Los popovers, como en una página real: en el flujo, la burbuja de
// mol-tooltip tapaba el anillo de su propio disparador.
const { srv, base } = await servir({ pagina: { popovers: 'intactos' } });
const navegador = await lanzar();
const page = await navegador.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: ESCALA, reducedMotion: 'reduce' });
const fallos = [];

// Lo que el navegador deja enfocar. `[tabindex]` incluye -1: una pestaña
// inactiva o una opción de menú no están en el orden de Tab, pero reciben el
// foco con las flechas y también tienen que verse.
const ENFOCABLES = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable=true], audio[controls], video[controls]';

/**
 * Marca los enfocables visibles (data-syx-foco = prefijo + índice) y
 * devuelve su descripción. Un control nativo escondido para pintar uno propio
 * (check, radio, switch: el <input> mide 0×0 y lo que se ve es su <label>)
 * cuenta como visible si su etiqueta se ve.
 */
const marcar = (sel, prefijo = 'p') => page.evaluate(([sel, prefijo]) => {
  const visible = (el) => {
    if (el.closest('[inert], [hidden]') || el.disabled) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return true;
    const l = el.labels && el.labels[0];
    return !!l && l.getBoundingClientRect().width > 0;
  };
  // Un grupo de radios es UNA parada de Tab: la marcada, o la primera.
  const paradaDeRadio = (el) => {
    if (el.type !== 'radio' || !el.name) return true;
    const grupo = [...document.querySelectorAll(`input[type=radio][name="${CSS.escape(el.name)}"]`)].filter((r) => r.form === el.form);
    const parada = grupo.find((r) => r.checked) || grupo[0];
    return parada === el;
  };
  return [...document.querySelectorAll(sel)].filter(visible).map((el, k) => {
    const i = `${prefijo}${k}`;
    el.dataset.syxFoco = i;
    const sec = el.closest('[data-componente]');
    const id = el.id ? `#${el.id}` : '';
    const clase = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');
    return { i, componente: sec ? sec.dataset.componente : '(página)', que: `${el.tagName.toLowerCase()}${id}${clase}`, tab: paradaDeRadio(el) ? el.tabIndex : -1 };
  });
}, [sel, prefijo]);

// ─── Foco visible ────────────────────────────────────────────────────────────

async function recorte(i) {
  return page.evaluate((i) => {
    const el = document.querySelector(`[data-syx-foco="${i}"]`);
    // Lo que está en un popover abierto ya está colocado junto a su
    // disparador (que se desplazó a la vista al abrirlo).
    if (!el.closest(':popover-open')) el.scrollIntoView({ block: 'center', inline: 'center' });
    const sec = el.closest('[data-componente]') || el.parentElement;
    const caja = el.getBoundingClientRect();
    const e = caja.width > 0 && caja.height > 0 ? caja : el.labels[0].getBoundingClientRect();
    // El perímetro es el del control que se ve. En un control dibujado dentro
    // de su etiqueta, ese control es la mayor de las piezas dibujadas (un
    // pseudoelemento con tamaño —la caja del check, el círculo del radio— o
    // un elemento aria-hidden —la pista del switch—), no la etiqueta entera
    // con su texto, que haría el mínimo injustamente grande.
    // Perímetro de un rectángulo redondeado: un control circular (radio) o una
    // píldora (switch) tienen menos borde que su caja, y WCAG mide el borde.
    const radio = (cs, w, h) => {
      const v = cs.borderTopLeftRadius || '0';
      const r = v.endsWith('%') ? (parseFloat(v) / 100) * Math.min(w, h) : parseFloat(v) || 0;
      return Math.min(r, Math.min(w, h) / 2);
    };
    let lados = [e.width, e.height, radio(getComputedStyle(e === caja ? el : el.labels[0]), e.width, e.height)];
    if (e !== caja) {
      const l = el.labels[0];
      const piezas = [];
      for (const n of [l, ...l.querySelectorAll('*')]) {
        if (n === el) continue;
        for (const p of ['::before', '::after']) {
          const cs = getComputedStyle(n, p);
          const w = parseFloat(cs.width), h = parseFloat(cs.height);
          if (cs.content !== 'none' && cs.display !== 'none' && w > 0 && h > 0) piezas.push([w, h, radio(cs, w, h)]);
        }
        if (n.getAttribute('aria-hidden') === 'true') {
          const r = n.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) piezas.push([r.width, r.height, radio(getComputedStyle(n), r.width, r.height)]);
        }
      }
      if (piezas.length) lados = piezas.sort((a, b) => b[0] * b[1] - a[0] * a[1])[0];
    }
    const r = sec.getBoundingClientRect();
    const x = Math.max(0, Math.floor(Math.min(r.left, e.left) - 8)), y = Math.max(0, Math.floor(Math.min(r.top, e.top) - 8));
    const w = Math.min(innerWidth, Math.ceil(Math.max(r.right, e.right) + 8)) - x;
    const h = Math.min(innerHeight, Math.ceil(Math.max(r.bottom, e.bottom) + 8)) - y;
    const [lw, lh, lr] = lados;
    return { clip: { x, y, width: w, height: h }, perimetro: 2 * (lw + lh) - 8 * lr + 2 * Math.PI * lr };
  }, i);
}

async function medirFoco(lista, tema, modo, preparar = async () => {}) {
  for (const el of lista) {
    // Sin foco: nada enfocado y el puntero fuera de la página.
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.mouse.move(0, 0);
    await preparar();
    const { clip, perimetro } = await recorte(el.i);
    if (clip.width <= 0 || clip.height <= 0) {
      fallos.push({ prueba: 'foco', ...el, tema, modo, detalle: 'no queda a la vista ni desplazándose hasta él' });
      continue;
    }
    await dosFotogramas(page);
    const antes = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
    // Foco «de teclado»: una tecla antes del focus() hace que Chromium lo
    // trate como navegación por teclado y aplique :focus-visible.
    await page.keyboard.press('Shift');
    await page.evaluate((i) => document.querySelector(`[data-syx-foco="${i}"]`).focus({ preventScroll: true }), el.i);
    const enfocado = await page.evaluate((i) => document.activeElement === document.querySelector(`[data-syx-foco="${i}"]`) &&
      document.activeElement.matches(':focus-visible'), el.i);
    await dosFotogramas(page);
    const despues = await page.screenshot({ clip, animations: 'disabled', caret: 'hide' });
    const medida = cambioDeFoco(antes, despues);
    const cambiados = Math.round(medida.cambiados / ESCALA ** 2), conContraste = Math.round(medida.area / ESCALA ** 2);
    const minimo = Math.round(2 * perimetro);
    if (!enfocado) fallos.push({ prueba: 'foco', ...el, tema, modo, detalle: 'no recibe el foco de teclado (:focus-visible)' });
    else if (conContraste < minimo) {
      fallos.push({ prueba: 'foco', ...el, tema, modo, detalle: `el indicador de foco mide ${conContraste} px con contraste ≥ 3:1 (cambian ${cambiados}); hacen falta ${minimo} (perímetro ${Math.round(perimetro)} px × 2)` });
    }
  }
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
}

async function focoVisible(tema, modo) {
  const lista = await marcar(ENFOCABLES);
  await medirFoco(lista, tema, modo);
  // Lo que vive en un popover cerrado (las opciones de mol-menu) se mide con
  // el popover abierto, uno cada vez, que es como se ve al usarlo.
  const pops = await page.evaluate(() => [...document.querySelectorAll('[data-componente] [popover]')].map((p, k) => { p.dataset.syxPop = String(k); return k; }));
  let n = lista.length;
  for (const k of pops) {
    // Quitar el foco de una opción cierra el menú (js/syx-menu.js lo cierra
    // cuando el foco sale): se reabre antes de cada foto.
    const abrir = () => page.evaluate((k) => {
      const p = document.querySelector(`[data-syx-pop="${k}"]`);
      if (p.matches(':popover-open')) return;
      // Con su disparador como origen, como al pulsarlo: sin él no hay ancla
      // implícita y el popover se coloca en la esquina de la ventana.
      const disparador = document.querySelector(`[popovertarget="${p.id}"]`);
      if (disparador) disparador.scrollIntoView({ block: 'center' });
      p.showPopover(disparador ? { source: disparador } : undefined);
    }, k);
    await abrir();
    const dentro = await marcar(`[data-syx-pop="${k}"] :is(${ENFOCABLES})`, `pop${k}-`);
    await medirFoco(dentro, tema, modo, abrir);
    await page.evaluate((k) => { const p = document.querySelector(`[data-syx-pop="${k}"]`); if (p.matches(':popover-open')) p.hidePopover(); }, k);
    n += dentro.length;
  }
  return n;
}

// ─── Orden de tabulación y trampas ───────────────────────────────────────────

async function ordenYTrampas(tema, modo) {
  const esperados = (await marcar(ENFOCABLES)).filter((e) => e.tab >= 0);
  // El punto de partida de Tab es el último elemento enfocado, no el
  // principio: blur() no lo mueve, y los diálogos abiertos con show() ya se
  // han llevado el foco. Se enfoca un ancla fuera del orden (tabindex=-1) al
  // principio del documento y se arranca desde ahí.
  await page.evaluate(() => {
    const ancla = document.createElement('div');
    ancla.tabIndex = -1;
    ancla.id = 'syx-inicio';
    document.body.prepend(ancla);
    ancla.focus();
    window.scrollTo(0, 0);
  });
  const visto = [];
  // Tab desde el documento. Como mucho el doble de pasos que enfocables:
  // si para entonces no ha salido por el final, algo lo retiene.
  for (let paso = 0; paso < esperados.length * 2 + 5; paso++) {
    await page.keyboard.press('Tab');
    const i = await page.evaluate(() => {
      const a = document.activeElement;
      return !a || a === document.body ? null : (a.dataset.syxFoco ?? `fuera:${a.tagName.toLowerCase()}`);
    });
    if (i === null) break; // salió del documento: recorrido completo
    visto.push(i);
  }
  const orden = esperados.map((e) => String(e.i));
  const nombre = (i) => esperados.find((e) => String(e.i) === i) || { componente: '(página)', que: i };
  if (visto.length > orden.length) {
    const repetido = visto.find((x, k) => visto.indexOf(x) !== k);
    const e = nombre(repetido);
    fallos.push({ prueba: 'trampa', ...e, tema, modo, detalle: `Tab no sale de la página: tras ${visto.length} pulsaciones vuelve a ${e.que} (hay ${orden.length} enfocables)` });
  } else {
    for (let k = 0; k < orden.length; k++) {
      if (visto[k] === orden[k]) continue;
      const e = nombre(orden[k]);
      fallos.push({ prueba: 'orden', ...e, tema, modo, detalle: visto[k] === undefined
        ? `Tab no llega nunca a ${e.que}`
        : `Tab llega a ${nombre(visto[k]).que} (${nombre(visto[k]).componente}) cuando tocaba ${e.que}` });
      break;
    }
  }

  // Un diálogo modal SÍ atrapa: abierto con showModal(), Tab no sale de él.
  const modales = await page.evaluate(() => [...document.querySelectorAll('[data-componente] dialog')].map((d, k) => {
    d.dataset.syxModal = String(k);
    return { k, componente: d.closest('[data-componente]').dataset.componente };
  }));
  for (const m of modales) {
    const n = await page.evaluate((k) => {
      const d = document.querySelector(`[data-syx-modal="${k}"]`);
      d.close();
      d.showModal();
      return d.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length;
    }, m.k);
    let escapa = null;
    for (let paso = 0; paso < n * 2 + 3; paso++) {
      await page.keyboard.press('Tab');
      escapa = await page.evaluate((k) => {
        const a = document.activeElement;
        // Al salir del último control el foco pasa por la interfaz del
        // navegador (activeElement = body) y vuelve al diálogo: eso no es
        // escapar. Escapar es llegar a un elemento de la página de debajo.
        return a && a !== document.body && !document.querySelector(`[data-syx-modal="${k}"]`).contains(a) ? a.tagName.toLowerCase() + (a.id ? `#${a.id}` : '') : null;
      }, m.k);
      if (escapa) break;
    }
    await page.evaluate((k) => { const d = document.querySelector(`[data-syx-modal="${k}"]`); d.close(); d.show(); }, m.k);
    if (escapa) fallos.push({ prueba: 'trampa', componente: m.componente, que: 'dialog', tema, modo, detalle: `el diálogo modal no atrapa el foco: Tab llega a ${escapa}, debajo` });
  }
  return { enfocables: orden.length, modales: modales.length };
}

// ─── Principal ───────────────────────────────────────────────────────────────

console.log(`\n── FOCO · ${temas.length} temas × ${MODOS.length} modos ──\n`);
for (const tema of temas) {
  for (const modo of MODOS) {
    await abrirComponentes(page, base, tema, modo);
    const antes = fallos.length;
    let n = 0;
    if (!soloOrden) n = await focoVisible(tema, modo);
    let orden = null;
    // El orden no depende del tema: se recorre en el primero.
    if (!soloFoco && tema === temas[0] && modo === MODOS[0]) {
      await abrirComponentes(page, base, tema, modo);
      orden = await ordenYTrampas(tema, modo);
    }
    console.log(`${fallos.length > antes ? '❌' : '✅'} ${tema.padEnd(12)} ${modo.padEnd(5)} ${n ? `${n} enfocables con foco visible` : ''}${orden ? `${n ? ' · ' : ''}Tab recorre ${orden.enfocables} sin trampas · ${orden.modales} diálogo(s) modal(es) atrapan` : ''}${fallos.length > antes ? ` · ${fallos.length - antes} fallo(s)` : ''}`);
  }
}

await navegador.close();
srv.close();

if (fallos.length) {
  console.log('\n── Fallos ──');
  for (const f of agrupar(fallos, (x) => `${x.prueba}|${x.componente}|${x.que}`, (x) => `${x.tema}/${x.modo}`)) {
    console.log(`\n❌ ${f.componente} · ${f.que} · ${f.prueba} — ${[...f.donde].join(', ')}`);
    console.log(`   ${f.detalle}`);
  }
  console.log('');
  process.exitCode = 1;
} else {
  console.log('\n   El foco se ve en todos los enfocables y el tabulador recorre la página entera.\n');
}
