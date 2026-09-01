# size-models-checklist

## meta

- dominio: `front`
- fuente: `size-models.md`
- objetivo: ofrecer una checklist breve para validar decisiones de tamaños (tipos y espacios) en bocetos y componentes.
- agent_tags: `front`, `ui`, `design-system`, `layout`, `typography`

---

## checklist

### Modelo general

- [ ] ¿Se ha elegido y documentado un tamaño base \(b\) (p. ej. 16 px) para tipografía?  
- [ ] ¿La escala tipográfica se obtiene con una fórmula clara (modular, áurea o métrica) y no como lista ad‑hoc?  
- [ ] ¿Los tokens de tamaño están indexados (p. ej. `font-size.-1`, `font-size.0`, `font-size.1`)?  
- [ ] ¿Existe una unidad de espaciado \(u\) (4 u 8 px) y todos los espacios son múltiplos de \(u\)?

### Tipografía

- [ ] ¿La jerarquía de textos (captions, body, headings) sigue la misma escala (mismo ratio \(r\))?  
- [ ] ¿Los tamaños extremos (muy pequeños / muy grandes) siguen perteneciendo a la escala y no son excepciones arbitrarias?  
- [ ] ¿Las alturas de línea se relacionan con el tamaño de fuente (por ejemplo, en pasos de la unidad \(u\))?

### Espaciado y layout

- [ ] ¿Márgenes, paddings y gaps de grid usan tokens `space(n)` basados en \(u\)?  
- [ ] ¿Los componentes reutilizan combinaciones coherentes de tipografía + espaciado (no hay “snowflakes”)?  
- [ ] ¿Las relaciones entre ancho de contenido y aside/columna siguen una proporción definida (ej. razón fija o número áureo)?

### Coherencia de sistema

- [ ] ¿Los tokens de tamaño y espaciado están documentados en un único lugar (`size-models.md` + tabla de tokens)?  
- [ ] ¿Nuevos componentes proponen tamaños en términos de `font-size(n)` y `space(k)`, no en píxeles sueltos?  
- [ ] ¿Se revisan periódicamente los modelos cuando cambia el tamaño base \(b\) o la densidad del producto?

Si hay varios “no”, revisar primero `size-models.md` antes de introducir nuevas excepciones de tamaño.