#!/usr/bin/env node
/**
 * SYX — Prueba del motor de reglas
 * ────────────────────────────────
 * El validador de R01–R04 se esquivó durante meses cambiando el FORMATO del
 * código: sin espacio tras los dos puntos, en una sola línea, `! important`,
 * `transition-property`… y nadie lo notó porque ninguna prueba intentaba
 * esquivarlo. Esta lo intenta. Cada evasión que se encontró en la auditoría de
 * octubre de 2026 está aquí como un caso que DEBE fallar, y al lado los que NO
 * deben fallar —comentarios, cadenas de ejemplo, el mixin correcto, las rutas
 * que el contrato permite—, porque un guardián con falsos positivos se apaga a
 * la tercera vez que molesta.
 *
 * Además comprueba lo que el motor promete por fuera:
 *   · que todo sale de contracts/rules.json (severidad, rutas, matchers): se
 *     cambia una copia del contrato en un directorio temporal y el motor cambia
 *     de opinión sin tocar código;
 *   · que validate_snippet, el criterio C1 de las evaluaciones y el validador
 *     del repositorio dan el MISMO veredicto, porque son el mismo motor;
 *   · que el repositorio real está limpio (lo que `npm run validate` exige).
 *
 * Uso: node scripts/check-reglas.js   ·   npm run check:reglas
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { crearMotor } = require('./lib/rules');
const { crearConsulta } = require('./lib/consulta');
const { evaluar } = require('./lib/evaluar');

const ROOT = path.join(__dirname, '..');
const motor = crearMotor({ root: ROOT });
const syx = crearConsulta({ root: ROOT });

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

const ATOMO = 'scss/atoms/_prueba.scss';
const CAPA_COMPONENTE = 'scss/abstracts/tokens/components/_prueba.scss';
const TEMA = 'scss/themes/prueba/_theme.scss';

/** Qué reglas incumple un fragmento: ['R03', 'R04', …] (y 'sintaxis' si no parsea). */
function incumple(codigo, rel = ATOMO) {
  const v = motor.revisar(rel, codigo);
  return Object.entries(v).filter(([, x]) => x.length).map(([k]) => k).sort();
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ─── 1 · Lo que DEBE fallar ──────────────────────────────────────────────────
// [descripción, código, reglas esperadas, ruta opcional]

const DEBEN_FALLAR = [
  // Las evasiones medidas en la auditoría
  ['transition sin espacio', '.a {\n  transition:opacity .2s;\n}', ['R03']],
  ['position sin espacio', '.a {\n  position:absolute;\n}', ['R04']],
  ['todo en una línea', '.a { transition: opacity .2s; position: absolute; }', ['R03', 'R04']],
  ['var( con espacio', '.a {\n  color: var( --primitive-color-blue-500);\n}', ['R01']],
  ['! important con espacio', '.a {\n  color: red ! important;\n}', ['R02']],
  ['transition-property', '.a {\n  transition-property: opacity;\n}', ['R03']],
  ['mixin que no existe', '.a {\n  @include magic-center();\n}', ['R09']],
  // Variantes de las mismas
  ['!IMPORTANT en mayúsculas', '.a { color: red !IMPORTANT }', ['R02']],
  ['!important en un custom property', '.a { --x: red !important; }', ['R02']],
  ['!important en los parámetros de un @include', '.a { @include padding(1rem !important); }', ['R02']],
  ['transition con prefijo de fabricante', '.a { -webkit-transition: opacity .2s; }', ['R03']],
  ['transition-duration', '.a { transition-duration: .2s; }', ['R03']],
  ['propiedad anidada de Sass', '.a {\n  transition: {\n    duration: .2s;\n  }\n}', ['R03']],
  ['position: -webkit-sticky', '.a { position: -webkit-sticky; }', ['R04']],
  ['POSITION: Fixed', '.a { POSITION: Fixed; }', ['R04']],
  ['position anidado y sin punto y coma', '.a { &:hover { .b { position: sticky } } }', ['R04']],
  ['position interpolado', '.a { position: #{absolute}; }', ['R04']],
  ['primitivo en los parámetros de un @include', '.a { @include padding(var(--primitive-space-1)); }', ['R01']],
  ['primitivo en una variable Sass', '$x: var(--primitive-space-1);', ['R01']],
  ['primitivo dentro de un calc', '.a { gap: calc(2 * var(--primitive-space-base)); }', ['R01']],
  ['mixin con espacio de nombres que no existe', '.a { @include m.magic-center; }', ['R09']],
  // Rutas: lo que el contrato prohíbe, se lea como se lea
  ['primitivo en scss/pages/ (el contrato lo prohíbe)', '.a { color: var(--primitive-color-white); }', ['R01'], 'scss/pages/_x.scss'],
  ['primitivo en scss/site/', '.a { color: var(--primitive-color-white); }', ['R01'], 'scss/site/_x.scss'],
  ['primitivo en un fichero que antes estaba exceptuado entero', '.a { color: var(--primitive-color-white); }', ['R01'], 'scss/atoms/_pill.scss'],
  ['transition en base/ (solo los mixins pueden)', '.a { transition: none; }', ['R03'], 'scss/base/_x.scss'],
  ['position: fixed en _reset (permiso retirado: no excusaba nada)', '.a { position: fixed; }', ['R04'], 'scss/base/_reset.scss'],
  // Excepciones mal usadas
  ['excepción muerta', '.a {\n  // syx-allow R03: el autofill de Chrome lo necesita\n  color: red;\n}', ['R10']],
  ['excepción sin porqué', '.a {\n  // syx-allow R03:\n  transition: none;\n}', ['R03', 'R10']],
  ['excepción con porqué de relleno', '.a {\n  // syx-allow R03: porque sí\n  transition: none;\n}', ['R03', 'R10']],
  ['excepción a una regla que no la admite', '.a {\n  // syx-allow R02: hace falta ganar a un tercero\n  color: red !important;\n}', ['R02', 'R10']],
  ['excepción a una regla que no existe', '.a {\n  // syx-allow R99: una regla inventada para colarla\n  color: red;\n}', ['R10']],
  ['excepción mal escrita', '.a {\n  // syx-allow transition porque es un caso raro\n  transition: none;\n}', ['R03', 'R10']],
  ['excepción sobre un bloque entero', '// syx-allow R04: toda la pieza va posicionada\n.a {\n  position: absolute;\n}', ['R04', 'R10']],
  ['excepción separada por una línea en blanco', '.a {\n  // syx-allow R03: el autofill de Chrome lo necesita\n\n  transition: none;\n}', ['R03', 'R10']],
  ['excepción que solo cubre una de dos reglas', '.a {\n  // syx-allow R03, R04: el autofill de Chrome lo necesita\n  transition: none;\n}', ['R10']],
  ['excepción que no alcanza a la declaración siguiente', '.a {\n  // syx-allow R03: el autofill de Chrome lo necesita\n  transition: none;\n  transition-delay: 0s;\n}', ['R03']],
  // R11: lo que lee un token de componente (acción 14 de 2026-10). R01 deja
  // pasar primitivos en abstracts/ y en themes/; R11 mira justo ahí.
  ['componente que lee un primitivo', ':root { --component-x-bg: var(--primitive-color-blue-50); }', ['R11'], CAPA_COMPONENTE],
  ['componente que lee un primitivo dentro de un calc', ':root { --component-x-gap: calc(2 * var(--primitive-space-base)); }', ['R11'], CAPA_COMPONENTE],
  ['componente que deriva de un primitivo', ':root { --component-x-fg: oklch(from var(--primitive-color-red-600) 0.45 c h); }', ['R11'], CAPA_COMPONENTE],
  ['componente que mezcla con un primitivo', ':root { --component-x-bg: color-mix(in srgb, var(--semantic-color-primary) 12%, var(--primitive-color-white)); }', ['R11'], CAPA_COMPONENTE],
  ['componente que lee una variable heredada', ':root { --component-x-gap: calc(3 * var(--base-measure)); }', ['R11'], CAPA_COMPONENTE],
  ['componente con un color literal oklch', ':root { --component-x-color: oklch(1 0 0); }', ['R11'], CAPA_COMPONENTE],
  ['componente con un hexadecimal', ':root { --component-x-color: #1e3aff; }', ['R11'], CAPA_COMPONENTE],
  ['componente con white', ':root { --component-x-color: white; }', ['R11'], CAPA_COMPONENTE],
  ['componente con una sombra de color literal', ':root { --component-x-shadow: 0 1px 2px rgb(0 0 0 / 0.2); }', ['R11'], CAPA_COMPONENTE],
  ['sobrescritura de componente en un tema que lee un primitivo', '@mixin theme-x { :root { --component-pill-primary-bg: var(--primitive-color-blue-50); } }', ['R11'], TEMA],
  ['sobrescritura de componente en el oscuro de un tema', '@mixin theme-x { :root[data-theme="dark"] { --component-code-bg: oklch(0.16 0.028 258); } }', ['R11'], TEMA],
  ['excepción a R11 sin porqué', ':root {\n  // syx-allow R11:\n  --component-x: var(--primitive-y);\n}', ['R10', 'R11'], CAPA_COMPONENTE],
  // Lo que no se puede leer no se da por bueno
  ['SCSS que no parsea', '.a { color: red', ['sintaxis']],
];

for (const [nombre, codigo, esperado, rel] of DEBEN_FALLAR) {
  comprobar(`falla: ${nombre}`, () => {
    const r = incumple(codigo, rel);
    if (!igual(r, [...esperado].sort())) throw new Error(`esperaba ${esperado.join(', ')} y da ${r.join(', ') || 'conforme'}`);
  });
}

// ─── 2 · Lo que NO debe fallar ───────────────────────────────────────────────

const NO_DEBEN_FALLAR = [
  ['!important en un comentario de línea', '.a {\n  color: red; // !important\n}'],
  ['!important en un comentario de bloque', '.a {\n  /* position: absolute; transition: x; !important */\n  color: red;\n}'],
  ['comentario dentro del valor', '.a { color: red /* !important */; }'],
  ['reglas en un comentario de línea', '// transition: opacity .2s; position: fixed; var(--primitive-x) !important\n.a { color: red; }'],
  ['ejemplos en cadenas', '.a::after { content: "!important · position: absolute · var(--primitive-x)"; }'],
  ['ejemplos en cadenas con comillas simples', ".a { font-family: 'var(--primitive-font) !important'; }"],
  ['los mixins correctos', '.a {\n  @include transition(opacity .2s);\n  @include absolute($top: 0);\n  @include position(fixed, $bottom: 0);\n  @include sticky();\n}'],
  ['position relativa y estática', '.a { position: relative; } .b { position: static; }'],
  ['transition en el nombre de un custom property o una variable', '.a { --component-x-transition: 1s; $transition: 1s; }'],
  ['un semántico', '.a { color: var(--semantic-color-primary); }'],
  ['un @include con cuerpo de un mixin que existe', '.a { @include breakpoint(md) { color: red; } }'],
  ['un mixin definido en el propio fragmento', '@mixin mio($x) { color: $x; }\n.a { @include mio(red); }'],
  ['un mixin de un módulo de Sass', '@use "sass:meta";\n.a { @include meta.load-css("x"); }'],
  ['un mixin del sistema con espacio de nombres', '.a { @include mixins.transition(opacity .2s); }'],
  ['excepción bien escrita', '.a {\n  // syx-allow R03: el autofill de Chrome lo necesita\n  transition: background-color 600000s 0s;\n}'],
  ['excepción a dos reglas en una línea', '.a {\n  // syx-allow R03, R01: demostración de un caso doble\n  transition: color var(--primitive-duration-fast);\n}'],
  // R11: lo que un token de componente SÍ puede leer
  ['componente que lee un semántico', ':root { --component-x-bg: var(--semantic-color-tone-primary-subtle-bg); }', CAPA_COMPONENTE],
  ['componente que hereda de otro componente', ':root { --component-x-hover: var(--component-x-bg); }', CAPA_COMPONENTE],
  ['componente que deriva de un semántico', ':root { --component-x-fg: oklch(from var(--semantic-color-primary) 0.82 c h); }', CAPA_COMPONENTE],
  ['componente que mezcla un semántico con transparente', ':root { --component-x-bg: color-mix(in srgb, var(--semantic-color-primary) 10%, transparent); }', CAPA_COMPONENTE],
  ['componente con transparent y currentColor', ':root { --component-x-bg: transparent; --component-x-fg: currentColor; }', CAPA_COMPONENTE],
  ['componente con medidas literales', ':root { --component-x-gap: 0.75rem; --component-x-size: 3rem; }', CAPA_COMPONENTE],
  ['componente que lee un icono', ':root { --component-x-icon: var(--lc-icon-check); --component-y-icon: var(--icon-logo); }', CAPA_COMPONENTE],
  ['componente que lee la forma del tema', ':root { --component-x-radius: var(--theme-radius); --component-x-max: var(--layout-max-width); }', CAPA_COMPONENTE],
  ['color de un ejemplo dentro de una cadena', ':root { --component-x-content: "white #fff oklch(1 0 0)"; }', CAPA_COMPONENTE],
  ['un tema que traduce un primitivo a un semántico', '@mixin theme-x { :root { --semantic-color-tone-primary-subtle-bg: var(--primitive-color-blue-50); --semantic-color-code-bg: oklch(0.16 0.028 258); } }', TEMA],
  ['la capa del sitio, que no es del sistema', ':root { --component-section-bg: var(--primitive-color-gray-50); }', 'scss/site/tokens/_prueba.scss'],
  ['un átomo que fija su color en un modificador (R11 mira la capa de tokens)', '.a--white { --component-icon-color: oklch(1 0 0); }'],
  ['excepción a R11 con porqué', ':root {\n  // syx-allow R11: demostración de una excepción bien escrita\n  --component-x: var(--primitive-y);\n}', CAPA_COMPONENTE],
];

for (const [nombre, codigo, rel] of NO_DEBEN_FALLAR) {
  comprobar(`pasa: ${nombre}`, () => {
    const r = incumple(codigo, rel);
    if (r.length) throw new Error(`da ${r.join(', ')} y no debía`);
  });
}

// Las rutas que el contrato permite, leídas del contrato y no escritas aquí.
comprobar('pasa: cada ruta de allowedIn permite lo suyo', () => {
  const muestras = {
    R01: '.a { color: var(--primitive-color-white); }',
    R03: '.a { transition: none; }',
    R04: '.a { position: absolute; }',
  };
  let n = 0;
  for (const regla of motor.reglas.filter((r) => muestras[r.id])) {
    for (const p of regla.allowedIn) {
      const rel = p.endsWith('/') ? `${p}_muestra.scss` : p;
      const r = motor.revisar(rel, muestras[regla.id]);
      if (r[regla.id].length) throw new Error(`${regla.id} salta en ${rel}, que el contrato permite`);
      n++;
    }
  }
  return `${n} rutas`;
});

// ─── 3 · El contrato manda ───────────────────────────────────────────────────
// Una copia del contrato en un directorio temporal, cambiada, y el motor tiene
// que cambiar de opinión sin que se toque una línea de código.

function contratoTemporal(cambiar) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-reglas-'));
  fs.mkdirSync(path.join(dir, 'contracts'));
  fs.mkdirSync(path.join(dir, 'scss', 'abstracts', 'mixins'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'scss', 'abstracts', 'mixins', '_m.scss'), '@mixin transition($p...) { transition: $p; }\n');
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts', 'rules.json'), 'utf8'));
  cambiar(c);
  fs.writeFileSync(path.join(dir, 'contracts', 'rules.json'), JSON.stringify(c));
  return dir;
}
const regla = (c, id) => c.rules.find((r) => r.id === id);

comprobar('contrato: la severidad sale de rules.json', () => {
  const dir = contratoTemporal((c) => { regla(c, 'R03').severity = 'warning'; });
  const m = crearMotor({ root: dir });
  if (m.severidad('R03') !== 'warning') throw new Error(`severidad ${m.severidad('R03')}`);
  if (motor.severidad('R03') !== 'error') throw new Error('el contrato real debería decir error');
});

comprobar('contrato: allowedIn sale de rules.json', () => {
  const dir = contratoTemporal((c) => { regla(c, 'R01').allowedIn.push('scss/atoms/'); });
  const m = crearMotor({ root: dir });
  if (m.revisar(ATOMO, '.a { color: var(--primitive-x); }').R01.length) throw new Error('no respeta la ruta añadida');
});

comprobar('contrato: lo que se prohíbe sale de rules.json (match)', () => {
  const dir = contratoTemporal((c) => { regla(c, 'R04').match.values.push('relative'); });
  const m = crearMotor({ root: dir });
  if (!m.revisar(ATOMO, '.a { position: relative; }').R04.length) throw new Error('no amplía R04 con el contrato');
});

comprobar('contrato: dónde se aplica una regla sale de rules.json (appliesIn)', () => {
  const codigo = ':root { --component-x: var(--primitive-y); }';
  if (motor.revisar(ATOMO, '.a { --component-x: oklch(1 0 0); }').R11.length) throw new Error('R11 salta fuera de appliesIn');
  const dir = contratoTemporal((c) => { regla(c, 'R11').appliesIn.push('scss/atoms/'); });
  const m = crearMotor({ root: dir });
  if (!m.revisar(ATOMO, '.a { --component-x: oklch(1 0 0); }').R11.length) throw new Error('no amplía R11 con el contrato');
  const sin = contratoTemporal((c) => { regla(c, 'R11').appliesIn = ['scss/otra-capa/']; });
  if (crearMotor({ root: sin }).revisar(CAPA_COMPONENTE, codigo).R11.length) throw new Error('no la acota con el contrato');
});

comprobar('contrato: lo que puede leer un componente sale de rules.json (mayRead)', () => {
  const codigo = ':root { --component-x: var(--primitive-y); }';
  const dir = contratoTemporal((c) => { regla(c, 'R11').match.mayRead.push('--primitive-'); });
  if (crearMotor({ root: dir }).revisar(CAPA_COMPONENTE, codigo).R11.length) throw new Error('no respeta mayRead');
});

comprobar('contrato: un match que el motor no sabe comprobar es un error, no un silencio', () => {
  const dir = contratoTemporal((c) => { regla(c, 'R01').match.kind = 'algo-nuevo'; });
  let error = null;
  try { crearMotor({ root: dir }); } catch (e) { error = e; }
  if (!error) throw new Error('aceptó un matcher desconocido');
});

comprobar('contrato: un permiso de fichero muerto es error (R10)', () => {
  // Sin ningún fichero, scss/setup-builder.scss no excusa nada.
  const r = motor.revisarTodos([]);
  if (!r.violaciones.R10.some((x) => /setup-builder\.scss/.test(x.content))) throw new Error('no detecta el permiso muerto');
  // Y con el fichero real, que sí usa primitivos, no hay nada que decir.
  const rel = 'scss/setup-builder.scss';
  const r2 = motor.revisarTodos([{ rel, content: fs.readFileSync(path.join(ROOT, rel), 'utf8') }]);
  if (r2.violaciones.R10.length) throw new Error(JSON.stringify(r2.violaciones.R10));
});

comprobar('contrato: un permiso a un fichero que no existe es error (R10)', () => {
  const dir = contratoTemporal((c) => { regla(c, 'R04').allowedIn.push('scss/no-existe.scss'); });
  const r = crearMotor({ root: dir }).revisarTodos([]);
  if (!r.violaciones.R10.some((x) => /no-existe/.test(x.content) && /no existe/.test(x.motivo))) throw new Error('no lo detecta');
});

// ─── 4 · Un solo motor para los tres que preguntan ──────────────────────────

const EVASIONES = '.a { transition:opacity .2s; position:absolute; color: var( --primitive-x) ! important; @include magic-center(); }';

comprobar('validate_snippet da el veredicto del motor, con el formato de siempre', () => {
  const r = syx.validateSnippet({ code: EVASIONES });
  if (r.conforme !== false) throw new Error('lo da por conforme');
  const claves = Object.keys(r.violaciones).sort();
  if (!igual(claves, incumple(EVASIONES))) throw new Error(`${claves} ≠ ${incumple(EVASIONES)}`);
  for (const k of claves) {
    if (!r.violaciones[k].regla || !Array.isArray(r.violaciones[k].casos)) throw new Error(`${k} sin regla/casos`);
  }
  if (!r.violaciones.R09.casos[0].sugerencias) throw new Error('R09 sin sugerencias');
  return claves.join(' ');
});

comprobar('validate_snippet: lo que no parsea no es conforme', () => {
  const r = syx.validateSnippet({ code: '.a { color: red' });
  if (r.conforme || !r.sintaxis) throw new Error(JSON.stringify(r));
});

comprobar('validate_snippet enseña las excepciones que usa', () => {
  const r = syx.validateSnippet({ code: '.a {\n  // syx-allow R03: el autofill de Chrome lo necesita\n  transition: none;\n}' });
  if (!r.conforme) throw new Error(JSON.stringify(r.violaciones));
  if (!r.excepciones || r.excepciones[0].regla !== 'R03') throw new Error('no la enseña');
});

comprobar('el criterio C1 de las evaluaciones suspende las evasiones', () => {
  const tarea = { id: 'prueba', modo: 'ui', scss: { ruta: ATOMO } };
  const mal = evaluar({ tarea, respuesta: '```scss\n' + EVASIONES + '\n```', syx });
  const bien = evaluar({ tarea, respuesta: '```scss\n.a { @include transition(opacity .2s); }\n```', syx });
  const c1 = (e) => e.criterios.find((c) => c.id === 'C1');
  if (c1(mal).nota !== 0) throw new Error(`C1 da ${c1(mal).nota} a las evasiones`);
  if (c1(bien).nota !== 2) throw new Error(`C1 da ${c1(bien).nota} al código correcto: ${c1(bien).detalle}`);
});

// ─── 5 · El repositorio real ─────────────────────────────────────────────────

function scssDe(dir, fuera = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scssDe(p, fuera);
    else if (e.name.endsWith('.scss')) fuera.push({ rel: path.relative(ROOT, p).split(path.sep).join('/'), content: fs.readFileSync(p, 'utf8') });
  }
  return fuera;
}

comprobar('el repositorio real está limpio', () => {
  const ficheros = scssDe(path.join(ROOT, 'scss'));
  const r = motor.revisarTodos(ficheros);
  const malos = Object.entries(r.violaciones).flatMap(([k, v]) => v.map((x) => `${k} ${x.file}:${x.line} ${x.motivo || ''}`));
  malos.push(...r.sintaxis.map((x) => `sintaxis ${x.file}:${x.line}`));
  if (malos.length) throw new Error(malos.join(' · '));
  return `${ficheros.length} ficheros · ${r.excepciones.length} excepciones en línea`;
});

// ─── Informe ────────────────────────────────────────────────────────────────

console.log('\n── MOTOR DE REGLAS ─────────────────────────────────────────────\n');
let fallos = 0;
for (const c of casos) {
  try {
    const detalle = c.fn();
    console.log(`✅ ${c.nombre}${detalle ? ` — ${detalle}` : ''}`);
  } catch (e) {
    fallos++;
    console.log(`❌ ${c.nombre} — ${e.message}`);
  }
}
console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
process.exit(fallos ? 1 : 0);
