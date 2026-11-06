/** Inicializa el componente dentro de `root` (por defecto, todo el documento). */
export function initToasts(root?: ParentNode): void;
export function showToast(
  message: string,
  options?: { tone?: string; duration?: number; region?: Element; dismissLabel?: string }
): unknown;
