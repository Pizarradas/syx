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

const normalizar = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');

/**
 * El nivel de un fichero.
 *
 * Gana el patrón MÁS LARGO, no el primero: `contracts/` no aparece entero en
 * ningún nivel, pero `contracts/rules.json` sí, y tiene que pesar más que
 * cualquier regla general que lo abarque. Sin esto el orden de las claves del
 * JSON decidiría permisos, que es una forma silenciosa de equivocarse.
 */
function clasificarRuta(rel) {
  const c = cargar();
  const r = normalizar(rel);
  let mejor = { tier: c._meta.default, patron: null, largo: -1 };

  for (const [tier, def] of Object.entries(c.tiers)) {
    for (const patron of def.paths) {
      const coincide = patron.startsWith('*.')
        ? r.endsWith(patron.slice(1)) && !r.includes('/')
        : patron.endsWith('/')
          ? r.startsWith(patron)
          : r === patron;
      // Un patrón `*.md` también vale dentro de carpetas de documentación.
      const coincideMd = patron.startsWith('*.') && r.endsWith(patron.slice(1));
      if ((coincide || coincideMd) && patron.length > mejor.largo) {
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
  };
}

// El veredicto de un conjunto: manda el más restrictivo. Un cambio no es más
// libre que su fichero más delicado.
const ORDEN = ['auto', 'pr', 'human'];
function clasificarCambios(rutas) {
  const detalle = rutas.map(clasificarRuta);
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
  clasificarRuta,
  clasificarCambios,
  destinoDeToken,
  inventarioComponentes,
};
