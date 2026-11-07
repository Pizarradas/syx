#!/usr/bin/env node
/**
 * SYX — La escala tipográfica crece siempre y llega a sus extremos
 * ─────────────────────────────────────────────────────────────────
 * Plan de mejora 2026-11. Hasta la 5.1, por debajo de ~540 px el paso `2xl`
 * (h3) era más pequeño que `xl` (h4): el suelo de 2xl (30 px) quedaba bajo el
 * de xl (31,25 px) y la jerarquía de titulares se invertía en casi todos los
 * móviles. Además 2xl, 3xl y 4xl no llegaban a su techo a 1440 px.
 *
 * Comprueba, para cada --primitive-font-size-* de tokens/primitives/_typography.scss:
 *   1. Tiene la forma clamp(min, a rem + b vw, max).
 *   2. El valor preferente vale el mínimo a 375 px y el máximo a 1440 px
 *      (±0,5 px), como promete la cabecera del fichero.
 *   3. De xs a 4xl, cada paso es mayor que el anterior a 320, 375, 540, 768,
 *      1024, 1440 y 1920 px.
 *
 * Uso: node scripts/check-escala-tipo.js   ·   npm run check:escala-tipo
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FICHERO = path.join(ROOT, 'scss', 'abstracts', 'tokens', 'primitives', '_typography.scss');
const ORDEN = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
const REM = 16;
const ANCHOS = [320, 375, 540, 768, 1024, 1440, 1920];
const TOLERANCIA = 0.5;
const errores = [];

const css = fs.readFileSync(FICHERO, 'utf8');
const pasos = {};
for (const m of css.matchAll(/--primitive-font-size-([a-z0-9]+):\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.-]+)rem\s*\+\s*([\d.]+)vw\s*,\s*([\d.]+)rem\s*\)/g)) {
  pasos[m[1]] = { min: +m[2] * REM, a: +m[3] * REM, b: +m[4], max: +m[5] * REM };
}
for (const p of ORDEN) if (!pasos[p]) errores.push(`--primitive-font-size-${p} no existe o no tiene la forma clamp(min, a rem + b vw, max)`);

const valor = (p, w) => Math.min(p.max, Math.max(p.min, p.a + (p.b * w) / 100));
const px = (n) => `${n.toFixed(2)} px`;

for (const [nombre, p] of Object.entries(pasos)) {
  const en375 = p.a + (p.b * 375) / 100;
  const en1440 = p.a + (p.b * 1440) / 100;
  if (Math.abs(en375 - p.min) > TOLERANCIA) errores.push(`${nombre}: a 375 px el valor preferente es ${px(en375)}, no el mínimo ${px(p.min)}`);
  if (Math.abs(en1440 - p.max) > TOLERANCIA) errores.push(`${nombre}: a 1440 px el valor preferente es ${px(en1440)}, no el máximo ${px(p.max)}`);
}

for (const w of ANCHOS) {
  for (let i = 1; i < ORDEN.length; i++) {
    const a = pasos[ORDEN[i - 1]];
    const b = pasos[ORDEN[i]];
    if (a && b && valor(b, w) <= valor(a, w)) {
      errores.push(`a ${w} px, ${ORDEN[i]} (${px(valor(b, w))}) no es mayor que ${ORDEN[i - 1]} (${px(valor(a, w))})`);
    }
  }
}

if (errores.length) {
  console.error(`❌ check:escala-tipo — ${errores.length} problema(s):\n${errores.map((e) => `   · ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ check:escala-tipo — ${ORDEN.length} pasos, crecientes a ${ANCHOS.join(' · ')} px y con sus extremos a 375 y 1440 px`);
