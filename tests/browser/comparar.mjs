#!/usr/bin/env node
/**
 * SYX — Regresión visual entre dos ramas
 * ──────────────────────────────────────
 * Enfrenta dos carpetas de capturas de run.mjs (la de la rama base y la del
 * cambio) y escribe un informe en Markdown con lo que cambió, más una imagen
 * de diferencias por captura.
 *
 * No hay capturas de referencia versionadas: la referencia es la rama base,
 * compilada y fotografiada en la misma máquina en la misma ejecución. Así un
 * cambio de fuentes del sistema o de versión de Chromium no rompe nada, y lo
 * único que puede salir distinto es lo que el cambio ha tocado.
 *
 * Informa y no falla: un cambio visual puede ser justo lo que se buscaba. Lo
 * decide quien revisa, con las imágenes delante.
 *
 * Uso: node comparar.mjs <antes> <después> <diferencias> [informe.md]
 * (Auditoría 2026-09 · acción 17)
 */

import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [antes, despues, dirDif, informe = path.join(dirDif, 'informe.md')] = process.argv.slice(2);
if (!antes || !despues || !dirDif) {
  console.error('Uso: node comparar.mjs <antes> <después> <diferencias> [informe.md]');
  process.exit(2);
}

const lista = (d) => fs.existsSync(d)
  ? fs.readdirSync(d, { recursive: true }).filter((f) => f.endsWith('.png')).map((f) => f.split(path.sep).join('/'))
  : [];
const a = new Set(lista(antes));
const b = new Set(lista(despues));
const cambios = [];
const nuevos = [...b].filter((f) => !a.has(f)).sort();
const quitados = [...a].filter((f) => !b.has(f)).sort();

for (const f of [...b].filter((x) => a.has(x)).sort()) {
  const i1 = PNG.sync.read(fs.readFileSync(path.join(antes, f)));
  const i2 = PNG.sync.read(fs.readFileSync(path.join(despues, f)));
  if (i1.width !== i2.width || i1.height !== i2.height) {
    cambios.push({ f, px: null, tam: `${i1.width}×${i1.height} → ${i2.width}×${i2.height}` });
    continue;
  }
  const dif = new PNG({ width: i1.width, height: i1.height });
  const px = pixelmatch(i1.data, i2.data, dif.data, i1.width, i1.height, { threshold: 0.1 });
  if (px > 0) {
    const out = path.join(dirDif, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, PNG.sync.write(dif));
    cambios.push({ f, px, pct: ((px / (i1.width * i1.height)) * 100).toFixed(2) });
  }
}

const L = ['## Regresión visual', ''];
if (!cambios.length && !nuevos.length && !quitados.length) {
  L.push(`Sin cambios visuales en ${b.size} capturas.`);
} else {
  L.push(`${b.size} capturas · ${cambios.length} cambian · ${nuevos.length} nuevas · ${quitados.length} desaparecen. Las diferencias están en el artefacto \`regresion-visual\`.`, '');
  if (cambios.length) {
    L.push('| Captura | Cambio |', '|---|---|');
    for (const c of cambios) L.push(`| \`${c.f}\` | ${c.px === null ? `tamaño ${c.tam}` : `${c.px} px (${c.pct} %)`} |`);
    L.push('');
  }
  if (nuevos.length) L.push(`**Nuevas:** ${nuevos.map((f) => `\`${f}\``).join(', ')}`, '');
  if (quitados.length) L.push(`**Desaparecen:** ${quitados.map((f) => `\`${f}\``).join(', ')}`, '');
}
fs.mkdirSync(path.dirname(informe), { recursive: true });
fs.writeFileSync(informe, L.join('\n') + '\n');
console.log(L.join('\n'));
