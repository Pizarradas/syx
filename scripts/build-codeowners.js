#!/usr/bin/env node
/**
 * SYX — CODEOWNERS desde el contrato de confianza
 * ───────────────────────────────────────────────
 * Genera `.github/CODEOWNERS` a partir de `contracts/trust.json`: toda ruta
 * `human` o `pr` pide la revisión del propietario; las `auto`, ninguna.
 *
 * POR QUÉ EXISTE
 * trust.json decía quién puede escribir qué, y nada lo hacía cumplir en un
 * merge: no había CODEOWNERS, ni hook, ni job que mirara el diff. En GitHub, la
 * aprobación que de verdad bloquea es la revisión de un CODEOWNER con la
 * protección de rama exigiéndola. Este fichero es la mitad que se puede
 * versionar; la otra mitad —activar «Require review from Code Owners» en la
 * rama principal— es un ajuste del repositorio, y lo hace una persona.
 *
 * POR QUÉ SE GENERA Y NO SE ESCRIBE A MANO
 * Porque serían dos listas de lo mismo, y dos listas se separan. `--check` va
 * en `npm run check`: si alguien toca trust.json y no regenera, falla.
 *
 * LA TRADUCCIÓN DE «GANA EL MÁS LARGO» A «GANA EL ÚLTIMO»
 * confianza.js decide por el patrón más largo que coincide; CODEOWNERS, por la
 * última línea que coincide. Se emite primero `*` (el `default` de trust.json
 * es `human`: lo no clasificado también pide revisión) y después cada patrón
 * ordenado por longitud creciente, así el más específico queda debajo y gana.
 * Las rutas `auto` se escriben SIN propietario, que en CODEOWNERS significa
 * «nadie tiene que revisar esto», para que `*` no las alcance.
 *
 * Uso:
 *   node scripts/build-codeowners.js           regenera .github/CODEOWNERS
 *   node scripts/build-codeowners.js --check   falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { contrato } = require('./lib/confianza');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '.github', 'CODEOWNERS');

// El autor del repositorio en GitHub. Si cambia, cambia aquí y se regenera.
const PROPIETARIO = '@Pizarradas';

/** Un patrón de trust.json, en sintaxis de CODEOWNERS (gitignore anclado). */
function patronCodeowners(p) {
  if (p.startsWith('*.')) return p; // sin barra: cualquier profundidad, como en confianza.js
  if (p.startsWith('**/')) return p; // un nombre de fichero en cualquier carpeta
  return `/${p}`; // carpeta (con `/` final) o fichero exacto, desde la raíz
}

function generar() {
  const c = contrato();
  const filas = [];
  for (const [tier, def] of Object.entries(c.tiers)) {
    for (const p of def.paths) filas.push({ tier, p });
  }
  // Estable: a igual longitud, el orden de trust.json. A igual longitud dos
  // patrones no pueden anidarse, así que el desempate no decide nada.
  // De lo general a lo específico; los patrones por nombre (`**/…`), al final:
  // en confianza.js ganan a cualquier carpeta, y aquí gana la última línea.
  const peso = (p) => (p.startsWith('**/') ? 1e6 : 0) + p.length;
  filas.sort((a, b) => peso(a.p) - peso(b.p));

  // Sin comentarios al final de línea: CODEOWNERS no los define, y un `#`
  // tras el patrón podría leerse como un propietario mal escrito.
  const ancho = Math.max(...filas.map((f) => patronCodeowners(f.p).length)) + 2;
  const linea = ({ tier, p }) =>
    tier === 'auto' ? patronCodeowners(p) : `${patronCodeowners(p).padEnd(ancho)}${PROPIETARIO}`;

  return [
    '# GENERADO por scripts/build-codeowners.js desde contracts/trust.json — no editar a mano.',
    '# Regenerar: node scripts/build-codeowners.js · comprobar: npm run check:codeowners',
    '#',
    '# Rutas `human` y `pr`: revisión del propietario. Rutas `auto`: sin propietario.',
    '# Gana la ÚLTIMA línea que coincide, así que van de lo general a lo específico.',
    '# Solo bloquea un merge si la rama protegida exige «Require review from Code Owners».',
    '',
    `# default de trust.json: ${c._meta.default}`,
    `${'*'.padEnd(ancho)}${PROPIETARIO}`,
    '',
    ...filas.map(linea),
    '',
  ].join('\n');
}

const esperado = generar();

if (process.argv.includes('--check')) {
  const actual = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (actual !== esperado) {
    console.log('\n❌ .github/CODEOWNERS no corresponde a contracts/trust.json.');
    console.log('   Regenera con: node scripts/build-codeowners.js\n');
    process.exit(1);
  }
  console.log('\n✅ .github/CODEOWNERS está al día con contracts/trust.json.\n');
} else {
  fs.writeFileSync(OUT, esperado);
  console.log(`\n✅ ${path.relative(ROOT, OUT)} regenerado desde contracts/trust.json.\n`);
}
