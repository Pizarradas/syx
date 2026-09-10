#!/usr/bin/env node
/**
 * generate-spec.mjs — Fase 1 de la prueba de portabilidad.
 *
 * Lee component-registry.json (la única fuente) y emite storybook/spec/spec.json:
 * una especificación neutral de stories que no sabe nada de Storybook ni de
 * ningún framework. De ella se generan después las stories HTML y los wrappers
 * React/Vue, de modo que ningún catálogo pueda desviarse del registro.
 *
 * Derivación de props desde los modifiers (las reglas viven aquí y solo aquí):
 *   1. El sufijo de un modifier es lo que sigue a `<clase>--`.
 *   2. `is-*` y `has-*` son siempre flags booleanos (estados, no variantes).
 *   3. Sufijos cuyo primer segmento se repite en ≥2 modifiers forman un eje
 *      enum con ese nombre (`size-sm|md|lg` → size: sm|md|lg). `lc` se
 *      renombra a `icon`: son los glifos Lucide.
 *   4. ≥2 sufijos puramente numéricos forman el eje `level`.
 *   5. ≥2 sufijos del conjunto primary|secondary|tertiary|quaternary|neutral
 *      forman el eje `variant` (no comparten cabeza, de ahí la lista cerrada).
 *   6. Lo que queda es un flag booleano.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const registry = JSON.parse(readFileSync(join(ROOT, 'component-registry.json'), 'utf8'));

const VARIANT_WORDS = new Set(['primary', 'secondary', 'tertiary', 'quaternary', 'neutral']);
const AXIS_RENAME = { lc: 'icon' };

const themes = readdirSync(join(ROOT, 'css'))
  .map((f) => f.match(/^styles-theme-(.+)\.css$/))
  .filter(Boolean)
  .map((m) => m[1]);

function owningIn(modifier, names) {
  return [...names]
    .sort((a, b) => b.length - a.length)
    .find((c) => modifier.startsWith(c + '--'));
}

function deriveProps(component) {
  const axes = {};
  const flags = [];
  const suffixes = [];
  const elementModifiers = [];

  for (const mod of component.modifiers ?? []) {
    const owner = owningIn(mod, component.classes);
    if (!owner) {
      // Modifier de un elemento interno (atom-x__item--activo): no es un prop
      // del componente raíz — pertenece al template, no a la API.
      const el = owningIn(mod, component.elements ?? []);
      if (el) elementModifiers.push({ element: el, class: mod });
      continue;
    }
    suffixes.push({ mod, owner, suffix: mod.slice(owner.length + 2) });
  }

  // Regla 2: is-/has- son flags, fuera del recuento de cabezas.
  const stateFlags = suffixes.filter((s) => /^(is|has)-/.test(s.suffix));
  const rest = suffixes.filter((s) => !/^(is|has)-/.test(s.suffix));

  // Regla 3: cabezas repetidas → eje enum.
  const byHead = {};
  for (const s of rest) {
    const i = s.suffix.indexOf('-');
    if (i > 0) (byHead[s.suffix.slice(0, i)] ??= []).push(s);
  }
  const grouped = new Set();
  for (const [head, members] of Object.entries(byHead)) {
    if (members.length < 2) continue;
    const axis = AXIS_RENAME[head] ?? head;
    axes[axis] = members.map((s) => ({
      value: s.suffix.slice(head.length + 1),
      class: s.mod,
    }));
    members.forEach((s) => grouped.add(s.mod));
  }

  const loose = rest.filter((s) => !grouped.has(s.mod));

  // Regla 4: numéricos → level.
  const numeric = loose.filter((s) => /^\d+$/.test(s.suffix));
  if (numeric.length >= 2) {
    axes.level = numeric.map((s) => ({ value: s.suffix, class: s.mod }));
    numeric.forEach((s) => grouped.add(s.mod));
  }

  // Regla 5: conjunto cerrado de variantes.
  const variants = loose.filter((s) => !grouped.has(s.mod) && VARIANT_WORDS.has(s.suffix));
  if (variants.length >= 2) {
    axes.variant = variants.map((s) => ({ value: s.suffix, class: s.mod }));
    variants.forEach((s) => grouped.add(s.mod));
  }

  // Regla 6 (+ regla 2): el resto son flags.
  for (const s of [...stateFlags, ...loose.filter((x) => !grouped.has(x.mod))]) {
    flags.push({ name: s.suffix, class: s.mod });
  }

  return { axes, flags, elementModifiers };
}

const components = [];
const report = { sinUsage: [], modifiersHuerfanos: [] };

for (const layer of ['atoms', 'molecules', 'organisms']) {
  for (const c of registry[layer] ?? []) {
    const { axes, flags, elementModifiers } = deriveProps(c);
    for (const mod of c.modifiers ?? []) {
      if (!owningIn(mod, c.classes) && !owningIn(mod, c.elements ?? [])) {
        report.modifiersHuerfanos.push(`${c.name}: ${mod}`);
      }
    }
    if (!c.usage) report.sinUsage.push(c.name);
    components.push({
      name: c.name,
      layer: c.layer,
      base: c.classes[0],
      classes: c.classes,
      axes,
      flags,
      elementModifiers,
      elements: c.elements ?? [],
      states: c.states ?? [],
      composedOf: c.composedOf ?? [],
      template: c.usage ?? null,
      description: c.description ?? null,
    });
  }
}

const spec = {
  _meta: {
    source: 'component-registry.json',
    sourceVersion: registry._meta.version,
    generated: new Date().toISOString().slice(0, 10),
    generator: 'storybook/generate-spec.mjs',
    themes,
    defaultTheme: themes.includes('example-01') ? 'example-01' : themes[0],
    cssPattern: 'css/styles-theme-<theme>.css',
    darkMode: { attribute: 'data-theme', values: ['light', 'dark'], target: 'html' },
  },
  components,
};

mkdirSync(join(HERE, 'spec'), { recursive: true });
writeFileSync(join(HERE, 'spec', 'spec.json'), JSON.stringify(spec, null, 2) + '\n');

const nAxes = components.reduce((n, c) => n + Object.keys(c.axes).length, 0);
const nFlags = components.reduce((n, c) => n + c.flags.length, 0);
console.log(`spec.json: ${components.length} componentes, ${nAxes} ejes enum, ${nFlags} flags, ${themes.length} temas`);
if (report.sinUsage.length) console.log(`sin usage (story mínima autogenerada): ${report.sinUsage.join(', ')}`);
if (report.modifiersHuerfanos.length) console.log(`modifiers sin clase propietaria: ${report.modifiersHuerfanos.join('; ')}`);
