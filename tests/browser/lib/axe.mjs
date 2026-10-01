/**
 * SYX — axe con excepciones acotadas, y sin «no lo sé» que pase por bueno
 * ───────────────────────────────────────────────────────────────────────
 * axe devuelve dos listas que importan: `violations` (lo que sabe que falla)
 * e `incomplete` (lo que no supo decidir). Hasta octubre de 2026 el arnés solo
 * pedía la primera, así que todo lo que axe no sabía medir —contraste sobre un
 * degradado, sobre un pseudoelemento, bajo otro elemento— pasaba como si
 * cumpliera. Ahora un incompleto FALLA salvo que esté revisado y registrado
 * en axe-excepciones.json, con el mismo formato que una violación aceptada y
 * `"tipo": "incompleto"`.
 *
 * Los incompletos de contraste no se registran a ojo: el arnés los mide en
 * píxeles (lib/pixeles.mjs) en cada ejecución. Su `ratioMinima` es lo medido
 * cuando se revisó; si la medida baja de ese suelo, o del mínimo de WCAG, la
 * excepción deja de cubrirlo y la prueba falla.
 *
 * Una excepción lleva: regla, componente (o la página, p. ej. "docs.html"),
 * selector (un trozo del selector de axe), temas ("tema/modo"), caduca
 * (AAAA-MM-DD), porque y, para contraste, ratioMinima. La que no trae todo,
 * la que caducó y la que no excusa nada en una ejecución completa paran la
 * ejecución. (Auditoría 2026-10 · acción 8)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { AQUI } from './comun.mjs';
import { contrasteDeTexto } from './pixeles.mjs';

const require = createRequire(import.meta.url);
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const FICHERO_EXCEPCIONES = path.join(AQUI, 'axe-excepciones.json');

export function cargarExcepciones() {
  const lista = JSON.parse(fs.readFileSync(FICHERO_EXCEPCIONES, 'utf8')).excepciones;
  const hoy = new Date().toISOString().slice(0, 10);
  for (const e of lista) {
    const falta = ['regla', 'componente', 'selector', 'temas', 'caduca', 'porque']
      .concat(e.regla === 'color-contrast' ? ['ratioMinima'] : [])
      .filter((k) => !e[k]);
    if (falta.length) throw new Error(`axe-excepciones.json: a una excepción le falta ${falta.join(', ')}.`);
    if (e.tipo && !['violacion', 'incompleto'].includes(e.tipo)) throw new Error(`axe-excepciones.json: tipo «${e.tipo}» desconocido (violacion | incompleto).`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.caduca)) throw new Error(`axe-excepciones.json: caduca debe ser AAAA-MM-DD («${e.caduca}»).`);
    if (e.caduca < hoy) throw new Error(`axe-excepciones.json: la excepción de ${e.componente} (${e.selector}) caducó el ${e.caduca}.`);
    if (/^REVISAR/.test(e.porque)) throw new Error(`axe-excepciones.json: la excepción de ${e.componente} (${e.selector}) está sin revisar: su porqué aún dice REVISAR.`);
    if (String(e.porque).length < 40) throw new Error(`axe-excepciones.json: el porqué de ${e.componente} (${e.selector}) es demasiado corto para ser una revisión.`);
  }
  return lista;
}

/**
 * axe sobre la página. `donde(el)` dice a qué componente o página pertenece
 * un nodo. Devuelve los nodos de violations e incomplete, aplanados.
 */
export async function pasarAxe(page, { pagina = null } = {}) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(async ([etiquetas, pagina]) => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: etiquetas },
      resultTypes: ['violations', 'incomplete'],
    });
    const plano = (lista, tipo) => lista.flatMap((v) => v.nodes.map((n) => {
      const el = document.querySelector(n.target[0]);
      const sec = el && el.closest('[data-componente]');
      const check = [...n.any, ...n.all, ...n.none][0] || {};
      return {
        tipo, regla: v.id, impacto: v.impact,
        componente: pagina || (sec ? sec.dataset.componente : '(página)'),
        objetivo: n.target.join(' '),
        resumen: n.failureSummary || check.message || v.help,
        esperado: check.data && check.data.expectedContrastRatio ? parseFloat(check.data.expectedContrastRatio) : null,
      };
    }));
    return [...plano(r.violations, 'violacion'), ...plano(r.incomplete, 'incompleto')];
  }, [ETIQUETAS, pagina]);
}

/** Mide en píxeles los incompletos de contraste (in situ: añade `medida`). */
export async function medirIncompletos(page, nodos) {
  for (const n of nodos) {
    if (n.tipo !== 'incompleto' || n.regla !== 'color-contrast') continue;
    n.medida = await contrasteDeTexto(page, n.objetivo, { requerido: n.esperado });
  }
}

const ratioDe = (v) => (v.medida && v.medida.ratio !== undefined ? v.medida.ratio
  : Number((/contrast of ([\d.]+)/.exec(v.resumen) || [])[1] ?? 0));

/** ¿La cubre una excepción? Devuelve la excepción o null. */
export function excepcionPara(v, excepciones, tema, modo) {
  return excepciones.find((e) =>
    (e.tipo || 'violacion') === v.tipo &&
    e.regla === v.regla &&
    e.componente === v.componente &&
    v.objetivo.includes(e.selector) &&
    e.temas.includes(`${tema}/${modo}`) &&
    // La razón medida es un suelo: si empeora, deja de estar cubierta. Y un
    // incompleto de contraste además tiene que llegar al mínimo de WCAG: una
    // excepción no puede aceptar a sabiendas un texto que no se lee.
    (e.ratioMinima === undefined || ratioDe(v) >= e.ratioMinima) &&
    (v.tipo !== 'incompleto' || v.regla !== 'color-contrast' || (v.medida && !v.medida.error && v.medida.ratio >= v.medida.requerido))) || null;
}

/**
 * Lo que una persona tendría que registrar para aceptar los incompletos de
 * contraste que SÍ cumplen medidos en píxeles: agrupados por selector, con la
 * peor medida como suelo. Los que no cumplen no se proponen: se arreglan.
 */
export function proponer(sinCubrir, caduca) {
  const grupos = new Map();
  for (const v of sinCubrir) {
    if (v.tipo !== 'incompleto') continue;
    const mide = v.regla === 'color-contrast';
    if (mide && (!v.medida || v.medida.error || v.medida.ratio < v.medida.requerido)) continue;
    const k = `${v.regla}|${v.componente}|${v.objetivo}`;
    if (!grupos.has(k)) grupos.set(k, { tipo: 'incompleto', regla: v.regla, componente: v.componente, selector: v.objetivo, temas: new Set(), ratioMinima: mide ? Infinity : undefined, caduca, porque: mide ? '' : 'REVISAR: escribe aquí qué se comprobó y por qué cumple.', motivo: String(v.resumen).replace(/^Fix (any|all) of the following:\s*/, '') });
    const g = grupos.get(k);
    g.temas.add(`${v.tema}/${v.modo}`);
    if (mide) {
      g.ratioMinima = Math.min(g.ratioMinima, Math.floor(v.medida.ratio * 100) / 100);
      g.porque = `axe no resuelve el fondo (${String(v.resumen).replace(/^[\s\S]*?(due to |because )/, '').replace(/\.$/, '').trim()}); medido en píxeles, el texto contra el fondo real que tiene detrás da ≥ ${g.ratioMinima}:1 (mínimo ${v.medida.requerido}:1).`;
    }
  }
  return [...grupos.values()].map((g) => ({ ...g, temas: [...g.temas].sort() }));
}
