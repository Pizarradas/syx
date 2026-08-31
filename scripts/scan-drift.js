#!/usr/bin/env node
/**
 * SYX — Escáner de desviación (CLI)
 * ─────────────────────────────────
 * Corre el escáner sobre los ficheros que se le den y cuenta lo que ve.
 *
 * Uso:
 *   node scripts/scan-drift.js docs.html
 *   node scripts/scan-drift.js "src/**\/*.html" src/app.css --theme example-03
 *   npx syx-scan app/**\/*.html --json > desviacion.json
 *
 * Desde una aplicación que instala el paquete, `npx syx-scan` compara contra
 * la versión de SYX que esa aplicación tiene instalada, que es la única
 * comparación que significa algo.
 *
 * Sale con código 1 solo si se le pide con `--fallar-si-alta`: por defecto
 * informa y no rompe nada, porque la primera vez que se corre sobre una
 * aplicación de verdad va a encontrar de todo, y eso no es motivo para tumbar
 * la integración continua de nadie el día uno.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { escanear } = require('./lib/escaner');
const { crearConsulta } = require('./lib/consulta');

const ROOT = path.join(__dirname, '..');
const syx = crearConsulta({ root: ROOT });

const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const flag = (n) => process.argv.includes(n);

// Expansión mínima de comodines: `dir/*.html` y `dir/**/*.css`. Suficiente para
// no depender de un paquete de globs en un proyecto cuyo argumento es no tener
// dependencias.
function expandir(patron) {
  if (!/[*?]/.test(patron)) return fs.existsSync(patron) ? [patron] : [];
  const partes = patron.split('/');
  const i = partes.findIndex((p) => /[*?]/.test(p));
  const base = partes.slice(0, i).join('/') || '.';
  const resto = partes.slice(i);
  const recursivo = resto[0] === '**';
  const final = resto[resto.length - 1];
  const re = new RegExp('^' + final.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  const fuera = [];
  const andar = (dir, prof) => {
    let entradas = [];
    try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entradas) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (recursivo || prof < resto.length - 1) andar(p, prof + 1); }
      else if (re.test(e.name)) fuera.push(p);
    }
  };
  andar(base, 0);
  return fuera.sort();
}

const patrones = process.argv.slice(2).filter((a) => !a.startsWith('--') && process.argv[process.argv.indexOf(a) - 1] !== '--theme' && process.argv[process.argv.indexOf(a) - 1] !== '--mode');
const files = [...new Set(patrones.flatMap(expandir))].filter((f) => /\.(html?|css)$/i.test(f));

if (!files.length) {
  console.log('\n   Nada que escanear. Pasa ficheros .html o .css:\n   node scripts/scan-drift.js docs.html\n');
  process.exit(patrones.length ? 1 : 0);
}

const informe = escanear({
  files,
  syx,
  theme: arg('--theme', 'syx-sketch'),
  mode: arg('--mode', 'light'),
});

if (flag('--json')) {
  console.log(JSON.stringify(informe, null, 2));
  process.exit(0);
}

const TITULOS = {
  'fallback-desviado': 'Fallbacks que ya no son el valor del sistema',
  'token-inexistente': 'Tokens que la aplicación cree que existen',
  'valor-a-pelo': 'Valores escritos a mano que ya son token',
  'clase-fantasma': 'Clases con pinta de SYX que el sistema no declara',
  'modificador-inventado': 'Modificadores que no pintan nada',
  contrato: 'Reglas del sistema rotas en el consumidor',
  'base-sin-estilos': 'Bases sin estilos, con modificadores que sí existen',
  'gancho-js': 'Clases que solo usa el JavaScript',
};
const MARCA = { alta: '🔴', media: '🟠', baja: '·' };

console.log('\n── DESVIACIÓN RESPECTO A SYX ───────────────────────────────────\n');
console.log(`   comparado contra    ${informe.theme} · ${informe.mode} · SYX v${syx.version}`);
console.log(`   ficheros            ${informe.ficheros}`);
console.log(`   hallazgos           ${informe.total}   (${Object.entries(informe.porGravedad).map(([k, v]) => `${v} ${k}`).join(' · ') || 'ninguno'})\n`);

if (!informe.total) {
  console.log('✅ Nada que reprochar: lo que se pinta es lo que el sistema dice.\n');
  process.exit(0);
}

for (const tipo of Object.keys(TITULOS)) {
  const grupo = informe.hallazgos.filter((h) => h.tipo === tipo);
  if (!grupo.length) continue;
  console.log(`   ${TITULOS[tipo]}  —  ${grupo.length}`);
  console.log('   ' + '─'.repeat(62));
  const limite = flag('--todo') ? grupo.length : 8;
  for (const h of grupo.slice(0, limite)) {
    console.log(`   ${MARCA[h.gravedad]} ${h.file}:${h.linea}  ${h.que}`);
    if (h.detalle) console.log(`      ${h.detalle}`);
    if (h.sugerencia) console.log(`      → ${h.sugerencia}`);
  }
  if (grupo.length > limite) console.log(`   … y ${grupo.length - limite} más (--todo para verlos)`);
  console.log('');
}

console.log('   El escáner no arregla nada a propósito: lo que encuentra entra por');
console.log('   scripts/propose.js o por las manos de alguien.\n');

if (flag('--fallar-si-alta') && informe.porGravedad.alta) process.exit(1);
