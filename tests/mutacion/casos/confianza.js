/**
 * Regresiones en la capa de confianza: que un agente amplíe sus propios
 * permisos, o que un modo prometa escribir donde el contrato no le deja.
 */

'use strict';

const sacar = (lista, ruta) => {
  const i = lista.indexOf(ruta);
  if (i === -1) throw new Error(`trust.json ya no tiene ${ruta} en human`);
  lista.splice(i, 1);
};

module.exports = [
  {
    id: 'trust-scripts-auto',
    regresion: 'trust.json: `scripts/` bajado a auto',
    guardian: 'check:clasificacion',
    seEscapaba: true,
    comando: ['node', 'scripts/check-clasificacion.js'],
    espera: /scripts\/\S* → auto/,
    mutar: (t) => t.json('contracts/trust.json', (c) => { sacar(c.tiers.human.paths, 'scripts/'); c.tiers.auto.paths.push('scripts/'); }),
  },
  {
    id: 'trust-sin-gobernanza',
    regresion: 'trust.json sin la constitución ni governance/',
    guardian: 'check:clasificacion',
    seEscapaba: true,
    comando: ['node', 'scripts/check-clasificacion.js'],
    espera: /mind-system\/(constitution\.md|governance)/,
    mutar: (t) => t.json('contracts/trust.json', (c) => {
      sacar(c.tiers.human.paths, 'mind-system/governance/');
      sacar(c.tiers.human.paths, 'mind-system/constitution.md');
    }),
  },
  {
    id: 'trust-scripts-auto-en-pr',
    regresion: 'una PR que baja `scripts/` a auto en su propio trust.json',
    guardian: 'check-confianza (diff)',
    seEscapaba: true,
    necesita: ['git'],
    env: () => ({ SYX_BASE: 'base', GITHUB_ACTIONS: '' }),
    comando: ['node', 'scripts/check-confianza.js'],
    espera: /contracts\/trust\.json/,
    mutar: (t) => t.json('contracts/trust.json', (c) => { sacar(c.tiers.human.paths, 'scripts/'); c.tiers.auto.paths.push('scripts/'); }),
  },
  {
    id: 'modo-escribe-temas',
    regresion: 'un modo que se da escritura en `scss/themes/`',
    guardian: 'check:modos',
    seEscapaba: true,
    comando: ['node', 'scripts/check-modos.js'],
    espera: /scss\/themes\//,
    mutar: (t) => t.reemplazar('_agents/modes/theme.md', '· **Writes:** —', '· **Writes:** `scss/themes/`'),
  },
];
