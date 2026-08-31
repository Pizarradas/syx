#!/usr/bin/env node
/**
 * SYX — Vía de propuesta
 * ──────────────────────
 * Por donde un agente propone un cambio: decide dónde va, lo escribe, lo
 * compila, lo valida, y deja una rama con un commit y la evidencia al lado.
 * Una persona revisa un diff verde en vez de un texto que dice que está verde.
 *
 * EL PUNTO NO ES AUTOMATIZAR EL COMMIT
 * Es que la propuesta llegue con la prueba delante. Hasta ahora un agente
 * proponía en prosa —«añade este token a _cards.scss»— y la revisión consistía
 * en creerle o en repetir su trabajo. Aquí la revisión empieza con el fichero
 * ya modificado, el CSS recompilado y el validador ejecutado sobre el
 * resultado. Si no está verde, no hay rama.
 *
 * TRES NIVELES DE CONFIANZA (contracts/trust.json)
 *   auto   documentación y artefactos derivados     → se commitea y ya está
 *   pr     tokens de componente, componentes        → rama + evidencia + revisión
 *   human  primitivos, semánticos, temas, guardianes→ no se escribe; se explica
 *
 * NO HACE PUSH POR SU CUENTA. Deja la rama lista e imprime el comando exacto.
 * `--pr` sí publica y abre el PR, y existe para que el camino completo esté
 * disponible, pero hay que pedirlo: quien empuja a un remoto decide cuándo.
 *
 * Uso:
 *   node scripts/propose.js classify [rutas…]
 *   node scripts/propose.js token --name --component-card-glow --value "var(--semantic-shadow-md)" --why "…"
 *       [--dry-run] [--pr] [--file <ruta>]
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { clasificarRuta, clasificarCambios, destinoDeToken, contrato } = require('./lib/confianza');
const { crearConsulta } = require('./lib/consulta');
const { tokensInexistentes } = require('./lib/rules');

const syx = crearConsulta({ root: ROOT });
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
// Los nombres de token EMPIEZAN por `--`, así que no se puede usar el truco
// habitual de «el siguiente argumento vale si no parece una opción»: haría
// imposible pasar `--name --component-x-bg`. Se comparan contra las opciones
// conocidas, que es lo único que las distingue de un valor.
const OPCIONES = ['--name', '--value', '--why', '--file', '--branch', '--dry-run', '--pr'];
const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  const siguiente = i > -1 ? process.argv[i + 1] : undefined;
  return siguiente !== undefined && !OPCIONES.includes(siguiente) ? siguiente : d;
};
const flag = (n) => process.argv.includes(n);

const fin = (msg, code = 1) => { console.log(`\n${msg}\n`); process.exit(code); };

// ─── classify ────────────────────────────────────────────────────────────────

function classify() {
  const rutas = process.argv.slice(3).filter((a) => !a.startsWith('--'));
  const lista = rutas.length ? rutas : git('status', '--porcelain').split('\n').filter(Boolean).map((l) => l.slice(3));

  console.log('\n── CONFIANZA DEL CAMBIO ────────────────────────────────────────\n');
  if (!lista.length) fin('   Sin cambios que clasificar.', 0);

  const v = clasificarCambios(lista);
  for (const d of v.detalle) {
    const marca = { auto: '·', pr: '→', human: '✋' }[d.tier];
    console.log(`   ${marca} ${d.tier.padEnd(6)} ${d.path}${d.porDefecto ? '   (por defecto)' : ''}`);
  }
  const def = contrato().tiers[v.tier];
  console.log(`\n   Veredicto: ${v.label.toUpperCase()} — manda ${v.manda[0]}${v.manda.length > 1 ? ` y ${v.manda.length - 1} más` : ''}`);
  console.log(`   ${def.que}`);
  console.log(`   ${def.porque}\n`);
  process.exit(0);
}

// ─── token ───────────────────────────────────────────────────────────────────

function insertar(rutaFichero, vecino, nombre, valor, porque) {
  const abs = path.join(ROOT, rutaFichero);
  const lineas = fs.readFileSync(abs, 'utf8').split('\n');
  // Se inserta detrás del ÚLTIMO token de la familia, no del primero: así el
  // bloque del componente sigue siendo un bloque y el diff se lee de un
  // vistazo. Insertar por orden alfabético habría partido las agrupaciones que
  // los ficheros ya tienen (y comentan).
  const familia = vecino.replace(/^--component-/, '').split('-').slice(0, 2).join('-');
  let ultima = -1;
  let sangria = '  ';
  lineas.forEach((l, i) => {
    const m = l.match(/^(\s*)(--component-[a-z0-9-]+)\s*:/);
    if (m && m[2].replace(/^--component-/, '').startsWith(familia)) { ultima = i; sangria = m[1]; }
  });
  if (ultima === -1) return { ok: false, motivo: `No se encontró la familia ${familia} en ${rutaFichero}` };

  const nuevas = [];
  if (porque) nuevas.push(`${sangria}// ${porque}`);
  nuevas.push(`${sangria}${nombre}: ${valor};`);
  lineas.splice(ultima + 1, 0, ...nuevas);
  fs.writeFileSync(abs, lineas.join('\n'));
  return { ok: true, linea: ultima + 2 };
}

function token() {
  const nombre = arg('--name');
  const valor = arg('--value');
  const porque = arg('--why');
  const seco = flag('--dry-run');

  console.log('\n── PROPUESTA DE TOKEN ──────────────────────────────────────────\n');
  if (!nombre || !valor) fin('   Faltan --name o --value.');
  if (!/^--[a-z][a-z0-9-]*$/.test(nombre)) fin(`   «${nombre}» no es un nombre de custom property válido.`);

  // 1. ¿Puede escribirse esta capa?
  const capa = nombre.split('-')[2];
  if (capa !== 'component') {
    const ruta = {
      primitive: 'scss/abstracts/tokens/primitives/',
      semantic: 'scss/abstracts/tokens/semantic/',
    }[capa] || 'scss/themes/';
    const c = clasificarRuta(ruta);
    fin(
      `✋ ${nombre} es de la capa «${capa}», que vive en ${ruta}\n` +
      `   Nivel: ${c.label}. ${c.porque}\n\n` +
      `   Lo que sí puede hacer un agente aquí es preparar el análisis: qué temas\n` +
      `   se verían afectados y con qué valores. Escribirlo, no.`
    );
  }

  // 2. ¿Existe ya?
  const previo = syx.getToken({ token: nombre });
  if (previo.encontrado) {
    fin(`   ${nombre} ya existe y vale ${previo.value}.\n   Cambiar un token existente no es proponer uno nuevo: hazlo a mano o abre la conversación.`);
  }

  // 3. El valor tiene que ser conforme ANTES de escribir nada.
  //
  // La comprobación del primitivo se hace a mano y NO pasando el valor por
  // `revisar()`: R01 exceptúa toda la carpeta scss/abstracts/, que es
  // precisamente donde va a caer este token, así que el validador lo habría
  // aprobado. La regla que importa aquí no es «dónde vive el fichero» sino
  // «qué capa salta el valor», y son cosas distintas. Se descubrió porque
  // check-propuesta.js aceptó un var(--primitive-…) que debía negar.
  if (/var\(\s*--primitive-/.test(valor)) {
    fin(
      `   El valor apunta a un primitivo, y un --component-* pasa por --semantic-*.\n` +
      `   ${valor}\n\n` +
      `   Dar papel a un primitivo es trabajo de la capa semántica, que es solo humana.`
    );
  }
  const conocidos = new Set(
    Object.values(require(path.join(ROOT, 'tokens.json')))
      .filter((x) => x && typeof x === 'object')
      .flatMap((x) => Object.keys(x))
  );
  const fuera = tokensInexistentes(valor, conocidos).filter((t) => !t.conFallback);
  if (fuera.length) fin(`   El valor usa tokens que no existen: ${fuera.map((t) => t.token).join(', ')}`);

  // Un color a pelo casi nunca es un color nuevo: suele ser un token que ya
  // está y que no se ha buscado. Se dice cuál en vez de solo decir que no.
  if (/#[0-9a-f]{3,8}\b|\brgba?\(|\boklch\(\s*[0-9.]/i.test(valor)) {
    const cerca = syx.findTokenByValue({ value: valor });
    // De los que valen ese color, el que hay que recomendar es el SEMÁNTICO:
    // apuntar a otro token de componente sería acoplar dos componentes por el
    // color, que es justo lo que la capa semántica está ahí para evitar.
    const semanticos = cerca.exactos.filter((t) => t.startsWith('--semantic-'));
    fin(
      `   El valor es un color literal, y un token de componente debe apuntar a uno semántico.\n` +
      (semanticos.length
        ? `   Ese color ya es ${semanticos.slice(0, 4).join(', ')}${semanticos.length > 4 ? `, y ${semanticos.length - 4} más` : ''}.\n` +
          `   Usa var(${semanticos[0]}) si es el papel que le corresponde.`
        : cerca.exactos.length
          ? `   Existe como ${cerca.exactos.slice(0, 3).join(', ')}, pero ninguno es semántico:\n` +
            `   ese color no tiene todavía un papel en el sistema, y dárselo es cosa de la capa semántica, que es solo humana.`
          : `   Si de verdad es un color nuevo, entra por la capa primitiva, que es solo humana.`)
    );
  }

  // 4. Dónde va — sin que nadie lo diga.
  const destino = arg('--file') ? { resuelto: true, fichero: arg('--file'), vecino: null } : destinoDeToken(nombre);
  if (!destino.resuelto) {
    fin(`   ${destino.motivo}\n` +
        (destino.familiasParecidas?.length ? `\n   Familias declaradas que se le parecen: ${destino.familiasParecidas.join(', ')}\n` : '') +
        (destino.sugerencia ? `\n   ${destino.sugerencia}` : ''));
  }
  const nivel = clasificarRuta(destino.fichero);
  console.log(`   token        ${nombre}`);
  console.log(`   valor        ${valor}`);
  console.log(`   destino      ${destino.fichero}${destino.vecino ? `   (junto a ${destino.vecino})` : ''}`);
  console.log(`   deducido de  familia «${destino.familia}», ${destino.segmentosComunes} segmento(s) en común`);
  console.log(`   nivel        ${nivel.label} — ${nivel.porque}\n`);

  if (seco) fin('   --dry-run: no se ha escrito nada.', 0);

  // 5. El árbol tiene que estar limpio o la propuesta arrastraría trabajo ajeno.
  const sucio = git('status', '--porcelain');
  if (sucio) fin(`   El árbol de trabajo tiene cambios sin commitear:\n${sucio.split('\n').slice(0, 6).map((l) => '     ' + l).join('\n')}\n\n   Una propuesta tiene que ser SOLO la propuesta. Guarda o descarta antes.`);

  const ramaPrevia = git('rev-parse', '--abbrev-ref', 'HEAD');
  const slug = nombre.replace(/^--/, '').replace(/[^a-z0-9]+/g, '-');
  const rama = arg('--branch') || `syx/token-${slug}`;

  const ins = insertar(destino.fichero, destino.vecino || nombre, nombre, valor, porque);
  if (!ins.ok) fin(`   ${ins.motivo}`);
  console.log(`   escrito en ${destino.fichero}:${ins.linea}\n`);

  // 6. Compilar y validar SOBRE EL RESULTADO. Es la diferencia entre una
  // propuesta y una opinión.
  let evidencia;
  try {
    console.log('   compilando y validando…');
    execFileSync('npm', ['run', 'build:css'], { cwd: ROOT, stdio: 'ignore' });
    execFileSync('node', ['scripts/build-component-registry.js'], { cwd: ROOT, stdio: 'ignore' });
    evidencia = {
      validador: execFileSync('node', ['scripts/syx-validate.js'], { cwd: ROOT, encoding: 'utf8' }),
      snapshot: execFileSync('node', ['scripts/build-token-snapshot.js', '--check'], { cwd: ROOT, encoding: 'utf8' }),
    };
  } catch (e) {
    git('checkout', '--', '.');
    fin(`   La validación ha fallado, así que no hay rama. Revertido.\n\n${(e.stdout || e.message).toString().split('\n').slice(-25).join('\n')}`);
  }

  // 7. El token nuevo tiene que llegar de verdad al CSS compilado.
  const compilado = fs.readFileSync(syx.cssPath('syx-sketch'), 'utf8').includes(nombre);
  if (!compilado) {
    git('checkout', '--', '.');
    fin(`   ${nombre} no aparece en el CSS compilado: el fichero donde se escribió no entra en el bundle. Revertido.`);
  }

  // 8. Evidencia al lado del cambio.
  const dirEv = path.join(ROOT, 'contracts', 'propuestas');
  fs.mkdirSync(dirEv, { recursive: true });
  const relEv = `contracts/propuestas/${slug}.md`;
  fs.writeFileSync(path.join(ROOT, relEv), [
    `# Propuesta — \`${nombre}\``,
    '',
    `**Generada por** \`scripts/propose.js\` · ${new Date().toISOString()} · SYX v${syx.version}`,
    '',
    '## Qué',
    '',
    `| | |`,
    `|---|---|`,
    `| Token | \`${nombre}\` |`,
    `| Valor | \`${valor}\` |`,
    `| Fichero | \`${destino.fichero}\` |`,
    `| Nivel de confianza | ${nivel.label} — ${nivel.porque} |`,
    '',
    porque ? `**Por qué:** ${porque}\n` : '',
    '## Dónde va, y por qué ahí',
    '',
    destino.vecino
      ? `Nadie lo ha dicho: se dedujo de la familia \`${destino.familia}\`, que ya vive en ese fichero (\`${destino.vecino}\`). Se insertó al final de su bloque para no partir la agrupación.`
      : `Fichero indicado a mano con \`--file\`.`,
    '',
    '## Evidencia',
    '',
    '```',
    evidencia.validador.trim(),
    '```',
    '',
    '```',
    evidencia.snapshot.trim(),
    '```',
    '',
    '## Qué revisar',
    '',
    '- Que el valor semántico elegido es el que corresponde, no solo uno que compila.',
    '- Que el token se usa en algún sitio: un token que nadie consume es peso muerto.',
    '- Que el nombre encaja con la familia y no inventa una convención nueva.',
    '',
  ].filter((l) => l !== '').join('\n') + '\n');

  // 9. Rama y commit. Sin push.
  git('checkout', '-b', rama);
  git('add', '-A');
  git('commit', '-q', '-m',
    `feat(tokens): ${nombre}\n\n` +
    (porque ? `${porque}\n\n` : '') +
    `Propuesta generada por scripts/propose.js.\n` +
    `Destino deducido de la familia ${destino.familia} (vecino: ${destino.vecino}).\n` +
    `Validacion en verde sobre el CSS recompilado; evidencia en ${relEv}.`);

  console.log(`\n✅ Rama ${rama} lista, un commit, validación en verde.`);
  console.log(`   evidencia    ${relEv}`);
  console.log(`   volver       git checkout ${ramaPrevia}`);

  if (flag('--pr')) {
    try {
      git('push', '-u', 'origin', rama);
      const url = execFileSync('gh', ['pr', 'create', '--fill', '--body-file', relEv], { cwd: ROOT, encoding: 'utf8' }).trim();
      console.log(`   PR           ${url}\n`);
    } catch (e) {
      console.log(`\n⚠️  No se pudo publicar (${e.message.split('\n')[0]}). La rama está local y completa:`);
      console.log(`   git push -u origin ${rama} && gh pr create --fill --body-file ${relEv}\n`);
    }
  } else {
    console.log(`\n   Para publicarla:`);
    console.log(`   git push -u origin ${rama} && gh pr create --fill --body-file ${relEv}\n`);
  }
}

const orden = process.argv[2];
if (orden === 'classify') classify();
else if (orden === 'token') token();
else {
  console.log(`
  node scripts/propose.js classify [rutas…]     nivel de confianza de unos cambios
  node scripts/propose.js token --name … --value …   propone un token de componente

    --why <texto>    la razón, que va al comentario, al commit y a la evidencia
    --file <ruta>    fuerza el fichero destino (por defecto se deduce)
    --dry-run        dice qué haría y no toca nada
    --pr             además publica la rama y abre el PR
`);
  process.exit(orden ? 1 : 0);
}
