#!/usr/bin/env node
/**
 * SYX — Los `usage` del registro son marcado que existe
 * ─────────────────────────────────────────────────────
 * El `usage` de cada componente en component-registry.json es prosa escrita a
 * mano, pero no es prosa cualquiera: docs.html lo pinta tal cual en la
 * referencia de componentes, las pruebas en navegador montan con él su página
 * (axe, foco, reflow, capturas), el servidor MCP se lo da a un agente como el
 * ejemplo canónico, y el agente lo copia. Un `usage` con una clase que el CSS
 * no declara enseña a escribir algo que no pinta; uno con una etiqueta sin
 * cerrar se «arregla» solo en el navegador —que cierra donde puede— y cada
 * consumidor lo arregla distinto.
 *
 * POR QUÉ EXISTE
 * La auditoría de octubre de 2026 (acción 8) inyectó las dos cosas en un
 * `usage` y pasaron toda la cadena: check:registry solo comprueba que la
 * prosa se conserva al regenerar, no lo que dice.
 *
 * QUÉ COMPRUEBA, POR COMPONENTE
 *   1. HTML bien formado, con un analizador estricto y pequeño (no hay
 *      parse5 entre las dependencias, y no hace falta: el `usage` lo escribe
 *      una persona y se le puede exigir lo que un navegador perdona): toda
 *      etiqueta que no es vacía se cierra explícitamente y en orden, ningún
 *      `<` suelto, comillas de atributo equilibradas, ningún atributo
 *      repetido, ningún `<div/>` (en HTML la barra no cierra nada).
 *   2. Clases que existen. El árbitro es el mismo que el del escáner de
 *      desviación (scripts/lib/escaner.js): el CSS compilado, con los
 *      selectores de atributo que alcanzan clases sin nombrarlas. Las clases
 *      con prefijo del sistema (atom-, mol-, org-, syx-) las juzga él; las de
 *      composición (layout-) se comprueban aquí, que el escáner no las mira.
 *   3. Ningún token inexistente en un `style="…"` del ejemplo.
 *
 * Uso: node scripts/check-usage.js   ·   npm run check:usage
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { escanear } = require('./lib/escaner');
const { crearConsulta } = require('./lib/consulta');

const ROOT = path.join(__dirname, '..');
const TEMA = 'syx-sketch';

// ─── 1. HTML bien formado ────────────────────────────────────────────────────

const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
// Su contenido es texto hasta la etiqueta de cierre: un `<` dentro no abre nada.
const TEXTO_CRUDO = new Set(['script', 'style', 'textarea', 'title']);
const ATRIBUTO = /\s+([^\s"'>/=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/y;

/** Errores de forma de un fragmento HTML; vacío si está bien formado. */
function erroresDeForma(html) {
  const errores = [];
  const pila = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;
    if (html.startsWith('<!--', lt)) {
      const fin = html.indexOf('-->', lt + 4);
      if (fin === -1) { errores.push('un comentario <!-- sin cerrar'); break; }
      i = fin + 3;
      continue;
    }
    const cierre = /^<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/.exec(html.slice(lt));
    if (cierre) {
      const nombre = cierre[1].toLowerCase();
      if (VACIOS.has(nombre)) errores.push(`</${nombre}> cierra un elemento vacío, que no se cierra`);
      else if (!pila.length) errores.push(`</${nombre}> no cierra nada`);
      else if (pila[pila.length - 1] !== nombre) {
        errores.push(`</${nombre}> llega con <${pila[pila.length - 1]}> abierto`);
        // Se recupera como el navegador: si está más abajo en la pila, cierra
        // hasta él; si no, se ignora. Así un error no arrastra diez más.
        const k = pila.lastIndexOf(nombre);
        if (k !== -1) pila.length = k;
      } else pila.pop();
      i = lt + cierre[0].length;
      continue;
    }
    const apertura = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(lt));
    if (!apertura) { errores.push(`un «<» suelto (escríbelo &lt;): «${html.slice(lt, lt + 20)}…»`); i = lt + 1; continue; }
    const nombre = apertura[1].toLowerCase();
    let j = lt + apertura[0].length;
    const vistos = new Set();
    for (;;) {
      ATRIBUTO.lastIndex = j;
      const m = ATRIBUTO.exec(html);
      if (!m) break;
      const attr = m[1].toLowerCase();
      if (vistos.has(attr)) errores.push(`<${nombre}> repite el atributo ${attr}`);
      vistos.add(attr);
      j = ATRIBUTO.lastIndex;
    }
    const fin = /^\s*(\/?)>/.exec(html.slice(j));
    if (!fin) {
      errores.push(`<${nombre}> mal formada (¿comillas sin cerrar?): «${html.slice(lt, lt + 40)}…»`);
      i = j + 1;
      continue;
    }
    i = j + fin[0].length;
    if (VACIOS.has(nombre)) continue;
    if (fin[1]) { errores.push(`<${nombre}/>: en HTML la barra no cierra un elemento que no es vacío`); continue; }
    if (TEXTO_CRUDO.has(nombre)) {
      const k = html.toLowerCase().indexOf(`</${nombre}`, i);
      if (k === -1) { errores.push(`<${nombre}> sin cerrar`); break; }
      i = k;
      pila.push(nombre);
      continue;
    }
    pila.push(nombre);
  }
  for (const n of pila.reverse()) errores.push(`<${n}> sin cerrar`);
  return errores;
}

// ─── 2 y 3. Clases y tokens, con el escáner ──────────────────────────────────

function main() {
  const registro = JSON.parse(fs.readFileSync(path.join(ROOT, 'component-registry.json'), 'utf8'));
  const componentes = ['atoms', 'molecules', 'organisms'].flatMap((k) => registro[k]);
  const syx = crearConsulta({ root: ROOT });
  const css = fs.readFileSync(syx.cssPath(TEMA), 'utf8');
  const clasesCss = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));

  // El escáner lee ficheros: cada `usage` va a uno temporal con el nombre
  // del componente, para que cada hallazgo diga de quién es.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-usage-'));
  const fallos = [];
  let vistos = 0;
  try {
    const ficheros = [];
    for (const c of componentes) {
      if (!c.usage) { fallos.push({ c: c.name, que: 'no tiene `usage`' }); continue; }
      vistos++;
      for (const e of erroresDeForma(c.usage)) fallos.push({ c: c.name, que: e });
      for (const m of c.usage.matchAll(/\bclass\s*=\s*"([^"]*)"/g)) {
        for (const clase of m[1].split(/\s+/).filter((x) => /^layout-/.test(x))) {
          if (!clasesCss.has(clase)) fallos.push({ c: c.name, que: `.${clase} no existe en el CSS compilado` });
        }
      }
      const f = path.join(tmp, `${c.name}.html`);
      fs.writeFileSync(f, c.usage);
      ficheros.push(f);
    }
    const informe = escanear({ files: ficheros, syx, theme: TEMA, mode: 'light' });
    const MALOS = new Set(['clase-fantasma', 'modificador-inventado', 'base-sin-estilos', 'token-inexistente']);
    // Un bloque sin estilos propios cuyos elementos (`__`) sí existen es el
    // ancla del bloque, no una clase inventada: `.mol-tabs` no declara nada,
    // pero agrupa `__list`, `__tab` y `__panel`, y es el asidero de
    // js/syx-tabs.js. El escáner ya perdona así a una base con modificadores
    // (`--`); aquí se perdona también con elementos.
    const esAncla = (que) => {
      const clase = (/^\.([a-zA-Z0-9_-]+) /.exec(que) || [])[1];
      return clase && [...clasesCss].some((x) => x.startsWith(`${clase}__`));
    };
    for (const h of informe.hallazgos) {
      if (!MALOS.has(h.tipo)) continue;
      if (h.tipo === 'clase-fantasma' && esAncla(h.que)) continue;
      fallos.push({ c: path.basename(h.file, '.html'), que: `${h.que}${h.sugerencia ? ` — ${h.sugerencia}` : ''}` });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log('\n── LOS USAGE DEL REGISTRO ──────────────────────────────────────\n');
  if (!fallos.length) {
    console.log(`✅ ${vistos} usage: HTML bien formado, todas las clases existen en el CSS compilado.\n`);
    return 0;
  }
  for (const f of fallos) console.log(`❌ ${f.c.padEnd(18)} ${f.que}`);
  console.log(`\n   ${fallos.length} problema(s). El usage es fuente: se corrige en component-registry.json`);
  console.log('   y se conserva al regenerar con `npm run build:registry`.\n');
  return 1;
}

if (require.main === module) process.exit(main());
module.exports = { erroresDeForma };
