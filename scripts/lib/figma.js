/**
 * SYX — Traducción a Figma
 * ────────────────────────
 * Convierte lo que SYX ya sabe de sí mismo a lo que la Plugin API de Figma
 * necesita: colores en RGB de 0 a 1, medidas en píxeles absolutos, nombres con
 * barras, y la propiedad concreta que hay que tocar en un nodo.
 *
 * POR QUÉ NO BASTA CON EL EXPORTADOR DTCG
 * `export-tokens.js` ya habla el estándar, y para Style Dictionary es
 * suficiente. Para Figma no: una variable de tipo COLOR guarda `{r,g,b,a}`
 * numéricos, y todo el sistema está escrito en `oklch()`. Un fichero DTCG con
 * `oklch(0.498 0.282 266.24)` se importa como texto o no se importa. La
 * conversión es la frontera real, y no la cruza ningún formato: la cruza una
 * función.
 *
 * POR QUÉ VIVE EN lib/ Y NO EN EL EXPORTADOR
 * Por la misma razón que consulta.js: tiene dos consumidores. El exportador la
 * usa para escribir las colecciones de variables de golpe, y `get_figma_spec`
 * la usa para responder por un componente suelto cuando el agente está
 * dibujando. Si hubiera dos copias, el agente pintaría un azul y la variable
 * diría otro.
 *
 * LO QUE NO TRADUCE, Y POR QUÉ SE CUENTA
 * Las expresiones —`calc()`, `color-mix()`, `oklch(from …)`, `clamp()`— no son
 * valores; solo un navegador las reduce. Figma no tiene con qué. Aquí se
 * descartan, pero SIEMPRE con el motivo, y quien llama las recibe contadas: un
 * sistema que exporta 700 tokens y calla que dejó 250 fuera miente por
 * omisión, que es el error que este repositorio ya cometió una vez.
 */

'use strict';

// ─── 1 · Color ───────────────────────────────────────────────────────────────
// La cadena es oklch → oklab → LMS → sRGB lineal → sRGB con gamma. Las matrices
// son las de la especificación CSS Color 4; se escriben a pelo porque meter una
// dependencia de color en un paquete cuyo argumento es no arrastrar nada sería
// contradecirse por cuarenta líneas.

const M_LMS = [
  [0.3963377774, 0.2158037573],
  [-0.1055613458, -0.0638541728],
  [-0.0894841775, -1.2914855480],
];

const M_RGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
];

const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const cortar = (n) => Math.min(1, Math.max(0, n));
const redondear = (n) => Math.round(n * 10000) / 10000;

function oklchARgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const lms = M_LMS.map(([ca, cb]) => Math.pow(L + ca * a + cb * b, 3));
  return M_RGB.map((fila) => cortar(gamma(fila.reduce((s, k, i) => s + k * lms[i], 0))));
}

// Un componente CSS puede venir como 0.498, como 50% o como 128 según dónde
// esté. `escala` es el divisor del caso absoluto: 255 para rgb(), 1 para alfa.
function num(t, escala) {
  const v = String(t).trim();
  if (v.endsWith('%')) return parseFloat(v) / 100;
  return parseFloat(v) / (escala || 1);
}

function aHex(c) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a < 1 ? h(c.a) : '');
}

/**
 * Un valor CSS a `{ r, g, b, a }` con componentes de 0 a 1, que es lo que
 * guarda una variable COLOR y lo que espera `fills`. Devuelve null si el valor
 * no es un color que se pueda fijar: `currentColor` es una referencia, no un
 * color, y un `color-mix()` es una operación.
 */
function aColor(bruto) {
  const v = String(bruto == null ? '' : bruto).trim().toLowerCase();
  if (!v) return null;
  if (v === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (v === 'currentcolor' || v === 'inherit') return null;

  // oklch(L C H) · oklch(L C H / A) · oklch(L C H/A) — el CSS compilado sale
  // minificado, y ahí el espacio antes de la barra no está garantizado.
  const ok = v.match(/^oklch\(\s*([\d.%-]+)\s+([\d.%-]+)\s+([\d.-]+)(?:deg)?\s*(?:\/\s*([\d.%]+))?\s*\)$/);
  if (ok) {
    const rgb = oklchARgb(num(ok[1]), parseFloat(ok[2]), parseFloat(ok[3]));
    return {
      r: redondear(rgb[0]),
      g: redondear(rgb[1]),
      b: redondear(rgb[2]),
      a: ok[4] ? redondear(num(ok[4])) : 1,
    };
  }

  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let d = hex[1];
    if (d.length === 3 || d.length === 4) d = d.split('').map((c) => c + c).join('');
    if (d.length !== 6 && d.length !== 8) return null;
    const p = (i) => redondear(parseInt(d.slice(i, i + 2), 16) / 255);
    return { r: p(0), g: p(2), b: p(4), a: d.length === 8 ? p(6) : 1 };
  }

  const rgb = v.match(/^rgba?\(\s*([\d.%]+)[\s,]+([\d.%]+)[\s,]+([\d.%]+)(?:[\s,/]+([\d.%]+))?\s*\)$/);
  if (rgb) {
    return {
      r: redondear(cortar(num(rgb[1], 255))),
      g: redondear(cortar(num(rgb[2], 255))),
      b: redondear(cortar(num(rgb[3], 255))),
      a: rgb[4] ? redondear(num(rgb[4])) : 1,
    };
  }
  return null;
}

// ─── 2 · Medida ──────────────────────────────────────────────────────────────
// Figma trabaja en píxeles absolutos y no tiene noción de raíz, así que 1rem
// son 16px. No es una suposición cómoda: SYX no declara `font-size` en `html`,
// de modo que 16 es el valor que el navegador aplica de verdad. Si algún día se
// declarara, este es el único sitio que habría que cambiar.

const RAIZ_PX = 16;
const RELATIVAS = /^-?[\d.]+(em|%|vh|vw|vmin|vmax|ch|ex)$/;

/**
 * Un valor CSS a número de píxeles. Devuelve null cuando el valor depende de
 * algo que Figma no tiene: `em` depende del padre, `%` del contenedor, `vw` de
 * la ventana. Traducirlos exigiría inventarse un contexto, y un número
 * inventado dentro de una variable es peor que la variable ausente, porque
 * nadie lo revisa después.
 */
function aNumero(bruto) {
  const v = String(bruto == null ? '' : bruto).trim();
  if (!v) return null;
  if (RELATIVAS.test(v)) return null;
  const rem = v.match(/^(-?[\d.]+)rem$/);
  if (rem) return redondear(parseFloat(rem[1]) * RAIZ_PX);
  const px = v.match(/^(-?[\d.]+)px$/);
  if (px) return redondear(parseFloat(px[1]));
  // Sin unidad: line-height, opacity, z-index. Van tal cual.
  if (/^-?[\d.]+$/.test(v)) return redondear(parseFloat(v));
  return null;
}

// ─── 3 · Nombre ──────────────────────────────────────────────────────────────
// Figma agrupa las variables por las barras del nombre y no impone un árbol,
// así que aquí NO hace falta el apaño `DEFAULT` que sí necesita DTCG: allí un
// nodo no puede ser hoja y grupo a la vez, y `--component-button-primary-color`
// junto a `--component-button-primary-color-hover` obliga a ello. En Figma son
// dos cadenas distintas y conviven sin colisión.

const aNombreFigma = (token) => token.replace(/^--/, '').split('-').filter(Boolean).join('/');
const capaDe = (token) => token.replace(/^--/, '').split('-')[0];

// ─── 4 · Tipo ────────────────────────────────────────────────────────────────

const ES_EXPRESION = /\b(color-mix|calc|clamp|min|max|light-dark|brightness|saturate)\s*\(|\b(oklch|rgb|hsl|lab|lch)\(\s*from\b/;
const PALABRA = /^[a-z][a-z-]*$/;

/**
 * De qué tipo sería la variable en Figma y con qué valor: `{ tipo, valor }`
 * cuando se puede, `{ omitido }` cuando no, con el motivo escrito. Ese motivo
 * es lo que después se cuenta y se enseña, y es la diferencia entre un
 * exportador y un exportador honesto.
 */
function aVariable(token, bruto) {
  const v = String(bruto == null ? '' : bruto).trim();
  if (!v) return { omitido: 'sin valor' };
  if (ES_EXPRESION.test(v)) return { omitido: 'expresión CSS: solo un navegador la reduce' };

  const color = aColor(v);
  if (color) return { tipo: 'COLOR', valor: color, hex: aHex(color) };
  if (/^(oklch|rgba?|hsla?|lab|lch|#)/.test(v)) return { omitido: 'color con sintaxis no soportada' };

  if (RELATIVAS.test(v)) return { omitido: 'unidad relativa: Figma no tiene contexto con el que resolverla' };
  const n = aNumero(v);
  if (n !== null) return { tipo: 'FLOAT', valor: n };

  if (/^-?[\d.]+m?s$/.test(v)) return { omitido: 'duración: Figma no guarda tiempo en variables' };
  if (/(^|-)shadow(-|$)/.test(token)) return { omitido: 'sombra: en Figma es un efecto, no una variable' };
  // Estos tres tienen equivalente en Figma, pero no como variable: decir «no
  // traducible» mandaría a buscar donde no hay nada. Decir dónde SÍ está es la
  // diferencia entre un descarte y una indicación.
  if (/^url\(/.test(v)) return { omitido: 'imagen embebida: en Figma es un asset, no una variable' };
  if (/gradient\(/.test(v)) return { omitido: 'degradado: en Figma es un fill, no una variable' };
  if (/^currentcolor$/i.test(v)) return { omitido: 'currentColor es una referencia al contexto, no un color' };
  if (/font-family/.test(token)) return { tipo: 'STRING', valor: v };
  if (PALABRA.test(v) || /^cubic-bezier\(/.test(v)) return { tipo: 'STRING', valor: v };
  return { omitido: 'valor no traducible a una variable de Figma' };
}

// ─── 5 · Propiedad del nodo ──────────────────────────────────────────────────
// El puente que faltaba. `--component-button-border-radius` no le dice a un
// agente qué tocar; `cornerRadius` sí. El orden importa y se prueba de más
// específico a más general: `border-color` y `color` acabarían en el mismo
// sitio si se mirara solo el final del nombre.

const PROPIEDADES = [
  [/(^|-)(border-radius|radius)(-|$)/, 'cornerRadius'],
  [/(^|-)border-width(-|$)/, 'strokeWeight'],
  [/(^|-)(border-color|border)(-|$)/, 'strokes'],
  [/(^|-)(bg|background)(-|$)/, 'fills'],
  [/(^|-)font-family(-|$)/, 'fontName.family'],
  [/(^|-)font-weight(-|$)/, 'fontName.style'],
  [/(^|-)font-size(-|$)/, 'fontSize'],
  [/(^|-)line-height(-|$)/, 'lineHeight'],
  [/(^|-)letter-spacing(-|$)/, 'letterSpacing'],
  [/(^|-)padding-(x|inline)(-|$)/, 'paddingLeft · paddingRight'],
  [/(^|-)padding-(y|block)(-|$)/, 'paddingTop · paddingBottom'],
  [/(^|-)padding(-|$)/, 'paddingLeft · paddingRight · paddingTop · paddingBottom'],
  [/(^|-)gap(-|$)/, 'itemSpacing'],
  [/(^|-)opacity(-|$)/, 'opacity'],
  [/(^|-)shadow(-|$)/, 'effects'],
  [/(^|-)width(-|$)/, 'width'],
  [/(^|-)height(-|$)/, 'height'],
  [/(^|-)size(-|$)/, 'width · height'],
  [/(^|-)color(-|$)/, 'fills'],
];

// Lo que no tiene equivalente se dice, no se calla: un agente que no encuentra
// `transition-duration` en la lista se lo inventaría en algún sitio. `border-style`
// está aquí y no arriba porque Figma no guarda el estilo de un borde en una
// variable: `solid` es el trazo por defecto y lo demás es `dashPattern`.
const SIN_EQUIVALENTE = /(^|-)(transition|duration|easing|z-index|filter|cursor|outline|border-style|offset)(-|$)/;

function propiedadDe(token) {
  const n = token.replace(/^--/, '');
  if (SIN_EQUIVALENTE.test(n)) return null;
  for (let i = 0; i < PROPIEDADES.length; i++) {
    if (PROPIEDADES[i][0].test(n)) return PROPIEDADES[i][1];
  }
  return null;
}

// Que el nombre apunte a una propiedad no significa que el valor sirva para
// ella. `--component-x-border-style: solid` es un STRING y `strokes` espera
// pintura: enchufarlo dejaría en Figma un borde que no es de ningún color.
// El nombre propone y el tipo dispone.
const ACEPTA = {
  COLOR: /^(fills|strokes)$/,
  FLOAT: /^(cornerRadius|strokeWeight|fontSize|lineHeight|letterSpacing|opacity|itemSpacing|padding|width|height)/,
  STRING: /^fontName\./,
};

const encaja = (tipo, propiedad) => Boolean(tipo && propiedad && ACEPTA[tipo] && ACEPTA[tipo].test(propiedad));

// ─── 6 · Estado y variante ───────────────────────────────────────────────────
// Figma no tiene estados: tiene variantes. La correspondencia entre un
// modificador de SYX y una propiedad de variante se deduce del nombre, y eso es
// una INFERENCIA, no un hecho contrastado contra el CSS como sí lo son las
// clases del registro. Va marcada como tal en la salida para que nadie confunda
// las dos cosas.

const ESTADOS = ['hover', 'active', 'disabled', 'focus', 'checked', 'selected'];

const estadoDe = (token) => ESTADOS.find((e) => new RegExp('(^|-)' + e + '(-|$)').test(token)) || 'default';

/** El segmento que aporta un modificador: `atom-btn--size-lg` → `size-lg`. */
const segmentoDe = (modificador) => modificador.split('--').slice(1).join('--');

module.exports = {
  RAIZ_PX,
  aColor,
  aNumero,
  aHex,
  aNombreFigma,
  capaDe,
  aVariable,
  propiedadDe,
  encaja,
  estadoDe,
  segmentoDe,
  ESTADOS,
};
