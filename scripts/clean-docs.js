const fs = require('fs');
let c = fs.readFileSync('AI_GUIDELINES.md', 'utf8');
// The old "thou shalt not" block starts after the new Implementation Check section ends
// Look for the duplicate by finding the second occurrence of the pattern
const pattern = '## 🚫 The ';
const first = c.indexOf(pattern);
const second = c.indexOf(pattern, first + 1);
if (second > -1) {
  // Remove everything from the second occurrence onwards (it's the old duplicated block)
  const cleaned = c.slice(0, second).replace(/\n---\n\n$/, '\n');
  fs.writeFileSync('AI_GUIDELINES.md', cleaned, 'utf8');
  console.log('Removed duplicate section at char', second, '— file now', cleaned.length, 'chars');
} else {
  console.log('No duplicate found. File is', c.length, 'chars');
}
