# Modelo mental de GSAP

## Idea central

GSAP puede entenderse como un sistema que controla **qué cambia**, **cuándo cambia**, **qué lo activa** y **qué efecto narrativo produce**. Ese marco ayuda a pasar de una descripción vaga como "algo elegante que entra" a una formulación mucho más precisa.

## Capas mentales

| Capa | Pregunta | Ejemplos |
|---|---|---|
| Transformación | ¿Qué cambia? | Opacidad, posición, escala, rotación, shape, texto |
| Temporalidad | ¿Cómo cambia? | Tween, timeline, overlap, stagger, scrub |
| Disparo | ¿Qué lo activa? | Load, hover, click, viewport, scroll |
| Función narrativa | ¿Para qué sirve? | Revelado, énfasis, transición, comparación, continuidad |

## Regla práctica

Cuando cueste nombrar un efecto, conviene definirlo como **función perceptiva + mecánica GSAP + modo de control**. Por ejemplo: "revelado progresivo con stagger por viewport" o "capítulo fijado con scrub y snap".

## Por qué importa este modelo

Una solicitud sin estas cuatro capas produce código genérico. Con ellas, produce el efecto exacto.

| Solicitud vaga | Solicitud completa |
|---|---|
| "haz que el título aparezca" | "revelado letra por letra con stagger 0.02s, easing expo.out, disparado al cargar" |
| "anima la galería" | "máscara vertical desde top, escala 1.18 → 1.0 simultánea, disparado al entrar en viewport, una vez" |
| "que el scroll mueva esto" | "scrub 0.4 sobre la curva del path con stroke-dashoffset 1 → 0, pin de la sección durante el progreso" |
