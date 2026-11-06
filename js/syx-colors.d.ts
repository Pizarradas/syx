export type ColorFormat = 'hex' | 'rgb' | 'oklch';
export interface ParsedColor { rgb: [number, number, number]; alpha: number; }
export function parseColor(value: string): ParsedColor | null;
export function formatColor(color: ParsedColor, format?: ColorFormat): string;
export function resolveColors(entries: string[], options?: { format?: ColorFormat; scope?: Element }): string[];
export function resolveColor(entry: string, options?: { format?: ColorFormat; scope?: Element }): string;
