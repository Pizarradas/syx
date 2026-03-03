# SYX Validation Report — 2026-03-03

**Verdict: ⚠️ WARNINGS**

---

## Runtime Surface

| Metric | Count |
|---|---|
| Total custom properties in runtime CSS | 943 |
| Official (SYX-prefixed) | 664 |
| Legacy (no SYX prefix) | 279 |

## Source vs Runtime Gaps

### ⚠️ Phantom Tokens (1)
_Exist in tokens.json but not emitted in runtime CSS_

- `--component-form-field-height`

### ✅ All component tokens documented

## Legacy Vars (R07) — 279 found

_No official SYX prefix. Requires investigation._

- `--base-measure` → `var(--primitive-space-base)`
- `--color-blue` → `var(--primitive-color-blue-500)`
- `--color-green` → `var(--primitive-color-green-500)`
- `--color-pink` → `var(--primitive-color-pink-500)`
- `--color-pink-lt-1` → `var(--primitive-color-pink-50)`
- `--color-purple` → `var(--primitive-color-purple-500)`
- `--color-yellow` → `var(--primitive-color-yellow-500)`
- `--color-primary` → `var(--semantic-color-primary)`
- `--color-secondary` → `var(--semantic-color-secondary)`
- `--color-secondary-lt-1` → `var(--semantic-color-bg-secondary)`
- `--color-tertiary` → `var(--semantic-color-tertiary)`
- `--color-quaternary` → `var(--semantic-color-quaternary)`
- `--color-quinary` → `var(--semantic-color-quinary)`
- `--color-selector-placeholder` → `var(--semantic-color-placeholder)`
- `--color-action-link` → `var(--semantic-color-link-default)`
- `--color-action-selection` → `var(--semantic-color-selection-text)`
- `--background-action-selection` → `var(--semantic-color-selection-bg)`
- `--color-state-disabled` → `var(--semantic-color-disabled-bg)`
- `--color-state-focus` → `var(--semantic-focus-ring-color)`
- `--color-state-hover-primary` → `var(--semantic-color-state-hover-primary)`
- … and 259 more (see contracts/lint-contract.json)

## SCSS Rule Violations

| Rule | Description | Count | Status |
|---|---|---|---|
| R01 | Primitive tokens in components | 0 | ✅ |
| R02 | !important usage | 0 | ✅ |
| R03 | Raw transition: property | 0 | ✅ |
| R04 | Raw position: absolute/fixed/sticky | 0 | ✅ |

