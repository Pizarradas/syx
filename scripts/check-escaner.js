#!/usr/bin/env node
/**
 * SYX — Prueba del escáner de desviación
 * ──────────────────────────────────────
 * Dos mitades, y la segunda es la que decide si el escáner sirve:
 *
 *   1. Que ENCUENTRA lo que hay: un fallback caducado, un token inventado, un
 *      color a pelo que ya es token, un modificador que no pinta.
 *   2. Que NO encuentra lo que no hay. Un escáner con falsos positivos se
 *      ignora entero a la tercera ejecución, y entonces da igual lo bien que
 *      detecte. El caso que importa es la documentación: una página que ENSEÑA
 *      un `#6d28d9` dentro de un <pre> no está usando un color a pelo, está
 *      explicándolo.
 *
 * Se usa un fichero de mentira con la respuesta conocida, y además la página
 * real: docs.html, que es la aplicación consumidora que ya tenemos.
 *
 * Uso: node scripts/check-escaner.js   ·   npm run check:escaner
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { escanear } = require('./lib/escaner');
const { crearConsulta } = require('./lib/consulta');

const ROOT = path.join(__dirname, '..');
const syx = crearConsulta({ root: ROOT });

// ─── El fichero de mentira, con la respuesta escrita al lado ─────────────────

const MUESTRA = `<!doctype html>
<html><head>
<style>
  .caja {
    /* 1 · fallback caducado: el sistema ya no dice ese morado */
    color: var(--semantic-color-primary, #6d28d9);
    /* 2 · token que no existe: el fallback se pinta SIEMPRE */
    border-color: var(--semantic-color-inventado, #123456);
    /* 3 · valor a pelo que ya es token */
    background: oklch(0.498 0.282 266.24);
    /* 4 · contrato roto en el consumidor */
    padding: 1rem !important;
    /* 5 · fallback que SÍ coincide: no debe salir */
    outline-color: var(--semantic-color-primary, oklch(0.498 0.282 266.24));
    /* 13 · var() SIN fallback de un token que no existe: el peor caso */
    box-shadow: var(--semantic-shadow-que-no-existe);
    /* 14 · var() sin fallback de uno que SÍ existe: no debe salir */
    border-radius: var(--semantic-border-radius-sm);
  }
  /* 6 · color propio de la aplicación, que no es de nadie: no debe salir */
  .marca { color: #ff00ff; }
</style>
</head><body class="syx syx--theme-syx-sketch">
  <!-- 7 · clases buenas: no deben salir -->
  <button class="atom-btn atom-btn--primary atom-btn--filled">Vale</button>
  <!-- 8 · modificador inventado sobre una base real -->
  <span class="atom-icon atom-icon--lc-inventadisimo"></span>
  <!-- 9 · clase con pinta de SYX que no existe -->
  <p class="atom-txtx">Hola</p>
  <!-- 11 · la alcanza [class*=__item], aunque no exista como .clase: no debe salir -->
  <ul class="atom-list atom-list--primary"><li class="atom-list__item">Uno</li></ul>
  <!-- 12 · base sin estilos cuyos modificadores sí existen: aviso suave, no error -->
  <p class="atom-txt atom-txt--primary">Cuerpo</p>
  <!-- 10 · lo mismo pero DENTRO de un ejemplo: nada de esto debe salir -->
  <pre><code>&lt;p class="atom-otro-inventado"&gt;
  color: var(--semantic-color-primary, #6d28d9);
  background: oklch(0.498 0.282 266.24);
  margin: 0 !important;
&lt;/p&gt;</code></pre>
  <script>document.body.className = 'syx syx--theme-' + tema;</script>
</body></html>
`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'syx-escaner-'));
const muestra = path.join(tmp, 'muestra.html');
fs.writeFileSync(muestra, MUESTRA);

const casos = [];
const comprobar = (nombre, fn) => casos.push({ nombre, fn });

console.log('\n── ESCÁNER DE DESVIACIÓN ───────────────────────────────────────\n');

const informe = escanear({ files: [muestra], syx });
const de = (tipo) => informe.hallazgos.filter((h) => h.tipo === tipo);
const uno = (tipo, trozo) => {
  const h = de(tipo).find((x) => JSON.stringify(x).includes(trozo));
  if (!h) throw new Error(`no encontró ${tipo} con «${trozo}»\n     encontró: ${de(tipo).map((x) => x.que).join(' | ') || 'nada de ese tipo'}`);
  return h;
};

// ─── Lo que tiene que encontrar ──────────────────────────────────────────────

comprobar('el fallback caducado, con los dos valores enfrentados', () => {
  const h = uno('fallback-desviado', '--semantic-color-primary');
  if (!h.detalle.includes('#6d28d9')) throw new Error('no dice lo que pinta la aplicación');
  if (!h.detalle.includes('oklch')) throw new Error('no dice lo que dice el sistema');
  if (h.gravedad !== 'alta') throw new Error(`gravedad ${h.gravedad}: un color desviado es lo más caro de todo`);
});

comprobar('el token que no existe, y que por tanto se pinta siempre', () => {
  const h = uno('token-inexistente', '--semantic-color-inventado');
  if (!h.detalle.includes('#123456')) throw new Error('no dice qué se está pintando de verdad');
});

comprobar('el var() sin fallback de un token inexistente, como grave', () => {
  // Es el caso más caro de todos: con fallback algo se pinta; sin él, la
  // propiedad se queda sin valor y el elemento desaparece sin avisar. El
  // escáner no lo miraba, y por eso una barra de why-syx.html llevaba meses
  // invisible citando un --primitive-color-orange-500 que no existe.
  const h = uno('token-inexistente', '--semantic-shadow-que-no-existe');
  if (h.gravedad !== 'alta') throw new Error(`gravedad ${h.gravedad}`);
  if (!/sin fallback/.test(h.que)) throw new Error('no dice que va sin fallback');
});

comprobar('no señala un var() sin fallback de un token que sí existe', () => {
  if (JSON.stringify(informe.hallazgos).includes('--semantic-border-radius-sm')) {
    throw new Error('denuncia un token que existe');
  }
});

comprobar('el color a pelo, nombrando el token que ya lo tiene', () => {
  const h = uno('valor-a-pelo', 'oklch(0.498 0.282 266.24)');
  if (!h.sugerencia.includes('--semantic-')) throw new Error(`sugiere ${h.sugerencia}, y debe ser un semántico`);
});

comprobar('el !important del consumidor', () => {
  uno('contrato', '!important');
});

comprobar('el modificador que no pinta nada', () => {
  const h = uno('modificador-inventado', 'lc-inventadisimo');
  if (!h.detalle.includes('atom-icon')) throw new Error('no dice que la base sí existe');
});

comprobar('la clase con pinta de SYX que no existe, con la real al lado', () => {
  const h = uno('clase-fantasma', 'atom-txtx');
  if (!h.sugerencia) throw new Error('no sugiere ninguna parecida');
});

comprobar('no denuncia una clase que pinta por selector de atributo', () => {
  // `.atom-list--primary [class*=__item]` alcanza a `.atom-list__item` sin que
  // ese nombre exista como selector de clase. Borrarla del marcado —que es lo
  // que habría hecho quien leyera el informe— deja la lista sin iconos.
  if (JSON.stringify(informe.hallazgos).includes('atom-list__item')) {
    throw new Error('la denuncia, y el CSS sí la alcanza por [class*=__item]');
  }
});

comprobar('una base sin estilos con modificadores reales es aviso, no error', () => {
  const h = uno('base-sin-estilos', 'atom-txt');
  if (h.gravedad !== 'baja') throw new Error(`gravedad ${h.gravedad}: la familia existe, solo falta la base`);
  if (!h.detalle.includes('atom-txt--primary')) throw new Error('no enseña el modificador que sí existe');
  if (informe.hallazgos.some((x) => x.tipo === 'clase-fantasma' && x.que.includes('.atom-txt '))) {
    throw new Error('además la cuenta como clase inventada');
  }
});

comprobar('distingue un asidero de JavaScript de una clase muerta', () => {
  const h = uno('gancho-js', 'syx--theme-syx-sketch');
  if (h.gravedad !== 'baja') throw new Error('un asidero no es un error grave');
});

// ─── Lo que NO tiene que encontrar ───────────────────────────────────────────

comprobar('no señala un fallback que coincide con el sistema', () => {
  const falsos = de('fallback-desviado').filter((h) => h.detalle.includes('outline') || h.linea === 16);
  if (falsos.length) throw new Error(`señaló ${falsos.length} fallback(s) correctos`);
  if (de('fallback-desviado').length !== 1) {
    throw new Error(`${de('fallback-desviado').length} fallbacks desviados, esperaba 1`);
  }
});

comprobar('no señala un color que es de la aplicación y de nadie más', () => {
  if (JSON.stringify(informe.hallazgos).includes('ff00ff')) throw new Error('#ff00ff no es de SYX: opinar sobre él es ruido');
});

comprobar('no señala las clases correctas', () => {
  for (const buena of ['atom-btn--primary', 'atom-btn--filled']) {
    if (informe.hallazgos.some((h) => h.que.includes(`.${buena} `))) throw new Error(`señaló ${buena}, que existe`);
  }
});

comprobar('NO señala nada de lo que hay dentro de un <pre> de ejemplo', () => {
  const dentro = informe.hallazgos.filter((h) => h.linea >= 38);
  if (dentro.length) {
    throw new Error(`${dentro.length} hallazgo(s) en el ejemplo de código:\n     ${dentro.map((h) => `L${h.linea} ${h.que}`).join('\n     ')}`);
  }
  if (JSON.stringify(informe.hallazgos).includes('atom-otro-inventado')) {
    throw new Error('leyó una clase de dentro de un ejemplo');
  }
});

// ─── Y sobre la aplicación consumidora de verdad ─────────────────────────────

comprobar('sobre las páginas reales no denuncia nada que sí exista', () => {
  // No se comprueba CUÁNTA desviación encuentra: esa cifra baja según se
  // arregla, y una prueba que exigiera un mínimo castigaría el progreso. Lo que
  // se comprueba es la mitad falsable — que cada clase denunciada esté de
  // verdad ausente del CSS, como selector de clase Y como selector de atributo.
  // Si una sola apareciera, el escáner miente y lo demás deja de valer.
  const paginas = ['home.html', 'docs.html', 'why-syx.html', 'theme-builder.html']
    .map((f) => path.join(ROOT, f))
    .filter((f) => fs.existsSync(f));
  const r = escanear({ files: paginas, syx });
  const css = fs.readFileSync(syx.cssPath('syx-sketch'), 'utf8');
  const atributos = [...css.matchAll(/\[class([*^$~|]?)=["']?([^"'\]]+)["']?\]/g)];

  for (const h of r.hallazgos.filter((x) => x.tipo === 'clase-fantasma' || x.tipo === 'modificador-inventado')) {
    const clase = h.que.match(/\.([a-zA-Z0-9_-]+)/)[1];
    if (new RegExp(`\\.${clase}(?![a-zA-Z0-9_-])`).test(css)) {
      throw new Error(`denuncia .${clase} y sí está en el CSS compilado`);
    }
    for (const [, op, v] of atributos) {
      const alcanza = op === '*' ? clase.includes(v) : op === '^' ? clase.startsWith(v) : op === '$' ? clase.endsWith(v) : clase === v;
      if (alcanza) throw new Error(`denuncia .${clase} y la alcanza [class${op}=${v}]`);
    }
  }
  if (!r.hallazgos.length && !paginas.length) throw new Error('no ha leído ninguna página');
});

comprobar('sobre home.html no inventa desviación donde no la hay', () => {
  const r = escanear({ files: [path.join(ROOT, 'home.html')], syx });
  const graves = r.hallazgos.filter((h) => h.gravedad === 'alta');
  if (graves.length) {
    throw new Error(`${graves.length} hallazgo(s) grave(s) en una página que se repasó entera:\n     ${graves.slice(0, 5).map((h) => `L${h.linea} ${h.que}`).join('\n     ')}`);
  }
});

(async () => {
  let fallos = 0;
  for (const c of casos) {
    try {
      await c.fn();
      console.log(`✅ ${c.nombre}`);
    } catch (e) {
      fallos++;
      console.log(`❌ ${c.nombre}\n     ${e.message}`);
    }
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* es /tmp */ }
  console.log(`\n   ${casos.length - fallos}/${casos.length} comprobaciones\n`);
  process.exit(fallos ? 1 : 0);
})();
