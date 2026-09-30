#!/usr/bin/env node
/**
 * SYX — Guardián del córtex
 * ─────────────────────────
 * mind-system/knowledges/ es el córtex que los modos cargan a demanda. Hasta
 * septiembre de 2026 nadie lo vigilaba: un bloque `Knowledge` que apuntaba a un
 * fichero movido fallaba en silencio —el agente no encontraba el módulo, se lo
 * saltaba y respondía igual, pero peor—, y un módulo que ningún modo cargaba
 * era un módulo que nadie iba a abrir. La especificación está en ACOPLE.md §B.
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

console.log('\n── CÓRTEX ' + '─'.repeat(54) + '\n');
for (const r of resultados) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.nombre}${r.detalle ? ' — ' + r.detalle : ''}`.replace(/ · /g, r.ok ? ' · ' : '\n     · '));
}
const fallos = resultados.filter((r) => !r.ok).length;
console.log(`\n   ${resultados.length - fallos}/${resultados.length} comprobaciones\n`);
process.exitCode = fallos ? 1 : 0;
