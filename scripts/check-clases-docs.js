#!/usr/bin/env node
/**
 * SYX — Clases fantasma en la documentación
 * ─────────────────────────────────────────
 * Hermano de la comprobación 6 de check-conocimiento.js («ningún token citado
 * es un fantasma»), pero para CLASES.
 *
 * POR QUÉ
 * Un agente no distingue un ejemplo de una regla: copia lo que lee. En octubre
 * de 2026 un agente que construía una app sobre SYX devolvía `atom-btn--sm`,
 * `atom-btn__icon` u `org-header`, y no se los había inventado: los enseñaban
 * AUTHORING-GUIDE.md y GETTING-STARTED.md. Ninguna de esas clases existe en el
 * CSS compilado, así que el marcado que salía «cumplía las normas» y no pintaba.
 *
 * QUÉ COMPRUEBA
 * Toda clase con prefijo del sistema (`atom-`, `mol-`, `org-`, `syx-`,
 * `layout-`) citada en los documentos que leen los agentes existe en el CSS
 * compilado (css/*.css, todos los temas): el mismo árbitro que el escáner.
 *   · en un atributo `class="…"` o `className="…"`;
 *   · como selector (`.atom-btn--primary`), en código o en prosa;
 *   · en prosa, entre comillas invertidas y a solas (`atom-btn--filled`).
 * Un nombre seguido de `*`, `{`, `<` o `[`, o que acaba en `-`/`--`/`__`, es un
 * PATRÓN (`.syx-*`, `atom-btn--{variante}`): basta con que alguna clase empiece así.
 *
 * QUÉ NO SE JUZGA — la misma convención que los tokens fantasma:
 *   · en una línea, lo que va detrás de ❌ o ✗ (hasta un ✓/✅);
 *   · dentro de un bloque de código, desde un comentario con ✗/❌ hasta la
 *     siguiente línea con ✓/✅ o en blanco;
 *   · un bloque antipatrón (✗/❌ en su primera línea, o una línea que lo
 *     presenta justo antes con «nunca», «evitar», «anti-patrón», «never»,
 *     «avoid» o «wrong» y acaba en dos puntos);
 *   · el bloque que sigue a `<!-- syx: ejemplo-incorrecto -->`;
 *   · `<!-- syx: ejemplo-nuevo -->`: el bloque siguiente CREA un componente
 *     (la guía que enseña a escribir uno). Sus clases cuentan como existentes
 *     en el resto de ESE documento.
 * vendors/ es material de terceros y no se corrige aquí.
 *
 * Uso: node scripts/check-clases-docs.js   ·   npm run check:clases-docs
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'vendors' && e.name !== 'node_modules') walk(p, out); }
    else out.push(p);
  }
  return out;
}

// Lo que lee un agente: las entradas, el contrato de consumo, la plantilla que
// se copia en cada app, las guías de autor, los modos y flujos, y el córtex.
const FUENTES = [
  ...['CLAUDE.md', 'AGENTS.md', 'AI_GUIDELINES.md', 'CONSUMING.md', 'README.md', 'THEMING-RULES.md'].map((f) => path.join(ROOT, f)),
  ...walk(path.join(ROOT, 'scss')).filter((p) => p.endsWith('.md')),
  // evals/ son las respuestas de referencia con las que se califica a los
  // modos: cambiarlas cambia la nota, no la instrucción. Se quedan fuera.
  ...walk(path.join(ROOT, '_agents')).filter((p) => p.endsWith('.md') && !/[\\/]evals[\\/]/.test(p)),
  ...walk(path.join(ROOT, 'templates')).filter((p) => /\.(md|mdc)$/.test(p)),
  // mind-system/governance/ aún no: ATLAS cita `atom-headline--{3xl…xs}` y
  // organismos editoriales (`org-hero-principal`…) que SYX no tiene. Decidir
  // si ATLAS se mapea a `atom-title--h{n}` o SYX gana esos componentes es una
  // decisión de diseño, no una corrección de nombres.
].filter((p) => fs.existsSync(p));

// Lo mismo que acepta el escáner (scripts/lib/escaner.js): la clase está en el
// CSS compilado; o es la base de una familia que sí lo está (`.mol-tabs` no
// declara nada, pero `.mol-tabs__list` sí: es el ancla que lee el JS); o la
// alcanza un selector de atributo (`[class*=__item]` pinta `.atom-list__item`).
function clasesConocidas() {
  const s = new Set();
  const atributos = [];
  const dir = path.join(ROOT, 'css');
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) s.add(m[1]);
    for (const m of css.matchAll(/\[class([*^$]?)=["']?([^"'\]]+)["']?\]/g)) atributos.push({ op: m[1], v: m[2] });
  }
  return { s, atributos };
}

const PREFIJO = '(?:atom|mol|org|syx|layout)-';
const EN_ATRIBUTO = /\bclass(?:Name)?\s*=\s*["'`{]?([^"'`}>]*)/g;
const SELECTOR = new RegExp(`(?<![\\w/.-])\\.(${PREFIJO}[A-Za-z0-9_-]*)`, 'g');
const SUELTA = new RegExp(`\`(${PREFIJO}[A-Za-z0-9_-]+)\``, 'g');
const ES_CLASE = new RegExp(`^${PREFIJO}`);
// Nombres que NO son clases aunque lleven el prefijo: el paquete, sus binarios,
// sus scripts, el tema syx-sketch y los mixins de bundle (`syx-core`, `syx-bundle-*`).
const NO_CLASE = /^(syx-(design-system|mcp|scan|init|validate|sketch|core|bundle-[a-z-]+)|syx-[a-z-]+\.(js|css|scss|md)|layout-[a-z-]+\.(scss|css))$/;

const MARCA = /<!--\s*syx:\s*ejemplo-(incorrecto|nuevo)\s*-->/;
const NEGATIVO = /[❌✗]/;
const POSITIVO = /[✓✅]/;
const ANTES_MALO = /\b(nunca|evitar|anti-?patr[oó]n|never|avoid|wrong|anti-?pattern)\b/i;

/** Las clases citadas en una línea, fuera de los tramos marcados como malos. */
function enLinea(l, prosa) {
  const tramos = l.split(/([❌✗✓✅])/u);
  let malo = false; let pos = 0; const juzgable = [];
  for (const t of tramos) {
    if (t.length === 1 && NEGATIVO.test(t)) malo = true;
    else if (t.length === 1 && POSITIVO.test(t)) malo = false;
    else if (!malo) juzgable.push([pos, pos + t.length]);
    pos += t.length;
  }
  const dentro = (i) => juzgable.some(([a, b]) => i >= a && i < b);
  const fuera = [];
  const meter = (nombre, i, sig) => {
    if (!dentro(i) || NO_CLASE.test(nombre)) return;
    const patron = /[*{<[]/.test(sig || '') || /(-|__)$/.test(nombre);
    fuera.push({ nombre: patron ? nombre.replace(/[-_]+$/, (m) => m) : nombre, patron });
  };
  for (const m of l.matchAll(EN_ATRIBUTO)) {
    let off = m.index + m[0].indexOf(m[1]);
    for (const t of m[1].split(/(\s+)/)) {
      if (ES_CLASE.test(t)) {
        const limpio = t.replace(/[^A-Za-z0-9_-].*$/, '');
        meter(limpio, off, t[limpio.length]);
      }
      off += t.length;
    }
  }
  for (const m of l.matchAll(SELECTOR)) meter(m[1], m.index, l[m.index + m[0].length]);
  if (prosa) for (const m of l.matchAll(SUELTA)) meter(m[1], m.index, '');
  return fuera;
}

function citas(texto) {
  const lineas = texto.split(/\r?\n/);
  const out = []; const nuevas = new Set();
  let marca = null;
  const anotar = (lista, i, nuevo) => {
    for (const c of lista) (nuevo ? nuevas.add(c.nombre) : out.push({ ...c, linea: i + 1 }));
  };
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const mm = MARCA.exec(l);
    if (mm) { marca = mm[1]; continue; }
    const valla = /^\s*(```|~~~)/.exec(l);
    if (valla) {
      let j = i + 1; const cuerpo = [];
      while (j < lineas.length && !lineas[j].trimStart().startsWith(valla[1])) cuerpo.push([lineas[j], j++]);
      const primera = (cuerpo[0] || [''])[0];
      // Solo la línea inmediatamente anterior, y solo si presenta el bloque
      // («Never do this:»). Una guía en inglés dice «never» en cada párrafo:
      // mirar dos líneas atrás saltaba bloques buenos con clases inventadas.
      const antes = (lineas.slice(0, i).reverse().find((x) => x.trim()) || '').trim();
      const saltar = marca === 'incorrecto' || NEGATIVO.test(primera) || /capa:\s*prototipo/.test(primera) ||
        (ANTES_MALO.test(antes) && /:\s*$/.test(antes));
      if (!saltar) {
        let negativo = false;
        for (const [c, k] of cuerpo) {
          if (!c.trim() || POSITIVO.test(c)) negativo = false;
          if (NEGATIVO.test(c)) { anotar(enLinea(c, false), k, marca === 'nuevo'); negativo = !POSITIVO.test(c); continue; }
          if (!negativo) anotar(enLinea(c, false), k, marca === 'nuevo');
        }
      }
      marca = null; i = j; continue;
    }
    if (!l.trim()) { marca = null; continue; }
    if (marca === 'incorrecto') continue;
    anotar(enLinea(l, true), i, marca === 'nuevo');
  }
  return { citas: out, nuevas };
}

const { s: conocidas, atributos } = clasesConocidas();
const lista = [...conocidas];
const PREFIJOS_SISTEMA = new RegExp(`^${PREFIJO}`);
const porAtributo = (c) => atributos.some((a) =>
  (a.op === '*' ? c.includes(a.v) : a.op === '^' ? c.startsWith(a.v) : a.op === '$' ? c.endsWith(a.v) : c === a.v) &&
  // `[class*=atom-btn]` alcanzaría a cualquier `atom-btn--inventado`: no cuenta
  // si una clase real de la que esta es prolongación ya casa con el selector.
  !lista.some((base) => base !== c && PREFIJOS_SISTEMA.test(base) && c.startsWith(base) && (a.op === '*' ? base.includes(a.v) : base.startsWith(a.v))));
const existe = (c, nuevas) => {
  if (nuevas.has(c.nombre)) return true;
  if (c.patron) return lista.some((k) => k.startsWith(c.nombre)) || [...nuevas].some((k) => k.startsWith(c.nombre));
  if (conocidas.has(c.nombre)) return true;
  if (lista.some((k) => k.startsWith(c.nombre + '__') || k.startsWith(c.nombre + '--'))) return true;
  return porAtributo(c.nombre);
};

const fantasmas = new Map();
let total = 0; const distintas = new Set();
for (const f of FUENTES) {
  const { citas: cs, nuevas } = citas(fs.readFileSync(f, 'utf8'));
  for (const c of cs) {
    total++; distintas.add(c.nombre);
    if (existe(c, nuevas)) continue;
    if (!fantasmas.has(c.nombre)) fantasmas.set(c.nombre, []);
    fantasmas.get(c.nombre).push(`${path.relative(ROOT, f).split(path.sep).join('/')}:${c.linea}`);
  }
}

console.log('\n── CLASES CITADAS EN LA DOCUMENTACIÓN ' + '─'.repeat(26) + '\n');
if (fantasmas.size) {
  console.log(`❌ ${fantasmas.size} clases que el CSS compilado no declara:\n`);
  for (const [n, d] of [...fantasmas].sort()) {
    console.log(`   .${n}  (${d.slice(0, 4).join(', ')}${d.length > 4 ? `, +${d.length - 4}` : ''})`);
  }
  console.log('\n   Usa la clase real (get_component / component-registry.json), reescribe el ejemplo,');
  console.log('   márcalo con ❌ o <!-- syx: ejemplo-incorrecto --> si el error es a propósito, o con');
  console.log('   <!-- syx: ejemplo-nuevo --> si el bloque enseña a CREAR ese componente.\n');
  process.exitCode = 1;
} else {
  console.log(`✅ ${total} citas de ${distintas.size} clases en ${FUENTES.length} documentos: todas existen\n`);
}
