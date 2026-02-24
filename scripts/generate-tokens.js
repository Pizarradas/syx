const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../scss/abstracts/tokens');
const OUTPUT_FILE = path.join(__dirname, '../tokens.json');

function getTokenType(key) {
    if (key.includes('color')) return 'color';
    if (key.includes('space') || key.includes('spacing') || key.includes('size')) return 'spacing';
    if (key.includes('font-family')) return 'fontFamilies';
    if (key.includes('font-weight')) return 'fontWeights';
    if (key.includes('line-height')) return 'lineHeights';
    if (key.includes('shadow')) return 'boxShadow';
    if (key.includes('border-radius')) return 'borderRadius';
    if (key.includes('border-width')) return 'borderWidth';
    return 'other';
}

function processLine(line, result) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('--')) return;

    const parts = trimmed.split(':');
    if (parts.length < 2) return;

    const key = parts[0].trim();
    let value = parts.slice(1).join(':').trim();
    if (value.endsWith(';')) value = value.slice(0, -1);
    
    // Remove comments
    const commentIndex = value.indexOf('//');
    if (commentIndex !== -1) {
        value = value.substring(0, commentIndex).trim();
    }

    // Convert var(--foo) to {foo} syntax for Tokens Studio
    value = value.replace(/var\(--([^)]+)\)/g, (match, p1) => `{${p1.replace(/-/g, '.')}}`);

    const keyPath = key.substring(2).split('-');
    let current = result;

    for (let i = 0; i < keyPath.length; i++) {
        const part = keyPath[i];
        if (i === keyPath.length - 1) {
            current[part] = {
                value: value,
                type: getTokenType(key)
            };
        } else {
            current[part] = current[part] || {};
            current = current[part];
        }
    }
}

function walk(dir, result) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, result);
        } else {
            if (file.endsWith('.scss')) {
                const content = fs.readFileSync(filePath, 'utf8');
                content.split('\n').forEach(line => processLine(line, result));
            }
        }
    });
}

const tokens = {};
if (fs.existsSync(SOURCE_DIR)) {
    walk(SOURCE_DIR, tokens);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tokens, null, 2));
    console.log(`Tokens generated at ${OUTPUT_FILE}`);
} else {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
}
