# 04 — Resolución de conflictos

Cuando una regla de Modes y una regla de Atlas parecen contradecirse, aplicar este orden. Los dos primeros pasos no son arbitrajes: son comprobaciones de que hay algo que arbitrar.

```
0. ¿El conflicto es sobre quién puede ESCRIBIR algo?
   → No hay conflicto. Manda `contracts/trust.json`, y no lo discute
     ningún documento — tampoco este. Preguntar `classify_change`.

1. ¿La regla de Atlas pide algo que R01–R08 prohíbe?
   → No hay conflicto. Manda el contrato, verificado por `npm run validate`.
     Lo que hay es una regla Atlas escrita sin conocer el contrato:
     corregirla, no aplicarla.

2. ¿Es un conflicto técnico de implementación SCSS?
   → Modes prevalece.

3. ¿Es un conflicto de decisión editorial (nivel, jerarquía, densidad, zona,
   proporción, publicidad)?
   → Atlas prevalece. Es su dominio y no existe en Modes.

4. ¿Es un conflicto de accesibilidad?
   → El estándar más estricto prevalece (generalmente UX mode, que cita WCAG).

5. ¿Es un conflicto de naming de tokens?
   → Modes prevalece (ver 03-domains.md, tabla de puente de tokens).

6. ¿Es un conflicto de formato de color?
   → OKLCH para SCSS (Modes). Hex para POC Atlas standalone.
```

Si el conflicto no encaja en ninguno de estos siete casos → **escalar**. No resolver de forma implícita. Señalar el conflicto y documentarlo en `atlas-rules/11-gobierno/11.0-arbitraje-principios.md`.

---

## La asimetría, dicha en voz alta

Los pasos 0 y 1 existen porque la formulación anterior de este sistema — *«cuando hay conflicto entre una regla de modo SYX y una regla Atlas, Atlas prevalece»* — era demasiado ancha. Leída al pie de la letra, ponía un documento markdown por encima de un contrato verificado por máquina, e incluía la nomenclatura de tokens y la arquitectura de carpetas. Un agente obediente podía usarla para saltarse R01 con la conciencia tranquila.

La autoridad de Atlas es real, y es de dominio, no de rango:

- **Atlas manda donde Modes no llega**: qué construir, con qué jerarquía editorial, con qué densidad, en qué zona. Ahí no hay competencia, hay reparto.
- **Atlas no manda donde hay una máquina comprobando**: R01–R08, `trust.json`, el bloque `Trust` de un modo. Ahí un desacuerdo no es un empate a resolver, es un error a corregir en el lado de Atlas.

La escalera completa de precedencia está en `../README.md`.
