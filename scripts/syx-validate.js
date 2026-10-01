#!/usr/bin/env node
/**
 * SYX Validate — Unified Contract Validator v2.0
 * ───────────────────────────────────────────────
 * Implements contracts/rules.json as executable checks.
 * Generates the full /contracts/ layer on every run.
 *
 * Las reglas de árbol (R01–R04, R09, R10) las pasa scripts/lib/rules.js, el
 * mismo motor que validate_snippet. Las severidades, las rutas permitidas y
 * los prefijos oficiales se leen de contracts/rules.json: aquí no hay ninguna
 * copia de esas decisiones.
 *
 * Usage:
 *   node scripts/syx-validate.js                  — console report only
 *   node scripts/syx-validate.js --report          — console + writes contract files
 *   node scripts/syx-validate.js --strict          — exit 1 if any error/warning
 *   node scripts/syx-validate.js --report --strict — full run, CI-safe
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT          = path.resolve(__dirname, '..');
const CSS_REF       = path.join(ROOT, 'css', 'styles-theme-example-01.css');
const TOKENS_JSON   = path.join(ROOT, 'tokens.json');
const CONTRACTS_DIR = path.join(ROOT, 'contracts');
const SCSS_DIR      = path.join(ROOT, 'scss');

const WRITE_REPORT  = process.argv.includes('--report');
const STRICT        = process.argv.includes('--strict');

// El contrato manda. Hasta octubre de 2026 este fichero lo leía (parseRules)
// y no lo usaba: tenía su propia lista de rutas para R01, que además permitía
// scss/pages/ cuando el contrato lo prohíbe.
const { crearMotor } = require('./lib/rules');
const MOTOR = crearMotor({ root: ROOT });
const RULES = MOTOR.contrato;
const OFFICIAL_PREFIXES = RULES.officialPrefixes;
const severityOf = (id) => MOTOR.severidad(id);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readAllScss(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...readAllScss(fp));
    else if (entry.name.endsWith('.scss'))
      results.push({ path: fp, rel: path.relative(ROOT, fp).replace(/\\/g, '/'), content: fs.readFileSync(fp, 'utf8') });
  }
  return results;
}

function flattenTokensJson(obj) {
  // tokens.json has top-level sections: "primitives", "semantic", "components"
  // Each section is a flat map of "--token-name": { value, rawValue, type, key }
  // Keys already ARE the full CSS custom property names.
  const result = {};

  for (const [sectionKey, sectionVal] of Object.entries(obj)) {
    if (sectionKey === '_meta') continue;
    if (typeof sectionVal !== 'object' || sectionVal === null) continue;

    for (const [tokenKey, tokenVal] of Object.entries(sectionVal)) {
      if (tokenKey.startsWith('--')) {
        // Direct flat token map (the standard tokens.json format)
        result[tokenKey] = tokenVal;
      } else if (typeof tokenVal === 'object' && !('value' in tokenVal)) {
        // Nested group — recurse one level
        for (const [innerKey, innerVal] of Object.entries(tokenVal)) {
          if (innerKey.startsWith('--')) {
            result[innerKey] = innerVal;
          }
        }
      }
    }
  }
  return result;
}


function isOfficial(prop) {
  return OFFICIAL_PREFIXES.some(p => prop.startsWith(p));
}

// ─── Module 2: Extract Runtime Tokens from CSS ───────────────────────────────

function extractRuntimeTokens() {
  if (!fs.existsSync(CSS_REF)) {
    console.warn(`⚠️  Reference CSS not found: ${CSS_REF}`);
    return { tokens: {}, stats: { total: 0, official: 0, legacy: 0 } };
  }

  const css    = fs.readFileSync(CSS_REF, 'utf8');
  const tokens = {};

  // Find all CSS custom property declarations globally.
  // Pattern: `--prop-name: value;`  (must start after whitespace or { )
  // We use a global regex across the whole file.
  const propRe = /(?:^|[{;,\s])(--[\w-]+)\s*:\s*([^;}\n]+)/gm;

  // Build a simple selector context map: scan for blocks that define
  // custom properties right after a selector line (the line above a { block).
  // We do this in a single forward pass.
  const lines = css.split('\n');
  let currentSel = ':root';

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect selector-style lines (no colon for property, ends with { or is just {)
    if (/^[^{]+\{$/.test(trimmed)) {
      // Extract the selector part before {
      currentSel = trimmed.replace(/\s*\{$/, '').trim() || ':root';
    } else if (trimmed === '{') {
      // anonymous open — keep currentSel
    } else if (trimmed === '}' || trimmed === '};') {
      currentSel = ':root'; // reset after block
    }

    // Match custom property declarations on this line
    const declRe = /(--[\w-]+)\s*:\s*([^;}\n]+)/g;
    let match;
    while ((match = declRe.exec(trimmed)) !== null) {
      const prop     = match[1];
      const rawValue = match[2].trim();

      if (!tokens[prop]) {
        tokens[prop] = {
          value:           rawValue,
          usedInSelectors: []
        };
      }
      if (!tokens[prop].usedInSelectors.includes(currentSel)) {
        tokens[prop].usedInSelectors.push(currentSel);
      }
    }
  }

  // Classify each token by prefix
  for (const prop of Object.keys(tokens)) {
    let category = 'legacy';
    for (const prefix of OFFICIAL_PREFIXES) {
      if (prop.startsWith(prefix)) {
        category = prefix.replace(/^--/, '').replace(/-$/, '');
        break;
      }
    }
    tokens[prop].category = category;
  }

  return {
    tokens,
    stats: {
      total:    Object.keys(tokens).length,
      official: Object.values(tokens).filter(t => t.category !== 'legacy').length,
      legacy:   Object.values(tokens).filter(t => t.category === 'legacy').length,
    }
  };
}


// ─── Module 3: Cross-Check Source vs Runtime ─────────────────────────────────

// Tokens oficiales que solo declara la carpeta de algún tema (no el árbol
// común). Los que declaran TODOS los temas sí están en tokens.json (contrato de
// tema) y no llegan a preguntarse aquí.
function tokensPrivadosDeTema() {
  const { leerDeclaraciones } = require('./lib/scss-tokens');
  const dir = path.join(ROOT, 'scss', 'themes');
  const out = new Set();
  for (const t of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!t.isDirectory() || t.name.startsWith('_')) continue;
    for (const f of fs.readdirSync(path.join(dir, t.name)).filter(x => x.endsWith('.scss'))) {
      for (const d of leerDeclaraciones(fs.readFileSync(path.join(dir, t.name, f), 'utf8'))) {
        if (isOfficial(d.name)) out.add(d.name);
      }
    }
  }
  return out;
}

function crossCheck(sourceTokens, runtimeData) {
  const runtimeKeys = new Set(Object.keys(runtimeData.tokens));
  const sourceKeys  = new Set(Object.keys(sourceTokens));

  // Phantoms: in tokens.json but not in runtime CSS.
  // Exclude tokens with status "deprecated" or "reserved" — these are intentionally
  // not emitted in runtime and carry explicit documentation for why they're absent.
  const phantoms = [...sourceKeys].filter(k => {
    if (runtimeKeys.has(k)) return false;
    const status = sourceTokens[k]?.status;
    if (status === 'deprecated' || status === 'reserved') return false;
    return true;
  });
  // R05: any official-prefix token in CSS not in tokens.json (previously only --component-*)
  //
  // Desde octubre de 2026 tokens.json se genera desde el SCSS y deja fuera, a
  // propósito, los tokens PRIVADOS de un tema: los que declara su
  // scss/themes/<tema>/ y no todos los temas (su paleta propia). El CSS de
  // referencia es un tema concreto, así que los suyos aparecen aquí; se
  // cuentan aparte para que no se confundan con un token común sin registrar,
  // que es lo que R05 vigila.
  const privados = tokensPrivadosDeTema();
  const fuera = [...runtimeKeys].filter(k => !sourceKeys.has(k) && isOfficial(k));
  const undocumented = fuera.filter(k => !privados.has(k));
  const themePrivate = fuera.filter(k => privados.has(k));

  return { phantoms, undocumented, themePrivate };
}

// ─── Module 4: Catalog Legacy Vars ───────────────────────────────────────────

function catalogLegacyVars(runtimeData) {
  // Patterns for automatic classification
  // keep  → external dependency or intentional local variable
  // migrate → has a clear SYX replacement
  // kill  → orphaned, no replacement needed

  const KEEP_PATTERNS = [
    /^--lc-/,           // Lucide icon CSS vars
    /^--icon-/,         // explicit icon namespace
    /^--form-/,         // form aliases (defined in _token-aliases.scss intentionally)
    /^--layout-/,       // layout tokens (already treated as official but may appear as legacy)
    /^--swiper-/,       // 3rd-party slider
    /^--highlight-/,    // syntax highlighting
  ];

  // Migration map: legacy var → recommended SYX replacement
  const MIGRATION_MAP = {
    '--base-measure':              { replacedBy: '--primitive-space-base',           replaceWith: 'var(--primitive-space-base)' },
    '--color-blue':                { replacedBy: '--primitive-color-blue-500',        replaceWith: 'var(--primitive-color-blue-500)' },
    '--color-green':               { replacedBy: '--primitive-color-green-500',       replaceWith: 'var(--primitive-color-green-500)' },
    '--color-pink':                { replacedBy: '--primitive-color-pink-500',        replaceWith: 'var(--primitive-color-pink-500)' },
    '--color-pink-lt-1':           { replacedBy: '--primitive-color-pink-100',        replaceWith: 'var(--primitive-color-pink-100)' },
    '--color-purple':              { replacedBy: '--primitive-color-purple-500',      replaceWith: 'var(--primitive-color-purple-500)' },
    '--color-yellow':              { replacedBy: '--primitive-color-yellow-500',      replaceWith: 'var(--primitive-color-yellow-500)' },
    '--color-primary':             { replacedBy: '--semantic-color-primary',          replaceWith: 'var(--semantic-color-primary)' },
    '--color-secondary':           { replacedBy: '--semantic-color-secondary',        replaceWith: 'var(--semantic-color-secondary)' },
    '--color-secondary-lt-1':      { replacedBy: '--primitive-color-pink-100',        replaceWith: 'var(--primitive-color-pink-100)' },
    '--color-tertiary':            { replacedBy: '--semantic-color-tertiary',         replaceWith: 'var(--semantic-color-tertiary)' },
    '--color-quaternary':          { replacedBy: '--semantic-color-quaternary',       replaceWith: 'var(--semantic-color-quaternary)' },
    '--color-quinary':             { replacedBy: '--semantic-color-quinary',          replaceWith: 'var(--semantic-color-quinary)' },
    '--color-action-link':         { replacedBy: '--semantic-color-link-default',     replaceWith: 'var(--semantic-color-link-default)' },
    '--color-action-selection':    { replacedBy: '--semantic-color-selection-bg',     replaceWith: 'var(--semantic-color-selection-bg)' },
    '--background-action-selection':{ replacedBy: '--semantic-color-selection-bg',    replaceWith: 'var(--semantic-color-selection-bg)' },
    '--color-state-focus':         { replacedBy: '--semantic-color-state-focus',      replaceWith: 'var(--semantic-color-state-focus)' },
    '--color-state-hover-primary': { replacedBy: '--semantic-color-state-hover-primary', replaceWith: 'var(--semantic-color-state-hover-primary)' },
    '--color-state-ok':            { replacedBy: '--semantic-color-state-success',    replaceWith: 'var(--semantic-color-state-success)' },
    '--color-state-ko':            { replacedBy: '--semantic-color-state-error',      replaceWith: 'var(--semantic-color-state-error)' },
    '--color-state-warning':       { replacedBy: '--semantic-color-state-warning',    replaceWith: 'var(--semantic-color-state-warning)' },
    '--color-state-disabled':      { replacedBy: '--semantic-color-state-disabled',   replaceWith: 'var(--semantic-color-state-disabled)' },
    '--font-family-1':             { replacedBy: '--semantic-font-family-body',       replaceWith: 'var(--semantic-font-family-body)' },
    '--font-family-2':             { replacedBy: '--semantic-font-family-heading',    replaceWith: 'var(--semantic-font-family-heading)' },
    '--font-weight-1':             { replacedBy: '--primitive-font-weight-regular',   replaceWith: 'var(--primitive-font-weight-regular)' },
    '--font-weight-2':             { replacedBy: '--primitive-font-weight-bold',      replaceWith: 'var(--primitive-font-weight-bold)' },
  };

  const legacy = {};

  for (const [prop, data] of Object.entries(runtimeData.tokens)) {
    if (data.category !== 'legacy') continue;

    let status         = 'kill';   // default: candidate for removal
    let recommendation = 'Remove — no known SYX equivalent. Verify no active usage.';
    let replacedBy     = null;
    let replaceWith    = null;

    // 1. Check keep patterns
    if (KEEP_PATTERNS.some(re => re.test(prop))) {
      status         = 'keep';
      recommendation = 'Keep — external dependency or intentional local contract.';
    }
    // 2. Check migration map
    else if (MIGRATION_MAP[prop]) {
      status         = 'migrate';
      replacedBy     = MIGRATION_MAP[prop].replacedBy;
      replaceWith    = MIGRATION_MAP[prop].replaceWith;
      recommendation = `Migrate → ${replacedBy}`;
    }
    // 3. Heuristic: old DS color/font/gap patterns not in migration map
    else if (/^--(color|background|font|gap|dimension|inner|arrow)-/.test(prop)) {
      status         = 'migrate';
      recommendation = 'Migrate — has a likely SYX semantic equivalent. Review manually to confirm replacement.';
    }

    legacy[prop] = {
      value:           data.value,
      usedInSelectors: data.usedInSelectors,
      status,
      recommendation,
      ...(replacedBy  && { replacedBy }),
      ...(replaceWith && { replaceWith })
    };
  }

  return legacy;
}


// ─── Module 5: Build Token Usage Map from SCSS ───────────────────────────────

function buildUsageMap(scssFiles, runtimeData) {
  const map = {};
  const varRefRe = /var\(--([\w-]+)(?:,\s*[^)]+)?\)/g;

  for (const { rel, content } of scssFiles) {
    let match;
    while ((match = varRefRe.exec(content)) !== null) {
      const prop = `--${match[1]}`;
      if (!map[prop]) map[prop] = { usages: [] };
      if (!map[prop].usages.includes(rel)) {
        map[prop].usages.push(rel);
      }
    }
    varRefRe.lastIndex = 0;
  }

  // Tag tokens that are defined but never used in SCSS
  const runtimeKeys = Object.keys(runtimeData.tokens);
  for (const prop of runtimeKeys) {
    if (!map[prop]) {
      map[prop] = { usages: [], note: 'defined in CSS/tokens.json but no var() usage found in SCSS (may be set directly)' };
    }
  }

  return map;
}

// ─── Module 6: SCSS Rule Checks (R01–R04, R09, R10) ──────────────────────────
// Las reglas viven en lib/rules.js desde v4.15.0: el servidor MCP las necesita
// para validar un fragmento ANTES de que se escriba, y dos copias de las mismas
// reglas acaban diciendo cosas distintas. Desde octubre de 2026 van sobre el
// árbol (postcss-scss) y no por líneas.

// ─── R08: tokens del registro que no usa nadie ───────────────────────────────
// Se mide sobre el CSS COMPILADO de todos los temas y no sobre el SCSS: el SCSS
// construye nombres por interpolación (`var(--component-button-#{$v}-bg)`) y
// un grep ahí daría falsos positivos. Solo tiers semántico y de componente: una
// rampa de primitivos es una paleta completa a propósito, no deuda.
function unusedRegistryTokens() {
  const raw = JSON.parse(fs.readFileSync(TOKENS_JSON, 'utf8'));
  const cssDir = path.join(ROOT, 'css');
  const css = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))
    .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');
  const usados = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  const sinUso = [];
  for (const tier of ['semantic', 'component']) {
    for (const [nombre, def] of Object.entries(raw[tier] || {})) {
      if (def && def.status === 'deprecated') continue;
      if (!usados.has(nombre)) sinUso.push(nombre);
    }
  }
  return sinUso.sort();
}

function runScssChecks(scssFiles) {
  const r = MOTOR.revisarTodos(scssFiles);
  // Un fichero que no parsea no se puede declarar conforme: va como error.
  return { ...r.violaciones, sintaxis: r.sintaxis, excepciones: r.excepciones };
}

// Las reglas de árbol en el orden del contrato, con su clave para lint-contract.
const AST_RULES = MOTOR.reglas.map((r) => ({ id: r.id, label: r.resumen || r.description, severity: r.severity }));


// ─── Module 7: Write Contract Files ──────────────────────────────────────────

function writeContracts(runtimeData, crossCheckResult, legacyVars, usageMap, scssViolations, sourceTokens, unused = []) {
  if (!fs.existsSync(CONTRACTS_DIR)) fs.mkdirSync(CONTRACTS_DIR, { recursive: true });

  // Sin marca de tiempo: estos contratos se versionan, y una fecha que cambia
  // en cada ejecución ensucia el árbol y obliga a commits de ruido. Cuándo
  // cambió el contenido ya lo dice git.

  // runtime-tokens.json
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, 'runtime-tokens.json'),
    JSON.stringify({
      _meta: { source: 'css/styles-theme-example-01.css', stats: runtimeData.stats },
      tokens: runtimeData.tokens
    }, null, 2)
  );

  // token-contract.json (source tokens enriched with runtime status)
  const enriched = {};
  for (const [prop, data] of Object.entries(sourceTokens)) {
    enriched[prop] = {
      ...data,
      inRuntime:  runtimeData.tokens.hasOwnProperty(prop),
      usageCount: (usageMap[prop]?.usages || []).length
    };
  }
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, 'token-contract.json'),
    JSON.stringify({
      _meta: { totalTokens: Object.keys(enriched).length },
      tokens: enriched
    }, null, 2)
  );

  // lint-contract.json
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, 'lint-contract.json'),
    JSON.stringify({
      _meta: { generator: 'scripts/syx-validate.js' },
      stats: {
        sourceTokens:       Object.keys(sourceTokens).length,
        runtimeTokens:      runtimeData.stats.total,
        officialRuntime:    runtimeData.stats.official,
        legacyRuntime:      runtimeData.stats.legacy,
        phantomTokens:      crossCheckResult.phantoms.length,
        undocumentedTokens: crossCheckResult.undocumented.length,
        unusedTokens:       unused.length,
      },
      phantomTokens:      crossCheckResult.phantoms,
      unusedRegistryTokens: unused,
      undocumentedComponentTokens: crossCheckResult.undocumented,
      legacyVars,
      scssViolations: {
        R01_primitiveInComponents: scssViolations.R01.length,
        R02_importantUsage:        scssViolations.R02.length,
        R03_rawTransition:         scssViolations.R03.length,
        R04_rawPosition:           scssViolations.R04.length,
        R09_unknownMixin:          scssViolations.R09.length,
        R10_exceptionHygiene:      scssViolations.R10.length,
        parseErrors:               scssViolations.sintaxis.length,
      },
      // Las excepciones en línea vigentes, con su porqué: no son violaciones,
      // pero quien audita tiene que poder verlas todas juntas.
      inlineExceptions: scssViolations.excepciones.map((e) => ({ rule: e.regla, file: e.file, line: e.line, why: e.porque }))
    }, null, 2)
  );

  // token-usage-map.json
  fs.writeFileSync(
    path.join(CONTRACTS_DIR, 'token-usage-map.json'),
    JSON.stringify({
      _meta: { totalMappedTokens: Object.keys(usageMap).length },
      map: usageMap
    }, null, 2)
  );

  console.log('\n📁 Contracts written to contracts/');
  console.log('   → runtime-tokens.json');
  console.log('   → token-contract.json');
  console.log('   → lint-contract.json');
  console.log('   → token-usage-map.json');
}

// ─── Module 8: Console Report ─────────────────────────────────────────────────

function printReport(runtimeData, crossCheck, legacyVars, scssViolations) {

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│  SYX Validate v2.0 — Contracts Layer Report                │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  // Runtime stats
  console.log('── RUNTIME SURFACE ─────────────────────────────────────────\n');
  console.log(`   Total custom properties in CSS: ${runtimeData.stats.total}`);
  console.log(`   Official (--primitive/semantic/component/etc.): ${runtimeData.stats.official}`);
  console.log(`   Legacy (no SYX prefix): ${runtimeData.stats.legacy}`);

  // Source vs Runtime gap
  console.log('\n── SOURCE vs RUNTIME ────────────────────────────────────────\n');
  if (crossCheck.phantoms.length > 0) {
    console.log(`⚠️  R06 — ${crossCheck.phantoms.length} phantom tokens (in tokens.json but NOT in CSS runtime):`);
    crossCheck.phantoms.forEach(p => console.log(`   → ${p}`));
  } else {
    console.log('✅ R06 — All tokens.json entries appear in runtime CSS');
  }
  console.log();

  if (crossCheck.undocumented.length > 0) {
    console.log(`⚠️  R05 — ${crossCheck.undocumented.length} undocumented --component-* tokens (in CSS but NOT in tokens.json):`);
    if (crossCheck.undocumented.length > 20) {
      crossCheck.undocumented.slice(0, 20).forEach(p => console.log(`   → ${p}`));
      console.log(`   … and ${crossCheck.undocumented.length - 20} more. Run with --report to see all in lint-contract.json`);
    } else {
      crossCheck.undocumented.forEach(p => console.log(`   → ${p}`));
    }
  } else {
    console.log('✅ R05 — All --component-* tokens in CSS are documented');
  }
  if (crossCheck.themePrivate && crossCheck.themePrivate.length) {
    console.log(`ℹ️  R05 — ${crossCheck.themePrivate.length} token(s) privados del tema de referencia, fuera de tokens.json por diseño (ver tokens.json _meta.themeContract)`);
  }

  // Legacy vars
  console.log('\n── LEGACY VARS (R07) ────────────────────────────────────────\n');
  const legacyCount = Object.keys(legacyVars).length;
  if (legacyCount > 0) {
    console.log(`ℹ️  R07 — ${legacyCount} legacy vars found (no official SYX prefix):`);
    Object.keys(legacyVars).slice(0, 15).forEach(v => console.log(`   → ${v}`));
    if (legacyCount > 15) console.log(`   … and ${legacyCount - 15} more. See contracts/lint-contract.json`);
  } else {
    console.log('✅ R07 — No legacy vars found');
  }

  // SCSS violations
  console.log('\n── SCSS RULE VIOLATIONS ─────────────────────────────────────\n');

  const printViolations = (id, label, list, severity, max = 5) => {
    const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️ ' : 'ℹ️ ';
    if (list.length === 0) {
      console.log(`✅ ${id} — ${label}: 0 violations`);
    } else {
      console.log(`${icon} ${id} (${severity}) — ${label}: ${list.length} violations`);
      list.slice(0, max).forEach(v => console.log(`   ${v.file}:${v.line} → ${v.content.substring(0, 80)}${v.motivo ? `  [${v.motivo}]` : ''}`));
      if (list.length > max) console.log(`   … and ${list.length - max} more. See contracts/lint-contract.json`);
    }
    console.log();
  };

  for (const r of AST_RULES) printViolations(r.id, r.label, scssViolations[r.id], r.severity);
  if (scssViolations.sintaxis.length) {
    printViolations('SCSS', 'Files that do not parse', scssViolations.sintaxis, 'error');
  }
  const exc = scssViolations.excepciones;
  console.log(`ℹ️  ${exc.length} inline exception(s) (// syx-allow), each with its reason:`);
  exc.forEach((e) => console.log(`   ${e.regla} ${e.file}:${e.line} — ${e.porque.substring(0, 90)}`));
  console.log();
}

// ─── Module 9: Markdown Report ────────────────────────────────────────────────

function writeMarkdownReport(runtimeData, crossCheckResult, legacyVars, scssViolations, verdictFlags) {
  const { hasErrors, hasWarnings } = verdictFlags;
  const verdict = hasErrors ? '❌ FAILED' : hasWarnings ? '⚠️ WARNINGS' : '✅ PASSED';

  let md = `# SYX Validation Report\n\n`;
  md += `**Verdict: ${verdict}**\n\n`;
  md += `---\n\n`;

  md += `## Runtime Surface\n\n`;
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| Total custom properties in runtime CSS | ${runtimeData.stats.total} |\n`;
  md += `| Official (SYX-prefixed) | ${runtimeData.stats.official} |\n`;
  md += `| Legacy (no SYX prefix) | ${runtimeData.stats.legacy} |\n\n`;

  md += `## Source vs Runtime Gaps\n\n`;
  if (crossCheckResult.phantoms.length > 0) {
    md += `### ⚠️ Phantom Tokens (${crossCheckResult.phantoms.length})\n`;
    md += `_Exist in tokens.json but not emitted in runtime CSS_\n\n`;
    crossCheckResult.phantoms.forEach(p => { md += `- \`${p}\`\n`; });
    md += '\n';
  } else {
    md += `### ✅ No phantom tokens\n\n`;
  }
  if (crossCheckResult.undocumented.length > 0) {
    md += `### ⚠️ Undocumented Official Tokens (${crossCheckResult.undocumented.length})\n`;
    md += `_Runtime CSS has official-prefix tokens not in tokens.json_\n\n`;
    // Group by prefix
    const groups = {};
    crossCheckResult.undocumented.forEach(k => {
      const prefix = k.replace(/^--/, '').split('-')[0];
      groups[prefix] = groups[prefix] || [];
      groups[prefix].push(k);
    });
    Object.entries(groups).forEach(([prefix, keys]) => {
      md += `**--${prefix}-\* (${keys.length})**\n`;
      keys.slice(0, 10).forEach(p => { md += `- \`${p}\`\n`; });
      if (keys.length > 10) md += `- … and ${keys.length - 10} more\n`;
      md += '\n';
    });
  } else {
    md += `### ✅ All official tokens documented\n\n`;
  }

  const legacyCount = Object.keys(legacyVars).length;
  md += `## Legacy Vars (R07) — ${legacyCount} found\n\n`;
  if (legacyCount > 0) {
    // Lifecycle summary table
    const keep    = Object.entries(legacyVars).filter(([,v]) => v.status === 'keep');
    const migrate = Object.entries(legacyVars).filter(([,v]) => v.status === 'migrate');
    const kill    = Object.entries(legacyVars).filter(([,v]) => v.status === 'kill');

    md += `| Lifecycle | Count | Action |\n|---|---|---|\n`;
    md += `| 🔒 keep    | ${keep.length}   | External dependency or intentional contract. No action. |\n`;
    md += `| 🔄 migrate | ${migrate.length} | Has a SYX equivalent. Replace \`var(old)\` → \`var(new)\`. |\n`;
    md += `| 🗑️ kill    | ${kill.length}   | No SYX equivalent. Remove from codebase. |\n\n`;

    if (migrate.length > 0) {
      md += `### Top migration candidates\n\n`;
      migrate.slice(0, 10).forEach(([v, data]) => {
        const rep = data.replacedBy ? ` → \`${data.replacedBy}\`` : '';
        md += `- \`${v}\`${rep}\n`;
      });
      if (migrate.length > 10) md += `- … and ${migrate.length - 10} more (see contracts/lint-contract.json)\n`;
      md += '\n';
    }
  }

  md += `## SCSS Rule Violations\n\n`;
  md += `| Rule | Description | Severity | Count | Status |\n|---|---|---|---|---|\n`;
  for (const r of AST_RULES) {
    const n = scssViolations[r.id].length;
    md += `| ${r.id} | ${r.label} | ${r.severity} | ${n} | ${n === 0 ? '✅' : r.severity === 'error' ? '❌' : '⚠️'} |\n`;
  }
  md += '\n';

  for (const r of AST_RULES) {
    const list = scssViolations[r.id];
    if (!list.length) continue;
    md += `### ${r.id} Violations\n\n`;
    list.slice(0, 10).forEach(v => { md += `- \`${v.file}:${v.line}\` → \`${v.content.substring(0, 80)}\`${v.motivo ? ` — ${v.motivo}` : ''}\n`; });
    if (list.length > 10) md += `- … and ${list.length - 10} more\n`;
    md += '\n';
  }

  const exc = scssViolations.excepciones;
  md += `### Inline exceptions (${exc.length})\n\n`;
  if (exc.length) {
    md += `_Each one excuses exactly one declaration, with its reason next to the code (\`// syx-allow Rxx: …\`)._\n\n`;
    exc.forEach((e) => { md += `- ${e.regla} \`${e.file}:${e.line}\` — ${e.porque}\n`; });
  } else {
    md += `_None._\n`;
  }
  md += '\n';

  const reportPath = path.join(CONTRACTS_DIR, 'validation-report.md');
  fs.writeFileSync(reportPath, md);
  console.log('   → validation-report.md');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const scssFiles   = readAllScss(SCSS_DIR);
  const runtimeData = extractRuntimeTokens();

  let sourceTokens = {};
  if (fs.existsSync(TOKENS_JSON)) {
    const raw = JSON.parse(fs.readFileSync(TOKENS_JSON, 'utf8'));
    sourceTokens = flattenTokensJson(raw);
  }

  const crossCheckResult = crossCheck(sourceTokens, runtimeData);
  const legacyVars       = catalogLegacyVars(runtimeData);
  const usageMap         = buildUsageMap(scssFiles, runtimeData);
  const scssViolations   = runScssChecks(scssFiles);
  const unused           = unusedRegistryTokens();

  printReport(runtimeData, crossCheckResult, legacyVars, scssViolations);

  console.log('── TOKEN USAGE (R08) ────────────────────────────────────────\n');
  if (unused.length) {
    console.log(`⚠️  R08 — ${unused.length} semantic/component tokens in tokens.json that no compiled CSS uses:`);
    unused.slice(0, 15).forEach((u) => console.log(`   → ${u}`));
    if (unused.length > 15) console.log(`   … and ${unused.length - 15} more. Run with --report to see all in lint-contract.json`);
  } else {
    console.log('✅ R08 — Every semantic and component token is used');
  }
  console.log();

  // Final verdict — la severidad sale del contrato, regla a regla. Hasta
  // septiembre de 2026 este bloque contaba R03 y R04 como avisos, así que un
  // `transition:` en crudo no hacía fallar la CI; hasta octubre, las
  // severidades estaban escritas aquí y el contrato solo las documentaba.
  const findings = {
    ...Object.fromEntries(AST_RULES.map((r) => [r.id, scssViolations[r.id].length])),
    R05: crossCheckResult.undocumented.length,
    R06: crossCheckResult.phantoms.length,
    R08: unused.length,
  };
  const withSeverity = (sev) => Object.entries(findings).filter(([id, n]) => n > 0 && severityOf(id) === sev).map(([id]) => id);
  const errorRules   = withSeverity('error');
  const warningRules = withSeverity('warning');
  if (scssViolations.sintaxis.length && severityOf('sintaxis') === 'error') errorRules.push('SCSS parse');
  const hasErrors   = errorRules.length > 0;
  const hasWarnings = warningRules.length > 0;

  if (WRITE_REPORT) {
    writeContracts(runtimeData, crossCheckResult, legacyVars, usageMap, scssViolations, sourceTokens, unused);
    writeMarkdownReport(runtimeData, crossCheckResult, legacyVars, scssViolations, { hasErrors, hasWarnings });
  }

  console.log('┌─────────────────────────────────────────────────────────────┐');
  if (hasErrors)        console.log(`│  Result: ❌ FAILED — errors in ${errorRules.join(', ')}`.padEnd(62) + '│');
  else if (hasWarnings) console.log('│  Result: ⚠️  PASSED WITH WARNINGS                           │');
  else                  console.log('│  Result: ✅ PASSED — all checks clean                       │');
  if (!WRITE_REPORT)    console.log('│  Tip: run with --report to generate contracts/ JSON files  │');
  console.log('└─────────────────────────────────────────────────────────────┘\n');

  if (STRICT && (hasErrors || hasWarnings)) process.exit(1);
  if (hasErrors) process.exit(1);
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
