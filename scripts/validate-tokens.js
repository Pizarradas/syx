#!/usr/bin/env node
/**
 * SYX Token Validator
 * ───────────────────
 * Cross-checks the tokens.json registry against SCSS token definitions.
 * Detects:
 *   1. CSS custom properties defined in SCSS but missing from tokens.json
 *   2. Entries in tokens.json with no corresponding SCSS definition
 *   3. Primitive token violations in component files
 *
 * Usage:
 *   node scripts/validate-tokens.js
 *   node scripts/validate-tokens.js --strict   (exits with code 1 on any issue)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_JSON = path.join(ROOT, 'tokens.json');
const SCSS_TOKENS_DIR = path.join(ROOT, 'scss', 'abstracts', 'tokens');
const SCSS_COMPONENTS_DIR = path.join(ROOT, 'scss');

const STRICT = process.argv.includes('--strict');

// ─── Helpers ────────────────────────────────────────────────────────────────

function readAllScssFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readAllScssFiles(fullPath));
    } else if (entry.name.endsWith('.scss')) {
      results.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf8') });
    }
  }
  return results;
}

function extractCustomProps(content) {
  const regex = /--([\w-]+)\s*:/g;
  const props = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    props.add(`--${match[1]}`);
  }
  return props;
}

function flattenTokensJson(obj, prefix = '') {
  const result = new Set();
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}-${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const nested = flattenTokensJson(val, fullKey);
      nested.forEach(k => result.add(k));
    } else {
      result.add(`--${fullKey}`);
    }
  }
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('\n┌─────────────────────────────────────────────────────────────┐');
console.log('│  SYX Token Validator                                        │');
console.log('└─────────────────────────────────────────────────────────────┘\n');

let hasErrors = false;
let hasWarnings = false;

// ── Step 1: Read tokens.json ────────────────────────────────────────────────
let tokensJson = {};
if (fs.existsSync(TOKENS_JSON)) {
  try {
    tokensJson = JSON.parse(fs.readFileSync(TOKENS_JSON, 'utf8'));
    console.log(`✅ tokens.json loaded (${TOKENS_JSON})`);
  } catch (e) {
    console.error(`❌ Failed to parse tokens.json: ${e.message}`);
    process.exit(1);
  }
} else {
  console.warn('⚠️  tokens.json not found — skipping JSON cross-check.');
}
const jsonTokens = flattenTokensJson(tokensJson);
console.log(`   Found ${jsonTokens.size} token definitions in tokens.json\n`);

// ── Step 2: Scan SCSS token definitions ───────────────────────────────────────
const scssTokenFiles = readAllScssFiles(SCSS_TOKENS_DIR);
const scssDefinedTokens = new Set();
scssTokenFiles.forEach(({ content }) => {
  extractCustomProps(content).forEach(p => scssDefinedTokens.add(p));
});
console.log(`✅ SCSS token files scanned: ${scssTokenFiles.length} files`);
console.log(`   Found ${scssDefinedTokens.size} custom property definitions\n`);

// ── Step 3: Cross-check ───────────────────────────────────────────────────────
const onlyInScss = [...scssDefinedTokens].filter(t => !jsonTokens.has(t) && t.startsWith('--component-'));
const onlyInJson = [...jsonTokens].filter(t => !scssDefinedTokens.has(t) && t.startsWith('--component-'));

if (onlyInScss.length > 0) {
  hasWarnings = true;
  console.log(`⚠️  COMPONENT tokens defined in SCSS but missing from tokens.json (${onlyInScss.length}):`);
  onlyInScss.forEach(t => console.log(`   → ${t}`));
  console.log();
}

if (onlyInJson.length > 0) {
  hasWarnings = true;
  console.log(`⚠️  COMPONENT tokens in tokens.json but not found in SCSS (${onlyInJson.length}):`);
  onlyInJson.forEach(t => console.log(`   → ${t}`));
  console.log();
}

if (onlyInScss.length === 0 && onlyInJson.length === 0) {
  console.log('✅ Cross-check: SCSS and tokens.json are in sync for --component-* tokens\n');
}

// ── Step 4: Primitive violation scan ──────────────────────────────────────────
const EXCLUDE_PATTERNS = [
  /themes[/\\].*_theme\.scss$/,
  /primitives[/\\]/,
  /_reset\.scss$/,
  /_legacy-aliases\.scss$/,
];

function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCLUDE_PATTERNS.some(p => p.test(normalized));
}

const allScssFiles = readAllScssFiles(path.join(ROOT, 'scss'));
const violations = [];

allScssFiles.forEach(({ path: filePath, content }) => {
  if (isExcluded(filePath)) return;
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    // Match var(--primitive-*) usage, ignoring SCSS comments
    if (/var\(--primitive-/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      violations.push({
        file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
        line: i + 1,
        content: line.trim()
      });
    }
  });
});

if (violations.length > 0) {
  hasErrors = true;
  console.log(`❌ PRIMITIVE TOKEN VIOLATIONS: ${violations.length} instances where --primitive-* tokens`);
  console.log('   are used directly in component/page files (must go through --semantic-*):\n');
  violations.forEach(v => {
    console.log(`   ${v.file}:${v.line}`);
    console.log(`     ${v.content}\n`);
  });
} else {
  console.log('✅ No primitive token violations found in component/page files\n');
}

// ── Step 5: !important scan ────────────────────────────────────────────────────
const importantViolations = [];
allScssFiles.forEach(({ path: filePath, content }) => {
  if (isExcluded(filePath)) return;
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/!important/.test(line) && !line.trim().startsWith('//')) {
      importantViolations.push({
        file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
        line: i + 1,
        content: line.trim()
      });
    }
  });
});

if (importantViolations.length > 0) {
  hasErrors = true;
  console.log(`❌ !important VIOLATIONS: ${importantViolations.length} instances found:`);
  importantViolations.forEach(v => {
    console.log(`   ${v.file}:${v.line} → ${v.content}`);
  });
  console.log();
} else {
  console.log('✅ No !important violations found\n');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('┌─────────────────────────────────────────────────────────────┐');
if (hasErrors) {
  console.log('│  Result: ❌ FAILED — errors must be fixed before release    │');
} else if (hasWarnings) {
  console.log('│  Result: ⚠️  PASSED WITH WARNINGS — review recommended      │');
} else {
  console.log('│  Result: ✅ PASSED — all checks clean                       │');
}
console.log('└─────────────────────────────────────────────────────────────┘\n');

if (STRICT && (hasErrors || hasWarnings)) {
  process.exit(1);
}
if (hasErrors) {
  process.exit(1);
}
