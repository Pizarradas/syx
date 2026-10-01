#!/usr/bin/env node
/**
 * SYX — Referencia de componentes generada desde el registro
 * ─────────────────────────────────────────────────────────
 * Escribe en docs.html, entre marcadores, una ficha por cada componente de
 * component-registry.json: descripción, demo en vivo (el `usage` pintado con
 * la hoja del sistema), el marcado para copiar, modificadores, elementos,
 * estados, tokens que consume, accesibilidad y el JS que necesita.
 *
 * POR QUÉ EXISTE
 * Medido en la auditoría de octubre de 2026 (acción 11), adoptando SYX desde
 * cero en un proyecto Vite: docs.html no mencionaba mol-alert, mol-dialog,
 * mol-disclosure ni mol-tabs (tampoco code-snippet ni stat), y para montar una
 * pantalla de ajustes hubo que abrir component-registry.json a mano. La
 * galería escrita a mano enseña bien las variantes, pero se queda atrás cada
 * vez que nace un componente. Esta referencia no puede: sale del registro, y
 * `--check` en la cadena falla si alguien añade un componente sin regenerarla.
 *
 * POR QUÉ UNA SECCIÓN DE docs.html Y NO UNA PÁGINA NUEVA
 * docs.html ya tiene la cabecera, el cajón móvil, el selector de tema y modo y
 * la hoja de la documentación. Una página aparte habría copiado todo eso —y
 * dos copias del mismo armazón se desalinean—. La sección vive entre
 * `<!-- syx:ref:inicio -->` y `<!-- syx:ref:fin -->`, y su índice lateral
 * entre `<!-- syx:ref-nav:inicio -->` y `<!-- syx:ref-nav:fin -->`. Lo de
 * fuera de los marcadores es de quien lo escriba; lo de dentro, de este script.
 *
 * DE DÓNDE SALE CADA COSA
 * · descripción, marcado      `description` y `usage` del registro (prosa)
 * · modificadores, elementos, el resto del registro (generado desde el SCSS)
 *   estados, tokens
 * · accesibilidad             el campo `a11y`, si el registro lo trae; acepta
 *                             texto, lista u objeto, porque aún no tiene forma
 *                             fijada y no debe hacer falta tocar esto cuando la
 *                             tenga
 * · JS necesario              los js/syx-*.js que seleccionan una clase del
 *                             componente, con sus funciones exportadas
 *
 * `--check` comprueba además que README.md nombre cada js/syx-*.js.
 *
 * LA DEMO
 * El `usage` se pinta tal cual con dos retoques que solo afectan a la copia
 * viva, nunca al marcado que se copia: los id se prefijan (`ref-<clase>-`)
 * para que dos fichas no compartan id —el registro repite `email`—, y se
 * quita `autofocus`, que haría saltar la página hasta el diálogo al cargar.
 * El marco usa `contain: layout paint`, que lo convierte en el bloque
 * contenedor de lo fijo y lo absoluto: el cajón del site-header o un
 * <dialog open> quedan dentro de su ficha en vez de tapar la página.
 *
 * Uso:
 *   node scripts/build-docs-componentes.js           regenera docs.html
 *   node scripts/build-docs-componentes.js --check   falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs.html');
const REGISTRO = path.join(ROOT, 'component-registry.json');
const JS_DIR = path.join(ROOT, 'js');

const CAPAS = [
  { key: 'atoms', capa: 'atom', titulo: 'Atoms', icono: 'atom' },
  { key: 'molecules', capa: 'molecule', titulo: 'Molecules', icono: 'package' },
  { key: 'organisms', capa: 'organism', titulo: 'Organisms', icono: 'box' },
];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── Formato legible del marcado que se copia ────────────────────────────────
// El `usage` del registro es una sola línea. Para copiarlo conviene verlo con
// sangría, pero sin cambiar lo que pinta: solo se parte alrededor de elementos
// de bloque cuyo contenido tiene otros bloques; lo que va en línea (un label
// con su input, un botón con su texto) se queda exactamente como estaba,
// porque ahí un salto de línea sí es un espacio visible.

const BLOQUE = new Set(['div', 'nav', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'form', 'dialog', 'details', 'summary', 'header', 'footer', 'article', 'section', 'aside', 'main',
  'fieldset', 'legend', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'dl', 'dt', 'dd']);
const VACIO = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'col', 'wbr']);

function arbol(html) {
  const raiz = { hijos: [] };
  const pila = [raiz];
  for (const trozo of html.split(/(<[^>]+>)/).filter(Boolean)) {
    const cima = pila[pila.length - 1];
    const cierre = trozo.match(/^<\/([a-zA-Z0-9-]+)/);
    const apertura = trozo.match(/^<([a-zA-Z0-9-]+)/);
    if (cierre) {
      const i = pila.map((n) => n.tag).lastIndexOf(cierre[1].toLowerCase());
      if (i > 0) { pila[i].cierre = trozo; pila.length = i; }
      else cima.hijos.push({ texto: trozo });
    } else if (apertura && !trozo.startsWith('<!')) {
      const tag = apertura[1].toLowerCase();
      const nodo = { tag, apertura: trozo, hijos: [], cierre: '' };
      cima.hijos.push(nodo);
      if (!VACIO.has(tag) && !trozo.endsWith('/>') && tag !== 'pre') pila.push(nodo);
      if (tag === 'pre') nodo.crudo = true;
    } else {
      cima.hijos.push({ texto: trozo });
    }
  }
  return raiz.hijos;
}

// `pre` se guarda entero como texto: su contenido no se reformatea nunca.
function enLinea(n) {
  if (n.texto !== undefined) return n.texto;
  return n.apertura + n.hijos.map(enLinea).join('') + n.cierre;
}

function sangrar(nodos, nivel) {
  const pad = '  '.repeat(nivel);
  const lineas = [];
  let enCurso = '';
  const vaciar = () => { if (enCurso.trim()) lineas.push(pad + enCurso); enCurso = ''; };
  for (const n of nodos) {
    const expandible = n.tag && BLOQUE.has(n.tag) && n.hijos.some((h) => h.tag && BLOQUE.has(h.tag));
    if (expandible) {
      vaciar();
      lineas.push(pad + n.apertura, ...sangrar(n.hijos, nivel + 1), pad + n.cierre);
    } else if (n.tag && BLOQUE.has(n.tag)) {
      vaciar();
      lineas.push(pad + enLinea(n));
    } else {
      enCurso += enLinea(n);
    }
  }
  vaciar();
  return lineas;
}

function formatear(html) {
  // `pre` sin hijos parseados: se reconstruye desde el texto original.
  const preservado = [];
  const sinPre = html.replace(/<pre\b[\s\S]*?<\/pre>/g, (m) => { preservado.push(m); return `<pre data-ref-pre="${preservado.length - 1}"></pre>`; });
  return sangrar(arbol(sinPre), 0).join('\n')
    .replace(/<pre data-ref-pre="(\d+)"><\/pre>/g, (_, i) => preservado[+i]);
}

// ─── La copia viva ───────────────────────────────────────────────────────────

const ATRIBUTOS_ID = /\b(id|for|aria-controls|aria-labelledby|aria-describedby|aria-owns|aria-activedescendant|aria-details|aria-errormessage|list|form|popovertarget|commandfor|anchor)="([^"]*)"/g;

function demo(usage, prefijo) {
  const ids = new Set([...usage.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const mapa = (v) => (ids.has(v) ? prefijo + v : v);
  return usage
    .replace(ATRIBUTOS_ID, (_, attr, v) => `${attr}="${v.split(/\s+/).map(mapa).join(' ')}"`)
    .replace(/\bhref="#([^"]+)"/g, (m, v) => (ids.has(v) ? `href="#${prefijo}${v}"` : m))
    .replace(/\s+autofocus(?:="[^"]*")?(?=[\s>/])/g, '');
}

// ─── El JS que necesita cada componente ──────────────────────────────────────
// Se deduce del propio fichero: si js/syx-x.js selecciona `.mol-tabs__list`,
// mol-tabs lo necesita. Así un componente nuevo con su JS aparece solo.

function scriptsDelSistema() {
  if (!fs.existsSync(JS_DIR)) return [];
  return fs.readdirSync(JS_DIR).filter((f) => /^syx-.*\.js$/.test(f)).sort().map((f) => {
    const fuente = fs.readFileSync(path.join(JS_DIR, f), 'utf8');
    const bloques = new Set([...fuente.matchAll(/\.((?:atom|mol|org)-[a-z0-9-]+?)(?=__|--|[^a-z0-9-]|$)/g)].map((m) => m[1]));
    const exporta = [...fuente.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)].map((m) => m[1]);
    return { fichero: `js/${f}`, bloques, exporta, fuente };
  });
}

// ─── Fichas ──────────────────────────────────────────────────────────────────

// Por nombre y capa, no por clase: icon e icon-lucide comparten .atom-icon.
const PREFIJO_CAPA = { atom: 'atom', molecule: 'mol', organism: 'org' };
const anclaDe = (c) => `ref-${PREFIJO_CAPA[c.layer] || c.layer}-${c.name}`;
const nombreLegible = (n) => n.charAt(0).toUpperCase() + n.slice(1).replace(/-/g, ' ');
const codigos = (lista) => lista.map((x) => `<code>${esc(x)}</code>`).join(' ');

function listaOPliegue(lista, etiqueta, max = 12) {
  if (!lista.length) return '<span class="syx-text-gray">—</span>';
  if (lista.length <= max) return codigos(lista);
  return `<details class="mol-disclosure"><summary class="mol-disclosure__summary">${lista.length} ${etiqueta}</summary>` +
    `<div class="mol-disclosure__content">${codigos(lista)}</div></details>`;
}

function a11yHtml(a11y) {
  if (a11y === undefined || a11y === null || a11y === '') return null;
  if (typeof a11y === 'string') return esc(a11y);
  if (Array.isArray(a11y)) {
    return `<ul class="atom-list">${a11y.map((x) => `<li class="atom-list__item">${typeof x === 'string' ? esc(x) : esc(JSON.stringify(x))}</li>`).join('')}</ul>`;
  }
  return `<ul class="atom-list">${Object.entries(a11y).map(([k, v]) =>
    `<li class="atom-list__item"><strong>${esc(k)}</strong>: ${esc(Array.isArray(v) ? v.join(' · ') : typeof v === 'object' ? JSON.stringify(v) : v)}</li>`).join('')}</ul>`;
}

function jsHtml(scripts) {
  if (!scripts.length) return '<span class="syx-text-gray">None — CSS only.</span>';
  return scripts.map((s) => {
    const paquete = `syx-design-system/${s.fichero}`;
    const lineas = [`import '${paquete}';`];
    if (s.exporta.length) {
      lineas.push(`// markup rendered later:`, `import { ${s.exporta.join(', ')} } from '${paquete}';`, `${s.exporta[0]}(container);`);
    }
    return `<code>${esc(s.fichero)}</code><pre class="atom-code syx-mt-2 syx-mb-0" tabindex="0" role="group" aria-label="${esc(`Import ${s.fichero}`)}"><code>${esc(lineas.join('\n'))}</code></pre>`;
  }).join('');
}

function ficha(c, scripts) {
  const clase = c.classes[0] || c.name;
  const ancla = anclaDe(c);
  const [, alcance, descripcion] = (c.description || '').match(/^\[scope:\s*([^\]]+)\]\s*([\s\S]*)$/) || [null, null, c.description || ''];
  const susScripts = scripts.filter((s) => c.classes.some((k) => s.bloques.has(k)));
  const filas = [
    ['Classes', codigos(c.classes)],
    ['Modifiers', listaOPliegue(c.modifiers, 'modifiers')],
    ['Elements', listaOPliegue(c.elements, 'elements')],
    ['States', listaOPliegue(c.states, 'states')],
  ];
  if (c.composedOf && c.composedOf.length) filas.push(['Composes', codigos(c.composedOf)]);
  filas.push(['Tokens', listaOPliegue(c.tokens, 'component tokens', 0)]);
  const a11y = a11yHtml(c.a11y);
  if (a11y) filas.push(['Accessibility', a11y]);
  filas.push(['JavaScript', jsHtml(susScripts)]);

  const partes = [
    `<section class="docs-ref syx-mb-5" id="${ancla}" aria-labelledby="${ancla}-titulo">`,
    `  <h4 class="atom-title atom-title--h5 syx-mb-2" id="${ancla}-titulo">${esc(nombreLegible(c.name))} <code>.${esc(clase)}</code></h4>`,
    `  <p class="mol-label-group syx-mb-2"><span class="atom-pill atom-pill--neutral">${esc(c.layer)}</span>` +
      (alcance ? `<span class="atom-pill atom-pill--subtle">${esc(alcance.trim())}</span>` : '') +
      `<code>${esc(c.file)}</code></p>`,
    `  <p class="atom-txt syx-mb-3">${esc(descripcion.trim())}</p>`,
  ];
  if (c.usage) {
    partes.push(
      `  <p class="syx-type-overline syx-text-gray syx-mb-2">Live demo</p>`,
      `  <div class="docs-ref__demo syx-mb-3">${demo(c.usage, `${ancla}-`)}</div>`,
      `  <div class="docs-ref__markup syx-mb-3">`,
      `    <p class="syx-type-overline syx-text-gray syx-mb-2">Markup</p>`,
      `    <button type="button" class="atom-btn atom-btn--tertiary atom-btn--size-sm docs-ref__copy" data-ref-copiar="${ancla}-marcado">Copy</button>`,
      // Con scroll a lo ancho en cuanto la ventana se estrecha: tabindex y
      // nombre para que se pueda desplazar con el teclado (WCAG 2.1.1; axe,
      // scrollable-region-focusable). (Auditoría 2026-10 · acción 8)
      `    <pre class="atom-code syx-mb-0" id="${ancla}-marcado" tabindex="0" role="group" aria-label="${esc(c.name)} markup"><code>${esc(formatear(c.usage))}</code></pre>`,
      `  </div>`,
    );
  } else {
    partes.push(`  <p class="atom-txt syx-text-gray syx-mb-3">No <code>usage</code> in the registry yet: there is nothing to demo.</p>`);
  }
  partes.push(
    `  <div class="atom-table__container syx-mb-0">`,
    `    <table class="atom-table docs-ref__api">`,
    `      <tbody>`,
    ...filas.map(([k, v]) => `        <tr><th class="atom-table__th" scope="row">${k}</th><td class="atom-table__td">${v}</td></tr>`),
    `      </tbody>`,
    `    </table>`,
    `  </div>`,
    `</section>`,
  );
  return partes;
}

// ─── Las dos regiones ────────────────────────────────────────────────────────

function generar(registro) {
  const scripts = scriptsDelSistema();
  const porCapa = CAPAS.map((k) => ({ ...k, comps: registro[k.key] || [] }));
  const total = porCapa.reduce((n, k) => n + k.comps.length, 0);
  const recuento = porCapa.map((k) => `${k.comps.length} ${k.comps.length === 1 ? k.titulo.toLowerCase().replace(/s$/, '') : k.titulo.toLowerCase()}`).join(', ');
  const usados = scripts.filter((s) => porCapa.some((k) => k.comps.some((c) => c.classes.some((x) => s.bloques.has(x)))));

  const nav = [
    `<div class="docs-sidebar__group">`,
    `  <span class="docs-sidebar__group-label">Components</span>`,
    `  <a href="#components" class="docs-sidebar__link" data-nav-section="components">`,
    `    <span class="atom-icon atom-icon--lc-book-open atom-icon--sm" aria-hidden="true"></span>`,
    `    Component reference`,
    `  </a>`,
    `  <div class="docs-sidebar__sub">`,
    ...porCapa.flatMap((k) => k.comps.map((c) =>
      `    <a href="#${anclaDe(c)}" class="docs-sidebar__link" data-nav-section="${anclaDe(c)}">${esc(nombreLegible(c.name))}</a>`)),
    `  </div>`,
    `</div>`,
  ];

  const cuerpo = [
    `<section id="components" aria-labelledby="components-heading" class="syx-mb-5">`,
    `  <div class="docs-section-divider" aria-hidden="true">`,
    `    <span class="docs-section-divider__badge docs-section-divider__badge--guide">`,
    `      <span class="atom-icon atom-icon--lc-book-open atom-icon--sm" aria-hidden="true"></span>`,
    `      Reference`,
    `    </span>`,
    `    <span class="docs-section-divider__line"></span>`,
    `    <span class="docs-section-divider__layer">component-registry.json</span>`,
    `  </div>`,
    `  <h2 class="atom-title atom-title--h2 syx-mb-1" id="components-heading">Component reference</h2>`,
    `  <p class="atom-txt syx-text-gray syx-mb-4">Every component in <code>component-registry.json</code> &mdash; ${total} components: ${recuento}. ` +
      `Generated by <code>scripts/build-docs-componentes.js</code>; the markup is the registry&rsquo;s <code>usage</code>, rendered live with the theme picked above. ` +
      `Install and theme: README &rarr; Quick Start.</p>`,
    ...porCapa.flatMap((k) => (k.comps.length ? [
      `  <h3 class="atom-title atom-title--h3 syx-mb-3" id="components-${k.key}">${k.titulo} <span class="syx-text-gray">&middot; ${k.comps.length}</span></h3>`,
      ...k.comps.flatMap((c) => ficha(c, scripts).map((l) => '  ' + l)),
    ] : [])),
    `</section>`,
    // En línea y no con src: docs.html se abre también desde file://, y ahí
    // Chromium bloquea por CORS cualquier <script type="module" src>. Es una
    // copia generada: `--check` falla si el fichero de js/ cambia sin regenerar.
    ...usados.flatMap((s) => [
      `<script type="module">`,
      `/* ${s.fichero} — copia literal; la fuente es ese fichero */`,
      ...s.fuente.replace(/<\/script/gi, '<\\/script').trimEnd().split('\n'),
      `</script>`,
    ]),
    `<script>`,
    `  // Copiar el marcado de una ficha. Sin portapapeles (file://, permisos), selecciona el texto.`,
    `  document.addEventListener('click', function (e) {`,
    `    var b = e.target.closest('[data-ref-copiar]');`,
    `    if (!b) return;`,
    `    var pre = document.getElementById(b.getAttribute('data-ref-copiar'));`,
    `    var listo = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); };`,
    `    var seleccionar = function () { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };`,
    `    if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(listo, seleccionar); else seleccionar();`,
    `  });`,
    `</script>`,
  ];
  return { nav, cuerpo, total };
}

function sustituir(html, marca, lineas) {
  const re = new RegExp(`([ \\t]*)<!-- syx:${marca}:inicio[^>]*-->[\\s\\S]*?<!-- syx:${marca}:fin -->`);
  const m = html.match(re);
  if (!m) throw new Error(`docs.html no tiene los marcadores <!-- syx:${marca}:inicio --> … <!-- syx:${marca}:fin -->`);
  const pad = m[1];
  const bloque = [
    `${pad}<!-- syx:${marca}:inicio · generado por scripts/build-docs-componentes.js desde component-registry.json — no editar a mano -->`,
    ...lineas.map((l) => (l ? pad + l : l)),
    `${pad}<!-- syx:${marca}:fin -->`,
  ].join('\n');
  return html.replace(re, () => bloque);
}

function main() {
  const check = process.argv.includes('--check');
  const registro = JSON.parse(fs.readFileSync(REGISTRO, 'utf8'));
  const actual = fs.readFileSync(DOCS, 'utf8');
  const { nav, cuerpo, total } = generar(registro);
  const nuevo = sustituir(sustituir(actual, 'ref-nav', nav), 'ref', cuerpo);

  // El README es por donde entra quien adopta SYX: un js/syx-*.js que no
  // nombra es un comportamiento que nadie sabrá importar (así pasó con
  // initTabs). La tabla de su Quick Start → JavaScript se escribe a mano;
  // esto solo impide que le falte una fila.
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const sinDocumentar = scriptsDelSistema().filter((s) => !readme.includes(s.fichero)).map((s) => s.fichero);

  if (check) {
    if (sinDocumentar.length) {
      console.error(`❌ README.md no nombra ${sinDocumentar.join(', ')}: añádelo a la tabla de Quick Start → JavaScript.`);
      process.exit(1);
    }
    if (nuevo !== actual) {
      console.error('❌ La referencia de componentes de docs.html no corresponde a component-registry.json.');
      console.error('   Regenera con: npm run build:docs-componentes');
      process.exit(1);
    }
    console.log(`✅ Referencia de componentes al día · ${total} componentes en docs.html`);
    return;
  }
  if (nuevo !== actual) fs.writeFileSync(DOCS, nuevo);
  console.log(`✅ docs.html · referencia de ${total} componentes ${nuevo !== actual ? 'regenerada' : 'ya al día'}`);
}

try { main(); } catch (e) { console.error(`❌ ${e.message}`); process.exit(1); }
