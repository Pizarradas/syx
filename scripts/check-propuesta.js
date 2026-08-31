#!/usr/bin/env node
/**
 * SYX — Prueba de la vía de propuesta
 * ───────────────────────────────────
 * Ejercita `scripts/propose.js` de verdad: escribe un token, compila, valida,
 * crea la rama y comprueba el resultado.
 *
 * POR QUÉ EN UNA COPIA Y NO AQUÍ
 * Porque la vía de propuesta crea ramas y commits. Una prueba que hace eso en
 * el repositorio real deja rastro cuando pasa y escombros cuando falla, y la
 * primera vez que alguien la ejecute con trabajo a medias se lo llevará por
 * delante. Se copia el árbol de trabajo tal cual está —no el HEAD, para que la
 * prueba mida el código que hay en el disco— a un repositorio nuevo en /tmp.
 *
 * QUÉ SE COMPRUEBA, EN ORDEN DE IMPORTANCIA
 *   1. Que se NIEGA donde debe: primitivos, semánticos, colores a pelo, tokens
 *      que ya existen, familias inventadas, árbol sucio. Un permiso mal dado no
 *      avisa; hay que ir a buscarlo.
 *   2. Que acierta el destino SIN que nadie se lo diga, que es el criterio del
 *      paso 2.1.
 *   3. Que lo que deja detrás está verde y es revisable.
 *
 * Uso: node scripts/check-propuesta.js   ·   npm run check:propuesta
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-propuesta-'));

console.log('\n── VÍA DE PROPUESTA ────────────────────────────────────────────\n');

// ─── Copia de trabajo aislada ────────────────────────────────────────────────
try {
  execFileSync('bash', ['-c',
    `cp -r "${ROOT}/." "${tmp}/" 2>/dev/null; rm -rf "${tmp}/.git" "${tmp}/node_modules" "${tmp}/contracts/dtcg" "${tmp}/contracts/propuestas"`,
  ]);
  // node_modules por enlace: la copia necesita sass y no merece la pena
  // duplicar 39 MB para una prueba.
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(tmp, 'node_modules'), 'dir');
  const g = (...a) => execFileSync('git', a, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  g('init', '-q', '-b', 'principal');
  g('config', 'user.email', 'prueba@syx.local');
  g('config', 'user.name', 'Prueba SYX');
  g('add', '-A');
  g('commit', '-q', '-m', 'estado de partida');
  console.log(`   copia aislada en ${tmp}\n`);
} catch (e) {
  console.log(`❌ No se pudo preparar la copia: ${e.message}\n`);
  process.exit(1);
}

// `propose.js` en la copia. Devuelve { code, salida } en vez de lanzar: aquí el
// código de salida distinto de cero es un resultado esperado casi siempre.
function proponer(...args) {
  try {
    const salida = execFileSync(process.execPath, [path.join(tmp, 'scripts', 'propose.js'), ...args], {
      cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, salida };
  } catch (e) {
    return { code: e.status ?? 1, salida: (e.stdout || '') + (e.stderr || '') };
  }
}
const enCopia = (...a) => execFileSync('git', a, { cwd: tmp, encoding: 'utf8' }).trim();

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });
const contiene = (texto, trozo, que) => {
  if (!texto.includes(trozo)) throw new Error(`${que}\n     esperaba encontrar: ${trozo}\n     dijo: ${texto.trim().split('\n').slice(-4).join(' / ')}`);
};

/**
 * Una negativa que además NO deja rastro.
 *
 * Las dos mitades importan por igual. La primera vez que corrió esta prueba, un
 * caso se coló y escribió el token; los cuatro siguientes vieron un mundo en el
 * que ese token ya existía y fallaron por la razón equivocada, tapando la
 * causa. Comprobar el árbol después de cada negativa convierte «se escribió
 * algo antes de negarse» en un fallo con nombre, y aísla los casos entre sí.
 */
function negar(args, esperado, que) {
  const r = proponer(...args);
  if (r.code === 0) throw new Error(`lo aceptó:\n     ${r.salida.trim().split('\n').slice(-4).join('\n     ')}`);
  contiene(r.salida, esperado, que);
  const rastro = execFileSync('git', ['status', '--porcelain'], { cwd: tmp, encoding: 'utf8' }).trim();
  if (rastro) {
    execFileSync('bash', ['-c', `cd "${tmp}" && git checkout -- . && git clean -qfd`]);
    throw new Error(`se negó, pero dejó cambios en el árbol:\n     ${rastro.split('\n').slice(0, 4).join('\n     ')}`);
  }
}

// ─── 1. Las negativas ────────────────────────────────────────────────────────

comprobar('niega un primitivo y explica de quién es la decisión', () => {
  negar(['token', '--name', '--primitive-color-blue-999', '--value', 'oklch(0.2 0.1 260)'],
    'Solo humano', 'no nombra el nivel');
});

comprobar('niega un semántico', () => {
  negar(['token', '--name', '--semantic-color-inventado', '--value', 'var(--primitive-color-blue-500)'],
    'Solo humano', 'no nombra el nivel');
});

comprobar('niega un color literal y dice qué token semántico usar', () => {
  negar(['token', '--name', '--component-feature-card-glow', '--value', 'oklch(0.498 0.282 266.24)'],
    '--semantic-color-primary', 'no propone el token que ya vale ese color');
});

comprobar('niega un valor que apunta a un primitivo', () => {
  // El agujero real que encontró esta prueba: R01 exceptúa scss/abstracts/, así
  // que validar el valor «como si fuera un fichero de ahí» lo aprobaba.
  negar(['token', '--name', '--component-feature-card-glow', '--value', 'var(--primitive-color-blue-500)'],
    'primitivo', 'no explica el salto de capa');
});

comprobar('niega un valor con tokens que no existen', () => {
  negar(['token', '--name', '--component-feature-card-glow', '--value', 'var(--semantic-color-que-no-existe)'],
    'no existen', 'no lo señala');
});

comprobar('niega un token que ya existe', () => {
  negar(['token', '--name', '--component-feature-card-bg', '--value', 'var(--semantic-color-primary)'],
    'ya existe', 'no lo señala');
});

comprobar('ante una familia inventada, ofrece las que sí existen', () => {
  negar(['token', '--name', '--component-site-header-blur', '--value', 'var(--semantic-color-primary)'],
    'header-bg', 'no sugiere la familia real');
});

comprobar('se niega a proponer sobre un árbol sucio', () => {
  fs.appendFileSync(path.join(tmp, 'CHANGELOG.md'), '\n<!-- trabajo a medias -->\n');
  const r = proponer('token', '--name', '--component-feature-card-glow', '--value', 'var(--semantic-shadow-md)');
  if (r.code === 0) throw new Error('lo aceptó con el árbol sucio: arrastraría trabajo ajeno');
  contiene(r.salida, 'sin commitear', 'no explica por qué');
  execFileSync('git', ['checkout', '--', 'CHANGELOG.md'], { cwd: tmp });
});

// ─── 2. La clasificación ─────────────────────────────────────────────────────

comprobar('classify da el veredicto del conjunto, no del primero', () => {
  const r = proponer('classify', 'CHANGELOG.md', 'scss/abstracts/tokens/primitives/_colors.scss');
  if (r.code !== 0) throw new Error('falló');
  contiene(r.salida, 'SOLO HUMANO', 'no manda el fichero más restrictivo');
});

comprobar('los guardianes y el propio contrato son solo humanos', () => {
  const r = proponer('classify', 'scripts/syx-validate.js', 'contracts/trust.json', 'contracts/rules.json');
  contiene(r.salida, 'SOLO HUMANO', 'un agente podría reescribir a quien le juzga');
});

// ─── 3. La propuesta buena ───────────────────────────────────────────────────

let ramaCreada = null;

comprobar('acepta un token de componente y deduce el fichero sin que se lo digan', () => {
  const r = proponer(
    'token',
    '--name', '--component-feature-card-glow',
    '--value', 'var(--semantic-shadow-md)',
    '--why', 'Realce opcional para la tarjeta destacada de la home'
  );
  if (r.code !== 0) throw new Error(`no la aceptó:\n     ${r.salida.trim().split('\n').slice(-8).join('\n     ')}`);
  contiene(r.salida, '_cards.scss', 'no acertó el fichero');
  contiene(r.salida, 'feature-card', 'no explica de qué familia lo dedujo');
  ramaCreada = 'syx/token-component-feature-card-glow';
});

comprobar('la rama existe, con un solo commit por delante', () => {
  const actual = enCopia('rev-parse', '--abbrev-ref', 'HEAD');
  if (actual !== ramaCreada) throw new Error(`la rama activa es ${actual}`);
  const n = enCopia('rev-list', '--count', 'principal..HEAD');
  if (n !== '1') throw new Error(`${n} commits, esperaba 1`);
});

comprobar('el token llegó al SCSS, al CSS compilado y al snapshot', () => {
  const scss = fs.readFileSync(path.join(tmp, 'scss/abstracts/tokens/components/_cards.scss'), 'utf8');
  if (!scss.includes('--component-feature-card-glow')) throw new Error('no está en el SCSS');
  if (!/--component-feature-card-glow:.*\n/.test(scss)) throw new Error('mal escrito');
  const css = fs.readFileSync(path.join(tmp, 'css/styles-theme-syx-sketch.css'), 'utf8');
  if (!css.includes('--component-feature-card-glow')) throw new Error('no está en el CSS compilado');
  const snap = JSON.parse(fs.readFileSync(path.join(tmp, 'contracts/resolved-tokens.json'), 'utf8'));
  const valor = { ...snap.base, ...snap.themes['syx-sketch'].light }['--component-feature-card-glow'];
  if (!valor) throw new Error('no está en el snapshot resuelto');
});

comprobar('quedó junto a su familia, no al final del fichero', () => {
  const lineas = fs.readFileSync(path.join(tmp, 'scss/abstracts/tokens/components/_cards.scss'), 'utf8').split('\n');
  const i = lineas.findIndex((l) => l.includes('--component-feature-card-glow:'));
  const siguiente = lineas.slice(i + 1).find((l) => /--component-[a-z0-9-]+:/.test(l));
  const anterior = [...lineas.slice(0, i)].reverse().find((l) => /--component-[a-z0-9-]+:/.test(l));
  if (!anterior || !anterior.includes('--component-feature-card-')) throw new Error(`el de arriba es ${anterior?.trim()}`);
  if (siguiente && siguiente.includes('--component-feature-card-')) {
    throw new Error('quedó en mitad del bloque en vez de al final');
  }
});

comprobar('la evidencia existe y trae el veredicto del validador', () => {
  const f = path.join(tmp, 'contracts/propuestas/component-feature-card-glow.md');
  if (!fs.existsSync(f)) throw new Error('no se escribió');
  const t = fs.readFileSync(f, 'utf8');
  for (const trozo of ['--component-feature-card-glow', '_cards.scss', 'Vía propuesta', 'Realce opcional', 'Qué revisar']) {
    contiene(t, trozo, `la evidencia no menciona ${trozo}`);
  }
  if (!/PASSED|✅/.test(t)) throw new Error('la evidencia no incluye un veredicto del validador');
});

comprobar('la validación de la rama está de verdad en verde', () => {
  const salida = execFileSync(process.execPath, ['scripts/syx-validate.js'], { cwd: tmp, encoding: 'utf8' });
  if (!/PASSED/.test(salida)) throw new Error('el validador no pasa sobre la rama creada');
});

comprobar('no se ha hecho push a ningún sitio', () => {
  const remotos = execFileSync('git', ['remote'], { cwd: tmp, encoding: 'utf8' }).trim();
  if (remotos) throw new Error(`la copia tiene remotos configurados: ${remotos}`);
  const salida = enCopia('log', '-1', '--format=%s');
  if (!salida.includes('--component-feature-card-glow')) throw new Error('el commit no es el esperado');
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
  try {
    fs.unlinkSync(path.join(tmp, 'node_modules'));
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch (e) { /* es /tmp */ }
  console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
