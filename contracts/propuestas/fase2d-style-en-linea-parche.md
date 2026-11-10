# Parche propuesto — plan de generación, fase 2d (1.ª parte): `style="…"` sobre elementos de SYX

Toca rutas «Solo humano» de `contracts/trust.json` (`scripts/` y `tests/`, este por defecto), así que llega como
parche para que lo aplique una persona.

## Qué
1. **`scripts/lib/escaner.js`**: cada trozo `style="…"` recuerda las clases de su etiqueta, y la regla 3c («la app
   pinta una clase de SYX») lo juzga igual que una regla con esa clase de sujeto. Hasta ahora se lo saltaba: un
   atributo style no tiene selector. Hallazgo nuevo `pinta-clase-syx-style`, con **gravedad `baja`** (aviso), como
   pide el plan para toda regla nueva. Colocar (`margin`, `order`, `grid-*`…) y sobrescribir tokens (`--component-…`)
   no cuentan; un elemento propio (`app-*`) tampoco.
2. **`scripts/check-escaner.js`**: un caso con cuatro elementos (pinta, coloca, sobrescribe un token, `app-*`).
   Solo el primero debe salir, como `baja` y en su línea.
3. **`tests/mutacion/casos/escaner.js`**: caso `escaner-style-en-linea`. Si el escáner vuelve a saltarse los
   style, `check:escaner` lo para.

Fuera de este lote: leer marcado dentro de JS/JSX (`style={{…}}` incluido) y pasar por contraste los colores
propios de la app. Son las otras dos piezas de la 2d.

## Medido antes de proponerlo (copia aparte, nunca en el repo)
- `check:escaner`: 44/44 (43 de antes más el nuevo). `check:vitrina` (`--fallar-si-media`) en verde.
- Mutación: `escaner-style-en-linea`, `escaner-tema-componente-primitivo` y `vitrina-nombre-sin-texto-visible`, paradas.
- Guardianes en la copia: lint, cadena, contratos, reglas, compilado, mcp, consumidores, init-app, clases-docs,
  docs-componentes, recuentos, evals, runner, conocimiento, encoding, clasificación, codeowners, modos, package,
  pages, capacidades, usage y huérfanos en verde.
- **Lo que ya encuentra en las páginas de SYX** (49 avisos, ninguno en `docs.html`):

  | Página | Avisos | Qué pinta |
  |---|---|---|
  | `home.html` | 20 | `.atom-table__td` (`white-space`) ×20 |
  | `why-syx.html` | 21 | `.atom-txt` (`font-size`) ×13, (`font-size`, `color`) ×1 · `.atom-pill` (`display`) ×6 · `.atom-table` (`text-align`) ×1 |
  | `theme-builder.html` | 8 | `.atom-title` (`border-bottom`) ×3, (`color`) ×2 · `.atom-txt` (`color`) ×2 · `.atom-btn` (`box-shadow`) ×1 |

  Son escapes reales de la propia vitrina: cada uno es una pieza de SYX repintada a mano. Arreglarlos es otro lote
  (las páginas son ruta `pr`); cuando estén a cero, la regla puede subir a `media` y `check:vitrina` la hará cumplir.

## Aplicar (PowerShell 5, desde la raíz del repo, con `main` actualizado)

~~~powershell
git checkout main
git pull
git checkout -b fix/fase2d-style-en-linea
$md = Get-Content -Raw -Encoding UTF8 contracts\propuestas\fase2d-style-en-linea-parche.md
$diff = [regex]::Match($md, '(?s)~~~diff\r?\n(.*?)\r?\n~~~\s*$').Groups[1].Value -replace "`r`n", "`n"
[IO.File]::WriteAllText("$PWD\parche.diff", $diff + "`n", (New-Object Text.UTF8Encoding $false))
git apply --check parche.diff
git apply parche.diff
Remove-Item parche.diff
node scripts/check-escaner.js
npm.cmd run check:vitrina
node scripts/check-mutacion.js --solo escaner-style-en-linea
git rm contracts/propuestas/fase2d-style-en-linea-parche.md
git add -A
git commit -m "fix(escáner): style en línea sobre elementos de SYX, como aviso (fase 2d)"
git push -u origin fix/fase2d-style-en-linea
~~~

No regenera nada: el escáner no produce derivados. Abre la PR y ponle `aprobado-humano`.

## Cómo revertir
`git revert` del commit que lo aplique.

## Diff

~~~diff
diff --git a/scripts/check-escaner.js b/scripts/check-escaner.js
index 504c12b..9997553 100644
--- a/scripts/check-escaner.js
+++ b/scripts/check-escaner.js
@@ -287,6 +287,25 @@ comprobar('app: colocar, :has() y sobrescribir un token NO es pintar', () => {
   if (malos.length) throw new Error(malos.map((h) => h.que).join(' | '));
 });
 
+// Fase 2d del plan de generación: un style="…" sobre un elemento de SYX lo
+// pinta igual que una regla. Antes el escáner se lo saltaba (no hay selector).
+comprobar('style en línea: pinta un elemento de SYX, como aviso; colocar, tokens y app-* no', () => {
+  const f = path.join(tmp, 'en-linea.html');
+  fs.writeFileSync(f, [
+    '<!doctype html><html><body>',
+    '<button class="atom-btn atom-btn--primary" style="color: red; padding: 2px">Pinta</button>',
+    '<button class="atom-btn" style="margin-inline-start: auto; order: 2">Coloca</button>',
+    '<article class="mol-card" style="--component-card-bg: var(--semantic-color-bg-secondary)">Token</article>',
+    '<div class="app-panel" style="color: red">Propio</div>',
+    '</body></html>',
+  ].join('\n'));
+  const r = escanear({ files: [f], syx });
+  const h = r.hallazgos.filter((x) => x.tipo === 'pinta-clase-syx-style');
+  if (h.length !== 1) throw new Error(`esperaba 1, encontró ${h.length}: ${h.map((x) => x.que).join(' | ') || 'nada'}`);
+  if (!/atom-btn/.test(h[0].que) || !/color/.test(h[0].que) || !/padding/.test(h[0].que)) throw new Error(`no nombra elemento y propiedades: ${h[0].que}`);
+  if (h[0].gravedad !== 'baja' || h[0].linea !== 2) throw new Error(`gravedad ${h[0].gravedad}, línea ${h[0].linea}: debe entrar como aviso (baja) en la línea 2`);
+});
+
 comprobar('app: una transition en crudo en SCSS, con el mixin al lado', () => {
   const h = enApp('movimiento-sin-salida', 'transform 1s');
   if (!/@include transition/.test(h.sugerencia)) throw new Error(`sugiere ${h.sugerencia}`);
diff --git a/scripts/lib/escaner.js b/scripts/lib/escaner.js
index 10de8ef..6e1178d 100644
--- a/scripts/lib/escaner.js
+++ b/scripts/lib/escaner.js
@@ -56,7 +56,11 @@ function trozosCss(html) {
     trozos.push({ css: m[1], desde: lineaDe(limpio, m.index + m[0].indexOf(m[1])), origen: 'bloque <style>' });
   }
   for (const m of limpio.matchAll(/\bstyle\s*=\s*"([^"]*)"/gi)) {
-    trozos.push({ css: m[1], desde: lineaDe(limpio, m.index), origen: 'atributo style', unaLinea: true });
+    // Las clases de la etiqueta que lleva el atributo: un `style` sobre un
+    // `.atom-table` lo pinta igual que una regla con ese selector (3c).
+    const etiqueta = limpio.slice(limpio.lastIndexOf('<', m.index), limpio.indexOf('>', m.index) + 1);
+    const clases = (/\bclass\s*=\s*"([^"]*)"/i.exec(etiqueta) || [])[1] || '';
+    trozos.push({ css: m[1], desde: lineaDe(limpio, m.index), origen: 'atributo style', unaLinea: true, clases: clases.split(/\s+/).filter(Boolean) });
   }
   return trozos;
 }
@@ -586,6 +590,24 @@ function escanear({ files, syx, theme = 'syx-sketch', mode = 'light', prefijo =
     if (!esHtml || trozos.length) {
       const COLOCAR = /^(margin|margin-[a-z-]+|grid-area|grid-column|grid-row|grid-column-[a-z]+|grid-row-[a-z]+|order|align-self|justify-self|place-self|flex|flex-grow|flex-shrink|flex-basis|inline-size|max-inline-size|min-inline-size|width|max-width|min-width)$/;
       for (const t of trozos) {
+        // Un atributo style no tiene selector: lo que pinta es su elemento. Si
+        // ese elemento lleva una clase de SYX, cuenta igual que una regla con
+        // ella de sujeto. Regla nueva (plan de generación, fase 2d): entra como
+        // aviso, `baja`, hasta que se vea qué marca en las apps reales.
+        if (t.unaLinea) {
+          const syxClase = (t.clases || []).find((c) => /^(atom|mol|org)-[A-Za-z0-9_-]+$/.test(c));
+          const pinta = syxClase ? [...t.css.matchAll(/(?:^|;)\s*([a-zA-Z-]+)\s*:/g)].map((m) => m[1].toLowerCase())
+            .filter((p) => !p.startsWith('--') && !COLOCAR.test(p)) : [];
+          if (pinta.length) {
+            añadir({
+              tipo: 'pinta-clase-syx-style', gravedad: 'baja', file: rel, linea: t.desde,
+              que: `un style="…" pinta .${syxClase} (${[...new Set(pinta)].slice(0, 4).join(', ')})`,
+              detalle: `style="${t.css.trim().slice(0, 70)}" sobre un elemento con .${syxClase}: una clase de SYX solo se coloca (margin, grid-*, order, align/justify-self, flex) desde la app, también en línea.`,
+              sugerencia: 'Usa un modificador o una utilidad que exista, sobrescribe sus tokens en el style (--component-…), o envuélvelo en un elemento propio (app-*) — CONSUMING.md §3–4.',
+            });
+          }
+          continue;
+        }
         const css = t.css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
         let i = 0;
         while ((i = css.indexOf('{', i)) !== -1) {
diff --git a/tests/mutacion/casos/escaner.js b/tests/mutacion/casos/escaner.js
index 050e628..8046994 100644
--- a/tests/mutacion/casos/escaner.js
+++ b/tests/mutacion/casos/escaner.js
@@ -24,4 +24,14 @@ module.exports = [
     espera: /se ve «GitHub» y se llama «Open the repository»/,
     mutar: (t) => t.reemplazar('home.html', 'aria-label="GitHub repository"', 'aria-label="Open the repository"'),
   },
+  // Fase 2d: un style="…" sobre un elemento de SYX lo pinta. Si el escáner
+  // vuelve a saltarse los atributos style, check:escaner tiene que verlo.
+  {
+    id: 'escaner-style-en-linea',
+    regresion: 'el escáner vuelve a saltarse los style="…" sobre elementos de SYX',
+    guardian: 'check:escaner',
+    comando: ['node', 'scripts/check-escaner.js'],
+    espera: /❌ style en línea: pinta un elemento de SYX[\s\S]*esperaba 1, encontró 0/,
+    mutar: (t) => t.reemplazar('scripts/lib/escaner.js', "const syxClase = (t.clases || []).find(", 'const syxClase = [].find('),
+  },
 ];
~~~
