#!/usr/bin/env node
/**
 * build-lucide-tokens.js
 * ----------------------------------------------------------------------------
 * Regenera el bloque `:root` de scss/atoms/_icon-lucide.scss incrustando los
 * SVG de img/icons/lucide/ como data URI.
 *
 * ¿Por qué data URI y no url() al fichero?
 * Los iconos se pintan con `mask-image` para que hereden `currentColor` (y por
 * tanto respondan al tema y al modo oscuro). Chrome bloquea una máscara SVG
 * que venga de otro origen, y con file:// cada fichero es un origen opaco: el
 * sitio abierto en local se quedaba sin ningún icono. Incrustar los evita.
 *
 * Los SVG de img/icons/lucide/ siguen siendo la fuente de verdad. Tras añadir
 * o actualizar un icono ahí, ejecuta:  node scripts/build-lucide-tokens.js
 *
 * Lucide — https://lucide.dev — licencia ISC.
 * ----------------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SVG_DIR = path.join(ROOT, 'img', 'icons', 'lucide');
const TARGET = path.join(ROOT, 'scss', 'atoms', '_icon-lucide.scss');

/**
 * Mapa token → fichero. Casi todos coinciden; estos son los alias
 * históricos que no se pueden deducir del nombre.
 */
const TOKEN_TO_FILE = {
"home": "home",
  "menu": "menu",
  "x": "x",
  "layers": "layers",
  "chevron-right": "chevron-right",
  "chevron-left": "chevron-left",
  "chevron-down": "chevron-down",
  "chevron-up": "chevron-up",
  "chevrons-right": "chevrons-right",
  "chevrons-down": "chevrons-down",
  "arrow-right": "arrow-right",
  "arrow-left": "arrow-left",
  "search": "search",
  "plus": "plus",
  "minus": "minus",
  "check": "check",
  "trash": "trash-2",
  "pencil": "pencil",
  "download": "download",
  "copy": "copy",
  "external-link": "external-link",
  "filter": "filter",
  "rocket": "rocket",
  "terminal": "terminal",
  "book-open": "book-open",
  "github": "github",
  "zap": "zap",
  "info": "info",
  "warning": "alert-triangle",
  "success": "circle-check",
  "error": "circle-x",
  "shield-check": "shield-check",
  "moon": "moon",
  "sun": "sun",
  "palette": "palette",
  "user": "user",
  "settings": "settings",
  "mail": "mail",
  "database": "database",
  "link": "link",
  "component": "box",
  "box": "box",
  "coins": "coins",
  "atom": "atom",
  "package": "package",
  "file-text": "file-text",
  "git-branch": "git-branch",
  "bot": "bot",
  "activity": "activity",
  "check-circle": "circle-check",
  "pie-chart": "chart-pie",
  // Añadidos en 4.20.0: los pedían docs.html y why-syx.html y no existían, así
  // que el navegador pintaba un hueco. Los encontró el escáner de desviación.
  "layout": "layout",
  "code": "code",
  "corner-down-right": "corner-down-right",
  "arrow-up": "arrow-up",
  "users": "users",
  "award": "award",
  "git-compare": "git-compare",
  "briefcase": "briefcase",
  "x-circle": "x-circle",
};

/** Minifica un SVG y lo codifica para caber dentro de url("…"). */
function encode(svg) {
  const min = svg
    .replace(/<!--[\s\S]*?-->/g, '')          // comentario de licencia: va en la cabecera del SCSS
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
    .replace(/stroke="currentColor"/g, 'stroke="#000"') // en una máscara solo cuenta el alfa
    .replace(/"/g, "'");                      // comillas simples: no rompen url("…")
  // Codificación ligera: solo lo que rompería el url() o el CSS.
  // Dejar sin escapar los espacios y la puntuación segura ahorra ~8 KB.
  return min
    .replace(/%/g, '%25')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/\|/g, '%7C')
    .replace(/\\/g, '%5C')
    .replace(/\^/g, '%5E')
    .replace(/`/g, '%60');
}

function main() {
  const files = fs.readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg'));
  const map = new Map();
  for (const f of files) {
    map.set(path.basename(f, '.svg'), encode(fs.readFileSync(path.join(SVG_DIR, f), 'utf8')));
  }

  let scss = fs.readFileSync(TARGET, 'utf8');
  let replaced = 0;
  const missing = [];

  // Sustituye el valor de cada --lc-icon-*, conservando comentarios y orden.
  // La clave es el NOMBRE DEL TOKEN, no el valor: así el script sigue siendo
  // idempotente cuando el valor ya es un data URI.
  scss = scss.replace(
    /(--lc-icon-([a-z0-9-]+):\s*)url\("[^"]*"\)/g,
    (full, prefix, token) => {
      const fileName = TOKEN_TO_FILE[token] || token;
      if (!map.has(fileName)) { missing.push(`${token} → ${fileName}.svg`); return full; }
      replaced++;
      return `${prefix}url("data:image/svg+xml,${map.get(fileName)}")`;
    }
  );

  if (missing.length) {
    console.error('Faltan SVG en img/icons/lucide/:', [...new Set(missing)].join(', '));
    process.exit(1);
  }

  fs.writeFileSync(TARGET, scss);
  const kb = ([...map.values()].reduce((a, v) => a + v.length, 0) / 1024).toFixed(1);
  console.log(`${map.size} iconos disponibles · ${replaced} tokens reescritos · ~${kb} KB incrustados`);
  console.log('Recuerda recompilar:  npm run build:css');
}

main();
