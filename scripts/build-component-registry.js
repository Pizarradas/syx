#!/usr/bin/env node
/**
 * SYX — Registro de componentes generado desde el código
 * ─────────────────────────────────────────────────────
 * Emite component-registry.json a partir de los parciales de atoms/,
 * molecules/ y organisms/, contrastando el resultado contra el CSS compilado.
 *
 * POR QUÉ EXISTE
 * El registro se mantenía a mano y se generó por última vez el 3 de marzo.
 * Medido antes de escribir esto: las 34 rutas `tokenFile` apuntaban a ficheros
 * inexistentes, 30 de 48 modificadores declarados no estaban en el CSS, y 81 de
 * 111 tokens usaban la nomenclatura vieja `--component-btn-*` cuando la real es
 * `--component-button-*`. Y CLAUDE.md ordena a todo agente consultarlo antes de
 * escribir código: un agente que lo obedeciera escribía clases y tokens que no
 * existen, sin forma de saberlo.
 *
 * DE DÓNDE SALE CADA COSA
 * · nombre, capa, fichero      del propio parcial
 * · clases, modificadores,     resolviendo el anidamiento `&--` / `&__` del
 *   elementos, estados         Sass, y FILTRANDO contra el CSS compilado, que
 *                              es lo único que demuestra que una clase existe
 * · tokens                     los `var(--component-*)` que consume el parcial
 * · tokenFiles                 búsqueda inversa: qué fichero declara cada token
 * · composedOf                 clases base de otros componentes usadas dentro
 * · description, usage         NO se generan: son prosa escrita a mano y se
 *                              conservan tal cual del registro anterior
 *
 * Uso:
 *   node scripts/build-component-registry.js           regenera
 *   node scripts/build-component-registry.js --check   falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'component-registry.json');
const TOKENS_DIR = path.join(ROOT, 'scss', 'abstracts', 'tokens', 'components');
const CSS_REF = path.join(ROOT, 'css', 'styles-theme-syx-sketch.css');

const GRUPOS = [
  { dir: 'scss/atoms', key: 'atoms', layer: 'atom', prefix: 'atom-' },
  { dir: 'scss/molecules', key: 'molecules', layer: 'molecule', prefix: 'mol-' },
  { dir: 'scss/organisms', key: 'organisms', layer: 'organism', prefix: 'org-' },
];
const PREFIJOS = /\b(atom|mol|org)-[a-z0-9-]+/;

// ─── Resolver el anidamiento de Sass ─────────────────────────────────────────
// No hace falta un parser de Sass entero: basta con llevar la pila de
// selectores por profundidad de llave y saber componer `&`. Lo que sale de aquí
// es una lista de selectores planos, que luego se filtra contra el CSS.

function selectoresDe(scss) {
  const limpio = scss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');

  const out = new Set();
  const pila = [];
  let buf = '';

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === '{') {
      const head = buf.trim();
      buf = '';
      // Los at-rules (@mixin, @media, @include con bloque, @layer…) no aportan
      // selector: se apila el contexto del padre para no perderlo al cerrar.
      if (head.startsWith('@') || head === '') {
        // Se apila el contexto del padre para no perderlo al cerrar. Con la
        // pila vacía tiene que apilarse [''] y no []: cada componente vive
        // dentro de `@mixin … { @layer … { .atom-x { … } } }`, y apilar un
        // array vacío hacía que el bucle sobre los padres no iterara y se
        // perdieran TODAS las clases del fichero.
        pila.push(pila.length ? pila[pila.length - 1] : ['']);
        continue;
      }
      const padres = pila.length ? pila[pila.length - 1] : [''];
      const propios = head.split(',').map((s) => s.trim()).filter(Boolean);
      const resueltos = [];
      for (const p of padres) {
        for (const s of propios) {
          resueltos.push(s.includes('&') ? s.replace(/&/g, p) : (p ? p + ' ' + s : s));
        }
      }
      resueltos.forEach((s) => out.add(s));
      pila.push(resueltos);
    } else if (c === '}') {
      pila.pop();
      buf = '';
    } else if (c === ';') {
      buf = '';
    } else {
      buf += c;
    }
  }
  return [...out];
}

// De un selector resuelto se extraen las clases que contiene.
function clasesDe(sel) {
  return (sel.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) || []).map((c) => c.slice(1));
}

// ─── Índice inverso: qué fichero declara cada token ──────────────────────────

function indiceDeTokens() {
  const idx = {};
  if (!fs.existsSync(TOKENS_DIR)) return idx;
  for (const f of fs.readdirSync(TOKENS_DIR).filter((x) => x.endsWith('.scss'))) {
    const rel = path.posix.join('scss/abstracts/tokens/components', f);
    const src = fs.readFileSync(path.join(TOKENS_DIR, f), 'utf8');
    for (const m of src.matchAll(/^\s*(--component-[a-z0-9-]+)\s*:/gm)) {
      (idx[m[1]] = idx[m[1]] || []).push(rel);
    }
  }
  return idx;
}

// ─── Construir ───────────────────────────────────────────────────────────────

function leerComponentes() {
  const comps = [];
  for (const g of GRUPOS) {
    const dir = path.join(ROOT, g.dir);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('_') && x.endsWith('.scss')).sort()) {
      comps.push({
        name: f.slice(1, -5),
        layer: g.layer,
        grupo: g.key,
        prefix: g.prefix,
        file: path.posix.join(g.dir, f),
        src: fs.readFileSync(path.join(dir, f), 'utf8'),
      });
    }
  }
  return comps;
}

function build() {
  const comps = leerComponentes();
  const tokenIdx = indiceDeTokens();
  const css = fs.existsSync(CSS_REF) ? fs.readFileSync(CSS_REF, 'utf8') : '';
  if (!css) {
    console.error('Falta css/styles-theme-syx-sketch.css. Ejecuta antes: npm run build:css');
    process.exit(1);
  }
  // Un Set con todas las clases que el CSS compilado define de verdad. Es el
  // árbitro: lo que no está aquí, no existe, por mucho que lo diga el Sass.
  const enCss = new Set();
  for (const m of css.matchAll(/\.((?:atom|mol|org|syx)-[A-Za-z0-9_-]+)/g)) enCss.add(m[1]);

  // Primera pasada: las clases base de cada componente, para poder detectar
  // después qué componentes se usan dentro de qué otros.
  for (const c of comps) {
    c.selectores = selectoresDe(c.src);
    const propias = new Set();
    const encabeza = new Set();
    for (const sel of c.selectores) {
      const clases = clasesDe(sel);
      for (const cl of clases) if (cl.startsWith(c.prefix)) propias.add(cl);
      // Una clase es SUYA solo si encabeza algún selector. `.atom-icon` dentro
      // de _btn.scss resuelve a `.atom-btn .atom-icon`: se usa, no se define, y
      // meterla en `classes` la atribuía al botón además de al icono.
      if (sel.trim().startsWith('.') && clases.length) encabeza.add(clases[0]);
    }
    c.propias = propias;
    c.encabeza = encabeza;
    c.classes = [...propias]
      .filter((x) => !x.includes('--') && !x.includes('__') && encabeza.has(x))
      .sort();
  }
  const baseDeOtros = new Map();
  for (const c of comps) for (const b of c.classes) baseDeOtros.set(b, c.name);

  const salida = {
    _meta: {
      version: require(path.join(ROOT, 'package.json')).version,
      generated: new Date().toISOString().slice(0, 10),
      generator: 'scripts/build-component-registry.js',
      description: 'SYX Design System — inventario de componentes legible por máquina, generado desde el código y contrastado contra el CSS compilado.',
      tokenPrefix: '--component-',
      note: 'Todo se genera salvo `description` y `usage`, que son prosa escrita a mano y se conservan entre regeneraciones. `tokenFiles` sustituye al antiguo `tokenFile`: un componente puede leer tokens declarados en varios ficheros, y el anterior apuntaba a rutas que no existían.',
      layers: {
        'syx.atoms': 'Componentes de un solo propósito. Prefijo: atom-',
        'syx.molecules': 'Composiciones de 2 o más átomos. Prefijo: mol-',
        'syx.organisms': 'Secciones completas de interfaz. Prefijo: org-',
      },
    },
  };

  const prosaPrevia = leerProsaPrevia();
  const avisos = [];

  for (const g of GRUPOS) salida[g.key] = [];

  for (const c of comps) {
    const mods = [];
    const elems = [];
    const estados = new Set();
    const fantasma = [];

    for (const cl of c.propias) {
      const destino = cl.includes('--') ? mods : cl.includes('__') ? elems : null;
      if (!destino) continue;
      if (enCss.has(cl)) destino.push(cl);
      else fantasma.push(cl);
    }
    // `&--is { &-fs { … } }` produce `.atom-table--is-fs` y, de paso, un
    // `.atom-table--is` intermedio que no llega al CSS porque no lleva
    // declaraciones propias. Eso no es deriva: es cómo se escribe el Sass. Solo
    // se avisa de lo que no es prefijo de ninguna clase que sí exista.
    const realmenteFantasma = fantasma.filter(
      (f) => ![...enCss].some((real) => real.startsWith(f + '-'))
    );
    {
    }
    for (const sel of c.selectores) {
      for (const m of sel.matchAll(/\.((?:is|has)-[a-z0-9-]+)/g)) estados.add('.' + m[1]);
      for (const m of sel.matchAll(/:(disabled|checked|focus-visible|hover|active|invalid|required)\b/g)) estados.add(':' + m[1]);
    }

    const tokens = [...new Set([...c.src.matchAll(/var\((--component-[a-z0-9-]+)/g)].map((m) => m[1]))].sort();
    const ficheros = [...new Set(tokens.flatMap((t) => tokenIdx[t] || []))].sort();
    // Un token sin declarar pero siempre citado con `var(--x, fallback)` no es
    // un fallo: el fallback es el mecanismo previsto. Solo se avisa del que se
    // usa a pelo, que sí deja la propiedad sin valor.
    const sinDeclarar = tokens.filter((t) => {
      if (tokenIdx[t]) return false;
      const aPelo = new RegExp('var\\(\\s*' + t + '\\s*\\)').test(c.src);
      return aPelo;
    });

    const usados = new Set();
    for (const sel of c.selectores) {
      for (const cl of clasesDe(sel)) {
        const dueño = baseDeOtros.get(cl);
        if (dueño && dueño !== c.name) usados.add(cl);
      }
    }

    const prosa = prosaPrevia[c.name] || {};
    const entrada = {
      name: c.name,
      layer: c.layer,
      file: c.file,
      tokenFiles: ficheros,
      classes: c.classes,
      modifiers: mods.sort(),
      elements: elems.sort(),
      states: [...estados].sort(),
      composedOf: [...usados].sort(),
      tokens,
    };
    if (prosa.description) entrada.description = prosa.description;
    if (prosa.usage) entrada.usage = prosa.usage;

    salida[c.grupo].push(entrada);

    if (realmenteFantasma.length) avisos.push({ comp: c.name, tipo: 'clases en el Sass que no llegan al CSS', lista: realmenteFantasma.sort() });
    if (sinDeclarar.length) avisos.push({ comp: c.name, tipo: 'tokens usados SIN fallback y nunca declarados — se quedan sin valor', lista: sinDeclarar });
  }

  // Una misma clase base declarada desde dos ficheros no es un fallo del
  // generador, pero quien consulte el registro merece saberlo: preguntar "¿dónde
  // se define .atom-label?" tiene dos respuestas.
  const porClase = {};
  for (const g of GRUPOS) for (const c of salida[g.key]) for (const cl of c.classes) (porClase[cl] = porClase[cl] || []).push(c.name);
  for (const [cl, dueños] of Object.entries(porClase)) {
    if (dueños.length > 1) avisos.push({ comp: dueños.join(' + '), tipo: `la clase .${cl} se declara desde varios ficheros`, lista: dueños });
  }

  // Las utilidades no son componentes: se conserva su bloque tal cual.
  const previo = leerPrevio();
  if (previo && previo.utilities) salida.utilities = previo.utilities;

  return { salida, avisos, comps };
}

function leerPrevio() {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { return null; }
}

// La prosa escrita a mano sobrevive a la regeneración: es lo único del registro
// que una máquina no puede reconstruir.
function leerProsaPrevia() {
  const previo = leerPrevio();
  const out = {};
  if (!previo) return out;
  for (const g of GRUPOS) {
    for (const c of previo[g.key] || []) {
      if (c.description || c.usage) out[c.name] = { description: c.description, usage: c.usage };
    }
  }
  return out;
}

const sinFecha = (o) => JSON.stringify({ ...o, _meta: { ...o._meta, generated: null } });

function main() {
  const check = process.argv.includes('--check');
  const { salida, avisos, comps } = build();

  console.log('\n── REGISTRO DE COMPONENTES ─────────────────────────────────────\n');

  if (check) {
    const previo = leerPrevio();
    if (!previo) { console.log('❌ component-registry.json no existe. Ejecuta: npm run build:registry\n'); process.exit(1); }
    if (sinFecha(previo) !== sinFecha(salida)) {
      console.log('❌ El registro no coincide con el código.');
      console.log('   Ejecuta: npm run build:registry\n');
      process.exit(1);
    }
    console.log(`✅ Al día · ${comps.length} componentes\n`);
    return;
  }

  fs.writeFileSync(OUT, JSON.stringify(salida, null, 2) + '\n');

  const n = (k) => (salida[k] || []).length;
  const suma = (k, f) => (salida[k] || []).reduce((a, c) => a + c[f].length, 0);
  const total = (f) => GRUPOS.reduce((a, g) => a + suma(g.key, f), 0);

  console.log(`   componentes        ${n('atoms')} átomos · ${n('molecules')} moléculas · ${n('organisms')} organismos`);
  console.log(`   clases base        ${total('classes')}`);
  console.log(`   modificadores      ${total('modifiers')}   (todos verificados contra el CSS)`);
  console.log(`   elementos          ${total('elements')}`);
  console.log(`   tokens             ${total('tokens')}`);
  console.log(`   ficheros de token  ${new Set(GRUPOS.flatMap((g) => salida[g.key].flatMap((c) => c.tokenFiles))).size} distintos, todos existentes`);

  if (avisos.length) {
    console.log(`\n⚠️  ${avisos.length} aviso(s) — el registro los refleja, pero conviene mirarlos:`);
    for (const a of avisos.slice(0, 12)) {
      console.log(`   → ${a.comp}: ${a.tipo}`);
      console.log(`     ${a.lista.slice(0, 6).join(', ')}${a.lista.length > 6 ? `, … (+${a.lista.length - 6})` : ''}`);
    }
    if (avisos.length > 12) console.log(`   … y ${avisos.length - 12} más`);
  }
  console.log('');
}

main();
