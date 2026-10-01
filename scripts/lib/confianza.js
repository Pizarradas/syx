/**
 * SYX — Confianza graduada
 * ────────────────────────
 * Responde a dos preguntas y nada más:
 *   · ¿qué nivel de confianza tiene tocar ESTE fichero?
 *   · ¿dónde va ESTE token, sin que nadie lo diga?
 *
 * LA SEGUNDA ES LA IMPORTANTE
 * El criterio del paso 2.1 dice «sin que nadie le haya dicho dónde ponerlo». La
 * tentación es una tabla `card → _cards.scss`, y esa tabla envejece: se crea un
 * fichero nuevo, nadie actualiza la tabla, y el agente empieza a poner tokens
 * donde no van. Aquí la colocación se DEDUCE de dónde viven ya los tokens de la
 * misma familia. Si mañana `_cards.scss` se parte en dos, esto sigue acertando
 * sin que nadie lo toque, porque lee el código en vez de recordarlo.
 *
 * Los niveles viven en contracts/trust.json, no aquí, para que se puedan leer
 * sin ejecutar nada — y para que la herramienta MCP los sirva tal cual.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CONTRATO = path.join(ROOT, 'contracts', 'trust.json');
const DIR_COMPONENTES = path.join(ROOT, 'scss', 'abstracts', 'tokens', 'components');

let contrato = null;
const cargar = () => (contrato = contrato || JSON.parse(fs.readFileSync(CONTRATO, 'utf8')));

/**
 * Una ruta, tal como la escribiría el propio repositorio: relativa a la raíz,
 * con `/`, sin `.` ni `..`.
 *
 * POR QUÉ NO BASTA CON QUITAR EL `./` DEL PRINCIPIO
 * Porque los patrones se comparan como texto. Sin resolver los `..`,
 * `scss/atoms/../themes/_x.scss` empieza por `scss/atoms/` y salía `pr` siendo
 * un tema; `contracts/dtcg/../rules.json` salía `auto` siendo las reglas; y una
 * ruta absoluta no empezaba por nada y caía al `default` por casualidad, no por
 * criterio. Un permiso que se esquiva escribiendo la misma ruta de otra forma
 * no es un permiso.
 *
 * Una ruta que, ya resuelta, sale del repositorio no se clasifica: el contrato
 * no tiene nada que decir de ficheros ajenos, y fingir que sí sería inventar.
 * Se devuelve `fuera: true` y quien pregunta decide (el veredicto la trata
 * como `human`; el hook de Claude Code, como algo que no le toca).
 *
 * @param {string} p      la ruta, relativa a `raiz` o absoluta
 * @param {string} [raiz] la raíz del repositorio; por defecto, este
 * @returns {{ rel: string, fuera: boolean }}
 */
function normalizarRuta(p, raiz = ROOT) {
  let s = String(p).trim();
  // Absolutas con la semántica de la plataforma: en Windows `C:\\x` y `/x` lo
  // son; en POSIX solo la segunda. `path.relative` entiende ambas a su manera.
  if (path.isAbsolute(s)) s = path.relative(raiz, s);
  s = s.replace(/\\/g, '/');
  // Una unidad distinta en Windows deja la ruta absoluta tras `relative`.
  if (/^[A-Za-z]:\//.test(s) || s.startsWith('/')) return { rel: s, fuera: true };
  // `path.posix.normalize` conserva una `/` final, y conviene: `scss/atoms/`
  // nombra la carpeta, y así es como la escriben los bloques Trust de los modos.
  s = path.posix.normalize(s);
  if (s === '..' || s.startsWith('../')) return { rel: s, fuera: true };
  return { rel: s === '.' || s === './' ? '' : s, fuera: false };
}

/**
 * El nivel de un fichero.
 *
 * Gana el patrón MÁS LARGO, no el primero: `contracts/` no aparece entero en
 * ningún nivel, pero `contracts/rules.json` sí, y tiene que pesar más que
 * cualquier regla general que lo abarque. Sin esto el orden de las claves del
 * JSON decidiría permisos, que es una forma silenciosa de equivocarse.
 */
function clasificarRuta(ruta, { raiz } = {}) {
  const c = cargar();
  const { rel: r, fuera } = normalizarRuta(ruta, raiz);

  if (fuera) {
    const def = c.tiers.human;
    return {
      path: r,
      tier: 'human',
      label: def.label,
      porque: 'La ruta sale del repositorio: el contrato no la cubre y no se clasifica como si lo hiciera.',
      patron: null,
      porDefecto: false,
      fuera: true,
    };
  }

  // La comparación ignora mayúsculas. En macOS y Windows `claude.md` ES
  // `CLAUDE.md`: escribir el primero sobrescribe el segundo, y si se comparara
  // al pie de la letra saldría `auto` por ser un markdown cualquiera.
  const rb = r.toLowerCase();
  let mejor = { tier: c._meta.default, patron: null, largo: -1 };

  for (const [tier, def] of Object.entries(c.tiers)) {
    for (const patron of def.paths) {
      const pb = patron.toLowerCase();
      // `*.md` vale en cualquier carpeta; un patrón con `/` final, como
      // prefijo de carpeta; el resto, como fichero exacto.
      const coincide = pb.startsWith('*.')
        ? rb.endsWith(pb.slice(1))
        : pb.endsWith('/')
          ? rb.startsWith(pb)
          : rb === pb;
      if (coincide && patron.length > mejor.largo) {
        mejor = { tier, patron, largo: patron.length };
      }
    }
  }

  const def = c.tiers[mejor.tier];
  return {
    path: r,
    tier: mejor.tier,
    label: def.label,
    porque: def.porque,
    patron: mejor.patron,
    porDefecto: mejor.patron === null,
    fuera: false,
  };
}

// El veredicto de un conjunto: manda el más restrictivo. Un cambio no es más
// libre que su fichero más delicado.
const ORDEN = ['auto', 'pr', 'human'];
function clasificarCambios(rutas, opciones = {}) {
  const detalle = rutas.map((r) => clasificarRuta(r, opciones));
  const tier = detalle.reduce(
    (a, d) => (ORDEN.indexOf(d.tier) > ORDEN.indexOf(a) ? d.tier : a),
    'auto'
  );
  return {
    tier,
    label: cargar().tiers[tier].label,
    manda: detalle.filter((d) => d.tier === tier).map((d) => d.path),
    detalle,
  };
}

// ─── Dónde va un token ───────────────────────────────────────────────────────

const CAPA = (nombre) => (nombre.match(/^--([a-z]+)-/) || [])[1] || null;

/** Todos los tokens que declara cada fichero de la capa de componente. */
function inventarioComponentes() {
  const mapa = new Map(); // fichero → [tokens]
  for (const f of fs.readdirSync(DIR_COMPONENTES)) {
    if (!f.startsWith('_') || !f.endsWith('.scss')) continue;
    const contenido = fs.readFileSync(path.join(DIR_COMPONENTES, f), 'utf8');
    const tokens = [...contenido.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
    mapa.set(`scss/abstracts/tokens/components/${f}`, tokens);
  }
  return mapa;
}

/**
 * El fichero donde debe ir un token nuevo, deducido de la familia.
 *
 * `--component-feature-card-shadow-hover` comparte prefijo con
 * `--component-feature-card-bg`, que ya vive en _cards.scss: ahí va. Se mide el
 * prefijo COMÚN MÁS LARGO en segmentos, no la coincidencia de texto, para que
 * `--component-card-…` no se lleve por delante a `--component-cards-…`.
 */
function destinoDeToken(nombre) {
  const capa = CAPA(nombre);
  if (capa !== 'component') {
    return {
      resuelto: false,
      motivo: `Solo se deduce el destino de los tokens --component-*. «${nombre}» es de la capa ${capa || 'desconocida'}.`,
    };
  }

  const segmentos = nombre.replace(/^--component-/, '').split('-');

  // Por fichero: cuánto se parece su token MÁS parecido, y cuántos tokens de
  // esa misma familia guarda. Lo segundo desempata: `--component-table-*` está
  // en _tables.scss (19) y también en _surfaces.scss (7), y sin contarlos
  // ganaría el que el sistema de ficheros devolviera primero — decidir la
  // colocación por el orden del `readdir` es decidirla al azar.
  const candidatos = [];
  for (const [fichero, tokens] of inventarioComponentes()) {
    let comun = 0;
    let vecino = null;
    let familiares = 0;
    for (const t of tokens) {
      if (!t.startsWith('--component-')) continue;
      const otros = t.replace(/^--component-/, '').split('-');
      let n = 0;
      while (n < segmentos.length && n < otros.length && segmentos[n] === otros[n]) n++;
      if (n > comun) { comun = n; vecino = t; }
      if (n >= 1 && n === comun) familiares++;
    }
    if (comun > 0) candidatos.push({ fichero, comun, vecino, familiares });
  }

  candidatos.sort((a, b) => b.comun - a.comun || b.familiares - a.familiares);
  const mejor = candidatos[0] || { comun: 0 };

  if (mejor.comun === 0) {
    // Casi siempre no es una familia nueva, es el nombre mal puesto:
    // `--component-site-header-blur` cuando la familia declarada es `header-*`.
    // Ofrecer las familias que contienen algún segmento convierte un «no» en
    // una corrección.
    const familias = new Set();
    for (const [, tokens] of inventarioComponentes()) {
      for (const t of tokens) {
        if (!t.startsWith('--component-')) continue;
        const f = t.replace(/^--component-/, '').split('-').slice(0, 2).join('-');
        if (segmentos.some((s) => f.split('-').includes(s))) familias.add(f);
      }
    }
    return {
      resuelto: false,
      motivo: `Ningún token existente comparte familia con «${nombre}»: sería una familia nueva, y eso es decidir un fichero nuevo, no colocar un token.`,
      familiasParecidas: [...familias].sort().slice(0, 8),
      sugerencia: familias.size
        ? 'Puede que el nombre no siga la familia ya declarada. Si de verdad es nueva, crea el fichero a mano en scss/abstracts/tokens/components/.'
        : 'Si la familia es correcta, créala a mano en scss/abstracts/tokens/components/ y vuelve a intentarlo.',
    };
  }

  return {
    resuelto: true,
    fichero: mejor.fichero,
    // El vecino no es decorativo: es la prueba de por qué va ahí, y es junto a
    // quien se inserta para no romper la agrupación del fichero.
    vecino: mejor.vecino,
    segmentosComunes: mejor.comun,
    familia: segmentos.slice(0, mejor.comun).join('-'),
  };
}

module.exports = {
  contrato: () => cargar(),
  normalizarRuta,
  clasificarRuta,
  clasificarCambios,
  destinoDeToken,
  inventarioComponentes,
};
