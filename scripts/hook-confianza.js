#!/usr/bin/env node
/**
 * SYX — Hook de confianza para Claude Code
 * ────────────────────────────────────────
 * Lo registra `.claude/settings.json` como hook PreToolUse de Edit, Write,
 * MultiEdit y NotebookEdit. Lee de stdin el JSON de la llamada, clasifica la
 * ruta con contracts/trust.json y:
 *   · `human`  bloquea (exit 2): stderr le llega a Claude como el motivo;
 *   · `pr`     deja pasar y recuerda que eso se entrega con propose.js;
 *   · `auto`   deja pasar sin decir nada.
 *
 * POR QUÉ EXISTE
 * Hasta la auditoría de octubre de 2026, trust.json solo lo respetaba quien
 * preguntaba a classify_change. Esto lo aplica en el momento en que se escribe,
 * que es el único en que no cuesta nada: después hay un diff que deshacer.
 *
 * LO QUE NO HACE, DICHO CLARO
 * Solo ve las herramientas de edición. Un `sed -i` por Bash no pasa por aquí:
 * el hook no es una frontera de seguridad, es una barandilla para el agente
 * que actúa de buena fe. La frontera está en el merge: el job Confianza de la
 * CI y la revisión de CODEOWNERS.
 *
 * CUANDO UNA PERSONA SÍ QUIERE QUE EL AGENTE ESCRIBA EN `human`
 * (una auditoría que ella dirige, por ejemplo), arranca Claude Code con
 * `SYX_HOOK_HUMANO=permitir`. Es una variable del proceso de Claude Code, no
 * algo que el agente pueda poner desde su shell: el hook hereda el entorno de
 * quien lo lanzó, no el de las órdenes que ejecuta el agente.
 *
 * QUÉ REPOSITORIO
 * El del FICHERO, no el de la sesión: se sube desde su carpeta hasta encontrar
 * contracts/trust.json. Así funciona en un worktree (donde
 * $CLAUDE_PROJECT_DIR sigue apuntando a la raíz original) y no opina sobre
 * ficheros de fuera de un repositorio SYX.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { clasificarRuta } = require('./lib/confianza');

/** La raíz SYX más cercana que contiene `abs`, o null. */
function raizDe(abs) {
  let dir = path.dirname(abs);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'contracts', 'trust.json'))) return dir;
    const arriba = path.dirname(dir);
    if (arriba === dir) return null;
    dir = arriba;
  }
}

function leerEntrada() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    return null;
  }
}

const entrada = leerEntrada();
if (!entrada) {
  // Se elige el lado que solo cuesta una espera: sin poder leer la llamada no
  // se sabe qué fichero toca, y dejarla pasar sería aprobar a ciegas.
  process.stderr.write('SYX: el hook de confianza no pudo leer la llamada (JSON inválido en stdin); se bloquea por prudencia.\n');
  process.exit(2);
}

const ti = entrada.tool_input || {};
const ruta = ti.file_path || ti.notebook_path;
if (!ruta) process.exit(0); // no es una escritura de fichero: no le toca

const abs = path.resolve(entrada.cwd || process.cwd(), ruta);
const raiz = raizDe(abs);
if (!raiz) process.exit(0); // fuera de un repositorio SYX: el contrato no habla de él

// El contrato del repositorio del fichero, no el de este script: en otro
// worktree puede haber cambiado.
let contrato;
try {
  contrato = JSON.parse(fs.readFileSync(path.join(raiz, 'contracts', 'trust.json'), 'utf8'));
} catch (e) {
  process.stderr.write(`SYX: no se pudo leer ${path.join(raiz, 'contracts', 'trust.json')}; se bloquea por prudencia.\n`);
  process.exit(2);
}

const c = clasificarRuta(abs, { raiz, contrato });
if (c.fuera) process.exit(0);

if (c.tier === 'human') {
  if (process.env.SYX_HOOK_HUMANO === 'permitir') process.exit(0);
  process.stderr.write(
    `SYX: ${c.path} es de nivel «${c.label}» en contracts/trust.json (${c.patron || 'por defecto'}).\n` +
    `${c.porque}\n` +
    `Un agente puede analizar y recomendar aquí, no escribir. Entrega el cambio como ` +
    `recomendación —el contenido completo y el porqué— para que lo aplique una persona.\n`
  );
  process.exit(2);
}

if (c.tier === 'pr') {
  const aviso =
    `SYX: ${c.path} es «${c.label}». Puedes escribirlo, pero no commitearlo a mano: ` +
    `cuando el cambio esté listo, entrégalo con \`node scripts/propose.js files <rutas…> --why "…"\` ` +
    `(o \`propose.js token\` para un token de componente), que compila, valida y deja rama con evidencia.`;
  process.stdout.write(JSON.stringify({
    systemMessage: aviso,
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: aviso },
  }));
}

process.exit(0);
