/**
 * SYX — Registro de capacidades
 * ─────────────────────────────
 * Responde «¿esto ya lo hace SYX, y dónde?» buscando por concepto en
 * contracts/capabilities.json. Lo usan tres sitios:
 *   · scripts/lib/consulta.js     — findCapability, para el MCP y la API de Node
 *   · scripts/check-capacidades.js — que cada evidencia siga siendo cierta
 *   · el modo ROADMAP             — que lo pregunta antes de proponer nada
 *
 * POR QUÉ BUSCA POR PALABRAS Y NO POR NOMBRE
 * El fallo que lo motivó fue exactamente buscar por nombre: una revisión
 * externa buscó `--semantic-space-fluid-*`, no lo encontró y propuso crear un
 * espaciado fluido que ya existía con otro nombre. Aquí cada entrada lleva
 * alias en los dos idiomas —también los nombres que NO existen— y la consulta
 * se parte en palabras: «añadir container queries a la card» encuentra
 * `container-queries` aunque nadie haya escrito esa frase.
 *
 * QUÉ NO HACE
 * No decide si una propuesta es buena. Dice qué hay y con qué prueba; que un
 * concepto no aparezca no demuestra que falte, y la respuesta lo dice.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ESTADOS = ['done', 'partial', 'rejected', 'open'];

// Palabras que no distinguen un concepto de otro. Sin tildes: se comparan
// después de `plano()`.
const VACIAS = new Set([
  'a', 'al', 'and', 'con', 'de', 'del', 'el', 'en', 'for', 'in', 'la', 'las', 'los', 'of', 'on', 'or',
  'para', 'por', 'que', 'the', 'to', 'un', 'una', 'use', 'usar', 'uso', 'with', 'y', 'syx',
  'add', 'anadir', 'crear', 'create', 'new', 'nuevo', 'nueva', 'mejorar', 'improve', 'adoptar', 'adopt',
]);

const plano = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabras = (s) => plano(s).split(/[^a-z0-9@#-]+/).map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w && !VACIAS.has(w));

function leer(root) {
  const f = path.join(root, 'contracts', 'capabilities.json');
  if (!fs.existsSync(f)) throw new Error('Falta contracts/capabilities.json');
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

/**
 * Puntúa cada entrada contra la consulta. Una frase entera de alias dentro de
 * la consulta vale más que palabras sueltas; el id y el título también cuentan.
 */
function buscar(registro, consulta, limite = 3) {
  const q = plano(consulta).trim();
  const qp = new Set(palabras(consulta));
  if (!q) return [];
  const puntuadas = registro.capabilities.map((c) => {
    let puntos = 0;
    const frases = [c.id.replace(/-/g, ' '), c.title, ...(c.aliases || [])].map(plano);
    for (const f of frases) {
      if (f.length > 2 && (q.includes(f) || f.includes(q))) puntos += 3;
      const fp = palabras(f);
      const comunes = fp.filter((w) => qp.has(w)).length;
      if (comunes) puntos += comunes / fp.length;
    }
    return { c, puntos };
  });
  return puntuadas
    .filter((x) => x.puntos >= 1)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, limite)
    .map(({ c }) => c);
}

/** Lo que encuentra la consulta, con la evidencia resuelta a fichero y línea. */
function responder(root, { query } = {}) {
  const registro = leer(root);
  if (!query) {
    return {
      statuses: registro._meta.statuses,
      capabilities: registro.capabilities.map((c) => ({ id: c.id, title: c.title, status: c.status })),
    };
  }
  const matches = buscar(registro, query).map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    meaning: registro._meta.statuses[c.status],
    evidence: (c.evidence || []).map((e) => ({ path: e.path, line: lineaDe(root, e) })),
    ...(c.gap ? { gap: c.gap } : {}),
    ...(c.blocker ? { blocker: c.blocker } : {}),
    ...(c.decision ? { decision: c.decision } : {}),
    ...(c.instead ? { instead: c.instead } : {}),
    ...(c.note ? { note: c.note } : {}),
  }));
  return {
    query,
    found: matches.length > 0,
    matches,
    ...(matches.length ? {} : {
      note: 'Not in the capability ledger. That is not proof of absence: search scss/ by concept (and get_component, get_token, list_mixins) before proposing it, and cite what you searched.',
    }),
  };
}

/** La línea (1-based) donde la expresión de una evidencia se cumple, o null. */
function lineaDe(root, e) {
  const f = path.join(root, e.path);
  if (!fs.existsSync(f)) return null;
  const texto = fs.readFileSync(f, 'utf8');
  const m = new RegExp(e.match, 'm').exec(texto);
  return m ? texto.slice(0, m.index).split('\n').length : null;
}

/** Los fallos de forma y de evidencia del registro. Vacío = sano. */
function verificar(root) {
  const fallos = [];
  let registro;
  try { registro = leer(root); } catch (e) { return [e.message]; }
  const ids = new Set();
  for (const c of registro.capabilities || []) {
    const quien = c.id || '(sin id)';
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) fallos.push(`${quien}: id ausente o con caracteres fuera de [a-z0-9-]`);
    if (ids.has(c.id)) fallos.push(`${quien}: id repetido`);
    ids.add(c.id);
    if (!c.title) fallos.push(`${quien}: sin title`);
    if (!ESTADOS.includes(c.status)) fallos.push(`${quien}: status «${c.status}» no es ${ESTADOS.join(' | ')}`);
    if (!Array.isArray(c.aliases) || c.aliases.length < 3) fallos.push(`${quien}: menos de tres alias; se encuentra por cómo lo pediría alguien, no por su id`);
    if (!Array.isArray(c.evidence) || !c.evidence.length) fallos.push(`${quien}: sin evidencia`);
    if (['partial', 'open'].includes(c.status) && !c.gap) fallos.push(`${quien}: ${c.status} sin «gap» (qué falta)`);
    if (c.status === 'rejected' && !c.decision) fallos.push(`${quien}: rejected sin «decision» (por qué)`);
    for (const e of c.evidence || []) {
      if (!e.path || !e.match) { fallos.push(`${quien}: evidencia sin path o sin match`); continue; }
      try { new RegExp(e.match, 'm'); } catch (err) { fallos.push(`${quien}: expresión inválida ${e.match}`); continue; }
      if (!fs.existsSync(path.join(root, e.path))) fallos.push(`${quien}: no existe ${e.path}`);
      else if (lineaDe(root, e) === null) fallos.push(`${quien}: ${e.path} ya no contiene /${e.match}/`);
    }
  }
  for (const c of registro.capabilities || []) {
    if (c.instead && !ids.has(c.instead)) fallos.push(`${c.id}: «instead» apunta a ${c.instead}, que no existe`);
  }
  return fallos;
}

module.exports = { leer, buscar, responder, verificar, ESTADOS };
