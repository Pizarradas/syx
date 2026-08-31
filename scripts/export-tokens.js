#!/usr/bin/env node
/**
 * SYX — Exportador de tokens al formato W3C DTCG
 * ──────────────────────────────────────────────
 * Convierte contracts/resolved-tokens.json al formato del Design Tokens
 * Community Group del W3C, que es lo que entienden Style Dictionary, Figma
 * Variables, Tokens Studio y compañía.
 *
 * POR QUÉ EXISTE
 * `npm run export:tokens` llevaba en package.json apuntando a un fichero que
 * nunca se escribió. Era, de las tres promesas incumplidas del repositorio, la
 * que más importaba: el exportador es la puerta por la que SYX habla con
 * herramientas que no son SYX. No se pudo hacer antes porque no había nada
 * resuelto que exportar — tokens.json guarda referencias `var()`, no valores.
 * Con el snapshot del paso 0.2 sí lo hay.
 *
 * QUÉ SALE
 * Un fichero por tema y modo en contracts/dtcg/. DTCG no tiene una noción de
 * tema, así que la alternativa habría sido inventarse una extensión propia; un
 * fichero por combinación es lo que las herramientas saben leer sin ayuda.
 *
 * SOBRE LAS EXPRESIONES
 * DTCG describe VALORES, y `color-mix()`, `calc()` u `oklch(from …)` no lo son:
 * son expresiones que solo un navegador reduce. Se exportan igualmente, sin
 * `$type` y marcadas en `$extensions`, porque omitirlas mentiría por ausencia:
 * quien importe esto vería un sistema con 260 tokens menos de los que tiene.
 *
 * Uso:
 *   node scripts/export-tokens.js
 *   node scripts/export-tokens.js --theme syx-sketch --mode dark
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(ROOT, 'contracts', 'resolved-tokens.json');
const OUT_DIR = path.join(ROOT, 'contracts', 'dtcg');

// ─── Inferir el $type de DTCG a partir del valor ─────────────────────────────
// DTCG lo exige para que la herramienta receptora sepa qué hacer con el token.
// SYX no lo declara en ninguna parte, así que se deduce del valor, que es lo
// único que hay. Cuando no se puede deducir con seguridad, se omite: un tipo
// equivocado es peor que ninguno, porque la herramienta actúa sobre él.

const EXPRESION = /\b(color-mix|calc|clamp|min|max|light-dark)\s*\(|\b(oklch|rgb|hsl|lab|lch)\(\s*from\b/;

function inferirTipo(nombre, valor) {
  const v = valor.trim();
  if (/^(#|oklch\(|oklab\(|rgba?\(|hsla?\(|lab\(|lch\(|color\()/i.test(v)) return 'color';
  if (/^(transparent|currentcolor)$/i.test(v)) return 'color';
  if (/^-?[0-9.]+(px|rem|em|vh|vw|ch|%)$/.test(v)) return 'dimension';
  if (/^-?[0-9.]+(s|ms)$/.test(v)) return 'duration';
  if (/^cubic-bezier\(/.test(v)) return 'cubicBezier';
  if (/^-?[0-9.]+$/.test(v)) return 'number';
  if (/font-family/.test(nombre)) return 'fontFamily';
  if (/font-weight/.test(nombre)) return 'fontWeight';
  if (/(^|-)(shadow)(-|$)/.test(nombre) && /\d/.test(v)) return 'shadow';
  return null;
}

// --component-button-primary-bg → component › button › primary › bg
function ruta(nombre) {
  return nombre.replace(/^--/, '').split('-').filter(Boolean);
}

function insertar(arbol, segmentos, hoja) {
  let nodo = arbol;
  let colision = false;
  for (let i = 0; i < segmentos.length - 1; i++) {
    const s = segmentos[i];
    // Un token puede llamarse igual que un grupo: existen
    // `--component-button-primary-color` y `--component-button-primary-color-hover`,
    // así que `color` tiene que ser hoja y grupo a la vez, y DTCG no lo admite.
    // El valor del nodo padre baja a una hoja `DEFAULT` dentro del grupo, que es
    // la convención que Style Dictionary y Tailwind ya usan para esto. Antes se
    // le ponía un sufijo `_`, que resolvía la colisión pero dejaba un nombre
    // arbitrario que nadie sabría interpretar al importar.
    if (nodo[s] && nodo[s].$value !== undefined) {
      const hojaPrevia = nodo[s];
      nodo[s] = { DEFAULT: hojaPrevia };
      colision = true;
    }
    nodo[s] = nodo[s] || {};
    nodo = nodo[s];
  }
  const ultimo = segmentos[segmentos.length - 1];
  if (nodo[ultimo] && nodo[ultimo].$value === undefined) {
    nodo[ultimo].DEFAULT = hoja; // ya era un grupo: la hoja entra como DEFAULT
    colision = true;
  } else {
    nodo[ultimo] = hoja;
  }
  return colision;
}

function exportar(snap, tema, modo) {
  const efectivo = {
    ...snap.base,
    ...snap.themes[tema].light,
    ...(modo === 'dark' ? snap.themes[tema].dark : {}),
  };
  const sinValor = snap.themes[tema].unresolved || {};
  const noResueltos = sinValor[modo] || sinValor;

  const arbol = {
    $description: `SYX Design System — tema ${tema}, modo ${modo}. Generado desde el CSS compilado; no editar a mano.`,
  };
  const stats = { total: 0, tipados: 0, expresiones: 0, omitidos: 0, colisiones: 0 };

  for (const [nombre, bruto] of Object.entries(efectivo)) {
    // Los que no llegan a tener valor no se exportan: DTCG no tiene forma de
    // representar "este token existe pero está roto", y colarlo con valor vacío
    // haría que la herramienta receptora pintara con nada.
    if (noResueltos[nombre]) { stats.omitidos++; continue; }

    let valor = bruto;
    if (valor.startsWith('@asset/')) valor = snap.assets[valor.slice(7)];

    const hoja = { $value: valor };
    const esExpr = EXPRESION.test(valor);
    if (esExpr) {
      stats.expresiones++;
      hoja.$extensions = {
        'com.syx': {
          expression: true,
          note: 'Expresión CSS con las variables ya sustituidas. Solo un navegador la reduce a un valor final.',
        },
      };
    } else {
      const tipo = inferirTipo(nombre, valor);
      if (tipo) { hoja.$type = tipo; stats.tipados++; }
    }
    if (insertar(arbol, ruta(nombre), hoja)) stats.colisiones++;
    stats.total++;
  }
  return { arbol, stats };
}

function main() {
  if (!fs.existsSync(SNAP)) {
    console.error('Falta contracts/resolved-tokens.json. Ejecuta antes: npm run build:tokens');
    process.exit(1);
  }
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));

  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
  const temas = arg('--theme') ? [arg('--theme')] : snap._meta.themes;
  const modos = arg('--mode') ? [arg('--mode')] : snap._meta.modes;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('\n── EXPORTACIÓN W3C DTCG ────────────────────────────────────────\n');

  const acumulado = { total: 0, tipados: 0, expresiones: 0, omitidos: 0, colisiones: 0 };
  const escritos = [];

  for (const tema of temas) {
    if (!snap.themes[tema]) { console.error(`   tema desconocido: ${tema}`); process.exit(1); }
    for (const modo of modos) {
      const { arbol, stats } = exportar(snap, tema, modo);
      const destino = path.join(OUT_DIR, `${tema}.${modo}.tokens.json`);
      fs.writeFileSync(destino, JSON.stringify(arbol, null, 2) + '\n');
      escritos.push({ destino, stats });
      for (const k of Object.keys(acumulado)) acumulado[k] += stats[k];
    }
  }

  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
  console.log(`   ficheros            ${escritos.length}  en contracts/dtcg/`);
  console.log(`   tokens exportados   ${acumulado.total}`);
  console.log(`   con $type inferido  ${acumulado.tipados}  (${pct(acumulado.tipados, acumulado.total)})`);
  console.log(`   expresiones         ${acumulado.expresiones}  (sin $type, marcadas en $extensions)`);
  console.log(`   omitidos por rotos  ${acumulado.omitidos}`);
  console.log(`   nombre = hoja y grupo a la vez  ${acumulado.colisiones}  (el valor baja a \`DEFAULT\`)`);
  console.log(`   ejemplo             ${path.relative(ROOT, escritos[0].destino)}`);
  console.log('');
}

main();
