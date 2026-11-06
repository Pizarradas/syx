// Entrada ESM. La API vive en index.js; esto solo da nombre a sus exportaciones,
// que Node no puede deducir de un `module.exports = { ...syx }`.
import syx from './index.js';

export default syx;
export const {
  version, paths, cssPath, scssPath, listThemes, getToken, findTokenByValue, listTokens, resolveColor,
  listComponents, getComponent, getFigmaSpec, validateSnippet, classifyChange, scan, listMixins,
  getMixin, findCapability,
} = syx;
