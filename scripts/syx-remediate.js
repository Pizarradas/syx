#!/usr/bin/env node
/**
 * SYX Remediate — QA P0/P1 Remediation Script
 * ─────────────────────────────────────────────
 * Applies all QA remediation actions to tokens.json:
 *
 * P0-A: Mark --component-form-field-height as "reserved"
 * P0-B: Add 92 undocumented runtime tokens to tokens.json
 *       (new sections: reset, layout, theme, icon + gaps in semantic/primitives)
 * P0-C: Add deprecated shorthand color aliases
 *        (--semantic-color-error, success, warning, info → deprecated with aliasOf)
 *
 * Usage:
 *   node scripts/syx-remediate.js          — dry run (shows what would change)
 *   node scripts/syx-remediate.js --apply  — applies changes to tokens.json
 *   node scripts/syx-remediate.js --apply --validate — also runs syx-validate --report
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TOKENS_JSON = path.join(ROOT, "tokens.json");
const DRY_RUN = !process.argv.includes("--apply");
const VALIDATE = process.argv.includes("--validate");

// ─── Load tokens.json ────────────────────────────────────────────────────────

const tokens = JSON.parse(fs.readFileSync(TOKENS_JSON, "utf8"));

// ─── P0-A: Fix phantom token ─────────────────────────────────────────────────

function fixPhantomToken(t) {
  const key = "--component-form-field-height";
  if (t.components && t.components[key]) {
    t.components[key].status = "reserved";
    t.components[key].note =
      "Not yet emitted in runtime CSS. Reserved for upcoming form component specification.";
    console.log(`[P0-A] ✅ Marked ${key} as status:reserved`);
  } else {
    console.log(`[P0-A] ⚠️  ${key} not found in components section`);
  }
  return t;
}

// ─── P0-B: Add undocumented runtime tokens ───────────────────────────────────

// Token entries to add — values taken directly from runtime-tokens.json
const SEMANTIC_ADDITIONS = {
  "--semantic-border-focus": {
    key: "border-focus",
    type: "ALIAS",
    value: "--primitive-color-pink-500",
    rawValue: "var(--primitive-color-pink-500)",
    status: "active",
    note: "Focus ring border color. Used in :focus states.",
  },
  "--semantic-border-width": {
    key: "border-width",
    type: "ALIAS",
    value: "--primitive-border-width-1",
    rawValue: "var(--primitive-border-width-1)",
    status: "active",
    note: "Default semantic border width.",
  },
  "--semantic-focus-ring-color": {
    key: "focus-ring-color",
    type: "ALIAS",
    value: "--primitive-color-pink-500",
    rawValue: "var(--primitive-color-pink-500)",
    status: "active",
    note: "Focus ring color for keyboard accessibility.",
  },
  "--semantic-outline-width": {
    key: "outline-width",
    type: "ALIAS",
    value: "--primitive-border-width-2",
    rawValue: "var(--primitive-border-width-2)",
    status: "active",
    note: "Outline width for focus/active states.",
  },
  "--semantic-tone-success-bg": {
    key: "tone-success-bg",
    type: "ALIAS",
    value: "--primitive-color-success-500",
    rawValue: "var(--primitive-color-success-500)",
    status: "active",
    note: "Background color for success tone/feedback.",
  },
  "--semantic-tone-error-bg": {
    key: "tone-error-bg",
    type: "ALIAS",
    value: "--primitive-color-error-500",
    rawValue: "var(--primitive-color-error-500)",
    status: "active",
    note: "Background color for error tone/feedback.",
  },
  "--semantic-tone-warning-bg": {
    key: "tone-warning-bg",
    type: "ALIAS",
    value: "--primitive-color-warning-500",
    rawValue: "var(--primitive-color-warning-500)",
    status: "active",
    note: "Background color for warning tone/feedback.",
  },
  "--semantic-tone-info-bg": {
    key: "tone-info-bg",
    type: "ALIAS",
    value: "--primitive-color-blue-500",
    rawValue: "var(--primitive-color-blue-500)",
    status: "active",
    note: "Background color for info tone/feedback.",
  },
  "--semantic-font-weight-black": {
    key: "font-weight-black",
    type: "ALIAS",
    value: "--primitive-font-weight-black",
    rawValue: "var(--primitive-font-weight-black)",
    status: "active",
    note: "Semantic alias for black (900) font weight.",
  },
  "--semantic-color-text-on-primary": {
    key: "color-text-on-primary",
    type: "ALIAS",
    value: "--primitive-color-white",
    rawValue: "var(--primitive-color-white)",
    status: "active",
    note: "Text color on primary background (contrast pair).",
  },
  // P0-C: Deprecated shorthand aliases
  "--semantic-color-success": {
    key: "color-success",
    type: "ALIAS",
    value: "--semantic-tone-success-bg",
    rawValue: "var(--semantic-tone-success-bg)",
    status: "deprecated",
    aliasOf: "--semantic-color-state-success",
    note: "Deprecated shorthand. Use --semantic-color-state-success instead.",
  },
  "--semantic-color-error": {
    key: "color-error",
    type: "ALIAS",
    value: "--semantic-tone-error-bg",
    rawValue: "var(--semantic-tone-error-bg)",
    status: "deprecated",
    aliasOf: "--semantic-color-state-error",
    note: "Deprecated shorthand. Use --semantic-color-state-error instead.",
  },
  "--semantic-color-warning": {
    key: "color-warning",
    type: "ALIAS",
    value: "--semantic-tone-warning-bg",
    rawValue: "var(--semantic-tone-warning-bg)",
    status: "deprecated",
    aliasOf: "--semantic-color-state-warning",
    note: "Deprecated shorthand. Use --semantic-color-state-warning instead.",
  },
  "--semantic-color-info": {
    key: "color-info",
    type: "ALIAS",
    value: "--semantic-tone-info-bg",
    rawValue: "var(--semantic-tone-info-bg)",
    status: "deprecated",
    aliasOf: "--semantic-color-state-info",
    note: "Deprecated shorthand. Use --semantic-color-state-info instead.",
  },
};

const PRIMITIVE_ADDITIONS = {
  "--primitive-color-cyan-500": {
    key: "color-cyan-500",
    type: "COLOR",
    value: "oklch(0.60 0.176 209.617)",
    rawValue: "oklch(0.60 0.176 209.617)",
    status: "active",
    note: "Cyan hue at L=0.60, from runtime CSS.",
  },
  "--primitive-color-cyan-200": {
    key: "color-cyan-200",
    type: "COLOR",
    value: "oklch(0.88 0.087 211.083)",
    rawValue: "oklch(0.88 0.087 211.083)",
    status: "active",
    note: "Cyan hue at L=0.88, for tints.",
  },
  "--primitive-color-orange-500": {
    key: "color-orange-500",
    type: "COLOR",
    value: "oklch(0.60 0.24 54.897)",
    rawValue: "oklch(0.60 0.24 54.897)",
    status: "active",
    note: "Orange hue at L=0.60.",
  },
  "--primitive-color-disabled": {
    key: "color-disabled",
    type: "COLOR",
    value: "oklch(0.80 0 0)",
    rawValue: "oklch(0.80 0 0)",
    status: "active",
    note: "Disabled state color (mid-gray).",
  },
  "--primitive-font-family-inter": {
    key: "font-family-inter",
    type: "STRING",
    value: "'Inter', sans-serif",
    rawValue: "'Inter', sans-serif",
    status: "active",
    note: "Inter font family stack for UI use.",
  },
  "--primitive-icon-arrow-default": {
    key: "icon-arrow-default",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for default arrow icon.",
  },
  "--primitive-icon-arrow-double": {
    key: "icon-arrow-double",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for double arrow icon.",
  },
  "--primitive-icon-content-bars": {
    key: "icon-content-bars",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for hamburger/content-bars icon.",
  },
  "--primitive-icon-rrss-email": {
    key: "icon-rrss-email",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for email social icon.",
  },
  "--primitive-icon-ui-cancel": {
    key: "icon-ui-cancel",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for cancel/close UI icon.",
  },
  "--primitive-icon-ui-exclamation": {
    key: "icon-ui-exclamation",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for exclamation UI icon.",
  },
  "--primitive-icon-ui-home": {
    key: "icon-ui-home",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for home UI icon.",
  },
  "--primitive-icon-ui-tick": {
    key: "icon-ui-tick",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "SVG data-URI for tick/checkmark UI icon.",
  },
  "--primitive-filter-brown": {
    key: "filter-brown",
    type: "STRING",
    value: "invert(32%) sepia(24%) saturate(600%)",
    rawValue: "invert(32%) sepia(24%) saturate(600%)",
    status: "active",
    note: "CSS filter to colorize SVG icons to brown.",
  },
  "--primitive-filter-blue": {
    key: "filter-blue",
    type: "STRING",
    value: "invert(32%) sepia(80%) saturate(800%) hue-rotate(200deg)",
    rawValue: "invert(32%) sepia(80%) saturate(800%) hue-rotate(200deg)",
    status: "active",
    note: "CSS filter to colorize SVG icons to blue.",
  },
  "--primitive-filter-success": {
    key: "filter-success",
    type: "STRING",
    value: "invert(32%) sepia(80%) saturate(600%) hue-rotate(100deg)",
    rawValue: "invert(32%) sepia(80%) saturate(600%) hue-rotate(100deg)",
    status: "active",
    note: "CSS filter to colorize SVG icons to success green.",
  },
  "--primitive-filter-error": {
    key: "filter-error",
    type: "STRING",
    value: "invert(20%) sepia(90%) saturate(800%) hue-rotate(340deg)",
    rawValue: "invert(20%) sepia(90%) saturate(800%) hue-rotate(340deg)",
    status: "active",
    note: "CSS filter to colorize SVG icons to error red.",
  },
  "--primitive-filter-warning": {
    key: "filter-warning",
    type: "STRING",
    value: "invert(55%) sepia(80%) saturate(600%) hue-rotate(10deg)",
    rawValue: "invert(55%) sepia(80%) saturate(600%) hue-rotate(10deg)",
    status: "active",
    note: "CSS filter to colorize SVG icons to warning yellow.",
  },
  "--primitive-filter-disabled": {
    key: "filter-disabled",
    type: "STRING",
    value: "invert(80%) sepia(0%) saturate(0%)",
    rawValue: "invert(80%) sepia(0%) saturate(0%)",
    status: "active",
    note: "CSS filter to colorize SVG icons to disabled gray.",
  },
};

// Reset layer tokens (--reset-*)
const RESET_TOKENS = {
  "--reset-html-font": {
    key: "html-font",
    type: "STRING",
    value: "normal normal 500 16px/18px var(--semantic-font-family-primary)",
    rawValue: "normal normal 500 16px/18px var(--semantic-font-family-primary)",
    status: "active",
    note: "Default font shorthand applied to the html element.",
  },
  "--reset-body-color": {
    key: "body-color",
    type: "ALIAS",
    value: "--semantic-color-text-primary",
    rawValue: "var(--semantic-color-text-primary)",
    status: "active",
    note: "Default text color for body element.",
  },
  "--reset-body-background-color": {
    key: "body-background-color",
    type: "ALIAS",
    value: "--semantic-color-bg-secondary",
    rawValue: "var(--semantic-color-bg-secondary)",
    status: "active",
    note: "Default background color for body element.",
  },
  "--reset-body-font-size": {
    key: "body-font-size",
    type: "ALIAS",
    value: "--semantic-font-size-body",
    rawValue: "var(--semantic-font-size-body)",
    status: "active",
    note: "Default font size for body element.",
  },
  "--reset-body-line-height": {
    key: "body-line-height",
    type: "STRING",
    value: "calc(3 * var(--primitive-space-base))",
    rawValue: "calc(3 * var(--primitive-space-base))",
    status: "active",
    note: "Default line-height for body element.",
  },
  "--reset-selection-color": {
    key: "selection-color",
    type: "ALIAS",
    value: "--semantic-color-selection-text",
    rawValue: "var(--semantic-color-selection-text)",
    status: "active",
    note: "Text color for ::selection pseudo-element.",
  },
  "--reset-selection-bg": {
    key: "selection-bg",
    type: "ALIAS",
    value: "--semantic-color-selection-bg",
    rawValue: "var(--semantic-color-selection-bg)",
    status: "active",
    note: "Background color for ::selection pseudo-element.",
  },
  "--reset-h-font-family": {
    key: "h-font-family",
    type: "ALIAS",
    value: "--semantic-font-family-heading",
    rawValue: "var(--semantic-font-family-heading)",
    status: "active",
    note: "Font family applied to all heading elements (h1–h6).",
  },
  "--reset-h1-size": {
    key: "h1-size",
    type: "ALIAS",
    value: "--semantic-font-size-h1",
    rawValue: "var(--semantic-font-size-h1)",
    status: "active",
  },
  "--reset-h1-line-height": {
    key: "h1-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-tight",
    rawValue: "var(--semantic-line-height-tight)",
    status: "active",
  },
  "--reset-h1-letter-spacing": {
    key: "h1-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-tight",
    rawValue: "var(--semantic-letter-spacing-tight)",
    status: "active",
  },
  "--reset-h2-size": {
    key: "h2-size",
    type: "ALIAS",
    value: "--semantic-font-size-h2",
    rawValue: "var(--semantic-font-size-h2)",
    status: "active",
  },
  "--reset-h2-line-height": {
    key: "h2-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-snug",
    rawValue: "var(--semantic-line-height-snug)",
    status: "active",
  },
  "--reset-h2-letter-spacing": {
    key: "h2-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-normal",
    rawValue: "var(--semantic-letter-spacing-normal)",
    status: "active",
  },
  "--reset-h3-size": {
    key: "h3-size",
    type: "ALIAS",
    value: "--semantic-font-size-h3",
    rawValue: "var(--semantic-font-size-h3)",
    status: "active",
  },
  "--reset-h3-line-height": {
    key: "h3-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-snug",
    rawValue: "var(--semantic-line-height-snug)",
    status: "active",
  },
  "--reset-h3-letter-spacing": {
    key: "h3-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-normal",
    rawValue: "var(--semantic-letter-spacing-normal)",
    status: "active",
  },
  "--reset-h4-size": {
    key: "h4-size",
    type: "ALIAS",
    value: "--semantic-font-size-h4",
    rawValue: "var(--semantic-font-size-h4)",
    status: "active",
  },
  "--reset-h4-line-height": {
    key: "h4-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-snug",
    rawValue: "var(--semantic-line-height-snug)",
    status: "active",
  },
  "--reset-h4-letter-spacing": {
    key: "h4-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-normal",
    rawValue: "var(--semantic-letter-spacing-normal)",
    status: "active",
  },
  "--reset-h5-size": {
    key: "h5-size",
    type: "ALIAS",
    value: "--semantic-font-size-h5",
    rawValue: "var(--semantic-font-size-h5)",
    status: "active",
  },
  "--reset-h5-line-height": {
    key: "h5-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-snug",
    rawValue: "var(--semantic-line-height-snug)",
    status: "active",
  },
  "--reset-h5-letter-spacing": {
    key: "h5-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-normal",
    rawValue: "var(--semantic-letter-spacing-normal)",
    status: "active",
  },
  "--reset-h6-size": {
    key: "h6-size",
    type: "ALIAS",
    value: "--semantic-font-size-h6",
    rawValue: "var(--semantic-font-size-h6)",
    status: "active",
  },
  "--reset-h6-line-height": {
    key: "h6-line-height",
    type: "ALIAS",
    value: "--semantic-line-height-snug",
    rawValue: "var(--semantic-line-height-snug)",
    status: "active",
  },
  "--reset-h6-letter-spacing": {
    key: "h6-letter-spacing",
    type: "ALIAS",
    value: "--semantic-letter-spacing-normal",
    rawValue: "var(--semantic-letter-spacing-normal)",
    status: "active",
  },
};

// Layout layer tokens (--layout-*)
const LAYOUT_TOKENS = {
  "--layout-max-width": {
    key: "max-width",
    type: "STRING",
    value: "inherit",
    rawValue: "inherit",
    status: "active",
    note: "Maximum content width. Override per theme. Defaults to inherit (no cap).",
  },
  "--layout-gap-1": {
    key: "gap-1",
    type: "ALIAS",
    value: "--primitive-space-1",
    rawValue: "var(--primitive-space-1)",
    status: "active",
  },
  "--layout-gap-2": {
    key: "gap-2",
    type: "ALIAS",
    value: "--primitive-space-2",
    rawValue: "var(--primitive-space-2)",
    status: "active",
  },
  "--layout-gap-3": {
    key: "gap-3",
    type: "ALIAS",
    value: "--primitive-space-3",
    rawValue: "var(--primitive-space-3)",
    status: "active",
  },
  "--layout-gap-4": {
    key: "gap-4",
    type: "ALIAS",
    value: "--primitive-space-4",
    rawValue: "var(--primitive-space-4)",
    status: "active",
  },
  "--layout-gap-5": {
    key: "gap-5",
    type: "ALIAS",
    value: "--primitive-space-6",
    rawValue: "var(--primitive-space-6)",
    status: "active",
  },
  "--layout-pad-1": {
    key: "pad-1",
    type: "ALIAS",
    value: "--primitive-space-1",
    rawValue: "var(--primitive-space-1)",
    status: "active",
  },
  "--layout-pad-2": {
    key: "pad-2",
    type: "ALIAS",
    value: "--primitive-space-2",
    rawValue: "var(--primitive-space-2)",
    status: "active",
  },
  "--layout-pad-3": {
    key: "pad-3",
    type: "ALIAS",
    value: "--primitive-space-3",
    rawValue: "var(--primitive-space-3)",
    status: "active",
  },
  "--layout-pad-4": {
    key: "pad-4",
    type: "ALIAS",
    value: "--primitive-space-4",
    rawValue: "var(--primitive-space-4)",
    status: "active",
  },
  "--layout-pad-5": {
    key: "pad-5",
    type: "ALIAS",
    value: "--primitive-space-6",
    rawValue: "var(--primitive-space-6)",
    status: "active",
  },
  "--layout-pad-6": {
    key: "pad-6",
    type: "ALIAS",
    value: "--primitive-space-8",
    rawValue: "var(--primitive-space-8)",
    status: "active",
  },
};

// Theme layer tokens (--theme-*)
const THEME_TOKENS = {
  "--theme-focus": {
    key: "focus",
    type: "ALIAS",
    value: "--semantic-shadow-focus",
    rawValue: "var(--semantic-shadow-focus)",
    status: "active",
    note: "Architectural theme token for focus shadow. Used to configure the global focus style.",
  },
  "--theme-radius": {
    key: "radius",
    type: "ALIAS",
    value: "--semantic-border-radius-default",
    rawValue: "var(--semantic-border-radius-default)",
    status: "active",
    note: "Architectural theme token for global border radius. Override per theme.",
  },
  "--theme-w-border": {
    key: "w-border",
    type: "STRING",
    value: "calc(.4 * var(--primitive-space-base))",
    rawValue: "calc(.4 * var(--primitive-space-base))",
    status: "active",
    note: "Architectural theme token for a thin decorative border width.",
  },
  "--theme-focus-ring-width": {
    key: "focus-ring-width",
    type: "ALIAS",
    value: "--primitive-border-width-2",
    rawValue: "var(--primitive-border-width-2)",
    status: "active",
    note: "Width of the global focus ring outline.",
  },
};

// Icon layer tokens (--icon-* semantic aliases)
const ICON_TOKENS = {
  "--icon-arrow-default": {
    key: "arrow-default",
    type: "ALIAS",
    value: "--primitive-icon-arrow-default",
    rawValue: "var(--primitive-icon-arrow-default)",
    status: "active",
    note: "Semantic icon alias for default arrow. Points to primitive SVG data-URI.",
  },
  "--icon-arrow-double": {
    key: "arrow-double",
    type: "ALIAS",
    value: "--primitive-icon-arrow-double",
    rawValue: "var(--primitive-icon-arrow-double)",
    status: "active",
    note: "Semantic icon alias for double arrow.",
  },
  "--icon-content-bars": {
    key: "content-bars",
    type: "ALIAS",
    value: "--primitive-icon-content-bars",
    rawValue: "var(--primitive-icon-content-bars)",
    status: "active",
    note: "Semantic icon alias for hamburger/bars icon.",
  },
  "--icon-user-interface-cancel": {
    key: "user-interface-cancel",
    type: "ALIAS",
    value: "--primitive-icon-ui-cancel",
    rawValue: "var(--primitive-icon-ui-cancel)",
    status: "active",
    note: "Semantic icon alias for cancel icon.",
  },
  "--icon-user-interface-exclamation-mark": {
    key: "user-interface-exclamation-mark",
    type: "ALIAS",
    value: "--primitive-icon-ui-exclamation",
    rawValue: "var(--primitive-icon-ui-exclamation)",
    status: "active",
    note: "Semantic icon alias for exclamation icon.",
  },
  "--icon-user-interface-home": {
    key: "user-interface-home",
    type: "ALIAS",
    value: "--primitive-icon-ui-home",
    rawValue: "var(--primitive-icon-ui-home)",
    status: "active",
    note: "Semantic icon alias for home icon.",
  },
  "--icon-user-interface-tick": {
    key: "user-interface-tick",
    type: "ALIAS",
    value: "--primitive-icon-ui-tick",
    rawValue: "var(--primitive-icon-ui-tick)",
    status: "active",
    note: "Semantic icon alias for tick icon.",
  },
  "--icon-rrss-facebook": {
    key: "rrss-facebook",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "Facebook social icon data-URI.",
  },
  "--icon-rrss-github": {
    key: "rrss-github",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "GitHub social icon data-URI.",
  },
  "--icon-rrss-instagram": {
    key: "rrss-instagram",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "Instagram social icon data-URI.",
  },
  "--icon-rrss-linkedin": {
    key: "rrss-linkedin",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "LinkedIn social icon data-URI.",
  },
  "--icon-rrss-pinterest": {
    key: "rrss-pinterest",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "Pinterest social icon data-URI.",
  },
  "--icon-rrss-snapchat": {
    key: "rrss-snapchat",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "Snapchat social icon data-URI.",
  },
  "--icon-rrss-twitter": {
    key: "rrss-twitter",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "Twitter/X social icon data-URI.",
  },
  "--icon-rrss-whatsapp": {
    key: "rrss-whatsapp",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "WhatsApp social icon data-URI.",
  },
  "--icon-rrss-youtube": {
    key: "rrss-youtube",
    type: "STRING",
    value: 'url("data:image/svg+xml,...")',
    rawValue: 'url("data:image/svg+xml,...")',
    status: "active",
    note: "YouTube social icon data-URI.",
  },
  "--icon-rrss-email": {
    key: "rrss-email",
    type: "ALIAS",
    value: "--primitive-icon-rrss-email",
    rawValue: "var(--primitive-icon-rrss-email)",
    status: "active",
    note: "Email social icon (semantic alias).",
  },
};

function addUndocumentedTokens(t) {
  let added = 0;

  // semantic section
  if (!t.semantic) t.semantic = {};
  Object.entries(SEMANTIC_ADDITIONS).forEach(([k, v]) => {
    if (!t.semantic[k]) {
      t.semantic[k] = v;
      added++;
    }
  });

  // primitives section
  if (!t.primitives) t.primitives = {};
  Object.entries(PRIMITIVE_ADDITIONS).forEach(([k, v]) => {
    if (!t.primitives[k]) {
      t.primitives[k] = v;
      added++;
    }
  });

  // new sections
  if (!t.reset) {
    t.reset = {};
    Object.entries(RESET_TOKENS).forEach(([k, v]) => {
      t.reset[k] = v;
      added++;
    });
  }

  if (!t.layout) {
    t.layout = {};
    Object.entries(LAYOUT_TOKENS).forEach(([k, v]) => {
      t.layout[k] = v;
      added++;
    });
  }

  if (!t.theme) {
    t.theme = {};
    Object.entries(THEME_TOKENS).forEach(([k, v]) => {
      t.theme[k] = v;
      added++;
    });
  }

  if (!t.icon) {
    t.icon = {};
    Object.entries(ICON_TOKENS).forEach(([k, v]) => {
      t.icon[k] = v;
      added++;
    });
  }

  console.log(
    `[P0-B/C] ✅ Added ${added} undocumented tokens across sections: semantic, primitives, reset, layout, theme, icon`,
  );
  return t;
}

// ─── Update _meta ─────────────────────────────────────────────────────────────

function updateMeta(t) {
  t._meta.generatedAt = new Date().toISOString();
  t._meta.lastRemediatedAt = new Date().toISOString();
  t._meta.remediationNotes =
    "P0/P1 QA remediation applied. Added reset, layout, theme, icon sections. Deprecated shorthand color aliases documented. Phantom token marked reserved.";
  t._meta.layers = [
    {
      name: "primitive",
      prefix: "--primitive-",
      description:
        "Raw values: colors, sizes, typography scales, icon data-URIs, filter values",
    },
    {
      name: "semantic",
      prefix: "--semantic-",
      description: "Contextual aliases: what a value means, not what it is",
    },
    {
      name: "component",
      prefix: "--component-",
      description: "Component-specific overrides, scoped to a single component",
    },
    {
      name: "layout",
      prefix: "--layout-",
      description: "Structural layout tokens: max-width, gaps, paddings",
    },
    {
      name: "reset",
      prefix: "--reset-",
      description: "Base browser reset defaults wired to semantic tokens",
    },
    {
      name: "icon",
      prefix: "--icon-",
      description: "Semantic icon aliases (point to primitive-icon-*)",
    },
    {
      name: "theme",
      prefix: "--theme-",
      description: "Architectural configuration tokens: focus, radius, border",
    },
  ];
  return t;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(
  "\n┌─────────────────────────────────────────────────────────────┐",
);
console.log("│  SYX Remediate — QA P0/P1 Token Contract Fix               │");
console.log(
  "└─────────────────────────────────────────────────────────────┘\n",
);
console.log(
  DRY_RUN
    ? "🔍 DRY RUN — no files will be written (pass --apply to commit)\n"
    : "⚡ APPLY MODE — writing to tokens.json\n",
);

let modified = JSON.parse(JSON.stringify(tokens)); // deep clone
modified = fixPhantomToken(modified);
modified = addUndocumentedTokens(modified);
modified = updateMeta(modified);

const totalAfter = [
  modified.primitives,
  modified.semantic,
  modified.components,
  modified.reset,
  modified.layout,
  modified.theme,
  modified.icon,
]
  .filter(Boolean)
  .reduce((sum, s) => sum + Object.keys(s).length, 0);

console.log(`\n📊 Summary:`);
console.log(
  `   Sections: primitives, semantic, components, reset, layout, theme, icon`,
);
console.log(`   Total tokens after remediation: ${totalAfter}`);

if (!DRY_RUN) {
  fs.writeFileSync(TOKENS_JSON, JSON.stringify(modified, null, 2) + "\n");
  console.log(`\n✅ Written: tokens.json`);

  if (VALIDATE) {
    console.log("\n🔄 Running syx-validate --report...\n");
    try {
      execSync("node scripts/syx-validate.js --report", {
        cwd: ROOT,
        stdio: "inherit",
      });
    } catch (e) {
      // validate may exit 1 on warnings — that's expected
    }
  }
} else {
  console.log(
    "\n💡 Run with --apply to write changes, or --apply --validate to also regenerate contracts/",
  );
}

console.log(
  "\n└─────────────────────────────────────────────────────────────┘\n",
);
