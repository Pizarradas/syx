---
description: How to audit SYX tokens for violations, discrepancies, and unused tokens
---

# Workflow: Audit Tokens

Use this workflow to perform a health check on the SYX token system. Run it before any release or after significant token changes.

---

## Audit 1: Detect Primitive Token Violations in Components

**Goal:** Find any place where `--primitive-*` tokens are used directly inside component or page SCSS files (violation of the "never skip the token layer" rule).

// turbo
Run the following command from the project root:

```bash
# R01 lives in scripts/lib/rules.js — the validator knows every allowed
# path (abstracts/, themes/, base/, utilities/, pages/, setup-builder.scss,
# per-file exemptions). A hand-rolled grep reproduces none of that:
npm run validate
```

**Expected result:** `PASSED`. Every R01 line it reports is a violation to
fix by replacing the `--primitive-*` reference with the appropriate
`--semantic-*` token. (A raw grep for `var(--primitive-` over `scss/`
returns ~350 legitimate matches in exempt layers — do not use it as the
check.)

---

## Audit 2: Detect Hardcoded Values in Components

**Goal:** Find hardcoded color, spacing, or font-size values that should be tokens.

```bash
# Find oklch / hsl / rgb / hex colors in component SCSS
grep -rn -E "(oklch|hsl|rgb|#[0-9a-fA-F]{3,6})" scss/ --include="*.scss" | grep -v "_theme.scss" | grep -v "primitives/"

# Find raw rem/px values in component rules (excluding 0, 100%, and comment lines)
grep -rn -E ":\s+[0-9]+\.(rem|px|em)" scss/ --include="*.scss" | grep -v "_theme.scss" | grep -v "primitives/" | grep -v "mixins/"
```

**Expected result:** No meaningful matches. Exceptions: `0`, `100%`, `none`, and values inside mixin definitions themselves.

---

## Audit 3: Detect Raw CSS Instead of Mixins

**Goal:** Find raw `position`, `padding`, `margin`, or `transition` properties that should use SYX mixins.

```bash
# Raw position declarations
grep -rn "position: absolute\|position: fixed\|position: sticky" scss/ --include="*.scss" | grep -v "mixins/"

# Raw transition declarations
grep -rn -E "^\s+transition:" scss/ --include="*.scss" | grep -v "mixins/" | grep -v "_reset.scss"

# Raw padding shorthand (4 values)
grep -rn -E "^\s+padding: " scss/ --include="*.scss" | grep -v "mixins/"
```

**Expected result:** No matches. Every match is a candidate for mixin conversion.

---

## Audit 4: Run the Token Registry Validator

**Goal:** Cross-check SCSS-defined tokens against `tokens.json`.

```bash
npm run validate        # R05: component token in SCSS but not in tokens.json · R06: phantom entry
npm run check:huerfanos # references with no definition, tokens that only exist by their fallback
```

Review the output:

- **R05** → Add the token to `tokens.json` (component tier goes through `node scripts/propose.js token`).
- **R06** → The registry names a token no compiled CSS defines: obsolete or misspelled.

`scripts/validate-tokens.js` used to do this cross-check and was retired in the September 2026
audit: it did not share `scripts/lib/rules.js`, flagged 354 "R01 violations" that were all in
paths R01 allows, and reported 630 registered tokens as missing. Two validators with opposite
verdicts teach people to ignore both.

---

## Audit 5: Check for `!important` Usage

```bash
grep -rn "!important" scss/ --include="*.scss"
```

**Expected result:** Zero matches. `!important` is never needed in SYX due to `@layer`.

---

## Audit 6: Check Component Token Coverage

For each component in `component-registry.json`, verify its token file exists:

```bash
node -e "
const registry = require('./component-registry.json');
const fs = require('fs');
const all = [...registry.atoms, ...registry.molecules, ...registry.organisms];
all.forEach(c => {
  (c.tokenFiles || []).forEach(tf => {
    if (!fs.existsSync(tf)) console.log('MISSING token file:', c.name, tf);
  });
});
console.log('Token file check complete.');
"
```

---

## Audit 7: Theme Compilation Health Check

Compile all themes and check for errors or warnings:

```bash
npm run build 2>&1 | grep -E "(Error|Warning|Deprecation)"
```

**Expected result:** No errors. Deprecation warnings should be investigated and resolved.

---

## Audit Report Template

After running all audits, document findings in `AUDIT_REPORT.md`:

```markdown
## Token Audit — {DATE}

### Violations Found

| File                              | Line | Issue                                    | Status |
| --------------------------------- | ---- | ---------------------------------------- | ------ |
| scss/organisms/\_site-header.scss | 42   | Uses --primitive-color-gray-900 directly | TODO   |

### Clean Audits

- [x] Audit 5 (!important): 0 violations
- [x] Audit 7 (compilation): All 7 themes compile clean

### Action Items

- [ ] Fix primitive violation in \_site-header.scss:42
```
