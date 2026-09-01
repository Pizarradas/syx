# Perception of Prestige & Credibility — Rules

domain: perception
subdomain: prestige-and-credibility
depends_on: perception-of-prestige-foundations.md
objetivo: reglas operativas y checks para evaluar si un diseño o comunicación transmite prestigio y credibilidad
target: IA linter / auditor de diseño y comunicación visual
agent_tags: [ui, ux, branding, communication, visual-language, linter]
version: 1.0

---

## Instrucciones de uso

La IA debe aplicar estas reglas como checks sistemáticos al analizar un diseño, pantalla, marca, documento o pieza de comunicación. Para cada regla se indica:
- **Señal positiva** → el elemento comunica prestigio / credibilidad
- **Señal negativa** → el elemento erosiona la percepción de autoridad
- **Check** → la pregunta que la IA debe responder
- **Output** → cómo reportar si hay infracción

---

## Bloque 1 — Tipografía

### R-TYP-01: Jerarquía tipográfica
La jerarquía debe ser inmediatamente legible sin necesidad de leer el contenido.

- Señal positiva: diferencia de peso y tamaño clara entre título, subtítulo y cuerpo; máximo 2-3 familias tipográficas.
- Señal negativa: pesos similares en niveles distintos; más de 3 familias; tamaños arbitrarios sin escala.
- Check: ¿Es posible identificar los niveles de información solo por la forma, antes de leer?
- Output: "Jerarquía tipográfica ambigua — los niveles [X] y [Y] presentan contraste insuficiente. Esto elimina la señal de control y precisión."

### R-TYP-02: Espaciado tipográfico
El tracking y el leading generosos son marcadores de premium. El apretamiento señala prisa o descuido.

- Señal positiva: line-height ≥ 1.5 en cuerpo; letter-spacing ligeramente positivo en títulos en mayúsculas o display.
- Señal negativa: line-height < 1.4; tracking negativo en cuerpo; texto apiñado sin respiración.
- Check: ¿El texto tiene suficiente aire para leerse sin esfuerzo?
- Output: "Espaciado tipográfico insuficiente — comunica densidad y prisa. El uso de espacio generoso es una señal directa de control y premium."

### R-TYP-03: Elección tipográfica y contexto
La familia tipográfica debe activar la asociación correcta según el registro de la marca.

- Señal positiva: serif para autoridad/herencia/lujo; sans-serif geométrica para precisión/tecnología/modernidad; alineación entre tipografía y propósito.
- Señal negativa: tipografía genérica de sistema (Arial, Times New Roman sin intención); mezcla de registros incongruentes (ej. decorativa + técnica).
- Check: ¿La tipografía aporta o neutraliza la percepción de autoridad?
- Output: "La familia tipográfica [X] no activa el registro esperado de [autoridad/precisión/herencia]. Considerar [alternativa]."

---

## Bloque 2 — Espacio en blanco

### R-SPC-01: Densidad general
Un layout saturado señala ansiedad; uno espacioso señala dominio.

- Señal positiva: márgenes amplios, padding generoso en componentes, secciones con respiración entre ellas.
- Señal negativa: elementos pegados a los bordes; padding < 16px en componentes visibles; secciones sin separación clara.
- Check: ¿El layout necesita más información para justificarse, o confía en lo que ya tiene?
- Output: "Densidad excesiva en [zona]. El espacio en blanco insuficiente comunica falta de control. Recomendado: aumentar padding/margin en [componente/sección]."

### R-SPC-02: Uso intencional del espacio
El espacio vacío debe ser activo, no residual. Si parece un error, no está bien usado.

- Señal positiva: el espacio vacío guía la mirada hacia el elemento principal; se percibe como decisión, no como olvido.
- Señal negativa: el espacio aparece de forma irregular o asimétrica sin razón visual; parece que "falta algo".
- Check: ¿El espacio vacío tiene dirección y propósito?
- Output: "El espacio en [zona] parece residual, no intencional. Revisar si cumple función de guía de atención o si debe reducirse."

---

## Bloque 3 — Color

### R-COL-01: Tamaño de paleta
Una paleta reducida señala criterio; una paleta extensa señala falta de sistema.

- Señal positiva: ≤ 5 colores de marca bien definidos; uso consistente de cada uno según su rol semántico.
- Señal negativa: más de 6 colores sin jerarquía; colores similares sin diferenciación de rol; colores de acento usados como fondo.
- Check: ¿Cada color tiene un rol semántico claro y se respeta en todo el sistema?
- Output: "Paleta extendida o inconsistente — [N] colores detectados sin rol definido. Reducir y sistematizar. Una paleta contenida es señal de control y madurez."

### R-COL-02: Asociaciones cromáticas de prestigio
Los colores transmiten asociaciones culturales directas y preconscientes.

- Negro / blanco → atemporalidad, poder, sofisticación
- Oro / metálico → éxito, riqueza, logro
- Azul profundo → confianza, estabilidad, autoridad institucional
- Rojo saturado → urgencia, energía (bajo valor de prestigio en contextos neutros)
- Colores de alta saturación múltiple → bajo valor de credibilidad en contextos formales

- Check: ¿Los colores elegidos activan las asociaciones esperadas para el nivel de prestigio objetivo?
- Output: "El color [X] activa la asociación [Y], que entra en tensión con el registro de [credibilidad/lujo/autoridad] objetivo."

### R-COL-03: Contraste y accesibilidad como señal de cuidado
Un contraste deficiente no solo es un problema de accesibilidad: señala falta de atención al detalle.

- Señal positiva: contraste texto/fondo ≥ 4.5:1 (WCAG AA) en todos los textos funcionales.
- Señal negativa: texto gris claro sobre blanco; texto sobre imagen sin overlay; colores de baja legibilidad usados para información crítica.
- Check: ¿Todo el texto es legible sin esfuerzo en cualquier contexto de uso?
- Output: "Contraste insuficiente en [elemento] — ratio [X]:1, mínimo recomendado 4.5:1. Además de accesibilidad, esto señala descuido en los detalles."

---

## Bloque 4 — Consistencia sistémica

### R-SYS-01: Coherencia visual entre componentes
Una inconsistencia puntual destruye la percepción de sistema controlado.

- Señal positiva: border-radius, sombras, colores y tipografías son idénticos en componentes equivalentes.
- Señal negativa: botones con border-radius distinto en diferentes pantallas; sombras con opacidad o blur diferente; colores de estado con tonos ligeramente distintos.
- Check: ¿Todos los componentes del mismo tipo son visualmente idénticos?
- Output: "Inconsistencia detectada en [componente] — [propiedad] varía entre instancias. Esto introduce duda sobre el nivel de control del sistema."

### R-SYS-02: Coherencia tonal en comunicación verbal
El tono de voz debe mantenerse con la misma precisión que el sistema visual.

- Señal positiva: mismo registro formal/informal en todos los textos de interfaz; terminología consistente para los mismos conceptos.
- Señal negativa: mezcla de tuteo y ustedeo; término "guardar" en unas pantallas y "salvar" en otras; tono formal en UI y coloquial en onboarding.
- Check: ¿El tono y la terminología son consistentes en todos los puntos de contacto textuales?
- Output: "Inconsistencia tonal en [contexto] — [ejemplo]. La incoherencia verbal erosiona la credibilidad igual que la inconsistencia visual."

---

## Bloque 5 — Señales de autoridad

### R-AUT-01: Prueba social estructural
Ser referenciado por terceros es más creíble que la auto-proclamación.

- Señal positiva: clientes reconocibles visibles; testimonios con nombre, cargo y empresa; menciones en medios o instituciones; número de usuarios/proyectos con contexto.
- Señal negativa: afirmaciones sin respaldo ("somos los mejores"); cifras sin fuente; testimonios anónimos o sin contexto.
- Check: ¿Las afirmaciones de calidad o experiencia están respaldadas por terceros verificables?
- Output: "Afirmación sin respaldo en [sección]: '[texto]'. La auto-proclamación sin prueba social reduce la credibilidad. Añadir referencia externa verificable."

### R-AUT-02: Precisión del lenguaje como señal de expertise
El vocabulario específico y preciso activa la percepción de conocimiento profundo.

- Señal positiva: terminología del dominio usada correctamente; afirmaciones específicas con datos concretos; ausencia de vaguedades.
- Señal negativa: términos genéricos ("solución innovadora", "calidad excepcional"); números redondos sin contexto; adjetivos sin sustancia ("el mejor", "único").
- Check: ¿El lenguaje demuestra conocimiento del dominio o solo lo declara?
- Output: "Lenguaje vago en [sección]: '[texto]'. Reemplazar por afirmación específica y verificable que demuestre expertise."

### R-AUT-03: Credenciales y señales de posición
Los símbolos de autoridad activan deferencia automática (heurístico de autoridad, Cialdini).

- Señal positiva: certificaciones relevantes visibles; aparición en medios de referencia del sector; afiliaciones a instituciones reconocidas; años de experiencia con contexto.
- Señal negativa: ausencia total de credenciales; credenciales irrelevantes para el dominio; exceso de auto-titulación sin validación externa.
- Check: ¿Existen señales de posición reconocibles que el usuario pueda usar como atajo de confianza?
- Output: "Señales de autoridad ausentes o insuficientes en [sección]. Sin anclaje externo de credibilidad, el usuario no tiene atajos de confianza."

---

## Bloque 6 — Detalle y microejecución

### R-DET-01: Alineación y grid
La precisión geométrica comunica cuidado sistémico. Lo que está fuera de grid parece error.

- Señal positiva: todos los elementos alineados a un grid explícito; márgenes simétricos; elementos relacionados en el mismo eje visual.
- Señal negativa: elementos con alineación manual inconsistente; márgenes asimétricos sin razón compositiva; grupos de elementos sin eje compartido.
- Check: ¿Todo elemento tiene una razón de posición dentro del grid?
- Output: "Alineación fuera de grid en [componente/zona]. Los desajustes de alineación señalan falta de sistema y erosionan la percepción de precision."

### R-DET-02: Microinteracciones y feedback de sistema
Las interacciones pequeñas señalan que el nivel de cuidado se extiende a todo el sistema.

- Señal positiva: feedback inmediato en acciones del usuario (hover, focus, loading, success, error); transiciones suaves entre estados; mensajes de error precisos y accionables.
- Señal negativa: estados sin feedback visual; errores genéricos ("Algo fue mal"); transiciones bruscas o ausentes; loading sin indicador.
- Check: ¿Todos los estados interactivos tienen respuesta visual clara e inmediata?
- Output: "Estado [X] en [componente] carece de feedback visual. La ausencia de respuesta genera duda sobre si el sistema está funcionando correctamente."

### R-DET-03: Imágenes y activos visuales
Los activos de baja calidad destruyen la percepción premium instantáneamente.

- Señal positiva: imágenes en alta resolución; fotografías coherentes en estilo, temperatura de color y composición; ilustraciones con trazo consistente.
- Señal negativa: imágenes pixeladas o mal comprimidas; stock genérico y reconocible como tal; mezcla de estilos fotográficos o ilustrativos sin criterio.
- Check: ¿Los activos visuales refuerzan o contradicen el nivel de credibilidad que el resto del sistema comunica?
- Output: "Activo visual de baja calidad o inconsistente en [sección]. Los activos deficientes anulan el trabajo del resto del sistema de diseño."

---

## Bloque 7 — Señales de escasez y exclusividad

### R-ESC-01: Contención en el mensaje
Decir menos crea más intriga. La sobreexplicación señala inseguridad.

- Señal positiva: mensajes cortos, directos y confiados; ausencia de justificaciones no solicitadas; CTA sin presión innecesaria.
- Señal negativa: párrafos largos justificando el valor del producto; múltiples CTAs compitiendo; urgencia fabricada y obvia ("¡Solo quedan 3!").
- Check: ¿El sistema confía en sí mismo o necesita convencer en exceso?
- Output: "Sobreexplicación en [sección] — [ejemplo]. La verborrea defensiva señala inseguridad. Reducir a la afirmación esencial."

### R-ESC-02: Exclusividad estructural
La percepción de acceso limitado aumenta el valor percibido (loss aversion).

- Señal positiva: acceso selectivo comunicado con naturalidad; waitlists o procesos de aplicación como señal de demanda; sin sensación de disponibilidad masiva e inmediata.
- Señal negativa: disponibilidad ilimitada sin ningún filtro; comunicación de urgencia artificial evidente; descuentos permanentes que normalizan el precio reducido.
- Check: ¿El sistema comunica que no cualquiera puede acceder, o que está disponible para todos sin criterio?
- Output: "Ausencia de señal de exclusividad — el sistema comunica disponibilidad total sin fricción. Considerar si esto está alineado con el nivel de prestigio objetivo."

---

## Orden de prioridad para auditoría

La IA debe aplicar los checks en este orden, de mayor a menor impacto en la percepción global:

1. R-SYS-01 — Consistencia visual (un solo error aquí destruye todo el sistema)
2. R-SPC-01 — Densidad general (primera impresión, pre-cognitiva)
3. R-TYP-01 — Jerarquía tipográfica (estructura de la información)
4. R-COL-01 — Tamaño de paleta (señal de control o caos)
5. R-DET-02 — Microinteracciones (señal de cuidado sistémico)
6. R-AUT-01 — Prueba social (credibilidad externa)
7. R-TYP-02 — Espaciado tipográfico (refinamiento)
8. R-COL-03 — Contraste y accesibilidad (detalle de cuidado)
9. R-AUT-02 — Precisión del lenguaje (expertise)
10. R-ESC-01 — Contención del mensaje (confianza en sí mismo)

---

## Output template para reporte de auditoría

```
## Auditoría de Percepción: [Nombre del elemento auditado]

### Infracciones detectadas

| Regla | Severidad | Elemento afectado | Descripción | Recomendación |
|-------|-----------|-------------------|-------------|---------------|
| R-TYP-01 | Alta | Cabecera principal | Jerarquía ambigua entre h1 y h2 | Aumentar diferencia de peso y tamaño |
| R-SPC-01 | Media | Card de producto | Padding insuficiente (8px) | Mínimo recomendado: 16-24px |

### Señales positivas detectadas

- [Lista de elementos que sí comunican prestigio correctamente]

### Diagnóstico global

[Evaluación breve: ¿el sistema en conjunto transmite credibilidad y autoridad, o hay tensiones que lo anulan?]
```
