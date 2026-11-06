/**
 * patch-overflow.js
 * Adds overflow-x:hidden to .syx body class and specific section wrappers
 * to prevent horizontal scrolling on mobile.
 */
const fs   = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
const MARKER = '/* OVERFLOW_PATCHED_v1 */';

for (const file of files) {
  const fp = path.join(cssDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  if (c.includes(MARKER)) {
    console.log('SKIP:', file);
    continue;
  }

  let changed = false;

  // 1. Add overflow-x:hidden to body.syx (the main body wrapper)
  //    Targets: body.syx{ OR .syx{  (the root class)
  const bodySyx = c.indexOf('body.syx{');
  if (bodySyx === -1) {
    // Try without body prefix — append a global rule instead
    c += '\nbody{overflow-x:hidden}';
    changed = true;
  } else {
    c = c.slice(0, bodySyx + 9) + 'overflow-x:hidden;' + c.slice(bodySyx + 9);
    changed = true;
  }

  // 2. Ensure .org-home-tokens__diagram has overflow-x:hidden (belt-and-suspenders)
  if (!c.includes('org-home-tokens{overflow-x:hidden')) {
    c = c.replace(
      /.org-home-tokens\{padding:/,
      '.org-home-tokens{overflow-x:hidden;padding:'
    );
    changed = true;
  }

  // 3. Add overflow-x:hidden to org-home-layers inner section
  if (!c.includes('org-home-layers__inner{overflow')) {
    c = c.replace(
      /.org-home-layers__inner\{/,
      '.org-home-layers__inner{overflow-x:hidden;'
    );
    changed = true;
  }

  c += '\n' + MARKER;
  fs.writeFileSync(fp, c, 'utf8');
  console.log(changed ? 'PATCHED:' : 'MARKER_ADDED:', file);
}
console.log('Done.');
