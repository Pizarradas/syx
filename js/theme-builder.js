/**
 * SYX Theme Builder
 * Real-time Theme Configurator for SYX Design System
 */

document.addEventListener('DOMContentLoaded', () => {

  const root = document.documentElement;

  // --- UI Elements ---
  const primaryH = document.getElementById('primary-h');
  const primaryC = document.getElementById('primary-c');
  const primaryL = document.getElementById('primary-l'); // 500 level

  const secondaryH = document.getElementById('secondary-h');
  const secondaryC = document.getElementById('secondary-c');
  const secondaryL = document.getElementById('secondary-l');

  const accentH = document.getElementById('accent-h');
  const accentC = document.getElementById('accent-c');
  const accentL = document.getElementById('accent-l');

  const neutralH = document.getElementById('neutral-h');
  const neutralC = document.getElementById('neutral-c');

  const successH = document.getElementById('success-h');
  const warningH = document.getElementById('warning-h');
  const errorH = document.getElementById('error-h');

  // Dynamic Font Injection Heads
  let primaryFontLink = document.getElementById('tb-primary-font-link');
  if (!primaryFontLink) {
    primaryFontLink = document.createElement('link');
    primaryFontLink.id = 'tb-primary-font-link';
    primaryFontLink.rel = 'stylesheet';
    document.head.appendChild(primaryFontLink);
  }

  let headingFontLink = document.getElementById('tb-heading-font-link');
  if (!headingFontLink) {
    headingFontLink = document.createElement('link');
    headingFontLink.id = 'tb-heading-font-link';
    headingFontLink.rel = 'stylesheet';
    document.head.appendChild(headingFontLink);
  }

  const radiusBase = document.getElementById('radius-base');
  const spacingBase = document.getElementById('spacing-base');
  const borderWidth = document.getElementById('border-width');
  const containerMaxWidth = document.getElementById('container-max-width');
  const focusRingWidth = document.getElementById('focus-ring-width');

  const fontFamily = document.getElementById('font-family');
  const fontFamilyHeading = document.getElementById('font-family-heading');
  const fontSizeBase = document.getElementById('font-size-base');
  const lineHeightBase = document.getElementById('line-height-base');
  const fontWeightBase = document.getElementById('font-weight-base');
  const fontWeightHeading = document.getElementById('font-weight-heading');

  const transitionDuration = document.getElementById('transition-duration');
  const transitionEasing = document.getElementById('transition-easing');

  // Value displays
  const els = {
    ph: document.getElementById('val-primary-h'),
    pc: document.getElementById('val-primary-c'),
    pl: document.getElementById('val-primary-l'),
    sh: document.getElementById('val-secondary-h'),
    sc: document.getElementById('val-secondary-c'),
    sl: document.getElementById('val-secondary-l'),
    ah: document.getElementById('val-accent-h'),
    ac: document.getElementById('val-accent-c'),
    al: document.getElementById('val-accent-l'),
    nh: document.getElementById('val-neutral-h'),
    nc: document.getElementById('val-neutral-c'),
    successH: document.getElementById('val-success-h'),
    warningH: document.getElementById('val-warning-h'),
    errorH: document.getElementById('val-error-h'),
    rad: document.getElementById('val-radius-base'),
    spc: document.getElementById('val-spacing-base'),
    bw: document.getElementById('val-border-width'),
    cmw: document.getElementById('val-container-max-width'),
    frw: document.getElementById('val-focus-ring-width'),
    fs: document.getElementById('val-font-size-base'),
    lh: document.getElementById('val-line-height-base'),
    fwb: document.getElementById('val-font-weight-base'),
    fwh: document.getElementById('val-font-weight-heading'),
    td: document.getElementById('val-transition-duration')
  };

  // Color Scale Containers
  const primaryContainer = document.getElementById('primary-scale-container');
  const secondaryContainer = document.getElementById('secondary-scale-container');
  const accentContainer = document.getElementById('accent-scale-container');
  const neutralContainer = document.getElementById('neutral-scale-container');

  // Advanced Mode Toggle
  const advancedModeToggle = document.getElementById('advanced-mode-toggle');
  advancedModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('is-advanced');
    } else {
      document.body.classList.remove('is-advanced');
    }
  });

  // Advanced Scalability Modules
  const modFluidToggle = document.getElementById('module-fluid-toggle');
  const modPaletteToggle = document.getElementById('module-palette-toggle');
  const modFormsToggle = document.getElementById('module-forms-toggle');
  const modTablesToggle = document.getElementById('module-tables-toggle');
  const modDisableLegacyToggle = document.getElementById('module-disable-legacy-toggle');

  // Dark Mode Toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Initialize toggle based on OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkModeToggle.checked = true;
    root.setAttribute('data-theme', 'dark');
  }

  darkModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    applyTheme(); // Refresh inline semantic variables for the preview
  });

  /**
   * Generates OKLCH color scale. 
   * A simplified version keeping H constant, while mathematical L varies,
   * and Chroma applies a bell curve to avoid sRGB clipping at the edges.
   */
  function generateScale(hue, chroma, baseLightness, isNeutral = false) {
    const scale = {};
    const stepLight = 0.08;
    const stepDark = 0.08;

    // Helper to round floats perfectly to 3 decimal places max
    const r = (val) => parseFloat(val.toFixed(3));

    // Helper to scale chroma: 100% at base (500), dropping off at light/dark extremes
    const cScale = (multiplier) => isNeutral ? r(chroma * multiplier / 2) : r(chroma * multiplier);

    // 500 is our base.
    scale['500'] = `${r(baseLightness)} ${cScale(1.0)} ${r(hue)}`;

    // Lighter tints (Chroma drops as lightness approaches 1)
    scale['400'] = `${r(Math.min(0.99, baseLightness + (stepLight * 1)))} ${cScale(0.9)} ${r(hue)}`;
    scale['300'] = `${r(Math.min(0.99, baseLightness + (stepLight * 2)))} ${cScale(0.7)} ${r(hue)}`;
    scale['200'] = `${r(Math.min(0.99, baseLightness + (stepLight * 3)))} ${cScale(0.5)} ${r(hue)}`;
    scale['100'] = `${r(Math.min(0.99, baseLightness + (stepLight * 4)))} ${cScale(0.3)} ${r(hue)}`;
    scale['50'] = `${r(Math.min(0.99, baseLightness + (stepLight * 5)))} ${cScale(0.15)} ${r(hue)}`;

    // Darker shades (Chroma drops as lightness approaches 0)
    scale['600'] = `${r(Math.max(0.1, baseLightness - (stepDark * 1)))} ${cScale(0.9)} ${r(hue)}`;
    scale['700'] = `${r(Math.max(0.1, baseLightness - (stepDark * 2)))} ${cScale(0.7)} ${r(hue)}`;
    scale['800'] = `${r(Math.max(0.1, baseLightness - (stepDark * 3)))} ${cScale(0.5)} ${r(hue)}`;
    scale['900'] = `${r(Math.max(0.1, baseLightness - (stepDark * 4)))} ${cScale(0.3)} ${r(hue)}`;
    scale['950'] = `${r(Math.max(0.05, baseLightness - (stepDark * 4.5)))} ${cScale(0.15)} ${r(hue)}`;

    return scale;
  }

  function applyTheme() {
    // 1. Get values
    const ph = parseFloat(primaryH.value);
    const pc = parseFloat(primaryC.value);
    const pl = parseFloat(primaryL.value);

    const sh = parseFloat(secondaryH.value);
    const sc = parseFloat(secondaryC.value);
    const sl = parseFloat(secondaryL.value);

    const ah = parseFloat(accentH.value);
    const ac = parseFloat(accentC.value);
    const al = parseFloat(accentL.value);

    const nh = parseFloat(neutralH.value);
    const nc = parseFloat(neutralC.value);

    const sucH = parseFloat(successH.value);
    const warH = parseFloat(warningH.value);
    const errH = parseFloat(errorH.value);

    // 2. Generate scales
    const primaryScale = generateScale(ph, pc, pl);
    const secondaryScale = generateScale(sh, sc, sl);
    const accentScale = generateScale(ah, ac, al);
    const neutralScale = generateScale(nh, nc, 0.55, true);

    // State Colors (Adjusted Hues based on feedback)
    const successColor = `oklch(0.60 0.163 ${sucH})`;
    const warningColor = `oklch(0.60 0.167 ${warH})`;
    const errorColor = `oklch(0.60 0.193 ${errH})`;

    // 3. Apply to :root using STRICT SYX TOKENS from THEMING-RULES.md

    // -- PRIMITIVE TOKENS --
    // Primary
    Object.keys(primaryScale).forEach(step => {
      root.style.setProperty(`--primitive-color-brand-${step}`, `oklch(${primaryScale[step]})`);
    });
    // Secondary
    Object.keys(secondaryScale).forEach(step => {
      root.style.setProperty(`--primitive-color-secondary-${step}`, `oklch(${secondaryScale[step]})`);
    });
    // Accent
    Object.keys(accentScale).forEach(step => {
      root.style.setProperty(`--primitive-color-accent-${step}`, `oklch(${accentScale[step]})`);
    });
    // Neutral
    Object.keys(neutralScale).forEach(step => {
      root.style.setProperty(`--primitive-color-gray-${step}`, `oklch(${neutralScale[step]})`);
    });

    root.style.setProperty('--primitive-color-white', 'oklch(1 0 0)');
    root.style.setProperty('--primitive-color-black', 'oklch(0 0 0)');

    // States
    const r = (val) => parseFloat(Number(val).toFixed(3));
    root.style.setProperty('--primitive-color-success-500', `oklch(0.6 ${r(0.163)} ${sucH})`);
    root.style.setProperty('--primitive-color-warning-500', `oklch(0.6 ${r(0.167)} ${warH})`);
    root.style.setProperty('--primitive-color-error-500', `oklch(0.6 ${r(0.193)} ${errH})`);

    // -- SEMANTIC TOKENS (Aliases) --
    root.style.setProperty('--semantic-color-primary', 'var(--primitive-color-brand-500)');
    root.style.setProperty('--semantic-color-secondary', 'var(--primitive-color-secondary-500)');
    root.style.setProperty('--semantic-color-accent', 'var(--primitive-color-accent-500)');

    root.style.setProperty('--semantic-color-state-success', 'var(--primitive-color-success-500)');
    root.style.setProperty('--semantic-color-state-warning', 'var(--primitive-color-warning-500)');
    root.style.setProperty('--semantic-color-state-error', 'var(--primitive-color-error-500)');

    // "On Colors" are mapped after dark mode detection

    const isDark = document.getElementById('dark-mode-toggle').checked;

    if (isDark) {
      root.style.setProperty('--semantic-color-primary', 'var(--primitive-color-brand-400)');
      root.style.setProperty('--semantic-color-secondary', 'var(--primitive-color-secondary-800)');
      root.style.setProperty('--semantic-focus-ring-color', 'var(--primitive-color-brand-400)');
    }

    // Surface, Backgrounds & Layout
    root.style.setProperty('--semantic-surface-1', isDark ? 'var(--primitive-color-gray-900)' : 'var(--primitive-color-white)');
    root.style.setProperty('--semantic-surface-2', isDark ? 'var(--primitive-color-gray-800)' : 'var(--primitive-color-gray-50)');

    root.style.setProperty('--semantic-background-page', 'var(--semantic-surface-2)');
    root.style.setProperty('--semantic-background-elevated', 'var(--semantic-surface-1)');
    root.style.setProperty('--semantic-overlay-alpha', '0.5');
    root.style.setProperty('--semantic-background-overlay', 'oklch(0 0 0 / var(--semantic-overlay-alpha))');
    root.style.setProperty('--semantic-background-inverse', isDark ? 'var(--primitive-color-white)' : 'var(--primitive-color-gray-900)');

    // Pro semantics: Interactive Neutrals
    root.style.setProperty('--semantic-interactive-bg-hover', isDark ? 'var(--primitive-color-gray-800)' : 'var(--primitive-color-gray-100)');
    root.style.setProperty('--semantic-interactive-bg-active', isDark ? 'var(--primitive-color-gray-700)' : 'var(--primitive-color-gray-200)');

    // Text Hierarchy & On-Colors
    root.style.setProperty('--semantic-text-primary', isDark ? 'var(--primitive-color-white)' : 'var(--primitive-color-gray-900)');
    root.style.setProperty('--semantic-text-secondary', isDark ? 'var(--primitive-color-gray-400)' : 'var(--primitive-color-gray-600)');
    root.style.setProperty('--semantic-text-tertiary', isDark ? 'var(--primitive-color-gray-500)' : 'var(--primitive-color-gray-400)');
    root.style.setProperty('--semantic-text-disabled', isDark ? 'var(--primitive-color-gray-700)' : 'var(--primitive-color-gray-300)');
    root.style.setProperty('--semantic-text-inverse', isDark ? 'var(--primitive-color-gray-900)' : 'var(--primitive-color-white)');

    root.style.setProperty('--semantic-on-primary', 'var(--primitive-color-white)');
    root.style.setProperty('--semantic-on-secondary', isDark ? 'var(--primitive-color-white)' : 'var(--primitive-color-gray-950)');
    root.style.setProperty('--semantic-on-accent', 'var(--primitive-color-white)');
    root.style.setProperty('--semantic-on-success', 'var(--primitive-color-white)');
    root.style.setProperty('--semantic-on-warning', 'var(--primitive-color-gray-950)');
    root.style.setProperty('--semantic-on-error', 'var(--primitive-color-white)');

    root.style.setProperty('--semantic-on-surface', 'var(--semantic-text-primary)');
    root.style.setProperty('--semantic-on-surface-inverse', 'var(--semantic-text-inverse)');
    root.style.setProperty('--semantic-on-overlay', 'var(--primitive-color-white)');
    root.style.setProperty('--semantic-muted', 'var(--semantic-text-secondary)');

    // Disabled States
    root.style.setProperty('--semantic-color-disabled-bg', isDark ? 'var(--primitive-color-gray-800)' : 'var(--primitive-color-gray-100)');
    root.style.setProperty('--semantic-color-disabled-border', isDark ? 'var(--primitive-color-gray-700)' : 'var(--primitive-color-gray-200)');
    root.style.setProperty('--semantic-color-disabled-text', isDark ? 'var(--primitive-color-gray-600)' : 'var(--primitive-color-gray-400)');

    // Semantic Borders
    root.style.setProperty('--semantic-border-muted', isDark ? 'var(--primitive-color-gray-800)' : 'var(--primitive-color-gray-100)');
    root.style.setProperty('--semantic-border-default', isDark ? 'var(--primitive-color-gray-700)' : 'var(--primitive-color-gray-200)');
    root.style.setProperty('--semantic-border-strong', isDark ? 'var(--primitive-color-gray-600)' : 'var(--primitive-color-gray-400)');
    root.style.setProperty('--semantic-border-focus', 'var(--semantic-color-primary)');
    root.style.setProperty('--semantic-border-error', 'var(--semantic-color-state-error)');

    // Elevation (Shadows & Z-index)
    // Adding rgb fallback for older browsers in export, inline DOM gets oklch or rgba
    if (CSS.supports('color: oklch(0 0 0)')) {
      root.style.setProperty('--semantic-shadow-sm', '0 1px 2px 0 oklch(0 0 0 / 0.05)');
      root.style.setProperty('--semantic-shadow-md', '0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)');
      root.style.setProperty('--semantic-shadow-lg', '0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)');
    } else {
      root.style.setProperty('--semantic-shadow-sm', '0 1px 2px 0 rgba(0,0,0,0.05)');
      root.style.setProperty('--semantic-shadow-md', '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)');
      root.style.setProperty('--semantic-shadow-lg', '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)');
    }
    root.style.setProperty('--semantic-z-dropdown', '1000');
    root.style.setProperty('--semantic-z-sticky', '1020');
    root.style.setProperty('--semantic-z-modal', '1040');
    root.style.setProperty('--semantic-z-tooltip', '1060');

    // Interaction & Selection
    root.style.setProperty('--semantic-color-selection-bg', 'var(--primitive-color-brand-200)');
    root.style.setProperty('--semantic-color-selection-fg', 'var(--semantic-text-primary)');
    if (!isDark) root.style.setProperty('--semantic-focus-ring-color', 'var(--primitive-color-brand-500)');
    else root.style.setProperty('--semantic-focus-ring-color', 'var(--primitive-color-brand-400)');
    root.style.setProperty('--semantic-focus-ring-width', 'var(--theme-focus-ring-width)');
    root.style.setProperty('--semantic-focus-ring-offset', '2px');
    root.style.setProperty('--semantic-outline-width', 'var(--semantic-focus-ring-width)');

    // State Tones (Success, Warning, Error)
    root.style.setProperty('--semantic-tone-success-bg', isDark ? 'oklch(0.25 0.05 150)' : 'oklch(0.95 0.05 150)');
    root.style.setProperty('--semantic-tone-success-border', isDark ? 'oklch(0.45 0.1 150)' : 'oklch(0.85 0.1 150)');
    root.style.setProperty('--semantic-tone-success-text', isDark ? 'oklch(0.85 0.15 150)' : 'oklch(0.45 0.15 150)');

    root.style.setProperty('--semantic-tone-warning-bg', isDark ? 'oklch(0.25 0.05 90)' : 'oklch(0.95 0.05 90)');
    root.style.setProperty('--semantic-tone-warning-border', isDark ? 'oklch(0.45 0.1 90)' : 'oklch(0.85 0.1 90)');
    root.style.setProperty('--semantic-tone-warning-text', isDark ? 'oklch(0.85 0.15 90)' : 'oklch(0.45 0.15 90)');

    root.style.setProperty('--semantic-tone-error-bg', isDark ? 'oklch(0.25 0.05 30)' : 'oklch(0.95 0.05 30)');
    root.style.setProperty('--semantic-tone-error-border', isDark ? 'oklch(0.45 0.1 30)' : 'oklch(0.85 0.1 30)');
    root.style.setProperty('--semantic-tone-error-text', isDark ? 'oklch(0.85 0.15 30)' : 'oklch(0.45 0.15 30)');

    // Semantic Links
    root.style.setProperty('--semantic-link-default', 'var(--semantic-color-primary)');
    root.style.setProperty('--semantic-link-hover', isDark ? 'var(--primitive-color-brand-400)' : 'var(--primitive-color-brand-600)');
    root.style.setProperty('--semantic-link-visited', isDark ? 'var(--primitive-color-brand-300)' : 'var(--primitive-color-brand-700)');
    root.style.setProperty('--semantic-link-active', isDark ? 'var(--primitive-color-brand-200)' : 'var(--primitive-color-brand-800)');

    // Semantic Radius
    root.style.setProperty('--semantic-radius-sm', 'calc(var(--theme-radius) / 2)');
    root.style.setProperty('--semantic-radius-md', 'var(--theme-radius)');
    root.style.setProperty('--semantic-radius-lg', 'calc(var(--theme-radius) * 1.5)');
    root.style.setProperty('--semantic-radius-pill', '9999px');

    // -- COMPONENT TOKENS --
    // Input Component
    root.style.setProperty('--input-bg', 'var(--semantic-surface-1)');
    root.style.setProperty('--input-bg-hover', 'var(--semantic-interactive-bg-hover)');
    root.style.setProperty('--input-border', 'var(--semantic-border-default)');
    root.style.setProperty('--input-border-focus', 'var(--semantic-border-focus)');
    root.style.setProperty('--input-border-error', 'var(--semantic-border-error)');
    root.style.setProperty('--input-text', 'var(--semantic-text-primary)');
    root.style.setProperty('--input-placeholder', 'var(--semantic-text-tertiary)');
    root.style.setProperty('--input-disabled-bg', 'var(--semantic-color-disabled-bg)');
    root.style.setProperty('--input-disabled-text', 'var(--semantic-color-disabled-text)');

    // Link Component
    root.style.setProperty('--link-color', 'var(--semantic-link-default)');
    root.style.setProperty('--link-hover', 'var(--semantic-link-hover)');
    root.style.setProperty('--link-visited', 'var(--semantic-link-visited)');
    root.style.setProperty('--link-active', 'var(--semantic-link-active)');

    // Button Primary
    root.style.setProperty('--btn-primary-bg', 'var(--semantic-color-primary)');
    root.style.setProperty('--btn-primary-text', 'var(--semantic-on-primary)');
    root.style.setProperty('--btn-primary-bg-hover', 'var(--primitive-color-brand-600)');
    root.style.setProperty('--btn-primary-bg-active', 'var(--primitive-color-brand-700)');
    root.style.setProperty('--btn-primary-border', 'var(--semantic-color-primary)');
    root.style.setProperty('--btn-primary-focus-ring', 'var(--semantic-focus-ring-color)');

    root.style.setProperty('--btn-radius', 'var(--semantic-radius-md)');
    root.style.setProperty('--btn-padding-x', 'calc(var(--primitive-space-base) * 4)');
    root.style.setProperty('--btn-padding-y', 'calc(var(--primitive-space-base) * 2)');

    root.style.setProperty('--btn-quaternary-bg', 'transparent');
    root.style.setProperty('--btn-quaternary-text', 'var(--semantic-color-primary)');

    // Backward compatibility for old tokens (Legacy Bridge)
    if (!modDisableLegacyToggle || (modDisableLegacyToggle && !modDisableLegacyToggle.checked)) {
      root.style.setProperty('--color-primary-base', 'var(--semantic-color-primary)');
      root.style.setProperty('--color-primary', 'var(--semantic-color-primary)');
      root.style.setProperty('--color-secondary-base', 'var(--semantic-color-secondary)');
      root.style.setProperty('--color-accent-base', 'var(--semantic-color-accent)');
      root.style.setProperty('--color-primary-light', 'var(--primitive-color-brand-50)');
      root.style.setProperty('--color-secondary-lt-1', 'var(--primitive-color-secondary-50)');

      root.style.setProperty('--color-state-hover-primary', 'var(--primitive-color-brand-600)');
      root.style.setProperty('--color-state-hover-quaternary', 'var(--primitive-color-gray-100)');
      root.style.setProperty('--color-state-focus', 'var(--semantic-focus-ring-color)');

      root.style.setProperty('--color-quaternary', 'var(--primitive-color-gray-100)');
      root.style.setProperty('--color-selector-placeholder', 'var(--semantic-text-tertiary)');
      root.style.setProperty('--color-action-link', 'var(--semantic-color-primary)');

      // Backward compatibility for SYX-example.css Legacy Naming
      root.style.setProperty('--semantic-color-bg-primary', 'var(--semantic-background-elevated)');
      root.style.setProperty('--semantic-color-bg-secondary', 'var(--semantic-surface-2)');
      root.style.setProperty('--semantic-color-bg-tertiary', 'var(--semantic-background-page)');
      root.style.setProperty('--semantic-color-bg-inverse', 'var(--semantic-background-inverse)');

      root.style.setProperty('--semantic-color-text-primary', 'var(--semantic-text-primary)');
      root.style.setProperty('--semantic-color-text-secondary', 'var(--semantic-text-secondary)');
      root.style.setProperty('--semantic-color-text-tertiary', 'var(--semantic-text-tertiary)');
      root.style.setProperty('--semantic-color-text-inverse', 'var(--semantic-text-inverse)');
      root.style.setProperty('--semantic-color-text-disabled', 'var(--semantic-text-disabled)');

      root.style.setProperty('--semantic-color-border-default', 'var(--semantic-border-default)');
      root.style.setProperty('--semantic-color-border-subtle', 'var(--semantic-border-muted)');
      root.style.setProperty('--semantic-color-border-strong', 'var(--semantic-border-strong)');
      root.style.setProperty('--semantic-color-border-focus', 'var(--semantic-border-focus)');
      root.style.setProperty('--semantic-color-state-disabled', 'var(--semantic-color-disabled-bg)');
    } else {
      // Cleanup legacy inline tokens if disabled
      [
        '--color-primary-base', '--color-primary', '--color-secondary-base', '--color-accent-base',
        '--color-primary-light', '--color-secondary-lt-1', '--color-state-hover-primary',
        '--color-state-hover-quaternary', '--color-state-focus', '--color-quaternary',
        '--color-selector-placeholder', '--color-action-link', '--semantic-color-bg-primary',
        '--semantic-color-bg-secondary', '--semantic-color-bg-tertiary', '--semantic-color-bg-inverse',
        '--semantic-color-text-primary', '--semantic-color-text-secondary', '--semantic-color-text-tertiary',
        '--semantic-color-text-inverse', '--semantic-color-text-disabled', '--semantic-color-border-default',
        '--semantic-color-border-subtle', '--semantic-color-border-strong', '--semantic-color-border-focus',
        '--semantic-color-state-disabled'
      ].forEach(prop => root.style.removeProperty(prop));
    }

    // -- ARCHITECTURE & THEME TOKENS --
    const rad = radiusBase.value;
    const spc = spacingBase.value;
    const bw = borderWidth.value;
    const cmw = containerMaxWidth.value;
    const frw = focusRingWidth.value;

    root.style.setProperty('--primitive-space-base', `${spc}rem`);
    root.style.setProperty('--theme-radius', `${rad}rem`);
    root.style.setProperty('--primitive-border-width', `${bw}px`);
    root.style.setProperty('--semantic-border-width', 'var(--primitive-border-width)');
    root.style.setProperty('--theme-border-width', 'var(--primitive-border-width)');
    root.style.setProperty('--theme-container-max-width', `${cmw}px`);

    // Convert old 1px to minimum 2px for accessibility
    const safeFocusWidth = Math.max(parseFloat(frw), 2);
    root.style.setProperty('--theme-focus-ring-width', `${safeFocusWidth}px`);

    // -- FONTS --
    const fsBase = fontSizeBase.value;
    const lhBase = lineHeightBase.value;
    const fwBase = fontWeightBase.value;
    const fwHeading = fontWeightHeading.value;

    root.style.setProperty('--primitive-font-size-base', `${fsBase}px`);
    root.style.setProperty('--theme-font-size-base', 'var(--primitive-font-size-base)');
    root.style.setProperty('--theme-font-weight-base', fwBase);
    root.style.setProperty('--theme-font-weight-heading', fwHeading);

    const primaryOpt = fontFamily.options[fontFamily.selectedIndex];
    const headingOpt = fontFamilyHeading.options[fontFamilyHeading.selectedIndex];

    root.style.setProperty('--primitive-font-family-inter', primaryOpt.value);
    root.style.setProperty('--theme-font-family-base', 'var(--primitive-font-family-inter)');
    root.style.setProperty('--theme-font-family-heading', headingOpt.value);

    // Inject Google Fonts if dataset URL exists
    if (primaryOpt.dataset.fontUrl) {
      primaryFontLink.href = primaryOpt.dataset.fontUrl;
    } else {
      primaryFontLink.removeAttribute('href');
    }

    if (headingOpt.dataset.fontUrl) {
      headingFontLink.href = headingOpt.dataset.fontUrl;
    } else {
      headingFontLink.removeAttribute('href');
    }

    // Mapping base line height to normal value since it governs standard text sizes:
    root.style.setProperty('--primitive-line-height-normal', `${lhBase}`);
    root.style.setProperty('--reset-html-font', `normal normal var(--theme-font-weight-base) var(--theme-font-size-base)/var(--primitive-line-height-normal) var(--theme-font-family-base)`);

    // -- ANIMATION --
    const tDur = transitionDuration.value;
    const tEase = transitionEasing.value;
    root.style.setProperty('--theme-transition-duration', `${tDur}s`);
    root.style.setProperty('--theme-transition-easing', tEase);
    root.style.setProperty('--motion-duration-fast', '0.15s');
    root.style.setProperty('--motion-duration-base', 'var(--theme-transition-duration)');
    root.style.setProperty('--motion-duration-slow', '0.3s');
    root.style.setProperty('--motion-ease-standard', 'var(--theme-transition-easing)');
    root.style.setProperty('--motion-ease-emphasized', 'cubic-bezier(0.2, 0, 0, 1)');

    // Update labels
    els.ph.innerText = ph; els.pc.innerText = pc; els.pl.innerText = pl;
    els.sh.innerText = sh; els.sc.innerText = sc; els.sl.innerText = sl;
    els.ah.innerText = ah; els.ac.innerText = ac; els.al.innerText = al;
    els.nh.innerText = Math.round(nh); els.nc.innerText = nc.toFixed(2);
    els.successH.innerText = sucH; els.warningH.innerText = warH; els.errorH.innerText = errH;
    els.rad.innerText = `${rad}rem`; els.spc.innerText = `${spc}rem`;
    els.bw.innerText = `${bw}px`;
    els.cmw.innerText = `${cmw}px`;
    els.frw.innerText = `${frw}px`;
    els.fs.innerText = `${fsBase}px`;
    els.lh.innerText = lhBase;
    els.fwb.innerText = fwBase;
    els.fwh.innerText = fwHeading;
    els.td.innerText = `${tDur}s`;

    // 5. Inject Modular Architectures into DOM for Live Preview
    let modulesStyleTag = document.getElementById('tb-modules-style');
    if (!modulesStyleTag) {
      modulesStyleTag = document.createElement('style');
      modulesStyleTag.id = 'tb-modules-style';
      document.head.appendChild(modulesStyleTag);
    }

    let liveModulesCSS = `:root {\n`;
    if (modFluidToggle.checked) liveModulesCSS += getFluidCSS() + `\n`;
    if (modPaletteToggle.checked) liveModulesCSS += getExtendedPaletteCSS() + `\n`;
    if (modFormsToggle.checked) liveModulesCSS += getFormsCSS() + `\n`;
    if (modTablesToggle.checked) liveModulesCSS += getTablesLayoutCSS() + `\n`;
    liveModulesCSS += `}`;

    modulesStyleTag.innerHTML = liveModulesCSS;

    // 4. Render Color Anatomy Boxes
    renderScaleBoxes(primaryContainer, primaryScale);
    renderScaleBoxes(secondaryContainer, secondaryScale);
    renderScaleBoxes(accentContainer, accentScale);
    renderScaleBoxes(neutralContainer, neutralScale);
  }

  function renderScaleBoxes(container, scaleObj) {
    if (!container) return;
    container.innerHTML = ''; // clear

    // Infer color type from container ID (e.g., 'primary-scale-container' -> 'primary')
    let type = container.id.split('-')[0];
    if (type === 'primary') type = 'brand'; // match primitive naming

    // SYX standard 10-step scale sequence
    const sequence = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

    sequence.forEach((step, index) => {
      if (!scaleObj[step]) return;

      const boxWrapper = document.createElement('div');
      boxWrapper.style.flex = "1";
      boxWrapper.style.display = "flex";
      boxWrapper.style.flexDirection = "column";
      boxWrapper.style.alignItems = "center";
      boxWrapper.style.gap = "0.5rem";
      boxWrapper.style.minWidth = "0"; // prevent flex from blowing out

      const box = document.createElement('div');

      // Style box
      box.style.width = "100%";
      box.style.background = `oklch(${scaleObj[step]})`;
      box.style.borderRadius = "var(--theme-radius, 0.5rem)";

      // Make the 500 (Base) slightly taller for emphasis
      if (step === '500') {
        box.className = 'color-box box-500';
        box.style.height = "60px";
        box.title = `${step} (Base): oklch(${scaleObj[step]})`;
        box.style.marginBottom = "0"; // no extra margin needed for the tall box
      } else {
        box.className = 'color-box-sm';
        box.style.height = "40px";
        box.title = `${step}: oklch(${scaleObj[step]})`;
        box.style.marginTop = "10px"; // push exactly +10px down to center against 60px box (60-40=20 / 2)
        box.style.marginBottom = "10px"; // balance the visual space below
      }

      // Create Technical Badge
      const badge = document.createElement('span');
      badge.className = 'tb-token-badge';
      // Force the styling for the badge to allow wrapping
      badge.style.fontSize = '0.55rem';
      badge.style.padding = '0.2rem 0.2rem';
      badge.style.whiteSpace = 'normal';   // Allow text to wrap
      badge.style.textAlign = 'center';
      badge.style.lineHeight = '1.3';
      badge.style.width = '100%';          // Take full width of wrapper
      badge.style.boxSizing = 'border-box';

      // Use a <br> to explicitly break the very long text so it stacks nicely
      badge.innerHTML = `--primitive-<br>color-${type}-<br><b style="color:var(--semantic-color-text-primary)">${step}</b>`;

      boxWrapper.appendChild(box);
      boxWrapper.appendChild(badge);
      container.appendChild(boxWrapper);
    });
  }

  // --- Scalability CSS Generators ---
  function getFluidCSS() {
    return `;

  /* ================== */
  /* FLUID ARCHITECTURE */
  /* ================== */
  --primitive-fluid-space-xs: clamp(0.25rem, 0.16rem + 0.38vw, 0.5rem);
  --primitive-fluid-space-sm: clamp(0.5rem, 0.32rem + 0.75vw, 1rem);
  --primitive-fluid-space-md: clamp(1rem, 0.82rem + 0.75vw, 1.5rem);
  --primitive-fluid-space-lg: clamp(1.5rem, 1.32rem + 0.75vw, 2rem);
  --primitive-fluid-space-xl: clamp(2rem, 1.65rem + 1.5vw, 3rem);
  --primitive-fluid-space-xxl: clamp(3rem, 2.65rem + 1.5vw, 4rem);

  --primitive-fluid-font-body: var(--primitive-font-size-base);
  --primitive-fluid-font-h6: clamp(1.25rem, 1.19rem + 0.24vw, 1.406rem);
  --primitive-fluid-font-h5: clamp(1.563rem, 1.49rem + 0.3vw, 1.758rem);
  --primitive-fluid-font-h4: clamp(1.953rem, 1.86rem + 0.37vw, 2.197rem);
  --primitive-fluid-font-h3: clamp(2.441rem, 2.33rem + 0.47vw, 2.747rem);
  --primitive-fluid-font-h2: clamp(3.052rem, 2.91rem + 0.58vw, 3.433rem);
  --primitive-fluid-font-h1: clamp(3.815rem, 3.63rem + 0.73vw, 4.291rem);`;
  }

  function getExtendedPaletteCSS() {
    // Generate SYX extended palette base scales
    const yellows = generateScale(90, 0.16, 0.6);
    const reds = generateScale(15, 0.22, 0.6);
    const greens = generateScale(150, 0.15, 0.6);
    const blues = generateScale(260, 0.25, 0.6);
    const purples = generateScale(300, 0.20, 0.6);

    let str = `\n  /* ================== */\n  /* EXTENDED PALETTE   */\n  /* ================== */\n`;
    const append = (name, scale) => {
      ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].forEach(step => {
        str += `  --primitive-color-${name}-${step}: oklch(${scale[step]});\n`;
      });
      str += `\n`;
    };
    append('purple', purples);
    append('blue', blues);
    append('green', greens);
    append('yellow', yellows);
    append('red', reds);
    return str;
  }

  function getFormsCSS() {
    return `  /* ================== */
  /* FORM COMPONENTS    */
  /* ================== */
  --component-form-field-color: var(--semantic-on-surface);
  --component-form-field-bg: var(--semantic-color-bg-primary);
  --component-form-field-border: var(--semantic-border-default);
  --component-form-field-border-focus: var(--semantic-color-focus-ring);
  --component-form-field-placeholder: var(--primitive-color-gray-400);
  --component-form-field-border-radius: var(--theme-radius);
  --component-check-color-checked: var(--semantic-color-primary);
  --component-check-bg-checked: var(--semantic-color-primary);
  --component-radio-color-checked: var(--semantic-color-primary);
  --component-switch-bg-on: var(--semantic-color-state-success);
  --component-switch-bg-off: var(--semantic-border-default);\n`;
  }

  function getTablesLayoutCSS() {
    return `  /* ==================== */
  /* TABLES & NAVIGATION  */
  /* ==================== */
  --component-table-bg-th: var(--semantic-color-primary);
  --component-table-color-th: var(--semantic-on-primary);
  --component-table-border-color: var(--semantic-color-border-subtle);
  --component-table-state-hover-bg: var(--primitive-color-brand-50);
  
  --component-breadcrumb-color: var(--semantic-color-primary);
  --component-breadcrumb-color-hover: var(--semantic-color-secondary);
  --component-breadcrumb-bg-active: var(--semantic-color-primary);
  
  --component-pagination-color: var(--semantic-color-primary);
  --component-pagination-color-active: var(--semantic-on-primary);
  --component-pagination-bg-active: var(--semantic-color-primary);
  --component-pagination-border-color-hover: var(--semantic-color-primary);\n`;
  }

  // --- Export Functionality ---
  const exportBtn = document.getElementById('btn-export');

  exportBtn.addEventListener('click', () => {
    // Re-run generation logic specifically for cleaner export formatting

    // Gather current values
    const primaryScale = generateScale(parseFloat(primaryH.value), parseFloat(primaryC.value), parseFloat(primaryL.value));
    const secondaryScale = generateScale(parseFloat(secondaryH.value), parseFloat(secondaryC.value), parseFloat(secondaryL.value));
    const accentScale = generateScale(parseFloat(accentH.value), parseFloat(accentC.value), parseFloat(accentL.value));
    const neutralScale = generateScale(parseFloat(neutralH.value), parseFloat(neutralC.value), 0.55, true);

    const sucH = parseFloat(successH.value);
    const warH = parseFloat(warningH.value);
    const errH = parseFloat(errorH.value);

    const fsBase = fontSizeBase.value;
    const fwBase = fontWeightBase.value;
    const lhBase = lineHeightBase.value;

    let exportCSS = `:root {\n`;
    exportCSS += `  /* ================== */\n`;
    exportCSS += `  /* PRIMITIVE TOKENS   */\n`;
    exportCSS += `  /* ================== */\n`;

    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].forEach(step => {
      exportCSS += `  --primitive-color-brand-${step}: oklch(${primaryScale[step]});\n`;
    });
    exportCSS += `\n`;
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].forEach(step => {
      exportCSS += `  --primitive-color-secondary-${step}: oklch(${secondaryScale[step]});\n`;
    });
    exportCSS += `\n`;
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].forEach(step => {
      exportCSS += `  --primitive-color-accent-${step}: oklch(${accentScale[step]});\n`;
    });
    exportCSS += `\n`;
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].forEach(step => {
      exportCSS += `  --primitive-color-gray-${step}: oklch(${neutralScale[step]});\n`;
    });

    exportCSS += `\n  --primitive-color-white: oklch(1 0 0);\n`;
    exportCSS += `  --primitive-color-black: oklch(0 0 0);\n`;

    const r = (val) => parseFloat(val.toFixed(3));

    exportCSS += `\n  /* States */\n`;
    exportCSS += `  --primitive-color-success-500: oklch(0.6 ${r(0.163)} ${sucH});\n`;
    exportCSS += `  --primitive-color-warning-500: oklch(0.6 ${r(0.167)} ${warH});\n`;
    exportCSS += `  --primitive-color-error-500: oklch(0.6 ${r(0.193)} ${errH});\n`;

    exportCSS += `\n  /* ================== */\n`;
    exportCSS += `  /* THEME / ARCHITECTURE*/\n`;
    exportCSS += `  /* ================== */\n`;
    exportCSS += `  --primitive-space-base: ${spacingBase.value}rem;\n`;
    exportCSS += `  --theme-radius: ${radiusBase.value}rem;\n`;
    exportCSS += `  --primitive-border-width: ${borderWidth.value}px;\n`;
    exportCSS += `  --theme-container-max-width: ${containerMaxWidth.value}px;\n`;
    exportCSS += `  --theme-focus-ring-width: ${Math.max(parseFloat(focusRingWidth.value), 2)}px;\n`;

    exportCSS += `\n  --theme-font-size-base: ${fsBase}px;\n`;
    exportCSS += `  --theme-font-weight-base: ${fwBase};\n`;
    exportCSS += `  --theme-font-weight-heading: ${fontWeightHeading.value};\n`;
    exportCSS += `  --theme-font-family-base: ${fontFamily.options[fontFamily.selectedIndex].value};\n`;
    exportCSS += `  --theme-font-family-heading: ${fontFamilyHeading.options[fontFamilyHeading.selectedIndex].value};\n`;
    exportCSS += `  --primitive-line-height-normal: ${lhBase};\n`;

    exportCSS += `\n  /* Semantic Radius */\n`;
    exportCSS += `  --semantic-radius-sm: calc(var(--theme-radius) / 2);\n`;
    exportCSS += `  --semantic-radius-md: var(--theme-radius);\n`;
    exportCSS += `  --semantic-radius-lg: calc(var(--theme-radius) * 1.5);\n`;
    exportCSS += `  --semantic-radius-pill: 9999px;\n`;

    exportCSS += `\n  /* ================== */\n`;
    exportCSS += `  /* TYPOGRAPHY SEMANTIC*/\n`;
    exportCSS += `  /* ================== */\n`;
    exportCSS += `  --semantic-font-family-primary: var(--theme-font-family-base);\n`;
    exportCSS += `  --semantic-font-family-heading: var(--theme-font-family-heading);\n`;
    exportCSS += `  --semantic-font-family-primary-bold: var(--theme-font-family-base);\n`;

    exportCSS += `\n  /* ================== */\n`;
    exportCSS += `  /* GRID BREAKPOINTS   */\n`;
    exportCSS += `  /* ================== */\n`;
    exportCSS += `  --theme-breakpoint-sm: 480px;\n`;
    exportCSS += `  --theme-breakpoint-md: 768px;\n`;
    exportCSS += `  --theme-breakpoint-lg: 1024px;\n`;

    exportCSS += `\n  /* Motion Semantics */\n`;
    exportCSS += `  --theme-transition-duration: ${transitionDuration.value}s;\n`;
    exportCSS += `  --theme-transition-easing: ${transitionEasing.value};\n`;
    exportCSS += `  --motion-duration-fast: 0.15s;\n`;
    exportCSS += `  --motion-duration-base: var(--theme-transition-duration);\n`;
    exportCSS += `  --motion-duration-slow: 0.3s;\n`;
    exportCSS += `  --motion-ease-standard: var(--theme-transition-easing);\n`;
    exportCSS += `  --motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);\n`;

    exportCSS += `\n  --reset-html-font: normal normal var(--theme-font-weight-base) var(--theme-font-size-base)/var(--primitive-line-height-normal) var(--theme-font-family-base);\n`;

    exportCSS += `\n  /* ================== */\n`;
    exportCSS += `  /* SEMANTIC TOKENS    */\n`;
    exportCSS += `  /* ================== */\n`;
    exportCSS += `  --semantic-color-primary: var(--primitive-color-brand-500);\n`;
    exportCSS += `  --semantic-color-secondary: var(--primitive-color-secondary-500);\n`;
    exportCSS += `  --semantic-color-accent: var(--primitive-color-accent-500);\n`;
    exportCSS += `\n  --semantic-color-state-success: var(--primitive-color-success-500);\n`;
    exportCSS += `  --semantic-color-state-warning: var(--primitive-color-warning-500);\n`;
    exportCSS += `  --semantic-color-state-error: var(--primitive-color-error-500);\n`;
    exportCSS += `\n  --semantic-focus-ring-color: var(--primitive-color-brand-500);\n`;
    exportCSS += `  --semantic-focus-ring-width: var(--theme-focus-ring-width);\n`;
    exportCSS += `  --semantic-focus-ring-offset: 2px;\n`;
    exportCSS += `  --semantic-border-width: var(--primitive-border-width);\n`;
    exportCSS += `  --semantic-outline-width: var(--semantic-focus-ring-width);\n`;
    exportCSS += `  --semantic-color-selection-bg: var(--primitive-color-brand-200);\n`;
    exportCSS += `  --semantic-color-selection-fg: var(--semantic-text-primary);\n`;

    exportCSS += `\n  /* State Tones (Soft Backgrounds & Accents) */\n`;
    exportCSS += `  --semantic-tone-success-bg: oklch(0.95 0.05 ${sucH});\n`;
    exportCSS += `  --semantic-tone-success-border: oklch(0.85 0.1 ${sucH});\n`;
    exportCSS += `  --semantic-tone-success-text: oklch(0.45 0.15 ${sucH});\n`;
    exportCSS += `  --semantic-tone-warning-bg: oklch(0.95 0.05 ${warH});\n`;
    exportCSS += `  --semantic-tone-warning-border: oklch(0.85 0.1 ${warH});\n`;
    exportCSS += `  --semantic-tone-warning-text: oklch(0.45 0.15 ${warH});\n`;
    exportCSS += `  --semantic-tone-error-bg: oklch(0.95 0.05 ${errH});\n`;
    exportCSS += `  --semantic-tone-error-border: oklch(0.85 0.1 ${errH});\n`;
    exportCSS += `  --semantic-tone-error-text: oklch(0.45 0.15 ${errH});\n`;

    exportCSS += `\n  /* Surface, Backgrounds & Layout */\n`;
    exportCSS += `  --semantic-surface-1: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-surface-2: var(--primitive-color-gray-50);\n`;
    exportCSS += `  --semantic-background-page: var(--semantic-surface-2);\n`;
    exportCSS += `  --semantic-background-elevated: var(--semantic-surface-1);\n`;
    exportCSS += `  --semantic-overlay-alpha: 0.5;\n`;
    exportCSS += `  --semantic-background-overlay: oklch(0 0 0 / var(--semantic-overlay-alpha));\n`;
    exportCSS += `  --semantic-background-inverse: var(--primitive-color-gray-900);\n`;

    exportCSS += `\n  /* Interactive Neutrals */\n`;
    exportCSS += `  --semantic-interactive-bg-hover: var(--primitive-color-gray-100);\n`;
    exportCSS += `  --semantic-interactive-bg-active: var(--primitive-color-gray-200);\n`;

    exportCSS += `\n  /* Text Hierarchy & On-Colors */\n`;
    exportCSS += `  --semantic-text-primary: var(--primitive-color-gray-900);\n`;
    exportCSS += `  --semantic-text-secondary: var(--primitive-color-gray-600);\n`;
    exportCSS += `  --semantic-text-tertiary: var(--primitive-color-gray-400);\n`;
    exportCSS += `  --semantic-text-disabled: var(--primitive-color-gray-300);\n`;
    exportCSS += `  --semantic-text-inverse: var(--primitive-color-white);\n`;
    exportCSS += `\n  /* On-Colors (Foreground text mapped to backgrounds) */\n`;
    exportCSS += `  --semantic-on-primary: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-on-secondary: var(--primitive-color-gray-950);\n`;
    exportCSS += `  --semantic-on-accent: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-on-success: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-on-warning: var(--primitive-color-gray-950);\n`;
    exportCSS += `  --semantic-on-error: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-on-surface: var(--semantic-text-primary);\n`;
    exportCSS += `  --semantic-on-surface-inverse: var(--semantic-text-inverse);\n`;
    exportCSS += `  --semantic-on-overlay: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-muted: var(--semantic-text-secondary);\n`;

    exportCSS += `\n  /* Disabled States */\n`;
    exportCSS += `  --semantic-color-disabled-bg: var(--primitive-color-gray-100);\n`;
    exportCSS += `  --semantic-color-disabled-border: var(--primitive-color-gray-200);\n`;
    exportCSS += `  --semantic-color-disabled-text: var(--primitive-color-gray-400);\n`;

    exportCSS += `\n  /* Semantic Borders */\n`;
    exportCSS += `  --semantic-border-muted: var(--primitive-color-gray-100);\n`;
    exportCSS += `  --semantic-border-default: var(--primitive-color-gray-200);\n`;
    exportCSS += `  --semantic-border-strong: var(--primitive-color-gray-400);\n`;
    exportCSS += `  --semantic-border-focus: var(--semantic-color-primary);\n`;
    exportCSS += `  --semantic-border-error: var(--semantic-color-state-error);\n`;

    exportCSS += `\n  /* Semantic Links */\n`;
    exportCSS += `  --semantic-link-default: var(--semantic-color-primary);\n`;
    exportCSS += `  --semantic-link-hover: var(--primitive-color-brand-600);\n`;
    exportCSS += `  --semantic-link-visited: var(--primitive-color-brand-700);\n`;
    exportCSS += `  --semantic-link-active: var(--primitive-color-brand-800);\n`;

    exportCSS += `\n  /* Elevation (Shadows & Z-index) */\n`;
    exportCSS += `  --semantic-shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);\n`;
    exportCSS += `  --semantic-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);\n`;
    exportCSS += `  --semantic-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);\n`;
    exportCSS += `  --semantic-z-dropdown: 1000;\n`;
    exportCSS += `  --semantic-z-sticky: 1020;\n`;
    exportCSS += `  --semantic-z-modal: 1040;\n`;
    exportCSS += `  --semantic-z-tooltip: 1060;\n`;

    exportCSS += `\n  /* ================== */\n`;
    exportCSS += `  /* COMPONENT TOKENS   */\n`;
    exportCSS += `  /* ================== */\n`;

    exportCSS += `  /* Input Namespace */\n`;
    exportCSS += `  --input-bg: var(--semantic-surface-1);\n`;
    exportCSS += `  --input-bg-hover: var(--semantic-interactive-bg-hover);\n`;
    exportCSS += `  --input-border: var(--semantic-border-default);\n`;
    exportCSS += `  --input-border-focus: var(--semantic-border-focus);\n`;
    exportCSS += `  --input-border-error: var(--semantic-border-error);\n`;
    exportCSS += `  --input-text: var(--semantic-text-primary);\n`;
    exportCSS += `  --input-placeholder: var(--semantic-text-tertiary);\n`;
    exportCSS += `  --input-disabled-bg: var(--semantic-color-disabled-bg);\n`;
    exportCSS += `  --input-disabled-text: var(--semantic-color-disabled-text);\n`;

    exportCSS += `\n  /* Link Namespace */\n`;
    exportCSS += `  --link-color: var(--semantic-link-default);\n`;
    exportCSS += `  --link-hover: var(--semantic-link-hover);\n`;
    exportCSS += `  --link-visited: var(--semantic-link-visited);\n`;
    exportCSS += `  --link-active: var(--semantic-link-active);\n`;

    exportCSS += `\n  /* Button Component Default */\n`;
    exportCSS += `  --btn-primary-bg: var(--semantic-color-primary);\n`;
    exportCSS += `  --btn-primary-text: var(--semantic-on-primary);\n`;
    exportCSS += `  --btn-primary-bg-hover: var(--primitive-color-brand-600);\n`;
    exportCSS += `  --btn-primary-bg-active: var(--primitive-color-brand-700);\n`;
    exportCSS += `  --btn-primary-border: var(--semantic-color-primary);\n`;
    exportCSS += `  --btn-primary-focus-ring: var(--semantic-focus-ring-color);\n`;
    exportCSS += `\n`;
    exportCSS += `  --btn-radius: var(--semantic-radius-md);\n`;
    exportCSS += `  --btn-padding-x: calc(var(--primitive-space-base) * 4);\n`;
    exportCSS += `  --btn-padding-y: calc(var(--primitive-space-base) * 2);\n`;
    exportCSS += `\n  --btn-quaternary-bg: transparent;\n`;
    exportCSS += `  --btn-quaternary-text: var(--semantic-color-primary);\n`;

    exportCSS += `\n  /* Backward Compatibility Mappings (To be deprecated) */\n`;
    exportCSS += `  --color-primary-base: var(--semantic-color-primary);\n`;
    exportCSS += `  --color-primary: var(--semantic-color-primary);\n`;
    exportCSS += `  --color-state-focus: var(--semantic-focus-ring-color);\n`;
    exportCSS += `  --color-action-link: var(--semantic-color-primary);\n`;

    // Legacy SYX variables bridge (Conditional)
    if (modDisableLegacyToggle && !modDisableLegacyToggle.checked) {
      exportCSS += `\n  /* Legacy SYX variables bridge */\n`;
      exportCSS += `  --semantic-color-bg-primary: var(--semantic-background-elevated);\n`;
      exportCSS += `  --semantic-color-bg-secondary: var(--semantic-surface-2);\n`;
      exportCSS += `  --semantic-color-bg-tertiary: var(--semantic-background-page);\n`;
      exportCSS += `  --semantic-color-bg-inverse: var(--semantic-background-inverse);\n`;

      exportCSS += `  --semantic-color-text-primary: var(--semantic-text-primary);\n`;
      exportCSS += `  --semantic-color-text-secondary: var(--semantic-text-secondary);\n`;
      exportCSS += `  --semantic-color-text-tertiary: var(--semantic-text-tertiary);\n`;
      exportCSS += `  --semantic-color-text-inverse: var(--semantic-text-inverse);\n`;
      exportCSS += `  --semantic-color-text-disabled: var(--semantic-text-disabled);\n`;

      exportCSS += `  --semantic-color-border-default: var(--semantic-border-default);\n`;
      exportCSS += `  --semantic-color-border-subtle: var(--semantic-border-muted);\n`;
      exportCSS += `  --semantic-color-border-strong: var(--semantic-border-strong);\n`;
      exportCSS += `  --semantic-color-border-focus: var(--semantic-border-focus);\n`;
      exportCSS += `  --semantic-color-state-disabled: var(--semantic-color-disabled-bg);\n`;
    }



    exportCSS += `}\n`; // Close the main :root wrapper

    // --- Enterprise Dark Mode Block ---
    exportCSS += `\n[data-theme="dark"] {\n`;
    exportCSS += `  --semantic-color-primary: var(--primitive-color-brand-400);\n`;
    exportCSS += `  --semantic-color-secondary: var(--primitive-color-secondary-800);\n`;
    exportCSS += `  --semantic-focus-ring-color: var(--primitive-color-brand-400);\n`;
    exportCSS += `  /* Surface & Backgrounds */\n`;
    exportCSS += `  --semantic-surface-1: var(--primitive-color-gray-900);\n`;
    exportCSS += `  --semantic-surface-2: var(--primitive-color-gray-800);\n`;
    exportCSS += `  --semantic-background-inverse: var(--primitive-color-white);\n`;
    exportCSS += `\n  /* Text & On-Colors */\n`;
    exportCSS += `  --semantic-text-primary: var(--primitive-color-white);\n`;
    exportCSS += `  --semantic-text-secondary: var(--primitive-color-gray-400);\n`;
    exportCSS += `  --semantic-text-tertiary: var(--primitive-color-gray-500);\n`;
    exportCSS += `  --semantic-text-disabled: var(--primitive-color-gray-700);\n`;
    exportCSS += `  --semantic-text-inverse: var(--primitive-color-gray-900);\n`;
    exportCSS += `  --semantic-on-secondary: var(--primitive-color-white);\n`;
    exportCSS += `\n  /* Disabled States */\n`;
    exportCSS += `  --semantic-color-disabled-bg: var(--primitive-color-gray-800);\n`;
    exportCSS += `  --semantic-color-disabled-border: var(--primitive-color-gray-700);\n`;
    exportCSS += `  --semantic-color-disabled-text: var(--primitive-color-gray-600);\n`;
    exportCSS += `\n  /* Semantic Borders */\n`;
    exportCSS += `  --semantic-border-muted: var(--primitive-color-gray-800);\n`;
    exportCSS += `  --semantic-border-default: var(--primitive-color-gray-700);\n`;
    exportCSS += `  --semantic-border-strong: var(--primitive-color-gray-600);\n`;
    exportCSS += `  --semantic-border-focus: var(--semantic-color-primary);\n`;

    exportCSS += `\n  /* Interactive Neutrals */\n`;
    exportCSS += `  --semantic-interactive-bg-hover: var(--primitive-color-gray-800);\n`;
    exportCSS += `  --semantic-interactive-bg-active: var(--primitive-color-gray-700);\n`;

    exportCSS += `\n  /* Semantic Links */\n`;
    exportCSS += `  --semantic-link-hover: var(--primitive-color-brand-400);\n`;
    exportCSS += `  --semantic-link-visited: var(--primitive-color-brand-300);\n`;
    exportCSS += `  --semantic-link-active: var(--primitive-color-brand-200);\n`;

    exportCSS += `\n  /* State Tones (Dark) */\n`;
    exportCSS += `  --semantic-tone-success-bg: oklch(0.25 0.05 ${sucH});\n`;
    exportCSS += `  --semantic-tone-success-border: oklch(0.45 0.1 ${sucH});\n`;
    exportCSS += `  --semantic-tone-success-text: oklch(0.85 0.15 ${sucH});\n`;
    exportCSS += `  --semantic-tone-warning-bg: oklch(0.25 0.05 ${warH});\n`;
    exportCSS += `  --semantic-tone-warning-border: oklch(0.45 0.1 ${warH});\n`;
    exportCSS += `  --semantic-tone-warning-text: oklch(0.85 0.15 ${warH});\n`;
    exportCSS += `  --semantic-tone-error-bg: oklch(0.25 0.05 ${errH});\n`;
    exportCSS += `  --semantic-tone-error-border: oklch(0.45 0.1 ${errH});\n`;
    exportCSS += `  --semantic-tone-error-text: oklch(0.85 0.15 ${errH});\n`;
    exportCSS += `}\n`;

    exportCSS += `\n@supports (color: oklch(0 0 0)) {\n`;
    exportCSS += `  :root {\n`;
    exportCSS += `    --semantic-shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.05);\n`;
    exportCSS += `    --semantic-shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1);\n`;
    exportCSS += `    --semantic-shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1);\n`;
    exportCSS += `  }\n`;
    exportCSS += `}\n`;

    // Inject Modular Architectures if toggles are active
    if (modFluidToggle.checked) {
      exportCSS += `\n:root {\n` + getFluidCSS() + `}\n`;
    }
    if (modPaletteToggle.checked) {
      exportCSS += `\n:root {\n` + getExtendedPaletteCSS() + `}\n`;
    }
    if (modFormsToggle.checked) {
      exportCSS += `\n:root {\n` + getFormsCSS() + `}\n`;
    }
    if (modTablesToggle.checked) {
      exportCSS += `\n:root {\n` + getTablesLayoutCSS() + `}\n`;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(exportCSS).then(() => {
      exportBtn.innerHTML = '<span class="atom-icon atom-icon--lc-check"></span> Copied to Clipboard!';
      setTimeout(() => {
        exportBtn.innerHTML = '<span class="atom-icon atom-icon--lc-download" aria-hidden="true"></span> Export Theme CSS';
      }, 2000);
    }).catch(err => {
      prompt("Copy to clipboard failed. Here is your code:", exportCSS);
    });
  });

  // Attach listeners to native change & input events for real-time play
  const inputs = [
    primaryH, primaryC, primaryL,
    secondaryH, secondaryC, secondaryL,
    accentH, accentC, accentL,
    neutralH, neutralC,
    successH, warningH, errorH,
    radiusBase, spacingBase, borderWidth, containerMaxWidth, focusRingWidth,
    fontFamily, fontFamilyHeading, fontSizeBase, lineHeightBase, fontWeightBase, fontWeightHeading,
    transitionDuration, transitionEasing,
    modFluidToggle, modPaletteToggle, modFormsToggle, modTablesToggle
  ];
  inputs.forEach(input => {
    input.addEventListener('input', applyTheme);
  });

  // Init
  applyTheme();

});
