/**
 * SYX — Contador de caracteres para .mol-form-field__count
 * ────────────────────────────────────────────────────────
 * Un textarea con maxlength corta en seco al llegar al límite, y quien no ve
 * la pantalla no sabe por qué deja de escribirse. Este script escribe cuánto
 * queda en el contador visible y lo anuncia a los lectores de pantalla, pero
 * solo cuando se deja de escribir (un anuncio por tecla taparía lo que se
 * está dictando). Sin dependencias.
 *
 * Marcado que espera — el campo nombra al contador en aria-describedby, así
 * que al enfocar se oye también cuánto queda:
 *
 *   <textarea class="atom-textarea" id="bio" maxlength="160" aria-describedby="bio-count"></textarea>
 *   <span class="mol-form-field__count" id="bio-count" data-template="{n} characters left">Up to 160 characters</span>
 *
 * Sin JavaScript queda el texto del marcado, que sigue siendo verdad.
 * `data-template` lleva el texto en el idioma de la página ({n} = lo que
 * queda); al llegar a 0 el contador recibe `is-limit`.
 *
 * Uso, con empaquetador (Vite, webpack, Rollup):
 *       import 'syx-design-system/js/syx-char-count.js';
 *       import { initCharCount } from 'syx-design-system/js/syx-char-count.js';
 *       initCharCount(contenedor);                     // marcado que llega después
 *
 * (Auditoría 2026-10 · acción 15)
 */

const PAUSA = 800; // ms sin teclear antes de anunciar

export function initCharCount(root = document) {
  for (const contador of root.querySelectorAll('.mol-form-field__count[id]')) {
    if (contador.dataset.syxCount) continue;
    // Por id en todo el documento: el campo y su contador pueden no
    // compartir contenedor (un componente que pinta el contador aparte).
    const campo = [...document.querySelectorAll('[aria-describedby]')].find((c) =>
      c.getAttribute('aria-describedby').split(/\s+/).includes(contador.id));
    if (!campo || !(campo.maxLength > 0)) continue;
    contador.dataset.syxCount = 'on';

    // La región viva existe antes de recibir texto: si nace con él, algunos
    // lectores no la anuncian.
    const vivo = document.createElement('span');
    vivo.className = 'mol-form-field__live';
    vivo.setAttribute('role', 'status');
    contador.after(vivo);

    const plantilla = contador.dataset.template || '{n} characters left';
    const texto = () => plantilla.replace('{n}', String(Math.max(0, campo.maxLength - campo.value.length)));
    let espera;

    const pintar = () => {
      contador.textContent = texto();
      contador.classList.toggle('is-limit', campo.value.length >= campo.maxLength);
    };

    campo.addEventListener('input', () => {
      pintar();
      clearTimeout(espera);
      espera = setTimeout(() => { vivo.textContent = texto(); }, PAUSA);
    });
    pintar();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initCharCount());
  else initCharCount();
}
