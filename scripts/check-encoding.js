#!/usr/bin/env node
/**
 * SYX — Guardián de la codificación
 * ─────────────────────────────────
 * Encuentra —y con `--fix` repara— el texto que alguien guardó leyendo UTF-8
 * como Windows-1252: una flecha acaba convertida en tres caracteres de basura
 * que empiezan por una «a con circunflejo», y lo mismo las rayas y los marcos.
 *
 * OJO: este comentario NO lleva ejemplos literales del destrozo, a propósito.
 * Los llevaba, y el guardián se denunciaba a sí mismo — y su `--fix` se comía
 * sus propios ejemplos. Un guardián que no puede describir lo que busca sin
 * disparar su propia alarma tiene que describirlo con palabras.
 *
 * POR QUÉ MERECE UN GUARDIÁN Y NO UNA LIMPIEZA
 * Porque no lo causó nadie una vez: lo causa un editor mal configurado, y
 * volverá a pasar. Limpiar 240 apariciones a mano deja el repositorio bonito
 * hasta el próximo guardado. Un guardián en la cadena convierte «se coló otra
 * vez» en un fallo con nombre el mismo día.
 *
 * Y ahora importa más que antes: desde 4.22.0 los comentarios del SCSS **se
 * sirven** — `get_mixin` devuelve al agente la descripción y los ejemplos tal
 * como están escritos. La basura en un comentario dejó de ser cosmética el día
 * que alguien la lee para decidir qué escribir.
 *
 * CÓMO SE REPARA, Y POR QUÉ ASÍ
 * Deshaciendo exactamente el paso que lo rompió: los caracteres se vuelven a
 * convertir en bytes por cp1252 y esos bytes se decodifican como UTF-8. No hay
 * tabla de pares: una tabla escrita a mano deja fuera justo el caso que nadie
 * miró, y aquí ya pasó — la primera versión reparaba flechas y rayas y se
 * dejaba 30 líneas de marco, porque su expresión regular se comía un carácter
 * de más.
 *
 * Uso: node scripts/check-encoding.js [--fix]   ·   npm run check:encoding
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CARPETAS = ['scss', 'scripts', 'contracts'];
const EXT = /\.(scss|js|json|md)$/;

// Los 27 huecos que cp1252 rellena en 0x80–0x9F y que latin1 deja vacíos.
const CP1252 = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

const aByte = (ch) => {
  const c = ch.codePointAt(0);
  if (c <= 0xff) return c;
  return Object.prototype.hasOwnProperty.call(CP1252, c) ? CP1252[c] : null;
};

// Cuántos bytes anuncia un byte inicial de UTF-8. Es el dato que evita adivinar:
// con él se sabe cuántos caracteres consumir, en vez de probar y ver.
const largoUtf8 = (b) => (b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : b >= 0xc2 ? 2 : 0);

/**
 * Recorre el texto y repara cada secuencia, sin expresiones regulares.
 *
 * La primera versión usaba una, y falló donde más se nota: en una línea de
 * marco —el mismo grupo de tres caracteres repetido veinte veces— el
 * cuantificador goloso se llevaba el primer carácter del grupo siguiente, los
 * cuatro bytes ya no formaban UTF-8 válido y la línea entera se quedaba sin
 * tocar. Leer el byte inicial y consumir exactamente lo que anuncia no tiene
 * ese problema.
 */
function reparar(texto) {
  let fuera = '';
  let cambios = 0;
  const chars = [...texto];

  for (let i = 0; i < chars.length; i++) {
    const b0 = aByte(chars[i]);
    const largo = b0 === null ? 0 : largoUtf8(b0);
    if (!largo || i + largo > chars.length) { fuera += chars[i]; continue; }

    const bytes = [b0];
    let ok = true;
    for (let j = 1; j < largo; j++) {
      const b = aByte(chars[i + j]);
      // Los bytes de continuación de UTF-8 van siempre en 0x80–0xBF.
      if (b === null || b < 0x80 || b > 0xbf) { ok = false; break; }
      bytes.push(b);
    }
    if (!ok) { fuera += chars[i]; continue; }

    const decodificado = Buffer.from(bytes).toString('utf8');
    // Dos frenos: si no decodifica limpio no era mojibake, y si el resultado no
    // es un único carácter tampoco. «café» tiene su é bien puesta y no se toca.
    if (decodificado.includes('�') || [...decodificado].length !== 1) { fuera += chars[i]; continue; }

    fuera += decodificado;
    cambios++;
    i += largo - 1;
  }
  return { texto: fuera, cambios };
}

// ─── Recorrido ───────────────────────────────────────────────────────────────

const arreglar = process.argv.includes('--fix');
const afectados = [];

function andar(dir) {
  let entradas = [];
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entradas) {
    if (e.name === 'node_modules' || e.name === 'dtcg' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { andar(p); continue; }
    if (!EXT.test(e.name)) continue;
    const antes = fs.readFileSync(p, 'utf8');
    const { texto, cambios } = reparar(antes);
    if (!cambios) continue;
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    const linea = antes.split('\n').findIndex((l) => reparar(l).cambios) + 1;
    afectados.push({ rel, cambios, linea, muestra: antes.split('\n')[linea - 1].trim().slice(0, 58) });
    if (arreglar) fs.writeFileSync(p, texto);
  }
}

console.log('\n── CODIFICACIÓN ────────────────────────────────────────────────\n');
for (const c of CARPETAS) andar(path.join(ROOT, c));

const total = afectados.reduce((a, x) => a + x.cambios, 0);

if (!afectados.length) {
  console.log('✅ Sin texto mal codificado.\n');
  process.exit(0);
}

if (arreglar) {
  console.log(`✅ Reparadas ${total} secuencias en ${afectados.length} fichero(s).\n`);
  for (const a of afectados.slice(0, 8)) console.log(`   · ${a.rel}  (${a.cambios})`);
  if (afectados.length > 8) console.log(`   … y ${afectados.length - 8} más`);
  console.log('');
  process.exit(0);
}

console.log(`❌ ${total} secuencia(s) mal codificadas en ${afectados.length} fichero(s).`);
console.log('   Vienen de guardar UTF-8 leyéndolo como Windows-1252.\n');
for (const a of afectados.slice(0, 8)) {
  console.log(`   · ${a.rel}:${a.linea}`);
  console.log(`     ${a.muestra}`);
}
if (afectados.length > 8) console.log(`   … y ${afectados.length - 8} fichero(s) más`);
console.log('\n   Ejecuta: npm run fix:encoding\n');
process.exit(1);
