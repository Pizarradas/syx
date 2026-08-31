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
  for (const m of limpio.matchAll(/\bclass\s*=\s*"([^"]*)"/gi)) {
    const linea = lineaDe(limpio, m.index);
    for (const c of m[1].split(/\s+/).filter(Boolean)) fuera.push({ clase: c, linea });
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

// ─── El escáner ──────────────────────────────────────────────────────────────

/**
 * @param {object} opciones
 * @param {string[]} opciones.files    rutas a .html o .css
 * @param {object}   opciones.syx      la capa de consulta (index.js o crearConsulta)
 * @param {string}   opciones.theme    tema contra el que se compara
 * @param {string}   opciones.mode     modo
 */
function escanear({ files, syx, theme = 'syx-sketch', mode = 'light' }) {
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
  const alcanzadaPorAtributo = (c) =>
    porAtributo.filter((a) =>
      a.op === '*' ? c.includes(a.v)
        : a.op === '^' ? c.startsWith(a.v)
          : a.op === '$' ? c.endsWith(a.v)
            : a.op === '~' || a.op === '=' ? c === a.v
              : false
    );

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const bruto = fs.readFileSync(file, 'utf8');
    const esHtml = /\.html?$/i.test(file);
    const trozos = esHtml
      ? trozosCss(bruto)
      : [{ css: bruto, desde: 1, origen: path.basename(file) }];

    // ── 1. Fallbacks que ya no coinciden con el sistema ────────────────────
    for (const t of trozos) {
      for (const v of varsConFallback(t.css)) {
        const linea = t.unaLinea ? t.desde : t.desde + t.css.slice(0, v.indice).split('\n').length - 1;
        const real = syx.getToken({ token: v.token, theme, mode });

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
        const cercanas = clasesSyx
          .map((c) => ({ c, d: distancia(clase, c) }))
          .filter((x) => x.d <= 4)
          .sort((a, b) => a.d - b.d)
          .slice(0, 3)
          .map((x) => x.c);
        const porAttr = alcanzadaPorAtributo(clase);
        if (porAttr.length) continue; // la pinta un selector de atributo

        // Una base sin estilos propios cuyos modificadores SÍ existen no es una
        // clase inventada: es el ancla de una familia que el sistema declara.
        // `.atom-txt` no emite nada, pero `.atom-txt--primary` sí, y de 18
        // familias es la única a la que le falta la base. Eso es una pregunta de
        // diseño para una persona, no 77 errores repetidos.
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
            : 'Lleva prefijo de SYX pero el sistema no la declara.',
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

module.exports = { escanear, trozosCss, clasesDe, varsConFallback, vaciar };
