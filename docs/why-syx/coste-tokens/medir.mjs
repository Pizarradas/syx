#!/usr/bin/env node
/**
 * SYX — El coste en tokens de construir lo mismo con cada sistema
 * ──────────────────────────────────────────────────────────────
 * Mide dos cosas para la UI de referencia de LEEME.md:
 *
 *   contexto  lo que un agente lee: la página oficial de instalación y la de
 *             cada pieza (botón, campo con error, tarjeta, diálogo), tal como
 *             la sirve cada sistema (contexto.json)
 *   salida    lo que el agente escribe: ui/<sistema>.*
 *
 * Cuenta con el endpoint count_tokens de Anthropic (el tokenizador de Claude),
 * con el modelo de MODELO. Cada texto va como único mensaje de usuario; al
 * resultado se le resta el envoltorio del mensaje, medido con un texto de un
 * solo token ("a"), así que la cifra es la del texto (±1).
 *
 * Escribe medicion.json: cada fuente con sus bytes, su sha256 y sus tokens,
 * y los totales por sistema. scripts/build-why-syx.js lo pinta en la página.
 *
 * Uso (necesita ANTHROPIC_API_KEY u otra credencial que lea el SDK):
 *   cd docs/why-syx/coste-tokens && npm install && npm run medir
 */

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELO = 'claude-opus-5-5';
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');
const fuentes = JSON.parse(readFileSync(join(AQUI, 'contexto.json'), 'utf8'));
const { roles } = fuentes._meta;
const syx = createRequire(join(RAIZ, 'package.json'))(RAIZ);

const client = new Anthropic();

async function leer(fuente) {
  if (fuente.startsWith('local:')) return readFileSync(join(RAIZ, fuente.slice(6)), 'utf8');
  // Lo mismo que devuelve la herramienta MCP get_component.
  if (fuente.startsWith('syx:')) return JSON.stringify(syx.getComponent({ name: fuente.slice(4) }), null, 2);
  const r = await fetch(fuente, { headers: { 'user-agent': 'syx-why-coste-tokens' } });
  if (!r.ok) throw new Error(`${fuente} → HTTP ${r.status}`);
  const tipo = r.headers.get('content-type') || '';
  if (tipo.includes('text/html')) throw new Error(`${fuente} sirve HTML, no la fuente en texto`);
  return r.text();
}

async function contar(texto) {
  const r = await client.messages.countTokens({ model: MODELO, messages: [{ role: 'user', content: texto }] });
  return r.input_tokens;
}

async function main() {
  const envoltorio = (await contar('a')) - 1;
  const filas = [];
  const contexto = {};
  for (const [id, porRol] of Object.entries(fuentes.sistemas)) {
    contexto[id] = { total: 0 };
    for (const rol of roles) {
      const fuente = porRol[rol];
      if (!fuente) { contexto[id][rol] = null; continue; }
      const texto = await leer(fuente);
      const tokens = (await contar(texto)) - envoltorio;
      contexto[id][rol] = tokens;
      contexto[id].total += tokens;
      filas.push({ sistema: id, rol, fuente, bytes: Buffer.byteLength(texto), sha256: createHash('sha256').update(texto).digest('hex'), tokens });
      console.log(`   ${id.padEnd(10)} ${rol.padEnd(7)} ${String(tokens).padStart(7)}  ${fuente}`);
    }
  }
  const salida = {};
  for (const [id, fichero] of Object.entries(fuentes.salida)) {
    const texto = readFileSync(join(AQUI, fichero), 'utf8');
    salida[id] = (await contar(texto)) - envoltorio;
    filas.push({ sistema: id, rol: 'salida', fuente: fichero, bytes: Buffer.byteLength(texto), sha256: createHash('sha256').update(texto).digest('hex'), tokens: salida[id] });
    console.log(`   ${id.padEnd(10)} salida  ${String(salida[id]).padStart(7)}  ${fichero}`);
  }
  const medicion = {
    _nota: 'Generado por medir.mjs. No se edita a mano.',
    medido: new Date().toISOString().slice(0, 10),
    modelo: MODELO,
    envoltorio,
    contexto,
    salida,
    fuentes: filas,
  };
  writeFileSync(join(AQUI, 'medicion.json'), JSON.stringify(medicion, null, 2) + '\n');
  console.log(`\n✓ medicion.json — ${filas.length} textos contados con ${MODELO}`);
}

main().catch((e) => {
  if (e instanceof Anthropic.AuthenticationError) console.error('✗ Sin credenciales válidas: exporta ANTHROPIC_API_KEY.');
  else if (e instanceof Anthropic.RateLimitError) console.error('✗ Límite de peticiones: vuelve a intentarlo en un minuto.');
  else if (e instanceof Anthropic.APIConnectionError) console.error(`✗ Sin conexión con la API: ${e.message}`);
  else console.error(`✗ ${e.message}`);
  // exitCode y no exit(): en Windows, salir con conexiones abiertas hace que
  // libuv aborte (UV_HANDLE_CLOSING) después del mensaje.
  process.exitCode = 1;
});
