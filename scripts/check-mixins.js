#!/usr/bin/env node
/**
 * SYX — Prueba del lector de mixins
 * ─────────────────────────────────
 * La comprobación que importa es de ida y vuelta: **todo `@mixin` del SCSS
 * aparece en la lista, y todo lo que la lista dice está en el SCSS**. Un lector
 * que se inventara un mixin, o que se dejara uno fuera, produciría exactamente
 * el daño que este trabajo venía a evitar: un agente escribiendo
 * `@include algo()` que no existe, o sin enterarse de que existía el que
 * necesitaba.
 *
 * No se comprueba contra una lista escrita a mano de los 44 nombres. Esa lista
 * envejecería el día que alguien añadiera un mixin, y peor: envejecería en
 * silencio, que es como envejecen las listas.
 *
 * Uso: node scripts/check-mixins.js   ·   npm run check:mixins
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { leer, recambioPara } = require('./lib/mixins');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'scss', 'abstracts', 'mixins');

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

console.log('\n── LECTOR DE MIXINS ────────────────────────────────────────────\n');

const mixins = leer(ROOT);

// Los nombres tal cual los declara el SCSS, contados aparte del lector.
const enFuente = new Map();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.scss'))) {
  const texto = fs.readFileSync(path.join(DIR, f), 'utf8');
  for (const m of texto.matchAll(/@mixin\s+([a-zA-Z0-9_-]+)/g)) {
    enFuente.set(m[1], `scss/abstracts/mixins/${f}`);
  }
}

comprobar('ni se deja ninguno ni se inventa ninguno', () => {
  const leidos = new Set(mixins.map((m) => m.name));
  const faltan = [...enFuente.keys()].filter((n) => !leidos.has(n));
  const sobran = [...leidos].filter((n) => !enFuente.has(n));
  if (faltan.length) throw new Error(`no lee ${faltan.length}: ${faltan.join(', ')}`);
  if (sobran.length) throw new Error(`se inventa ${sobran.length}: ${sobran.join(', ')}`);
  if (leidos.size !== enFuente.size) throw new Error('los recuentos no cuadran');
});

comprobar('cada mixin apunta al fichero y la línea donde de verdad está', () => {
  for (const m of mixins) {
    if (m.file !== enFuente.get(m.name)) throw new Error(`${m.name} dice vivir en ${m.file}`);
    const linea = fs.readFileSync(path.join(ROOT, m.file), 'utf8').split('\n')[m.line - 1];
    if (!linea.includes(`@mixin ${m.name}`)) {
      throw new Error(`${m.name}: la línea ${m.line} dice «${linea.trim().slice(0, 50)}»`);
    }
  }
});

comprobar('lee los valores por defecto sin partirse en las comas de dentro', () => {
  // `focus-ring($color: var(--semantic-color-state-focus), $offset: 3px)` tiene
  // una coma DENTRO del primer valor por defecto. Partir por comas da tres
  // parámetros donde hay dos, y el segundo con un nombre imposible.
  const f = mixins.find((m) => m.name === 'focus-ring');
  if (!f) throw new Error('no está focus-ring');
  if (f.params.length !== 2) throw new Error(`${f.params.length} parámetros, esperaba 2: ${JSON.stringify(f.params)}`);
  if (!f.params[0].default.startsWith('var(')) throw new Error('el valor por defecto llegó cortado');
});

comprobar('marca los variádicos como lo que son', () => {
  const t = mixins.find((m) => m.name === 'transition');
  if (!t.params[0].variadic) throw new Error('$props... no está marcado como variádico');
  if (t.params[0].name.includes('.')) throw new Error('los puntos se quedaron en el nombre');
});

comprobar('sabe qué emite cada uno y a quién delega', () => {
  const t = mixins.find((m) => m.name === 'transition');
  if (!t.emits.includes('transition')) throw new Error('no ve que transition emite transition');
  const a = mixins.find((m) => m.name === 'absolute');
  if (!a.calls.includes('position')) throw new Error('no ve que absolute delega en position');
});

comprobar('cuenta usos reales, comprobables a mano', () => {
  const t = mixins.find((m) => m.name === 'transition');
  const real = ['atoms', 'molecules', 'organisms', 'utilities', 'base', 'layout', 'pages']
    .flatMap(function andar(d) {
      const dir = path.join(ROOT, 'scss', d);
      if (!fs.existsSync(dir)) return [];
      const salida = [];
      (function rec(x) {
        for (const e of fs.readdirSync(x, { withFileTypes: true })) {
          const p = path.join(x, e.name);
          if (e.isDirectory()) rec(p);
          else if (e.name.endsWith('.scss')) {
            salida.push(...(fs.readFileSync(p, 'utf8').match(/@include\s+transition\b/g) || []));
          }
        }
      })(dir);
      return salida;
    }).length;
  if (t.uses !== real) throw new Error(`dice ${t.uses} usos de transition, hay ${real}`);
});

comprobar('el recambio de R03 y R04 es el mixin correcto', () => {
  const r3 = recambioPara('transition', mixins);
  const r4 = recambioPara('position', mixins);
  if (r3?.mixin !== 'transition') throw new Error(`R03 → ${r3 && r3.mixin}`);
  if (r4?.mixin !== 'position') throw new Error(`R04 → ${r4 && r4.mixin}`);
  for (const a of ['absolute', 'fixed', 'relative', 'sticky']) {
    if (!r4.alias.includes(a)) throw new Error(`falta el alias ${a}`);
  }
});

comprobar('no ofrece recambio cuando no lo hay de verdad', () => {
  // La otra mitad, y la que evita el daño: `aspect-ratio` emite `display` de
  // paso, y ofrecerlo como recambio de cualquier `display:` sería un consejo
  // malo dicho con seguridad. Callarse es la respuesta correcta.
  // Ojo con la lista: `border-radius` estaba aquí y el guardián tenía razón al
  // protestar — existe `@mixin border-radius`, con 6 usos. La prueba era la
  // equivocada, no el código.
  for (const p of ['width', 'color', 'z-index', 'opacity', 'overflow']) {
    const r = recambioPara(p, mixins);
    if (r) throw new Error(`ofrece ${r.mixin} como recambio de ${p}, y no lo es`);
  }
});

comprobar('la documentación que sirve no lleva basura de codificación', () => {
  const sucios = mixins.filter((m) =>
    /Ã|â|�/.test((m.description || '') + m.examples.join(' '))
  );
  if (sucios.length) {
    throw new Error(`${sucios.length} con caracteres rotos: ${sucios.slice(0, 3).map((m) => m.name).join(', ')}`);
  }
});

(async () => {
  let fallos = 0;
  for (const c of casos) {
    try {
      await c.fn();
      console.log(`✅ ${c.nombre}`);
    } catch (e) {
      fallos++;
      console.log(`❌ ${c.nombre}\n     ${e.message}`);
    }
  }
  const sinDoc = mixins.filter((m) => !m.description).length;
  const sinUso = mixins.filter((m) => m.uses === 0).length;
  console.log(`\n   ${mixins.length} mixins · ${sinDoc} sin descripción · ${sinUso} que no llama nadie`);
  console.log(`   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
