/**
 * SYX — Avisos efímeros (.mol-toast)
 * ──────────────────────────────────
 * Lo mínimo para mostrar un aviso que no interrumpe:
 *
 *   showToast('Ajustes guardados', { tone: 'success' });
 *
 * y lo que eso exige para que sea accesible:
 *
 *   anuncia     escribe el texto en la región viva del contenedor
 *               (.mol-toast__live, role="status"), que existe ANTES del
 *               texto: una región que nace con el texto dentro no se lee
 *   no roba     nunca mueve el foco; el aviso tiene un botón de cerrar al
 *               que se llega con Tab, y al cerrarlo el foco vuelve a donde
 *               estaba antes de entrar en los avisos
 *   da tiempo   la cuenta atrás se pausa con el puntero o el foco encima, y
 *               con la pestaña oculta (WCAG 2.2.1); duration: 0 lo deja
 *               hasta que se cierre a mano
 *   no se mueve con movimiento reducido el CSS no tiene transición y el
 *               aviso se quita en el acto
 *
 * Sin escribir JS: <button type="button" data-syx-toast="Enlace copiado"
 * data-syx-toast-tone="success">Copiar</button> muestra ese aviso al pulsarlo.
 *
 * Si no hay contenedor en la página, se crea uno al final de <body>.
 * Avisos escritos en el HTML (__item con data-duration) también se cierran
 * solos y su botón funciona: initToasts() los conecta.
 *
 * Uso, con empaquetador (Vite, webpack, Rollup):
 *       import { showToast } from 'syx-design-system/js/syx-toast.js';
 *       showToast('Enlace copiado');
 *       showToast('No se pudo guardar', { tone: 'error', duration: 0 });
 *       const aviso = showToast('Subiendo…', { duration: 0 }); aviso.close();
 *     opciones: tone ('info' | 'success' | 'warning' | 'error'), duration (ms,
 *     6000 por defecto; 0 = sin cierre automático), region (el contenedor),
 *     dismissLabel (nombre del botón de cerrar, por defecto el
 *     data-dismiss-label del contenedor o 'Dismiss notification').
 *
 * (Auditoría 2026-10 · acción 15)
 */

const DURACION = 6000;
const TONOS = ['info', 'success', 'warning', 'error'];

function region(dada) {
  if (dada) return typeof dada === 'string' ? document.querySelector(dada) : dada;
  let r = document.querySelector('.mol-toast');
  if (!r) {
    r = document.createElement('div');
    r.className = 'mol-toast';
    document.body.append(r);
  }
  preparar(r);
  return r;
}

// La región viva y la memoria de dónde estaba el foco: una vez por contenedor.
function preparar(r) {
  if (r.syxToast) return r.syxToast;
  let vivo = r.querySelector('.mol-toast__live');
  if (!vivo) {
    vivo = document.createElement('p');
    vivo.className = 'mol-toast__live';
    vivo.setAttribute('role', 'status');
    r.prepend(vivo);
  }
  const estado = { vivo, volverA: null };
  // Quien entra con Tab en los avisos viene de algún sitio: ahí vuelve el
  // foco cuando el aviso en el que estaba desaparece.
  r.addEventListener('focusin', (e) => {
    if (e.relatedTarget && !r.contains(e.relatedTarget)) estado.volverA = e.relatedTarget;
  });
  r.syxToast = estado;
  return estado;
}

function anunciar(r, texto) {
  const { vivo } = preparar(r);
  // Vaciar y escribir en otro turno: así se anuncia aunque el texto sea el
  // mismo que el del aviso anterior, y la región ya existe cuando llega.
  vivo.textContent = '';
  setTimeout(() => { vivo.textContent = texto; }, 100);
}

function conectar(aviso, duracion) {
  if (aviso.syxToast) return aviso.syxToast;
  const r = aviso.closest('.mol-toast');
  const estado = r ? preparar(r) : { volverA: null };
  let restante = duracion;
  let inicio = 0;
  let reloj = null;
  const motivos = new Set(); // puntero, foco, pestaña oculta

  const cerrar = () => {
    if (!aviso.isConnected || aviso.classList.contains('is-leaving')) return;
    clearTimeout(reloj);
    document.removeEventListener('visibilitychange', alCambiarPestana);
    // Si el foco estaba en el aviso, se devuelve antes de quitarlo.
    if (aviso.contains(document.activeElement)) {
      const otro = [...(r ? r.querySelectorAll('.mol-toast__close') : [])].find((b) => !aviso.contains(b));
      const destino = estado.volverA && estado.volverA.isConnected ? estado.volverA : otro;
      if (destino) destino.focus();
      else document.activeElement.blur();
    }
    aviso.classList.add('is-leaving');
    const ms = Math.max(...getComputedStyle(aviso).transitionDuration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000)));
    if (ms > 0) setTimeout(() => aviso.remove(), ms);
    else aviso.remove();
  };

  const correr = () => {
    if (!(restante > 0) || motivos.size) return;
    inicio = Date.now();
    reloj = setTimeout(cerrar, restante);
  };
  const pausar = (motivo) => {
    if (!motivos.size && reloj) { clearTimeout(reloj); reloj = null; restante -= Date.now() - inicio; }
    motivos.add(motivo);
  };
  const seguir = (motivo) => { motivos.delete(motivo); correr(); };
  function alCambiarPestana() { if (document.hidden) pausar('pestaña'); else seguir('pestaña'); }

  aviso.addEventListener('pointerenter', () => pausar('puntero'));
  aviso.addEventListener('pointerleave', () => seguir('puntero'));
  aviso.addEventListener('focusin', () => pausar('foco'));
  aviso.addEventListener('focusout', (e) => { if (!aviso.contains(e.relatedTarget)) seguir('foco'); });
  document.addEventListener('visibilitychange', alCambiarPestana);
  const boton = aviso.querySelector('.mol-toast__close');
  if (boton) boton.addEventListener('click', cerrar);

  const api = { element: aviso, close: cerrar };
  aviso.syxToast = api;
  if (document.hidden) motivos.add('pestaña');
  correr();
  return api;
}

let delegado = false;

export function initToasts(root = document) {
  // Disparadores declarativos: <button data-syx-toast="Enlace copiado"
  // data-syx-toast-tone="success">. Delegado en el documento, así sirve
  // también para botones que lleguen después.
  if (!delegado) {
    delegado = true;
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-syx-toast]');
      if (b) showToast(b.dataset.syxToast, { tone: b.dataset.syxToastTone });
    });
  }
  for (const r of root.querySelectorAll('.mol-toast')) preparar(r);
  for (const aviso of root.querySelectorAll('.mol-toast__item')) {
    conectar(aviso, aviso.dataset.duration === undefined ? 0 : Number(aviso.dataset.duration));
  }
}

export function showToast(mensaje, { tone = 'info', duration = DURACION, region: dada, dismissLabel } = {}) {
  const r = region(dada);
  const aviso = document.createElement('div');
  aviso.className = `mol-toast__item mol-toast__item--${TONOS.includes(tone) ? tone : 'info'}`;
  const texto = document.createElement('p');
  texto.className = 'mol-toast__text';
  texto.textContent = mensaje;
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'mol-toast__close';
  boton.setAttribute('aria-label', dismissLabel || r.dataset.dismissLabel || 'Dismiss notification');
  // La aspa se dibuja aquí y no con atom-icon: el aviso no puede depender de
  // que la aplicación haya incluido los iconos en su hoja.
  boton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  aviso.append(texto, boton);
  r.append(aviso);
  anunciar(r, mensaje);
  return conectar(aviso, duration);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initToasts());
  else initToasts();
}
