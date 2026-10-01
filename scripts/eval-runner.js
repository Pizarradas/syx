#!/usr/bin/env node
/**
 * SYX — Correr un agente de verdad contra las tareas de los modos
 * ───────────────────────────────────────────────────────────────
 * Hasta aquí el banco medía respuestas pegadas a mano: nada ejecutaba un
 * agente contra las tareas, así que «el modo UI funciona» era una opinión.
 * Este runner lanza un agente headless por tarea, con el modo activado como lo
 * haría una persona (el enunciado ya empieza por `[SYX: UI]:`), guarda lo que
 * hizo y lo corrige con el mismo corrector que check:evals.
 *
 * AISLAMIENTO
 * Cada tarea corre en una copia temporal del repositorio (los ficheros que git
 * conoce, más node_modules enlazado), con su propio repositorio git para que
 * propose.js funcione, y una foto de tamaños y fechas para ver después qué
 * escribió el agente. El árbol real no se toca. Lo que el agente escribe en
 * su copia se corrige junto con su respuesta. De _agents/evals/ solo viaja
 * fixtures/: las referencias, las anti-referencias y las reglas de corrección
 * se quedan fuera, o el agente podría leer las soluciones.
 *
 * EL AGENTE
 * Por defecto, Claude Code en modo no interactivo:
 *   claude -p "<enunciado>" --output-format stream-json --verbose
 *          --max-turns N --permission-mode dontAsk --allowedTools "<lista>"
 *          --mcp-config '{"mcpServers":{"syx":…}}' --strict-mcp-config
 *          --no-session-persistence
 * sin --bare, porque el agente tiene que leer CLAUDE.md: es lo que activa los
 * modos. SYX_AGENT_CMD lo sustituye por cualquier otro comando (otro modelo,
 * otro agente, o el simulado de scripts/eval-agente-simulado.js): se ejecuta
 * con `sh -c` en la copia, recibe el enunciado por stdin y en SYX_EVAL_*, y su
 * salida puede ser texto, un JSON con `result` o stream-json.
 *
 * SALIDA  _agents/evals/runs/<fecha>-<etiqueta>/
 *   <id>.md            transcripción resumida, ficheros escritos y nota
 *   <id>.respuesta.md  la respuesta final, tal cual (para volver a corregirla
 *                      con `npm run eval:modo -- <id> <fichero>`)
 *   <id>.jsonl         la salida cruda del agente
 *   RESUMEN.md         tabla tarea · nota · fallos — lo único que versiona git
 *   resumen.json
 *
 * Uso:
 *   node scripts/eval-runner.js                       # las 18
 *   node scripts/eval-runner.js --modo ui,token       # un filtro por modo
 *   node scripts/eval-runner.js --id audit-01         # o por id
 *   opciones: --etiqueta sonnet  --salida <dir>  --paralelo 3  --sin-juez
 *             --max-turns 30  --conservar (no borra las copias)  --estricto
 *             --sin-git (la copia sin repositorio; más rápido, para el simulado)
 *             --recorregir <carpeta>  vuelve a corregir una ejecución guardada
 *                                     con el corrector actual, sin lanzar agentes
 *
 * Variables: SYX_AGENT_CMD · SYX_AGENT_MODEL · SYX_AGENT_TOOLS ·
 *            SYX_AGENT_MAX_TURNS · SYX_AGENT_TIMEOUT (s) · SYX_JUEZ=0
 *
 * Termina con 1 si el agente no se pudo ejecutar en alguna tarea; con
 * --estricto, también si alguna tarea suspende.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { crearConsulta } = require('./lib/consulta');
const { evaluar } = require('./lib/evaluar');
const { cargarBanco } = require('./lib/banco');
const { juzgar, combinar, disponible } = require('./lib/juez');

const ROOT = path.join(__dirname, '..');
const { EVALS, tareas, equivalentes } = cargarBanco(ROOT);

// ── Argumentos ──────────────────────────────────────────────────────────────

function opciones(argv) {
  const o = { modo: null, id: null, etiqueta: null, salida: null, paralelo: 1, juez: true, conservar: false, estricto: false, maxTurns: null, git: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--modo') o.modo = val().split(',');
    else if (a === '--id') o.id = val().split(',');
    else if (a === '--etiqueta') o.etiqueta = val();
    else if (a === '--salida') o.salida = val();
    else if (a === '--paralelo') o.paralelo = Math.max(1, Number(val()) || 1);
    else if (a === '--max-turns') o.maxTurns = Number(val());
    else if (a === '--sin-juez') o.juez = false;
    else if (a === '--conservar') o.conservar = true;
    else if (a === '--sin-git') o.git = false;
    else if (a === '--recorregir') o.recorregir = val();
    else if (a === '--estricto') o.estricto = true;
    else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error(`❌ Opción desconocida: ${a}`); process.exit(1); }
  }
  return o;
}

// ── Copia aislada del repositorio ───────────────────────────────────────────

// Lo que el agente no debe ver: las soluciones y las reglas de corrección.
const FUERA = /^_agents\/evals\/(?!fixtures\/)/;

function copiar(id, conGit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `syx-eval-${id}-`));
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ls-files: ${r.stderr}`);
  for (const rel of r.stdout.split('\0').filter(Boolean)) {
    if (FUERA.test(rel)) continue;
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src) || fs.statSync(src).isDirectory()) continue;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.copyFileSync(src, path.join(dir, rel));
  }
  if (fs.existsSync(path.join(ROOT, 'node_modules'))) fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  const foto = fotografiar(dir);
  // Un repositorio de verdad, porque propose.js crea su rama con git. Cuesta
  // casi un segundo por tarea; check:runner lo salta con --sin-git.
  if (!conGit) return { dir, foto };
  const git = (...a) => spawnSync('git', ['-c', 'user.name=syx-eval', '-c', 'user.email=eval@syx.invalid', ...a], { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  fs.appendFileSync(path.join(dir, '.git/info/exclude'), 'node_modules\n');
  git('add', '-A');
  git('commit', '-qm', 'base de la evaluación', '--no-verify');
  return { dir, foto };
}

// Tamaño y fecha de cada fichero de la copia, para saber después qué escribió
// el agente sin depender de git (que el agente puede usar, y romper).
function fotografiar(dir) {
  const foto = new Map();
  const andar = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) andar(f);
      else if (e.isFile()) { const st = fs.statSync(f); foto.set(path.relative(dir, f), `${st.size}:${st.mtimeMs}`); }
    }
  };
  andar(dir);
  return foto;
}

function escrituras(dir, antes) {
  const despues = fotografiar(dir);
  const salida = [];
  for (const [rel, v] of despues) {
    if (!antes.has(rel)) salida.push(`?? ${rel}`);
    else if (antes.get(rel) !== v) salida.push(`M ${rel}`);
  }
  for (const rel of antes.keys()) if (!despues.has(rel)) salida.push(`D ${rel}`);
  return salida.sort();
}

/**
 * Los ficheros de texto que el agente creó o cambió en su copia. Un agente que
 * escribe el átomo en scss/atoms/ en vez de pegarlo en la respuesta tiene que
 * pasar C1 igual: el corrector los recibe como anexos y los valida en su ruta.
 */
const DERIVADO = /^(css|dist|contracts|storybook|tests\/browser\/out)\//;

function anexos(dir, escritas, eventos = []) {
  const salida = [];
  // Lo que escribió FUERA de su copia (un boceto en /tmp, como pide SKETCH):
  // solo se sabe por la transcripción.
  const fuera = new Set();
  for (const e of eventos) {
    for (const c of (e.type === 'assistant' && e.message && Array.isArray(e.message.content)) ? e.message.content : []) {
      const f = c.type === 'tool_use' && c.input && c.input.file_path;
      if (f && /^(Write|Edit|MultiEdit)$/.test(c.name) && !path.resolve(f).startsWith(dir + path.sep)) fuera.add(path.resolve(f));
    }
  }
  for (const f of fuera) {
    if (!/\.(scss|css|html|js|mjs|json|md)$/.test(f) || !fs.existsSync(f) || fs.statSync(f).size > 200 * 1024) continue;
    salida.push({ ruta: f, texto: fs.readFileSync(f, 'utf8'), fuera: true });
  }
  for (const e of escritas) {
    const m = e.match(/^(\?\?|[AM]+)\s+(.+)$/);
    // Lo derivado (un `npm run build` del agente regenera css/ y contracts/)
    // no es su entrega: corregirlo sería corregir al compilador.
    if (!m || DERIVADO.test(m[2]) || !/\.(scss|html|js|mjs|md)$/.test(m[2])) continue;
    const f = path.join(dir, m[2]);
    if (!fs.existsSync(f) || fs.statSync(f).size > 200 * 1024) continue;
    salida.push({ ruta: m[2], texto: fs.readFileSync(f, 'utf8') });
  }
  return salida;
}

// ── El agente ───────────────────────────────────────────────────────────────

// Escribir, solo en su copia y en el directorio temporal del sistema (donde
// SKETCH y CREATIVE dejan sus ficheros autónomos). Un Write sin ruta dejaría
// al agente escribir en cualquier sitio, el árbol real incluido. `//` es una
// ruta absoluta en la sintaxis de permisos de Claude Code; `./`, relativa al
// cwd, que es la copia.
const TMP = fs.realpathSync(os.tmpdir());
const HERRAMIENTAS = [
  'Read', 'Glob', 'Grep',
  'Edit(./**)', 'Write(./**)', `Edit(/${TMP}/**)`, `Write(/${TMP}/**)`,
  'Bash(node scripts/*)', 'Bash(npm run *)', 'Bash(git status*)', 'Bash(git diff*)',
  'mcp__syx',
].join(',');

function comandoPorDefecto(tarea, dir, o) {
  const mcp = { mcpServers: { syx: { command: 'node', args: [path.join(dir, 'scripts/mcp-server.js')] } } };
  const args = [
    '-p', tarea.enunciado,
    '--output-format', 'stream-json', '--verbose',
    '--max-turns', String(o.maxTurns || Number(process.env.SYX_AGENT_MAX_TURNS) || 30),
    '--permission-mode', 'dontAsk',
    '--allowedTools', process.env.SYX_AGENT_TOOLS || HERRAMIENTAS,
    '--mcp-config', JSON.stringify(mcp), '--strict-mcp-config',
    '--no-session-persistence',
  ];
  if (process.env.SYX_AGENT_MODEL) args.push('--model', process.env.SYX_AGENT_MODEL);
  return { cmd: 'claude', args, mostrar: `claude -p "<enunciado>" ${args.slice(2).map((a) => (a.startsWith('{') ? "'<mcp>'" : a)).join(' ')}` };
}

// Si el runner corre dentro de otra sesión de Claude Code (un agente que
// evalúa a otro, o una sesión remota), el hijo hereda las variables que lo
// atan a la sesión padre: comparte su id, escribe en su canal de mensajes y
// su salida puede cortarse sin evento `result`. El agente evaluado tiene que
// ser una sesión nueva, así que esas variables no pasan. Las credenciales
// (ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL…) sí.
const DE_LA_SESION_PADRE = /^(CLAUDECODE|CLAUDE_PID|CLAUDE_CODE_(SESSION_ID|REMOTE_SESSION_ID|CHILD_SESSION|MESSAGING_SOCKET|MESSAGING_TOKEN|INCLUDE_PARTIAL_MESSAGES|TEE_SDK_STDOUT|ENTRYPOINT|SESSION_ATTENDED|POST_TURN_MEMORY\w*|DIAGNOSTICS_FILE|WORKER_EPOCH)|CLAUDE_AFTER_LAST_COMPACT|CLAUDE_ADDITIONAL_DIRECTORIES|CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD)$/;

function entornoLimpio() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!DE_LA_SESION_PADRE.test(k)) env[k] = v;
  return env;
}

function lanzar(tarea, dir, o) {
  const propio = process.env.SYX_AGENT_CMD;
  const { cmd, args, mostrar } = propio ? { cmd: 'sh', args: ['-c', propio], mostrar: propio } : comandoPorDefecto(tarea, dir, o);
  const limite = (Number(process.env.SYX_AGENT_TIMEOUT) || 900) * 1000;
  return new Promise((resolve) => {
    const ini = Date.now();
    const p = spawn(cmd, args, {
      cwd: dir,
      env: { ...entornoLimpio(), SYX_EVAL_ID: tarea.id, SYX_EVAL_MODO: tarea.modo, SYX_EVAL_ENUNCIADO: tarea.enunciado, SYX_EVAL_DIR: dir },
      stdio: [propio ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    if (propio) { p.stdin.on('error', () => {}); p.stdin.end(tarea.enunciado); }
    const t = setTimeout(() => { err += `\n[runner] tiempo agotado (${limite / 1000} s)`; p.kill('SIGINT'); }, limite);
    p.on('error', (e) => { clearTimeout(t); resolve({ codigo: -1, out, err: `${err}\n${e.message}`, ms: Date.now() - ini, mostrar }); });
    p.on('close', (codigo) => { clearTimeout(t); resolve({ codigo, out, err, ms: Date.now() - ini, mostrar }); });
  });
}

/**
 * Entiende las tres salidas posibles: stream-json (una línea JSON por evento,
 * la última `result`), un JSON con `result`, o texto plano.
 */
function interpretar(out) {
  const eventos = [];
  for (const l of out.split('\n')) {
    const s = l.trim();
    if (!s.startsWith('{')) continue;
    try { eventos.push(JSON.parse(s)); } catch (e) { /* no era una línea JSON */ }
  }
  const final = [...eventos].reverse().find((e) => e.type === 'result');
  if (final) return { respuesta: String(final.result || ''), eventos, meta: final };
  // Un stream sin evento `result` es una ejecución cortada: corregir el
  // volcado crudo como si fuera la respuesta daría una nota sin sentido.
  if (eventos.length > 1 && eventos.every((e) => e.type)) return { respuesta: '', eventos, meta: { is_error: true, result: 'el stream terminó sin evento result (¿ejecución cortada?)' } };
  if (eventos.length === 1 && typeof eventos[0].result === 'string') return { respuesta: eventos[0].result, eventos, meta: eventos[0] };
  try {
    const uno = JSON.parse(out);
    if (typeof uno.result === 'string') return { respuesta: uno.result, eventos: [uno], meta: uno };
  } catch (e) { /* texto plano */ }
  return { respuesta: out.trim(), eventos: [], meta: null };
}

// El modelo que de verdad respondió, del evento de inicio del stream: la
// etiqueta de la carpeta dice lo que se pidió, esto lo que se usó.
const modeloDe = (eventos) => ((eventos || []).find((e) => e.type === 'system' && e.subtype === 'init' && e.model) || {}).model || null;

const corta = (s, n = 400) => { const t = String(s); return t.length > n ? `${t.slice(0, n)}… (${t.length} caracteres)` : t; };

function transcripcion(eventos) {
  const lineas = [];
  for (const e of eventos) {
    if (e.type === 'system' && e.subtype === 'init') {
      lineas.push(`- **inicio** · modelo \`${e.model}\` · MCP: ${(e.mcp_servers || []).map((m) => `${m.name} (${m.status})`).join(', ') || 'ninguno'}`);
    }
    const contenido = (e.message && Array.isArray(e.message.content)) ? e.message.content : [];
    for (const c of contenido) {
      if (e.type === 'assistant' && c.type === 'text' && c.text.trim()) lineas.push(`- **agente:** ${corta(c.text.trim().replace(/\n+/g, ' '), 300)}`);
      if (e.type === 'assistant' && c.type === 'tool_use') lineas.push(`- **herramienta** \`${c.name}\` ${corta(JSON.stringify(c.input), 200)}`);
      if (e.type === 'user' && c.type === 'tool_result') {
        const txt = Array.isArray(c.content) ? c.content.map((x) => x.text || '').join(' ') : c.content;
        lineas.push(`  - ${c.is_error ? '⚠️ ' : ''}resultado: ${corta(String(txt || '').replace(/\n+/g, ' '), 200)}`);
      }
    }
  }
  return lineas.join('\n');
}

// ── Una tarea ───────────────────────────────────────────────────────────────

async function correrTarea(tarea, o, salida, syx) {
  let dir;
  let foto;
  try {
    ({ dir, foto } = copiar(tarea.id, o.git));
  } catch (e) {
    return { tarea, error: `no se pudo preparar la copia: ${e.message}` };
  }
  const run = await lanzar(tarea, dir, o);
  const { respuesta, eventos, meta } = interpretar(run.out);
  const escritas = escrituras(dir, foto);
  const escritos = anexos(dir, escritas, eventos);
  const fueraDeLaCopia = escritos.filter((a) => a.fuera).map((a) => a.ruta);
  if (!o.conservar) fs.rmSync(dir, { recursive: true, force: true });

  fs.writeFileSync(path.join(salida, `${tarea.id}.jsonl`), run.out);
  fs.writeFileSync(path.join(salida, `${tarea.id}.respuesta.md`), respuesta);
  fs.writeFileSync(path.join(salida, `${tarea.id}.anexos.json`), JSON.stringify(escritos, null, 1));

  const fallo = run.codigo !== 0 || !respuesta || (meta && meta.is_error);
  let r = null;
  if (!fallo) {
    const det = evaluar({ tarea, respuesta, syx, equivalentes, anexos: escritos });
    const juez = o.juez ? await juzgar({ tarea, respuesta, root: ROOT }) : { via: null, aviso: 'juez saltado: --sin-juez' };
    r = combinar(det, juez);
  }

  const md = [
    `# ${tarea.id} · ${tarea.modo.toUpperCase()} · ${tarea.titulo}`,
    '',
    `- **Enunciado:** ${tarea.enunciado}`,
    `- **Agente:** \`${run.mostrar}\``,
    `- **Duración:** ${(run.ms / 1000).toFixed(1)} s · salida ${run.codigo}${meta && meta.total_cost_usd != null ? ` · coste ${meta.total_cost_usd.toFixed(4)} USD` : ''}${meta && meta.num_turns != null ? ` · ${meta.num_turns} turnos` : ''}`,
    `- **Ficheros que tocó en la copia:** ${escritas.length ? escritas.map((e) => `\`${e}\``).join(', ') : 'ninguno'}${escritos.length ? ' (los de texto se corrigen con la respuesta: C1, C2 y las reglas sobre código)' : ''}`,
    fueraDeLaCopia.length ? `- **Escribió fuera de su copia:** ${fueraDeLaCopia.map((f) => `\`${f}\``).join(', ')}` : null,
    copiaOk(o, dir),
    '',
    '## Nota',
    '',
    r ? notaMd(r) : `No se pudo corregir: el agente falló.\n\n\`\`\`\n${corta(run.err || run.out || '(sin salida)', 2000)}\n\`\`\``,
    '',
    '## Transcripción',
    '',
    eventos.length ? transcripcion(eventos) : '_(el agente no emitió eventos: solo texto)_',
    '',
    '## Respuesta final',
    '',
    '````markdown',
    respuesta,
    '````',
    '',
  ].filter((l) => l !== null).join('\n');
  fs.writeFileSync(path.join(salida, `${tarea.id}.md`), md);

  return { tarea, r, modelo: modeloDe(eventos), error: fallo ? `el agente falló (salida ${run.codigo}): ${corta((run.err || (meta && meta.result) || '').trim(), 200)}` : null, escritas, ms: run.ms, coste: meta && meta.total_cost_usd };
}

function copiaOk(o, dir) {
  return o.conservar ? `- **Copia conservada en:** \`${dir}\`` : null;
}

function notaMd(r) {
  const filas = r.criterios.map((c) => `| ${c.id} ${c.nombre} | ${c.nota}/${c.max} | ${c.detalle.map((d) => d.replace(/\|/g, '\\|')).join('<br>') || '—'} |`);
  const partes = ['| Criterio | Nota | Detalle |', '|---|---|---|', ...filas, '', `Automático: **${r.auto}/${r.max}**`];
  if (r.juez && r.juez.via) {
    partes.push('', `Juez (${r.juez.via}, ${r.juez.modelo}): C3 ${r.juez.c3.nota}/2${r.juez.c3.fallos.length ? ` — ${r.juez.c3.fallos.join(' · ')}` : ''}`, '');
    for (const q of r.juez.c5) partes.push(`- C5 ${q.nota}/2 · ${q.pregunta} — ${q.porque}`);
    partes.push('', `Con juez: **${r.conJuez}/${r.max}** · ${r.aprueba ? 'aprueba' : 'suspende'}`);
  } else {
    partes.push('', `${(r.juez && r.juez.aviso) || 'Sin juez.'}`, '', 'C5, para una persona:', '', ...r.criterio.map((q) => `- ${q}`));
  }
  return partes.join('\n');
}

// ── Resumen ─────────────────────────────────────────────────────────────────

function veredicto(x) {
  if (x.error) return 'error';
  if (x.r.aprueba === null) return x.r.apruebaAuto ? 'aprueba (C5 pendiente)' : 'suspende';
  return x.r.aprueba ? 'aprueba' : 'suspende';
}

function modelos(resultados) {
  const m = [...new Set(resultados.map((x) => x.modelo).filter(Boolean))];
  return m.length ? ` · modelo ${m.map((x) => `\`${x}\``).join(', ')}` : '';
}

function resumen(resultados, o, cabecera) {
  const filas = resultados.map((x) => {
    const det = x.error ? [x.error] : x.r.criterios.filter((c) => c.nota < c.max).map((c) => `${c.id}: ${c.detalle.join('; ')}`);
    const j = x.r && x.r.juez && x.r.juez.via ? x.r.juez : null;
    if (j && j.c3.nota < 2) det.push(`juez C3: ${j.c3.fallos.join('; ')}`);
    if (j) for (const q of j.c5.filter((q) => q.nota === 0)) det.push(`C5 no: ${q.pregunta}`);
    const fallos = det.join(' · ') || '—';
    const juez = x.r && x.r.juez && x.r.juez.via ? `${x.r.juez.c3.nota}/2` : '—';
    const c5 = x.r && x.r.juez && x.r.juez.via ? x.r.juez.c5.map((q) => q.nota).join(' · ') : 'pendiente';
    return `| ${x.tarea.id} | ${x.tarea.modo} | ${x.r ? `${x.r.auto}/${x.r.max}` : '—'} | ${juez} | ${c5} | ${veredicto(x)} | ${fallos.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`;
  });
  const modos = [...new Set(resultados.map((x) => x.tarea.modo))];
  const porModo = modos.map((m) => {
    const de = resultados.filter((x) => x.tarea.modo === m);
    const ok = de.filter((x) => veredicto(x).startsWith('aprueba')).length;
    return `| ${m} | ${ok}/${de.length} | ${ok === de.length ? 'aprueba' : 'suspende'} |`;
  });
  const coste = resultados.reduce((a, x) => a + (x.coste || 0), 0);
  return [
    `# Evaluación de los modos · ${cabecera.fecha}`,
    '',
    `- **Agente:** \`${cabecera.agente}\`${modelos(resultados)}`,
    `- **Juez:** ${cabecera.juez}`,
    `- **Tareas:** ${resultados.length} · ${resultados.filter((x) => veredicto(x).startsWith('aprueba')).length} aprueban · ${resultados.filter((x) => x.error).length} con error${coste ? ` · coste ${coste.toFixed(2)} USD` : ''}`,
    '',
    'Rúbrica en `_agents/evals/README.md`. «Auto» es C1–C4 deterministas; «Juez C3» y «C5» los pone el juez si hubo credenciales.',
    '',
    '| Tarea | Modo | Auto | Juez C3 | C5 | Veredicto | Fallos |',
    '|---|---|---|---|---|---|---|',
    ...filas,
    '',
    'Un modo aprueba si aprueban todas sus tareas.',
    '',
    '| Modo | Tareas | Veredicto |',
    '|---|---|---|',
    ...porModo,
    '',
  ].join('\n');
}

// ── Principal ───────────────────────────────────────────────────────────────

/**
 * Corrige otra vez las respuestas guardadas de una ejecución. Cuando cambia el
 * corrector, lo que hay que saber es si cambia la nota de respuestas reales
 * ya conocidas; volver a lanzar los agentes mezclaría ese cambio con la
 * variación del propio agente, y costaría otra vez.
 */
async function recorregir(o) {
  const dir = path.resolve(o.recorregir);
  const syx = crearConsulta({ root: ROOT });
  const resultados = [];
  for (const t of tareas) {
    const f = path.join(dir, `${t.id}.respuesta.md`);
    if (!fs.existsSync(f)) continue;
    if (o.modo && !o.modo.includes(t.modo)) continue;
    if (o.id && !o.id.includes(t.id)) continue;
    const respuesta = fs.readFileSync(f, 'utf8');
    const fa = path.join(dir, `${t.id}.anexos.json`);
    const escritos = fs.existsSync(fa) ? JSON.parse(fs.readFileSync(fa, 'utf8')) : [];
    if (!respuesta.trim()) { resultados.push({ tarea: t, error: 'respuesta vacía en la ejecución original' }); continue; }
    const det = evaluar({ tarea: t, respuesta, syx, equivalentes, anexos: escritos });
    const juez = o.juez ? await juzgar({ tarea: t, respuesta, root: ROOT }) : { via: null, aviso: 'juez saltado: --sin-juez' };
    const fj = path.join(dir, `${t.id}.jsonl`);
    const eventos = fs.existsSync(fj) ? interpretar(fs.readFileSync(fj, 'utf8')).eventos : [];
    const x = { tarea: t, r: combinar(det, juez), modelo: modeloDe(eventos) };
    resultados.push(x);
    console.log(`${veredicto(x).startsWith('aprueba') ? '✅' : '❌'} ${t.id.padEnd(12)} ${x.r.auto}/${x.r.max}  ${veredicto(x)}`);
  }
  const anterior = fs.existsSync(path.join(dir, 'resumen.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'resumen.json'), 'utf8')) : {};
  const j = o.juez ? disponible() : { via: null, motivo: '--sin-juez' };
  const cabecera = {
    fecha: `${anterior.fecha || '?'} · recorregida el ${new Date().toISOString().slice(0, 10)}`,
    agente: anterior.agente || '?',
    juez: j.via ? `${j.via} (${j.modelo})` : `sin juez — ${j.motivo}; C5 queda para una persona`,
  };
  fs.writeFileSync(path.join(dir, 'RESUMEN.md'), resumen(resultados, o, cabecera));
  console.log(`\n   Resumen: ${path.join(dir, 'RESUMEN.md')}\n`);
}

async function main() {
  const o = opciones(process.argv.slice(2));
  if (o.recorregir) return recorregir(o);
  let elegidas = tareas;
  if (o.modo) elegidas = elegidas.filter((t) => o.modo.includes(t.modo));
  if (o.id) elegidas = elegidas.filter((t) => o.id.includes(t.id));
  if (!elegidas.length) { console.error('❌ Ninguna tarea coincide con el filtro.'); process.exit(1); }

  if (!process.env.SYX_AGENT_CMD && spawnSync('which', ['claude']).status !== 0) {
    console.error('❌ No está la CLI `claude` y no hay SYX_AGENT_CMD. Instala Claude Code o apunta SYX_AGENT_CMD a otro agente.');
    process.exit(1);
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const etiqueta = (o.etiqueta || (process.env.SYX_AGENT_CMD ? 'propio' : (process.env.SYX_AGENT_MODEL || 'claude'))).replace(/[^\w.-]+/g, '-');
  const salida = path.resolve(o.salida || path.join(EVALS, 'runs', `${fecha}-${etiqueta}`));
  fs.mkdirSync(salida, { recursive: true });

  const j = o.juez ? disponible() : { via: null, motivo: '--sin-juez' };
  const cabecera = {
    fecha,
    agente: process.env.SYX_AGENT_CMD || `claude -p${process.env.SYX_AGENT_MODEL ? ` --model ${process.env.SYX_AGENT_MODEL}` : ''}`,
    juez: j.via ? `${j.via} (${j.modelo})` : `sin juez — ${j.motivo}; C5 queda para una persona`,
  };
  console.log(`\n── EVALUACIÓN DE LOS MODOS · ${elegidas.length} tarea(s) → ${path.relative(ROOT, salida) || salida}`);
  console.log(`   agente: ${cabecera.agente}\n   juez:   ${cabecera.juez}\n`);

  const syx = crearConsulta({ root: ROOT });
  const resultados = new Array(elegidas.length);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < elegidas.length) {
      const i = siguiente++;
      const t = elegidas[i];
      const x = await correrTarea(t, o, salida, syx);
      resultados[i] = x;
      const v = veredicto(x);
      console.log(`${v.startsWith('aprueba') ? '✅' : '❌'} ${t.id.padEnd(12)} ${x.r ? `${x.r.auto}/${x.r.max}` : ' — '}  ${v}${x.error ? ` · ${x.error}` : ''}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.paralelo, elegidas.length) }, trabajador));

  fs.writeFileSync(path.join(salida, 'RESUMEN.md'), resumen(resultados, o, cabecera));
  fs.writeFileSync(path.join(salida, 'resumen.json'), JSON.stringify({
    ...cabecera,
    tareas: resultados.map((x) => ({ id: x.tarea.id, modo: x.tarea.modo, veredicto: veredicto(x), auto: x.r && x.r.auto, conJuez: x.r && x.r.conJuez, error: x.error, escritas: x.escritas, segundos: x.ms && x.ms / 1000, coste: x.coste })),
  }, null, 2));
  console.log(`\n   Resumen: ${path.join(path.relative(ROOT, salida) || salida, 'RESUMEN.md')}\n`);

  const errores = resultados.filter((x) => x.error).length;
  const suspensas = resultados.filter((x) => !veredicto(x).startsWith('aprueba')).length;
  process.exitCode = errores || (o.estricto && suspensas) ? 1 : 0;
}

main();
