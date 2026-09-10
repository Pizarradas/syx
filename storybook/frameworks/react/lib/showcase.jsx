/**
 * Fila de muestras para las stories de eje/flags. Misma estructura y estilos
 * que el showcase del runtime HTML (lib/runtime.js) — la paridad visual entre
 * frameworks incluye a las stories de catálogo.
 */
import React from 'react';

const ROW = { display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', maxWidth: '72rem' };
const ITEM = { display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center' };
const LABEL = { fontFamily: 'monospace', fontSize: '.75rem', opacity: 0.7 };

export function Showcase({ items }) {
  return (
    <div style={ROW}>
      {items.map(({ label, is: Comp, props }) => (
        <div style={ITEM} key={label}>
          <div>
            <Comp {...props} />
          </div>
          <span style={LABEL}>{label}</span>
        </div>
      ))}
    </div>
  );
}
