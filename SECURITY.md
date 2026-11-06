# Security

## Reporting a vulnerability

Report it privately through GitHub: **Security → Report a vulnerability** in this repository. Please
do not open a public issue.

Include what you found, how to reproduce it and which version it affects. You will get a first reply
within seven days.

## Supported versions

Only the latest minor release gets security fixes.

## What is in scope

- `scripts/mcp-server.js` and the tools it exposes, including what they can read.
- `syx-init` and `syx-scan`, and anything else that runs on an installed package.
- `scripts/propose.js`, and any way past `contracts/trust.json` that does not need write access to
  the repository.
- The browser JavaScript in `js/syx-*.js`.

The trust hook in `.claude/settings.json` is a guard rail for an agent acting in good faith, and says
so. Getting around it from a shell is not a vulnerability. The boundary is the review at merge time.
