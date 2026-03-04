# SYX Validation Report — 2026-03-04

**Verdict: ✅ PASSED**

---

## Runtime Surface

| Metric | Count |
|---|---|
| Total custom properties in runtime CSS | 955 |
| Official (SYX-prefixed) | 664 |
| Legacy (no SYX prefix) | 291 |

## Source vs Runtime Gaps

### ✅ No phantom tokens

### ✅ All official tokens documented

## Legacy Vars (R07) — 291 found

| Lifecycle | Count | Action |
|---|---|---|
| 🔒 keep    | 107   | External dependency or intentional contract. No action. |
| 🔄 migrate | 68 | Has a SYX equivalent. Replace `var(old)` → `var(new)`. |
| 🗑️ kill    | 116   | No SYX equivalent. Remove from codebase. |

### Top migration candidates

- `--base-measure` → `--primitive-space-base`
- `--color-blue` → `--primitive-color-blue-500`
- `--color-green` → `--primitive-color-green-500`
- `--color-pink` → `--primitive-color-pink-500`
- `--color-pink-lt-1` → `--primitive-color-pink-100`
- `--color-purple` → `--primitive-color-purple-500`
- `--color-yellow` → `--primitive-color-yellow-500`
- `--color-primary` → `--semantic-color-primary`
- `--color-secondary` → `--semantic-color-secondary`
- `--color-secondary-lt-1` → `--primitive-color-pink-100`
- … and 58 more (see contracts/lint-contract.json)

## SCSS Rule Violations

| Rule | Description | Count | Status |
|---|---|---|---|
| R01 | Primitive tokens in components | 0 | ✅ |
| R02 | !important usage | 0 | ✅ |
| R03 | Raw transition: property | 0 | ✅ |
| R04 | Raw position: absolute/fixed/sticky | 0 | ✅ |

