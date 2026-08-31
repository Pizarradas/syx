#!/usr/bin/env node
/**
 * SYX — El CSS commiteado es el que sale de compilar
 * ──────────────────────────────────────────────────
 * Compila y comprueba que no cambia nada. Si cambia, lo que hay en el
 * repositorio no es lo que produce el código: alguien commiteó una compilación
 * distinta de la que declara `build:css`.
 *
 * POR QUÉ IMPORTA AQUÍ MÁS QUE EN OTROS SITIOS
 * Porque `css/` se versiona a propósito —es la Opción A del README, enlazar la
 * hoja sin instalar nada— y porque medio sistema se mide contra ese CSS: el
 * registro de componentes lo usa de árbitro, el escáner decide con él qué clase
 * existe, y el snapshot de tokens sale de ahí. Un CSS commiteado que no
 * corresponde al SCSS no rompe la compilación: hace que todos los guardianes
 * midan contra un mundo que ya no existe. Ya pasó una vez, con una copia de
 * trabajo minificada mientras `build:css` emite expandido.
 *
 * LA MARCA DE TIEMPO NO CUENTA
 * `contracts/resolved-tokens.json` lleva un `generatedAt` que cambia en cada
 * compilación por diseño. Que el contenido coincida ya lo comprueba
 * `check:tokens`; aquí solo se ignora ese campo, y si el fichero difiere en
 * algo MÁS que en él, se denuncia como cualquier otro.
 *
 * SOBRE MEDIR CON EL ÁRBOL SUCIO
 * No se puede: el trabajo sin commitear es indistinguible de la desviación que
 * se busca. En ese caso avisa y sale con 0, para no dar un falso rojo a quien
 * esté a mitad de algo. Con `--strict` —que es como lo llama la integración
 * continua, donde el árbol SIEMPRE está limpio— no poder medir es un fallo.
 *
 * Uso: node scripts/check-limpio.js [--strict]
 */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const strict = process.argv.includes('--strict');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
// `git status --porcelain` empieza cada línea con dos columnas de estado y un
// espacio, y la primera suele ser un espacio: recortar la salida entera se
// come ese espacio y deja el primer fichero sin su primera letra
// («ontracts/resolved-tokens.json»). Lo encontró la propia prueba de este
// guardián, que denunciaba un repositorio limpio.
const estado = () =>
  execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => l.slice(3).trim());

console.log('\n── EL CSS COMMITEADO ES EL COMPILADO ───────────────────────────\n');

const sucioAntes = estado();
if (sucioAntes.length) {
  console.log('⚠️  No se puede medir: hay cambios sin commitear, y el trabajo a medias');
  console.log('   es indistinguible de una desviación de la compilación.\n');
  for (const l of sucioAntes.slice(0, 8)) console.log(`     ${l}`);
  console.log('');
  process.exit(strict ? 1 : 0);
}

try {
  execFileSync('npm', ['run', 'build:css'], { cwd: ROOT, stdio: 'ignore' });
} catch (e) {
  console.log(`❌ La compilación falla:\n${(e.stdout || e.message).toString().split('\n').slice(-15).join('\n')}\n`);
  process.exit(1);
}

const cambiados = estado();

// El snapshot cambia siempre por su marca de tiempo; solo cuenta si difiere en
// algo más.
const soloLaMarca = (rel) => {
  const diff = git('diff', '--unified=0', '--', rel)
    .split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^[+-][+-]/.test(l));
  return diff.length > 0 && diff.every((l) => l.includes('"generatedAt"'));
};

const reales = cambiados.filter((rel) => !(rel === 'contracts/resolved-tokens.json' && soloLaMarca(rel)));

if (!reales.length) {
  git('checkout', '--', '.');
  console.log('✅ Compilar no cambia nada: lo que está commiteado es lo que produce el código.\n');
  process.exit(0);
}

console.log(`❌ Compilar cambia ${reales.length} fichero(s). Lo commiteado no sale de este SCSS:\n`);
for (const rel of reales.slice(0, 15)) {
  const stat = git('diff', '--numstat', '--', rel).split('\t');
  console.log(`   · ${rel}   +${stat[0] || '?'} −${stat[1] || '?'}`);
}
if (reales.length > 15) console.log(`   … y ${reales.length - 15} más`);
console.log('\n   Ejecuta `npm run build` y commitea el resultado.\n');
git('checkout', '--', '.');
process.exit(1);
