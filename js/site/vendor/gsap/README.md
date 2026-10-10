# GSAP 3.13.0 (copia para la web de SYX)

Copia sin modificar de `gsap@3.13.0/dist/` (npm): `gsap`, `ScrollTrigger`, `ScrambleTextPlugin`,
`Draggable` e `InertiaPlugin`, en sus builds minificados UMD.

- **Solo la usa la web** (`home.html` → `js/site/hero-stack.js`). No entra en el paquete de npm:
  `package.json → files` publica únicamente `js/syx-*.js`. SYX sigue sin dependencias.
- **Licencia:** GSAP Standard "no charge" License — <https://gsap.com/standard-license>. Desde la
  3.13 todos los plugins son gratuitos. La cabecera de cada archivo lo indica.
- **Actualizar:** sustituir los cinco archivos por los de la nueva versión en `node_modules/gsap/dist/`
  y cambiar el número de versión aquí.
