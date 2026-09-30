# Lenguaje de motion de marca

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — creativa · plantilla de identidad en movimiento |
| **Fuente** | Síntesis propia; IBM Carbon (productive/expressive); Material 3 Expressive |
| **Objetivo** | Fijar un conjunto pequeño de decisiones firmes que hagan reconocible una marca por cómo se mueve |
| **Agent tags** | `#brand` `#motion` `#motion-signature` `#identity` |

---

## concepts

Un lenguaje de motion de marca cabe en una página: principio rector, movimiento firma, curvas propias, escala de tiempos, reglas de coreografía, lo que nunca se hace y el modo reducido.

### En SYX

Es el eje **motion** de los siete que decide BRAND. Las curvas `brand.*` y el multiplicador de tiempos no se escriben como tokens nuevos por su cuenta: se expresan como redefinición de `--semantic-duration-*` y `--semantic-easing-*` en el `_theme.scss` del tema (que `_motion.scss` ya prevé), y lo que no exista se pide a TOKEN.

---

## rules

### Plantilla

```markdown
# [Marca] — Motion Language v1

## Principio rector
Una frase que cualquiera del equipo pueda recordar.
> "Energía contenida: todo arranca con decisión y se asienta con calma."

## Carácter
Ejes 1–5: energía _, peso _, elasticidad _, precisión _, formalidad _
Estilos: productive (producto) · expressive (campañas, onboarding, éxito)
Arquetipo de partida: [ver motion/03-creativa/personalidad.md] + desviaciones

## Metáfora y material
Verbo principal: ___   Material: ___
Cómo se traduce: ___

## Movimiento firma
1. Nombre: "El pliegue"  → qué es, dónde se usa, spec (mini-spec)
2. (opcional)

## Curvas propias (se exportan como tokens)
- brand.enter    cubic-bezier(...)  → entradas
- brand.exit     cubic-bezier(...)  → salidas
- brand.standard cubic-bezier(...)  → movimientos en pantalla
- brand.spring   {duration, bounce} → interacciones físicas

## Escala de tiempos
Ajuste sobre los tokens base: ×0,9 (más ágil) / ×1,2 (más pausado)

## Coreografía
Dirección: ___   Orden: ___   Stagger: each __ ms, tope __ ms

## Tipografía en movimiento
Unidad por defecto: palabra/línea · Reveal: máscara/fade · Nunca: ___

## Logo en movimiento
Construcción, resolución, versiones de duración (1 s, 3 s, 6 s), versión estática equivalente

## Sonido (si aplica)
Firma sonora, acentos, relación con el movimiento

## Nunca hacemos
- ___
- ___

## Modo reducido
Cómo se reconoce la marca sin movimiento espacial: color, fundido, tipografía, sonido

## Aplicaciones de referencia
UI (3 ejemplos) · Social (1) · Vídeo (1) · Rive (1)
```

### Criterios de calidad de un lenguaje de motion

- **Reconocible**: con el logo tapado, ¿se identifica la marca por cómo se mueve?
- **Escalable**: ¿funciona desde un toggle hasta un spot de 30 s?
- **Accesible**: ¿tiene un modo reducido que siga siendo de la marca?
- **Implementable**: ¿cada decisión tiene token o spec, y se traduce a todas las herramientas del stack?
- **Breve**: si no cabe en una página, nadie lo aplicará.

---

## checklist

- [ ] Con el logo tapado, la marca se reconoce por cómo se mueve
- [ ] Funciona desde un toggle hasta una pieza de 30 s
- [ ] Tiene modo reducido que sigue siendo de la marca
- [ ] Cada decisión tiene token o spec
- [ ] Cabe en una página
