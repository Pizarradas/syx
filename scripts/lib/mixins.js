/**
 * SYX — Los mixins, leídos del SCSS
 * ─────────────────────────────────
 * Los 44 mixins de scss/abstracts/mixins/ con su firma, sus parámetros, lo que
 * emiten y quién los usa.
 *
 * POR QUÉ FALTABA ESTO
 * Por una asimetría que llevaba desde el principio: R03 y R04 le dicen a un
 * agente lo que NO puede escribir —`transition:` en crudo, `position: absolute`—
 * y no había nada a lo que preguntar qué escribir en su lugar. Su única salida
 * eran 526 líneas de README en prosa. Un contrato que prohíbe sin ofrecer
 * alternativa consultable produce exactamente lo que produjo con los tokens:
 * nombres inventados.
 *
 * Y es la mitad del sistema que solo existe en el SCSS. Los tokens y las clases
 * se pueden arbitrar contra el CSS compilado, porque acaban ahí; un mixin no
 * deja rastro reconocible después de compilar: se disuelve en las
 * declaraciones que genera. Si no se lee de la fuente, no se lee de ningún
 * sitio.
 *
 * QUÉ SE DEDUCE Y QUÉ SE COPIA
 * La firma, los parámetros con sus valores por defecto, las propiedades que el
 * cuerpo declara y los mixins que llama se DEDUCEN del código. La descripción y
 * los ejemplos se COPIAN del comentario que hay encima, tal cual: si alguien
 * los actualiza, esto los sirve actualizados, y si no existen, no se inventan.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DIR = ['scss', 'abstracts', 'mixins'];
const FUENTES = ['scss/atoms', 'scss/molecules', 'scss/organisms', 'scss/utilities', 'scss/base', 'scss/layout', 'scss/pages'];

// El texto que se sirve sale del fichero tal cual. Hubo aquí una reparación al
// vuelo de los comentarios mal codificados del repositorio; sobra desde que la
// fuente está limpia y `check:encoding` la mantiene así. Reparar al servir era
// además una pequeña mentira: lo que devolvía no era lo que había escrito.
const limpiar = (t) => String(t).replace(/\r/g, '');

/** El cuerpo `{…}` que empieza en `desde`, con las llaves equilibradas. */
function cuerpo(texto, desde) {
  const abre = texto.indexOf('{', desde);
  if (abre === -1) return '';
  let nivel = 1;
  let i = abre + 1;
  while (i < texto.length && nivel > 0) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}') nivel--;
    i++;
  }
  return texto.slice(abre + 1, i - 1);
}

/**
 * Parámetros con su valor por defecto.
 * Se recorre carácter a carácter porque un valor por defecto puede llevar comas
 * dentro —`$color: var(--x, red)`— y partir por comas rompe justo en los casos
 * que más importan.
 */
function parametros(firma) {
  const fuera = [];
  let actual = '';
  let nivel = 0;
  for (const c of firma) {
    if (c === '(') nivel++;
    if (c === ')') nivel--;
    if (c === ',' && nivel === 0) { fuera.push(actual); actual = ''; continue; }
    actual += c;
  }
  if (actual.trim()) fuera.push(actual);
  return fuera.map((p) => {
    const t = p.trim();
    const i = t.indexOf(':');
    if (t.endsWith('...')) return { name: t.replace(/\.\.\.$/, ''), variadic: true };
    if (i === -1) return { name: t, required: true };
    return { name: t.slice(0, i).trim(), default: t.slice(i + 1).trim() };
  });
}

/** El bloque de comentarios `//` pegado justo encima de una línea. */
function docDe(lineas, indice) {
  const bloque = [];
  for (let i = indice - 1; i >= 0; i--) {
    const l = lineas[i].trim();
    if (l === '' && bloque.length) break;
    if (l === '') continue;
    if (!l.startsWith('//')) break;
    bloque.unshift(l.replace(/^\/\/ ?/, ''));
  }
  // Una tira de guiones o de iguales es un separador visual, no documentación.
  while (bloque.length && /^[=─-]{4,}$/.test(bloque[0].trim())) bloque.shift();
  return bloque;
}

function leer(root) {
  const dir = path.join(root, ...DIR);
  const mixins = [];

  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.scss'))) {
    const rel = `${DIR.join('/')}/${f}`;
    const texto = fs.readFileSync(path.join(dir, f), 'utf8');
    const lineas = texto.split('\n');

    for (const m of texto.matchAll(/@mixin\s+([a-zA-Z0-9_-]+)\s*(\(([^)]*(?:\([^)]*\)[^)]*)*)\))?\s*\{/g)) {
      const linea = texto.slice(0, m.index).split('\n').length;
      const cuerpoTexto = cuerpo(texto, m.index);
      const doc = docDe(lineas, linea - 1).map(limpiar);

      // El comentario mezcla prosa y ejemplos; se separan por la marca @example.
      const iEj = doc.findIndex((l) => l.startsWith('@example'));
      const descripcion = (iEj === -1 ? doc : doc.slice(0, iEj)).filter(Boolean).join(' ').trim();
      const ejemplos = iEj === -1 ? [] : doc.slice(iEj + 1).filter((l) => l.trim());

      mixins.push({
        name: m[1],
        signature: `${m[1]}(${(m[3] || '').replace(/\s+/g, ' ').trim()})`,
        params: m[3] ? parametros(m[3]) : [],
        file: rel,
        line: linea,
        description: descripcion || null,
        examples: ejemplos,
        // Lo que declara por su cuenta, y a quién delega.
        emits: [...new Set([...cuerpoTexto.matchAll(/^\s*([a-z-]+):\s*[^;]+;/gm)].map((x) => x[1]))].sort(),
        calls: [...new Set([...cuerpoTexto.matchAll(/@include\s+([a-zA-Z0-9_-]+)/g)].map((x) => x[1]))]
          .filter((x) => x !== m[1]).sort(),
      });
    }
  }

  // Cuántas veces se usa cada uno en el código de componentes. Es el dato que
  // separa un mixin central de uno que nadie llama, y no está escrito en
  // ninguna parte: hay que contarlo.
  const conteo = new Map();
  const andar = (d) => {
    let entradas = [];
    try { entradas = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entradas) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { andar(p); continue; }
      if (!e.name.endsWith('.scss')) continue;
      for (const x of fs.readFileSync(p, 'utf8').matchAll(/@include\s+([a-zA-Z0-9_-]+)/g)) {
        conteo.set(x[1], (conteo.get(x[1]) || 0) + 1);
      }
    }
  };
  for (const f of FUENTES) andar(path.join(root, f));
  for (const mx of mixins) mx.uses = conteo.get(mx.name) || 0;

  return mixins.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
}

// ─── La regla que faltaba: qué mixin sustituye a qué propiedad ───────────────
// R03 y R04 prohíben `transition:` y `position:` en crudo. Saber cuál es el
// recambio no debería exigir leer un README: se deduce de qué mixin emite esa
// propiedad, y en caso de empate gana el que más se usa.

function recambioPara(propiedad, mixins) {
  // No basta con que emita la propiedad: `aspect-ratio` emite `display` de
  // paso, y ofrecerlo como recambio de `display:` sería un consejo malo dicho
  // con seguridad. Solo vale si la propiedad es lo que ese mixin ES —lleva su
  // nombre, o es lo único que emite—. Cuando no está claro, se devuelve null:
  // un contrato equivocado es peor que uno ausente, porque el agente no puede
  // distinguirlos.
  //
  // Y tampoco basta con mirar lo que emite: `margin()` y `padding()` no emiten
  // nada por su cuenta, delegan en `syx-directional`, así que buscarlos por lo
  // que declaran no los encuentra — y son dos de los mixins más usados del
  // repositorio. El nombre es la señal más fuerte que hay, y manda.
  const porNombre = mixins.filter((m) => m.name === propiedad);
  const soloEsa = mixins.filter((m) => m.emits.length === 1 && m.emits[0] === propiedad && m.name !== propiedad);
  const candidatos = porNombre.length ? porNombre : soloEsa;
  if (!candidatos.length) return null;
  const mejor = candidatos[0]; // ya vienen ordenados por uso

  // Los alias se buscan entre TODOS los mixins, no entre los candidatos: un
  // alias delega y por tanto NO emite la propiedad él mismo, así que buscarlo
  // entre los que la emiten no encuentra ninguno. Justo lo que le pasaba a
  // `position`, cuyos cuatro alias —absolute, fixed, relative, sticky— son la
  // forma en que de verdad se escribe en este repositorio.
  const alias = mixins
    .filter((m) => m.name !== mejor.name && m.calls.includes(mejor.name))
    .sort((a, b) => b.uses - a.uses)
    .map((m) => m.name);

  return { mixin: mejor.name, signature: mejor.signature, alias, ejemplo: mejor.examples[0] || null };
}

module.exports = { leer, recambioPara };
