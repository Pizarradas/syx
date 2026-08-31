#!/usr/bin/env node
/**
 * check-theme-symmetry.js
 * ----------------------------------------------------------------------------
 * Comprueba que cada tema define los MISMOS tokens en su bloque de modo claro
 * y en el de modo oscuro.
 *
 * El fallo que motiva este script: syx-sketch redefinía 166 tokens en oscuro y
 * su bloque `:root[data-theme="light"]` solo revertía 17. Con el sistema en
 * oscuro, pulsar el toggle a claro dejaba la página a medias — fondo blanco con
 * tarjetas, píldoras, botones y telón del hero todavía en valores de oscuro.
 * No lo detecta ninguna regla R01–R08 porque, token a token, todo era válido.
 *
 * Uso:  node scripts/check-theme-symmetry.js [--strict]
 * ----------------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'scss', 'themes');

/** Devuelve los nombres de custom property declarados en un trozo de SCSS. */
function tokensIn(scss) {
  const out = new Set();
  const re = /^\s*(--[a-z0-9-]+)\s*:/gm;
  let m;
  while ((m = re.exec(scss)) !== null) out.add(m[1]);
  return out;
}

/** Extrae el cuerpo de un `@mixin <nombre> { … }` contando llaves. */
function mixinBody(scss, name) {
  const start = scss.indexOf(`@mixin ${name}`);
  if (start === -1) return null;
  const open = scss.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < scss.length; i++) {
    if (scss[i] === '{') depth++;
    else if (scss[i] === '}') { depth--; if (depth === 0) return scss.slice(open + 1, i); }
  }
  return null;
}

function main() {
  const strict = process.argv.includes('--strict');
  const themes = fs.readdirSync(THEMES_DIR)
    .filter((d) => !d.startsWith('_'))
    .filter((d) => fs.existsSync(path.join(THEMES_DIR, d, '_theme.scss')));

  let problemas = 0;
  console.log('\n── SIMETRÍA CLARO / OSCURO ' + '─'.repeat(37) + '\n');

  for (const theme of themes) {
    const scss = fs.readFileSync(path.join(THEMES_DIR, theme, '_theme.scss'), 'utf8');
    const darkBody = mixinBody(scss, `${theme}-dark-tokens`) ?? mixinBody(scss, 'dark-tokens');

    if (!darkBody) {
      console.log(`   ${theme.padEnd(16)} sin mixin de oscuro propio — se omite`);
      continue;
    }
    const lightBody = mixinBody(scss, `${theme}-light-tokens`);
    const dark = tokensIn(darkBody);
    const light = lightBody ? tokensIn(lightBody) : new Set();

    const huerfanos = [...dark].filter((t) => !light.has(t));
    if (huerfanos.length === 0) {
      console.log(`✅ ${theme.padEnd(16)} ${dark.size} tokens, simetría completa`);
    } else {
      problemas++;
      console.log(`❌ ${theme.padEnd(16)} ${huerfanos.length} de ${dark.size} tokens que el oscuro`);
      console.log(`   ${' '.repeat(16)} cambia y el claro forzado no revierte:`);
      huerfanos.slice(0, 12).forEach((t) => console.log(`      → ${t}`));
      if (huerfanos.length > 12) console.log(`      … y ${huerfanos.length - 12} más`);
    }
  }

  console.log('');
  if (problemas && strict) process.exit(1);
}

main();
