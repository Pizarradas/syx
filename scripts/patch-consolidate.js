/**
 * patch-consolidate.js
 * ─────────────────────────────────────────────────────────────────
 * 1. Strips ALL previously appended patch blocks (identified by markers).
 * 2. Appends ONE clean, consolidated CSS block — no !important.
 *
 * Why no !important is needed:
 *   All rules are appended at the END of the file.
 *   For equal specificity, LAST declaration wins — this is standard cascade.
 *   The single block is authoritative for every property it touches.
 * ─────────────────────────────────────────────────────────────────
 */
const fs   = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && !f.includes('.map'));

// Every marker ever used across all previous patch scripts
const OLD_MARKERS = [
  '/* BREAKPOINTS_PATCHED_v2 */',
  '/* OVERFLOW_PATCHED_v1 */',
  '/* TOKENS_GRID_PATCHED_v1 */',
  '/* NAV_1280_PATCHED_v1 */',
  '/* CONSOLIDATE_PATCHED_v1 */',                 // idempotency: also strip itself
];

const FINAL_MARKER = '/* CONSOLIDATE_PATCHED_v1 */';

// ─── THE ONE TRUE PATCH ──────────────────────────────────────────
// All rules at the end of the file → same specificity → last wins → no !important.
const CONSOLIDATED_CSS = `

/* ================================================================
   SYX home.html — consolidated responsive overrides
   Appended last in file: equal-specificity cascade wins, no !important.
   ================================================================ */

/* 1. Prevent horizontal scroll globally */
html, body { overflow-x: hidden; max-width: 100%; }

/* 2. Token diagram — CSS Grid, mobile-first
      1 col  | < 600px
      2×2    | ≥ 600px  (37.5em)
      4 col  | ≥ 1024px (64em)                 */
.org-home-tokens { overflow: hidden; }

.org-home-tokens__diagram {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--semantic-space-layout-sm);
  max-width: min(68rem, 100%);
  width: 100%;
  margin: 0 auto var(--semantic-space-layout-lg);
  box-sizing: border-box;
}

.org-home-tokens__arrow { display: none; }

.org-home-tokens__layer {
  display: flex;
  flex-direction: column;
  gap: var(--semantic-space-component-md);
  padding: var(--semantic-space-layout-sm);
  border: 1px solid var(--semantic-color-border-subtle);
  border-radius: var(--semantic-border-radius-lg, 1rem);
  background-color: var(--semantic-color-bg-primary);
  box-sizing: border-box;
  position: relative;
  max-width: 100%;
}

/* Step number badge via data-step */
.org-home-tokens__layer::before {
  content: attr(data-step);
  position: absolute;
  top: var(--semantic-space-component-sm);
  right: var(--semantic-space-component-sm);
  font-size: var(--semantic-font-size-overline);
  font-weight: var(--semantic-font-weight-bold);
  color: var(--semantic-color-text-tertiary);
  letter-spacing: .05em;
  opacity: .45;
}

@media (min-width: 37.5em) {
  .org-home-tokens__diagram { grid-template-columns: 1fr 1fr; }
}

@media (min-width: 64em) {
  .org-home-tokens__diagram { grid-template-columns: repeat(4, 1fr); gap: 0; }
  .org-home-tokens__layer  { border-radius: 0; }
  .org-home-tokens__layer:first-child {
    border-top-left-radius: var(--semantic-border-radius-lg, 1rem);
    border-bottom-left-radius: var(--semantic-border-radius-lg, 1rem);
  }
  .org-home-tokens__layer:last-child {
    border-top-right-radius: var(--semantic-border-radius-lg, 1rem);
    border-bottom-right-radius: var(--semantic-border-radius-lg, 1rem);
  }
  .org-home-tokens__layer:not(:last-child) { border-right: none; }
}

/* 3. Header nav — show desktop nav only at ≥ 1280px (80em)
      Below 80em: burger + drawer visible, desktop nav hidden.   */

/* Ensure nav is hidden and burger visible below 80em            */
@media (max-width: 79.999em) {
  .org-site-header__nav          { display: none; }
  .org-site-header__theme-select { display: none; }
  .org-site-header__burger       { display: flex; }
}

/* Show desktop nav from 80em upward */
@media (min-width: 80em) {
  .org-site-header__nav {
    display: flex;
    gap: var(--semantic-space-component-lg, 1.5rem);
  }
  .org-site-header__nav a {
    font-size: var(--semantic-font-size-body-small);
    letter-spacing: .01em;
    text-transform: none;
    white-space: nowrap;
  }
  .org-site-header__burger       { display: none; }
  .org-site-nav-drawer           { display: none; }
  .org-site-header__theme-select { display: block; }
}

`;

let total = 0;

for (const file of files) {
  const fp = path.join(cssDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  // Strip all old patch blocks — each marker and everything after it up to the *next* old marker
  // Simpler: just cut at the FIRST old marker found and discard everything from there.
  let firstCutAt = Infinity;
  for (const marker of OLD_MARKERS) {
    const idx = c.indexOf(marker);
    if (idx !== -1 && idx < firstCutAt) firstCutAt = idx;
  }

  if (firstCutAt !== Infinity) {
    c = c.slice(0, firstCutAt).trimEnd();
  }

  // Remove any stray !important lines that were injected inline earlier
  c = c.replace(/body\{overflow-x:hidden\}/g, '')
       .replace(/\.org-home-tokens\{overflow-x:hidden;/g, '.org-home-tokens{')
       .replace(/\.org-home-tokens\{overflow:hidden;/g, '.org-home-tokens{');

  // Append the final consolidated patch
  c = c + '\n' + CONSOLIDATED_CSS + '\n' + FINAL_MARKER + '\n';

  fs.writeFileSync(fp, c, 'utf8');
  console.log('CONSOLIDATED:', file);
  total++;
}

console.log(`\nDone. ${total} files consolidated. No !important used.`);
