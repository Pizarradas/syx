#!/usr/bin/env node
/**
 * build-dist.js — las hojas que se recomiendan, listas para usar
 * ----------------------------------------------------------------------------
 * Los ocho CSS de css/ son los bundles «showroom» que usan las páginas de SYX:
 * todo el sistema más la capa site/ (home, evidence, ranking…), sin minificar.
 * Eso es lo que viajaba en el paquete, unos 45 KB en gzip por tema, cuando la
 * guía recomienda bundle-core (36 KB) y un consumidor no necesita la capa site.
 *
 * Este script compila, por tema, los bundles de contexto que ya existen en
 * scss/themes/<tema>/ más las utilidades .syx-*, minificados y con
 * autoprefixer, en dist/<tema>.<bundle>.min.css:
 *
 *   core       tokens, reset, base, helpers, grid y los componentes de producción
 *   full       todo el sistema (bundle-docs), sin la capa site/
 *
 * Los bundles app, blog y marketing siguen en scss/themes/<tema>/ para quien
 * compile su propia hoja.
 *
 * dist/ no se commitea: se genera en `prepare` (npm pack, npm publish e
 * instalación desde GitHub). Las url() de fuentes son relativas a dist/, que
 * está al mismo nivel que css/, así que `../fonts` sigue valiendo.
 *
 * Uso: node scripts/build-dist.js [--quiet]
 * ----------------------------------------------------------------------------
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

const ROOT = path.resolve(__dirname, '..');
const SCSS = path.join(ROOT, 'scss');
const DIST = path.join(ROOT, 'dist');
// Solo core y full: app, blog y marketing son variaciones de pocos KB sobre
// core y multiplicarían el paquete; se compilan desde scss/themes/<tema>/.
const BUNDLES = { core: 'bundle-core', full: 'bundle-docs' };
const quiet = process.argv.includes('--quiet');

async function main() {
  const temas = fs.readdirSync(path.join(SCSS, 'themes'))
    .filter((d) => !d.startsWith('_') && fs.existsSync(path.join(SCSS, 'themes', d, '_theme.scss')))
    .sort();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const filas = [];
  for (const tema of temas) {
    for (const [nombre, fichero] of Object.entries(BUNDLES)) {
      const entrada = path.join(SCSS, 'themes', tema, `${fichero}.scss`);
      if (!fs.existsSync(entrada)) throw new Error(`falta ${path.relative(ROOT, entrada)}`);
      const fuente = `@use 'themes/${tema}/${fichero}';\n@use 'utilities/index' as *;\n`;
      const { css } = sass.compileString(fuente, { loadPaths: [SCSS], style: 'compressed' });
      const salida = (await postcss([autoprefixer]).process(css, { from: undefined })).css;
      const destino = path.join(DIST, `${tema}.${nombre}.min.css`);
      fs.writeFileSync(destino, salida);
      filas.push([path.basename(destino), salida.length, zlib.gzipSync(salida, { level: 9 }).length]);
    }
  }
  if (!quiet) {
    console.log('\n── DIST ' + '─'.repeat(56) + '\n');
    for (const [f, raw, gz] of filas) console.log(`   ${f.padEnd(34)} ${(raw / 1024).toFixed(0).padStart(4)} KB · ${(gz / 1024).toFixed(1).padStart(5)} KB gzip`);
    console.log(`\n   ${filas.length} hojas en dist/\n`);
  }
}

main().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
