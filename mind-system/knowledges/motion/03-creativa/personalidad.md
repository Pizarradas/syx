# Personalidades de movimiento

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — creativa · arquetipos y traducción a parámetros |
| **Fuente** | Síntesis propia sobre Apple (springs), Material 3, Carbon y la práctica de motion design |
| **Objetivo** | Dar puntos de partida de carácter y traducir adjetivos y materiales a curvas, springs y duraciones |
| **Agent tags** | `#motion` `#personality` `#archetypes` `#character` |

---

## concepts

Son puntos de partida, no recetas. Los valores son **orientativos** y se fijan después como tokens o como excepciones documentadas. Duración base = transición UI de tamaño medio.

| Arquetipo | Energía | Peso | Elast. | Precis. | Formal. | Curva base | Spring | Duración base | Rasgos |
|---|---|---|---|---|---|---|---|---|---|
| **Preciso** (fintech, pro tools) | 3 | 2 | 1 | 5 | 4 | (0.2, 0, 0, 1) | ζ=1, 300 ms | 200–250 ms | Sin rebote, simetría, sincronía, stagger mínimo |
| **Amable** (salud, servicios) | 2 | 2 | 2 | 3 | 3 | Sine/Quad in-out | bounce 0,1, 400 ms | 300–400 ms | Fades largos, desplazamientos cortos, nada brusco |
| **Enérgico** (deporte, social) | 5 | 3 | 3 | 3 | 2 | Expo out (0.16, 1, 0.3, 1) | bounce 0,2, 300 ms | 150–250 ms | Cortes en el beat, smears, contraste de tempo |
| **Lujoso** (moda, premium) | 1 | 3 | 1 | 4 | 5 | Quint in-out lenta | ζ=1, 700 ms | 600–1200 ms | Holds largos, máscaras, poco desplazamiento, mucho aire |
| **Lúdico** (infantil, juego, consumo) | 4 | 2 | 5 | 1 | 1 | Back out (0.34, 1.56, 0.64, 1) | bounce 0,35, 450 ms | 300–500 ms | Squash & stretch, anticipación, secondary action |
| **Técnico** (dev tools, datos) | 3 | 1 | 1 | 5 | 3 | Cubic out, lineales en datos | ζ=1, 250 ms | 150–250 ms | Steps, contadores, grids, precisión de píxel |
| **Editorial** (medios, revista) | 2 | 3 | 1 | 4 | 4 | Quart in-out | ζ=1, 500 ms | 400–700 ms | Máscaras tipográficas, reveals por línea, ritmo de lectura |
| **Orgánico** (sostenibilidad, bienestar) | 2 | 2 | 3 | 1 | 2 | Sine in-out | bounce 0,15, 600 ms | 500–900 ms | Noise sutil, respiración, arcos, overlap amplio |

---

## rules

### Adjetivos → ajustes

| Si piden… | Ajusta |
|---|---|
| más **ágil / snappy** | duración −20–30 %, curva out más agresiva (Quart → Expo), sin anticipación |
| más **suave / smooth** | curvas Sine/Quad, overlap mayor, bounce 0 |
| más **premium** | más lento, menos desplazamiento, holds, máscaras en lugar de slides |
| más **divertido** | bounce 0,25–0,35, squash, secondary action, anticipación |
| más **serio** | eliminar el rebote, sincronía y simetría, stagger mínimo |
| más **natural** | arcos, desfases entre ejes, follow-through, curvas asimétricas |
| más **impactante** | contraste de tempo (hold → golpe rápido), smear, micro-shake al impacto, sonido |
| más **ligero** | menos masa: arranques rápidos, fades, escalas pequeñas |
| más **pesado** | anticipación, ease-in largo, parada con settle, sombra y squash al aterrizar |

### Materiales → física

| Material | Curva/spring | Principios |
|---|---|---|
| Papel | ease-in-out; ζ ≈ 1 | Pliegues por ejes, sombra que crece al levantarse |
| Goma | bounce 0,3–0,5 | Squash & stretch con volumen constante |
| Líquido | bounce 0,1–0,2, follow-through largo | Ondas, overshoot suave, deformación continua |
| Metal | ease-in largo + parada con micro-rebote rápido (alta rigidez) | Masa, inercia, sonido |
| Luz | linear en intensidad; Expo out en posición | Bloom, trails |
| Humo o tinta | noise + velocidad decreciente | Straight ahead, disolución |
| Cristal | Quart out, parada limpia | Destello puntual, refracción |

---

## checklist

- [ ] El arquetipo es un punto de partida, no una receta
- [ ] Los valores se fijan después como tokens o como excepción documentada
- [ ] Cada adjetivo pedido se tradujo a un ajuste concreto
