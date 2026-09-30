# Principios de animación por medio

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — teoría · principios clásicos y contemporáneos |
| **Fuente** | Johnston & Thomas — *The Illusion of Life*; IxDF; userinterface.wiki; Adobe; JR Canest (VMG Studios); Carnegie Mellon 15-462; Figma; Apple |
| **Objetivo** | Usar los principios como herramientas de decisión, traducidos a UI, vídeo y 3D |
| **Agent tags** | `#motion` `#principles` `#disney` `#animation` |

---

## concepts

Origen: Ollie Johnston y Frank Thomas, *The Illusion of Life* (1981). La adaptación a UI viene de IxDF y userinterface.wiki; a vídeo, de Adobe; a motion design, de JR Canest (VMG Studios). Richard Williams (*The Animator's Survival Kit*) es la referencia de oficio para timing, spacing, poses y ciclos.

> Bien usada, la animación reduce la carga cognitiva, añade personalidad y salva barreras de idioma. Mal usada, distrae o marea.

---

## rules

### Los 12 principios

| # | Principio | En UI | En motion graphics / vídeo | En 3D | Valores o reglas |
|---|---|---|---|---|---|
| 1 | **Squash & stretch** | Indica peso y cuánto se puede tocar algo (botón que se comprime al pulsar) | Impactos, rebotes, logos que "caen" | Deformadores / lattice | Volumen constante: `scaleX × scaleY ≈ 1`. En UI, sutil: press a 0,96–0,98 |
| 2 | **Anticipation** | Un hover que avisa de que algo es interactivo; pequeño retroceso antes de salir | Movimiento breve en sentido contrario antes del principal | Retroceso de cámara o de objeto | Bezier con y1 < 0 (wind-up). En UI, anticipación ≤ 10 % de la distancia y ≤ 20 % del tiempo |
| 3 | **Staging** | Animar solo lo importante; reducir lo que compite | Composición, contraste, cámara, zoom, opacidad, escala | Encuadre, iluminación, profundidad de campo | Un foco de atención por beat |
| 4 | **Straight ahead / pose to pose** | Pose to pose: definir estados e interpolar | Ambos; straight ahead para efectos orgánicos (fuego, líquido) | Keys + breakdowns | Pose to pose = estados de una state machine |
| 5 | **Follow through & overlapping** | Los elementos relacionados se mueven a ritmos distintos y eso crea jerarquía (imagen → título → descripción) | Las capas hijas van unos frames por detrás de la padre | Cadenas de huesos, cola, pelo, tela | Offset de 2–4 frames a 24/25 fps; en UI 30–60 ms. Los parámetros no empiezan ni acaban a la vez |
| 6 | **Slow in / slow out** | Sin easing, el movimiento parece robótico | Editor de curvas | Graph Editor | Ver `easing.md` |
| 7 | **Arcs** | Trayectorias curvas (dock de macOS, FAB que se expande en arco) | Motion paths curvos | Rotaciones en cadena | Si se mueve en X e Y a la vez, desfasa el easing de cada eje (curve motion) |
| 8 | **Secondary action** | Confeti al completar algo largo; icono que late | Partículas, destellos, capas de apoyo | Rig secundario | Nunca antes que la acción principal, y siempre de menor amplitud |
| 9 | **Timing** | La velocidad informa (un archivo grande tarda más) | Nº de frames = velocidad, peso, tono. Rápido = urgencia; lento = peso o drama | Igual | Ver `timing.md` |
| 10 | **Exaggeration** | Moderada; se reserva para momentos de éxito o error | Amplificar la idea sin romper la inmersión | Idem | Cuanto más frecuente es la interacción, menos exageración |
| 11 | **Solid drawing** | Sombras, capas, perspectiva y skew para dar profundidad (elevación) | Volumen, luz coherente | Nativo | Las sombras acompañan a la elevación |
| 12 | **Appeal** | Carisma coherente con la marca | Diseño y personalidad | Idem | Lo decide `motion/03-creativa/` |

### Los 10 principios del motion design (JR Canest)

"El tiempo es la cuarta dimensión del diseño gráfico."

1. **Timing, spacing y ritmo**, incluida la sincronía con el audio.
2. **Eases**, controlados desde el editor de curvas (no con presets a ciegas).
3. **Masa y peso**: frenar un coche real cuesta más que frenar un Hot Wheels. La masa alarga las aceleraciones.
4. **Anticipación**.
5. **Arcos**.
6. **Squash, stretch y smears**: el smear es la deformación o estela en un frame de máxima velocidad, que sustituye al motion blur en estilos gráficos.
7. **Follow through y overlapping**: los parámetros no empiezan ni acaban a la vez.
8. **Exageración**.
9. **Animación secundaria y por capas**.
10. **Appeal**.

### Principios añadidos del motion contemporáneo (Figma, Apple)

- **Hold**: pausa para que el espectador registre lo que ha pasado. En vídeo, 6–12 frames tras un impacto; en UI, un breve estado de éxito antes de cerrar.
- **Settle**: el pequeño asentamiento final (micro-overshoot o spring de bounce bajo).
- **Overshoot**: pasarse del destino y volver. Bezier con y2 > 1, o spring con bounce > 0.
- **Continuidad de velocidad**: posición y velocidad continuas. Lo lineal provoca saltos de velocidad al empezar y terminar (salvo en loops).
- **Match cut**: cortar en el punto de máxima velocidad para que el movimiento continúe a través del corte.
- **Referencias**: la naturaleza, el montaje de cine y el arte gestual, más que las modas.

### Pipeline clásico (CMU 15-462), útil para piezas largas

Guion → storyboard → animatic → modelado y rigging → key animation → in-betweens → VFX → composición → corrección de color.

- **In-betweens por subdivisión**: entre los keys 1 y 9, primero el 5 (breakdown), luego el 3 y el 7. El breakdown define el carácter del arco.
- Otros conceptos: onion skinning, capas (boceto, línea, color, sombra, luz) y rotoscopia.
- ⚠️ Las diapositivas de CMU usan la convención **inversa** de ease-in y ease-out. En este sistema: **ease-in = acelera al principio (lento → rápido); ease-out = frena al final (rápido → lento).**

---

## checklist

- [ ] Se identificó qué principio falta o sobra antes de tocar valores
- [ ] La exageración es inversa a la frecuencia de la interacción
- [ ] Ease-in = acelera al principio; ease-out = frena al final (no la convención de CMU)
