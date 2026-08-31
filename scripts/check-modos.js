#!/usr/bin/env node
/**
 * SYX — Coherencia de los modos
 * ─────────────────────────────
 * Los modos son documentos, y un documento puede prometer cualquier cosa. Este
 * guardián comprueba que lo que prometen coincide con lo que el sistema
 * permite de verdad, que es lo único que un agente va a encontrarse cuando
 * intente escribir.
 *
 * POR QUÉ EXISTE
 * Los ocho modos se escribieron antes que la capa de confianza. Cuando llegó
 * `contracts/trust.json`, tres de ellos quedaron mandando exactamente lo que el
 * contrato prohíbe: THEME escribiendo en `scss/themes/`, TOKEN en la capa
 * semántica, MIGRATE en `scss/base/`. Nadie se dio cuenta porque nada lo
 * medía: un modo se lee, no se ejecuta. Que dos documentos del mismo
 * repositorio se contradigan es peor que no tener ninguno, porque el agente
 * obedece al que lee primero.
 *
 * QUÉ COMPRUEBA
 *   1. Cada modo abre con su bloque `Trust`, con las cuatro líneas.
 *   2. Ninguna ruta bajo **Writes** es `human` según el contrato. Esta es la
 *      comprobación que justifica el fichero; las demás la acompañan.
 *   3. Toda ruta bajo **Recommends only** es `human` de verdad. Sin esto un
 *      modo podría rebajarse solo, prometiendo prudencia donde no hace falta y
 *      escondiendo dónde sí.
 *   4. Un modo que escribe en `pr` nombra `propose.js`: la vía existe o no se
 *      menciona el permiso.
 *   5. Las rutas que el cuerpo del modo nombra están cubiertas por alguna de
 *      las tres listas. Así el bloque no se queda corto cuando el modo crece.
 *   6. Las herramientas de «Ask, don't read» existen en el servidor MCP —se le
 *      pregunta a él, no a una lista escrita aquí.
 *   7. Los tres índices (CLAUDE.md, AGENTS.md y _agents/modes/README.md) listan
 *      los mismos modos que hay en disco. AGENTS.md listaba seis de ocho.
 *
 * NO SE COMPRUEBA CONTRA UNA LISTA DE OCHO NOMBRES escrita aquí: la lista se
 * lee del directorio. Una lista a mano envejece el día que se añade un modo, y
 * envejece en silencio, que es como envejecen las listas.
 *
 * Uso: node scripts/check-modos.js   ·   npm run check:modos
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { clasificarRuta } = require('./lib/confianza');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, '_agents', 'modes');

const leer = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const MODOS = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .map((f) => f.replace(/\.md$/, ''))
  .sort();

// ─── El bloque de confianza de cada modo ─────────────────────────────────────

const CLAVES = { escribe: 'Writes', recomienda: 'Recommends only', lee: 'Reads', pide: "Ask, don't read" };

/** Las rutas entre acentos graves de una línea. Se descartan las plantillas
 *  (`scss/{layer}/…`): no son rutas, son huecos. */
const rutasDe = (linea) =>
  [...linea.matchAll(/`([^`]+)`/g)]
    .map((m) => m[1])
    .filter((s) => (s.includes('/') || /\.(json|scss|js|md)$/.test(s)) && !/[{}*\s]/.test(s));

function bloqueDe(modo) {
  const texto = leer(`_agents/modes/${modo}.md`);
  const cabecera = texto.slice(0, texto.indexOf('\n## ') + 1 || texto.length);
  const b = { texto, cabecera };
  for (const [k, rotulo] of Object.entries(CLAVES)) {
    const m = cabecera.match(new RegExp(`^> · \\*\\*${rotulo.replace(/[.*+?^$()|[\\]\\\\]/g, '\\\\$&')}:\\*\\*(.*)$`, 'm'));
    b[k] = m ? m[1] : null;
  }
  return b;
}

// ─── Los índices ─────────────────────────────────────────────────────────────

/** Los prefijos `[SYX: X]:` que cita un fichero, en minúsculas y sin repetir. */
const citados = (fichero) =>
  [...new Set([...leer(fichero).matchAll(/\[SYX:\s*([A-Z]+)\]:/g)].map((m) => m[1].toLowerCase()))].sort();

/** Los modos que salen en la tabla de un índice: solo las filas, no los ejemplos. */
const enTabla = (fichero) =>
  [...new Set(
    [...leer(fichero).matchAll(/^\|\s*(?:\*\*)?(?:`\[SYX:\s*)?([A-Z]+)(?:\]:`)?(?:\*\*)?\s*\|/gm)]
      .map((m) => m[1].toLowerCase())
  )].filter((n) => MODOS.includes(n)).sort();

// ─── Las herramientas, preguntándoselas al servidor ──────────────────────────

function herramientasMCP() {
  return new Promise((resolver, rechazar) => {
    const srv = spawn(process.execPath, [path.join(__dirname, 'mcp-server.js')], { cwd: ROOT });
    let buf = '';
    const t = setTimeout(() => { srv.kill(); rechazar(new Error('el servidor MCP no contestó')); }, 8000);
    srv.stdout.setEncoding('utf8');
    srv.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) !== -1) {
        const linea = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!linea) continue;
        let msg;
        try { msg = JSON.parse(linea); } catch (e) { continue; }
        if (msg.id === 1) {
          clearTimeout(t);
          srv.kill();
          resolver(msg.result.tools.map((x) => x.name));
        }
      }
    });
    srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) + '\n');
  });
}

// ─── Comprobaciones ──────────────────────────────────────────────────────────

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

console.log('\n── COHERENCIA DE LOS MODOS ─────────────────────────────────────\n');

const bloques = new Map(MODOS.map((m) => [m, bloqueDe(m)]));

comprobar('los ocho modos abren con su bloque de confianza', () => {
  const faltan = [];
  for (const [modo, b] of bloques) {
    for (const [k, rotulo] of Object.entries(CLAVES)) {
      if (b[k] === null) faltan.push(`${modo} → ${rotulo}`);
    }
  }
  if (faltan.length) throw new Error(`sin declarar: ${faltan.join(', ')}`);
});

comprobar('ningún modo se autoriza a escribir donde el contrato dice «humano»', () => {
  const malos = [];
  for (const [modo, b] of bloques) {
    for (const r of rutasDe(b.escribe || '')) {
      const c = clasificarRuta(r);
      if (c.tier === 'human') malos.push(`${modo} escribe en ${r} (${c.patron || 'por defecto'} → human)`);
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
});

comprobar('lo que un modo dice solo recomendar es de verdad humano', () => {
  const malos = [];
  for (const [modo, b] of bloques) {
    for (const r of rutasDe(b.recomienda || '')) {
      const c = clasificarRuta(r);
      if (c.tier !== 'human') malos.push(`${modo}: ${r} es ${c.tier}, no hace falta pedir permiso`);
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
});

comprobar('el que puede escribir en `pr` dice por dónde', () => {
  const malos = [];
  for (const [modo, b] of bloques) {
    const pr = rutasDe(b.escribe || '').some((r) => clasificarRuta(r).tier === 'pr');
    if (pr && !b.texto.includes('propose.js')) malos.push(modo);
  }
  if (malos.length) throw new Error(`${malos.join(', ')} anuncia permiso de propuesta sin nombrar scripts/propose.js`);
});

comprobar('el bloque cubre todas las rutas que el modo nombra', () => {
  const malos = [];
  for (const [modo, b] of bloques) {
    const declaradas = ['escribe', 'recomienda', 'lee'].flatMap((k) => rutasDe(b[k] || ''));
    const cuerpo = b.texto.slice(b.cabecera.length);
    const mencionadas = new Set(
      [...cuerpo.matchAll(/`([^`]+)`/g)]
        .map((m) => m[1])
        .filter((s) => /^[A-Za-z_.][\w./-]*$/.test(s))
        .filter((s) => s.includes('/') || ['tokens.json', 'component-registry.json', 'package.json'].includes(s))
        .filter((s) => !s.startsWith('scripts/') && !s.startsWith('_agents/') && !s.startsWith('css/'))
    );
    for (const r of mencionadas) {
      const cubierta = declaradas.some((d) => r === d || (d.endsWith('/') && r.startsWith(d)));
      if (!cubierta) malos.push(`${modo}: nombra ${r} y no lo declara`);
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
});

comprobar('las herramientas que recomienda pedir existen en el servidor', async () => {
  const reales = await herramientasMCP();
  const malos = [];
  for (const [modo, b] of bloques) {
    for (const m of (b.pide || '').matchAll(/`([a-z_]+)`/g)) {
      if (/_/.test(m[1]) && !reales.includes(m[1])) malos.push(`${modo} manda pedir ${m[1]}, que no existe`);
    }
  }
  if (malos.length) throw new Error(malos.join(' · '));
});

comprobar('los tres índices listan los mismos modos que hay en disco', () => {
  const disco = MODOS.join(', ');
  for (const f of ['CLAUDE.md', 'AGENTS.md', '_agents/modes/README.md']) {
    const t = enTabla(f).join(', ');
    if (t !== disco) throw new Error(`${f} lista «${t || '—'}» y en disco hay «${disco}»`);
  }
});

comprobar('ningún índice invita a un modo que no existe', () => {
  const malos = [];
  for (const f of ['CLAUDE.md', 'AGENTS.md', '_agents/modes/README.md']) {
    // `[SYX: MODE]:` es el hueco con el que se explica la sintaxis, no un modo.
    for (const m of citados(f)) {
      if (m !== 'mode' && !MODOS.includes(m)) malos.push(`${f} → [SYX: ${m.toUpperCase()}]`);
    }
  }
  if (malos.length) throw new Error(malos.join(', '));
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

  console.log('');
  for (const [modo, b] of bloques) {
    const esc = rutasDe(b.escribe || '');
    const nivel = esc.length
      ? [...new Set(esc.map((r) => clasificarRuta(r).tier))].sort().join('+')
      : '—';
    console.log(`   ${modo.padEnd(9)} escribe: ${nivel.padEnd(8)} recomienda: ${rutasDe(b.recomienda || '').length}`);
  }
  console.log(`\n   ${MODOS.length} modos · ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
