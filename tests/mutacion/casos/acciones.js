/**
 * Regresiones en los workflows: lo que check:acciones debe parar. Ninguna
 * necesita compilar: el guardián lee .github/.
 */

'use strict';

const ACCIONES = ['node', 'scripts/check-acciones.js'];

module.exports = [
  {
    id: 'accion-por-etiqueta',
    regresion: 'una action de ci.yml vuelve a ir por etiqueta (@v4)',
    guardian: 'check:acciones',
    comando: ACCIONES,
    espera: /ci\.yml:\d+ actions\/checkout@v4 no va fijada a un SHA/,
    mutar: (t) => t.reemplazar('.github/workflows/ci.yml',
      /actions\/checkout@[0-9a-f]{40} # v[\d.]+/,
      'actions/checkout@v4'),
  },
  {
    id: 'publicar-con-dependencias',
    regresion: 'el trabajo que publica en npm vuelve a instalar las dependencias',
    guardian: 'check:acciones',
    comando: ACCIONES,
    espera: /el trabajo `npm` instala dependencias/,
    mutar: (t) => t.reemplazar('.github/workflows/release.yml',
      '      - name: Descargar de la release el .tgz que se va a publicar',
      '      - run: npm ci\n\n      - name: Descargar de la release el .tgz que se va a publicar'),
  },
  {
    id: 'aprobacion-de-cualquiera',
    regresion: 'confianza.yml vuelve a aceptar la etiqueta la ponga quien la ponga',
    guardian: 'check:acciones',
    comando: ACCIONES,
    espera: /confianza\.yml: no comprueba que `aprobado-humano` la pusiera una persona/,
    mutar: (t) => t.reemplazar('.github/workflows/confianza.yml', '[ "$TIPO" = "User" ] && ', ''),
  },
];
