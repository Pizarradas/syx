/**
 * inject-icons.js
 * Injects new Lucide icon tokens and selectors into compiled CSS files.
 * Safe to run multiple times — uses idempotent marker before inserting.
 */
const fs   = require('fs');
const path = require('path');

const newIcons = [
  { token: 'file-text',   file: 'file-text.svg' },
  { token: 'git-branch',  file: 'git-branch.svg' },
  { token: 'bot',         file: 'bot.svg' },
  { token: 'activity',    file: 'activity.svg' },
  { token: 'check-circle',file: 'circle-check.svg' },
  { token: 'pie-chart',   file: 'chart-pie.svg' },
];

const base = '../img/icons/lucide';

// Build the CSS token block and selector block
const tokenBlock = newIcons
  .map(i => `--lc-icon-${i.token}:url(${base}/${i.file})`)
  .join(';') + ';';

const selectorBlock = '\n' + newIcons
  .map(i => `.atom-icon--lc-${i.token}:before{background-image:url(${base}/${i.file})}`)
  .join('\n');

// Already-injected marker
const MARKER = '--lc-icon-file-text';

const cssDir = path.join(__dirname, '..', 'css');
const files  = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

for (const file of files) {
  const fp = path.join(cssDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  if (c.includes(MARKER)) {
    console.log('SKIP (already patched):', file);
    continue;
  }

  // --- 1. Inject tokens after --lc-icon-coins
  const COIN_MARKER = '--lc-icon-coins:';
  const coinIdx = c.indexOf(COIN_MARKER);
  if (coinIdx === -1) {
    console.log('SKIP (no coins marker):', file);
    continue;
  }
  const semiAfterCoin = c.indexOf(';', coinIdx);
  c = c.slice(0, semiAfterCoin + 1) + tokenBlock + c.slice(semiAfterCoin + 1);

  // --- 2. Inject selectors after .atom-icon--lc-package:before { … }
  const PKG_MARKER = '.atom-icon--lc-package:before';
  const pkgIdx = c.lastIndexOf(PKG_MARKER);
  if (pkgIdx !== -1) {
    // Find the closing brace of the package rule
    const brace = c.indexOf('}', pkgIdx);
    c = c.slice(0, brace + 1) + selectorBlock + c.slice(brace + 1);
  }

  fs.writeFileSync(fp, c, 'utf8');
  console.log('PATCHED:', file);
}

console.log('Done.');
