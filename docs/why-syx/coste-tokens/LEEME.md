# Coste en tokens — método

La tabla «What it costs an agent, in tokens» de `why-syx.html` sale de aquí.
Mide cuánto lee y cuánto escribe un agente para construir **la misma UI** con
cada uno de los siete sistemas. La genera `scripts/build-why-syx.js` desde
`medicion.json`, y `medicion.json` lo escribe `medir.mjs`.

## La UI de referencia

Una tarjeta «Delete project» con:

1. título y una frase de texto;
2. un `<form>` con un campo de email: etiqueta, `required` y **en estado de
   error fijo** con el mensaje «Enter a valid email address.», anunciado a
   lectores de pantalla (`aria-invalid` y `aria-describedby`, o lo que el
   sistema cablee por sí mismo);
3. un botón destructivo «Delete project» que abre
4. un diálogo modal de confirmación: título, descripción, «Cancel» y
   «Delete»; Escape lo cierra, atrapa el foco y lo devuelve al botón.

Fuera del alcance, en todos por igual: validación real, envío, modo oscuro
escrito a mano, estilos de foco propios, instalación, proveedores (`<Provider>`,
`<link>`) y la hoja `<head>`. Cada implementación (`ui/`) es la forma idiomática
que enseñan los ejemplos oficiales del sistema, sin minimizar ni inflar:

| Sistema | Fichero | Qué pone el sistema y qué escribe el agente |
|---|---|---|
| SYX | `ui/syx.html` | Clases de SYX; `<dialog>` nativo, abierto con `showModal()` |
| Shadcn UI | `ui/shadcn.tsx` | `Field`, `Card`, `AlertDialog`. **No cuenta** los componentes que `npx shadcn add` copia al proyecto |
| Tailwind CSS | `ui/tailwind.html` | Utilidades; `<dialog>` nativo. Sin componentes: todo el aspecto se escribe |
| Chakra UI | `ui/chakra.tsx` | `Field`, `Card`, `Dialog` con `role="alertdialog"` |
| Bootstrap 5.3 | `ui/bootstrap.html` | `is-invalid`, `card`, modal con `data-bs-toggle` (su JS pone `role="dialog"`; no hay `alertdialog`) |
| Material UI | `ui/mui.tsx` | `TextField` con `error`/`helperText`, `Card`, `Dialog` con estado |
| Ant Design | `ui/antd.tsx` | `Form.Item` con `validateStatus`/`help`, `Card`, `Modal` con estado |

## El contexto

Una fuente por rol (instalación, botón, campo con error, tarjeta, diálogo) y
sistema, en `contexto.json`: la página oficial **entera**, como la sirve el
sistema para agentes (`.md`/`.mdx`) cuando la sirve. Un agente que la abre la
lee entera, ejemplos incluidos; no se recorta nada.

- **SYX**: `CONSUMING.md` (el contrato para construir sobre SYX) y la
  respuesta de la herramienta MCP `get_component` de cada pieza.
- **Tailwind** no publica `llms.txt` ni Markdown: se usa la fuente de su web
  (instalación con Vite y «Styling with utility classes»). No tiene páginas de
  componentes, así que tres roles quedan vacíos: ese coste pasa a la salida.
- **Bootstrap**: `getbootstrap.com/llms.txt` ya apunta a la documentación de
  la 6.0 (alfa). Para la 5.3.9, que es la puntuada, se usa la fuente de su web
  en la etiqueta `v5.3.9`.
- **Ant Design**: el campo con error es `Form.Item`, así que el rol «campo» es
  la página de `Form`, la más larga de todas.

## Cómo se cuenta

`count_tokens` de la API de Anthropic con `claude-opus-5-5`: el tokenizador
de Claude. Cada texto, un mensaje de usuario; se resta el envoltorio del
mensaje (medido con «a», un token), así que cada cifra es la del texto (±1).
`medicion.json` guarda bytes y sha256 de cada fuente: si una página cambia,
la siguiente medición lo dice.

## Lo que esta medida no dice

- **No es el coste de una sesión real.** Un agente puede leer menos (un solo
  ejemplo) o más (varias páginas, código de los componentes). Es una medida
  igual para todos, no una predicción.
- **No mide el conocimiento previo.** Un modelo que ya conoce Bootstrap o MUI
  por su entrenamiento puede no leer nada; SYX no está en el entrenamiento de
  ningún modelo, así que su contexto es el que hay que pagar.
- **El autor de SYX escribió las siete implementaciones.** Están aquí para que
  cualquiera las corrija; una implementación más corta e igual de correcta
  cambia la cifra, y es bienvenida.

## Volver a medir

```sh
cd docs/why-syx/coste-tokens
npm install
ANTHROPIC_API_KEY=… npm run medir
cd ../../.. && npm run build:why-syx
```
