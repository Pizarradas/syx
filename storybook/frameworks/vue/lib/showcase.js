/**
 * Fila de muestras para las stories de eje/flags. Misma estructura y estilos
 * que el showcase del runtime HTML (lib/runtime.js) — la paridad visual entre
 * frameworks incluye a las stories de catálogo.
 */
import { h } from 'vue';

const ROW = { display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', maxWidth: '72rem' };
const ITEM = { display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center' };
const LABEL = { fontFamily: 'monospace', fontSize: '.75rem', opacity: 0.7 };

/** Devuelve un componente-options renderizable por el renderer vue3 de Storybook. */
export function showcase(items) {
  return {
    render: () =>
      h(
        'div',
        { style: ROW },
        items.map(({ label, is, props }) =>
          h('div', { style: ITEM, key: label }, [
            h('div', null, [h(is, props)]),
            h('span', { style: LABEL }, label),
          ])
        )
      ),
  };
}
