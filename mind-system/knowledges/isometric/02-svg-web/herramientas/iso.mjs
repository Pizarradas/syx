// iso.mjs — Generador de primitivas flat isométricas en SVG, sin dependencias.
// Uso como módulo: import { prism, cylinder, scene } from './iso.mjs'
// Uso CLI:        node iso.mjs demo [iso|dimetric] > demo.svg
//                 node iso.mjs build escena.json > escena.svg   (escena descrita como datos, ver build())
//
// Convención de ejes (mundo): x → abajo-derecha, y → abajo-izquierda, z → arriba.
// El observador mira desde la esquina +x +y; caras visibles: top (z máx),
// right (x máx) y left (y máx).

const C30 = Math.cos(Math.PI / 6); // 0.8660254
const S30 = 0.5;

// Proyecciones. 'iso' = isométrica real (30°). 'dimetric' = 2:1 (26.565°), la de pixel art y CSS rotateX(60deg).
export const PROJECTIONS = {
  iso: { kx: C30, ky: S30, kz: 1 },
  dimetric: { kx: 1, ky: 0.5, kz: 1 },
};

export function project([x, y, z], mode = 'iso', unit = 1) {
  const p = PROJECTIONS[mode];
  return [((x - y) * p.kx) * unit, ((x + y) * p.ky - z * p.kz) * unit];
}

const r2 = (n) => Math.round(n * 100) / 100;
const pts = (list, mode, unit) => list.map((v) => project(v, mode, unit).map(r2).join(',')).join(' ');

// ---------- Color ----------
function hexToHsl(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
const towards = (h, target, amt) => { const d = ((target - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), amt); };

// Tres tonos por material: top (más claro, ligeramente cálido), left (base), right (más oscuro, ligeramente frío).
// light: 'left' (luz desde arriba-izquierda, por defecto) o 'right' (intercambia los laterales).
export function shade(hex, { light = 'left', up = 12, down = 16, hueShift = 6 } = {}) {
  const [h, s, l] = hexToHsl(hex);
  const top = hslToHex(towards(h, 50, hueShift), s, l + up);
  const mid = hex.toLowerCase();
  const dark = hslToHex(towards(h, 230, hueShift), s * 0.85, l - down);
  return light === 'left' ? { top, left: mid, right: dark } : { top, left: dark, right: mid };
}

// Relleno de una cara: color hex directo, o token CSS si el objeto trae `token`
// (style="fill:var(--<prefix>-<token>-top)"; var() en style es fiable, en el atributo fill no).
function faceFill(o, c, face) {
  return o.token
    ? `style="fill:var(--${o.prefix || 'iso'}-${o.token}-${face})"`
    : `fill="${c[face]}"`;
}
const partAttrs = (id, cls, depth) =>
  `${id ? ` id="${id}" data-iso-part="${id}"` : ''} class="${cls}" data-depth="${depth}"`;

// Tokens CSS con los tres tonos de cada color: paletteCSS({ azul: '#5b8def' }, { prefix: 'umbra' })
export function paletteCSS(palette, { prefix = 'iso', light, selector = ':root' } = {}) {
  const lines = Object.entries(palette).flatMap(([name, hex]) => {
    const c = shade(hex, { light });
    return ['top', 'left', 'right'].map((f) => `  --${prefix}-${name}-${f}: ${c[f]};`);
  });
  return `${selector} {\n${lines.join('\n')}\n}`;
}

// ---------- Primitivas ----------
// Prisma rectangular. (x,y,z) = esquina mínima; w a lo largo de x, d a lo largo de y, h a lo largo de z.
export function prism(o) {
  const { id, x = 0, y = 0, z = 0, w = 1, d = 1, h = 1, color = '#5b8def', light, mode = 'iso', unit = 40, stroke } = o;
  const c = shade(color, { light });
  const X = x + w, Y = y + d, Z = z + h;
  const st = stroke ? ` stroke="${stroke}" stroke-linejoin="round"` : '';
  return `<g${partAttrs(id, 'iso-prism', r2(x + y + z))}>` +
    `<polygon class="face-left" ${faceFill(o, c, 'left')}${st} points="${pts([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], mode, unit)}"/>` +
    `<polygon class="face-right" ${faceFill(o, c, 'right')}${st} points="${pts([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], mode, unit)}"/>` +
    `<polygon class="face-top" ${faceFill(o, c, 'top')}${st} points="${pts([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], mode, unit)}"/>` +
    `</g>`;
}

// Cilindro vertical. (cx,cy) = centro de la base en el plano del suelo; r = radio; h = altura.
// Un círculo del suelo se proyecta como elipse alineada con la pantalla: rx = r·√2·kx, ry = r·√2·ky.
export function cylinder(o) {
  const { id, cx = 0, cy = 0, z = 0, r = 0.5, h = 1, color = '#f2a541', light, mode = 'iso', unit = 40 } = o;
  const p = PROJECTIONS[mode];
  const c = shade(color, { light });
  const rx = r2(r * Math.SQRT2 * p.kx * unit), ry = r2(r * Math.SQRT2 * p.ky * unit);
  const [bx, by] = project([cx, cy, z], mode, unit).map(r2);
  const [tx, ty] = project([cx, cy, z + h], mode, unit).map(r2);
  const body = `M${r2(bx - rx)},${ty} L${r2(bx - rx)},${by} A${rx},${ry} 0 0 0 ${r2(bx + rx)},${by} L${r2(bx + rx)},${ty} Z`;
  // Cuerpo con degradado duro de 2 tonos (mitad iluminada / mitad en sombra) sin <linearGradient>: dos medios cuerpos.
  const leftHalf = `M${r2(bx - rx)},${ty} L${r2(bx - rx)},${by} A${rx},${ry} 0 0 0 ${bx},${r2(by + ry)} L${bx},${r2(ty + ry)} A${rx},${ry} 0 0 1 ${r2(bx - rx)},${ty} Z`;
  return `<g${partAttrs(id, 'iso-cylinder', r2(cx + cy + z))}>` +
    `<path class="face-right" ${faceFill(o, c, 'right')} d="${body}"/>` +
    `<path class="face-left" ${faceFill(o, c, 'left')} d="${leftHalf}"/>` +
    `<ellipse class="face-top" ${faceFill(o, c, 'top')} cx="${tx}" cy="${ty}" rx="${rx}" ry="${ry}"/>` +
    `</g>`;
}

// Sombra proyectada plana (luz direccional): polígono del contorno en el suelo desplazado en la dirección de la luz.
export function flatShadow({ id, x = 0, y = 0, z = 0, w = 1, d = 1, h = 1, dir = [0.6, 0.25], mode = 'iso', unit = 40, color = '#000', opacity = 0.12, tokens = false, prefix = 'iso' }) {
  const [sx, sy] = [dir[0] * h, dir[1] * h];
  // z = altura del plano que recibe la sombra (suelo o plataforma).
  const ring = [[x, y, z], [x + w, y, z], [x + w + sx, y + sy, z], [x + w + sx, y + d + sy, z], [x + sx, y + d + sy, z], [x, y + d, z]];
  const fill = tokens ? `style="fill:var(--${prefix}-sombra)"` : `fill="${color}"`;
  const of = id ? ` data-iso-shadow-of="${id}"` : '';
  return `<polygon class="iso-shadow"${of} ${fill} fill-opacity="${opacity}" points="${pts(ring, mode, unit)}"/>`;
}

// Dirección de la sombra en el suelo por unidad de altura según el lado de la luz (igual que los scripts de Blender).
export const shadowDir = (light = 'left') => (light === 'right' ? [0.25, 0.6] : [0.6, 0.25]);

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// Sombra de un cilindro vertical: casco convexo del círculo base y del círculo desplazado por la luz (exacta: es convexa).
export function cylinderShadow({ id, cx = 0, cy = 0, z = 0, r = 0.5, h = 1, dir = [0.6, 0.25], mode = 'iso', unit = 40, color = '#000', opacity = 0.12, tokens = false, prefix = 'iso', segments = 32 }) {
  const ring = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * 2 * Math.PI, ox = Math.cos(t) * r, oy = Math.sin(t) * r;
    ring.push([cx + ox, cy + oy], [cx + ox + dir[0] * h, cy + oy + dir[1] * h]);
  }
  const fill = tokens ? `style="fill:var(--${prefix}-sombra)"` : `fill="${color}"`;
  const of = id ? ` data-iso-shadow-of="${id}"` : '';
  return `<polygon class="iso-shadow"${of} ${fill} fill-opacity="${opacity}" points="${pts(hull(ring).map(([x, y]) => [x, y, z]), mode, unit)}"/>`;
}

// Orden del pintor: atrás → delante. Válido para cajas que no se interpenetran y con tamaños similares.
// Para escenas complejas, construye un grafo "está detrás de" y ordénalo topológicamente.
export function depthSort(items) {
  const key = (o) => (o.cx ?? (o.x ?? 0) + (o.w ?? 0) / 2) + (o.cy ?? (o.y ?? 0) + (o.d ?? 0) / 2);
  return [...items].sort((a, b) => key(a) - key(b) || (a.z ?? 0) - (b.z ?? 0));
}

// Escena accesible: role="img" + <title>/<desc>; viewBox centrado en el origen del mundo.
// Sin width/height: el tamaño lo decide el contenedor. `css` se incrusta en <style> (tokens, animaciones).
export function scene(children, { width = 640, height = 480, title = 'Ilustración isométrica', desc = '', bg, css = '', tokens = false, prefix = 'iso' } = {}) {
  const bgFill = tokens ? `style="fill:var(--${prefix}-fondo)"` : `fill="${bg}"`;
  const vb = `${-width / 2} ${-height * 0.65} ${width} ${height}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-labelledby="iso-title iso-desc">` +
    `<title id="iso-title">${title}</title><desc id="iso-desc">${desc}</desc>` +
    (css ? `<style>${css}</style>` : '') +
    (bg ? `<rect class="iso-bg" x="${-width / 2}" y="${-height * 0.65}" width="${width}" height="${height}" ${bgFill}/>` : '') +
    children.join('') + `</svg>`;
}

// ---------- Escena como datos ----------
// build({ mode, unit, light, prefix, palette, title, desc, bg, width, height, css, base, objects, shadows })
//  - objects: [{ kind: 'prism'|'cylinder', id, x,y,z,w,d,h | cx,cy,z,r,h, color | token }]
//  - base: un objeto (losa) que se pinta primero; shadows: true para sombras planas de los prismas.
//  - palette: { nombre: '#hex' } → genera tokens --<prefix>-<nombre>-top/left/right en <style>.
export function build(spec) {
  const { mode = 'iso', unit = 40, light, prefix = 'iso', palette, objects = [], base, shadows = true } = spec;
  const tokens = objects.some((i) => i.token) || Boolean(base?.token);
  const o = { mode, unit, light, prefix, tokens };
  const draw = (i) => (i.kind === 'cylinder' ? cylinder({ ...o, ...i }) : prism({ ...o, ...i }));
  const parts = [];
  if (base) parts.push(draw(base));
  if (shadows) {
    // Las sombras caen en el plano de la losa (o del suelo) y se desplazan según el lado de la luz.
    const sz = base ? (base.z ?? 0) + (base.h ?? 0) : 0;
    const dir = shadowDir(light);
    const sh = objects.map((i) => {
      const s = { ...o, ...i, dir, h: (i.h ?? 1) + (i.z ?? 0) - sz, z: sz };
      return i.kind === 'cylinder' ? cylinderShadow(s) : flatShadow(s);
    }).join('');
    // Con losa, las sombras se recortan a su cara superior para que no caigan en el vacío.
    if (base && base.kind !== 'cylinder') {
      const { x = 0, y = 0, w = 1, d = 1 } = base;
      const top = pts([[x, y, sz], [x + w, y, sz], [x + w, y + d, sz], [x, y + d, sz]], mode, unit);
      parts.push(`<defs><clipPath id="iso-clip-base"><polygon points="${top}"/></clipPath></defs>` +
        `<g class="iso-sombras" clip-path="url(#iso-clip-base)">${sh}</g>`);
    } else {
      parts.push(`<g class="iso-sombras">${sh}</g>`);
    }
  }
  parts.push(...depthSort(objects).map(draw));
  const extra = tokens
    ? `:root {\n  --${prefix}-fondo: ${spec.bg || 'transparent'};\n  --${prefix}-sombra: ${spec.shadow || '#000'};\n}`
    : '';
  const css = [palette ? paletteCSS(palette, { prefix, light }) : '', extra, spec.css || ''].join('\n').trim();
  return scene(parts, { ...spec, css, tokens, prefix });
}

// ---------- Demo ----------
const isMain = typeof process !== 'undefined' && process.argv?.[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain && process.argv[2] === 'build') {
  const { readFileSync } = await import('node:fs');
  process.stdout.write(build(JSON.parse(readFileSync(process.argv[3], 'utf8'))) + '\n');
}
if (isMain && process.argv[2] === 'demo') {
  const mode = process.argv[3] || 'iso';
  const u = 40, o = { mode, unit: u };
  const items = [
    { kind: 'prism', id: 'base', x: -3, y: -3, z: 0, w: 6, d: 6, h: 0.4, color: '#c9d6e8' },
    { kind: 'prism', id: 'torre', x: -2, y: -2, z: 0.4, w: 1.5, d: 1.5, h: 3, color: '#5b8def' },
    { kind: 'prism', id: 'bloque', x: 0.6, y: -1.8, z: 0.4, w: 1.6, d: 1, h: 1.2, color: '#ef6f6c' },
    { kind: 'cylinder', id: 'tanque', cx: 1.2, cy: 1.4, z: 0.4, r: 0.8, h: 1.6, color: '#f2a541' },
    { kind: 'prism', id: 'caja', x: -1.6, y: 0.8, z: 0.4, w: 1, d: 1, h: 0.8, color: '#56c596' },
  ];
  const shadows = items.filter((i) => i.kind === 'prism' && i.id !== 'base')
    .map((i) => flatShadow({ ...i, ...o }));
  const body = depthSort(items.filter((i) => i.id !== 'base')).map((i) => i.kind === 'prism' ? prism({ ...i, ...o }) : cylinder({ ...i, ...o }));
  process.stdout.write(scene([prism({ ...items[0], ...o }), ...shadows, ...body], { title: 'Demo isométrica', desc: 'Plataforma con torre, bloque, tanque y caja en estilo flat isométrico.', bg: '#f6f4ef' }) + '\n');
}
