# Parche propuesto — plan de generación, fase 2: orden de lectura y foco de campo

Las tres correcciones tocan rutas «Solo humano» de `contracts/trust.json` (`scripts/`, `scss/themes/` y
`tests/`, este por defecto), así que llegan como parche para que lo aplique una persona.

## Qué
1. **`readAllScss` lee en un orden fijo** (`scripts/syx-validate.js`). Leía los `.scss` en el orden en que el
   disco los lista: NTFS ordena y ext4 no, así que regenerar en Windows cambiaba el orden de
   `contracts/token-usage-map.json` y `check:contratos` fallaba sin que nada hubiera cambiado. Ahora ordena
   por nombre (unidades de código, no `localeCompare`, para no depender del idioma del sistema).
2. **Caso de mutación `contratos-segun-el-disco`** (`tests/mutacion/casos/derivados.js` y el shim
   `tests/mutacion/readdir-al-reves.js`): carga un `readdirSync` que lista al revés y quita el `.sort()`.
   `check:contratos` tiene que pararlo, y lo para.
3. **Foco de campo de `syx-sketch` con la variante fuerte** (`scss/themes/syx-sketch/_theme.scss`):
   `--semantic-color-border-focus: var(--semantic-color-primary)` → `var(--semantic-color-primary-strong)`,
   como ya hacen los otros seis temas. Es el mismo escape que la fase 2a cerró en el anillo de foco.

## Medido antes de proponerlo (copia aparte, nunca en el repo)
- **Orden**: en la copia, con `readdirSync` al revés, `syx-validate --check` fallaba en tres contratos
  (`lint-contract.json`, `token-usage-map.json`, `validation-report.md`). Con el orden fijo pasa, y los
  contratos regenerados en Linux no cambian ni un byte: el orden nuevo coincide con el de la CI.
- **Foco de campo**, primario de `syx-sketch` cambiado por una marca hostil, fallos de `foco-de-campo` en
  `check:contraste` (claro y claro elegido, en las dos ramas):

  | Primario | Antes | Después |
  |---|---|---|
  | `#ffe600` amarillo | 4 (1,27:1) | 0 |
  | `#7fffd4` aguamarina | 4 | 0 |
  | `#39ff14` lima | 4 | 0 |
  | `#808080` gris | 0 | 0 |
  | `#ff0000` rojo | 0 | 0 |

  Con el azul real de `syx-sketch` el color no cambia a la vista: su luminosidad (0,498 en claro, 0,740 en
  oscuro) ya cae dentro de la franja de `-strong`.
- **Guardianes en la copia, con el parche**: lint, cadena, contratos, reglas, compilado, themes, plantilla,
  modo-claro, contraste, tintas-respaldo, tokens, tokens-json, registry, usage, mcp, colores, escáner, figma
  (tras `export:figma`), mixins, recuentos, evals, encoding, clasificación, codeowners, docs-componentes,
  vitrina, why-syx, pages, package y el resto de la cadena en verde. Mutación: los 10 casos de contraste y
  derivados, parados (el nuevo incluido).

## Lo que queda fuera, a propósito
Con las marcas hostiles siguen fallando 7 pares (`texto-sobre-primary`, `boton-relleno-primary`,
`pagina-activa`, `miga-activa`, `enlace-primario-hover`, `seleccion`, `celda-fija-de-tabla`; con rojo y
gris, también los rellenos de hover terciario y cuaternario). No son escapes: los siete leen la tinta
`--semantic-color-on-primary` sobre el relleno de marca, y una tinta fija no sirve para cualquier marca.
Al ponerla a mano aparecen otros pares (hover, selección, marca del check) y con rojo y gris ni la tinta oscura
del tema llega a 4,5:1. Eso es la **fase 3** (tinta calculada al compilar cada tema), no un parche de la fase 2.

## Aplicar (PowerShell 5, desde la raíz del repo, en esta rama)

~~~powershell
$md = Get-Content -Raw -Encoding UTF8 contracts\propuestas\fase2-orden-foco-parche.md
$diff = [regex]::Match($md, '(?s)~~~diff\r?\n(.*?)\r?\n~~~\s*$').Groups[1].Value -replace "`r`n", "`n"
[IO.File]::WriteAllText("$PWD\parche.diff", $diff + "`n", (New-Object Text.UTF8Encoding $false))
git apply --check parche.diff
git apply parche.diff
Remove-Item parche.diff
npm.cmd run build:css
npm.cmd run validate:report
npm.cmd run export:figma
node scripts/check-mutacion.js --solo contratos-segun-el-disco,contraste-primario-casi-blanco
git rm contracts/propuestas/fase2-orden-foco-parche.md
~~~

Regenera `css/styles-theme-syx-sketch.css`, `contracts/resolved-tokens.json` y
`contracts/figma/syx-sketch.figma.json`. Si tras regenerar en Windows `token-usage-map.json` sale cambiado,
el parche no está aplicado: es justo lo que corrige.

## Cómo revertir
`git revert` del commit que lo aplique.

## Diff

~~~diff
diff --git a/scripts/syx-validate.js b/scripts/syx-validate.js
index ad02ae4..03786e4 100644
--- a/scripts/syx-validate.js
+++ b/scripts/syx-validate.js
@@ -63,7 +63,12 @@ function escribir(fichero, contenido) {
 function readAllScss(dir) {
   const results = [];
   if (!fs.existsSync(dir)) return results;
-  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
+  // Ordenado por nombre (unidades de código, no localeCompare): el disco no
+  // lista en un orden fijo (NTFS ordena, ext4 no) y el orden de lectura llega
+  // a token-usage-map.json, lint-contract.json y validation-report.md.
+  const entradas = fs.readdirSync(dir, { withFileTypes: true })
+    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
+  for (const entry of entradas) {
     const fp = path.join(dir, entry.name);
     if (entry.isDirectory()) results.push(...readAllScss(fp));
     else if (entry.name.endsWith('.scss'))
diff --git a/scss/themes/syx-sketch/_theme.scss b/scss/themes/syx-sketch/_theme.scss
index b5154e3..ada0913 100644
--- a/scss/themes/syx-sketch/_theme.scss
+++ b/scss/themes/syx-sketch/_theme.scss
@@ -441,7 +441,10 @@
 
     // Trazo — tres pesos. `strong` es tinta pura: es el borde
     // "dibujado" y también el color de la sombra dura.
-    --semantic-color-border-focus: var(--semantic-color-primary);
+    // Foco del campo: la variante fuerte, como en los otros seis temas. Con
+    // el relleno de marca, una marca clara (amarillo, aguamarina, lima) dejaba
+    // el borde de foco en 1,27:1 sobre el papel (WCAG 1.4.11 pide 3:1).
+    --semantic-color-border-focus: var(--semantic-color-primary-strong);
 
     // Enlaces — azul-600 (8.65:1) en lugar del azul de marca:
     // el texto corrido necesita más contraste que un botón.
diff --git a/tests/mutacion/casos/derivados.js b/tests/mutacion/casos/derivados.js
index 27aabdc..648c5c9 100644
--- a/tests/mutacion/casos/derivados.js
+++ b/tests/mutacion/casos/derivados.js
@@ -6,6 +6,8 @@
 
 'use strict';
 
+const path = require('path');
+
 module.exports = [
   {
     id: 'css-editado-a-mano',
@@ -38,6 +40,20 @@ module.exports = [
     espera: /lint-contract\.json/,
     mutar: (t) => t.json('contracts/lint-contract.json', (c) => { c.stats.legacyRuntime = 0; }),
   },
+  // Regenerar en Windows cambiaba el orden de token-usage-map.json y
+  // check:contratos fallaba sin que nada hubiera cambiado: el validador leía
+  // los .scss en el orden en que el disco los lista. Aquí el disco lista al
+  // revés; con el orden fijo da igual, sin él el guardián lo ve.
+  {
+    id: 'contratos-segun-el-disco',
+    regresion: 'el validador lee los .scss en el orden del disco (sin ordenar)',
+    guardian: 'check:contratos',
+    comando: ['node', 'scripts/syx-validate.js', '--check'],
+    // Entre comillas: en Windows la copia puede ir en una ruta con espacios.
+    env: (t) => ({ NODE_OPTIONS: `--require ${JSON.stringify(path.join(t.dir, 'tests/mutacion/readdir-al-reves.js'))}` }),
+    espera: /token-usage-map\.json/,
+    mutar: (t) => t.reemplazar('scripts/syx-validate.js', /\n\s*\.sort\(\(a, b\) => \(a\.name < b\.name[^\n]*\);/, ';'),
+  },
   {
     id: 'figma-fichero-de-mas',
     regresion: 'un fichero en contracts/figma/ que el exportador no genera',
diff --git a/tests/mutacion/readdir-al-reves.js b/tests/mutacion/readdir-al-reves.js
new file mode 100644
index 0000000..94524de
--- /dev/null
+++ b/tests/mutacion/readdir-al-reves.js
@@ -0,0 +1,10 @@
+/**
+ * Simula un sistema de ficheros que lista en otro orden (NTFS ordena, ext4
+ * no): `readdirSync` devuelve las entradas al revés. Lo carga un caso de
+ * mutación con NODE_OPTIONS=--require; un derivado que dependa del orden en
+ * que el disco lista los ficheros cambia y su guardián lo ve.
+ */
+'use strict';
+const fs = require('fs');
+const original = fs.readdirSync;
+fs.readdirSync = function (...args) { return original.apply(this, args).slice().reverse(); };
~~~
