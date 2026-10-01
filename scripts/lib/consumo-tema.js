/**
 * SYX — Quién lee lo que declara un tema
 * ──────────────────────────────────────
 * Un tema es una lista de declaraciones `--x: valor`. Cada una solo sirve si
 * algo la LEE: una propiedad de un componente (`color: var(--x)`), otro token
 * que a su vez se lee, o una página o un script del sitio. Una declaración que
 * nadie lee no hace nada, y no avisa: en octubre de 2026 example-01 tenía 76
 * de sus 210 declaraciones así, syx-sketch 105 de 564, y la plantilla de temas
 * —de la que sale cada tema nuevo— 17 de 72, entre ellas los dos colores de
 * marca que decía «customize these». example-06 intentaba arreglar un
 * contraste con `--btn-primary-filled-text` y no tenía efecto: el botón no lo
 * leía desde hacía versiones.
 *
 * CÓMO SE MIDE
 * Sobre el CSS COMPILADO del tema (css/styles-theme-<tema>.css), que es lo que
 * llega al navegador: los nombres construidos por interpolación ya están
 * resueltos y no hay que adivinar qué incluye cada bundle.
 *   1. Raíces: cada `var(--x)` dentro de una propiedad normal (no de otro
 *      token), y cada `var(--x)` o `getPropertyValue('--x')` de los HTML de la
 *      raíz y de js/. Lo que el sitio pinta en línea también es un lector.
 *   2. Cierre: si `--a` está vivo y su valor lee `--b`, `--b` está vivo.
 *   3. Lo declarado en scss/themes/<tema>/ que no quede vivo no tiene
 *      consumidor.
 * Un `setProperty('--x', …)` NO cuenta: escribe, no lee.
 *
 * LA EXCEPCIÓN, Y POR QUÉ ES SOLO UNA
 * Los roles semánticos que declara el árbol común (--semantic-* de
 * abstracts/, base/ o themes/_base/) son API pública documentada: están en
 * tokens.json y una aplicación que use SYX los lee en su propio CSS
 * (`a:visited { color: var(--semantic-color-link-visited) }`). Que ningún
 * componente del sistema lea hoy el enlace visitado no hace inútil que el
 * tema lo afine. Esa es la única excepción, y va por regla (prefijo y
 * declarante), no por lista: un --semantic-* que solo inventa un tema
 * (--semantic-color-senary) no es API de nadie. Ni un primitivo, ni un token
 * de componente, ni un alias heredado tienen excepción: un componente que no
 * lee su token es un token muerto, y reescribirlo en un tema no hace nada.
 *
 * Lo usan scripts/check-consumidores.js (todos los temas) y
 * scripts/check-plantilla.js (la plantilla, instanciada en una copia).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { leerDeclaraciones } = require('./scss-tokens');

const lecturas = (valor) => [...String(valor).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)].map((m) => m[1]);

/** Lo que leen las páginas y los scripts del sitio (var() y getPropertyValue). */
function lectoresExternos(root) {
  const ficheros = [];
  for (const f of fs.readdirSync(root)) if (f.endsWith('.html')) ficheros.push(path.join(root, f));
  const js = path.join(root, 'js');
  if (fs.existsSync(js)) for (const f of fs.readdirSync(js)) if (f.endsWith('.js')) ficheros.push(path.join(js, f));
  const vivos = new Set();
  for (const f of ficheros) {
    const t = fs.readFileSync(f, 'utf8');
    for (const x of lecturas(t)) vivos.add(x);
    for (const m of t.matchAll(/getPropertyValue\(\s*['"`](--[A-Za-z0-9_-]+)['"`]/g)) vivos.add(m[1]);
  }
  return vivos;
}

/** Tokens vivos en un CSS compilado, partiendo de `raices` además de las propiedades. */
function vivosEn(css, raices = new Set()) {
  const grafo = new Map();
  const vivos = new Set(raices);
  postcss.parse(css).walkDecls((d) => {
    if (d.prop.startsWith('--')) {
      if (!grafo.has(d.prop)) grafo.set(d.prop, new Set());
      for (const x of lecturas(d.value)) grafo.get(d.prop).add(x);
    } else {
      for (const x of lecturas(d.value)) vivos.add(x);
    }
  });
  const pila = [...vivos];
  while (pila.length) {
    const x = pila.pop();
    for (const y of grafo.get(x) || []) if (!vivos.has(y)) { vivos.add(y); pila.push(y); }
  }
  return vivos;
}

function scssDe(dir, fuera = []) {
  if (!fs.existsSync(dir)) return fuera;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scssDe(p, fuera);
    else if (e.name.endsWith('.scss')) fuera.push(p);
  }
  return fuera;
}

/** Los --semantic-* que declara el árbol común: la API de roles (ver cabecera). */
function semanticosComunes(root) {
  const S = path.join(root, 'scss');
  const out = new Set();
  const fuentes = [...scssDe(path.join(S, 'abstracts')), ...scssDe(path.join(S, 'base')), ...scssDe(path.join(S, 'themes', '_base'))];
  for (const f of fuentes) {
    for (const d of leerDeclaraciones(fs.readFileSync(f, 'utf8'))) if (d.name.startsWith('--semantic-')) out.add(d.name);
  }
  return out;
}

/**
 * Revisa un tema. `dirTema` es su carpeta en scss/themes/ y `css` su hoja
 * compilada. Devuelve cada declaración sin consumidor con fichero y línea, y
 * cuántas se aceptaron por ser API semántica.
 */
function revisarTema({ root, dirTema, css, externos, api }) {
  const semanticos = api || semanticosComunes(root);
  const ext = externos || lectoresExternos(root);
  // Los roles exentos también LEEN: lo que lee un --semantic-* de la API (un
  // primitivo del tema, por ejemplo) está vivo aunque ningún componente lea
  // el rol. Por eso entran como raíces y no solo como excepción. `leidos` es
  // lo que de verdad lee el sistema; la diferencia son las exentas.
  const leidos = vivosEn(css, ext);
  const vivos = vivosEn(css, new Set([...ext, ...semanticos]));
  const sinConsumidor = [];
  const exentas = new Set();
  const declaradas = new Set();
  for (const f of scssDe(dirTema)) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    const vistas = new Set();
    for (const d of leerDeclaraciones(fs.readFileSync(f, 'utf8'))) {
      declaradas.add(d.name);
      if (!leidos.has(d.name) && semanticos.has(d.name)) exentas.add(d.name);
      if (vivos.has(d.name) || vistas.has(d.name)) continue;
      vistas.add(d.name);
      sinConsumidor.push({ token: d.name, file: rel, line: d.line });
    }
  }
  return { declaradas: declaradas.size, sinConsumidor, exentas: [...exentas].sort() };
}

module.exports = { revisarTema, vivosEn, lectoresExternos, semanticosComunes, lecturas };
