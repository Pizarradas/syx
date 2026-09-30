# Glosario — vocabulario corto para prompts

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — términos atómicos para briefing y prompts IA |
| **Fuente** | GSAP Prompt Briefing del proyecto + jerga interna ATLAS |
| **Objetivo** | Tener un vocabulario compacto que se pueda copiar dentro de un prompt |
| **Agent tags** | `#vocabulary` `#prompts` `#briefing` |

---

## concepts

Cada término aquí es **operativo**: si lo pones en un prompt, una IA con conocimiento de GSAP lo entiende sin más explicación. Evita perífrasis del tipo *"que las letras aparezcan una a una"* — usa *"character cascade"*.

---

## rules

### Núcleo temporal

| Término | Significado operativo |
|---|---|
| **Tween** | Un cambio de propiedad entre dos valores en una duración |
| **Timeline** | Coreografía secuenciada de tweens |
| **Stagger** | Desfase temporal entre elementos (`each`, `from`, `grid`) |
| **Easing** | Curva de aceleración: `expo.out`, `power3.in`, `elastic.out(1, 0.4)` |
| **Overlap** | Solapamiento temporal en timeline (`"-=0.5"`, `"<"`) |

### Núcleo de scroll

| Término | Significado operativo |
|---|---|
| **ScrollTrigger** | Disparador y vínculo entre scroll y animación |
| **Pin** | Fijar la sección durante una distancia de scroll |
| **Scrub** | Atar la animación al `progress` del scroll (continuo) |
| **Snap** | Saltar a posiciones discretas (raro en long-form) |
| **Anticipate pin** | Suaviza la entrada en una sección pinned |

### Núcleo visual / narrativo

| Término | Significado operativo |
|---|---|
| **Reveal** | Hacer aparecer un elemento (genérico) |
| **Character cascade** | Reveal letra por letra con stagger pequeño |
| **Word stagger** | Reveal palabra por palabra (ritmo más rápido) |
| **Mask reveal** | Descubrir contenido tras una capa máscara |
| **Clip reveal** | Descubrir vía `clip-path: inset(...)` |
| **Parallax** | Capa de fondo más lenta que el primer plano |
| **Ken Burns** | Imagen con zoom + drift continuos durante scroll |
| **Pinned scrub** | Sección fijada cuyo contenido avanza con el scroll |
| **Horizontal scroll** | Recorrido lateral en sección pinneada |
| **Draw SVG path** | Trazado animado de un path con `stroke-dashoffset` |

### Texto

| Término | Significado operativo |
|---|---|
| **Split text** | Dividir un texto en chars o words para animar individualmente |
| **Typewriter** | Texto que aparece carácter a carácter (lineal, con caret) |
| **Scramble text** | Texto que pasa por caracteres aleatorios antes de fijarse |
| **Kinetic typography** | Tipografía cuya forma propia se anima (rara vez con GSAP plain — combinar con SVG) |

### Interacción

| Término | Significado operativo |
|---|---|
| **Magnetic button** | Botón que se atrae al cursor cercano |
| **Cursor follower** | Cursor personalizado que sigue al ratón con lag |
| **Hover translate** | Botón con `transform: translateY(-1px)` en `:hover` (no es magnetic) |
| **FLIP** | Animación entre estados de layout vía First-Last-Invert-Play |
| **Drag** | Arrastrable (plugin Draggable) |

### Tono y mood (palabras de brief)

| Término | Lo que activa |
|---|---|
| **Cinematic** | Lentitud, parallax, Ken Burns, easing dramático (`expo.out`) |
| **Editorial** | Reveal limpios, character-cascade, mask-reveal, paleta sobria |
| **Premium** | Espaciado generoso, microinteracciones pulidas, reduced-motion respetado |
| **Forensic** | Scramble text, typewriter, draw SVG path, monospace, tag/timestamp overlays |
| **Playful** | Elastic ease, back.out, magnetic button, micro-rebotes |
| **Minimal** | Fade simple, sin parallax, sin scrub, sin cursor follower |
| **Immersive** | Pinned scrub, full-bleed video, parallax acumulado |
| **Futuristic** | Grid line draw-in, scramble, glitch, hue-rotate |

---

## checklist — antes de pedir motion en un prompt

- [ ] ¿He nombrado el patrón con su término operativo (no descripción)?
- [ ] ¿He indicado disparo (`load`, `viewport`, `scroll`, `hover`)?
- [ ] ¿He indicado duración aproximada o ease deseado?
- [ ] ¿He indicado si es `once: true` o repetible?
- [ ] ¿He indicado fallback `prefers-reduced-motion`?

---

## Ejemplo de prompt completo

> "Hero con **character cascade** sobre el `h1`: stagger 0.022, ease `expo.out`, yPercent 110 → 0, opcional blur 8 → 0, delay 0.3s tras carga. Debajo, **parallax** sobre la imagen de fondo (speed 0.32, scrub true) y **Ken Burns** sobre la propia imagen (scale 1.05 → 1.18, scrub 0.8). El CTA del masthead es **magnetic** (`elastic.out(1, 0.4)`, coeficiente 0.25 wrapper / 0.4 inner). Cursor follower brass con `mix-blend-mode: difference`. Todos los efectos con fallback `prefers-reduced-motion`."

Comparar con la versión vaga: *"haz un hero cinematográfico con cosas que se mueven al hacer scroll"*. La diferencia entre las dos formulaciones es la diferencia entre obtener el efecto al primer intento y entrar en cinco rondas de iteración.
