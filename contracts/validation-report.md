# SYX Validation Report — 2026-08-31

**Verdict: ✅ PASSED**

---

## Runtime Surface

| Metric | Count |
|---|---|
| Total custom properties in runtime CSS | 1334 |
| Official (SYX-prefixed) | 1079 |
| Legacy (no SYX prefix) | 255 |

## Source vs Runtime Gaps

### ✅ No phantom tokens

### ✅ All official tokens documented

## Legacy Vars (R07) — 255 found

| Lifecycle | Count | Action |
|---|---|---|
| 🔒 keep    | 107   | External dependency or intentional contract. No action. |
| 🔄 migrate | 27 | Has a SYX equivalent. Replace `var(old)` → `var(new)`. |
| 🗑️ kill    | 121   | No SYX equivalent. Remove from codebase. |

### Top migration candidates

- `--base-measure` → `--primitive-space-base`
- `--font-family-1` → `--semantic-font-family-body`
- `--font-family-2` → `--semantic-font-family-heading`
- `--font-weight-1` → `--primitive-font-weight-regular`
- `--font-weight-2` → `--primitive-font-weight-bold`
- `--font-bold`
- `--gap-1`
- `--inner-1`
- `--font-size-1`
- `--font-size-2`
- … and 17 more (see contracts/lint-contract.json)

## SCSS Rule Violations

| Rule | Description | Count | Status |
|---|---|---|---|
| R01 | Primitive tokens in components | 0 | ✅ |
| R02 | !important usage | 0 | ✅ |
| R03 | Raw transition: property | 0 | ✅ |
| R04 | Raw position: absolute/fixed/sticky | 0 | ✅ |

