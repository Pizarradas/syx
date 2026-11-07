#!/usr/bin/env node
/**
 * SYX — Tintas de respaldo para navegadores sin color relativo
 * ───────────────────────────────────────────────────────────────────────────
 * Las tintas (`--semantic-color-*-text`), las variantes fuertes (`*-strong`) y
 * los colores de código se derivan del color de marca con sintaxis de color
 * relativa, dentro de `@supports`. El browserslist del paquete declara
 * soportados navegadores que no la tienen (chrome/edge 111–118, firefox
 * 121–127, safari 16.2–16.3): ahí esos tokens caían al relleno de marca, que no
 * llega a 4,5:1 como texto (auditoría de 2026-11, F0-08).
 *
 * Este script calcula, sobre el CSS compilado, el valor que pinta un navegador
 * moderno en cada estado de modo y lo escribe como oklch() literal en
 * scss/themes/<tema>/_tintas-respaldo.scss, dentro de `@supports not (…)`. El
 * tema lo incluye al final de su mixin. Resultado: el navegador antiguo pinta
 * lo mismo que el moderno.
 *
 * Límite conocido: el respaldo es estático. Si una página cambia el color de
 * marca en tiempo de ejecución, en un navegador sin color relativo la tinta no
 * lo sigue. Es el precio de no romper a nadie sin subir el browserslist.
 *
 * Es un artefacto derivado: se regenera después de compilar y antes de volver
 * a compilar (`npm run build:css`). `--check` falla si el que hay en disco no
 * es el que sale del CSS actual.
 *
 * Un tema propio (hecho desde scss/themes/_template) necesita lo mismo. Desde
 * la aplicación, después de compilar su hoja:
 *
 *   npx syx-tintas-respaldo css/mi-tema.css scss/themes/mi-tema/_tintas-respaldo.scss
 *
 * y volver a compilar. La plantilla ya incluye el parcial (vacío al principio).
 *
 * Uso: node scripts/build-tintas-respaldo.js [--check]          los 7 temas de SYX
 *      node scripts/build-tintas-respaldo.js <hoja.css> <parcial.scss> [--check]
 * ───────────────────────────────────────────────────────────────────────────
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { declaraciones, estado, resolver } = require('./lib/cascada');

const ROOT = path.join(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'css');
const THEMES_DIR = path.join(ROOT, 'scss', 'themes');

// Los tokens que se derivan con sintaxis relativa, por condición de @supports.
// Si _colors.scss añade otro, check:tintas-respaldo lo detecta (ver abajo).
const SOPORTE_RELATIVO = '(color: oklch(from red l c h))';
const SOPORTE_CLAMP = '(color: oklch(from red clamp(0, l, 1) c h))';
const GRUPOS = [
  {
    soporte: SOPORTE_RELATIVO,
    tokens: [
      '--semantic-color-primary-text', '--semantic-color-secondary-text', '--semantic-color-tertiary-text',
      '--semantic-color-quaternary-text', '--semantic-color-quinary-text',
      '--semantic-color-state-success-text', '--semantic-color-state-error-text',
      '--semantic-color-state-warning-text', '--semantic-color-state-info-text',
      '--semantic-color-code-tag', '--semantic-color-code-attr', '--semantic-color-code-val',
      '--semantic-color-code-fn', '--semantic-color-code-inline-fg',
    ],
  },
  {
    soporte: SOPORTE_CLAMP,
    tokens: ['--semantic-color-primary-strong', '--semantic-color-state-success-strong', '--semantic-color-secondary-strong'],
  },
];

// Estado de modo → selector que lo pinta. El orden importa: a igual
// especificidad gana el último, y elegir oscuro tiene que ganar al oscuro del SO.
const regla = (sel) => (l) => `    ${sel} {\n${l.map((x) => `      ${x}`).join('\n')}\n    }`;
const ESTADOS = [
  { nombre: 'sin elegir, SO claro', eleccion: 'none', so: 'light', bloque: regla(':root') },
  {
    nombre: 'sin elegir, SO oscuro', eleccion: 'none', so: 'dark',
    bloque: (l) => `    @media (prefers-color-scheme: dark) {\n      :root:not([data-theme="light"]) {\n${l.map((x) => `        ${x}`).join('\n')}\n      }\n    }`,
  },
  { nombre: 'claro elegido', eleccion: 'light', so: 'dark', bloque: regla(':root[data-theme="light"]') },
  { nombre: 'oscuro elegido', eleccion: 'dark', so: 'light', bloque: regla(':root[data-theme="dark"]') },
];

/** Cierra el paréntesis que abre en `i` y devuelve el índice del que lo cierra. */
function cierre(s, i) {
  let n = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '(') n++;
    else if (s[j] === ')' && --n === 0) return j;
  }
  return -1;
}

/** Evalúa la luminosidad de la sintaxis relativa: números, calc(), clamp() y `l`. */
function luminosidad(expr, l) {
  const js = expr.replace(/calc\(/g, '(').replace(/,/g, ', ');
  if (!/^[\d.\s+\-*/(),]*(?:(?:clamp|l)[\d.\s+\-*/(),]*)*$/.test(js)) throw new Error(`expresión de luminosidad no soportada: ${expr}`);
  // eslint-disable-next-line no-new-func
  return Function('l', 'clamp', `return (${js});`)(l, (a, v, b) => Math.min(Math.max(v, a), b));
}

const numero = (x) => {
  const t = String(x).trim();
  return t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t);
};
const redondear = (x) => String(Math.round(x * 10000) / 10000);

/** `oklch(from oklch(L C H) <expr> c h)` → `oklch(L' C H)`. Un literal se devuelve tal cual. */
function literal(valor) {
  const v = valor.trim();
  if (!/^oklch\(\s*from\s/.test(v)) return v;
  const ini = v.indexOf('(', v.indexOf('from') + 4);
  const fin = cierre(v, ini);
  const interior = literal(v.slice(v.indexOf('from') + 4, fin + 1).trim());
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*\)$/.exec(interior);
  if (!m) throw new Error(`color de origen no soportado: ${interior}`);
  const [L, C, H] = [numero(m[1]), m[2], m[3]];
  const resto = v.slice(fin + 1, -1).trim();
  const partes = /^(.+)\s+c\s+h$/.exec(resto);
  if (!partes) throw new Error(`solo se admite «<luminosidad> c h»: ${resto}`);
  return `oklch(${redondear(luminosidad(partes[1], L))} ${C} ${H})`;
}

function generar(tema, css) {
  const decls = declaraciones(css);
  const bloques = GRUPOS.map(({ soporte, tokens }) => {
    const reglas = ESTADOS.map((e) => {
      const vars = estado(decls, e.eleccion, e.so);
      const lineas = tokens.map((t) => {
        if (vars[t] === undefined) throw new Error(`${tema}: ${t} no está declarado en «${e.nombre}»`);
        return `${t}: ${literal(resolver(vars, vars[t]))};`;
      });
      return `    // ${e.nombre}\n${e.bloque(lineas)}`;
    });
    return `  @supports not ${soporte} {\n${reglas.join('\n\n')}\n  }`;
  });
  return `// ════════════════════════════════════════════════════════════════
// GENERADO por scripts/build-tintas-respaldo.js — no editar a mano.
// Regenerar: npm run build:css · comprobar: npm run check:tintas-respaldo
// ════════════════════════════════════════════════════════════════
// Tema ${tema}: lo que pinta un navegador con color relativo, escrito como
// literal para los que no lo tienen. Ver la cabecera del script.

@mixin tintas-respaldo {
${bloques.join('\n\n')}
}
`;
}

/** Tokens con sintaxis relativa en el CSS que este script no cubre. */
function sinCubrir(css) {
  const cubiertos = new Set(GRUPOS.flatMap((g) => g.tokens));
  const re = /(--[\w-]+)\s*:\s*[a-z]+\(\s*from\s/g;
  const fuera = new Set();
  for (let m; (m = re.exec(css));) if (!cubiertos.has(m[1])) fuera.add(m[1]);
  return [...fuera];
}

/** Un tema suelto: el de una aplicación, o la plantilla en check-plantilla. */
function unTema(hoja, destino, check) {
  const tema = path.basename(hoja).replace(/^styles-theme-|\.css$/g, '');
  const css = fs.readFileSync(hoja, 'utf8');
  const fuera = sinCubrir(css);
  if (fuera.length) throw new Error(`usan color relativo y no tienen respaldo: ${fuera.join(', ')}`);
  const salida = generar(tema, css);
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') : null;
  const rel = path.relative(process.cwd(), destino).replace(/\\/g, '/');
  if (actual === salida) return `✓ ${rel} al día`;
  if (check) throw new Error(`${rel} está desfasado: vuelve a generarlo y a compilar`);
  fs.writeFileSync(destino, salida);
  return `✓ escrito ${rel} — vuelve a compilar la hoja para que lo incluya`;
}

function main() {
  const check = process.argv.includes('--check');
  const rutas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (rutas.length) {
    if (rutas.length !== 2) {
      console.error('Uso: syx-tintas-respaldo <hoja.css> <parcial.scss> [--check]');
      process.exit(2);
    }
    try { console.log(unTema(path.resolve(rutas[0]), path.resolve(rutas[1]), check)); } catch (e) {
      console.error(`❌ tintas de respaldo: ${e.message}`);
      process.exit(1);
    }
    return;
  }
  const ficheros = fs.readdirSync(CSS_DIR).filter((f) => /^styles-theme-.+\.css$/.test(f)).sort();
  const errores = [];
  let escritos = 0;
  for (const f of ficheros) {
    const tema = f.replace(/^styles-theme-|\.css$/g, '');
    const destino = path.join(THEMES_DIR, tema, '_tintas-respaldo.scss');
    if (!fs.existsSync(path.dirname(destino))) continue;
    const css = fs.readFileSync(path.join(CSS_DIR, f), 'utf8');
    for (const t of sinCubrir(css)) errores.push(`${tema}: ${t} usa color relativo y no tiene respaldo (añádelo a GRUPOS)`);
    let salida;
    try { salida = generar(tema, css); } catch (e) { errores.push(e.message); continue; }
    const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') : null;
    if (actual === salida) continue;
    if (check) { errores.push(`${path.relative(ROOT, destino)} está desfasado: npm run build:css`); continue; }
    fs.writeFileSync(destino, salida);
    escritos++;
    console.log(`   escrito  ${path.relative(ROOT, destino).replace(/\\/g, '/')}`);
  }
  if (errores.length) {
    console.error(`❌ tintas de respaldo:\n${errores.map((e) => `   · ${e}`).join('\n')}`);
    process.exit(1);
  }
  console.log(check
    ? `✓ check:tintas-respaldo — ${ficheros.length} temas al día`
    : `✓ build:tintas-respaldo — ${ficheros.length} temas · ${escritos} escrito(s)`);
}

if (require.main === module) main();
module.exports = { literal, luminosidad, generar, unTema, GRUPOS, SOPORTE_RELATIVO, SOPORTE_CLAMP };
