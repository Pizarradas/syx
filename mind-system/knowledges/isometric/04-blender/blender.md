# Isométrico · Blender como motor

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | isometric — motor 3D (módulo de entrada del estrato) |
| **Fuente** | Kit iso-flat (scripts probados en Blender 4.2 y 5.2); Blender 3D Architect y The Impossible Emporium (cámaras); Blender Manual (Workbench, Freestyle) |
| **Objetivo** | Usar Blender para lo que en 2D cuesta mucho —biseles, booleanas, curvas, mecanismos, cientos de piezas, animación con curvas reales— y convertirlo en piezas web animables sin perder la proyección exacta ni los colores |
| **Agent tags** | `#isometric` `#blender` `#bpy` `#svg-export` `#layers` |

Da por cumplido `../01-fundamentos/fundamentos.md`. **Complementa, no repite,** `motion/08-ejecucion/blender/blender.md`: aquel traduce una Motion Spec a F-curves y cubre las Slotted Actions de 4.4+/5.x; este pone la cámara isométrica, el shader de tres tonos y la exportación a web. Para curvas con token en una animación isométrica, se usan los dos.

---

## concepts

Los tres scripts comparten `herramientas/iso_comun.py`: misma proyección y misma fórmula de tres tonos que `iso.mjs`. Un azul `#5b8def` da los mismos tres hex en el render de Blender, en el SVG exportado y en la web.

| Quieres | Script | Resultado |
|---|---|---|
| Vector nítido, ligero y tematizable | `iso_export_svg.py` | SVG con un `<g data-iso-part>` por objeto, tres tonos, sombras exactas sobre su receptor, traslaciones en `@keyframes` y rotaciones en flipbook |
| La riqueza de un render y aun así animar por piezas | `iso_export_capas.py` | una capa PNG por pieza (y otra por su sombra), `escena.svg` compositor y `manifiesto.json` con posiciones y vectores de eje |
| Imagen fija o vídeo | `iso_setup.py` + render normal | PNG, WebP o secuencia (§6) |

Rutas desde la raíz del repositorio: `mind-system/knowledges/isometric/04-blender/herramientas/…`. En los ejemplos, `H` abrevia esa carpeta.

---

## rules

### 1. Flujo

1. **Modelar con intención web.**
   - Un objeto por pieza que se vaya a mover (o una colección por pieza compuesta, con `--por coleccion` en capas).
   - Nombres claros: el nombre del objeto pasa a ser su `id` y su `data-iso-part`.
   - Los cortadores de booleanas se ocultan con el ojo (`H`), nunca con «Disable in Viewports»: desactivados no se evalúan y el corte desaparece.
   - Color base: el color de vista del material (*Viewport Display › Color*) o una propiedad `iso_color = "#5b8def"` en el objeto o el material. En SYX, ese hex sale de un rol semántico (`fundamentos.md` §8).
2. **Preparar:** `iso_setup.py` pone la cámara isométrica, el shader de tres tonos, View Transform Standard y fondo transparente. Para luz real, `--materiales conservar` solo pone cámara y encuadre (`ejemplos/render_rico.py`).
3. **Animar,** si hace falta, con keyframes; interpolación lineal en los bucles (`ejemplos/animar_escena.py`). Curvas con token y API de 5.x: `motion/08-ejecucion/blender/blender.md`.
   - **Traslaciones:** en proyección paralela, una traslación 3D es una traslación 2D exacta. Se exportan como `@keyframes` de `transform`, sin pérdida.
   - **Rotaciones y escalas** (aspas, engranajes, puertas): un dibujo fijo no gira en 3D, así que salen en **flipbook**, N fotogramas vectoriales alternados por opacidad. Para un giro continuo, que el ciclo cierre (90° con cuatro aspas) y N según la suavidad.
4. **Exportar** con `iso_export_svg.py` o `iso_export_capas.py`.
5. **Verificar:** `iso-check.py [--tokens]` sobre la salida, render con `iso-render.py` mirado, y un fotograma intermedio si hay animación.

Escena de ejemplo: `ejemplos/crear_escena.py` la crea (losa, torre biselada, cilindro, caja con hueco booleano) y `ejemplos/animar_escena.py` la anima (deslizamiento, flotación, ventilador en flipbook).

### 2. Conectar una IA a Blender

Tres vías, de más a menos integrada; los scripts funcionan igual en las tres.

**A. Servidor MCP de Blender.** Interactivo: Blender abierto, complemento MCP activo y su servidor iniciado (suele escuchar en `localhost:9876`). Sin interfaz: algunas herramientas `…_for_cli` abren un `.blend` en `--background`, ideales para exportar en lote. Los scripts se cargan con `runpy`, que les da su ruta real y así encuentran `iso_comun.py`:

```python
import sys, runpy
sys.argv = ["blender", "--", "--salida", r"C:\ruta\web\escena.svg", "--sombras", "--animacion"]
runpy.run_path(r"C:\GIT\SYX\mind-system\knowledges\isometric\04-blender\herramientas\iso_export_svg.py", run_name="__main__")
```

Antes de tocar una sesión abierta: comprobar `bpy.data.is_dirty` y no cerrar ni reemplazar el archivo del usuario sin preguntar.

**B. Línea de comandos.**

```bash
blender escena.blend --background --python H/iso_setup.py -- --mode iso --res 2048
blender escena.blend --background --python H/iso_export_svg.py -- --salida web/escena.svg --sombras --animacion
blender escena.blend --background --python H/iso_export_capas.py -- --carpeta web/capas-escena
```

Sin Blender instalado, `pip install bpy` (Python 3.13 para Blender 5.x) y `python3 H/con_bpy.py escena.blend iso_export_svg.py -- <opciones>`. Así se probaron.

**C. Manual.** La IA da el comando o el bloque de Python; la persona lo pega en *Scripting › Run Script* y devuelve el resultado o una captura.

| Mensaje | Causa y solución |
|---|---|
| `Cannot connect to Blender at localhost:9876` | Blender cerrado o servidor del complemento sin iniciar |
| `Blender executable not found at 'blender'` | Las herramientas `…_for_cli` no encuentran `blender.exe`: definir `BLENDER_PATH` con la ruta completa y reiniciar la app de IA |
| `No module named 'iso_comun'` | El script se cargó con `exec`: usar `runpy.run_path` o añadir `herramientas/` a `sys.path` |
| La booleana no corta en el SVG | Cortador desactivado en el visor: ocultarlo con el ojo, no con «Disable in Viewports» |

### 3. `iso_setup.py`

| Parámetro | Valores | Efecto |
|---|---|---|
| `--mode` | `iso` / `dimetric` | rotación X de cámara a 54.7356° o 60°, Z = 45°, ortográfica |
| `--light` | `left` / `right` | qué lateral es el tono medio |
| `--outline` | 0 o grosor en px | Freestyle con línea oscura azulada |
| `--engine` | `eevee` / `cycles` | Cycles en CPU sirve en servidores sin GPU |
| `--materiales` | `flat` / `conservar` | `conservar`: solo cámara, encuadre y fondo; no toca materiales, luces ni View Transform |

Con `flat` (por defecto) además encuadra, pone View Transform Standard y fondo transparente, y sustituye los materiales por emisión de tres tonos según la normal. Cada material guarda su `iso_color`; se puede ejecutar dos veces sin degradar los colores.

### 4. `iso_export_svg.py`: vector por piezas

| Opción | Efecto |
|---|---|
| `--modo iso\|dimetric`, `--unidad 40`, `--luz left\|right` | proyección, px por unidad de Blender, lado iluminado |
| `--sombreado bandas\|suave` | `bandas`: tres tonos exactos. `suave`: mezcla por normal; biseles y cilindros ganan volumen |
| `--tokens PREFIJO` | colores como `style="fill:var(--PREFIJO-<material>-top)"` con la paleta en `<style>`; fuerza `bandas`. En SYX, el prefijo del proyecto |
| `--sombras` | sombras exactas: cada cara orientada a la luz se proyecta sobre su **receptor** (la pieza más alta debajo), también en formas cóncavas; recortadas a sus caras superiores |
| `--animacion`, `--paso 2` | traslaciones → `@keyframes`; las sombras siguen a su pieza y se corren hacia la luz si sube; todo dentro de `prefers-reduced-motion` |
| `--rotaciones flipbook\|ignorar`, `--fotogramas 12` | N fotogramas vectoriales alternados por opacidad, sombras sincronizadas; el estado estático muestra el primero |
| `--coleccion`, `--margen`, `--titulo`, `--desc`, `--fondo` | alcance y presentación |

Por dentro: geometría *evaluada* (modificadores aplicados), sin caras de espaldas; techo si la normal sube más de 30° (`nz > 0.5`), igual que el shader, para que render y SVG coincidan; orden por grafo «está detrás de» entre cajas (respaldo por centro si hay ciclos); `stroke` del mismo color en cada cara contra las costuras. Escribe también `escena.json` con el orden, las cajas, los vectores de eje, la duración y `cruces`: los pares que intercambian profundidad durante la animación, y desde cuándo.

Límites: piezas que se interpenetran se ordenan mal (dividirlas); el orden del DOM no cambia solo en un cruce (se detecta y avisa: reordenar con JS); el flipbook multiplica el peso por N (solo piezas pequeñas); mallas densas → Decimate (Planar) o low-poly.

### 5. `iso_export_capas.py`: render rico por capas

```bash
blender escena.blend --background --python H/iso_export_capas.py -- --carpeta salida [--por objeto|coleccion] [--oclusion ninguna|corte] [--sombras]
```

- Cada pieza se renderiza sola, recortada a su caja en pantalla, con fondo transparente, respetando motor, muestras, materiales y luces.
- `--oclusion ninguna` (por defecto): capa completa, lo mejor para animar. `corte`: las demás piezas recortan lo que tapan; composición exacta pero horneada.
- Genera `escena.svg` (`data-iso-raster="capas"`, que el escáner acepta), `manifiesto.json` y `referencia.png`. `ejes_px` dice cuánto se desplaza una capa por unidad de mundo: mover 2 en x es `translate(2·ejes_px.x)`.
- `--sombras`: cada pieza recibe su capa `<id>-sombra.png`, tras su receptor y marcada `data-iso-shadow-of`; al moverla, su sombra va con ella sin huecos. Se obtiene por cociente de dos renders (sin la pieza y con la pieza invisible pero proyectando): alfa = `1 − luminancia(con)/luminancia(sin)`. Necesita luces que proyecten sombra, así que va con `--materiales conservar`.
- Límite inherente: la luz que rebota *entre* piezas no está en ninguna capa. La composición difiere del render en torno a un 1 % de píxeles.

### 6. Salidas clásicas y reglas manuales

| Destino | Salida |
|---|---|
| Imagen web | PNG transparente a 2x → WebP o AVIF |
| Vídeo ligero | secuencia PNG → WebM/MP4 con alfa, o sprite sheet |
| Lottie | no se exporta: SVG por piezas → After Effects (`../03-animacion/lottie-rive.md`) |

Sin los scripts: cámara ortográfica a (54.736°, 0°, 45°) para isométrica real o (60°, 0°, 45°) para 2:1, encuadre con `ortho_scale`; View Transform Standard (AgX o Filmic desplazan los colores); look flat con emisión por normal, Toon BSDF o *Shader to RGB* + ColorRamp en Constant con un sol fijo (Workbench Flat solo sirve para siluetas); contornos con Freestyle (1 px) o Line Art. Girar Z en saltos de 90° mantiene la isometría, reasignando los laterales.

---

## checklist

- [ ] El cubo de referencia tiene las aristas de suelo a 30° (iso) o 26.565° (2:1); en capas, `ejes_px.x` con pendiente ≈ 0.5774
- [ ] Los hex del render coinciden con los del SVG y con la paleta
- [ ] Un objeto por pieza móvil, con nombre claro; cortadores ocultos con el ojo
- [ ] `--tokens` con el prefijo del proyecto en SYX
- [ ] `cruces` del manifiesto revisados si hay animación
- [ ] `iso-check.py` sin errores y control de calidad de los fundamentos
