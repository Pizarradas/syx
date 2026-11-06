/**
 * patch-breakpoints.js
 * Patches compiled CSS to:
 * 1. Move the site header nav collapse from @media(min-width:50em) to @media(min-width:64em)
 * 2. Move the token diagram flex-wrap:nowrap from @media(min-width:37.5em) to @media(min-width:64em)
 * 3. Add overflow-x:hidden to .org-home-tokens and body
 */
const fs   = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

// Old tablet breakpoint = 50em; laptop = 64em
// The .org-site-header nav rules appear as:
//   @media (min-width:50em){.org-site-header__nav{display:flex}
//   @media (min-width:50em){.org-site-header__theme-select{display:block}
//   @media (min-width:50em){.org-site-header__burger{display:none}
//   @media (min-width:50em){.org-site-nav-drawer{display:none}  ← within @layer block

// phablet = 37.5em for the diagram nowrap

const MARKER = '/* BREAKPOINTS_PATCHED_v2 */';

// Patterns to replace in CSS: [find, replace]
const patches = [
  // ── Header nav → laptop ──────────────────────────────────────────────────
  // __nav display:flex at tablet
  [
    /@media \(min-width:50em\)\{\.org-site-header__nav\{display:flex/g,
    '@media (min-width:64em){.org-site-header__nav{display:flex'
  ],
  // __theme-select display:block at tablet
  [
    /@media \(min-width:50em\)\{\.org-site-header__theme-select\{display:block/g,
    '@media (min-width:64em){.org-site-header__theme-select{display:block'
  ],
  // __burger display:none at tablet
  [
    /@media \(min-width:50em\)\{\.org-site-header__burger\{display:none/g,
    '@media (min-width:64em){.org-site-header__burger{display:none'
  ],
  // __drawer display:none at tablet (inside the layer block)
  [
    /@media \(min-width:50em\)\{\.org-site-nav-drawer\{display:none/g,
    '@media (min-width:64em){.org-site-nav-drawer{display:none'
  ],

  // ── Token diagram → laptop ────────────────────────────────────────────────
  // flex-wrap:nowrap at phablet
  [
    /@media \(min-width:37\.5em\)\{\.org-home-tokens__diagram\{flex-wrap:nowrap/g,
    '@media (min-width:64em){.org-home-tokens__diagram{flex-wrap:nowrap'
  ],
  // arrows display:flex at phablet
  [
    /@media \(min-width:37\.5em\)\{\.org-home-tokens__arrow\{display:flex/g,
    '@media (min-width:64em){.org-home-tokens__arrow{display:flex'
  ],
];

let totalPatched = 0;

for (const file of files) {
  const fp = path.join(cssDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  if (c.includes(MARKER)) {
    console.log('SKIP (v2 already patched):', file);
    continue;
  }

  let changed = false;
  for (const [find, replace] of patches) {
    const before = c;
    c = c.replace(find, replace);
    if (c !== before) changed = true;
  }

  // Add overflow-x:hidden to .org-home-tokens
  c = c.replace(
    /\.org-home-tokens\{padding:/g,
    '.org-home-tokens{overflow-x:hidden;padding:'
  );

  // Append marker
  c = c + '\n' + MARKER;

  fs.writeFileSync(fp, c, 'utf8');
  console.log(changed ? 'PATCHED:' : 'NO MATCHES (marker added):', file);
  totalPatched++;
}

console.log(`Done. Processed ${totalPatched} files.`);
