/**
 * SYX — Teclado y colocación de .mol-menu
 * ───────────────────────────────────────
 * La lista es un popover="auto": el navegador ya la abre y la cierra con el
 * botón (popovertarget), la cierra al pulsar fuera y con Escape, y la pone en
 * la capa superior. Esto añade lo que un menú promete y el popover no trae,
 * el patrón de botón de menú de WAI-ARIA (APG, «Menu Button»):
 *
 *   en el botón   ↓ Intro Espacio   abre y enfoca la primera opción
 *                 ↑                 abre y enfoca la última
 *   en la lista   ↓ ↑               siguiente / anterior (vuelve al principio)
 *                 Inicio Fin        primera / última
 *                 una letra         la siguiente opción que empieza por ella
 *                 Escape Tab        cierra y devuelve el foco al botón
 *                 Intro Espacio     activa la opción; el menú se cierra
 *
 * Además: aria-expanded sigue al estado real, las opciones salen del orden de
 * tabulación (tabindex="-1": se recorren con flechas) y la lista se coloca
 * bajo el botón, alineada a su inicio —encima si debajo no cabe—. CSS anchor
 * positioning lo haría sin script, pero no está en el soporte mínimo (Chrome
 * 111 · Safari 16.2 · Firefox 121). Sin Popover API (Safari < 17) la lista se
 * oculta con `hidden`, y el clic fuera y Escape los pone este script.
 *
 * La colocación repite la de syx-tooltip.js a propósito: cada fichero se
 * importa solo y sin dependencias, y docs.html los incrusta tal cual.
 *
 * Marcado que espera — ver scss/molecules/_menu.scss:
 *
 *   <button class="mol-menu__trigger" aria-haspopup="menu" aria-expanded="false"
 *           aria-controls="m-list" popovertarget="m-list">…</button>
 *   <div class="mol-menu__list" id="m-list" role="menu" popover="auto">
 *     <button class="mol-menu__item" type="button" role="menuitem">…</button>
 *   </div>
 *
 * Uso, con empaquetador (Vite, webpack, Rollup):
 *       import 'syx-design-system/js/syx-menu.js';
 *       import { initMenus } from 'syx-design-system/js/syx-menu.js';
 *       initMenus(contenedor);                         // marcado que llega después
 *
 * (Auditoría 2026-10 · acción 15)
 */

const POPOVER = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
const SEPARACION = 4; // px entre botón y lista
const MARGEN = 8; // px mínimos hasta el borde de la ventana
const TECLEO = 500; // ms que dura la búsqueda por letras

function colocar(boton, lista) {
  const r = boton.getBoundingClientRect();
  const ancho = lista.offsetWidth;
  const alto = lista.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const rtl = getComputedStyle(boton).direction === 'rtl';
  let arriba = r.bottom + SEPARACION;
  if (arriba + alto > vh - MARGEN && r.top - SEPARACION - alto >= MARGEN) arriba = r.top - SEPARACION - alto;
  const inicio = rtl ? r.right - ancho : r.left;
  const izquierda = Math.min(Math.max(inicio, MARGEN), Math.max(MARGEN, vw - ancho - MARGEN));
  lista.style.top = `${Math.round(arriba)}px`;
  lista.style.left = `${Math.round(izquierda)}px`;
}

export function initMenus(root = document) {
  for (const boton of root.querySelectorAll('.mol-menu__trigger[aria-controls]')) {
    const lista = document.getElementById(boton.getAttribute('aria-controls'));
    if (!lista || lista.syxMenu) continue;
    lista.syxMenu = true;

    const opciones = () => [...lista.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')]
      .filter((o) => !o.hidden && !o.closest('[hidden]'));
    const abierto = () => (POPOVER ? lista.matches(':popover-open') : !lista.hidden);

    for (const o of opciones()) o.tabIndex = -1;
    boton.setAttribute('aria-expanded', 'false');
    if (POPOVER && !boton.hasAttribute('popovertarget')) boton.setAttribute('popovertarget', lista.id);
    if (!POPOVER) { lista.hidden = true; lista.style.position = 'fixed'; }

    // Qué opción enfocar cuando el navegador termine de abrir la lista.
    let alAbrir = 'primera';

    const enfocar = (destino) => {
      const todas = opciones();
      const o = destino === 'ultima' ? todas[todas.length - 1] : typeof destino === 'number' ? todas[destino] : todas[0];
      if (o) o.focus();
    };

    const alAbrirse = () => {
      boton.setAttribute('aria-expanded', 'true');
      colocar(boton, lista);
      if (!lista.contains(document.activeElement)) enfocar(alAbrir);
      alAbrir = 'primera';
    };
    const alCerrarse = () => {
      boton.setAttribute('aria-expanded', 'false');
      // Solo si el foco se ha quedado sin sitio (estaba dentro de la lista):
      // un clic fuera que enfoca otra cosa no debe devolverlo al botón.
      const a = document.activeElement;
      if (!a || a === document.body || lista.contains(a)) boton.focus();
    };

    const abrir = (destino) => {
      alAbrir = destino;
      if (abierto()) { enfocar(destino); return; }
      if (POPOVER) lista.showPopover();
      else { lista.hidden = false; alAbrirse(); }
    };
    const cerrar = () => {
      if (!abierto()) return;
      // El foco vuelve al botón ANTES de ocultar: si se queda en una opción
      // oculta, el navegador lo manda a <body> y el lector pierde el sitio.
      boton.focus();
      if (POPOVER) lista.hidePopover();
      else { lista.hidden = true; alCerrarse(); }
    };

    if (POPOVER) {
      lista.addEventListener('toggle', (e) => (e.newState === 'open' ? alAbrirse() : alCerrarse()));
    } else {
      boton.addEventListener('click', () => (abierto() ? cerrar() : abrir('primera')));
      document.addEventListener('pointerdown', (e) => {
        if (abierto() && !lista.contains(e.target) && !boton.contains(e.target)) {
          lista.hidden = true;
          boton.setAttribute('aria-expanded', 'false');
        }
      });
    }

    boton.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); abrir('primera'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); abrir('ultima'); }
    });

    let buscado = '';
    let reloj;
    lista.addEventListener('keydown', (e) => {
      const todas = opciones();
      const i = todas.indexOf(document.activeElement);
      const mover = {
        ArrowDown: (i + 1) % todas.length,
        ArrowUp: (i - 1 + todas.length) % todas.length,
        Home: 0,
        End: todas.length - 1,
      }[e.key];
      if (mover !== undefined) { e.preventDefault(); enfocar(mover); return; }
      if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); cerrar(); return; }
      // Espacio activa también una opción que sea un enlace (<a role="menuitem">),
      // que de por sí solo responde a Intro.
      if (e.key === ' ' && i > -1 && todas[i].tagName === 'A') { e.preventDefault(); todas[i].click(); return; }
      // Búsqueda por letras: lo tecleado en medio segundo, desde la opción
      // siguiente a la actual.
      if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buscado += e.key.toLocaleLowerCase();
        clearTimeout(reloj);
        reloj = setTimeout(() => { buscado = ''; }, TECLEO);
        const orden = [...todas.slice(i + 1), ...todas.slice(0, i + 1)];
        const hallada = orden.find((o) => o.textContent.trim().toLocaleLowerCase().startsWith(buscado));
        if (hallada) hallada.focus();
      }
    });

    // Una opción con aria-disabled no actúa: se para el clic en captura,
    // antes de que llegue al manejador que la app puso en la opción.
    lista.addEventListener('click', (e) => {
      const o = e.target.closest('[role^="menuitem"]');
      if (o && o.getAttribute('aria-disabled') === 'true') { e.preventDefault(); e.stopPropagation(); }
    }, true);
    // Activar una opción cierra el menú, después del manejador de la app.
    lista.addEventListener('click', (e) => {
      const o = e.target.closest('[role^="menuitem"]');
      if (o && lista.contains(o)) cerrar();
    });

    const recolocar = () => { if (abierto()) colocar(boton, lista); };
    addEventListener('scroll', recolocar, { capture: true, passive: true });
    addEventListener('resize', recolocar, { passive: true });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initMenus());
  else initMenus();
}
