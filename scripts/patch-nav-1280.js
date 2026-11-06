/**
 * patch-nav-1280.js
 * Patches compiled CSS to move site header nav collapse to 80em (1280px).
 * Removes intermediate laptop/desktop nav tweaks — at xl everything shows normally.
 */
const fs   = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
const MARKER = '/* NAV_1280_PATCHED_v1 */';

// Override all nav collapse rules to 80em (1280px)
const NEW_NAV_CSS = `
/* === Header nav collapse at 1280px (xl = 80em) === */
/* Reset any previous patches at 64em / 70em for nav rules */
@media (min-width:64em){
  .org-site-header__nav{display:none !important}
  .org-site-header__theme-select{display:none !important}
  .org-site-header__burger{display:flex !important}
  .org-site-nav-drawer{display:flex !important}
}
@media (min-width:70em){
  .org-site-header__nav{display:none !important}
  .org-site-header__theme-select{display:none !important}
  .org-site-header__burger{display:flex !important}
  .org-site-nav-drawer{display:flex !important}
}
@media (min-width:80em){
  .org-site-header__nav{display:flex !important;gap:var(--semantic-space-component-lg,1.5rem) !important}
  .org-site-header__nav a{font-size:var(--semantic-font-size-body-small);letter-spacing:.01em;text-transform:none;white-space:nowrap}
  .org-site-header__theme-select{display:block !important}
  .org-site-header__burger{display:none !important}
  .org-site-nav-drawer{display:none !important}
}
`;

let total = 0;
for (const file of files) {
  const fp = path.join(cssDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  if (c.includes(MARKER)) {
    console.log('SKIP:', file);
    continue;
  }

  c += NEW_NAV_CSS + '\n' + MARKER;
  fs.writeFileSync(fp, c, 'utf8');
  console.log('PATCHED:', file);
  total++;
}
console.log(`Done. ${total} files patched.`);
