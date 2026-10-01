/**
 * SYX — Teclado para .mol-tabs
 * ────────────────────────────
 * El CSS de .mol-tabs pinta lo que dicen aria-selected y hidden; esto pone lo
 * único que el CSS no puede: el patrón de teclado de WAI-ARIA para pestañas.
 *
 *   ← →        pestaña anterior / siguiente (vuelve al principio)
 *   Inicio Fin primera / última
 *   clic       activa
 *
 * Activación automática: mover el foco activa la pestaña. Tabindex itinerante:
 * solo la activa entra en el orden de tabulación. Sin dependencias.
 *
 * Uso, con empaquetador (Vite, webpack, Rollup):
 *       import 'syx-design-system/js/syx-tabs.js';      // activa lo que haya al cargar
 *       import { initTabs } from 'syx-design-system/js/syx-tabs.js';
 *       initTabs(contenedor);                           // marcado que llega después
 *     sin empaquetador:
 *       <script type="module" src="node_modules/syx-design-system/js/syx-tabs.js"></script>
 *
 * El import «desnudo» solo sobrevive al build porque package.json declara
 * ./js/*.js en `sideEffects` (lo vigila check:package).
 *
 * (Auditoría 2026-09 · acción 15)
 */

export function initTabs(root = document) {
  for (const list of root.querySelectorAll('.mol-tabs__list[role="tablist"]')) {
    if (list.dataset.syxTabs) continue;
    list.dataset.syxTabs = 'on';
    const tabs = () => [...list.querySelectorAll('[role="tab"]')];

    const activar = (tab, enfocar) => {
      for (const t of tabs()) {
        const activa = t === tab;
        t.setAttribute('aria-selected', String(activa));
        t.tabIndex = activa ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !activa;
      }
      if (enfocar) tab.focus();
    };

    list.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab && list.contains(tab)) activar(tab, false);
    });

    list.addEventListener('keydown', (e) => {
      const todas = tabs();
      const i = todas.indexOf(document.activeElement);
      if (i === -1) return;
      const destino = {
        ArrowRight: todas[(i + 1) % todas.length],
        ArrowLeft: todas[(i - 1 + todas.length) % todas.length],
        Home: todas[0],
        End: todas[todas.length - 1],
      }[e.key];
      if (!destino) return;
      e.preventDefault();
      activar(destino, true);
    });

    const inicial = tabs().find((t) => t.getAttribute('aria-selected') === 'true') || tabs()[0];
    if (inicial) activar(inicial, false);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initTabs());
  else initTabs();
}
