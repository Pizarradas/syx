# Isométrico · Fuentes y contradicciones

> Navegación del dominio: no se carga como módulo. Se abre para justificar un valor, citar una fuente o resolver una contradicción entre tutoriales.

Consultadas en octubre de 2026.

## Geometría y proyección

- Wikipedia, "Isometric projection": 120° entre ejes, rotación de 45° y luego 35.264° (asin(tan 30°)), matrices de rotación. https://en.wikipedia.org/wiki/Isometric_projection
- Wikipedia, "Isometric video game graphics": 2:1 = 26.565°, ejes a 116.565°/126.870°, conversión pantalla→mundo. https://en.wikipedia.org/wiki/Isometric_video_game_graphics
- the-pixel.art, "Isometric Pixel Art: The 2:1 Trick": escalón 2:1, tiles de 32×16 y 64×32, tres valores por cara. https://the-pixel.art/articles/isometric-pixel-art/
- Pixel Parmesan, "Fundamentals of Isometric Pixel Art": elipses dentro de cajas, contornos y asentamiento. https://pixelparmesan.com/blog/fundamentals-of-isometric-pixel-art
- ThatPainter, guía de pixel art isométrico: tile de calibración, orden de construcción, fórmula de centros. https://thatpainter.com/the-complete-guide-to-isometric-pixel-art/

## Ilustración vectorial

- Astute Graphics, "How to draw in isometric projection in Adobe Illustrator": rejilla y acciones SSR. https://astutegraphics.com/learn/tutorial/how-to-draw-in-isometric-projection-in-adobe-illustrator
- Envato Tuts+, Cody Walker, "Advanced Isometric Illustrations Using the SSR Method". https://design.tutsplus.com/tutorials/how-to-create-advanced-isometric-illustrations-using-the-ssr-method--vector-1058
- IBM Design Language, "Isometric style": anclar a la rejilla, primitivas, curvas regulares, una sola luz, sin modos de fusión. https://www.ibm.com/design/language/illustration/isometric-style/design/
- Linearity, "Isometric design: a designer's guide": paletas con saturación y brillo uniformes. https://www.linearity.io/blog/isometric-design/
- Graphic Design Stack Exchange, sombras isométricas: construcción con luz direccional y puntual. https://graphicdesign.stackexchange.com/questions/86697/illustrator-how-to-add-isometric-shadows

## Web y código

- I am Dan, "Iso(and Di/Tri)metric Projection in SVGs": proyección (x−y)·cos30, matrices por plano. https://iamdan.me/isometric-svgs/
- JointJS, "How to create isometric diagrams using SVG": DOMMatrix rotate/skew/scale y orden por grafo. https://www.jointjs.com/blog/isometric-diagrams
- Envato Tuts+, "Isometric layout with CSS 3D transforms". https://webdesign.tutsplus.com/create-an-isometric-layout-with-3d-transforms--cms-27134t

## Cámaras 3D

- Blender 3D Architect, "True isometric camera": X 54.736, Z 45, ortográfica. https://www.blender3darchitect.com/architectural-visualization/create-true-isometric-camera-architecture/
- The Impossible Emporium, cámaras isométricas en Blender: real 54.736°, de juego 60°. https://impossibleemporium.com/2018/12/using-isometeric-cameras-in-blender/

## Animación, accesibilidad y rendimiento

- GSAP, "SVG" (transformOrigin, svgOrigin, valores relativos). https://gsap.com/resources/svg/
- GSAP, MotionPathPlugin. https://gsap.com/docs/v3/Plugins/MotionPathPlugin/
- GSAP, "ScrollTrigger tips & mistakes". https://gsap.com/resources/st-mistakes/
- GSAP, accesibilidad y `gsap.matchMedia()`. https://gsap.com/resources/a11y/
- MDN, media queries para accesibilidad (`prefers-reduced-motion`). https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility
- web.dev, guía de animaciones de alto rendimiento (transform/opacity, will-change). https://web.dev/articles/animations-guide
- CSS-Tricks, "How SVG Line Animation Works". https://css-tricks.com/svg-line-animation-works/
- SVGO (GitHub). https://github.com/svg/svgo
- W3C, "Writing accessible SVG" (borrador). https://w3c.github.io/writing-accessible-svg/accessible-svg.html
- Airbnb Lottie, flujo de After Effects y funciones soportadas (DeepWiki). https://deepwiki.com/airbnb/lottie/3.1-after-effects-workflow
- Rive, state machines en la web. https://rive.app/docs/runtimes/web/state-machines
- Skill de terceros "isometric-animation" (iart-ai), con tiempos y curvas de referencia. Ojo: llama "isometría real" a la 2:1. https://skillsadd.com/iart-ai/explainer-video-skills/isometric-animation

## Blender

- Blender Manual, iluminación de Workbench (Flat, Studio, MatCap). https://docs.blender.org/manual/en/latest/render/workbench/lighting.html
- Blender Manual, introducción a Freestyle. https://docs.blender.org/manual/en/latest/render/freestyle/introduction.html
- Blender Stack Exchange, render con colores completamente planos (Toon BSDF, ColorRamp en Constant). https://blender.stackexchange.com/questions/10925/how-to-render-cartoon-style-with-completely-flat-colors

## Generación con IA

- Floniks, "Prompting Isometric and 3D-Style Scenes": no basta con "isometric"; describir el contenedor primero; tres valores por cara. https://floniks.com/learn/prompting/prompt-for-isometric-and-3d
- Midjourney Docs, lista de parámetros. https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
- Midjourney Docs, parámetro `--no`. https://docs.midjourney.com/hc/en-us/articles/32173351982093-No
- Chat2SVG (Wu, Su, Liao), generación de SVG con LLM en tres niveles y corrección visual en dos iteraciones. https://arxiv.org/html/2411.16602
- EZCharacter, hojas de personaje isométricas: cabeza exagerada, 8 direcciones. https://ezcharacter.com/how-to/design-model-sheets-isometric

## Contradicciones detectadas y cómo se resolvieron

| Afirmación en las fuentes | Verificación | Regla adoptada |
|---|---|---|
| Escala SSR "86.062 %" (Astute Graphics, Tuts+) | cos 30° = 0.86602; con 0.86062 el eje queda un 0.6 % corto | 86.602 % |
| `scale(1, 0.8602)` en la matriz de JointJS | con 0.8602 la arista y mide 0.9933 en lugar de 1 | 0.86602 |
| `rotateX(60deg) rotateZ(45deg)` es "isometría real" (skills de terceros) | cos 60° = 0.5, rombo 2:1, aristas a 26.565° | 60° es dimétrica 2:1; la isometría real usa 54.7356° |
| Ejes "a 12 grados" (Linearity, una vez) | errata; el resto del artículo dice 120° | 120° |
| Las rejillas son imprescindibles (IBM) frente a "las rejillas ralentizan" (usuarios de GD.SE) | ambas son prácticas válidas | rejilla para formas rectas; SSR o planos con matriz para curvas y formas complejas |

Comprobación numérica: `R(30)·SkewX(−30)·Scale(1, 0.86602)` da `[[0.866, −0.866], [0.5, 0.5]]`, aristas de longitud 1. Además, atan(√2) = 54.7356° y atan(cos 60°) = 26.565°.
