/**
 * SYX Token Importer — Figma Plugin (code.js)
 * ============================================
 * Runs in Figma's plugin sandbox.
 * Reads tokens.json payload from the UI and creates:
 *   - Variable Collection "SYX / Primitives"  (mode: Default)
 *   - Variable Collection "SYX / Semantic"    (mode: Light / Dark)
 *   - Variable Collection "SYX / Component"   (mode: Default)
 *
 * Aliases are set so:
 *   Semantic → points to Primitive variable
 *   Component → points to Semantic variable
 */

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const COLLECTION_NAMES = {
  primitives : 'SYX / Primitives',
  semantic   : 'SYX / Semantic',
  component  : 'SYX / Component',
};

const SYX_SCOPE_ALL = [
  'ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL',
  'STROKE_COLOR', 'EFFECT_COLOR',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Send a log message to the UI */
function uiLog(text, cls = '') {
  figma.ui.postMessage({ type: 'LOG', text, cls });
}

/** Send progress % to the UI */
function uiProgress(value) {
  figma.ui.postMessage({ type: 'PROGRESS', value });
}

/** Convert hex string (#rrggbb or #rrggbbaa) to Figma RGBA {r,g,b,a} 0–1 */
function hexToFigmaRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/** Find or create a Variable Collection by name */
function getOrCreateCollection(name) {
  const existing = figma.variables.getLocalVariableCollections();
  return (
    existing.find(c => c.name === name) ||
    figma.variables.createVariableCollection(name)
  );
}

/** Find or create a Variable in a collection */
function getOrCreateVariable(name, collection, type) {
  const existing = figma.variables.getLocalVariables(type);
  return (
    existing.find(v => v.name === name && v.variableCollectionId === collection.id) ||
    figma.variables.createVariable(name, collection, type)
  );
}

/** Get the default mode id of a collection */
function defaultMode(collection) {
  return collection.modes[0].modeId;
}

// ─── TOKEN NAME → FIGMA VARIABLE NAME ────────────────────────────────────────

/**
 * Convert a CSS custom property name to a slash-separated Figma variable path.
 * "--primitive-color-purple-500" → "color/purple/500"
 * "--semantic-color-primary"     → "color/primary"
 * "--component-button-primary-bg" → "button/primary/bg"
 */
function tokenNameToFigmaPath(name, layerPrefix) {
  return name
    .replace(`--${layerPrefix}-`, '')
    .replace(/-/g, '/')
    .replace(/\/(\d)/g, '-$1')    // re-join trailing numbers: purple/500 → keep as is
    .replace(/-(\d)/g, '-$1');    // keep numeric suffixes clean
}

// Actually let's use a simpler, more robust approach:
function cssVarToFigmaPath(cssVarName, prefix) {
  // "--primitive-color-purple-500" with prefix "primitive" → "color/purple-500"
  // "--semantic-color-bg-primary"  with prefix "semantic"  → "color/bg/primary"
  let name = cssVarName.replace(`--${prefix}-`, '');
  // Split by dash, but we want to create hierarchy for the first segment (category)
  // e.g. "color-purple-500" → "color/purple-500"
  //      "color-bg-primary" → "color/bg-primary"
  // Strategy: replace FIRST dash with slash, keep the rest as the token name
  // This gives: category/token-name which is clean in Figma
  const firstDash = name.indexOf('-');
  if (firstDash === -1) return name;
  const category = name.substring(0, firstDash);
  const rest     = name.substring(firstDash + 1);
  return `${category}/${rest}`;
}

// ─── CORE: CREATE PRIMITIVE VARIABLES ────────────────────────────────────────

async function createPrimitiveVariables(collection, tokens) {
  const modeId    = defaultMode(collection);
  const varByName = {}; // cssVarName → FigmaVariable (for alias resolution)
  let count = 0;

  for (const [cssName, token] of Object.entries(tokens)) {
    const figmaName = cssVarToFigmaPath(cssName, 'primitive');

    if (token.type === 'COLOR' && token.value) {
      const variable = getOrCreateVariable(figmaName, collection, 'COLOR');
      variable.scopes = SYX_SCOPE_ALL;
      try {
        variable.setValueForMode(modeId, hexToFigmaRgb(token.value));
      } catch (_) {
        // If hex parse fails, use a fallback grey
        variable.setValueForMode(modeId, { r: 0.5, g: 0.5, b: 0.5, a: 1 });
      }
      varByName[cssName] = variable;

    } else if (token.type === 'FLOAT' && token.value !== null) {
      const variable = getOrCreateVariable(figmaName, collection, 'FLOAT');
      variable.setValueForMode(modeId, token.value);
      varByName[cssName] = variable;

    } else if (token.type === 'STRING' && token.value) {
      const variable = getOrCreateVariable(figmaName, collection, 'STRING');
      variable.setValueForMode(modeId, token.value);
      varByName[cssName] = variable;
    }
    // Skip ALIAS and null values in primitives

    count++;
    if (count % 10 === 0) uiLog(`  ✔ ${count} primitives processed…`, 'log-info');
  }

  uiLog(`✅ Primitives: ${Object.keys(varByName).length} variables created.`, 'log-ok');
  return varByName;
}

// ─── CORE: CREATE SEMANTIC VARIABLES ─────────────────────────────────────────

async function createSemanticVariables(collection, tokens, primitiveVarMap) {
  const modeId    = defaultMode(collection);
  const varByName = {};
  let   aliasCount  = 0;
  let   directCount = 0;

  for (const [cssName, token] of Object.entries(tokens)) {
    const figmaName = cssVarToFigmaPath(cssName, 'semantic');

    if (token.type === 'ALIAS' && token.value) {
      // token.value is the referenced CSS var name, e.g. "--primitive-color-purple-500"
      const targetVar = primitiveVarMap[token.value];
      if (targetVar) {
        const type     = targetVar.resolvedType; // 'COLOR', 'FLOAT', or 'STRING'
        const variable = getOrCreateVariable(figmaName, collection, type);
        if (type === 'COLOR') variable.scopes = SYX_SCOPE_ALL;
        variable.setValueForMode(modeId, {
          type : 'VARIABLE_ALIAS',
          id   : targetVar.id,
        });
        varByName[cssName] = variable;
        aliasCount++;
      } else {
        uiLog(`  ⚠ Could not resolve alias: ${cssName} → ${token.value}`, 'log-err');
      }

    } else if (token.type === 'COLOR' && token.value) {
      // Direct color (not an alias) — uncommon in semantic but possible
      const variable = getOrCreateVariable(figmaName, collection, 'COLOR');
      variable.scopes = SYX_SCOPE_ALL;
      variable.setValueForMode(modeId, hexToFigmaRgb(token.value));
      varByName[cssName] = variable;
      directCount++;

    } else if (token.type === 'FLOAT' && token.value !== null) {
      const variable = getOrCreateVariable(figmaName, collection, 'FLOAT');
      variable.setValueForMode(modeId, token.value);
      varByName[cssName] = variable;
      directCount++;

    } else if (token.type === 'STRING' && token.value) {
      const variable = getOrCreateVariable(figmaName, collection, 'STRING');
      variable.setValueForMode(modeId, token.value);
      varByName[cssName] = variable;
      directCount++;
    }
  }

  uiLog(`✅ Semantic: ${aliasCount} aliases + ${directCount} direct values.`, 'log-ok');
  return varByName;
}

// ─── CORE: CREATE COMPONENT VARIABLES ────────────────────────────────────────

async function createComponentVariables(collection, tokens, semanticVarMap, primitiveVarMap) {
  const modeId     = defaultMode(collection);
  let   aliasCount = 0;
  let   directCount = 0;

  // Combined lookup: semantic first, then primitive fallback
  const allVars = { ...primitiveVarMap, ...semanticVarMap };

  for (const [cssName, token] of Object.entries(tokens)) {
    const figmaName = cssVarToFigmaPath(cssName, 'component');

    if (token.type === 'ALIAS' && token.value) {
      const targetVar = allVars[token.value];
      if (targetVar) {
        const type     = targetVar.resolvedType;
        const variable = getOrCreateVariable(figmaName, collection, type);
        if (type === 'COLOR') variable.scopes = SYX_SCOPE_ALL;
        variable.setValueForMode(modeId, {
          type : 'VARIABLE_ALIAS',
          id   : targetVar.id,
        });
        aliasCount++;
      } else {
        // Log but don't crash — some component tokens reference semantic tokens
        // that themselves might be font families (STRING type), which can't alias.
        uiLog(`  ⚠ Skipped: ${cssName} → ${token.value} (not found)`, 'log-err');
      }

    } else if (token.type === 'COLOR' && token.value) {
      const variable = getOrCreateVariable(figmaName, collection, 'COLOR');
      variable.scopes = SYX_SCOPE_ALL;
      variable.setValueForMode(modeId, hexToFigmaRgb(token.value));
      directCount++;

    } else if (token.type === 'FLOAT' && token.value !== null) {
      const variable = getOrCreateVariable(figmaName, collection, 'FLOAT');
      variable.setValueForMode(modeId, token.value);
      directCount++;

    } else if (token.type === 'STRING' && token.value) {
      const variable = getOrCreateVariable(figmaName, collection, 'STRING');
      variable.setValueForMode(modeId, token.value);
      directCount++;
    }
  }

  uiLog(`✅ Component: ${aliasCount} aliases + ${directCount} direct values.`, 'log-ok');
}

// ─── CLEAR ALL SYX VARIABLES ─────────────────────────────────────────────────

function clearSyxVariables() {
  const collections = figma.variables.getLocalVariableCollections();
  let cleared = 0;

  for (const col of collections) {
    if (Object.values(COLLECTION_NAMES).includes(col.name)) {
      // Remove all variables in the collection first
      const vars = figma.variables.getLocalVariables();
      for (const v of vars) {
        if (v.variableCollectionId === col.id) {
          try { v.remove(); } catch (_) {}
        }
      }
      col.remove();
      cleared++;
    }
  }

  figma.ui.postMessage({ type: 'CLEARED', count: cleared });
  uiLog(`  Removed ${cleared} SYX collections.`, 'log-info');
}

// ─── MAIN IMPORT ORCHESTRATOR ─────────────────────────────────────────────────

async function importTokens(payload) {
  try {
    const totalLayers = 3;

    // ── 1. PRIMITIVES ────────────────────────────────────────────────────────
    uiLog('📦 Creating Primitives collection…', 'log-head');
    const primCollection = getOrCreateCollection(COLLECTION_NAMES.primitives);
    // Ensure the default mode is named "Default"
    primCollection.renameMode(defaultMode(primCollection), 'Default');

    const primitiveVarMap = await createPrimitiveVariables(
      primCollection,
      payload.primitives || {}
    );
    uiProgress(35);

    // ── 2. SEMANTIC ──────────────────────────────────────────────────────────
    uiLog('🔗 Creating Semantic collection…', 'log-head');
    const semCollection = getOrCreateCollection(COLLECTION_NAMES.semantic);
    semCollection.renameMode(defaultMode(semCollection), 'Light');
    // Add Dark mode if it doesn't exist yet
    const darkModeExists = semCollection.modes.find(m => m.name === 'Dark');
    if (!darkModeExists) semCollection.addMode('Dark');

    const semanticVarMap = await createSemanticVariables(
      semCollection,
      payload.semantic || {},
      primitiveVarMap
    );
    uiProgress(65);

    // ── 3. COMPONENT ─────────────────────────────────────────────────────────
    uiLog('🧩 Creating Component collection…', 'log-head');
    const compCollection = getOrCreateCollection(COLLECTION_NAMES.component);
    compCollection.renameMode(defaultMode(compCollection), 'Default');

    await createComponentVariables(
      compCollection,
      payload.component || {},
      semanticVarMap,
      primitiveVarMap
    );
    uiProgress(95);

    // ── DONE ─────────────────────────────────────────────────────────────────
    figma.ui.postMessage({ type: 'DONE' });

  } catch (err) {
    figma.ui.postMessage({ type: 'ERROR', text: err.message });
    console.error('[SYX Plugin]', err);
  }
}

// ─── PLUGIN ENTRY POINT ──────────────────────────────────────────────────────

figma.showUI(__html__, { width: 380, height: 520, title: 'SYX Token Importer' });

figma.ui.onmessage = async msg => {
  switch (msg.type) {
    case 'IMPORT_TOKENS':
      await importTokens(msg.payload);
      break;
    case 'CLEAR_TOKENS':
      clearSyxVariables();
      break;
    default:
      break;
  }
};
