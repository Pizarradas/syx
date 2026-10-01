#!/usr/bin/env node
/**
 * SYX — Pruebas de mutación de los guardianes
 * ───────────────────────────────────────────
 * Un guardián en verde dice dos cosas a la vez: que el árbol está bien, o que
 * el guardián no mira. Desde fuera no se distinguen. La auditoría de octubre
 * de 2026 lo comprobó a mano, inyectando regresiones realistas, y encontró que
 * muchas pasaban la cadena entera: `transition:opacity .2s` sin espacio, un
 * `var(--primitive-…)` en un fichero exceptuado entero, el primario de un tema
 * casi blanco, un `usage` con una clase inventada, `scripts/` bajado a `auto`
 * en trust.json… Este fichero convierte aquella revisión a mano en una prueba
 * que se repite sola (auditoría 2026-10, acción 8).
 *
 * CÓMO FUNCIONA CADA CASO
 *   1. Copia el árbol de trabajo a un directorio temporal (sin .git ni
 *      node_modules, que se enlaza). Se copia el disco, no el HEAD: se mide el
 *      código que hay, con lo que haya sin commitear.
 *   2. Prepara lo que el guardián necesita (`necesita`): un repositorio git,
 *      el CSS de un tema recompilado, el navegador.
 *   3. Ejecuta el guardián SIN la mutación y exige que pase. Si no pasa, el
 *      caso no demuestra nada: un guardián que ya está en rojo también
 *      «detecta» cualquier cosa. (El resultado se reutiliza entre los casos que
 *      comparten guardián y preparación.)
 *   4. Inyecta UNA regresión (`mutar`), rehace lo que haga falta (compilar un
 *      tema, commitear) y vuelve a ejecutar el guardián.
 *   5. Exige que falle, y que falle POR ESO: la salida debe contener `espera`.
 *      Un guardián que se cae por otra razón (un fichero que la copia no
 *      trajo, una excepción) no está guardando lo que dice guardar.
 *
 * Al final imprime la tabla regresión · guardián · resultado, y marca las
 * regresiones que antes de la auditoría pasaban la cadena entera.
 *
 * PUNTO DE EXTENSIÓN
 * Los casos viven en tests/mutacion/casos/*.js, uno o varios por fichero, y se
 * cargan todos (en orden alfabético). Un guardián nuevo añade su fichero ahí,
 * sin tocar este: así una regla nueva del motor —p. ej. «un componente solo lee
 * tokens semánticos»— trae en el mismo commit la regresión que demuestra que
 * la para. Un caso es un objeto con:
 *   id          único, en kebab-case: es lo que acepta --solo
 *   regresion   qué se rompe, en una línea (sale en la tabla)
 *   guardian    quién debe pararla (sale en la tabla)
 *   comando     [ejecutable, ...argumentos], relativo a la raíz de la copia
 *   espera      RegExp o texto que la salida del guardián debe contener al
 *               fallar: demuestra que falla POR la regresión
 *   mutar(t)    inyecta la regresión con t.reemplazar / t.editar / t.json /
 *               t.escribir; editar algo que ya no está es un error del caso
 *   necesita    opcional: 'git' (repo con la rama `base` y la mutación
 *               commiteada en `cambio`), 'css:<tema>' (recompila ese tema
 *               antes y después), 'navegador' (Chromium; se salta con
 *               --sin-navegador)
 *   env(t)      opcional: variables de entorno para el guardián
 *   seEscapaba  opcional: true si pasaba la cadena antes de la auditoría
 *   limite      opcional: segundos antes de matar al guardián (300)
 * Para la regla «un componente solo lee semántico», p. ej.:
 *   { id: 'r11-componente-lee-primitivo', guardian: 'validate (R11)',
 *     comando: ['node', 'scripts/syx-validate.js'], espera: /R11/,
 *     mutar: (t) => t.reemplazar('scss/atoms/_link.scss', …) }
 *
 * Uso:
 *   node scripts/check-mutacion.js                 todos los casos
 *   node scripts/check-mutacion.js --solo a,b      solo esos ids
 *   node scripts/check-mutacion.js --sin-navegador salta los que piden Chromium
 *   node scripts/check-mutacion.js --lista         lista los casos y sale
 *   node scripts/check-mutacion.js --conservar     no borra las copias (para depurar)
 *   SYX_MUTACION_HILOS=4                           casos en paralelo (por defecto, mitad de CPUs)
 *   SYX_CHROMIUM=/ruta/a/chromium                  Chromium ya instalado, para los de navegador
 *
 *   npm run check:mutacion
 */

'use strict';

const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR_CASOS = path.join(ROOT, 'tests', 'mutacion', 'casos');
const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] || ''; };

// ─── Los casos ───────────────────────────────────────────────────────────────

const NECESIDADES = new Set(['git', 'navegador']);
const casos = fs.readdirSync(DIR_CASOS)
  .filter((f) => f.endsWith('.js'))
  .sort()
  .flatMap((f) => require(path.join(DIR_CASOS, f)).map((c) => ({ ...c, fichero: f })));

// Un caso mal escrito se denuncia antes de copiar nada: si no, falla a mitad
// de una ejecución larga con un error que parece del guardián.
const ids = new Set();
for (const c of casos) {
  const mal = [];
  for (const k of ['id', 'regresion', 'guardian', 'comando', 'espera', 'mutar']) if (!c[k]) mal.push(`falta ${k}`);
  if (c.id && ids.has(c.id)) mal.push('id repetido');
  if (c.comando && !Array.isArray(c.comando)) mal.push('comando debe ser un array');
  if (c.mutar && typeof c.mutar !== 'function') mal.push('mutar debe ser una función');
  for (const n of c.necesita || []) if (!NECESIDADES.has(n) && !/^css:[a-z0-9-]+$/.test(n)) mal.push(`necesidad desconocida «${n}»`);
  if (mal.length) {
    console.error(`❌ tests/mutacion/casos/${c.fichero}: el caso ${c.id || '(sin id)'} está mal formado: ${mal.join(', ')}.`);
    process.exit(2);
  }
  ids.add(c.id);
}

if (args.includes('--lista')) {
  for (const c of casos) console.log(`${c.id.padEnd(34)} ${c.guardian.padEnd(26)} ${c.regresion}`);
  process.exit(0);
}

const solo = arg('--solo') ? new Set(arg('--solo').split(',')) : null;
if (solo) for (const s of solo) if (!ids.has(s)) { console.error(`❌ No hay ningún caso «${s}».`); process.exit(2); }
const sinNavegador = args.includes('--sin-navegador');
const conservar = args.includes('--conservar');
const elegidos = casos.filter((c) => (!solo || solo.has(c.id)));

// ─── El árbol temporal ───────────────────────────────────────────────────────

// Lo que no se copia: el historial (los casos que lo necesitan crean uno),
// las dependencias (se enlazan) y lo que generan otras pruebas.
const NO_COPIAR = new Set(['.git', 'node_modules', 'tests/browser/out', 'tests/browser/out-paginas',
  'tests/browser/diferencias', 'storybook/storybook-static', 'contracts/dtcg', 'contracts/propuestas']);

function copiarArbol(destino) {
  fs.cpSync(ROOT, destino, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(ROOT, src).split(path.sep).join('/');
      return !(NO_COPIAR.has(rel) || rel.endsWith('/node_modules'));
    },
  });
  for (const nm of ['node_modules', 'tests/browser/node_modules']) {
    const real = path.join(ROOT, nm);
    if (fs.existsSync(real)) fs.symlinkSync(fs.realpathSync(real), path.join(destino, nm), 'dir');
  }
}

/** Lo que un caso puede hacer con su copia. Todo relativo a la raíz de la copia. */
function arbol(dir) {
  const abs = (rel) => path.join(dir, rel);
  const t = {
    dir,
    existe: (rel) => fs.existsSync(abs(rel)),
    leer: (rel) => fs.readFileSync(abs(rel), 'utf8'),
    escribir: (rel, s) => { fs.mkdirSync(path.dirname(abs(rel)), { recursive: true }); fs.writeFileSync(abs(rel), s); },
    // Editar exige que la edición cambie algo. Si el ancla ya no está (alguien
    // reescribió el fichero), el caso no inyectaría nada y el guardián
    // «pasaría» la regresión: eso es un caso roto, no un guardián roto.
    editar: (rel, fn) => {
      const antes = t.leer(rel);
      const despues = fn(antes);
      if (typeof despues !== 'string' || despues === antes) throw new Error(`la mutación no cambió ${rel}: el ancla ya no está`);
      t.escribir(rel, despues);
    },
    // Sustituye la PRIMERA aparición de `buscar` (cadena o expresión).
    reemplazar: (rel, buscar, por) => t.editar(rel, (s) => {
      const i = typeof buscar === 'string' ? s.indexOf(buscar) : s.search(buscar);
      if (i === -1) throw new Error(`no encuentro ${buscar} en ${rel}: el ancla ya no está`);
      return s.replace(buscar, por);
    }),
    json: (rel, fn) => t.editar(rel, (s) => {
      const o = JSON.parse(s);
      const r = fn(o);
      return JSON.stringify(r === undefined ? o : r, null, 2) + '\n';
    }),
    ejecutar: (cmd, a = [], opts = {}) => execFileSync(cmd, a, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }),
  };
  return t;
}

/** Compila un tema como lo hace build:css (solo Sass, como Prepros), solo ese. */
function compilarTema(t, tema) {
  const css = `css/styles-theme-${tema}.css`;
  t.ejecutar(path.join(t.dir, 'node_modules/.bin/sass'), [`scss/styles-theme-${tema}.scss`, css, '--style=expanded', '--no-source-map']);
}

const git = (t, ...a) => t.ejecutar('git', a);
function iniciarGit(t) {
  git(t, 'init', '-q', '-b', 'base');
  git(t, 'config', 'user.email', 'mutacion@syx.local');
  git(t, 'config', 'user.name', 'Mutación SYX');
  git(t, 'add', '-A');
  git(t, 'commit', '-q', '-m', 'estado de partida');
  // La mutación se commitea en una rama aparte: `base` queda como la rama
  // contra la que se fusionaría (SYX_BASE=base para check-confianza).
  git(t, 'checkout', '-q', '-b', 'cambio');
}

function preparar(c) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `syx-mutacion-${c.id}-`));
  copiarArbol(dir);
  const t = arbol(dir);
  // Los temas se compilan antes que git: si el árbol commiteado no es el
  // compilado, el estado de partida tampoco lo sería.
  for (const n of c.necesita || []) if (n.startsWith('css:')) compilarTema(t, n.slice(4));
  if ((c.necesita || []).includes('git')) iniciarGit(t);
  return t;
}

function rehacer(c, t) {
  for (const n of c.necesita || []) if (n.startsWith('css:')) compilarTema(t, n.slice(4));
  if ((c.necesita || []).includes('git') && c.commitear !== false) {
    git(t, 'add', '-A');
    git(t, 'commit', '-q', '-m', `mutación: ${c.id}`);
  }
}

// ─── Ejecutar un guardián ────────────────────────────────────────────────────

function correr(c, t) {
  return new Promise((ok) => {
    const env = { ...process.env, ...(c.env ? c.env(t) : {}), FORCE_COLOR: '0', NO_COLOR: '1' };
    const p = spawn(c.comando[0], c.comando.slice(1), { cwd: t.dir, env });
    let salida = '';
    p.stdout.on('data', (d) => { salida += d; });
    p.stderr.on('data', (d) => { salida += d; });
    const reloj = setTimeout(() => p.kill('SIGKILL'), (c.limite || 300) * 1000);
    p.on('close', (codigo, senal) => { clearTimeout(reloj); ok({ codigo: senal ? `señal ${senal}` : codigo, salida }); });
  });
}

const borrar = (t) => { if (!conservar) fs.rmSync(t.dir, { recursive: true, force: true }); };

// La línea de partida de un guardián se mide una vez por guardián y
// preparación: diez casos de `validate` no necesitan diez validaciones limpias.
const partidas = new Map();
function partida(c) {
  const clave = JSON.stringify([c.comando, c.necesita || [], c.env ? c.id : null]);
  if (!partidas.has(clave)) {
    partidas.set(clave, (async () => {
      const t = preparar(c);
      try { return await correr(c, t); } finally { borrar(t); }
    })());
  }
  return partidas.get(clave);
}

const ultimas = (s, n = 12) => s.trim().split('\n').slice(-n).map((l) => `      ${l}`).join('\n');

async function probar(c) {
  const r = { c, estado: '', detalle: '' };
  if ((c.necesita || []).includes('navegador') && sinNavegador) { r.estado = 'saltado'; return r; }
  const inicio = Date.now();
  try {
    const sin = await partida(c);
    if (sin.codigo !== 0) {
      r.estado = 'ROTO';
      r.detalle = `sin la mutación el guardián ya falla (código ${sin.codigo}): el caso no demuestra nada.\n${ultimas(sin.salida)}`;
      return r;
    }
    const t = preparar(c);
    try {
      c.mutar(t);
      rehacer(c, t);
      const con = await correr(c, t);
      const motivo = c.espera instanceof RegExp ? c.espera.test(con.salida) : con.salida.includes(c.espera);
      if (con.codigo === 0) {
        r.estado = 'ESCAPA';
        r.detalle = `el guardián pasa con la regresión dentro.\n${ultimas(con.salida, 6)}`;
      } else if (!motivo && /Executable doesn't exist|browserType\.launch/.test(con.salida)) {
        r.estado = 'ROTO';
        r.detalle = 'no hay Chromium: `npx playwright install chromium` en tests/browser, SYX_CHROMIUM=/ruta, o --sin-navegador.';
      } else if (!motivo) {
        r.estado = 'OTRO MOTIVO';
        r.detalle = `falla (código ${con.codigo}) pero su salida no dice ${c.espera}: no la para por lo que debe.\n${ultimas(con.salida)}`;
      } else {
        r.estado = 'parada';
      }
    } finally { borrar(t); }
  } catch (e) {
    r.estado = 'ROTO';
    r.detalle = `${e.message}${e.stderr ? `\n${ultimas(String(e.stderr))}` : ''}`;
  }
  r.segundos = Math.round((Date.now() - inicio) / 1000);
  return r;
}

// ─── Principal ───────────────────────────────────────────────────────────────

(async () => {
  const hilos = Math.max(1, Number(process.env.SYX_MUTACION_HILOS) || Math.ceil(os.cpus().length / 2));
  console.log(`\n── MUTACIÓN · ${elegidos.length} regresiones contra sus guardianes · ${hilos} en paralelo ──\n`);
  const resultados = new Array(elegidos.length);
  let siguiente = 0;
  await Promise.all(Array.from({ length: Math.min(hilos, elegidos.length) }, async () => {
    while (siguiente < elegidos.length) {
      const i = siguiente++;
      resultados[i] = await probar(elegidos[i]);
      const r = resultados[i];
      console.log(`   ${r.estado === 'parada' ? '✅' : r.estado === 'saltado' ? '⏭️ ' : '❌'} ${r.c.id}${r.segundos !== undefined ? ` (${r.segundos} s)` : ''}`);
    }
  }));

  // La tabla: lo que se pidió en la auditoría, para leerla de un vistazo.
  const filas = resultados.map((r) => [
    r.c.regresion + (r.c.seEscapaba ? ' ¹' : ''),
    r.c.guardian,
    r.estado === 'parada' ? '✅ parada' : r.estado === 'saltado' ? '⏭️  saltada' : `❌ ${r.estado}`,
  ]);
  const ancho = [0, 1, 2].map((k) => Math.max(...filas.map((f) => f[k].length), ['Regresión', 'Guardián', 'Resultado'][k].length));
  const linea = (f) => `   ${f.map((x, k) => x.padEnd(ancho[k])).join(' │ ')}`;
  console.log(`\n${linea(['Regresión', 'Guardián', 'Resultado'])}`);
  console.log(`   ${ancho.map((a) => '─'.repeat(a)).join('─┼─')}`);
  for (const f of filas) console.log(linea(f));
  if (resultados.some((r) => r.c.seEscapaba)) console.log('\n   ¹ pasaba toda la cadena antes de la auditoría de octubre de 2026');

  const malos = resultados.filter((r) => r.estado !== 'parada' && r.estado !== 'saltado');
  for (const r of malos) console.log(`\n❌ ${r.c.id} — ${r.estado}: ${r.detalle}`);
  const saltados = resultados.filter((r) => r.estado === 'saltado').length;
  console.log(`\n   ${resultados.length - malos.length - saltados} de ${resultados.length} paradas${saltados ? ` · ${saltados} saltada(s) por --sin-navegador` : ''}${malos.length ? ` · ${malos.length} sin parar` : ''}.\n`);
  process.exit(malos.length ? 1 : 0);
})();
