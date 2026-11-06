/** Tipos de la API de Node de SYX: las mismas consultas que sirve el servidor MCP. */

export type Mode = 'light' | 'dark';

export interface ThemeQuery {
  theme?: string;
  mode?: Mode;
}

export interface TokenResult {
  found: boolean;
  token: string;
  theme?: string;
  mode?: Mode;
  value?: string;
  /** `site`: existe solo en las páginas de SYX, no llega a `dist/` ni a una app. */
  scope?: 'site';
  isExpression?: boolean;
  unresolved?: string | null;
  chain?: string[];
  suggestions?: string[];
}

export interface TokenValueResult {
  value: string;
  theme: string;
  mode: Mode;
  exact: string[];
  partial: Array<{ value: string; tokens: string[] }>;
}

export interface ComponentSummary {
  name: string;
  layer: 'atom' | 'molecule' | 'organism';
  classes: string[];
  file: string;
}

export interface ComponentResult extends Partial<ComponentSummary> {
  found: boolean;
  name: string;
  tokenFiles?: string[];
  modifiers?: string[];
  elements?: string[];
  states?: string[];
  composedOf?: string[];
  tokens?: string[];
  description?: string;
  usage?: string;
  a11y?: unknown;
  suggestions?: string[];
}

export interface SnippetResult {
  path: string;
  /** Lo que esta comprobación deja sin mirar: `valid` no es «nada que arreglar». */
  notChecked: string;
  valid: boolean;
  violations: Record<string, unknown>;
  unknownTokens: unknown[];
  note?: string;
}

export interface ScanResult {
  findings: unknown[];
  [key: string]: unknown;
}

export const version: string;
export const paths: {
  root: string;
  tokens: string;
  registry: string;
  resolvedTokens: string;
  rules: string;
  css: string;
  scss: string;
  mcpServer: string;
};

export function cssPath(theme?: string): string;
export function scssPath(theme?: string): string;
export function listThemes(): { themes: string[]; modes: Mode[]; default: string; [key: string]: unknown };
export function getToken(query: { token: string } & ThemeQuery): TokenResult;
export function findTokenByValue(query: { value: string } & ThemeQuery): TokenValueResult;
export function listTokens(query?: ThemeQuery): { theme: string; mode: Mode; total: number; tokens: Record<string, string> };
export function resolveColor(query: { token: string } & ThemeQuery): string | null;
export function listComponents(): { total: number; components: ComponentSummary[] };
export function getComponent(query: { name: string }): ComponentResult;
export function getFigmaSpec(query: { component: string } & ThemeQuery): Record<string, unknown>;
export function validateSnippet(query: { code: string; path?: string }): SnippetResult;
export function classifyChange(query: { paths?: string[]; token?: string }): Record<string, unknown>;
export function scan(query: { files: string[] } & ThemeQuery): ScanResult;
export function listMixins(): { total: number; mixins: unknown[] };
export function getMixin(query: { name: string }): Record<string, unknown>;
export function findCapability(query: { query: string }): { query: string; found: boolean; matches?: unknown[]; note?: string };

declare const syx: {
  version: typeof version;
  paths: typeof paths;
  cssPath: typeof cssPath;
  scssPath: typeof scssPath;
  listThemes: typeof listThemes;
  getToken: typeof getToken;
  findTokenByValue: typeof findTokenByValue;
  listTokens: typeof listTokens;
  resolveColor: typeof resolveColor;
  listComponents: typeof listComponents;
  getComponent: typeof getComponent;
  getFigmaSpec: typeof getFigmaSpec;
  validateSnippet: typeof validateSnippet;
  classifyChange: typeof classifyChange;
  scan: typeof scan;
  listMixins: typeof listMixins;
  getMixin: typeof getMixin;
  findCapability: typeof findCapability;
};
export default syx;
