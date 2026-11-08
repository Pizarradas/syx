# Parche propuesto — plan de generación, fase 2a y 2b

Las dos correcciones tocan rutas «Solo humano» de `contracts/trust.json` (`scss/themes/` y `scripts/`).
El hook de confianza bloqueó la edición, así que el cambio llega aquí como parche para que lo aplique
una persona. Evidencia del flujo de propuesta: `contracts/propuestas/fase2-anillo-foco.md`.

## Aplicar (desde la raíz del repo, en esta rama)

~~~bash
sed -n '/^~~~diff$/,/^~~~$/p' contracts/propuestas/fase2-anillo-foco-parche.md | sed '1d;$d' | git apply
npm run build:css && npm run validate:report && npm run export:figma
git rm contracts/propuestas/fase2-anillo-foco-parche.md
~~~

Regenera `css/styles-theme-{example-01,syx-sketch}.css`, `contracts/resolved-tokens.json`,
`contracts/token-contract.json`, `contracts/token-usage-map.json` y `contracts/figma/{example-01,syx-sketch}.figma.json`.

## Medido antes de proponerlo (copia aparte, nunca en el repo)

- **2a**, marca hostil como primario claro de `example-01` y `syx-sketch`, fallos de `anillo-de-foco` en `check:contraste`:

  | Primario | Antes | Después |
  |---|---|---|
  | `#ffe600` amarillo | 16 | 0 |
  | `#7fffd4` aguamarina | 16 | 0 |
  | `#39ff14` lima | 16 | 0 |
  | `#808080` gris | 0 | 0 |
  | `#ff0000` rojo | 0 | 0 |

  Con los primarios reales de hoy, `check:contraste` sigue 118 pares × 7 temas × 4 estados × 2 ramas en verde.
- **2b**, `check:escaner` con `syx-sketch` en `#ffe600`: 41/43 antes, 43/43 después. Con el primario real, 43/43.

## Diff

~~~diff
diff --git a/scripts/check-escaner.js b/scripts/check-escaner.js
index e327ebb..504c12b 100644
--- a/scripts/check-escaner.js
+++ b/scripts/check-escaner.js
@@ -29,6 +29,18 @@ const { crearConsulta } = require('./lib/consulta');
 const ROOT = path.join(__dirname, '..');
 const syx = crearConsulta({ root: ROOT });
 
+// El primario del tema de la muestra, preguntado al sistema (lo mismo que
+// responde get_token) y no copiado a mano: con el valor escrito aquí, cambiar
+// la marca de syx-sketch rompía la prueba por la razón equivocada, y una marca
+// de prueba no se podía pasar por el escáner sin reescribirla.
+const PRIMARIO = (() => {
+  const t = syx.getToken({ token: '--semantic-color-primary', theme: 'syx-sketch' });
+  if (!t.found || t.isExpression) throw new Error(`--semantic-color-primary de syx-sketch no es un color literal: ${t.value}`);
+  // El caso 1 necesita un fallback que NO coincida con el sistema.
+  if (t.value.toLowerCase() === '#6d28d9') throw new Error('el primario es #6d28d9: el caso del fallback caducado ya no prueba nada');
+  return t.value;
+})();
+
 // ─── El fichero de mentira, con la respuesta escrita al lado ─────────────────
 
 const MUESTRA = `<!doctype html>
@@ -40,11 +52,11 @@ const MUESTRA = `<!doctype html>
     /* 2 · token que no existe: el fallback se pinta SIEMPRE */
     border-color: var(--semantic-color-inventado, #123456);
     /* 3 · valor a pelo que ya es token */
-    background: oklch(0.498 0.282 266.24);
+    background: ${PRIMARIO};
     /* 4 · contrato roto en el consumidor */
     padding: 1rem !important;
     /* 5 · fallback que SÍ coincide: no debe salir */
-    outline-color: var(--semantic-color-primary, oklch(0.498 0.282 266.24));
+    outline-color: var(--semantic-color-primary, ${PRIMARIO});
     /* 13 · var() SIN fallback de un token que no existe: el peor caso */
     box-shadow: var(--semantic-shadow-que-no-existe);
     /* 14 · var() sin fallback de uno que SÍ existe: no debe salir */
@@ -67,7 +79,7 @@ const MUESTRA = `<!doctype html>
   <!-- 10 · lo mismo pero DENTRO de un ejemplo: nada de esto debe salir -->
   <pre><code>&lt;p class="atom-otro-inventado"&gt;
   color: var(--semantic-color-primary, #6d28d9);
-  background: oklch(0.498 0.282 266.24);
+  background: ${PRIMARIO};
   margin: 0 !important;
 &lt;/p&gt;</code></pre>
   <script>document.body.className = 'syx syx--theme-' + tema;</script>
@@ -96,7 +108,7 @@ const uno = (tipo, trozo) => {
 comprobar('el fallback caducado, con los dos valores enfrentados', () => {
   const h = uno('fallback-desviado', '--semantic-color-primary');
   if (!h.detalle.includes('#6d28d9')) throw new Error('no dice lo que pinta la aplicación');
-  if (!h.detalle.includes('oklch')) throw new Error('no dice lo que dice el sistema');
+  if (!h.detalle.includes(PRIMARIO)) throw new Error('no dice lo que dice el sistema');
   if (h.gravedad !== 'alta') throw new Error(`gravedad ${h.gravedad}: un color desviado es lo más caro de todo`);
 });
 
@@ -122,7 +134,7 @@ comprobar('no señala un var() sin fallback de un token que sí existe', () => {
 });
 
 comprobar('el color a pelo, nombrando el token que ya lo tiene', () => {
-  const h = uno('valor-a-pelo', 'oklch(0.498 0.282 266.24)');
+  const h = uno('valor-a-pelo', PRIMARIO);
   if (!h.sugerencia.includes('--semantic-')) throw new Error(`sugiere ${h.sugerencia}, y debe ser un semántico`);
 });
 
@@ -467,9 +479,9 @@ fs.writeFileSync(temaFalso, `@mixin theme-falso {
   :root {
     --primitive-color-brand-500: oklch(0.6 0.2 30);
     --semantic-color-primary: var(--primitive-color-brand-500);
-    --semantic-color-text-primary: oklch(0.498 0.282 266.24);
+    --semantic-color-text-primary: ${PRIMARIO};
     --component-x-bg: var(--primitive-color-brand-500);
-    --component-y-color: oklch(0.498 0.282 266.24);
+    --component-y-color: ${PRIMARIO};
     --semantic-color-inventado: var(--semantic-color-primary);
     @supports (color: oklch(0 0 0)) { --semantic-shadow-xs: none; }
   }
@@ -486,7 +498,7 @@ comprobar('tema: su paleta propia, leída y escrita con literales, no es desviac
 });
 comprobar('tema: un --component-* que lee un primitivo o un color a pelo (R11)', () => {
   if (!enTema('primitivo-en-app', '--component-x-bg lee --primitive-color-brand-500').length) throw new Error('no ve el primitivo en --component-x-bg');
-  if (!enTema('valor-a-pelo', 'oklch(0.498 0.282 266.24)').some((h) => h.linea === 7)) throw new Error('no ve el color a pelo en --component-y-color (línea 7)');
+  if (!enTema('valor-a-pelo', PRIMARIO).some((h) => h.linea === 7)) throw new Error('no ve el color a pelo en --component-y-color (línea 7)');
 });
 comprobar('tema: un --semantic-* que el sistema no tiene, y una regla que pinta con un primitivo', () => {
   if (!enTema('token-usurpado', '--semantic-color-inventado').length) throw new Error('no ve --semantic-color-inventado');
diff --git a/scss/themes/example-01/_theme.scss b/scss/themes/example-01/_theme.scss
index 8990753..31f6f48 100644
--- a/scss/themes/example-01/_theme.scss
+++ b/scss/themes/example-01/_theme.scss
@@ -130,7 +130,9 @@
     --semantic-color-border-strong: oklch(0.78 0.019 261.325);
 
     // State
-    --semantic-focus-ring-color: var(--semantic-color-primary);
+    // 1.4.11: el anillo sigue a la variante fuerte, no al primario: con una
+    // marca clara (amarillo, aguamarina, lima) el primario no llega a 3:1.
+    --semantic-focus-ring-color: var(--semantic-color-primary-strong);
 
     // Fonts
     --semantic-font-family-primary: var(--primitive-font-family-inter);
diff --git a/scss/themes/syx-sketch/_theme.scss b/scss/themes/syx-sketch/_theme.scss
index 49faf52..b5154e3 100644
--- a/scss/themes/syx-sketch/_theme.scss
+++ b/scss/themes/syx-sketch/_theme.scss
@@ -77,7 +77,9 @@
   --semantic-color-on-secondary: var(--semantic-color-ink-dark);
   --semantic-color-on-state-hover-secondary: var(--semantic-color-ink-dark);
   --semantic-color-on-quinary: var(--semantic-color-ink-light);
-  --semantic-focus-ring-color: var(--semantic-color-primary);
+  // 1.4.11: el anillo sigue a la variante fuerte, no al primario: con una
+  // marca clara (amarillo, aguamarina, lima) el primario no llega a 3:1.
+  --semantic-focus-ring-color: var(--semantic-color-primary-strong);
   // gray-500 se quedaba en 3,5:1 sobre el campo blanco; el placeholder es
   // texto y pide 4,5. El terciario del tema (gray-600) da 5,5.
   --semantic-color-placeholder: var(--semantic-color-text-tertiary);
~~~
