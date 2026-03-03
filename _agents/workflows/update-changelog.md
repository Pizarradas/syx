---
description: How to maintain the SYX CHANGELOG.md with Conventional Commits format
---

# Workflow: Update CHANGELOG.md

Use this workflow every time you ship a meaningful change to SYX. A well-maintained changelog is machine-readable by AI tools and provides clear version history.

---

## Commit Message Convention

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
{type}({scope}): {short description}

{optional body}

{optional footer}
```

### Types

| Type       | When to use                                          |
| ---------- | ---------------------------------------------------- |
| `feat`     | New component, new token, new theme, new mixin       |
| `fix`      | Bug fix in existing component or token               |
| `refactor` | Code restructuring without behavior change           |
| `docs`     | Documentation-only changes                           |
| `chore`    | Build scripts, configs, tooling updates              |
| `style`    | Formatting, whitespace — no logic change             |
| `perf`     | Performance improvement (e.g., CSS size reduction)   |
| `breaking` | Breaking change — also add `BREAKING CHANGE:` footer |

### Scopes (SYX-specific)

| Scope      | Examples                                           |
| ---------- | -------------------------------------------------- |
| `atom`     | `feat(atom): add stat-counter component`           |
| `molecule` | `fix(molecule): correct form-field focus ring`     |
| `organism` | `feat(organism): add home-cta section`             |
| `token`    | `feat(token): add semantic-space-inset-xl`         |
| `theme`    | `feat(theme): add midnight theme`                  |
| `mixin`    | `fix(mixin): make border-radius null-safe`         |
| `build`    | `chore(build): add validate-tokens script`         |
| `docs`     | `docs: update AUTHORING-GUIDE with ellipsis mixin` |

---

## CHANGELOG.md Format

The changelog follows [Keep a Changelog](https://keepachangelog.com/) with Conventional Commits types:

```markdown
## [Unreleased]

### Added

- `atom-stat-counter`: new counter component with animated value display (#42)

### Fixed

- `mol-form-field`: focus ring now uses `@include focus-ring()` correctly (#38)

### Changed

- `org-site-header`: refactored logo mixin to use Method 1 CSS token instead of Method 3 `@if`

### Deprecated

- Token `--component-header-height-old`: use `--component-header-block-size` instead

### Removed

- Legacy `.u-*` utility class aliases (deprecated since v2.x)

### Breaking Changes

- None

---

## [3.0.3] — 2026-02-XX
```

---

## Step-by-Step: Adding a CHANGELOG Entry

1. **Open `CHANGELOG.md`**

2. **Locate or create the `## [Unreleased]` section** at the top of the file.

3. **Add your entry under the correct sub-heading:**
   - `### Added` — new features, components, tokens
   - `### Fixed` — bug corrections
   - `### Changed` — modifications to existing behavior
   - `### Deprecated` — things that will be removed in a future version
   - `### Removed` — deletions
   - `### Breaking Changes` — changes that break existing usage

4. **Format each entry as:**

   ```
   - `{component-name}` or `{file}`: short description of what changed
   ```

5. **On release day**, replace `## [Unreleased]` with `## [{version}] — {YYYY-MM-DD}`.

---

## Release Checklist

Before bumping the version:

- [ ] `## [Unreleased]` section has all changes documented
- [ ] `package.json` version updated (`"version": "X.Y.Z"`)
- [ ] `README.md` version badge updated
- [ ] All 6 themes compile: `npm run build`
- [ ] `node scripts/validate-tokens.js` passes with no critical errors
- [ ] `## [Unreleased]` renamed to `## [X.Y.Z] — {date}`
- [ ] New empty `## [Unreleased]` section added at top
