#!/usr/bin/env node
/**
 * SYX — Guardián del córtex
 * ─────────────────────────
 * mind-system/knowledges/ es el córtex que los modos cargan a demanda. Hasta
 * septiembre de 2026 nadie lo vigilaba: un bloque `Knowledge` que apuntaba a un
 * fichero movido fallaba en silencio —el agente no encontraba el módulo, se lo
 * saltaba y respondía igual, pero peor—, y un módulo que ningún modo cargaba
 * era un módulo que nadie iba a abrir. La especificación está en docs/decisions/ACOPLE.md §B.
 *
 * QUÉ COMPRUEBA
 *   1. Cada modo abre con su bloque `Knowledge`, con línea **Always**. SKETCH es
 *      la excepción declarada: su tier 1 se compra no leyendo nada.
 *   2. Toda ruta citada en un bloque `Knowledge` existe bajo knowledges/.
 *   3. Ningún módulo huérfano: todo .md del córtex lo carga al menos un modo,
 *      salvo la navegación (index.md, 00-indice/, 05-plantillas/) y vendors/.
 *   4. routing.md concuerda con los modos: cita todas las rutas que los modos
 *      cargan, y todas las que cita existen. Es un fichero derivado; si
 *      diverge, alguien editó uno de los dos lados y no el otro.
 *   5. El filtro SYX: todo bloque ```scss/```css del córtex pasa R01–R04 con
 *      scripts/lib/rules.js, juzgado en la capa que declara (`// capa: …` en
 *      su primera línea; sin declaración, como componente). No se juzgan los
 *      marcados como antipatrón (`✗` en la primera línea, o «nunca», «evitar»,
 *      «anti-patrón» justo antes) ni los de prototipo (`capa: prototipo …`),
 *      que se cuentan aparte para que no se cuelen en silencio.
 *   6. Ningún token fantasma: todo `--semantic-*`, `--component-*` y
 *      `--primitive-*` citado en el córtex, la gobernanza, CLAUDE.md,
 *      AGENTS.md, AI_GUIDELINES.md y los modos existe (convención de ejemplos
 *      malos y nuevos más abajo, en la propia comprobación).
 *
 * Uso: node scripts/check-conocimiento.js   ·   npm run check:conocimiento
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { revisar } = require('./lib/rules.js');

const ROOT = path.join(__dirname, '..');
const K = path.join(ROOT, 'mind-system', 'knowledges');
const MODOS_DIR = path.join(ROOT, '_agents', 'modes');
const rel = (p) => path.relative(K, p).split(path.sep).join('/');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const modos = fs.readdirSync(MODOS_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.replace(/\.md$/, '')).sort();

/** El bloque Knowledge: desde la línea que lo abre hasta la primera que no empieza por `>`. */
function bloqueKnowledge(texto) {
  const lineas = texto.split(/\r?\n/);
  const i = lineas.findIndex((l) => l.startsWith('> **Knowledge**'));
  if (i === -1) return null;
  const out = [];
  for (let j = i; j < lineas.length && lineas[j].startsWith('>'); j++) out.push(lineas[j]);
  return out.join('\n');
}
const rutasEn = (t) => [...t.matchAll(/`([a-z0-9][a-z0-9._-]*\/[a-z0-9._/-]*)`/g)].map((m) => m[1]).filter((p) => !/^(mind-system|_agents|scss|contracts|scripts)\//.test(p));

const resultados = [];
function comprobar(nombre, fn) {
  try { const detalle = fn(); resultados.push({ nombre, ok: true, detalle }); }
  catch (e) { resultados.push({ nombre, ok: false, detalle: e.message }); }
}

const cargas = new Map(); // ruta → modos
const bloques = {};
for (const m of modos) bloques[m] = bloqueKnowledge(fs.readFileSync(path.join(MODOS_DIR, `${m}.md`), 'utf8'));

comprobar('cada modo declara de qué se alimenta', () => {
  const malos = [];
  for (const m of modos) {
    const b = bloques[m];
    if (!b) { malos.push(`${m}: sin bloque Knowledge`); continue; }
    if (m !== 'sketch' && !b.includes('**Always:**')) malos.push(`${m}: Knowledge sin línea Always`);
  }
  if (malos.length) throw new Error(malos.join(' · '));
  return `${modos.length} modos`;
});

comprobar('toda ruta citada en un bloque Knowledge existe', () => {
  const rotas = [];
  for (const m of modos) {
    if (!bloques[m]) continue;
    for (const r of rutasEn(bloques[m])) {
      if (!fs.existsSync(path.join(K, r))) rotas.push(`${m} → ${r}`);
      else { if (!cargas.has(r)) cargas.set(r, new Set()); cargas.get(r).add(m); }
    }
  }
  if (rotas.length) throw new Error(rotas.join(' · '));
  return `${cargas.size} rutas citadas`;
});

comprobar('ningún módulo del córtex está huérfano', () => {
  const nav = (r) => r.endsWith('index.md') || /(^|\/)00-indice\//.test(r) || /(^|\/)05-plantillas\//.test(r) || r.startsWith('vendors/');
  const mods = walk(K).filter((p) => p.endsWith('.md')).map(rel).filter((r) => !nav(r));
  const citadas = [...cargas.keys()];
  const huerfanos = mods.filter((r) => !citadas.some((c) => c === r || (c.endsWith('/') && r.startsWith(c))));
  if (huerfanos.length) throw new Error(huerfanos.join(' · '));
  return `${mods.length} módulos, todos con algún modo`;
});

comprobar('routing.md concuerda con los modos', () => {
  const routing = fs.readFileSync(path.join(ROOT, 'mind-system', 'routing.md'), 'utf8');
  const citadas = new Set(rutasEn(routing));
  // Cubierta si routing.md la cita tal cual o cita una carpeta que la contiene.
  const faltan = [...cargas.keys()].filter((r) => ![...citadas].some((c) => c === r || (c.endsWith('/') && r.startsWith(c))));
  // Solo se exige que existan las rutas completas del córtex (empiezan por un dominio).
  const DOMINIOS = /^(ux|ui|front|syx|branding|motion|vendors)\//;
  const sobran = [...citadas].filter((r) => DOMINIOS.test(r) && !fs.existsSync(path.join(K, r)));
  const malos = [...faltan.map((r) => `routing.md no cita ${r}`), ...sobran.map((r) => `routing.md cita ${r}, que no existe`)];
  if (malos.length) throw new Error(malos.join(' · '));
  return 'sin divergencias';
});

let prototipo = 0;
comprobar('el código del córtex pasa el filtro SYX', () => {
  const malos = [];
  let revisados = 0, antipatron = 0;
  for (const f of walk(K).filter((p) => p.endsWith('.md') && !rel(p).startsWith('vendors/'))) {
    const lineas = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lineas.length; i++) {
      const m = /^```(scss|css)\s*$/.exec(lineas[i]);
      if (!m) continue;
      let j = i + 1; const cuerpo = [];
      while (j < lineas.length && !lineas[j].startsWith('```')) cuerpo.push(lineas[j++]);
      const primera = (cuerpo[0] || '').trim();
      const antes = lineas.slice(Math.max(0, i - 2), i).join(' ');
      const capa = (/capa:\s*([^\s—*]+)/.exec(primera) || [])[1];
      if (/✗/.test(primera) || /\b(nunca|evitar|anti-?patr[oó]n)\b/i.test(antes)) antipatron++;
      else if (capa && capa.startsWith('prototipo')) prototipo++;
      else {
        revisados++;
        const v = revisar(capa || 'scss/atoms/_ejemplo.scss', '\n' + cuerpo.join('\n'));
        for (const [regla, lista] of Object.entries(v)) {
          for (const x of lista) malos.push(`${rel(f)}:${i + 1 + x.line} ${regla} ${x.content.trim()}`);
        }
      }
      i = j;
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
  return `${revisados} bloques revisados · ${antipatron} marcados como antipatrón · ${prototipo} de prototipo`;
});

// ─── 6 · Tokens fantasma ────────────────────────────────────────────────────
// Un nombre de token citado en el córtex o en un documento de entrada es una
// instrucción: el agente que lo lee lo copia. Si no existe, el código que sale
// compila, pero la propiedad se queda sin valor. En octubre de 2026 había 69
// nombres así, incluido `--component-btn-primary-bg` en token-system.md, que
// cargan siempre UI, TOKEN y MIGRATE.
//
// QUÉ CUENTA COMO EXISTENTE: lo que registra tokens.json, lo que el snapshot
// resuelto tiene en algún tema o modo (incluye la paleta privada de cada
// tema) y lo que se declara en cualquier parte de scss/ (incluye las
// sobrescrituras con ámbito, como --component-icon-source).
// Un nombre seguido de `*`, `{`, `<` o `[` es un PATRÓN
// (`--component-button-{variante}-bg`): basta con que exista algún token con
// ese prefijo; `--semantic-space-inset-*` no lo tiene y falla.
//
// QUÉ NO SE JUZGA (la convención, la misma que la del filtro SYX de arriba):
//   · en una línea, lo que va detrás de ❌ o ✗ (hasta un ✓/✅): en
//     «| `--real` | ❌ `--legado` |» se juzga el primero y no el segundo;
//   · dentro de un bloque de código, desde un comentario con ✗/❌ hasta la
//     siguiente línea con ✓/✅ o en blanco;
//   · un bloque de código antipatrón (✗ en su primera línea, o «nunca»,
//     «evitar», «anti-patrón» justo antes) o de prototipo (`capa: prototipo`);
//   · el bloque —de código, o párrafo/tabla hasta la línea en blanco— que
//     sigue a `<!-- syx: ejemplo-incorrecto -->`: un error a propósito.
//   · `<!-- syx: ejemplo-nuevo -->` es otra cosa: el bloque siguiente CREA
//     tokens (el ejemplo «necesito tokens para un tooltip»). Los nombres que
//     declara (`--x:`) cuentan como existentes en el resto de ESE documento,
//     pero lo que referencian con var() se sigue juzgando: un token nuevo que
//     apunta a un semántico inexistente sigue siendo un error. En un párrafo
//     marcado, todo nombre citado cuenta como propuesto.
// vendors/ es material de terceros y no se corrige aquí.
function tokensConocidos() {
  const { leerDeclaraciones } = require('./lib/scss-tokens.js');
  const s = new Set();
  const tj = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
  for (const [k, v] of Object.entries(tj)) if (k !== '_meta') for (const n of Object.keys(v)) s.add(n);
  const snapF = path.join(ROOT, 'contracts', 'resolved-tokens.json');
  if (fs.existsSync(snapF)) {
    const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
    for (const n of Object.keys(snap.base || {})) s.add(n);
    for (const t of Object.values(snap.themes || {})) for (const n of [...Object.keys(t.light || {}), ...Object.keys(t.dark || {})]) s.add(n);
  }
  for (const f of walk(path.join(ROOT, 'scss')).filter((p) => p.endsWith('.scss'))) {
    for (const d of leerDeclaraciones(fs.readFileSync(f, 'utf8'))) s.add(d.name);
  }
  return s;
}

const MARCA = /<!--\s*syx:\s*ejemplo-(incorrecto|nuevo)\s*-->/;
const NEGATIVO = /[❌✗]/;
const POSITIVO = /[✓✅]/;
const TOKEN = /--(?:semantic|component|primitive)-[A-Za-z0-9-]*/g;

/**
 * Las citas de token juzgables de un markdown y los nombres que el propio
 * documento crea en un ejemplo marcado: { citas: [{ nombre, patron, linea }], nuevos }.
 */
function citasJuzgables(texto) {
  const lineas = texto.split(/\r?\n/);
  const citas = [];
  const nuevos = new Set();
  // `modo`: 'normal' · 'nuevo-bloque' (no cita lo declarado y lo anota) ·
  // 'nuevo-todo' (todo lo citado se anota como propuesto).
  const citar = (l, i, modo = 'normal') => {
    // Dentro de la línea, lo que va tras ❌/✗ es el ejemplo malo y lo que va
    // tras ✓/✅ vuelve a contar: «| `--bueno` | ❌ `--legado` |» juzga solo
    // el primero.
    const tramos = l.split(/([❌✗✓✅])/u);
    let malo = false;
    let pos = 0;
    const juzgable = [];
    for (const t of tramos) {
      if (t.length === 1 && NEGATIVO.test(t)) malo = true;
      else if (t.length === 1 && POSITIVO.test(t)) malo = false;
      else if (!malo) juzgable.push([pos, pos + t.length]);
      pos += t.length;
    }
    for (const m of l.matchAll(TOKEN)) {
      if (!juzgable.some(([a, b]) => m.index >= a && m.index < b)) continue;
      const sig = l[m.index + m[0].length] || '';
      const patron = /[*{<[]/.test(sig) || m[0].endsWith('-');
      const nombre = patron ? m[0].replace(/-+$/, '-') : m[0];
      if (modo === 'nuevo-todo' || (modo === 'nuevo-bloque' && /^\s*:/.test(l.slice(m.index + m[0].length)))) {
        nuevos.add(nombre);
        continue;
      }
      citas.push({ nombre, patron, linea: i + 1 });
    }
  };
  let marca = null; // 'incorrecto' | 'nuevo': la marca HTML vale para el bloque siguiente
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const mm = MARCA.exec(l);
    if (mm) { marca = mm[1]; continue; }
    const valla = /^\s*(```|~~~)/.exec(l);
    if (valla) {
      let j = i + 1; const cuerpo = [];
      while (j < lineas.length && !lineas[j].trimStart().startsWith(valla[1])) cuerpo.push([lineas[j], j++]);
      const primera = (cuerpo[0] || [''])[0];
      const antes = lineas.slice(Math.max(0, i - 2), i).join(' ');
      const saltar = marca === 'incorrecto' || NEGATIVO.test(primera) || /capa:\s*prototipo/.test(primera) ||
        /\b(nunca|evitar|anti-?patr[oó]n)\b/i.test(antes);
      if (!saltar) {
        const modo = marca === 'nuevo' ? 'nuevo-bloque' : 'normal';
        let negativo = false;
        for (const [c, k] of cuerpo) {
          // Un comentario con ✗/❌ abre un tramo malo que llega hasta la
          // siguiente línea con ✓/✅ o en blanco.
          if (!c.trim() || POSITIVO.test(c)) negativo = false;
          if (NEGATIVO.test(c)) { citar(c, k, modo); negativo = !POSITIVO.test(c); continue; }
          if (!negativo) citar(c, k, modo);
        }
      }
      marca = null;
      i = j;
      continue;
    }
    if (!l.trim()) { marca = null; continue; }
    if (marca === 'incorrecto') continue;
    citar(l, i, marca === 'nuevo' ? 'nuevo-todo' : 'normal');
  }
  return { citas, nuevos };
}

comprobar('ningún token citado es un fantasma', () => {
  const conocidos = tokensConocidos();
  const lista = [...conocidos];
  const existe = (c) => (c.patron ? lista.some((k) => k.startsWith(c.nombre)) : conocidos.has(c.nombre));
  const fuentes = [
    ...walk(K).filter((p) => !rel(p).startsWith('vendors/')),
    ...walk(path.join(ROOT, 'mind-system', 'governance')),
    ...['CLAUDE.md', 'AGENTS.md', 'AI_GUIDELINES.md'].map((f) => path.join(ROOT, f)),
    ...walk(MODOS_DIR),
  ].filter((p) => p.endsWith('.md') && fs.existsSync(p));
  const fantasmas = new Map(); // nombre → [dónde]
  let citas = 0;
  const distintos = new Set();
  for (const f of fuentes) {
    const { citas: cs, nuevos } = citasJuzgables(fs.readFileSync(f, 'utf8'));
    for (const c of cs) {
      citas++;
      distintos.add(c.nombre);
      if (existe(c) || nuevos.has(c.nombre)) continue;
      if (!fantasmas.has(c.nombre)) fantasmas.set(c.nombre, []);
      fantasmas.get(c.nombre).push(`${path.relative(ROOT, f).split(path.sep).join('/')}:${c.linea}`);
    }
  }
  if (fantasmas.size) {
    throw new Error([...fantasmas].map(([n, d]) => `${n} (${d.slice(0, 3).join(', ')}${d.length > 3 ? `, +${d.length - 3}` : ''})`).join(' · ') +
      ' · Usa el nombre real (get_token / tokens.json), reescribe el ejemplo, o márcalo con ❌, <!-- syx: ejemplo-incorrecto --> si el error es a propósito, o <!-- syx: ejemplo-nuevo --> si el ejemplo crea el token');
  }
  return `${citas} citas de ${distintos.size} nombres en ${fuentes.length} documentos, todas existen`;
});

console.log('\n── CÓRTEX ' + '─'.repeat(54) + '\n');
for (const r of resultados) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.nombre}${r.detalle ? ' — ' + r.detalle : ''}`.replace(/ · /g, r.ok ? ' · ' : '\n     · '));
}
const fallos = resultados.filter((r) => !r.ok).length;
console.log(`\n   ${resultados.length - fallos}/${resultados.length} comprobaciones\n`);
process.exitCode = fallos ? 1 : 0;
