/**
 * patch-tokens-grid.js
 * Replaces the old flex-based token diagram CSS with the new CSS Grid version.
 * Also patches the header nav to be more compact at laptop breakpoint.
 */
const fs   = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
const MARKER = '/* TOKENS_GRID_PATCHED_v1 */';

// New CSS to inject at end of each CSS file
// This overrides the old flex-based token diagram rules
const NEW_TOKEN_CSS = `
/* === Token diagram — CSS Grid mobile-first override === */
.org-home-tokens{overflow:hidden}
.org-home-tokens__diagram{
  display:grid;
  grid-template-columns:1fr;
  gap:var(--semantic-space-layout-sm);
  max-width:68rem;
  margin:0 auto var(--semantic-space-layout-lg);
  width:100%;
  box-sizing:border-box
}
.org-home-tokens__arrow{display:none}
.org-home-tokens__layer{
  display:flex;flex-direction:column;
  gap:var(--semantic-space-component-md);
  padding:var(--semantic-space-layout-sm);
  border:1px solid var(--semantic-color-border-subtle);
  border-radius:var(--semantic-border-radius-lg,1rem);
  background-color:var(--semantic-color-bg-primary);
  box-sizing:border-box;position:relative
}
.org-home-tokens__layer::before{
  content:attr(data-step);
  position:absolute;top:var(--semantic-space-component-sm);right:var(--semantic-space-component-sm);
  font-size:var(--semantic-font-size-overline);font-weight:var(--semantic-font-weight-bold);
  color:var(--semantic-color-text-tertiary);letter-spacing:.05em;opacity:.5
}
.org-home-tokens__layer-badge{align-self:flex-start}
@media (min-width:37.5em){
  .org-home-tokens__diagram{grid-template-columns:1fr 1fr}
}
@media (min-width:64em){
  .org-home-tokens__diagram{grid-template-columns:repeat(4,1fr);gap:0}
  .org-home-tokens__layer{border-radius:0}
  .org-home-tokens__layer:first-child{border-top-left-radius:var(--semantic-border-radius-lg,1rem);border-bottom-left-radius:var(--semantic-border-radius-lg,1rem)}
  .org-home-tokens__layer:last-child{border-top-right-radius:var(--semantic-border-radius-lg,1rem);border-bottom-right-radius:var(--semantic-border-radius-lg,1rem)}
  .org-home-tokens__layer:not(:last-child){border-right:none}
  .org-home-tokens__layer--primitive .org-home-tokens__layer-badge{background-color:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
  .org-home-tokens__layer--theme .org-home-tokens__layer-badge{background-color:#fff7ed;color:#c2410c;border-color:#fed7aa}
  .org-home-tokens__layer--semantic .org-home-tokens__layer-badge{background-color:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}
  .org-home-tokens__layer--component .org-home-tokens__layer-badge{background-color:#f0fdf4;color:#15803d;border-color:#bbf7d0}
}

/* === Header nav compact at laptop === */
@media (min-width:64em){
  .org-site-header__nav{gap:var(--semantic-space-component-sm)}
  .org-site-header__nav a{
    font-size:var(--semantic-font-size-overline);
    letter-spacing:.04em;text-transform:uppercase;white-space:nowrap
  }
  .org-site-header__theme-select{display:none}
}
@media (min-width:70em){
  .org-site-header__nav{gap:var(--semantic-space-component-lg,1.5rem)}
  .org-site-header__nav a{font-size:var(--semantic-font-size-body-small);letter-spacing:.01em;text-transform:none}
  .org-site-header__theme-select{display:block}
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

  c += NEW_TOKEN_CSS + '\n' + MARKER;
  fs.writeFileSync(fp, c, 'utf8');
  console.log('PATCHED:', file);
  total++;
}
console.log(`Done. ${total} files patched.`);
