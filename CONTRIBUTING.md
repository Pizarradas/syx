# Contributing to SYX

SCSS conventions live in [`scss/CONTRIBUTING.md`](scss/CONTRIBUTING.md). This page covers how a change
gets in.

## Before you start

```bash
npm ci
npm run check
```

`npm run check` is the whole verdict and stops at the first failure. `npm run check:todo` runs every
step anyway and lists what failed, which is more useful after a change that crosses layers.

## Who may change what

`contracts/trust.json` grades every path, and `classify_change` or `npm run check:clasificacion`
answers for any file. In short: derived artifacts regenerate themselves, components and docs go
through review, and primitives, semantics, themes, mixins, `scripts/` and the contracts need a
person's approval, shown by the `aprobado-humano` label on the PR.

Agents follow the same rules. See `AGENTS.md`.

## Pull requests

- Generated files are not edited by hand. `npm run build` and `npm run validate:report` regenerate
  them, and CI compares the result with what you committed.
- Add a line to `CHANGELOG.md` under `[Unreleased]`, saying what changed and why.
- A new guard needs a mutation case in `tests/mutacion/casos/`: a guard nobody has seen fail proves
  nothing.
- Fixing an accessibility issue means adding the pair or the case that would have caught it.

## Releases

A release is a commit that moves `[Unreleased]` into a dated section and updates the version
everywhere `npm run check:version` looks, followed by a `vX.Y.Z` tag. The tag runs `release.yml`, which
publishes to npm. See *Versioning* in the README for what goes in each kind of release.
