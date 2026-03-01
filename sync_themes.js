const fs = require('fs');
const path = require('path');

const themesDir = path.join('c:', 'Users', 'José Luis', 'OneDrive', 'Escritorio', 'syx--system', 'scss', 'themes');
const themeFiles = [
    path.join(themesDir, '_template', '_theme.scss'),
    path.join(themesDir, 'example-01', '_theme.scss'),
    path.join(themesDir, 'example-02', '_theme.scss'),
    path.join(themesDir, 'example-03', '_theme.scss'),
    path.join(themesDir, 'example-04', '_theme.scss'),
    path.join(themesDir, 'example-05', '_theme.scss'),
    path.join(themesDir, 'example-06', '_theme.scss')
];

function processTheme(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`Missing file: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Rename Buttons Fonts to Text
    content = content.replace(/btn-(primary|secondary|tertiary|quaternary)-font-color/g, 'btn-$1-text');
    content = content.replace(/btn-(primary|secondary|tertiary|quaternary)-filled-font-color/g, 'btn-$1-filled-text');

    // 2. Rename Focus Ring and Borders
    content = content.replace(/semantic-color-state-focus/g, 'semantic-focus-ring-color');
    content = content.replace(/semantic-color-border-focus/g, 'semantic-border-focus');

    // 3. Rename States to Tones (if they exist)
    content = content.replace(/color-state-ok/g, 'semantic-tone-success-bg');
    content = content.replace(/color-state-ko/g, 'semantic-tone-error-bg');
    content = content.replace(/color-state-warning/g, 'semantic-tone-warning-bg');

    // 4. Inject Theme Widths inside :root if not present
    if (!content.includes('--theme-focus-ring-width:')) {
        content = content.replace(/--theme-radius:/, '--theme-focus-ring-width: 2px;\n    --theme-radius:');
    }

    // 5. Inject Semantic Widths around backgrounds or borders
    if (!content.includes('--semantic-outline-width:')) {
        // find semantic-color-border-default and inject before it
        content = content.replace(/--semantic-color-border-default:/, '--semantic-border-width: 1px;\n    --semantic-outline-width: var(--theme-focus-ring-width);\n    --semantic-color-border-default:');
    }

    // 6. Split Overlay Alpha
    if (content.includes('--semantic-background-overlay:') && !content.includes('--semantic-overlay-alpha:')) {
        content = content.replace(/--semantic-background-overlay:[^;]+;/, '--semantic-overlay-alpha: 0.5;\n    --semantic-background-overlay: oklch(0 0 0 / var(--semantic-overlay-alpha));');
    }

    // 7. Ensure Dark Mode Overrides for Primary & Focus Ring & Border Focus
    // Look for [data-theme="dark"] block
    if (content.match(/\[data-theme="dark"\]\s*\{/)) {
        // Check if overrides exist, if not inject them at the top of the block
        if (!content.includes('--semantic-border-focus: var(--semantic-color-primary)')) {
            content = content.replace(/(\[data-theme="dark"\]\s*\{(?:\s*@include dark-mode-tokens\(\);\s*)?)/, '$1\n    --semantic-border-focus: var(--semantic-color-primary);');
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

themeFiles.forEach(processTheme);
console.log('Processed all theme files successfully.');
