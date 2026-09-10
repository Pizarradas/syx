/**
 * Parser mínimo de los templates `usage` del registro.
 *
 * No es un parser de HTML general y no pretende serlo: los templates son
 * snippets cortos y disciplinados (se comprobó antes de escribir esto: sin
 * SVG, sin comentarios, sin style=, único void element <input>). Si algún día
 * un usage trae algo que esto no entiende, el parser lanza — mejor romper la
 * generación que emitir un wrapper silenciosamente distinto del template.
 *
 * Devuelve nodos { tag, attrs: {nombre: valor}, children: [nodo|string] }.
 */

const VOID_TAGS = new Set(['input', 'br', 'hr', 'img', 'meta', 'link']);

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function decode(text) {
  return text.replace(/&[a-z#0-9]+;/gi, (e) => {
    if (e in ENTITIES) return ENTITIES[e];
    const num = e.match(/^&#(\d+);$/);
    if (num) return String.fromCodePoint(Number(num[1]));
    throw new Error(`Entidad HTML no soportada por parse-html: ${e}`);
  });
}

export function parseFragment(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    // Los templates del registro vienen en una línea, sin sangrado decorativo:
    // cualquier nodo de texto, incluso de solo espacios, es contenido real
    // (p. ej. el espacio entre <span>s dentro de un <pre>). No se descarta nada.
    if (lt === -1) {
      const text = html.slice(i);
      if (text) stack[stack.length - 1].children.push(decode(text));
      break;
    }
    if (lt > i) {
      const text = html.slice(i, lt);
      if (text) stack[stack.length - 1].children.push(decode(text));
    }
    const gt = html.indexOf('>', lt);
    if (gt === -1) throw new Error(`Tag sin cerrar en: ${html.slice(lt, lt + 40)}…`);
    const raw = html.slice(lt + 1, gt);

    if (raw.startsWith('/')) {
      const tag = raw.slice(1).trim().toLowerCase();
      const open = stack.pop();
      if (!open || open.tag !== tag) {
        throw new Error(`Cierre </${tag}> no casa con <${open?.tag}>`);
      }
    } else {
      if (raw.startsWith('!')) throw new Error(`Comentario/doctype no soportado: <${raw.slice(0, 30)}…`);
      const selfClosing = raw.endsWith('/');
      const body = selfClosing ? raw.slice(0, -1) : raw;
      const m = body.match(/^([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*)$/);
      if (!m) throw new Error(`Tag ilegible: <${raw.slice(0, 30)}…`);
      const tag = m[1].toLowerCase();
      const attrs = {};
      const attrRe = /([a-zA-Z-]+)(?:="([^"]*)")?/g;
      for (const a of m[2].matchAll(attrRe)) {
        attrs[a[1]] = a[2] !== undefined ? decode(a[2]) : '';
      }
      const node = { tag, attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!selfClosing && !VOID_TAGS.has(tag)) stack.push(node);
    }
    i = gt + 1;
  }

  if (stack.length !== 1) {
    throw new Error(`Quedaron tags sin cerrar: ${stack.slice(1).map((n) => n.tag).join(', ')}`);
  }
  return root.children;
}
