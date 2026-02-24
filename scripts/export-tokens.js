#!/usr/bin/env node
/**
 * SYX Token Exporter
 * ==================
 * Reads all SCSS token files and generates tokens.json for the Figma plugin.
 *
 * Usage:
 *   node scripts/export-tokens.js
 *
 * Output:
 *   tokens.json (in project root)
 */

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const TOKEN_DIRS = {
  primitives : path.join(__dirname, '../scss/abstracts/tokens/primitives'),
  semantic   : path.join(__dirname, '../scss/abstracts/tokens/semantic'),
  component  : path.join(__dirname, '../scss/abstracts/tokens/components'),
};

const OUT_FILE = path.join(__dirname, '../tokens.json');

// Base font size for rem → px conversion (browser default)
const BASE_FONT_PX = 16;
// Base spacing unit (--primitive-space-base: 0.5rem = 8px)
const BASE_SPACE_PX = 8;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Convert hsl(h, s%, l%) string → #rrggbb hex */
function hslToHex(hslStr) {
  // Match: hsl(44.9, 89.2%, 52.7%)  or  hsl(0, 0%, 100%)
  const m = hslStr.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!m) return null;

  let h = parseFloat(m[1]) / 360;
  let s = parseFloat(m[2]) / 100;
  let l = parseFloat(m[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Parse a rem value string → px number. e.g. "1.25rem" → 20 */
function remToPx(remStr) {
  const val = parseFloat(remStr);
  return isNaN(val) ? null : Math.round(val * BASE_FONT_PX * 100) / 100;
}

/** Extract midpoint value from clamp(min, preferred, max) → px */
function clampMidpointPx(clampStr) {
  // e.g. clamp(0.64rem, 0.61rem + 0.14vw, 0.72rem)
  const inner = clampStr.replace(/^clamp\(/, '').replace(/\)$/, '');
  const parts = inner.split(',').map(s => s.trim());
  if (parts.length < 2) return null;
  // preferred is parts[1], may contain "+ Xvw"  – take only the rem part
  const preferred = parts[1].split('+')[0].trim();
  return remToPx(preferred);
}

/** Resolve a calc() spacing expression → px number
 *  Understands: calc(N * var(--primitive-space-base))
 *               calc(N * var(--primitive-space-base)) // Npx
 *  Returns the pixel value using BASE_SPACE_PX as the base unit. */
function calcSpacePx(calcStr) {
  // Simple pattern: calc(N * var(--primitive-space-base))
  const m = calcStr.match(/calc\(\s*([\d.]+)\s*\*/);
  if (m) return Math.round(parseFloat(m[1]) * BASE_SPACE_PX * 100) / 100;
  return null;
}

/** Resolve a plain pixel/rem/number value to a float */
function resolveNumber(val) {
  val = val.trim();
  if (val === '0') return 0;
  if (val.endsWith('rem')) return remToPx(val);
  if (val.endsWith('px')) return parseFloat(val);
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/** Extract the CSS var name referenced inside var(--xxx) */
function extractVarRef(valStr) {
  const m = valStr.match(/var\((--[\w-]+)\)/);
  return m ? m[1] : null;
}

// ─── CLASSIFIER: determine token type from value ─────────────────────────────

/**
 * Given a CSS custom property name and raw value string, return a typed token:
 * { type: 'COLOR'|'FLOAT'|'STRING'|'ALIAS', value, rawValue }
 */
function classifyToken(name, rawValue) {
  const val = rawValue.trim();

  // Alias: references another var
  if (val.startsWith('var(')) {
    const ref = extractVarRef(val);
    return { type: 'ALIAS', value: ref, rawValue: val };
  }

  // Color: hsl() or hex
  if (val.startsWith('hsl(')) {
    const hex = hslToHex(val);
    return { type: 'COLOR', value: hex || val, rawValue: val };
  }
  if (/^#[0-9a-f]{3,8}$/i.test(val)) {
    return { type: 'COLOR', value: val, rawValue: val };
  }

  // Fluid typography: clamp()
  if (val.startsWith('clamp(')) {
    const px = clampMidpointPx(val);
    return { type: 'FLOAT', value: px, rawValue: val };
  }

  // Spacing: calc()
  if (val.startsWith('calc(')) {
    const px = calcSpacePx(val);
    return { type: 'FLOAT', value: px, rawValue: val };
  }

  // Plain numbers (font weights, line heights, ratios)
  const n = parseFloat(val);
  if (!isNaN(n) && val.match(/^[\d.]+$/)) {
    return { type: 'FLOAT', value: n, rawValue: val };
  }

  // rem/px values
  if (val.endsWith('rem') || val.endsWith('px') || val.endsWith('em')) {
    const px = resolveNumber(val);
    return { type: 'FLOAT', value: px, rawValue: val };
  }

  // Everything else (font-family strings, complex values, etc.)
  return { type: 'STRING', value: val, rawValue: val };
}

// ─── SCSS PARSER ─────────────────────────────────────────────────────────────

/** Parse a single SCSS file and return an array of { name, ...token } objects */
function parseScssFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tokens  = [];

  // Match: --token-name: value;   (value can contain spaces, parens, etc.)
  // Uses a non-greedy match that stops at the semicolon
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const name     = `--${match[1]}`;
    const rawValue = match[2].trim();
    const token    = classifyToken(name, rawValue);
    tokens.push({ name, ...token });
  }

  return tokens;
}

/** Parse all .scss files in a directory and return combined tokens array */
function parseDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`  ⚠️  Directory not found: ${dirPath}`);
    return [];
  }

  const files  = fs.readdirSync(dirPath).filter(f => f.endsWith('.scss') && !f.startsWith('index'));
  const tokens = [];

  for (const file of files) {
    const fp = path.join(dirPath, file);
    const parsed = parseScssFile(fp);
    console.log(`  ✔  ${file} → ${parsed.length} tokens`);
    tokens.push(...parsed);
  }

  return tokens;
}

// ─── TOKEN GROUPER ───────────────────────────────────────────────────────────

/**
 * Convert a flat array of { name, type, value } into a nested object.
 * The name like "--primitive-color-purple-500" becomes:
 *   { primitive: { color: { purple: { "500": { type, value } } } } }
 * but we store it flat under each layer for simpler Figma plugin consumption.
 */
function buildTokenMap(tokens, layerPrefix) {
  const map = {};
  for (const t of tokens) {
    // Strip the layer prefix (e.g. "--primitive-", "--semantic-", "--component-")
    const key = t.name.replace(`--${layerPrefix}-`, '');
    map[t.name] = {
      key,
      type     : t.type,
      value    : t.value,
      rawValue : t.rawValue,
    };
  }
  return map;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log('\n🎨  SYX Token Exporter\n');

const output = {
  _meta: {
    generatedAt : new Date().toISOString(),
    source      : 'SYX Design System — scss/abstracts/tokens/',
    baseFontPx  : BASE_FONT_PX,
    baseSpacePx : BASE_SPACE_PX,
  },
  primitives : {},
  semantic   : {},
  component  : {},
};

// Primitives
console.log('📦  Parsing Primitives...');
const primitiveTokens = parseDir(TOKEN_DIRS.primitives);
output.primitives     = buildTokenMap(primitiveTokens, 'primitive');

// Semantic
console.log('\n🔗  Parsing Semantic...');
const semanticTokens = parseDir(TOKEN_DIRS.semantic);
output.semantic      = buildTokenMap(semanticTokens, 'semantic');

// Component
console.log('\n🧩  Parsing Components...');
const componentTokens = parseDir(TOKEN_DIRS.component);
output.component      = buildTokenMap(componentTokens, 'component');

// Write output
fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

const total = primitiveTokens.length + semanticTokens.length + componentTokens.length;
console.log(`\n✅  Done! ${total} tokens exported → tokens.json`);
console.log(`   Primitives : ${primitiveTokens.length}`);
console.log(`   Semantic   : ${semanticTokens.length}`);
console.log(`   Component  : ${componentTokens.length}`);
console.log(`\n💡  Next step: Load this file in the Figma plugin.\n`);
