#!/usr/bin/env node
/**
 * SYX — Exportador a Figma
 * ────────────────────────
 * Escribe en contracts/figma/ lo que hace falta para levantar la biblioteca de
 * SYX dentro de Figma: las colecciones de variables con sus dos modos, y los
 * componentes con la propiedad de nodo que le toca a cada token.
 *
 * POR QUÉ NO VALE EL EXPORTADOR DTCG QUE YA HAY
 * Porque DTCG describe el sistema y Figma necesita ejecutarlo. Un fichero DTCG
 * con `oklch(0.498 0.282 266.24)` se importa como texto, no como color: las
 * variables COLOR de Figma guardan `{r,g,b,a}` numéricos. La conversión vive en
 * lib/figma.js, la misma que responde `get_figma_spec`, para que la variable
 * que se importa y el valor que el agente pinta no puedan divergir.
 *
 * POR QUÉ UN FICHERO POR TEMA Y NO UNO CON CATORCE MODOS
 * Porque los modos de una colección están limitados por plan —cuatro en
 * Professional—, y un único fichero con los siete temas por dos modos sería
 * inservible en la mayoría de las cuentas. Un tema es una biblioteca; sus dos
 * modos son claro y oscuro, que es la dimensión que Figma sí resuelve sola.
 *
 * POR QUÉ NO SE EXPORTAN LOS PRIMITIVOS
 * Por R01. En el CSS un componente no puede leer un `--primitive-*`: tiene que
 * pasar por la capa semántica. Subir los primitivos a Figma como variables
 * elegibles abriría en el diseño exactamente el atajo que el contrato cierra en
 * el código, y entonces la desviación entraría por el otro lado.
 *
 * Uso:
 *   node scripts/export-figma.js                 genera todos los temas
 *   node scripts/export-figma.js --theme syx-sketch
 *   node scripts/export-figma.js --check         falla si está desfasado
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'contracts', 'figma');
const { crearConsulta } = require('./lib/consulta');
const figma = require('./lib/figma');

const syx = crearConsulta({ root: ROOT });

// Las capas que suben. El resto —primitive por R01, y las familias sueltas que
// R07 ya señala como legado— se cuentan y se dicen, pero no se exportan.
const CAPAS = {
  semantic: 'SYX · Semantic',
  component: 'SYX · Component',
};

// ─── Variables ───────────────────────────────────────────────────────────────

function variables(tema) {
  const modos = ['light', 'dark'];
  const mapa = Object.fromEntries(modos.map((m) => [m, syx.listTokens({ theme: tema, mode: m }).tokens]));
  const colecciones = new Map(Object.keys(CAPAS).map((c) => [c, []]));
  const omitidos = [];
  const fuera = {};

  for (const token of Object.keys(mapa.light)) {
    const capa = figma.capaDe(token);
    if (!CAPAS[capa]) { fuera[capa] = (fuera[capa] || 0) + 1; continue; }

    const porModo = modos.map((m) => figma.aVariable(token, mapa[m][token]));

    // Basta con que un modo no se pueda traducir para que la variable no se
    // pueda crear: una variable con un solo modo relleno pinta transparente en
    // el otro, que es peor que no tenerla.
    const roto = porModo.find((v) => v.omitido);
    if (roto) { omitidos.push({ token, motivo: roto.omitido }); continue; }
    if (porModo[0].tipo !== porModo[1].tipo) {
      omitidos.push({ token, motivo: `el mismo token da ${porModo[0].tipo} en claro y ${porModo[1].tipo} en oscuro` });
      continue;
    }

    const v = {
      name: figma.aNombreFigma(token),
      type: porModo[0].tipo,
      token,
      valuesByMode: Object.fromEntries(modos.map((m, i) => [m, porModo[i].valor])),
    };
    if (porModo[0].hex) {
      v.hexByMode = Object.fromEntries(modos.map((m, i) => [m, porModo[i].hex]));
    }
    colecciones.get(capa).push(v);
  }

  return {
    collections: [...colecciones.entries()].map(([capa, vars]) => ({
      name: CAPAS[capa],
      modes: modos,
      variables: vars.sort((a, b) => a.name.localeCompare(b.name)),
    })),
    omitidos: omitidos.sort((a, b) => a.token.localeCompare(b.token)),
    fuera,
  };
}

// ─── Componentes ─────────────────────────────────────────────────────────────
// Se consulta `getFigmaSpec` en los dos modos y se funden, porque un componente
// en Figma no es de un modo: es una estructura cuyas propiedades se ATAN a
// variables, y la variable es la que sabe cuánto vale en cada modo. Los valores
// se conservan de todas formas, para poder comprobar sin abrir Figma que lo que
// se ató es lo que se quería atar.

function componentes(tema) {
  const lista = syx.listComponents().components.map((c) => c.name);
  return lista.map((nombre) => {
    const claro = syx.getFigmaSpec({ component: nombre, theme: tema, mode: 'light' });
    const oscuro = syx.getFigmaSpec({ component: nombre, theme: tema, mode: 'dark' });
    const porToken = new Map(oscuro.propiedades.map((p) => [p.token, p]));

    return {
      component: claro.component,
      layer: claro.layer,
      figmaName: claro.figmaName,
      clases: claro.clases,
      composedOf: claro.composedOf,
      variantes: claro.variantes,
      propiedades: claro.propiedades.map((p) => ({
        token: p.token,
        variable: p.variable,
        propiedad: p.propiedad,
        tipo: p.tipo,
        variante: p.variante,
        estado: p.estado,
        valores: {
          light: p.valor,
          dark: porToken.has(p.token) ? porToken.get(p.token).valor : null,
        },
      })),
      sinPropiedad: claro.sinPropiedad,
      sinTraducir: claro.sinTraducir,
    };
  });
}

// ─── Escritura ───────────────────────────────────────────────────────────────

function construir(tema) {
  const vars = variables(tema);
  const comps = componentes(tema);
  const cuenta = vars.collections.reduce((s, c) => s + c.variables.length, 0);

  return {
    _meta: {
      generator: 'scripts/export-figma.js',
      version: syx.version,
      theme: tema,
      modes: ['light', 'dark'],
      remPx: figma.RAIZ_PX,
      description:
        'SYX Design System en la forma que entiende la Plugin API de Figma. Generado desde el CSS compilado; no editar a mano.',
      note:
        'Los primitivos no suben: R01 prohíbe que un componente los lea, y en Figma serían un atajo elegible. ' +
        'Las propiedades de los componentes deben ATARSE a las variables de las colecciones, no copiarse: ' +
        'copiar el valor pierde el modo oscuro.',
      inferencia:
        'Clases, modificadores y tokens vienen del registro, contrastado contra el CSS compilado. ' +
        'El reparto por variante y por estado se deduce del nombre del token.',
      cuentas: {
        variables: cuenta,
        omitidas: vars.omitidos.length,
        fueraDeAlcance: vars.fuera,
        componentes: comps.length,
      },
    },
    collections: vars.collections,
    components: comps,
    omitidos: vars.omitidos,
  };
}

const fichero = (tema) => path.join(OUT_DIR, `${tema}.figma.json`);
const serializar = (o) => JSON.stringify(o, null, 2) + '\n';

function main() {
  const check = process.argv.includes('--check');
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
  const temas = arg('--theme') ? [arg('--theme')] : syx.listThemes().themes;

  console.log('\n── EXPORTACIÓN A FIGMA ─────────────────────────────────────────\n');

  let fallos = 0;
  const total = { variables: 0, omitidas: 0 };

  if (!check) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const tema of temas) {
    const salida = construir(tema);
    total.variables += salida._meta.cuentas.variables;
    total.omitidas += salida._meta.cuentas.omitidas;

    if (check) {
      // Se compara el contenido sin la versión: subir de versión no desfasa una
      // exportación cuyos valores no han cambiado, y hacer fallar el guardián
      // por eso enseñaría a ignorarlo.
      const f = fichero(tema);
      if (!fs.existsSync(f)) {
        console.log(`❌ ${tema}: falta ${path.relative(ROOT, f)}`);
        fallos++;
        continue;
      }
      const previo = JSON.parse(fs.readFileSync(f, 'utf8'));
      const limpiar = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c._meta.version; return serializar(c); };
      if (limpiar(previo) !== limpiar(salida)) {
        console.log(`❌ ${tema}: la exportación está desfasada. Ejecuta: npm run export:figma`);
        fallos++;
      } else {
        console.log(`✅ ${tema}`);
      }
      continue;
    }

    fs.writeFileSync(fichero(tema), serializar(salida), 'utf8');
    const c = salida._meta.cuentas;
    console.log(
      `   ${tema.padEnd(12)} ${String(c.variables).padStart(4)} variables · ` +
      `${String(c.componentes).padStart(2)} componentes · ${String(c.omitidas).padStart(3)} omitidas`
    );
  }

  if (check) {
    console.log(`\n   ${temas.length - fallos}/${temas.length} temas al día\n`);
    process.exit(fallos ? 1 : 0);
  }

  console.log(`\n   ${temas.length} fichero(s) en contracts/figma/`);
  console.log(`   ${total.variables} variables · ${total.omitidas} omitidas con motivo`);
  console.log('\n   Las omitidas no son un fallo: son las expresiones CSS, las unidades');
  console.log('   relativas y las sombras, que Figma no guarda en una variable. Están');
  console.log('   listadas una a una en el campo `omitidos` de cada fichero.\n');
}

if (require.main === module) main();

module.exports = { construir, fichero };
