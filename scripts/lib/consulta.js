/**
 * SYX — Capa de consulta
 * ──────────────────────
 * Las seis preguntas que se le pueden hacer al sistema de diseño: qué temas hay,
 * cuánto vale un token, qué token vale esto, qué componentes existen, cómo es
 * uno, y si este SCSS cumple el contrato.
 *
 * POR QUÉ ESTÁ AQUÍ Y NO EN EL SERVIDOR MCP
 * Porque tiene tres consumidores y no uno:
 *   · scripts/mcp-server.js  — las envuelve en herramientas MCP para un agente
 *   · index.js               — las expone como API de Node al instalar el paquete
 *   · scripts/check-*.js     — las usa para verificarse a sí mismo
 *
 * Y porque la alternativa era duplicarlas. Ese ha sido el error más repetido de
 * las últimas versiones: dos copias del mismo criterio acaban divergiendo, y
 * entonces el sistema responde una cosa al agente y otra a la aplicación.
 *
 * `crearConsulta({ root })` recibe la raíz porque el paquete instalado vive en
 * node_modules y el repositorio no; nada aquí supone dónde está.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseBlocks, declaredFor, cadenaDeAlias, canonico } = require('./css-tokens');
const { revisar, tokensInexistentes, DESCRIPCIONES } = require('./rules');
const { clasificarCambios, destinoDeToken, contrato } = require('./confianza');
const { leer: leerMixins, recambioPara } = require('./mixins');
const { escanear, distancia } = require('./escaner');

function crearConsulta({ root } = {}) {
  const ROOT = root || path.join(__dirname, '..', '..');
  const F = {
    snap: path.join(ROOT, 'contracts', 'resolved-tokens.json'),
    registro: path.join(ROOT, 'component-registry.json'),
    tokens: path.join(ROOT, 'tokens.json'),
    pkg: path.join(ROOT, 'package.json'),
  };

  // Carga perezosa: quien solo quiera `cssPath()` no debería pagar 570 KB de
  // JSON por ello.
  let snap = null;
  let registro = null;
  let conocidos = null;
  let mixins = null;
  const declaracionesCache = new Map();
  const invCache = new Map();

  function cargar() {
    if (snap) return;
    if (!fs.existsSync(F.snap)) {
      throw new Error(`Falta ${path.relative(ROOT, F.snap)}. En el repositorio: npm run build:tokens`);
    }
    if (!fs.existsSync(F.registro)) {
      throw new Error(`Falta ${path.relative(ROOT, F.registro)}. En el repositorio: npm run build:registry`);
    }
    snap = JSON.parse(fs.readFileSync(F.snap, 'utf8'));
    registro = JSON.parse(fs.readFileSync(F.registro, 'utf8'));
    const t = JSON.parse(fs.readFileSync(F.tokens, 'utf8'));
    conocidos = new Set();
    for (const [k, v] of Object.entries(t)) {
      if (k === '_meta' || typeof v !== 'object') continue;
      for (const nombre of Object.keys(v)) conocidos.add(nombre);
    }
  }

  // Los mixins solo existen en el SCSS: un mixin no deja rastro reconocible en
  // el CSS compilado, se disuelve en las declaraciones que genera. Se leen de la
  // fuente, una vez.
  const losMixins = () => (mixins = mixins || leerMixins(ROOT));

  const componentes = () => {
    cargar();
    return ['atoms', 'molecules', 'organisms'].flatMap((g) => registro[g] || []);
  };

  function efectivo(tema, modo) {
    cargar();
    const t = snap.themes[tema];
    if (!t) throw new Error(`Tema desconocido: ${tema}. Disponibles: ${snap._meta.themes.join(', ')}`);
    return { ...snap.base, ...t.light, ...(modo === 'dark' ? t.dark : {}) };
  }

  const resolverAsset = (v) =>
    typeof v === 'string' && v.startsWith('@asset/') ? snap.assets[v.slice(7)] : v;

  // La cadena de alias es la única consulta que necesita el CSS compilado, así
  // que solo se analiza el tema que alguien pregunte, y una sola vez.
  function declaracionesDe(tema, modo) {
    const clave = `${tema}/${modo}`;
    if (declaracionesCache.has(clave)) return declaracionesCache.get(clave);
    const f = cssPath(tema);
    if (!fs.existsSync(f)) return null;
    const d = declaredFor(parseBlocks(fs.readFileSync(f, 'utf8')), modo);
    declaracionesCache.set(clave, d);
    return d;
  }

  // El índice inverso NO se versiona a propósito: se deriva del snapshot en una
  // pasada y guardarlo duplicaba el fichero. Se construye al vuelo.
  function indiceInverso(tema, modo) {
    const clave = `${tema}/${modo}`;
    if (invCache.has(clave)) return invCache.get(clave);
    const inv = new Map();
    for (const [k, v] of Object.entries(efectivo(tema, modo))) {
      const val = canonico(resolverAsset(v) || '');
      if (!val) continue;
      if (!inv.has(val)) inv.set(val, []);
      inv.get(val).push(k);
    }
    invCache.set(clave, inv);
    return inv;
  }

  // ─── Rutas ─────────────────────────────────────────────────────────────────
  // Un consumidor no debería construir a mano `styles-theme-<x>.css`: si mañana
  // cambia el patrón, cambia aquí y en ningún otro sitio.
  const cssPath = (tema = 'syx-sketch') => path.join(ROOT, 'css', `styles-theme-${tema}.css`);
  const scssPath = (tema = 'syx-sketch') => path.join(ROOT, 'scss', `styles-theme-${tema}.scss`);

  // ─── Las seis consultas ────────────────────────────────────────────────────

  const listThemes = () => {
    cargar();
    return {
      themes: snap._meta.themes,
      modes: snap._meta.modes,
      default: 'syx-sketch',
      tokensPorTema:
        Object.keys(snap.base).length +
        Object.keys(snap.themes[snap._meta.themes[0]].light).length,
    };
  };

  function getToken({ token, theme = 'syx-sketch', mode = 'light' }) {
    const mapa = efectivo(theme, mode);
    if (!(token in mapa)) {
      const raiz = token.replace(/^--/, '').split('-')[0];
      return {
        encontrado: false,
        token,
        sugerencias: Object.keys(mapa).filter((k) => k.includes(raiz)).slice(0, 8),
      };
    }
    const roto = snap.themes[theme].unresolved;
    const porQueVacio = (roto[mode] || roto)[token];
    const decl = declaracionesDe(theme, mode);
    return {
      encontrado: true,
      token,
      theme,
      mode,
      value: resolverAsset(mapa[token]),
      esExpresion: snap.themes[theme].expressions.includes(token),
      sinValor: porQueVacio || null,
      cadena: decl ? cadenaDeAlias(decl, token) : null,
    };
  }

  function findTokenByValue({ value, theme = 'syx-sketch', mode = 'light' }) {
    const inv = indiceInverso(theme, mode);
    const buscado = canonico(value);
    const exactos = inv.get(buscado) || [];
    // Sin coincidencia exacta se ofrecen los que CONTIENEN el texto, que es lo
    // que hace útil buscar "266.24" o "blue" sin saber la sintaxis exacta.
    const parciales = exactos.length
      ? []
      : [...inv.entries()]
          .filter(([v]) => v.includes(buscado))
          .slice(0, 10)
          .map(([v, ks]) => ({ value: v, tokens: ks }));
    return { value: buscado, theme, mode, exactos, parciales };
  }

  const listComponents = ({ layer } = {}) => ({
    total: componentes().length,
    components: componentes()
      .filter((c) => !layer || c.layer === layer)
      .map((c) => ({ name: c.name, layer: c.layer, classes: c.classes, file: c.file })),
  });

  function getComponent({ name }) {
    const c = componentes().find(
      (x) => x.name === name || x.classes.includes(name) || x.classes.includes(name.replace(/^\./, ''))
    );
    if (!c) {
      return {
        encontrado: false,
        name,
        sugerencias: componentes()
          .map((x) => x.name)
          .filter((n) => n.includes(name) || name.includes(n))
          .slice(0, 8),
      };
    }
    return { encontrado: true, ...c };
  }

  const listMixins = ({ file } = {}) => {
    const todos = losMixins();
    return {
      total: todos.length,
      // El recuento de usos va delante a propósito: separa un mixin central de
      // uno que no llama nadie, y eso no está escrito en ninguna parte.
      mixins: todos
        .filter((m) => !file || m.file.includes(file))
        .map((m) => ({ name: m.name, signature: m.signature, uses: m.uses, file: m.file, emits: m.emits })),
    };
  };

  function getMixin({ name }) {
    const todos = losMixins();
    const m = todos.find((x) => x.name === name || x.name === String(name).replace(/^@include\s+/, ''));
    if (!m) {
      return {
        encontrado: false,
        name,
        // Por parecido y no solo por subcadena: quien pregunta por un mixin que
        // no existe suele haberlo escrito casi bien —«transicion» por
        // «transition»—, y ahí una coincidencia de subcadena no encuentra nada.
        sugerencias: todos
          .map((x) => ({ n: x.name, d: x.name.includes(name) || name.includes(x.name) ? 0 : distancia(name, x.name) }))
          .filter((x) => x.d <= 4)
          .sort((a, b) => a.d - b.d)
          .slice(0, 6)
          .map((x) => x.n),
      };
    }
    return {
      encontrado: true,
      ...m,
      // Quién delega en él y en quién delega: es lo que dice si hay una forma
      // más corta de escribir lo mismo.
      alias: todos.filter((x) => x.calls.includes(m.name)).map((x) => x.name),
    };
  }

  function validateSnippet({ code, path: rel = 'scss/atoms/_nuevo.scss' }) {
    cargar();
    const v = revisar(rel, code);
    const fuera = tokensInexistentes(code, conocidos);
    const rotos = fuera.filter((t) => !t.conFallback);
    const total = Object.values(v).reduce((a, x) => a + x.length, 0);
    return {
      path: rel,
      conforme: total === 0 && rotos.length === 0,
      violaciones: Object.fromEntries(
        Object.entries(v)
          .filter(([, x]) => x.length)
          .map(([k, x]) => {
            // R03 y R04 prohíben una propiedad en crudo. Decir cuál es el
            // recambio es la mitad que faltaba: un contrato que prohíbe sin
            // ofrecer alternativa consultable obliga a adivinar, y adivinar es
            // de donde salen los nombres inventados.
            const propiedad = { R03: 'transition', R04: 'position' }[k];
            const recambio = propiedad ? recambioPara(propiedad, losMixins()) : null;
            return [k, { regla: DESCRIPCIONES[k], casos: x, ...(recambio ? { recambio } : {}) }];
          })
      ),
      tokensInexistentes: fuera,
      nota: rotos.length
        ? 'Los tokens sin fallback y sin declarar dejan la propiedad sin valor.'
        : undefined,
    };
  }

  /**
   * Qué nivel de confianza tiene un cambio y, si se pregunta por un token,
   * dónde iría.
   *
   * Va aquí y no solo en la herramienta MCP porque la respuesta debe ser la
   * misma la pregunte quien la pregunte: el agente antes de escribir, el script
   * de propuesta al escribir, y la aplicación que audite después.
   */
  function classifyChange({ paths = [], token } = {}) {
    const salida = { contrato: contrato()._meta };
    if (paths.length) salida.cambio = clasificarCambios(paths);
    if (token) {
      salida.token = token;
      salida.destino = destinoDeToken(token);
      if (salida.destino.resuelto) {
        salida.nivelDelDestino = clasificarCambios([salida.destino.fichero]);
      }
    }
    if (!paths.length && !token) salida.niveles = contrato().tiers;
    return salida;
  }

  /**
   * Escanea ficheros de una aplicación consumidora y devuelve la desviación.
   * `escaner.js` recibe esta misma capa como argumento: compara contra la
   * versión de SYX desde la que se llama, que es la única comparación que
   * significa algo.
   */
  const scan = ({ files = [], theme = 'syx-sketch', mode = 'light' } = {}) =>
    escanear({ files, syx: api, theme, mode });

  const api = {
    root: ROOT,
    get version() {
      return JSON.parse(fs.readFileSync(F.pkg, 'utf8')).version;
    },
    cssPath,
    scssPath,
    listThemes,
    getToken,
    findTokenByValue,
    listComponents,
    getComponent,
    validateSnippet,
    classifyChange,
    scan,
    listMixins,
    getMixin,
  };

  return api;
}

module.exports = { crearConsulta };
