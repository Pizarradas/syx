# Brief de motion

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — dirección · preguntas de arranque y checklists |
| **Fuente** | Síntesis propia del sistema; Austin Shaw — *Design for Motion* |
| **Objetivo** | Reunir solo la información que falta antes de diseñar movimiento, y verificar el arranque y la salida |
| **Agent tags** | `#motion` `#brief` `#checklist` |

---

## concepts

Un brief de motion se hace con las preguntas que faltan, no con todas. Tres son imprescindibles; el resto depende del caso. Las dos listas de comprobación de este módulo son el portal de entrada y de salida del recorrido completo de `motion/01-direccion/direccion.md`.

---

## rules

### Preguntas de brief (elige solo las que falten)

**Imprescindibles**
1. ¿Dónde vive? Medio, plataforma y herramienta de destino.
2. ¿Qué tiene que entender o sentir quien lo ve? Mensaje en una frase.
3. ¿Qué carácter? Tres adjetivos, o una referencia ("como Stripe", "como un anuncio de Apple", "como un cartoon de los 40").

**Según el caso**
4. ¿Con qué frecuencia se verá? (Alta frecuencia exige menos expresividad.)
5. ¿Existe ya un sistema de motion o tokens? ¿Hay que respetarlo o se puede proponer uno?
6. ¿Hay audio o música? BPM, beats clave, locución.
7. ¿Duración máxima o formato? (Social: 6 s, 15 s, 30 s; relaciones de aspecto 9:16, 1:1, 16:9.)
8. ¿Restricciones técnicas? Peso del asset, rendimiento, navegadores, player de Lottie o runtime de Rive.
9. ¿Público con necesidades específicas? Sector salud, infantil, personas mayores: más contención.

---

## checklist

### Checklist antes de implementar (recorrido completo)

- [ ] Propósito declarado y superada la prueba `if_removed`
- [ ] Carácter en ejes (energía, peso, elasticidad, precisión, formalidad)
- [ ] Patrón de transición o estructura narrativa elegida
- [ ] Valores ligados a tokens (o excepción documentada)
- [ ] Duración total en el peor escenario calculada y con tope
- [ ] Variante de movimiento reducido definida
- [ ] Destellos ≤ 3/s; si hay contenido que se mueve solo más de 5 s, tiene control de pausa
- [ ] Comportamiento ante interrupción definido (UI)
- [ ] Criterios de aceptación verificables

### Checklist de salida

- [ ] Revisado con `motion/09-critica/` (a 1x, a 0,25x y frame a frame en los extremos)
- [ ] `implementation_notes` rellenadas si hubo aproximaciones
- [ ] Variante reducida probada de verdad (media query o flag activos)
