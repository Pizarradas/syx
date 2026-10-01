/**
 * SYX — Comportamiento de .mol-tooltip
 * ────────────────────────────────────
 * La burbuja es un popover (popover="hint"): el navegador la pone en la capa
 * superior, por encima de cualquier overflow o z-index. Esto pone lo que el
 * popover no trae, que es lo que pide WCAG 1.4.13 (contenido al pasar el
 * puntero o enfocar):
 *
 *   aparece    con el foco del disparador (en el acto) y con el puntero
 *              (tras una pausa breve, para no encender burbujas al cruzar)
 *   se queda   mientras el puntero esté sobre el disparador O sobre la
 *              burbuja: se puede ir hasta ella sin que se cierre
 *   se va      al salir el puntero de los dos, al perder el foco, o con
 *              Escape, que no mueve ni el foco ni el puntero
 *   no tapa    se coloca encima del disparador con una separación; si no
 *              cabe, debajo; y se recorta a los bordes de la ventana
 *
 * Posición: CSS anchor positioning lo haría sin script, pero no está en el
 * soporte mínimo (Chrome 111 · Safari 16.2 · Firefox 121); se mide el
 * disparador y se escriben `top` y `left`. Son coordenadas de la ventana
 * (getBoundingClientRect), físicas por naturaleza: valen igual en RTL.
 * Sin Popover API (Safari < 17) la burbuja se oculta con `hidden` y se
 * coloca igual, con position: fixed.
 *
 * Marcado que espera — el disparador nombra la burbuja en aria-describedby
 * (o en aria-labelledby, si la burbuja es su único nombre):
 *
 *   <span class="mol-tooltip">
 *     <button class="atom-btn" type="button" aria-describedby="tip-1">Share</button>
 *     <span class="mol-tooltip__bubble" id="tip-1" role="tooltip" popover="hint">Copies the link</span>
 *   </span>
 *
 * Uso, con empaquetador (Vite, webpack, Rollup):
 *       import 'syx-design-system/js/syx-tooltip.js';
 *       import { initTooltips } from 'syx-design-system/js/syx-tooltip.js';
 *       initTooltips(contenedor);                      // marcado que llega después
 *
 * (Auditoría 2026-10 · acción 15)
 */

const POPOVER = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
const SEPARACION = 8; // px entre disparador y burbuja
const MARGEN = 8; // px mínimos hasta el borde de la ventana
const ENTRADA = 120; // ms de pausa antes de abrir con el puntero
const SALIDA = 120; // ms de gracia para llegar del disparador a la burbuja

const abiertas = new Set();

const estaAbierta = (b) => (POPOVER ? b.matches(':popover-open') : !b.hidden);

function colocar(disparador, burbuja) {
  const r = disparador.getBoundingClientRect();
  const ancho = burbuja.offsetWidth;
  const alto = burbuja.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  let arriba = r.top - alto - SEPARACION;
  let lado = 'top';
  if (arriba < MARGEN && r.bottom + SEPARACION + alto <= vh - MARGEN) {
    arriba = r.bottom + SEPARACION;
    lado = 'bottom';
  }
  const izquierda = Math.min(Math.max(r.left + r.width / 2 - ancho / 2, MARGEN), Math.max(MARGEN, vw - ancho - MARGEN));
  burbuja.style.top = `${Math.round(arriba)}px`;
  burbuja.style.left = `${Math.round(izquierda)}px`;
  burbuja.dataset.side = lado;
}

function abrir(disparador, burbuja) {
  for (const otra of abiertas) if (otra.burbuja !== burbuja) cerrar(otra.burbuja);
  if (!estaAbierta(burbuja)) {
    if (POPOVER) burbuja.showPopover();
    else { burbuja.style.position = 'fixed'; burbuja.hidden = false; }
  }
  colocar(disparador, burbuja);
  abiertas.add(burbuja.syxTooltip);
}

function cerrar(burbuja) {
  if (estaAbierta(burbuja)) {
    if (POPOVER) burbuja.hidePopover();
    else burbuja.hidden = true;
  }
  abiertas.delete(burbuja.syxTooltip);
}

// Un solo juego de escuchas globales para todas las burbujas.
let global = false;
function escuchasGlobales() {
  if (global) return;
  global = true;
  // Escape en captura: cierra la burbuja ANTES de que el mismo Escape cierre
  // el diálogo o el menú en el que está el disparador. Con una burbuja
  // abierta, la primera pulsación es para ella.
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !abiertas.size) return;
    for (const t of [...abiertas]) cerrar(t.burbuja);
    e.preventDefault();
    e.stopPropagation();
  }, true);
  const recolocar = () => { for (const t of abiertas) colocar(t.disparador, t.burbuja); };
  addEventListener('scroll', recolocar, { capture: true, passive: true });
  addEventListener('resize', recolocar, { passive: true });
}

export function initTooltips(root = document) {
  for (const burbuja of root.querySelectorAll('.mol-tooltip__bubble[id]')) {
    if (burbuja.syxTooltip) continue;
    const id = CSS.escape(burbuja.id);
    const disparador = document.querySelector(`[aria-describedby~="${id}"], [aria-labelledby~="${id}"]`);
    if (!disparador) continue;
    const t = { disparador, burbuja };
    burbuja.syxTooltip = t;
    if (!POPOVER) burbuja.hidden = true;
    escuchasGlobales();

    let reloj;
    let puntero = false; // el puntero está sobre el disparador o la burbuja
    const programar = (fn, ms) => { clearTimeout(reloj); reloj = setTimeout(fn, ms); };
    const quizaCerrar = () => {
      if (puntero || disparador.matches(':focus-visible')) return;
      cerrar(burbuja);
    };

    for (const el of [disparador, burbuja]) {
      el.addEventListener('pointerenter', () => {
        puntero = true;
        if (estaAbierta(burbuja)) clearTimeout(reloj);
        else programar(() => abrir(disparador, burbuja), ENTRADA);
      });
      el.addEventListener('pointerleave', () => {
        puntero = false;
        programar(quizaCerrar, SALIDA);
      });
    }
    // Solo el foco de teclado (:focus-visible): el clic también enfoca un
    // botón, y la burbuja volvería a abrirse justo al usarlo.
    disparador.addEventListener('focus', () => {
      if (!disparador.matches(':focus-visible')) return;
      clearTimeout(reloj);
      abrir(disparador, burbuja);
    });
    disparador.addEventListener('blur', () => { if (!puntero) cerrar(burbuja); });
    // El navegador también cierra un popover="hint" por su cuenta (clic
    // fuera, otra burbuja): sin esto, Escape se quedaría esperando a una
    // burbuja que ya no está y se tragaría la pulsación.
    burbuja.addEventListener('toggle', (e) => { if (e.newState === 'closed') abiertas.delete(t); });
    // Pulsar el control es usarlo: la descripción ya no hace falta.
    disparador.addEventListener('pointerdown', () => { clearTimeout(reloj); cerrar(burbuja); });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initTooltips());
  else initTooltips();
}
