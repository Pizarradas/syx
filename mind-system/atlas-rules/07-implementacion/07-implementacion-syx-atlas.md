# 07 — Implementación (SYX Atlas)

## Naturaleza de este documento

Este documento define cómo llevar SYX Atlas a implementación real sin romper:

- el propósito del sistema
- los principios fundacionales
- el modelo mental
- el marco matemático
- la lógica editorial
- la integración contextual

No es una guía de código aislado.  
Es un marco para traducir sistema a front-end.

---

## Principio base

> La implementación no debe corregir el sistema.  
> Debe expresarlo.

---

## 1. La implementación como traducción

HTML, CSS y JS no deben inventar lógica.

Deben traducir:

- jerarquía
- proporción
- continuidad
- reglas editoriales
- comportamiento contextual

Si la implementación obliga a romper el sistema, el problema está en la arquitectura, no en el código.

---

## 2. Separación de niveles

La implementación debe distinguir claramente entre:

- estructura
- presentación
- comportamiento

Esto implica:

- HTML → significado y jerarquía
- CSS → relaciones visuales y espaciales
- JS → comportamiento e interacciones

Nunca mezclar responsabilidades por comodidad.

---

## 3. HTML como capa semántica

El HTML debe construir significado, no solo cajas.

Debe reflejar:

- jerarquía editorial
- agrupación lógica
- navegación clara
- relaciones entre bloques

### Regla
Si dos estructuras tienen distinta función, deben reflejarlo semánticamente.

---

## 4. CSS como sistema relacional

El CSS no debe ser una colección de estilos puntuales.

Debe expresar:

- escalas
- spacing
- grid continuo
- jerarquía
- reglas contextuales

### Regla
El CSS debe depender de tokens, relaciones y escalas, no de valores arbitrarios.

---

## 5. JavaScript como capa de comportamiento

JavaScript no debe compensar carencias estructurales.

Debe encargarse de:

- interacción
- estados
- adaptación de comportamiento
- enriquecimiento progresivo

### Regla
Si algo puede resolverse semánticamente o con CSS, no debe depender de JS.

---

## 6. Implementación continua, no por estados rígidos

La implementación no debe construirse como:
- versión mobile
- versión tablet
- versión desktop

Debe construirse como un sistema continuo.

### Implica
- relaciones fluidas
- escalado orgánico
- adaptación progresiva
- media queries solo como ajuste fino, no como base conceptual

---

## 7. Tokens como base de traducción

La implementación debe apoyarse en tokens para expresar:

- spacing
- tipografía
- tamaños
- densidad
- jerarquía
- color
- timing
- estados

### Regla
Todo valor repetible debe existir como token o derivarse de uno.

---

## 8. Componentes como expresión del sistema

Los componentes no son piezas aisladas.

Son manifestaciones del sistema en uso.

Deben ser:

- reutilizables
- predecibles
- proporcionales
- coherentes
- extensibles sin romper la base

---

## 9. Layouts como sistema, no como plantillas fijas

Los layouts no deben codificarse como páginas cerradas.

Deben construirse como combinaciones de reglas:

- grid
- jerarquía
- densidad
- flujo
- agrupación

### Regla
Una misma lógica debe servir para múltiples configuraciones editoriales.

---

## 10. Continuidad dimensional en código

La implementación debe favorecer:
- `clamp()`
- `min()`
- `max()`
- `calc()`
- `fr`
- `%`
- `rem`
- `svh`
- `lvh`
- `dvh`
- `aspect-ratio`
- grid y subgrid

### Regla
Evitar que el sistema dependa de anchos concretos para funcionar.

---

## 11. Spacing implementado como ritmo

El spacing no debe añadirse “a ojo”.

Debe salir de:
- escala definida
- tokens
- relaciones de jerarquía
- tipo de agrupación

### Regla
Toda separación debe poder explicarse por función y nivel.

---

## 12. Tipografía implementada como jerarquía

La tipografía debe responder a:
- escala proporcional
- contexto de uso
- continuidad dimensional
- densidad de contenido

### Regla
El tamaño tipográfico no debe decidirse por gusto, sino por función dentro de la jerarquía.

---

## 13. Publicidad como parte del front-end estructural

La implementación debe contemplar la publicidad desde el origen.

No debe añadirse al final como excepción.

### Implica
- espacios previstos
- reglas de inserción
- continuidad visual
- mantenimiento del flujo editorial

---

## 14. Accesibilidad como capa estructural

La accesibilidad no debe llegar al final como checklist.

Debe estar presente en la implementación desde el inicio.

### Debe cubrir
- semántica
- foco
- orden de navegación
- contraste
- estados
- interacción por teclado
- comportamiento comprensible

---

## 15. Rendimiento como propiedad del sistema

La implementación debe respetar rendimiento como parte de la calidad estructural.

### Implica
- evitar sobrecarga innecesaria
- minimizar lógica redundante
- limitar dependencias gratuitas
- controlar impacto de layout, tipografía, imágenes y JS

---

## 16. Escalabilidad técnica

La implementación debe permitir:
- crecer sin reescribirse
- incorporar nuevas piezas sin incoherencia
- soportar nuevos formatos editoriales
- adaptarse a nuevas plataformas

### Regla
Cada nueva pieza debe reforzar el sistema, no fragmentarlo.

---

## 17. Trazabilidad entre sistema y código

Toda implementación debe poder rastrearse así:

- principio
- regla
- decisión
- traducción técnica

### Regla
Si una decisión en código no puede vincularse a una regla del sistema, probablemente no debería existir.

---

## 18. Evitar sobreingeniería

La implementación debe ser rigurosa, no barroca.

Evitar:
- abstracciones innecesarias
- capas redundantes
- clases sin función clara
- JS para compensar mala estructura
- micro-soluciones irrepetibles

---

## 19. Prioridad de implementación

En caso de conflicto, la implementación debe obedecer este orden:

1. propósito del sistema
2. principios fundacionales
3. modelo mental
4. decisión estructural
5. implementación técnica

La técnica nunca debe imponerse a la lógica del sistema.

---

## 20. Reglas maduras heredadas de SYX que son obligatorias en ATLAS

Estas reglas ya están suficientemente maduras dentro de SYX y deben considerarse vinculantes en la implementación de ATLAS.

### 20.1. Jerarquía obligatoria de tokens
Toda implementación debe respetar la cadena:

`Primitive → Semantic → Component`

Nunca se deben usar tokens primitivos directamente en componentes o páginas.

### 20.2. Prohibición de valores crudos
No se deben hardcodear:
- colores hex
- OKLCH directos en componentes
- px/rem arbitrarios
- spacing manual repetible

Todo valor debe salir de tokens o derivarse de ellos.

### 20.3. Prohibición de saltarse la capa semántica
No usar `--primitive-*` en componentes.

Siempre mapear:
- primitivo → semántico
- semántico → componente
- componente → página o contexto

### 20.4. CSS sin `!important`
La gestión de especificidad debe resolverse con arquitectura y `@layer`, no con parches.

### 20.5. Uso obligatorio de mixins cuando existen
No declarar directamente propiedades que en SYX ya tienen mixin maduro, especialmente:
- `position`
- `transition`
- patrones recurrentes de layout
- utilidades estructurales

### 20.6. Nomenclatura estricta por nivel atómico
La implementación debe respetar prefijos coherentes por capa:
- `.atom-`
- `.mol-`
- `.org-`

No mezclar naming arbitrario entre capas.

### 20.7. Reutilización antes que creación
Antes de crear:
- un token
- un componente
- una variante

debe comprobarse si ya existe una solución válida.

### 20.8. Contratos y validación como parte de la implementación
La implementación no termina al escribir código.

Debe incluir validación contractual y revisión del estado del sistema.

### 20.9. `@layer` como base de la cascada
La cascada debe gestionarse arquitectónicamente.

Regla orientativa de stack:
- reset
- base
- tokens
- atoms
- molecules
- organisms
- utilities

### 20.10. IA guiada por registros del sistema
Cuando intervenga IA, la implementación debe consultar antes:
- registro de tokens
- registro de componentes
- reglas contractuales
- guías del sistema

La IA no debe improvisar por desconocimiento del inventario existente.

---

## 21. Regla final

Si el código funciona pero contradice el sistema:

→ no es una implementación correcta

---

## Cierre

Implementar no es “hacer que se vea”.

Implementar es traducir con precisión una lógica estructural a un entorno real.

---

## Lectura correcta de este documento

Este documento define cómo debe implementarse SYX Atlas sin degradarlo.

Los siguientes archivos desarrollarán esta implementación por capas, por ejemplo:

- HTML semántico
- CSS continuo y relacional
- JavaScript estructural
- tokens
- componentes
- patrones editoriales
