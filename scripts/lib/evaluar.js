/**
 * SYX — Corrector de las tareas de referencia de los modos
 * ────────────────────────────────────────────────────────
 * Puntúa una respuesta contra una tarea de _agents/evals/tareas.json con la
 * rúbrica de _agents/evals/README.md. Cuatro criterios se miden solos; el
 * quinto (criterio de dominio) son preguntas para una persona, para AUDIT o
 * para el juez opcional de scripts/lib/juez.js.
 *
 *   C1 Contrato    cada bloque ```scss pasa validate_snippet en la ruta de la tarea
 *   C2 Tokens      cada --semantic-* / --component-* nombrado existe (o es nuevo y permitido)
 *   C3 Frontera    reglas con forma: lo que se exige afirmar y lo que no se puede recomendar
 *   C4 Entrega     las secciones del Response Format del modo, y su «## Why»
 *   C5 Criterio    preguntas, sin nota automática
 *
 * POR QUÉ C3 Y C4 SON ASÍ
 * La primera versión buscaba palabras sueltas. Ocho respuestas dañinas sacaban
 * 8/8 recitando lo que el corrector buscaba («R01 R02 R03 R04 — todo bien, se
 * puede fusionar»), y dos correctas suspendían por decir lo prohibido en
 * negativo («esto no pasa por propose.js») o por seguir el formato de su modo
 * en vez del de tareas.json. Las dos cosas tienen el mismo origen: una
 * expresión regular no distingue mencionar de recomendar, ni sabe dónde está.
 * Ahora cada regla dice qué forma tiene (menciona · afirma · recomienda), en qué
 * parte de la respuesta mira (prosa, código, una sección) y con qué tiene que
 * ir junta; y las secciones se leen del modo, no de una lista paralela.
 *
 * Lo que sigue sin poder hacer una regla —saber si una negación es sincera, si
 * un flujo es bueno— lo hace el juez cuando hay credenciales, y si no, una
 * persona. El banco de anti-referencias (_agents/evals/anti/) es lo que obliga
 * a esta parte determinista a no quedarse en recitar palabras.
 */

'use strict';

const path = require('path');
const { seccionesDelModo, whyDelModo, normalizar } = require('./formato-modos');

// `\r?` porque en un checkout de Windows (core.autocrlf) las referencias llegan
// con CRLF y el bloque no se encontraba: C1 suspendía cinco respuestas buenas.
const BLOQUE_SCSS = /```scss\r?\n([\s\S]*?)```/g;
const BLOQUE_DIFF = /```diff\r?\n([\s\S]*?)```/g;

// Un diff entrega el código que queda: sus líneas «+» y de contexto, sin las
// «-» ni las cabeceras.
function despuesDelDiff(code) {
  return code.split('\n')
    .filter((l) => !/^(-|@@|\+\+\+|---|diff |index )/.test(l))
    .map((l) => l.replace(/^[+ ]/, ''))
    .join('\n');
}
// Un nombre de familia con comodín («--semantic-color-state-*»,
// «--component-status-{variante}») no es un token: no se busca.
const TOKEN = /--(?:semantic|component|primitive)-[a-z0-9-]*[a-z0-9](?:-?[*{<…])?/g;

// ── Negación ────────────────────────────────────────────────────────────────
// Dos clases de marcas. Las bidireccionales niegan la cláusula entera, vayan
// antes o después de lo mencionado («no pasa por propose.js», «propose.js se
// niega aquí»). Las de sustitución solo niegan lo que viene DETRÁS («en vez de
// propose.js…»): «propose.js en vez de editar a mano» recomienda propose.js.
const NIEGA = /(^|[^\p{L}])(no|nunca|jam[aá]s|tampoco|ni|not|never|nor|cannot|can't|don't|doesn't|isn't|won't|shouldn't|se niega|rechaz\p{L}*|refuses?|prohib\p{L}*|forbid\p{L}*|deniega|denied)(?!\p{L})/iu;
const SUSTITUYE = /(^|[^\p{L}])(sin|without|en vez de|en lugar de|instead of|rather than|evita\p{L}*|avoid\p{L}*|nada de)(?!\p{L})/iu;
// Fronteras de cláusula: puntuación de frase (el punto, la coma y los dos
// puntos solo si van seguidos de espacio o de un cierre de negrita, para no
// partir «propose.js» ni «check:contraste»), paréntesis, guiones largos,
// celdas de tabla,
// las conjunciones que encadenan una orden con su contraria («no a mano, sino
// con propose.js») y las subordinadas de finalidad o causa, cuya negación es
// suya y no de la orden («lo dejo en pages/ para que no se pierda»).
// Las comillas NO cortan: en «No hay estado "email no registrado"» la negación
// de fuera alcanza a lo citado, y en «Muestra «No hay cuenta»» lo citado es lo
// que se muestra.
const FRONTERA = /[;!?¡¿()[\]|—–]|[.:,](?=[\s*_)]|$)|\s(?:pero|sino|aunque|y|o|but|and|or|then|luego|para que|porque|ya que|so that|because)\s/giu;

function clausula(linea, ini, fin) {
  let a = 0;
  let b = linea.length;
  for (const m of linea.matchAll(FRONTERA)) {
    const e = m.index + m[0].length;
    if (e <= ini) a = e;
    else if (m.index >= fin) { b = m.index; break; }
  }
  return { antes: linea.slice(a, ini), despues: linea.slice(fin, b) };
}

function negada(linea, ini, fin) {
  const { antes, despues } = clausula(linea, ini, fin);
  return NIEGA.test(antes) || NIEGA.test(despues) || SUSTITUYE.test(antes);
}

// ── Estructura de la respuesta ──────────────────────────────────────────────

const COMENTARIO_ANTES = /^(\/\/|\/\*|<!--|#)\s*(antes|before|old|original|era|was)\b/i;
const COMENTARIO_DESPUES = /^(\/\/|\/\*|<!--|#)\s*(despu[eé]s|after|new|nuevo|ahora|now)\b/i;

/** El código de un bloque sin el tramo citado como «antes». */
function sinAntes(code) {
  let antes = false;
  return code.split('\n').filter((l) => {
    const t = l.trim();
    if (COMENTARIO_ANTES.test(t)) { antes = true; return false; }
    if (COMENTARIO_DESPUES.test(t)) { antes = false; return true; }
    return !antes;
  }).join('\n');
}

function quitarFrontmatter(texto) {
  return texto.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

/**
 * Cada línea con lo que hace falta para filtrar: si está en código (y en qué
 * lenguaje) y bajo qué encabezado. Un encabezado es `#`–`####`.
 *
 * Una etiqueta en negrita al principio de línea (`**Contract Check:** …`), que
 * es como los propios modos escriben sus ejemplos, cuenta para decir que una
 * sección está (C4) pero no abre ámbito: «**Contract: FAIL**» dentro de
 * «## Verdict» sigue siendo parte del veredicto.
 *
 * `anexos` son ficheros que el agente escribió en lugar de pegarlos en la
 * respuesta (el runner los recoge de su copia): entran como bloques de código
 * sin sección, para C1, C2 y las reglas que miran el código, nunca para C4.
 */
function analizar(texto, anexos = []) {
  const lineas = [];
  const titulos = [];
  let valla = null;
  let actual = null;
  // Los encabezados abiertos, del más externo al actual: una línea bajo
  // «### 1. Presets» está también en el «## Proposals» que la contiene.
  let pila = [];
  let antes = false;
  texto.split(/\r?\n/).forEach((l, i) => {
    const t = l.trim();
    const v = t.match(/^```\s*([\w-]*)/);
    if (v) {
      valla = valla === null ? (v[1].toLowerCase() || 'texto') : null;
      antes = false;
      lineas.push({ i, texto: l, codigo: null, titulo: actual, valla: true });
      return;
    }
    // Dentro de un bloque, lo que se cita como estado anterior («// Antes»
    // hasta «// Después», o las líneas «-» de un diff) no es lo que la
    // respuesta entrega: no cuenta para las reglas que prohíben algo.
    if (valla !== null) {
      if (COMENTARIO_ANTES.test(t)) antes = true;
      else if (COMENTARIO_DESPUES.test(t)) antes = false;
      const quitada = valla === 'diff' && /^-(?!--)/.test(t);
      lineas.push({ i, texto: l, codigo: valla, titulo: actual, antes: antes || quitada });
      return;
    }
    if (valla === null) {
      const h = t.match(/^(#{1,4})\s+(.+?)\s*#*$/);
      const b = !h && t.match(/^\*\*([^*]{2,60}?):?\*\*:?/);
      if (h) {
        pila = pila.filter((x) => x.nivel < h[1].length);
        actual = { nivel: h[1].length, titulo: h[2], norm: normalizar(h[2]), i, padres: pila.slice() };
        pila.push(actual);
        titulos.push(actual);
      } else if (b) {
        titulos.push({ nivel: 9, titulo: b[1], norm: normalizar(b[1]), i, negrita: true });
      }
      // La línea de una etiqueta en negrita es suya («**Veredicto: FALLA.**»):
      // cuenta para su sección aunque no abra ámbito.
      lineas.push({ i, texto: l, codigo: null, titulo: actual, etiqueta: b ? normalizar(b[1]) : null });
      return;
    }
    lineas.push({ i, texto: l, codigo: valla, titulo: actual });
  });
  for (const a of anexos) {
    const lang = (a.lang || path.extname(a.ruta).slice(1) || 'texto').toLowerCase();
    for (const l of String(a.texto).split(/\r?\n/)) lineas.push({ i: -1, texto: l, codigo: lang, titulo: null, anexo: a.ruta });
  }
  return { lineas, titulos };
}

// «Usages Found (únicos en el repo)», «Variable: --x», «Traspaso a UI»: el
// encabezado vale si empieza por el nombre canónico o un equivalente, con la
// palabra completa.
function coincideTitulo(norm, alias) {
  const a = normalizar(alias);
  return norm === a || norm.startsWith(`${a}:`) || norm.startsWith(`${a} `);
}

function aliasDe(canonica, equivalentes) {
  return [canonica, ...((equivalentes && equivalentes[canonica]) || [])];
}

function enSeccion(linea, canonica, equivalentes) {
  const abiertos = linea.titulo ? [linea.titulo, ...(linea.titulo.padres || [])] : [];
  return aliasDe(canonica, equivalentes).some((a) => abiertos.some((t) => coincideTitulo(t.norm, a)) || (linea.etiqueta && coincideTitulo(linea.etiqueta, a)));
}

// ── C3 · reglas con forma ───────────────────────────────────────────────────

/**
 * Todas las apariciones de la regla en la parte de la respuesta que le toca,
 * cada una marcada como negada o no.
 */
function apariciones(regla, doc, equivalentes, prohibe = false) {
  const salida = [];
  // Las reglas que cruzan líneas (un bloque entero) se miran sobre el texto
  // sin trocear: es la única forma de ver «dos migraciones en un bloque».
  if (regla.multilinea) {
    const m = doc.texto.match(new RegExp(regla.re, 'iu'));
    if (m) salida.push({ linea: doc.texto.slice(0, m.index).split('\n').length, texto: m[0].slice(0, 40), negada: false });
    return salida;
  }
  const re = new RegExp(regla.re, 'giu');
  const junto = regla.junto ? new RegExp(regla.junto, 'iu') : null;
  for (const l of doc.lineas) {
    if (l.valla && !/```/.test(regla.re)) continue;
    if (regla.en === 'prosa' && l.codigo) continue;
    if (regla.en === 'codigo' && !l.codigo) continue;
    // Un diff de SCSS cuenta como SCSS; sus líneas «-» no cuentan para nada.
    if (l.codigo === 'diff' && l.antes) continue;
    if (regla.en && !['prosa', 'codigo'].includes(regla.en) && l.codigo !== regla.en && !(regla.en === 'scss' && l.codigo === 'diff')) continue;
    if (regla.seccion && !enSeccion(l, regla.seccion, equivalentes)) continue;
    if (junto && !junto.test(l.texto)) continue;
    if (prohibe && l.antes) continue;
    for (const m of l.texto.matchAll(re)) {
      if (!m[0].length) break;
      salida.push({ linea: l.anexo ? l.anexo : l.i + 1, texto: m[0], negada: negada(l.texto, m.index, m.index + m[0].length) });
    }
  }
  return salida;
}

function dondeMira(regla) {
  const partes = [];
  if (regla.seccion) partes.push(`en «${regla.seccion}»`);
  if (regla.en) partes.push(regla.en === 'prosa' ? 'en la prosa' : regla.en === 'codigo' ? 'en el código' : `en el bloque ${regla.en}`);
  if (regla.junto) partes.push('en la misma línea que su arreglo');
  return partes.length ? ` (${partes.join(', ')})` : '';
}

function evaluarFrontera(tarea, doc, equivalentes) {
  const detalle = [];
  for (const d of tarea.debe || []) {
    const forma = d.forma || 'menciona';
    const hs = apariciones(d, doc, equivalentes);
    const ok = forma === 'afirma' ? hs.some((h) => !h.negada) : hs.length > 0;
    if (!ok) detalle.push(`falta${dondeMira(d)}: ${d.porque}${hs.length ? ' (solo aparece negado)' : ''}`);
  }
  for (const d of tarea.noDebe || []) {
    const forma = d.forma || 'recomienda';
    const hs = apariciones(d, doc, equivalentes, true);
    const malas = forma === 'menciona' ? hs : hs.filter((h) => !h.negada);
    if (malas.length) detalle.push(`sobra${dondeMira(d)}: ${d.porque} (línea ${malas[0].linea}: «${malas[0].texto}»)`);
  }
  return detalle;
}

// ── C4 · secciones del modo y su Why ────────────────────────────────────────

// La forma canónica es «decidido — porque — qué lo cambiaría». El tercer
// campo es el que importa (decision-record.md: «the load-bearing one»): una
// razón sin la condición que la daría la vuelta no se puede refutar. Así que
// una línea vale si trae los tres campos con sus rayas, o si, escrita de otra
// manera («… Esto cambiaría si …», «… → si …»), trae esa condición.
const SEPARADOR = /\s[—–]\s|\s--\s/g;
const CONDICION = /(^|[^\p{L}])(si|if|unless|salvo que|a menos que|cuando|when|en cuanto|as soon as|would change|cambiar[ií]a)(?!\p{L})/iu;
const tresCampos = (s) => (s.match(SEPARADOR) || []).length >= 2 || CONDICION.test(s);

function itemsDelWhy(lineas) {
  const items = [];
  let actual = null;
  for (const l of lineas) {
    if (l.codigo || l.valla) continue;
    const t = l.texto.trim();
    if (!t) { actual = null; continue; }
    if (/^([-*+]|\d+[.)])\s+/.test(t) || !actual) {
      actual = { texto: t.replace(/^([-*+]|\d+[.)])\s+/, ''), linea: l.i + 1 };
      items.push(actual);
    } else {
      actual.texto += ` ${t}`;
    }
  }
  return items;
}

function evaluarWhy(tarea, doc, equivalentes, root) {
  const why = whyDelModo(root, tarea.modo);
  if (!why.debe || tarea.sinWhy) return { exigido: false, fallos: [] };
  const fallos = [];
  if (why.lugar === 'lineas') {
    // AUDIT y MIGRATE cuelgan cada línea de su hallazgo o de su variable.
    const hay = doc.lineas.some((l) => !l.codigo && !l.valla && tresCampos(l.texto));
    if (!hay) fallos.push(`ninguna línea del Why con sus tres campos (decidido — porque — qué lo cambiaría); ${tarea.modo.toUpperCase()} las cuelga de cada hallazgo`);
    return { exigido: true, fallos };
  }
  const titulo = doc.titulos.find((t) => !t.negrita && aliasDe('Why', equivalentes).some((a) => coincideTitulo(t.norm, a)));
  if (!titulo) return { exigido: true, fallos: ['falta el bloque «## Why» (decision-record.md)'] };
  const despues = doc.titulos.filter((t) => !t.negrita && t.i > titulo.i && t.nivel <= Math.max(titulo.nivel, 2));
  if (despues.length) fallos.push(`«## Why» no es el último bloque: le sigue «${despues[0].titulo}»`);
  const cuerpo = doc.lineas.filter((l) => l.titulo === titulo && l.i !== titulo.i);
  const items = itemsDelWhy(cuerpo);
  if (!items.length) fallos.push('«## Why» está vacío');
  const cojas = items.filter((it) => !tresCampos(it.texto));
  if (cojas.length) fallos.push(`línea del Why sin sus tres campos: «${cojas[0].texto.slice(0, 60)}…»`);
  if (items.length > why.techo) fallos.push(`${items.length} líneas en el Why; el techo es ${why.techo}`);
  return { exigido: true, fallos };
}

function evaluarEntrega(tarea, doc, equivalentes, root) {
  const detalle = [];
  const catalogo = seccionesDelModo(root, tarea.modo);
  // Una entrada puede ser una lista: vale cualquiera de sus secciones («el
  // hallazgo de frontera, en Errors o en Additional Violations»).
  const pedidas = (tarea.secciones || []).filter((s) => normalizar([].concat(s)[0]) !== 'why');
  for (const entrada of pedidas) {
    const opciones = [].concat(entrada);
    const fuera = opciones.filter((s) => !catalogo.some((c) => normalizar(c) === normalizar(s)));
    if (fuera.length) {
      detalle.push(`la tarea pide «${fuera.join('» / «')}», que no está en el Response Format de ${tarea.modo}.md`);
      continue;
    }
    const hay = opciones.some((s) => doc.titulos.some((t) => aliasDe(s, equivalentes).some((a) => coincideTitulo(t.norm, a))));
    if (!hay) detalle.push(`falta la sección «${opciones.join('» o «')}»`);
  }
  const why = evaluarWhy(tarea, doc, equivalentes, root);
  detalle.push(...why.fallos);
  return { detalle, total: pedidas.length + (why.exigido ? 1 : 0) };
}

// ── Nota ────────────────────────────────────────────────────────────────────

function nota(fallos, total) {
  if (!fallos) return 2;
  return fallos === 1 && total > 1 ? 1 : 0;
}

/**
 * @param tarea         una entrada de tareas.json
 * @param respuesta     el Markdown que devolvió el agente
 * @param syx           crearConsulta({ root })
 * @param equivalentes  el bloque `equivalentes` de tareas.json (ES/EN), al que
 *                      se suman los de la propia tarea
 */
function evaluar({ tarea, respuesta, syx, equivalentes = {}, anexos = [] }) {
  const root = syx.root;
  const texto = quitarFrontmatter(respuesta);
  const doc = { ...analizar(texto, anexos), texto };
  const eq = { ...equivalentes };
  for (const [k, v] of Object.entries(tarea.equivalentes || {})) eq[k] = [...(eq[k] || []), ...v];
  const criterios = [];

  // C1 · Contrato
  // Cada bloque se valida en su ruta: los pegados en la respuesta, en la de la
  // tarea; los ficheros que el agente escribió, en la suya (un fichero de
  // tokens no se juzga con las reglas de un átomo).
  const bloques = [
    ...[...texto.matchAll(BLOQUE_SCSS)].map((m) => ({ code: sinAntes(m[1]), path: tarea.scss && tarea.scss.ruta })),
    ...[...texto.matchAll(BLOQUE_DIFF)].map((m) => ({ code: despuesDelDiff(m[1]), path: tarea.scss && tarea.scss.ruta })),
    // El fixture que el agente editó en su sitio se juzga en la ruta que
    // representa, no en _agents/evals/fixtures/.
    ...anexos.filter((a) => /\.scss$/.test(a.ruta)).map((a) => ({ code: a.texto, path: tarea.fixture && a.ruta.endsWith(tarea.fixture) && tarea.scss ? tarea.scss.ruta : a.ruta })),
  ];
  const c1 = { id: 'C1', nombre: 'Contrato', max: 2, detalle: [] };
  if (tarea.scss) {
    if (bloques.length < (tarea.scss.minBloques || 1)) c1.detalle.push(`se esperaba código SCSS para ${tarea.scss.ruta} y no hay bloque \`\`\`scss`);
    bloques.forEach(({ code, path: ruta }, i) => {
      const r = syx.validateSnippet({ code, path: ruta || tarea.scss.ruta });
      for (const [regla, v] of Object.entries(r.violations || {})) {
        const n = Array.isArray(v) ? v.length : (v && v.cases ? v.cases.length : 1);
        c1.detalle.push(`${ruta && ruta !== tarea.scss.ruta ? ruta : `bloque ${i + 1}`}: ${regla} (${n})`);
      }
      // Un bloque que no parsea no ha pasado el contrato: no se ha podido mirar.
      if (r.sintaxis) c1.detalle.push(`bloque ${i + 1}: no parsea (${r.sintaxis.content})`);
    });
  }
  c1.nota = c1.detalle.length ? 0 : 2;
  criterios.push(c1);

  // C2 · Tokens reales
  const c2 = { id: 'C2', nombre: 'Tokens reales', max: 2, detalle: [] };
  const nuevos = tarea.tokens && tarea.tokens.nuevos ? new RegExp(tarea.tokens.nuevos) : null;
  const ignorar = tarea.tokens && tarea.tokens.ignorar ? new RegExp(tarea.tokens.ignorar) : null;
  const todo = [texto, ...anexos.map((a) => a.texto)].join('\n');
  const vistos = new Set(todo.match(TOKEN) || []);
  // Un token de componente que la propia respuesta declara («--component-x: …»
  // en su código) no es inventado: es nuevo. C2 busca referencias a tokens que
  // no existen en ningún sitio, no prohíbe crear los de componente.
  const declarados = new Set(doc.lineas.filter((l) => l.codigo).flatMap((l) => (l.texto.match(/--component-[a-z0-9-]*[a-z0-9](?=\s*:)/g) || [])));
  for (const t of vistos) {
    if (/[*{<…]$/.test(t)) continue;
    if (ignorar && ignorar.test(t)) continue;
    if (nuevos && nuevos.test(t)) continue;
    if (declarados.has(t)) continue;
    // Un token nombrado solo para descartarlo («no un --component-card-bg
    // nuevo») es una alternativa rechazada, que es justo lo que un Why debe
    // nombrar: no es una referencia inventada.
    const usos = doc.lineas.filter((l) => !l.codigo && l.texto.includes(t)).map((l) => {
      const k = l.texto.indexOf(t);
      return negada(l.texto, k, k + t.length);
    });
    const enCodigo = doc.lineas.some((l) => l.codigo && l.texto.includes(t)) || anexos.some((a) => a.texto.includes(t));
    if (!enCodigo && usos.length && usos.every(Boolean)) continue;
    if (t.startsWith('--primitive-')) continue; // R01 lo mide C1 donde importa
    const r = syx.getToken({ token: t });
    if (!r.found) c2.detalle.push(`${t} no existe${r.suggestions && r.suggestions.length ? ` (¿${r.suggestions.slice(0, 2).join(', ')}?)` : ''}`);
  }
  c2.nota = c2.detalle.length ? 0 : 2;
  criterios.push(c2);

  // C3 · Frontera y obligaciones
  const c3 = { id: 'C3', nombre: 'Frontera', max: 2, detalle: evaluarFrontera(tarea, doc, eq) };
  c3.nota = nota(c3.detalle.length, (tarea.debe || []).length + (tarea.noDebe || []).length);
  criterios.push(c3);

  // C4 · Forma de la entrega
  const e = evaluarEntrega(tarea, doc, eq, root);
  const c4 = { id: 'C4', nombre: 'Entrega', max: 2, detalle: e.detalle };
  c4.nota = nota(c4.detalle.length, e.total);
  criterios.push(c4);

  const auto = criterios.reduce((a, c) => a + c.nota, 0);
  const max = criterios.reduce((a, c) => a + c.max, 0);
  return {
    tarea: tarea.id,
    modo: tarea.modo,
    criterios,
    auto,
    max,
    apruebaAuto: auto === max,
    criterio: tarea.criterio || [],
  };
}

module.exports = { evaluar, quitarFrontmatter, analizar, negada };
