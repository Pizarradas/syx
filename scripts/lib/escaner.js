/**
 * SYX — Escáner de desviación
 * ───────────────────────────
 * Lee el CSS y el marcado de una aplicación que consume SYX y señala dónde se
 * ha apartado del sistema.
 *
 * QUÉ ES «DESVIACIÓN» Y POR QUÉ SE PUEDE MEDIR AHORA
 * No es «esto no me gusta»: es que la aplicación afirma un valor que el sistema
 * ya no dice. El caso puro es `var(--semantic-color-primary, #6d28d9)`: el día
 * que se escribió, el primario era ese morado; hoy es un azul. El fallback es
 * una copia de un valor caducado, y nadie se entera porque el navegador no se
 * queja — solo lo usa el día que el token falta.
 *
 * Medir eso exige tres cosas que no existían hasta ahora: los valores resueltos
 * de verdad (0.2), el inventario de clases contrastado contra el CSS compilado
 * (0.1) y un paquete instalable desde el que mirar una aplicación ajena (1.2).
 * De ahí que este paso fuera el último.
 *
 * LO QUE NO HACE, A PROPÓSITO
 * No toca nada. Un escáner que además arregla es un escáner en el que hay que
 * confiar antes de haberlo leído. Lo que encuentra entra por la vía de
 * propuesta (2.1) o por las manos de alguien.
 *
 * SOBRE LOS FALSOS POSITIVOS
 * Una página de documentación está llena de ejemplos de código que enseñan
 * precisamente lo que aquí sería un error. Se ignora el contenido de <pre>,
 * <code>, <script> y <textarea> antes de mirar nada: un escáner que grita en
 * cada ejemplo es un escáner que se apaga.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Recorte de zonas que no son la aplicación ───────────────────────────────

const ZONAS_MUERTAS = /<(pre|code|script|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** Sustituye por espacios en vez de borrar: así las líneas siguen cuadrando. */
const vaciar = (html) =>
  html.replace(ZONAS_MUERTAS, (m) => m.replace(/[^\n]/g, ' '));

const lineaDe = (texto, indice) => texto.slice(0, indice).split('\n').length;

/**
 * Trozos de CSS dentro de un HTML, con la línea real de cada uno.
 * Los `style="…"` cuentan: es donde más se cuela un valor a pelo.
 */
function trozosCss(html) {
  const limpio = vaciar(html);
  const trozos = [];
  for (const m of limpio.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    trozos.push({ css: m[1], desde: lineaDe(limpio, m.index + m[0].indexOf(m[1])), origen: 'bloque <style>' });
  }
  for (const m of limpio.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) {
    trozos.push({ css: m[1], desde: lineaDe(limpio, m.index), origen: 'atributo style', unaLinea: true });
  }
  return trozos;
}

/** Valores de los atributos class, fuera de las zonas muertas. */
function clasesDe(html) {
  const limpio = vaciar(html);
  const fuera = [];
  // `class="…"` y, en JSX/TSX, `className="…"` o `className={'…'}`.
  for (const m of limpio.matchAll(/\bclass(?:Name)?\s*=\s*(?:\{\s*)?(["'`])([^"'`]*)\1/g)) {
    const linea = lineaDe(limpio, m.index);
    const lista = m[2].split(/\s+/).filter(Boolean);
    for (const c of lista) fuera.push({ clase: c, linea, junto: lista });
  }
  return fuera;
}

// ─── var(--token, fallback) con paréntesis equilibrados ──────────────────────
// Con una expresión regular se parte en el primer `)`, y `rgba(0,0,0,.1)` deja
// un fallback de `rgba(0, 0, 0, .1` que no es un color ni es nada. Se recorre.

function varsConFallback(css) {
  const fuera = [];
  const re = /var\(\s*(--[a-z0-9-]+)\s*/gi;
  let m;
  while ((m = re.exec(css))) {
    let i = m.index + m[0].length;
    if (css[i] !== ',') continue;
    i++;
    let nivel = 1;
    let j = i;
    while (j < css.length && nivel > 0) {
      if (css[j] === '(') nivel++;
      else if (css[j] === ')') nivel--;
      if (nivel === 0) break;
      j++;
    }
    fuera.push({ token: m[1], fallback: css.slice(i, j).trim(), indice: m.index });
  }
  return fuera;
}

/**
 * `var(--x)` a secas, sin fallback.
 *
 * Es el caso MÁS dañino de todos y el escáner no lo miraba: con fallback, un
 * token inexistente pinta el fallback y algo se ve; sin él, la propiedad se
 * queda sin valor y el elemento desaparece. Lo encontró una barra de progreso
 * de `why-syx.html` que llevaba meses invisible porque citaba un
 * `--primitive-color-orange-500` que no existe en ningún tema.
 */
function varsSinFallback(css) {
  const fuera = [];
  const re = /var\(\s*(--[a-z0-9-]+)\s*\)/gi;
  let m;
  while ((m = re.exec(css))) fuera.push({ token: m[1], indice: m.index });
  return fuera;
}

const sinEspacios = (v) => String(v).replace(/\s+/g, '').toLowerCase();
const ES_COLOR = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color)\(|transparent$|currentcolor$)/i;

// ─── Distancia para sugerir la clase real ────────────────────────────────────

function distancia(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 6) return 99;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[m][n];
}

const PREFIJOS_SYX = /^(atom|mol|org|syx)-/;
// Los espacios de nombres de token que son de SYX. Un token fuera de ellos es
// de la app (o de otra librería): el escáner no tiene opinión sobre su nombre.
// `--syx-*` no es de SYX —sus tokens no llevan ese prefijo— pero lo parece, y
// es justo lo que inventa un modelo (`--syx-sem-primary`): se juzga como suyo.
const TOKENS_SYX = /^--(syx|primitive|semantic|component|theme|layout|reset)-/;

/** `--x: …` declarados en un CSS (no las lecturas `var(--x)`). */
const declaraciones = (css) =>
  [...css.matchAll(/(^|[;{\s])(--[a-zA-Z0-9_-]+)\s*:/g)].map((m) => ({ token: m[2], indice: m.index + m[1].length }));

/** `@use`/`@import` de los abstracts ENTEROS (no de sus mixins): re-emite los tokens por defecto. */
const ABSTRACTS_ENTEROS = /@(use|import|forward)\s+["'][^"']*scss\/abstracts(\/index)?["']/g;

// ─── El escáner ──────────────────────────────────────────────────────────────

/**
 * @param {object} opciones
 * @param {string[]} opciones.files    rutas a .html o .css
 * @param {object}   opciones.syx      la capa de consulta (index.js o crearConsulta)
 * @param {string}   opciones.theme    tema contra el que se compara
 * @param {string}   opciones.mode     modo
 * @param {string}   [opciones.prefijo] prefijo del proyecto (`umbra`): activa la
 *                                      comprobación de consulta previa (3d)
 */
function escanear({ files, syx, theme = 'syx-sketch', mode = 'light', prefijo = null }) {
  const hallazgos = [];
  const añadir = (h) => hallazgos.push(h);

  // El CSS compilado es el árbitro de qué clases existen: es lo que el
  // navegador va a tener delante, y no una lista que alguien mantiene.
  const cssSistema = fs.readFileSync(syx.cssPath(theme), 'utf8');
  const clasesSistema = new Set([...cssSistema.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));
  const clasesSyx = [...clasesSistema].filter((c) => PREFIJOS_SYX.test(c));

  // No todo lo que pinta se escribe como `.clase`.
  //
  // `.atom-list--primary [class*=__item]` alcanza a `.atom-list__item` sin que
  // ese nombre aparezca nunca como selector de clase. La primera versión de
  // este escáner denunció tres clases así, y estuvieron a punto de borrarse del
  // marcado: habrían dejado la lista anidada sin iconos. Ojo con las comillas —
  // el CSS compilado las omite (`[class*=__item]`), y una expresión que las
  // exigiera no encontraría ninguno.
  const porAtributo = [...cssSistema.matchAll(/\[class([*^$~|]?)=["']?([^"'\]]+)["']?\]/g)]
    .map((m) => ({ op: m[1] || '=', v: m[2] }));
  //
  // Pero un selector de atributo que ya casa con la BASE de la clase no dice
  // nada de ella: `[class*=atom-btn]` alcanza a `.atom-btn`, y con él a
  // cualquier `atom-btn--lo-que-sea` que alguien invente. Se descarta el
  // selector cuando una clase existente de la que esta es prolongación ya lo
  // contiene. `atom-btn--fantasma` pasaba así la prueba de mutación
  // (auditoría 2026-10, acción 8).
  const casa = (a, c) =>
    a.op === '*' ? c.includes(a.v)
      : a.op === '^' ? c.startsWith(a.v)
        : a.op === '$' ? c.endsWith(a.v)
          : a.op === '~' || a.op === '=' ? c === a.v
            : false;
  const alcanzadaPorAtributo = (c) =>
    porAtributo.filter((a) => casa(a, c) &&
      !clasesSyx.some((base) => base !== c && c.startsWith(base) && casa(a, base)));

  // Primera pasada: los tokens que la propia app declara. `var(--app-card-bg)`
  // no es un token inexistente si la app lo declara en otro fichero: es su
  // capa de componente, la que el contrato de consumo le pide que tenga.
  const ES_MARCADO = /\.(html?|vue|svelte|astro|jsx|tsx)$/i;
  const ES_JSX = /\.(jsx|tsx)$/i;
  const trozosDe = (file, bruto) =>
    ES_JSX.test(file) ? []
      : ES_MARCADO.test(file) ? trozosCss(bruto)
        : [{ css: bruto, desde: 1, origen: path.basename(file) }];
  // Hay modificadores que el propio sistema enseña sin su bloque:
  // `atom-table--resp` va en `atom-table__container`, no en `atom-table`. Si el
  // `usage` del registro lo escribe así, así es como se usa.
  const modificadoresSueltos = new Set();
  try {
    for (const { name } of syx.listComponents().components) {
      const c = syx.getComponent({ name });
      for (const { clase, junto } of clasesDe(c.usage || '')) {
        if (clase.includes('--') && !junto.includes(clase.split('--')[0])) modificadoresSueltos.add(clase);
      }
    }
  } catch (e) { /* sin registro, sin excepciones: se juzga todo */ }

  const bloquesVistos = new Set(); // 3d: cada bloque propio se juzga una vez, en su primera regla
  const declaradosApp = new Set();
  for (const file of files) {
    for (const t of trozosDe(file, fs.readFileSync(file, 'utf8'))) for (const d of declaraciones(t.css)) declaradosApp.add(d.token);
  }

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const bruto = fs.readFileSync(file, 'utf8');
    const esHtml = ES_MARCADO.test(file);
    const trozos = trozosDe(file, bruto);

    // ── 1. Fallbacks que ya no coinciden con el sistema ────────────────────
    for (const t of trozos) {
      for (const v of varsConFallback(t.css)) {
        const linea = t.unaLinea ? t.desde : t.desde + t.css.slice(0, v.indice).split('\n').length - 1;
        if (declaradosApp.has(v.token) && !TOKENS_SYX.test(v.token)) continue; // token de la app
        const real = syx.getToken({ token: v.token, theme, mode });

        if (!real.encontrado && !TOKENS_SYX.test(v.token)) continue; // de otra librería: no es asunto de SYX
        if (!real.encontrado) {
          añadir({
            tipo: 'token-inexistente',
            gravedad: 'alta',
            file: rel, linea,
            que: `${v.token} no existe en el sistema`,
            detalle: `La aplicación pinta siempre el fallback (${v.fallback}) creyendo que es una excepción.`,
            sugerencia: real.sugerencias?.length ? `¿Quisiste decir ${real.sugerencias.slice(0, 3).join(', ')}?` : null,
          });
          continue;
        }
        if (sinEspacios(real.value) === sinEspacios(v.fallback)) continue;

        // Un fallback que NO es un color (una medida, un `0`) desviado importa
        // menos: el riesgo real es pintar de otro color.
        const esColor = ES_COLOR.test(v.fallback.trim());
        añadir({
          tipo: 'fallback-desviado',
          gravedad: esColor ? 'alta' : 'media',
          file: rel, linea,
          que: `${v.token} tiene un fallback que ya no es su valor`,
          detalle: `la aplicación dice ${v.fallback} · el sistema dice ${real.value}`,
          sugerencia: 'Quita el fallback: hoy es una copia caducada, y el día que sirva pintará lo que no toca.',
        });
      }
    }

    // ── 1b. var() sin fallback de un token que no existe ───────────────────
    for (const t of trozos) {
      for (const v of varsSinFallback(t.css)) {
        if (syx.getToken({ token: v.token, theme, mode }).encontrado) continue;
        if (declaradosApp.has(v.token)) continue; // lo declara la app (si usurpa un prefijo de SYX, sale en 1c)
        const linea = t.unaLinea ? t.desde : t.desde + t.css.slice(0, v.indice).split('\n').length - 1;
        const cerca = syx.getToken({ token: v.token, theme, mode }).sugerencias || [];
        const deSyx = TOKENS_SYX.test(v.token);
        añadir({
          tipo: 'token-inexistente',
          // Fuera de los prefijos de SYX puede venir de otra hoja que no se ha
          // escaneado: se avisa, sin gritar.
          gravedad: deSyx ? 'alta' : 'baja',
          file: rel, linea,
          que: deSyx ? `${v.token} no existe, y se usa sin fallback` : `${v.token} no lo declaran ni SYX ni los ficheros escaneados`,
          detalle: deSyx
            ? 'La propiedad se queda sin valor: el elemento no se pinta. No hay nada que avise, ni en consola ni al compilar.'
            : 'Si lo declara otra hoja, escanéala también; si no, la propiedad se queda sin valor.',
          sugerencia: /^--syx-/.test(v.token)
            ? 'Los tokens de SYX no llevan prefijo syx-: son --primitive-*, --semantic-*, --component-*.'
            : deSyx && cerca.length ? `¿Quisiste decir ${cerca.slice(0, 3).join(', ')}?` : null,
        });
      }
    }

    // ── 1c. Tokens nuevos con prefijo de SYX, y lecturas de primitivos ──────
    // Las dos formas en que una app se salta la cadena de tokens: inventar
    // un `--component-*` (o `--semantic-*`) que el sistema no tiene, como si
    // fuera parte de él, y leer un `--primitive-*`, que es materia de los
    // temas. Sobrescribir un token que SÍ existe es legítimo (THEMING-RULES).
    for (const t of trozos) {
      for (const d of declaraciones(t.css)) {
        if (!TOKENS_SYX.test(d.token)) continue;
        if (syx.getToken({ token: d.token, theme, mode }).encontrado) continue;
        const linea = t.unaLinea ? t.desde : t.desde + t.css.slice(0, d.indice).split('\n').length - 1;
        añadir({
          tipo: 'token-usurpado',
          gravedad: 'media',
          file: rel, linea,
          que: `${d.token} se declara con prefijo de SYX y SYX no lo tiene`,
          detalle: 'Parece del sistema y no lo es: el próximo que lo lea lo buscará en SYX, y una versión futura puede declararlo con otro valor.',
          sugerencia: `Los tokens de la app llevan el prefijo de la app (${d.token.replace(/^--(syx-)?(primitive|semantic|component|theme|layout|reset|prv|sem|cmp)?-?/, `--${prefijo || 'app'}-`)}) — CONSUMING.md §5.`,
        });
      }
      for (const m of t.css.matchAll(/var\(\s*(--primitive-[a-zA-Z0-9-]+)/g)) {
        const linea = t.unaLinea ? t.desde : t.desde + t.css.slice(0, m.index).split('\n').length - 1;
        añadir({
          tipo: 'primitivo-en-app',
          gravedad: 'media',
          file: rel, linea,
          que: `lee ${m[1]}`,
          detalle: 'Un primitivo es un valor sin significado: no sigue al modo oscuro ni a un cambio de marca. La app empieza en los semánticos.',
          sugerencia: (() => {
            const v = syx.getToken({ token: m[1], theme, mode });
            const sem = v.encontrado ? syx.findTokenByValue({ value: v.value, theme, mode }).exactos.filter((x) => x.startsWith('--semantic-')) : [];
            return sem.length ? `Hoy vale lo mismo que ${sem.slice(0, 3).join(', ')}` : 'Busca el rol: get_token / find_token_by_value.';
          })(),
        });
      }
    }

    // ── 1d. Los abstracts enteros importados desde la app ───────────────────
    // `@use '…/scss/abstracts'` arrastra los ~75 KB de tokens por defecto, sin
    // capa y DESPUÉS del tema: el tema queda pisado. La app solo necesita los
    // mixins: `scss/abstracts/mixins/mixins`.
    if (/\.scss$/i.test(file)) {
      for (const m of bruto.matchAll(ABSTRACTS_ENTEROS)) {
        añadir({
          tipo: 'contrato',
          gravedad: 'alta',
          file: rel, linea: lineaDe(bruto, m.index),
          que: 'importa scss/abstracts entero',
          detalle: 'Re-emite todos los tokens por defecto de SYX después del tema y los pisa.',
          sugerencia: "@use 'syx-design-system/scss/abstracts/mixins/mixins' as *;",
        });
      }
    }

    // ── 2. Valores a pelo que el sistema ya tiene como token ────────────────
    for (const t of trozos) {
      const sinVars = t.css.replace(/var\([^)]*\)/g, ' ');
      for (const m of sinVars.matchAll(/(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\([^)]*\))/g)) {
        const valor = m[1];
        const linea = t.unaLinea ? t.desde : t.desde + sinVars.slice(0, m.index).split('\n').length - 1;
        const cerca = syx.findTokenByValue({ value: valor, theme, mode });
        const semanticos = cerca.exactos.filter((x) => x.startsWith('--semantic-'));
        if (!cerca.exactos.length) continue; // un color propio de la app no es desviación
        añadir({
          tipo: 'valor-a-pelo',
          gravedad: 'media',
          file: rel, linea,
          que: `${valor} escrito a mano, existiendo como token`,
          detalle: `es ${(semanticos.length ? semanticos : cerca.exactos).slice(0, 3).join(', ')}`,
          sugerencia: `var(${(semanticos[0] || cerca.exactos[0])})`,
        });
      }
    }

    // ── 3. Reglas de contrato aplicadas fuera del sistema ───────────────────
    for (const t of trozos) {
      const lineas = t.css.split('\n');
      lineas.forEach((l, i) => {
        const linea = t.unaLinea ? t.desde : t.desde + i;
        if (/!important/.test(l)) {
          añadir({
            tipo: 'contrato', gravedad: 'media', file: rel, linea,
            que: '!important', detalle: l.trim().slice(0, 90),
            sugerencia: 'SYX gobierna la cascada con @layer; un !important en el consumidor la anula entera.',
          });
        }
        if (/(^|[;{]|\s)position:\s*(absolute|fixed|sticky)/.test(l) && !/--/.test(l)) {
          añadir({
            tipo: 'contrato', gravedad: 'baja', file: rel, linea,
            que: `position en crudo`, detalle: l.trim().slice(0, 90),
            sugerencia: 'El sistema tiene mixins de posición; en un consumidor, al menos que sea deliberado.',
          });
        }
      });
    }

    // ── 3b. Movimiento sin salida para quien lo pide reducido ───────────────
    // En SCSS la app tiene el mixin (`@include transition()`), que añade el
    // `prefers-reduced-motion`; en CSS plano, al menos que el fichero lo trate.
    const esScss = /\.scss$/i.test(file);
    const tieneReducido = /prefers-reduced-motion/.test(bruto);
    if (esScss || !tieneReducido) {
      for (const t of trozos) {
        t.css.split('\n').forEach((l, i) => {
          if (!/(^|[;{\s])transition(-[a-z-]+)?\s*:/.test(l) || /^\s*\/\//.test(l)) return;
          añadir({
            tipo: 'movimiento-sin-salida', gravedad: 'media', file: rel, linea: t.unaLinea ? t.desde : t.desde + i,
            que: 'transition en crudo', detalle: l.trim().slice(0, 90),
            sugerencia: esScss
              ? "@include transition(…) — @use 'syx-design-system/scss/abstracts/mixins/mixins'; añade la salida de prefers-reduced-motion"
              : 'Añade @media (prefers-reduced-motion: reduce) { transition: none; } (CONSUMING.md §5).',
          });
        });
      }
    }

    // ── 3c. La app pinta una clase de SYX ───────────────────────────────────
    // `.mol-card__header { display: flex }` desde la app: el componente deja
    // de ser el del sistema y nadie lo ve en el registro. La app puede COLOCAR
    // una pieza de SYX (márgenes, rejilla, orden) y sobrescribir sus tokens;
    // pintarla, no. Se mira cada bloque cuyo selector nombra una clase de SYX
    // y se juzgan solo sus declaraciones directas.
    if (!esHtml || trozos.length) {
      const COLOCAR = /^(margin|margin-[a-z-]+|grid-area|grid-column|grid-row|grid-column-[a-z]+|grid-row-[a-z]+|order|align-self|justify-self|place-self|flex|flex-grow|flex-shrink|flex-basis|inline-size|max-inline-size|min-inline-size|width|max-width|min-width)$/;
      for (const t of trozos) {
        const css = t.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
        let i = 0;
        while ((i = css.indexOf('{', i)) !== -1) {
          const inicio = Math.max(css.lastIndexOf('}', i - 1), css.lastIndexOf('{', i - 1), css.lastIndexOf(';', i - 1)) + 1;
          const selector = css.slice(inicio, i).trim();
          // Cuerpo directo: hasta su llave de cierre, sin los bloques anidados.
          let nivel = 1; let j = i + 1; let directo = '';
          while (j < css.length && nivel > 0) {
            const ch = css[j];
            if (ch === '{') nivel++;
            else if (ch === '}') nivel--;
            else if (nivel === 1) directo += ch;
            j++;
          }
          // El SUJETO del selector es lo que se pinta: el último compuesto de
          // cada alternativa, sin lo que va entre paréntesis.
          // `.demo:has(.mol-dialog)` pinta `.demo`, no el diálogo.
          const sujetoSyx = selector.startsWith('@') ? null : selector.split(',')
            .map((alt) => {
              let sin = alt; let antes;
              do { antes = sin; sin = sin.replace(/\([^()]*\)/g, ''); } while (sin !== antes);
              const partes = sin.trim().split(/\s*[\s>+~]\s*/);
              return /\.((atom|mol|org)-[A-Za-z0-9_-]+)/.exec(partes[partes.length - 1] || '');
            })
            .find(Boolean);
          const syxEn = sujetoSyx ? [null, null, sujetoSyx[1]] : null;
          if (syxEn) {
            const props = [...directo.matchAll(/(?:^|;)\s*([a-zA-Z-]+)\s*:/g)].map((m) => m[1].toLowerCase())
              .filter((p) => !p.startsWith('--'));
            const pinta = props.filter((p) => !COLOCAR.test(p));
            if (pinta.length) {
              añadir({
                tipo: 'pinta-clase-syx', gravedad: 'media', file: rel,
                linea: t.unaLinea ? t.desde : t.desde + css.slice(0, i).split('\n').length - 1,
                que: `la app pinta .${syxEn[2]} (${[...new Set(pinta)].slice(0, 4).join(', ')})`,
                detalle: `selector «${selector.replace(/\s+/g, ' ').slice(0, 70)}»: una clase de SYX solo se coloca (margin, grid-*, order, align/justify-self, flex) desde la app.`,
                sugerencia: 'Usa un modificador que exista, sobrescribe sus tokens, o compón un elemento propio (app-*) dentro — CONSUMING.md §3–4.',
              });
            }
          }
          i++;
        }
      }
    }

    // ── 3d. Bloques propios sin constancia de haber consultado SYX ───────────
    // SYX es la fuente: un componente del proyecto solo se crea cuando ninguna
    // pieza del sistema sirve. El contrato pide dejarlo dicho encima de la
    // primera regla del bloque (`/* syx-reuse: checked mol-card — … */`), y esto
    // comprueba que está. No juzga si la razón es buena —eso es de una
    // persona—, pero obliga a que el agente haya mirado antes de inventar.
    if (prefijo) {
      const re = new RegExp(`\\.(${prefijo}-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\\w-])`, 'g');
      for (const t of trozos) {
        const lineas = t.css.split('\n');
        lineas.forEach((l, i) => {
          if (!l.includes('{')) return;
          const selector = l.slice(0, l.indexOf('{'));
          for (const m of selector.matchAll(re)) {
            const bloque = m[1];
            if (bloquesVistos.has(bloque)) continue;
            bloquesVistos.add(bloque);
            // Lo que hay justo encima: comentarios y líneas en blanco, hasta la
            // regla anterior. El comentario de un bloque no vale para el siguiente.
            const encima = [];
            for (let k = i - 1; k >= 0; k--) {
              const x = lineas[k].trim();
              if (/[{};]\s*$/.test(x) && !/^(\/\*|\*|\/\/)/.test(x)) break;
              encima.unshift(x);
            }
            const antes = encima.join('\n');
            if (/syx-reuse\s*:/.test(antes) || /syx-reuse\s*:/.test(l)) continue;
            añadir({
              tipo: 'sin-consulta', gravedad: 'media', file: rel,
              linea: t.unaLinea ? t.desde : t.desde + i,
              que: `.${bloque} se crea sin decir qué de SYX se consultó`,
              detalle: 'Un componente propio solo nace cuando ningún componente, modificador, composición o token de SYX sirve.',
              sugerencia: `Encima de su primera regla: /* syx-reuse: checked <piezas de SYX> — <por qué no sirven> */`,
            });
          }
        });
      }
    }

    // ── 4. Clases que parecen del sistema y no lo son ───────────────────────
    if (esHtml) {
      // Los <script> de la propia página, para distinguir una clase muerta de
      // un gancho de JavaScript. `.syx--theme-syx-sketch` no la declara ningún
      // CSS, pero el script cambia de tema construyendo `syx--theme-${nombre}`:
      // es un asidero, no una desviación, y llamarlo error una vez basta para
      // que nadie vuelva a leer el informe.
      const guiones = [...bruto.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
      const esGancho = (clase) => {
        for (let n = clase.length; n >= 8; n--) {
          const trozo = clase.slice(0, n);
          // Un prefijo demasiado corto acierta por casualidad («atom» está en
          // cualquier script que toque iconos), así que tiene que ser buena
          // parte del nombre.
          if (n / clase.length < 0.4) break;
          if (guiones.includes(trozo)) return trozo;
        }
        return null;
      };

      // Un modificador sin su bloque: `class="atom-btn--primary"` a secas. El
      // modificador existe, pero el CSS lo escribe como `.atom-btn--primary`
      // DENTRO de `.atom-btn` (o asume sus estilos base): solo, pinta a medias.
      const sinBloque = new Map();
      for (const { clase, linea, junto } of clasesDe(bruto)) {
        if (!PREFIJOS_SYX.test(clase) || !clase.includes('--')) continue;
        if (modificadoresSueltos.has(clase)) continue;
        const base = clase.split('--')[0];
        if (!clasesSistema.has(clase) || junto.includes(base)) continue;
        if (!clasesSistema.has(base) && !clasesSyx.some((c) => c.startsWith(base + '__'))) continue;
        if (!sinBloque.has(clase)) sinBloque.set(clase, { linea, base, veces: 0 });
        sinBloque.get(clase).veces++;
      }
      for (const [clase, { linea, base, veces }] of sinBloque) {
        añadir({
          tipo: 'modificador-sin-bloque',
          gravedad: 'media',
          file: rel, linea,
          que: `.${clase} sin .${base}${veces > 1 ? ` (${veces} usos)` : ''}`,
          detalle: 'Un modificador varía un bloque; sin el bloque faltan sus estilos base.',
          sugerencia: `class="${base} ${clase}"`,
        });
      }

      const vistas = new Map();
      for (const { clase, linea } of clasesDe(bruto)) {
        if (!PREFIJOS_SYX.test(clase)) continue; // clases propias de la app: no opinamos
        if (clasesSistema.has(clase)) continue;
        if (!vistas.has(clase)) vistas.set(clase, { linea, veces: 0 });
        vistas.get(clase).veces++;
      }
      for (const [clase, { linea, veces }] of vistas) {
        const base = clase.split('--')[0];
        const esModificador = clase.includes('--') && clasesSistema.has(base);
        // Para un modificador inventado, primero la familia del propio bloque
        // que contiene lo que se quiso decir (`atom-btn--sm` → `atom-btn--size-sm`);
        // la distancia de edición sola proponía `.atom-icon--sm`.
        const cola = esModificador ? clase.slice(base.length + 2) : '';
        const deFamilia = esModificador
          ? clasesSyx.filter((c) => c.startsWith(base + '--') && c.slice(base.length + 2).split('-').includes(cola))
          : [];
        const cercanas = [...new Set([...deFamilia, ...clasesSyx
          .map((c) => ({ c, d: distancia(clase, c) }))
          .filter((x) => x.d <= 4)
          .sort((a, b) => a.d - b.d)
          .map((x) => x.c)])].slice(0, 3);
        const porAttr = alcanzadaPorAtributo(clase);
        if (porAttr.length) continue; // la pinta un selector de atributo

        // Una base sin estilos propios cuyos modificadores SÍ existen no es una
        // clase inventada: es el ancla de una familia que el sistema declara.
        // Eso es una pregunta de diseño para una persona, no decenas de errores
        // repetidos. (`.atom-txt` fue el caso que la originó; hoy ya declara
        // su base.)
        const familia = [...clasesSistema].filter((x) => x.startsWith(clase + '--'));
        if (familia.length) {
          añadir({
            tipo: 'base-sin-estilos',
            gravedad: 'baja',
            file: rel, linea,
            que: `.${clase} no declara nada${veces > 1 ? ` (${veces} usos)` : ''}`,
            detalle: `Sus modificadores sí existen (${familia.slice(0, 3).map((f) => '.' + f).join(', ')}), así que la familia es real y solo falta la base.`,
            sugerencia: 'O la base recibe los estilos que su nombre promete, o sobra en el marcado. Es una decisión de diseño.',
          });
          continue;
        }

        const gancho = esGancho(clase);
        if (gancho) {
          añadir({
            tipo: 'gancho-js',
            gravedad: 'baja',
            file: rel, linea,
            que: `.${clase} no la declara ningún CSS${veces > 1 ? ` (${veces} usos)` : ''}`,
            detalle: `El script de la página sí la usa (${gancho}…): parece un asidero de JavaScript, no una desviación.`,
            sugerencia: 'Si es un asidero, mejor un data-* que una clase: así nadie espera que pinte.',
          });
          continue;
        }
        añadir({
          tipo: esModificador ? 'modificador-inventado' : 'clase-fantasma',
          gravedad: esModificador ? 'alta' : 'media',
          file: rel, linea,
          que: `.${clase} no existe en el CSS del sistema${veces > 1 ? ` (${veces} usos)` : ''}`,
          detalle: esModificador
            ? `.${base} sí existe; el modificador no, así que no pinta nada.`
            : 'Lleva prefijo de SYX pero el sistema no la declara. Si es un componente del proyecto, lleva el prefijo del proyecto (CONSUMING.md).',
          sugerencia: cercanas.length ? `Existen: ${cercanas.map((c) => '.' + c).join(', ')}` : null,
        });
      }
    }
  }

  const porTipo = {};
  for (const h of hallazgos) porTipo[h.tipo] = (porTipo[h.tipo] || 0) + 1;
  const orden = { alta: 0, media: 1, baja: 2 };
  hallazgos.sort((a, b) => orden[a.gravedad] - orden[b.gravedad] || a.file.localeCompare(b.file) || a.linea - b.linea);

  return {
    theme, mode,
    ficheros: files.length,
    total: hallazgos.length,
    porTipo,
    porGravedad: hallazgos.reduce((a, h) => ({ ...a, [h.gravedad]: (a[h.gravedad] || 0) + 1 }), {}),
    hallazgos,
  };
}

module.exports = { escanear, trozosCss, clasesDe, varsConFallback, vaciar, distancia };
