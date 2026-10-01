/**
 * SYX — El motor de las reglas de contrato (R01–R04, R09–R11)
 * ────────────────────────────────────────────────────────────
 * Un solo motor para los tres que preguntan: `syx-validate.js`, que lo pasa
 * sobre el repositorio entero; `validate_snippet` (servidor MCP), que lo pasa
 * sobre un fragmento ANTES de que un agente lo escriba; y el criterio C1 de las
 * evaluaciones de los modos, que llama a `validate_snippet`. Dos copias de las
 * mismas reglas acaban diciendo cosas distintas.
 *
 * POR QUÉ SOBRE EL ÁRBOL Y NO POR LÍNEAS
 * Hasta octubre de 2026 esto eran expresiones regulares línea a línea, y se
 * esquivaban cambiando el formato: `transition:opacity .2s` sin espacio,
 * `.a { position: absolute; }` en una sola línea, `var( --primitive-x)`,
 * `! important`, `transition-property`… todo pasaba por conforme. Y al revés:
 * `// !important` en un comentario marcaba R02. Un guardián que depende de
 * cómo se sangra el código no guarda nada. Aquí se parsea con postcss-scss y se
 * miran declaraciones (anidadas, en una línea, propiedades anidadas de Sass),
 * parámetros de `@include` y nada de lo que hay en comentarios o en cadenas.
 *
 * QUÉ SALE DEL CONTRATO
 * Todo lo que es decisión: severidad, rutas permitidas (`allowedIn`), qué
 * propiedad o valor prohíbe cada regla (`match`), qué reglas admiten excepción
 * en línea y cómo se escribe (`engine.exceptions`). Este fichero solo sabe
 * INTERPRETAR las clases de `match`; si mañana R04 prohíbe también `relative`,
 * se cambia contracts/rules.json y no esto.
 *
 * EXCEPCIONES
 * Una por declaración, con su porqué, en la línea de encima:
 *
 *     // syx-allow R03: el hack de autofill de Chrome no es movimiento visible
 *     transition: background-color 600000s 0s;
 *
 * Ya no hay ficheros enteros exceptuados: exceptuaban por una línea y seguían
 * exceptuando cuando la línea se iba (cuatro de ellos tenían ya 0 primitivos),
 * así que lo siguiente que se escribiera allí pasaba sin mirar. Una excepción
 * que no excusa nada es error (R10), igual que una entrada de `allowedIn` que
 * apunta a un fichero que no lo necesita o que no existe.
 *
 * DEPENDENCIA
 * postcss-scss (y postcss, su par) van en `dependencies` y no en
 * `devDependencies`: este fichero lo carga el servidor MCP publicado
 * (`syx-mcp`, `validate_snippet`) en la máquina de quien instala el paquete,
 * donde las devDependencies no existen.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const postcssScss = require('postcss-scss');
const { distancia } = require('./escaner');

const ROOT_POR_DEFECTO = path.resolve(__dirname, '..', '..');

// ─── Utilidades de texto ────────────────────────────────────────────────────

/** Vacía las cadenas: un `"!important"` de ejemplo no es un `!important`. */
const sinCadenas = (s) => String(s).replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""');

/** Quita los comentarios que puedan quedar dentro de un valor o un parámetro. */
const sinComentarios = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

const limpio = (s) => sinComentarios(sinCadenas(s));

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * El primer color escrito a mano de un valor, o null. Cuenta como literal un
 * hexadecimal, una función de color sin ningún `var()` dentro (`oklch(1 0 0)`,
 * `rgb(…)`) y las palabras white/black. NO lo son `transparent` ni
 * `currentColor` (no son un color, son su ausencia o su herencia), ni una
 * función que deriva de un token (`oklch(from var(--semantic-…) …)`,
 * `color-mix(… var(--semantic-…) …)`): eso es traducir un rol, no inventarlo.
 */
function literalDeColor(valor) {
  const v = String(valor);
  const hex = /(^|[\s,(])(#[0-9a-f]{3,8})\b/i.exec(v);
  if (hex) return hex[2];
  const re = /\b(oklch|oklab|lch|lab|rgba?|hsla?|hwb|color)\(/gi;
  let m;
  while ((m = re.exec(v))) {
    // El cuerpo de la función, contando paréntesis.
    let prof = 0, j = m.index + m[0].length - 1;
    for (; j < v.length; j++) {
      if (v[j] === '(') prof++;
      else if (v[j] === ')' && --prof === 0) break;
    }
    const llamada = v.slice(m.index, j + 1);
    if (!/var\(/.test(llamada)) return llamada;
  }
  const palabra = /(^|[\s,(])(white|black)\b/i.exec(v);
  return palabra ? palabra[2] : null;
}

/** `-webkit-transition` → `transition`. */
const sinPrefijo = (prop) => prop.replace(/^-(webkit|moz|ms|o)-/i, '');

// ─── El contrato ─────────────────────────────────────────────────────────────

function leerContrato(root) {
  const fichero = path.join(root, 'contracts', 'rules.json');
  const c = JSON.parse(fs.readFileSync(fichero, 'utf8'));
  const motor = c.engine || {};
  const exc = motor.exceptions || {};
  const ast = c.rules.filter((r) => r.match);
  // Lo que el motor necesita y el contrato no diga es un error del contrato,
  // no algo que rellenar aquí con un valor por defecto que nadie ve.
  for (const r of ast) {
    for (const k of ['severity', 'allowedIn', 'match']) {
      if (r[k] === undefined) throw new Error(`contracts/rules.json: ${r.id} no declara \`${k}\``);
    }
  }
  if (!exc.directive || !exc.minReasonLength || !exc.enforcedBy) {
    throw new Error('contracts/rules.json: engine.exceptions incompleto (directive, minReasonLength, enforcedBy)');
  }
  if (!ast.some((r) => r.id === exc.enforcedBy)) {
    throw new Error(`contracts/rules.json: engine.exceptions.enforcedBy apunta a ${exc.enforcedBy}, que no es una regla de árbol`);
  }
  return { completo: c, motor, exc, ast, porId: Object.fromEntries(c.rules.map((r) => [r.id, r])) };
}

// ─── Mixins ─────────────────────────────────────────────────────────────────

function andarScss(dir, fuera = []) {
  let entradas = [];
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return fuera; }
  for (const e of entradas) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andarScss(p, fuera);
    else if (e.name.endsWith('.scss')) fuera.push(p);
  }
  return fuera;
}

function mixinsDe(arbol) {
  const nombres = new Set();
  arbol.walkAtRules('mixin', (n) => {
    const m = /^\s*([\w-]+)/.exec(n.params);
    if (m) nombres.add(m[1]);
  });
  return nombres;
}

/** Nombre de un `@include`, con y sin espacio de nombres (`m.foo` → `foo`). */
function nombreInclude(params) {
  const m = /^\s*((?:[\w-]+\.)?[\w-]+)/.exec(params);
  if (!m) return null;
  const completo = m[1];
  return { completo, corto: completo.includes('.') ? completo.split('.').pop() : completo };
}

// ─── El motor ───────────────────────────────────────────────────────────────

function crearMotor({ root = ROOT_POR_DEFECTO } = {}) {
  const contrato = leerContrato(root);
  const { exc, ast, porId } = contrato;
  const HIGIENE = exc.enforcedBy;
  let mixinsRepo = null;

  /** Todos los @mixin del sistema, leídos de las rutas que dice el contrato. */
  function mixinsConocidos() {
    if (mixinsRepo) return mixinsRepo;
    const regla = ast.find((r) => r.match.kind === 'unknown-mixin');
    const fuentes = (regla && regla.match.mixinSources) || [];
    mixinsRepo = new Set();
    for (const f of fuentes) {
      for (const fichero of andarScss(path.join(root, f))) {
        try {
          for (const n of mixinsDe(postcssScss.parse(fs.readFileSync(fichero, 'utf8')))) mixinsRepo.add(n);
        } catch (e) { /* un fichero que no parsea lo dirá su propia revisión */ }
      }
    }
    return mixinsRepo;
  }

  const enRuta = (lista, rel) => lista.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p));
  const permitido = (regla, rel) => enRuta(regla.allowedIn, rel);
  // `appliesIn` acota una regla a unas capas (R11 solo mira dónde se DECLARAN
  // tokens de componente). Sin él, la regla vale en todo scss/.
  const aplica = (regla, rel) => !regla.appliesIn || enRuta(regla.appliesIn, rel);

  /** La propiedad efectiva, contando las propiedades anidadas de Sass. */
  function propiedadEfectiva(decl) {
    let prop = decl.prop;
    for (let p = decl.parent; p; p = p.parent) {
      if (p.type === 'decl' && p.isNested) { prop = `${p.prop}-${prop}`; continue; }
      if (p.type === 'rule') {
        // `transition: { property: opacity }` llega como regla de selector «transition:».
        const m = /^\s*(-?[A-Za-z][\w-]*)\s*:\s*$/.exec(p.selector);
        if (m) { prop = `${m[1]}-${prop}`; continue; }
      }
      break;
    }
    return prop;
  }

  // Cada clase de `match` que el contrato puede pedir. Devuelven un motivo
  // corto si el nodo la incumple, o null.
  const COMPROBAR = {
    'custom-property-reference': (m, nodo) => {
      const re = new RegExp(`var\\(\\s*${escapar(m.prefix)}`, 'i');
      if (nodo.type === 'decl' && m.in.includes('declaration-value') && re.test(limpio(nodo.value))) return `usa ${m.prefix}*`;
      if (nodo.type === 'atrule' && m.in.includes('at-rule-params') && re.test(limpio(nodo.params))) return `usa ${m.prefix}* en @${nodo.name}`;
      return null;
    },
    important: (m, nodo) => {
      if (nodo.type === 'decl' && (nodo.important || /!\s*important\b/i.test(limpio(nodo.value)))) return '!important';
      if (nodo.type === 'atrule' && m.in.includes('at-rule-params') && /!\s*important\b/i.test(limpio(nodo.params))) return `!important en @${nodo.name}`;
      return null;
    },
    property: (m, nodo) => {
      if (nodo.type !== 'decl' || nodo.prop.startsWith('--') || nodo.prop.startsWith('$')) return null;
      let prop = propiedadEfectiva(nodo).toLowerCase();
      if (m.vendorPrefixes) prop = sinPrefijo(prop);
      const base = m.property.toLowerCase();
      if (!(prop === base || (m.longhands && prop.startsWith(`${base}-`)))) return null;
      // `transition: { … }` en Sass es solo un contenedor: lo que cuenta son
      // sus hijas, que ya se revisan con la propiedad completa.
      if (nodo.isNested && !limpio(nodo.value).trim()) return null;
      if (!m.values) return prop;
      const valor = limpio(nodo.value).replace(/#\{|\}/g, ' ');
      const v = m.values.find((x) => new RegExp(`(^|[^\\w-])(-webkit-)?${escapar(x)}($|[^\\w-])`, 'i').test(valor));
      return v ? `${prop}: ${v}` : null;
    },
    'unknown-mixin': (m, nodo, ctx) => {
      if (nodo.type !== 'atrule' || nodo.name !== 'include') return null;
      const n = nombreInclude(nodo.params);
      if (!n) return '@include sin nombre';
      if ((m.builtins || []).includes(n.completo)) return null;
      if (ctx.mixins.has(n.corto)) return null;
      return `no existe el mixin ${n.completo}`;
    },
    // R11: lo que LEE un token de componente. La capa de componente traduce
    // roles semánticos a piezas concretas; si lee un primitivo, el componente
    // queda fuera del alcance del tema (la píldora primaria de example-06 era
    // violeta en un tema cian, y no cambiaba en oscuro). Un color literal es
    // el mismo atajo con otra cara: un rol escrito a mano.
    'component-token-source': (m, nodo) => {
      if (nodo.type !== 'decl' || !nodo.prop.startsWith(m.declares)) return null;
      const valor = limpio(nodo.value);
      const leidos = [...valor.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((x) => x[1]);
      const prohibido = leidos.find((t) => !m.mayRead.some((p) => t.startsWith(p)));
      if (prohibido) return `${m.declares}* lee ${prohibido}: solo puede leer ${m.mayRead.map((p) => `${p}*`).join(' o ')}`;
      if (m.colorLiterals === false) {
        const lit = literalDeColor(valor);
        if (lit) return `${m.declares}* con un color literal (${lit}): un color es un rol, va en la capa semántica`;
      }
      return null;
    },
    // La higiene de las excepciones no mira nodos: la aplica el propio motor.
    'exception-hygiene': () => null,
  };

  for (const r of ast) {
    if (!COMPROBAR[r.match.kind]) throw new Error(`contracts/rules.json: ${r.id} pide match.kind «${r.match.kind}», que el motor no sabe comprobar`);
  }

  /** La directiva `syx-allow` de un comentario, o null si no lo es. */
  function leerDirectiva(comentario) {
    const t = comentario.text.trim();
    if (!t.startsWith(exc.directive)) return null;
    const m = new RegExp(`^${escapar(exc.directive)}\\s+(R\\d+(?:\\s*,\\s*R\\d+)*)\\s*:\\s*(.*)$`).exec(t);
    if (!m) return { comentario, mal: `directiva mal formada; se escribe «${exc.syntax}»` };
    const reglas = m[1].split(',').map((x) => x.trim());
    const porque = m[2].trim();
    if (porque.length < exc.minReasonLength) return { comentario, mal: `sin porqué (mínimo ${exc.minReasonLength} caracteres)` };
    for (const id of reglas) {
      if (!porId[id]) return { comentario, mal: `${id} no existe en el contrato` };
      if (!porId[id].inlineException) return { comentario, mal: `${id} no admite excepción en línea` };
    }
    return { comentario, reglas, porque, usadas: new Set() };
  }

  const lineaDe = (lineas, n) => (lineas[n - 1] || '').trim();

  /**
   * Pasa las reglas de árbol sobre UN fichero (real o imaginario).
   * `rel` importa: lo permitido depende de dónde vaya a vivir el código.
   */
  function revisarDetalle(rel, contenido, { mixinsExtra } = {}) {
    const violaciones = Object.fromEntries(ast.map((r) => [r.id, []]));
    const usadas = [];
    const permitidosUsados = new Set();
    const texto = String(contenido);
    const lineas = texto.split('\n');

    let arbol;
    try {
      arbol = postcssScss.parse(texto, { from: rel });
    } catch (e) {
      return { violaciones, usadas, permitidosUsados, sintaxis: { file: rel, line: e.line || 0, content: e.reason || e.message } };
    }

    const ctx = { mixins: new Set([...mixinsConocidos(), ...mixinsDe(arbol), ...(mixinsExtra || [])]) };
    const directivas = new Map(); // nodo cubierto → directiva
    const higiene = (linea, porque) =>
      violaciones[HIGIENE].push({ file: rel, line: linea, content: lineaDe(lineas, linea), motivo: porque });

    // Primero las directivas: cada una cubre el nodo siguiente, y solo él.
    arbol.walkComments((c) => {
      const d = leerDirectiva(c);
      if (!d) return;
      const linea = c.source.start.line;
      if (d.mal) return higiene(linea, d.mal);
      const sig = c.next();
      if (!sig || sig.type === 'comment' || sig.source.start.line !== c.source.end.line + 1) {
        return higiene(linea, 'no va en la línea justo encima de una declaración');
      }
      if (sig.nodes) return higiene(linea, 'una excepción cubre una declaración, no un bloque');
      directivas.set(sig, d);
    });

    arbol.walk((nodo) => {
      if (nodo.type !== 'decl' && nodo.type !== 'atrule') return;
      for (const regla of ast) {
        if (!aplica(regla, rel)) continue;
        const motivo = COMPROBAR[regla.match.kind](regla.match, nodo, ctx);
        if (!motivo) continue;
        if (permitido(regla, rel)) { permitidosUsados.add(`${regla.id}|${rel}`); continue; }
        const linea = nodo.source.start.line;
        const caso = { file: rel, line: linea, content: lineaDe(lineas, linea), motivo };
        const d = directivas.get(nodo);
        if (d && d.reglas.includes(regla.id)) {
          d.usadas.add(regla.id);
          usadas.push({ ...caso, regla: regla.id, porque: d.porque });
          continue;
        }
        if (regla.match.kind === 'unknown-mixin') caso.sugerencias = sugerir(nombreInclude(nodo.params), ctx.mixins);
        violaciones[regla.id].push(caso);
      }
    });

    // Una excepción que no excusa nada es un pase firmado para la siguiente.
    for (const d of directivas.values()) {
      const muertas = d.reglas.filter((id) => !d.usadas.has(id));
      if (muertas.length) higiene(d.comentario.source.start.line, `excepción muerta: no excusa ninguna violación de ${muertas.join(', ')}`);
    }

    return { violaciones, usadas, permitidosUsados, sintaxis: null };
  }

  /** `{ R01: [...], …, R10: [...] }`; si no parsea, además `sintaxis: [...]`. */
  function revisar(rel, contenido, opciones) {
    const r = revisarDetalle(rel, contenido, opciones);
    return r.sintaxis ? { ...r.violaciones, sintaxis: [r.sintaxis] } : r.violaciones;
  }

  /**
   * Sobre una lista de ficheros, agregando. Y lo que solo se ve con el árbol
   * entero delante: las entradas de `allowedIn` que son UN fichero y ya no
   * permiten nada, o no existen.
   */
  function revisarTodos(ficheros) {
    const violaciones = Object.fromEntries(ast.map((r) => [r.id, []]));
    const excepciones = [];
    const sintaxis = [];
    const permitidosUsados = new Set();
    for (const { rel, content } of ficheros) {
      const r = revisarDetalle(rel, content);
      for (const k of Object.keys(violaciones)) violaciones[k].push(...r.violaciones[k]);
      excepciones.push(...r.usadas);
      if (r.sintaxis) sintaxis.push(r.sintaxis);
      for (const x of r.permitidosUsados) permitidosUsados.add(x);
    }
    if (contrato.motor.allowedIn && contrato.motor.allowedIn.fileEntriesMustExcuse) {
      for (const regla of ast) {
        for (const p of regla.allowedIn) {
          if (p.endsWith('/')) continue;
          const existe = fs.existsSync(path.join(root, p));
          if (existe && permitidosUsados.has(`${regla.id}|${p}`)) continue;
          violaciones[HIGIENE].push({
            file: 'contracts/rules.json', line: 0,
            content: `${regla.id}.allowedIn → ${p}`,
            motivo: existe ? 'permiso muerto: el fichero no tiene nada que excusar' : 'el fichero no existe',
          });
        }
      }
    }
    return { violaciones, excepciones, sintaxis };
  }

  function sugerir(n, mixins) {
    if (!n) return [];
    return [...mixins]
      .map((x) => ({ x, d: x.includes(n.corto) || n.corto.includes(x) ? 0 : distancia(n.corto, x) }))
      .filter((s) => s.d <= 4)
      .sort((a, b) => a.d - b.d || a.x.localeCompare(b.x))
      .slice(0, 5)
      .map((s) => s.x);
  }

  const DESCRIPCIONES = Object.fromEntries(ast.map((r) => [r.id, r.resumen || r.description]));
  const severidad = (id) => (porId[id] ? porId[id].severity : contrato.motor.parseErrorSeverity || 'error');

  return { contrato: contrato.completo, reglas: ast, DESCRIPCIONES, severidad, revisar, revisarDetalle, revisarTodos, mixinsConocidos };
}

// ─── Los tokens que un fragmento usa y que no existen ──────────────────────

/**
 * No es una regla numerada, pero es la comprobación que más falta hacía: el
 * registro de componentes llegó a tener 81 de 111 tokens con nombres que no
 * existían, y nada lo detectaba porque R05 y R06 comparan DECLARACIONES contra
 * tokens.json, nunca el CONSUMO contra las declaraciones.
 */
function tokensInexistentes(contenido, conocidos) {
  const usados = new Set(
    [...String(contenido).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1])
  );
  const fuera = [];
  for (const t of usados) {
    if (conocidos.has(t)) continue;
    // Con fallback no rompe: `var(--x, algo)` pinta `algo`.
    const conFallback = new RegExp(`var\\(\\s*${t}\\s*,`).test(contenido);
    fuera.push({ token: t, conFallback });
  }
  return fuera.sort((a, b) => a.token.localeCompare(b.token));
}

// ─── Atajos sobre el repositorio de este paquete ────────────────────────────
// Para quien solo quiere `revisar(rel, código)` sin montar nada (el guardián
// del córtex, por ejemplo). El motor se crea la primera vez que se pide.

let motorPorDefecto = null;
const motor = () => (motorPorDefecto = motorPorDefecto || crearMotor());

module.exports = {
  crearMotor,
  tokensInexistentes,
  revisar: (rel, contenido, opciones) => motor().revisar(rel, contenido, opciones),
  revisarTodos: (ficheros) => motor().revisarTodos(ficheros),
};
