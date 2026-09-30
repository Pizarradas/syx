# Fuentes del dominio motion

> Bibliografía comentada de la que sale el dominio. Es navegación, no corpus: no la carga ningún modo. Cada módulo cita en su `meta` las fuentes que usa; aquí están resumidas con sus valores. Los módulos amplían estas fuentes con documentación técnica de septiembre de 2026 (GSAP 3.13+, Rive Data Binding, Blender 5, View Transitions).


Conceptos que no dependen de ningún programa y se pueden llevar a Blender, Cavalry, GSAP, After Effects, CSS, etc.
Cada resumen recoge las ideas clave y, cuando la fuente los da, valores concretos (duraciones, curvas, parámetros).

---

## 1. Fundamentos clásicos

### UI Animation: los 12 principios de Disney aplicados a UI — IxDF
<https://ixdf.org/literature/article/ui-animation-how-to-apply-disney-s-12-principles-of-animation-to-ui-design>

- Origen: Ollie Johnston y Frank Thomas, *The Illusion of Life* (1981).
- La animación bien usada reduce la carga cognitiva, añade personalidad y supera barreras de idioma. Mal usada, distrae o incluso marea.
- Traducción de cada principio a UI:
  - Squash & stretch: comunica peso y cuánto se puede tocar algo. Hay que conservar el volumen (si se estira, se adelgaza).
  - Anticipation: un hover que avisa de que el elemento es interactivo.
  - Staging: animar lo importante y reducir el movimiento que compite con ello.
  - Pose to pose: definir estados clave y dejar que el software interpole.
  - Follow through / overlapping: los elementos relacionados se mueven a ritmos distintos, y eso crea jerarquía (primero la imagen, después el título, después la descripción).
  - Slow in / slow out: sin easing, el movimiento parece robótico.
  - Arcs: trayectorias curvas, como el dock de macOS.
  - Secondary action: por ejemplo, confeti al enviar un formulario largo.
  - Timing: la velocidad también informa (un archivo grande tarda más en cargar).
- No da valores numéricos.

### 12 principios de animación con ejemplos — Adobe
<https://www.adobe.com/in/creativecloud/roc/blog/video/animation-principles.html>

- Repaso clásico, orientado a vídeo y animación.
- Squash & stretch: mantener constante ancho × alto.
- Follow-through: desfasar las capas hijas unos pocos frames respecto a la padre.
- Timing: el número de frames controla la velocidad, el peso y el tono. Rápido transmite urgencia; lento, peso o drama.
- Staging: se consigue con composición, contraste, ángulos de cámara, zoom, opacidad y escala.
- Exaggeration: amplificar sin romper la inmersión.

### 12 Principles of Animation — userinterface.wiki
<https://www.userinterface.wiki/12-principles-of-animation>

- El movimiento debe tener propósito, ser sutil y comunicar algo.
- Es la fuente con valores de timing más prácticos:
  - Un tooltip a 150 ms se siente ágil; a 400 ms parece roto.
  - Las interacciones, en general, por debajo de 300 ms.
  - Ser consistente: por ejemplo, todos los botones a 200 ms.
- Easings de referencia: familias Sine, Quad y Cubic, cada una en versión in, out e in-out.
- Follow through con stagger y springs, sin añadir latencia.
- Solid drawing en UI: sombras, capas, perspectiva y skew para dar profundidad.

### Principles of Animation — Carnegie Mellon (diapositivas del curso 15-462)
<http://15462.courses.cs.cmu.edu/spring2024content/lectures/18_anim/18_anim_slides.pdf>

- Recorre la evolución de la animación: dibujo a mano → vector (marionetas 2D con keyframes) → 3D → estilos híbridos.
- Pipeline completo: guion → storyboard → animatic → modelado y rigging → key animation → in-betweens → VFX → composición → corrección de color.
- Conceptos transversales: onion skinning, subdivisión de in-betweens (entre los frames 1 y 9 se insertan el 5, luego el 3 y el 7…), separación por capas (boceto, línea, color, sombra, luz) y rotoscopia.
- Más frames significa movimiento más lento.
- Atención: en su definición de ease-in y ease-out usa la convención inversa a la habitual. Conviene contrastarla con las demás fuentes.

### 10 Principles of Motion Design (JR Canest) — VMG Studios
<https://blog.vmgstudios.com/10-principles-motion-design>

- Adaptación de los 12 principios al motion graphics, donde "el tiempo es la cuarta dimensión del diseño gráfico".
- Los 10 principios:
  1. Timing, spacing y ritmo, incluida la sincronía con el audio.
  2. Eases, controlados desde el editor de curvas.
  3. Masa y peso: frenar un coche real cuesta más que frenar un Hot Wheels.
  4. Anticipación: un movimiento breve en sentido contrario antes del principal.
  5. Arcos.
  6. Squash, stretch y smears.
  7. Follow through y overlapping: que los parámetros no empiecen ni acaben a la vez.
  8. Exageración.
  9. Animación secundaria y por capas.
  10. Appeal.

---

## 2. Tiempo, easing y curvas

### A handbook to animation easings — Drew Powers
<https://pow.rs/blog/animation-easings/>

- Una curva de easing es una gráfica con el tiempo en X y la distancia en Y. En una curva lineal, al 25 % del tiempo se ha recorrido el 25 % de la distancia.
- Hay cuatro tipos básicos: linear, ease-in, ease-out y ease-in-out. Los springs no encajan en ninguno.
- Reglas prácticas muy útiles:
  - Color, luz, brillo y opacidad: linear, porque el easing produce mezclas desiguales.
  - Rotaciones continuas y spinners: linear.
  - Respuesta a una interacción: ease-out, porque así se siente más rápida.
  - Por debajo de unos 100 ms se percibe como instantáneo.
  - Al arrastrar: sin easing, siguiendo el cursor 1:1.
  - No animar mientras el usuario arrastra, hace zoom o scroll, porque añade lag.

### Tweening (capítulo 7) — Robert Penner
<https://robertpenner.com/easing/penner_chapter7_tweening.pdf>

- Es la base matemática de casi todos los easings actuales.
- Un tween depende de cuatro valores: t (tiempo), b (valor inicial), c (cambio) y d (duración). Devuelve p(t).
- Lineal: p(t) = t·(c/d) + b. Por ejemplo, 120 px en 30 frames son 4 px por frame.
- Familias: lineal, cuadrática (t²), cúbica (t³), cuártica, quíntica, sinusoidal, exponencial y circular, cada una en versión in, out e in-out.
- Explica también el "slide exponencial" (cada frame recorre la mitad de lo que falta): da un ease-out dinámico, pero sin una duración definida.
- Un concepto clave y reutilizable: cualquier propiedad numérica se puede tweenear (posición, escala, alfa, volumen…).

### easings.net — Easing Functions Cheat Sheet
<https://easings.net/>

- Catálogo visual de unas 30 curvas clásicas: Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic y Bounce, cada una en in, out e in-out.
- Cada curva incluye su equivalente en CSS y su función matemática (TypeScript), lo que la hace fácil de portar a cualquier motor.
- Parte de ejemplos cotidianos: un cajón sale rápido y frena; un objeto que cae acelera y rebota.
- Es open source.

### CSS Easing Explained: ease-in, ease-out y cubic-bezier — Carmen Ansio
<https://www.carmenansio.com/articles/css-easing-explained/>

- Una cubic-bezier(x1, y1, x2, y2) son dos manejadores: X es el tiempo (siempre entre 0 y 1) e Y es el progreso (puede salirse de 0–1).
- El easing decide dónde caen los frames: frames apiñados se ven lentos; frames separados, rápidos.
- Equivalencias exactas de las palabras clave de CSS:
  - ease = (0.25, 0.1, 0.25, 1)
  - ease-in = (0.42, 0, 1, 1)
  - ease-out = (0, 0, 0.58, 1)
  - ease-in-out = (0.42, 0, 0.58, 1)
- Regla general: ease-out para entrar, ease-in para salir, ease-in-out para moverse entre posiciones visibles.
- Si Y pasa de 1 hay overshoot; si baja de 0, hay "windup" (anticipación). Ejemplo: (0.34, 1.56, 0.64, 1).
- Un spring de verdad, con varias oscilaciones, requiere `linear()`.

### Kinematic Timing Curves: Cartoon Physics with Ease — JCGT (paper)
<https://jcgt.org/published/0011/03/02/paper.pdf>

- Curvas de tiempo normalizadas x(t), con t y x entre 0 y 1. Al estar normalizadas, el mismo "carácter" de movimiento sirve para cualquier duración, propiedad o transformación 3D.
- Propone un modelo con solo tres parámetros intuitivos:
  - tₐ: tiempo de anticipación (0 = sin anticipación).
  - t_mid: punto donde se pasa de acelerar a frenar; desplazarlo enfatiza el ease-in o el ease-out.
  - B: número de rebotes (0 = parada suave).
- Aceleración constante, seguida de frenado constante o de una fuerza tipo muelle, con continuidad C¹.
- Amortiguación recomendada: k = 1/4, que supone perder un 22 % en cada rebote.
- Muy útil para diseñar tus propias funciones de easing parametrizables.

### Motion design fundamentals: Easing — Figma Learn
<https://help.figma.com/hc/en-us/articles/41238219562007-Motion-design-fundamentals-Easing>

- Tipos de easing y cuándo usar cada uno:
  - Ease in: para lo que sale de pantalla.
  - Ease out: para lo que entra y se asienta.
  - Ease in-out: para moverse entre posiciones visibles.
  - Linear: para ritmos constantes (spinners, barras de progreso).
  - Hold: salto inmediato; útil para pausas y ritmos deliberados.
- Cómo leer una Bézier: la diagonal es lineal; si la curva tira hacia arriba a la izquierda, es ease-out; si tira hacia abajo a la derecha, es ease-in. Los valores de Y fuera de 0–1 dan wind-up y overshoot (curvas "back").

### Principles in Motion — Figma Blog
<https://www.figma.com/blog/principles-in-motion/>

- Diseñar motion es diseñar con el tiempo: ritmo, pausas, transformación, carácter, secuencia y sonido.
- Principios clave: ease in/out, anticipation, overshoot, follow-through, hold (una pausa para que el espectador registre lo que ha pasado) y settle (el pequeño asentamiento final).
- Recomienda buscar referencias en la naturaleza, en el montaje de cine (match cuts: cortar en el punto de máxima velocidad) y en el arte gestual, más que en las modas.
- Propone un vocabulario de equipo útil: "zippy", "dreamy", "chunky", "snappier", "floaty", "too linear", "dead on arrival".

---

## 3. Física y springs

### The physics behind spring animations — Maxime Heckel
<https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/>

- Un spring es un oscilador armónico. Ley de Hooke: F = −k·x (k = rigidez).
- Aceleración: a = −k·x / m. Más rigidez da más aceleración; más masa, menos.
- Integración frame a frame (a 60 fps, dt ≈ 0,0167 s): v₂ = v₁ + a·dt; p₂ = p₁ + v·dt.
- Amortiguación: Fd = −d·v. La aceleración total es a = (Fs + Fd) / m. Con más amortiguación se asienta antes.
- Valores por defecto de Framer Motion: stiffness 100, damping 10, mass 1.
- Menciona también los parámetros de parada restSpeed y restDelta.
- Permite programar un spring propio en cualquier lenguaje.

### Animate with springs (WWDC23) — Apple
<https://developer.apple.com/videos/play/wwdc2023/10158/>

- Una buena animación mantiene continuas tanto la posición como la velocidad. Lo lineal provoca saltos de velocidad (salvo en spinners).
- Los springs conservan la continuidad aunque la animación herede velocidad de un gesto o cambie de destino a mitad de camino.
- Propone describir un spring con dos parámetros perceptuales, en lugar de masa, rigidez y amortiguación:
  - duration: el ritmo.
  - bounce, entre −1 y 1: 0 es suave, sin rebote; por encima de 0 hay rebote; por debajo, es sobreamortiguado.
- Referencias: bounce de 0,15 se siente ágil; 0,3, claramente rebotante; más de 0,4 resulta exagerado.
- Primero se elige la duración y después el bounce.
- El settling duration (cuándo se detiene de verdad) no debe bloquear la interfaz.

### Animate movement using spring physics — Android Developers
<https://developer.android.com/develop/ui/views/animations/spring-animation>

- Parámetros: final position, damping ratio y stiffness.
- Damping ratio:
  - Mayor que 1: sobreamortiguado (vuelve suave).
  - Igual a 1: crítico (lo más rápido sin oscilar).
  - Menor que 1: subamortiguado (overshoot).
  - Igual a 0: oscila para siempre.
- Presets: HIGH, MEDIUM, LOW y NO BOUNCY para el damping; HIGH, MEDIUM, LOW y VERY_LOW para la rigidez.
- La velocidad inicial se puede tomar del gesto del usuario, y el destino se puede cambiar en marcha.

---

## 4. Sistemas de motion (design systems)

### Material Design 3: Motion (motion physics system)
<https://m3.material.io/styles/motion/overview/how-it-works>

- Desde mayo de 2025 (M3 Expressive), sustituye el sistema basado en easing y duración por uno basado en física.
- Dos esquemas:
  - Expressive: con overshoot y rebote; para momentos protagonistas.
  - Standard: funcional, con rebote mínimo.
- Un spring se define con tres parámetros: stiffness, damping (1 = sin rebote) y velocidad inicial.
- Tokens organizados en dos ejes:
  - Tipo: spatial (posición, rotación, tamaño, radios; puede rebotar) o effects (color y opacidad; nunca rebota).
  - Velocidad: fast, default o slow, según el tamaño del elemento.
  - Ejemplo de token: `md.sys.motion.spring.fast.spatial`.

### Material Design 1: Duration & easing
<https://m1.material.io/motion/duration-easing.html>

- Ajustar la duración a la distancia, la velocidad y el cambio de superficie.
- Duraciones en móvil:
  - Base: 300 ms.
  - Transición grande o a pantalla completa: 375 ms.
  - Elemento que entra: 225 ms. Elemento que sale: 195 ms.
  - Más de 400 ms se siente lento.
- En otros dispositivos: tablet, un 30 % más lento; wearable, un 30 % más rápido; escritorio, 150–200 ms.
- Curvas:
  - Standard: (0.4, 0, 0.2, 1).
  - Deceleration: (0, 0, 0.2, 1).
  - Acceleration: (0.4, 0, 1, 1).
  - Sharp: (0.4, 0, 0.6, 1).
- Una tabla de referencia clásica, fácil de convertir en tokens.

### Material Design 2: The motion system
<https://m2.material.io/design/motion/the-motion-system.html>

- Cuatro patrones de transición que sirven para cualquier medio:
  1. Container transform: un contenedor se convierte en otro (tarjeta → detalle).
  2. Shared axis: movimiento compartido en X o Y (elementos del mismo nivel) o en Z (entre niveles de jerarquía).
  3. Fade through: sale lo antiguo y entra lo nuevo escalando del 92 % al 100 %; para elementos sin relación entre sí.
  4. Fade: entradas y salidas dentro de pantalla, escalando del 80 % al 100 %.
- Es un buen modelo para pensar las transiciones según la relación entre elementos.

### IBM Carbon: Motion
<https://carbon-website-git-fork-aagonzales-dialog-pattern.carbon-design-system.vercel.app/guidelines/motion/basics>

- Dos estilos de motion:
  - Productive: eficiente y discreto; para tareas.
  - Expressive: vistoso; para momentos importantes.
- Curvas estándar, de entrada y de salida para cada estilo. Por ejemplo, la estándar productiva es (0.2, 0, 0.38, 0.9) y la expresiva, (0.4, 0.14, 0.3, 1).
- Evitar lo lineal, los rebotes y las paradas bruscas.
- Tokens de duración:

  | Token | Duración | Uso |
  |---|---|---|
  | fast-01 | 70 ms | Botones y toggles |
  | fast-02 | 110 ms | Fades |
  | moderate-01 | 150 ms | Expansiones pequeñas |
  | moderate-02 | 240 ms | Toasts y expansiones |
  | slow-01 | 400 ms | Expansiones grandes |
  | slow-02 | 700 ms | Oscurecer el fondo |

- Es un gran modelo para un sistema de tokens de motion propio.

### Microsoft Fluent 2: Motion
<https://fluent2.microsoft.design/motion>

- Cuatro principios: funcional, natural (inercia, gravedad, peso), consistente y atractivo.
- La duración crece con el tamaño del elemento y la distancia que recorre.
- Coreografía:
  - Orden de los movimientos.
  - Stagger con desfases cortos para suavizar las entradas grandes.
  - Los elementos importantes tienen movimiento más prominente y más largo.
- Transiciones: enter/exit, elevation, top level y container transform.
- Accesibilidad: una opción de "sin movimiento" y movimiento limitado al elemento enfocado.

### Apple Human Interface Guidelines: Motion
<https://developer.apple.com/design/human-interface-guidelines/motion>

- Movimiento con propósito, nunca gratuito.
- Hacerlo opcional y no usarlo como única forma de comunicar algo (complementar con háptica y sonido).
- Que sea coherente con el gesto: lo que baja desde arriba no se descarta hacia un lado.
- Animaciones de feedback breves y precisas, y que se puedan cancelar.
- En juegos, frame rate constante de 30–60 fps.
- En visionOS, evitar el movimiento en la periferia de la visión.

---

## 5. Motion con propósito (UX)

### UX in Motion Manifesto — Issara Willenskomer
<https://medium.com/ux-in-motion/creating-usability-with-motion-the-ux-in-motion-manifesto-a87a4584ddc>

- Distingue interacciones en tiempo real (manipulación directa) y no en tiempo real (transiciones que bloquean hasta terminar).
- El movimiento ayuda a la usabilidad de cuatro formas: expectativa, continuidad, narrativa y relación.
- Jerarquía conceptual muy reutilizable: principios → técnicas → propiedades (posición, opacidad, escala, rotación, anchor point, color, stroke, forma) → valores.
- 12 principios: easing, offset & delay, parenting, transformation, value change, masking, overlay, cloning, obscuration, parallax, dimensionality, dolly & zoom.

### 12 Motion Design Principles for Digital Products — Toptal
<https://www.toptal.com/designers/ux/motion-design-principles>

- Desarrolla los 12 principios del manifiesto con ejemplos:
  - Parenting: vincular propiedades de un elemento padre y sus hijos.
  - Value change: animar datos para mostrar que son dinámicos.
  - Masking: revelar u ocultar sin perder la identidad del elemento.
  - Cloning: un elemento se divide en otros con un origen claro.
  - Parallax: velocidades distintas para separar planos.
  - Dolly vs zoom: acercar la cámara no es lo mismo que escalar el elemento.
- Añade buenas prácticas de accesibilidad (respetar "reducir movimiento", cuidado con el autoplay).

---

## 6. Tipografía cinética

### Kinetic typography: guía de texto en movimiento — SVGator
<https://www.svgator.com/blog/kinetic-typography-a-guide-to-text-in-motion/>

- Dos tipos:
  - Motion typography: las letras mantienen su forma y se mueven como objetos (scroll tipo Star Wars, layouts dinámicos 2D/3D).
  - Fluid typography: las letras se deforman, se transforman o se disuelven.
- El timing crea el tono: rápido y seco transmite energía o urgencia; lento y suave, calma o lujo.
- Si todo se mueve, nada destaca.
- Usos: títulos, anuncios, lyric videos, idents, onboarding, CTAs, loaders, logos.

### Typography Animation and Kinetic Typography — Vertex
<https://vertex.art/blogs/typography-animation-kinetic-typography>

- Unidades de animación: capa entera, carácter, palabra o línea. El carácter da el control más fino; la palabra funciona mejor con textos largos.
- Direcciones de stagger: desde el inicio, desde el final, del centro hacia fuera, de los bordes hacia dentro, aleatorio con semilla, o desde un índice concreto.
- La "ventana" controla cuánto se solapan las unidades.
- Distingue dos easings independientes y combinables: el del progreso global y el de la distribución del stagger.
- Agrupar por línea permite que cada línea tenga su propia ola.
- Movimiento 3D con perspectiva, con el pivote en el centro de cada unidad.

---

## 7. Accesibilidad

### prefers-reduced-motion — MDN
<https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion>

- Detecta si el usuario ha pedido reducir el movimiento a nivel de sistema.
- El riesgo principal: escalados y desplazamientos grandes afectan a personas con trastornos vestibulares.
- La idea clave es reducir o sustituir el movimiento, no necesariamente eliminarlo. Ejemplo: un pulso de escala de 1 s se cambia por un fundido de opacidad de 4 s.
- Explica dónde está el ajuste en Windows, macOS, iOS, Android, GNOME y KDE.

### Animated Content and Timing — Yale Usability & Accessibility
<https://usability.yale.edu/digital-accessibility/accessibility-resources/accessibility-articles/animated-content-and-timing>

- Riesgos: epilepsia fotosensible, trastornos vestibulares (parallax) y usuarios que necesitan más tiempo.
- Criterios WCAG que aplican:
  - 2.2.1: tiempos ajustables.
  - 2.2.2: poder pausar, detener u ocultar.
  - 2.3.1: tres destellos o menos.
  - 2.3.3: poder desactivar las animaciones que disparan las interacciones.
- Nunca más de 3 destellos por segundo, sobre todo en rojo.
- Todo contenido que se mueve solo durante más de 5 segundos necesita controles de pausa.
- Ofrecer opciones para desactivar parallax, autoscroll y vídeo de fondo.

---

## 8. Libros de referencia

### The Animator's Survival Kit — Richard Williams
<https://en.wikipedia.org/wiki/The_Animator's_Survival_Kit>

- Manual de métodos, principios y fórmulas para animación clásica, por ordenador, videojuegos, stop motion e internet.
- Publicado por Faber and Faber en 2001, con 379 páginas.
- Tiene versión en DVD (16 volúmenes, basada en sus masterclasses) y app para iPad (2013).
- Es la referencia clásica sobre timing, spacing, poses y ciclos.

### Design for Motion (2.ª ed.) — Austin Shaw
<https://www.routledge.com/Design-for-Motion-Fundamentals-and-Techniques-of-Motion-Design/Shaw/p/book/9781138318656>

- Enfoca el motion design como comunicación, narrativa y arte.
- Se centra en la fase de diseño previa a animar: style frames, design boards y desarrollo de conceptos.
- Temas: ilustración, tipografía, composición, narrativa visual, 3D, diseño mobile-first y estilo propio.
- Tipos de boards: tipográficos, ilustrativos, de infografía o datos, de personajes, táctiles y matte painting.
- Complementa bien al libro de Williams, que se ocupa del movimiento en sí.

---

## Conceptos transversales (síntesis)

| Concepto | Idea reutilizable | Fuentes clave |
|---|---|---|
| Timing / spacing | Duración y reparto de frames; más frames, más lento | Williams, Adobe, VMG |
| Easing | Entrar con ease-out, salir con ease-in, desplazarse con in-out, color y rotación en lineal | Figma, Ansio, Powers |
| Curvas | cubic-bezier: X = tiempo, Y = progreso; Y fuera de 0–1 da overshoot o anticipación | Ansio, Penner, JCGT |
| Springs | Rigidez, amortiguación y masa, o bien duración + bounce | Heckel, Apple, Android, M3 |
| Duraciones | Micro 70–150 ms · UI 200–300 ms · grandes 375–400 ms · fondos hasta 700 ms | Carbon, Material 1 |
| Coreografía | Stagger, offset & delay, jerarquía | Fluent, UX in Motion, Vertex |
| Transiciones | Container transform, shared axis, fade through, fade | Material 2, Fluent |
| Tokens | Estilo (productive/expressive) × tipo (spatial/effects) × velocidad | Carbon, Material 3 |
| Accesibilidad | Reducir o sustituir, ≤ 3 destellos/s, pausar si dura > 5 s | MDN, Yale, Apple |
