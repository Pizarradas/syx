/**
 * Regresiones en lo que se genera: el CSS commiteado, tokens.json y el
 * paquete publicable. Son las que no se ven leyendo el SCSS, porque el SCSS
 * está bien: lo que miente es lo que se entrega.
 */

'use strict';

const path = require('path');

module.exports = [
  {
    id: 'css-editado-a-mano',
    regresion: 'CSS compilado editado a mano y commiteado',
    guardian: 'check-limpio --strict',
    necesita: ['git'],
    comando: ['node', 'scripts/check-limpio.js', '--strict'],
    espera: /Compilar cambia/,
    limite: 600,
    mutar: (t) => t.editar('css/styles-theme-example-01.css', (s) => s.replace(/\n?$/, '\n.atom-btn { border-radius: 0; }\n')),
  },
  {
    id: 'token-fuera-de-tokens-json',
    regresion: 'token nuevo en el SCSS que tokens.json no tiene',
    guardian: 'check:tokens-json',
    seEscapaba: true,
    comando: ['node', 'scripts/build-tokens-json.js', '--check'],
    espera: /--component-card-sello-gap/,
    mutar: (t) => t.reemplazar('scss/abstracts/tokens/components/_card.scss', ':root {\n',
      ':root {\n  --component-card-sello-gap: var(--semantic-space-stack-sm);\n'),
  },
  // Fricción 8: estos derivados son `auto` en trust.json porque un guardián
  // compara lo commiteado con lo generado. Si el guardián no mira, `auto` es
  // un permiso para escribir lo que sea.
  {
    id: 'contrato-editado-a-mano',
    regresion: 'contracts/lint-contract.json editado a mano (una variable heredada que «ya no está»)',
    guardian: 'check:contratos',
    comando: ['node', 'scripts/syx-validate.js', '--check'],
    espera: /lint-contract\.json/,
    mutar: (t) => t.json('contracts/lint-contract.json', (c) => { c.stats.legacyRuntime = 0; }),
  },
  // Regenerar en Windows cambiaba el orden de token-usage-map.json y
  // check:contratos fallaba sin que nada hubiera cambiado: el validador leía
  // los .scss en el orden en que el disco los lista. Aquí el disco lista al
  // revés; con el orden fijo da igual, sin él el guardián lo ve.
  {
    id: 'contratos-segun-el-disco',
    regresion: 'el validador lee los .scss en el orden del disco (sin ordenar)',
    guardian: 'check:contratos',
    comando: ['node', 'scripts/syx-validate.js', '--check'],
    // Entre comillas: en Windows la copia puede ir en una ruta con espacios.
    env: (t) => ({ NODE_OPTIONS: `--require ${JSON.stringify(path.join(t.dir, 'tests/mutacion/readdir-al-reves.js'))}` }),
    espera: /token-usage-map\.json/,
    mutar: (t) => t.reemplazar('scripts/syx-validate.js', /\n\s*\.sort\(\(a, b\) => \(a\.name < b\.name[^\n]*\);/, ';'),
  },
  {
    id: 'figma-fichero-de-mas',
    regresion: 'un fichero en contracts/figma/ que el exportador no genera',
    guardian: 'check:figma',
    comando: ['node', 'scripts/export-figma.js', '--check'],
    espera: /intruso\.figma\.json/,
    mutar: (t) => t.escribir('contracts/figma/intruso.figma.json', '{}\n'),
  },
  {
    id: 'js-sin-side-effects',
    regresion: 'un js/syx-*.js que `sideEffects` no declara',
    guardian: 'check:package',
    seEscapaba: true,
    comando: ['node', 'scripts/check-package.js'],
    espera: /sideEffects no declara js\/syx-/,
    mutar: (t) => t.json('package.json', (p) => { p.sideEffects = p.sideEffects.filter((x) => !x.includes('js')); }),
  },
];
