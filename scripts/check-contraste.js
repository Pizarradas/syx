#!/usr/bin/env node
/**
 * check-contraste.js — WCAG 2.2 AA en todos los temas y modos
 * ----------------------------------------------------------------------------
 * Pasa los pares de contracts/contrast.json por los siete temas y por los
 * cuatro estados de modo que un usuario puede ver: sin elegir (SO en claro y
 * en oscuro) y eligiendo claro u oscuro. Resuelve var() sobre el CSS
 * compilado, así que mide lo que pinta el navegador, no lo que dice el SCSS.
 *
 * Existe porque la auditoría de septiembre de 2026 encontró 28 de 70 pares
 * por debajo de AA —el borde de los campos entre 1,43 y 2,40:1, el texto de
 * error entre 3,56 y 4,35:1— con toda la cadena `check` en verde.
 *
 * Un valor que no se puede leer (una función de color que el script no
 * conoce) se informa como «sin medir» y NO cuenta como aprobado.
 *
 * Los pares de texto sobre relleno de marca (on-*) traen `alternativas`: las
 * dos tintas del tema. Cuando uno no llega, el informe dice cuál de ellas sí
 * llegaría, para que el tema la declare. El color de una tinta sobre un
 * relleno no se puede calcular en CSS con el soporte mínimo del sistema
 * (contrast-color() y la sintaxis relativa son posteriores), así que se elige
 * aquí, midiendo, y queda escrito en el tema.
 *
 * Un fondo translúcido (los tonos suaves: el color al 12 % sobre transparente)
 * se compone antes sobre la superficie en que se posa: la del campo `sobre`
 * del par, o --semantic-color-bg-primary si no lo dice. Sin superficie opaca
 * debajo, el par sale «sin medir».
 *
 * Uso: node scripts/check-contraste.js [--json]
 * ----------------------------------------------------------------------------
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { declaraciones, estado, resolver } = require('./check-modo-claro.js');
const { contraste } = require('./lib/contraste.js');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const CONTRATO = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts', 'contrast.json'), 'utf8'));
// Superficie sobre la que se compone un fondo translúcido si el par no dice otra.
const SUPERFICIE = '--semantic-color-bg-primary';
const ESTADOS = [
  ['claro', 'none', 'light'],
  ['oscuro', 'none', 'dark'],
  ['claro elegido', 'light', 'dark'],
  ['oscuro elegido', 'dark', 'light'],
];

/** La primera alternativa del par que sí llega al mínimo sobre ese fondo, con su razón. */
function sugerir(vars, par, bg, base) {
  for (const alt of par.alternativas || []) {
    const r = contraste(resolver(vars, vars[alt]), bg, base);
    if (r !== null && r >= par.minimo) return `${par.primerPlano}: var(${alt}) → ${r.toFixed(2)}:1`;
  }
  return null;
}

function main() {
  const json = process.argv.includes('--json');
  const ficheros = fs.readdirSync(CSS_DIR).filter((f) => /^styles-theme-.+\.css$/.test(f)).sort();
  const fallos = [], sinMedir = [];
  let medidas = 0;
  for (const f of ficheros) {
    const tema = f.replace(/^styles-theme-|\.css$/g, '');
    const decls = declaraciones(fs.readFileSync(path.join(CSS_DIR, f), 'utf8'));
    for (const [nombre, eleccion, so] of ESTADOS) {
      const vars = estado(decls, eleccion, so);
      for (const par of CONTRATO.pares) {
        const fg = resolver(vars, vars[par.primerPlano]), bg = resolver(vars, vars[par.fondo]);
        const base = resolver(vars, vars[par.sobre || SUPERFICIE]);
        const r = contraste(fg, bg, base);
        medidas++;
        if (r === null) sinMedir.push({ tema, estado: nombre, par: par.id, fg, bg });
        else if (r < par.minimo) fallos.push({ tema, estado: nombre, par: par.id, ratio: +r.toFixed(2), minimo: par.minimo, criterio: par.criterio, sugerencia: sugerir(vars, par, bg, base) });
      }
    }
  }
  if (json) {
    console.log(JSON.stringify({ medidas, fallos, sinMedir }, null, 2));
  } else {
    console.log('\n── CONTRASTE WCAG 2.2 AA ' + '─'.repeat(39) + '\n');
    for (const x of fallos) {
      console.log(`❌ ${x.tema.padEnd(11)} ${x.estado.padEnd(15)} ${x.par.padEnd(34)} ${x.ratio.toFixed(2)}:1 < ${x.minimo}:1 (${x.criterio})`);
      if (x.sugerencia) console.log(`   ${' '.repeat(28)}→ en el tema: ${x.sugerencia}`);
    }
    for (const x of sinMedir) console.log(`⚠️  ${x.tema.padEnd(11)} ${x.estado.padEnd(15)} ${x.par.padEnd(34)} sin medir: ${x.fg || '(vacío)'} / ${x.bg || '(vacío)'}`);
    if (!fallos.length && !sinMedir.length) console.log(`✅ ${CONTRATO.pares.length} pares × ${ficheros.length} temas × ${ESTADOS.length} estados — todo cumple`);
    console.log(`\n   ${medidas} medidas · ${fallos.length} por debajo del mínimo · ${sinMedir.length} sin medir\n`);
  }
  process.exitCode = fallos.length || sinMedir.length ? 1 : 0;
}

if (require.main === module) main();
