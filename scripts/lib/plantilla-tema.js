/**
 * SYX — Instanciar la plantilla de temas
 * ──────────────────────────────────────
 * scss/themes/_template/ se convierte en un tema copiando sus .scss y
 * cambiando el nombre `template` por el del tema. Lo hacen dos sitios, y por
 * eso vive aquí una sola vez:
 *   · scripts/theme-new.js     (`npm run theme:new <nombre>`) en el árbol real
 *   · scripts/check-plantilla.js en una copia, para comprobar que lo que sale
 *     de la plantilla compila, se empaqueta y pasa los guardianes de temas
 * Si los dos instanciaran a su manera, el guardián mediría una plantilla que
 * nadie usa.
 *
 * QUÉ SE SUSTITUYE, Y POR QUÉ NO TODO
 * Solo los IDENTIFICADORES: los mixins `theme-template` y
 * `theme-template-fonts`, y el argumento de las llamadas de bundle
 * (`syx-core(template…)`, `syx-bundle-full(template)`…). Un reemplazo de la
 * palabra suelta convertía la prosa de los comentarios en un sinsentido
 * («cambia «template» por el nombre del tema» acababa diciendo «cambia «demo»
 * por el nombre del tema»), y eso se queda en el tema para siempre.
 *
 * QUÉ SE COPIA
 * Los .scss de la plantilla salvo bundle-template.scss, que es el esqueleto
 * de un bundle de contexto y se queda en _template/ para quien lo necesite.
 * El README tampoco: explica cómo crear un tema, no el tema.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const NOMBRE_PLANTILLA = 'template';
// Lo que no viaja al tema nuevo (ver la cabecera).
const NO_SE_COPIA = new Set(['bundle-template.scss']);
// kebab-case: minúsculas, dígitos y guiones sueltos, empezando por letra.
const NOMBRE_VALIDO = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Los ficheros de la plantilla que forman un tema. */
function ficheros(dirPlantilla) {
  return fs.readdirSync(dirPlantilla).filter((f) => f.endsWith('.scss') && !NO_SE_COPIA.has(f)).sort();
}

/** Cambia el nombre de la plantilla por `nombre` en los identificadores, no en la prosa. */
function sustituir(texto, nombre) {
  return texto
    .replace(new RegExp(`\\btheme-${NOMBRE_PLANTILLA}\\b`, 'g'), `theme-${nombre}`)
    .replace(new RegExp(`\\(\\s*${NOMBRE_PLANTILLA}\\b`, 'g'), `(${nombre}`);
}

/** El punto de entrada scss/styles-theme-<nombre>.scss, con la forma de los de los temas reales. */
function entrada(nombre) {
  return [
    `// SYX — Entry point: ${nombre}`,
    '// ================================================',
    `// Compiles to: css/styles-theme-${nombre}.css`,
    `// Made with \`npm run theme:new ${nombre}\` from scss/themes/_template/.`,
    '// ================================================',
    '',
    '// THEME SETUP (tokens + reset + helpers + atoms + molecules + organisms)',
    `@use 'themes/${nombre}/setup';`,
    '',
    '// UTILITIES (text, display, spacing utility classes)',
    "@use 'utilities/index' as *;",
    '',
  ].join('\n');
}

/** Por qué `nombre` no vale como tema nuevo en `scssDir`, o null si vale. */
function motivoNombreInvalido(nombre, scssDir) {
  if (!nombre) return 'falta el nombre del tema';
  if (!NOMBRE_VALIDO.test(nombre)) return `«${nombre}» no está en kebab-case (minúsculas, dígitos y guiones; empieza por letra)`;
  if (nombre === NOMBRE_PLANTILLA) return `«${nombre}» es el nombre de la plantilla`;
  if (fs.existsSync(path.join(scssDir, 'themes', nombre))) return `ya existe scss/themes/${nombre}/`;
  if (fs.existsSync(path.join(scssDir, `styles-theme-${nombre}.scss`))) return `ya existe scss/styles-theme-${nombre}.scss`;
  return null;
}

/**
 * Crea scss/themes/<nombre>/ y scss/styles-theme-<nombre>.scss en `scssDir`.
 * `transformar(texto, fichero)` permite retocar cada fichero después de
 * sustituir (check-plantilla lo usa para activar la capa del sitio).
 * Devuelve las rutas escritas.
 */
function instanciar({ scssDir, nombre, transformar = (s) => s }) {
  const motivo = motivoNombreInvalido(nombre, scssDir);
  if (motivo) throw new Error(motivo);
  const plantilla = path.join(scssDir, 'themes', '_template');
  const dir = path.join(scssDir, 'themes', nombre);
  fs.mkdirSync(dir);
  const escritos = [];
  for (const f of ficheros(plantilla)) {
    const s = transformar(sustituir(fs.readFileSync(path.join(plantilla, f), 'utf8'), nombre), f);
    fs.writeFileSync(path.join(dir, f), s);
    escritos.push(path.join(dir, f));
  }
  const e = path.join(scssDir, `styles-theme-${nombre}.scss`);
  fs.writeFileSync(e, entrada(nombre));
  escritos.push(e);
  return escritos;
}

/**
 * Descomenta en el _setup.scss ya instanciado las dos líneas de la capa del
 * sitio, las que el propio _setup dice descomentar. Falla si no las encuentra:
 * un tema que cree llevar la capa y no la lleva es peor que un error.
 */
function activarCapaSitio(setup, nombre) {
  const usar = /^\/\/ (@use '\.\.\/\.\.\/site\/bundle-site' as \*;)/m;
  const incluir = new RegExp(`^// (@include syx-bundle-site\\(${nombre}\\);)`, 'm');
  if (!usar.test(setup) || !incluir.test(setup)) throw new Error('el _setup.scss de la plantilla ya no trae comentadas las dos líneas de la capa del sitio');
  return setup.replace(usar, '$1').replace(incluir, '$1');
}

/** ¿El _setup.scss del tema lleva la capa del sitio (sin comentar)? */
function llevaCapaSitio(dirTema) {
  const f = path.join(dirTema, '_setup.scss');
  if (!fs.existsSync(f)) return false;
  const sinComentarios = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return /@include\s+syx-bundle-site\s*\(/.test(sinComentarios);
}

module.exports = { NOMBRE_PLANTILLA, ficheros, sustituir, entrada, motivoNombreInvalido, instanciar, activarCapaSitio, llevaCapaSitio };
