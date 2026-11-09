# Parche (solo humano) · `check:compilado` rechaza la proporción por padding

Rutas: `scripts/check-compilado.js` y `tests/mutacion/casos/reglas.js`. Son de nivel solo humano, así que van como parche para que lo aplique una persona.

## Qué
`check:compilado` falla si el CSS que se entrega tiene un `padding` vertical en % (`padding`, `-top`, `-bottom`, `-block`, `-block-start`, `-block-end`) fuera de `scss/site/`. Ese era el truco de `height: 0` + padding que la #30 sustituyó por `aspect-ratio()`. Va sobre lo emitido: lo caza aunque venga de un mixin, de un `@each` o de una interpolación.

## Por qué en `check:compilado` y no en un guardián nuevo
Ya está en `npm run check` y en la CI, y tiene casos de mutación. No hace falta tocar `package.json` ni la cadena.

## Medido (en una copia, nunca en el repo)
- Sobre `main` (`79fdd21`): en verde (8 puntos de entrada, 40 096 declaraciones).
- Con el `_media.scss` de antes de la #30: 9 fallos (5 de `syx-embed` y 4 de `syx-map`).
- Caso de mutación nuevo `compilado-aspecto-padding`: parado (`check-mutacion.js --solo`).
- Sin excepción en línea: `syx-allow` solo admite ids de `contracts/rules.json` (`syx-validate` marca `aspecto` como directiva mal formada), y todo el soporte mínimo tiene `aspect-ratio`.

## Cómo aplicarlo (PowerShell, en la raíz del repo, con `main` actualizado)
~~~powershell
git checkout -b fix/aspecto-guardian
git apply --check contracts\propuestas\aspecto-guardian.diff
git apply contracts\propuestas\aspecto-guardian.diff
npm.cmd run check:compilado
node scripts/check-mutacion.js --solo compilado-aspecto-padding
~~~
El diff está en `contracts/propuestas/aspecto-guardian.diff` (60 líneas); se copia abajo para revisarlo.

## Cómo revertir
`git revert` del commit que lo aplique. No genera ficheros ni toca el CSS.

~~~diff
diff --git a/scripts/check-compilado.js b/scripts/check-compilado.js
index e9dcf0f..10c14ce 100644
--- a/scripts/check-compilado.js
+++ b/scripts/check-compilado.js
@@ -12,7 +12,8 @@
  * el CSS emitido son `position: sticky`, `transition: …`, `!important`…
  *
  * Así que esto compila cada punto de entrada CON MAPA DE FUENTES y aplica
- * R01, R02, R03, R04 y R11 a cada declaración emitida, con los mismos
+ * R01, R02, R03, R04 y R11 a cada declaración emitida (y rechaza la
+ * proporción por padding en %, que sustituye aspect-ratio()), con los mismos
  * comparadores del motor (lib/rules.js, leídos de contracts/rules.json). Los
  * permisos siguen siendo los del contrato y se deciden en el ORIGEN de la
  * declaración, que da el mapa: una `transition` que escribe el mixin
@@ -86,6 +87,14 @@ const selectorDe = (nodo) => {
 const CAPA_COMPONENTE = /(^|\.)syx\.(atoms|molecules|organisms)$/;
 const CAPA_ALTA = /^--(primitive|semantic|theme)-/;
 const RUTAS_PR = /^scss\/(atoms|molecules|organisms|layout|utilities|pages|abstracts\/tokens\/components)\//;
+// Proporción por padding: `height: 0` + un padding vertical en % (que se
+// calcula sobre el ANCHO) es el truco anterior a `aspect-ratio`. SYX lo
+// retiró en la 5.1 (PR #30) y el mixin aspect-ratio() lo sustituye. Sin
+// excepción en línea: todo el soporte mínimo de SYX tiene aspect-ratio (y
+// syx-allow solo admite ids de contracts/rules.json). La capa del sitio queda
+// fuera, como en R11.
+const PADDING_VERTICAL = /^padding(-(top|bottom|block|block-start|block-end))?$/;
+const PORCENTAJE = /(^|[\s(])-?[\d.]+%/;
 
 const fallos = [];
 let declaraciones = 0;
@@ -111,6 +120,11 @@ for (const entrada of entradas) {
       fallos.push({ entrada, regla: 'capa', motivo: `${decl.prop} se declara fuera de su capa`, donde: `${capaDe(decl)} ${selectorDe(decl)}`, origen: `${origen}:${o.line}` });
     }
 
+    if (origen && PADDING_VERTICAL.test(decl.prop) && PORCENTAJE.test(decl.value)
+      && !origen.startsWith('scss/site/')) {
+      fallos.push({ entrada, regla: 'aspecto', motivo: `${decl.prop}: ${decl.value} es una proporción por padding; usa @include aspect-ratio(ancho, alto)`, donde: `${capaDe(decl)} ${selectorDe(decl)}`, origen: `${origen}:${o.line}` });
+    }
+
     // El nodo emitido, con lo que el motor necesita ver.
     const nodo = { type: 'decl', prop: decl.prop, value: decl.value, important: decl.important, parent: null };
     for (const regla of reglas) {
diff --git a/tests/mutacion/casos/reglas.js b/tests/mutacion/casos/reglas.js
index 32465d6..36ec0ff 100644
--- a/tests/mutacion/casos/reglas.js
+++ b/tests/mutacion/casos/reglas.js
@@ -123,6 +123,14 @@ module.exports = [
   // Auditoría 2026-10 II: los ocho pasaban toda la cadena. check:compilado
   // aplica las reglas a lo que Sass emite y decide el permiso por el origen
   // de cada declaración (mapa de fuentes).
+  {
+    id: 'compilado-aspecto-padding',
+    regresion: 'una utilidad vuelve al truco de height 0 + padding-block-end en % para fijar la proporción',
+    guardian: 'check:compilado (aspecto)',
+    comando: COMPILADO,
+    espera: /aspecto scss\/utilities\/_media\.scss/,
+    mutar: (t) => t.reemplazar('scss/utilities/_media.scss', '  &--h100 { block-size: 100dvh; }', '  &--h100 { block-size: 100dvh; }\n  &--legacy { height: 0; padding-block-end: 56.25%; }'),
+  },
   {
     id: 'compilado-r01-interpolado',
     regresion: "`var(--#{'primitive'}-…)`: el primitivo se arma con interpolación",
~~~
