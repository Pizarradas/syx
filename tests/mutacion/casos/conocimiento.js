/**
 * Regresiones en el córtex (mind-system/knowledges/): lo que un agente lee
 * antes de escribir. Un módulo que nadie carga no se abre nunca; un token
 * citado que no existe se copia tal cual al código.
 */

'use strict';

const CONOCIMIENTO = ['node', 'scripts/check-conocimiento.js'];

module.exports = [
  {
    id: 'conocimiento-huerfano',
    regresion: 'un módulo de conocimiento que ningún modo carga',
    guardian: 'check:conocimiento',
    comando: CONOCIMIENTO,
    espera: /ux\/heuristicas-olvidadas\.md/,
    mutar: (t) => t.escribir('mind-system/knowledges/ux/heuristicas-olvidadas.md',
      '# Heurísticas olvidadas\n\nUn módulo nuevo que nadie enlazó desde ningún modo.\n'),
  },
  {
    id: 'conocimiento-token-fantasma',
    regresion: 'un token fantasma citado en el córtex',
    guardian: 'check:conocimiento',
    seEscapaba: true,
    comando: CONOCIMIENTO,
    espera: /--semantic-color-surface-elevada/,
    mutar: (t) => t.editar('mind-system/knowledges/syx/token-system.md',
      (s) => `${s.trimEnd()}\n\nPara las superficies elevadas, usa \`--semantic-color-surface-elevada\`.\n`),
  },
  {
    id: 'conocimiento-clase-fantasma',
    regresion: 'la gobernanza de ATLAS vuelve a citar atom-headline, que SYX no tiene',
    guardian: 'check:conocimiento',
    comando: ['node', 'scripts/check-conocimiento.js'],
    espera: /ninguna clase de SYX citada es un fantasma[\s\S]*atom-headline--3xl/,
    mutar: (t) => t.reemplazar('mind-system/governance/01-invocation.md', 'atom-title--h1 / --h2', 'atom-headline--3xl / --xl'),
  },
];
