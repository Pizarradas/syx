# Strategic Writing for UX — Microcopy y escritura de interfaz

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UX — escritura de interfaz y microcopy |
| **Fuente** | Torrey Podmajersky — *Strategic Writing for UX* (O'Reilly, 2019) + convenciones de la industria |
| **Objetivo** | Reglas de escritura para labels, CTAs, mensajes de error, empty states y onboarding en SYX |
| **Agent tags** | `#ux` `#copy` `#microcopy` `#cta` `#errors` `#labels` |

---

## concepts

El microcopy no es decorativo — es funcional. Las palabras en una interfaz toman decisiones por el usuario (orientan la atención, reducen la ansiedad, comunican el estado del sistema). El mal microcopy genera friction, abandono y errores.

**El principio de escritura de interfaz:** cada palabra debe ganar su sitio. Si puede eliminarse sin pérdida de información, se elimina.

---

## rules

### 1. CTAs orientados al resultado
El botón de acción principal comunica qué obtiene el usuario, no qué hace el sistema.

```
✗ "Enviar"               → acción del sistema
✓ "Crear cuenta"         → resultado para el usuario

✗ "Confirmar"            → ambiguo
✓ "Confirmar pedido"     → resultado específico

✗ "Continuar"            → no dice a dónde
✓ "Ir a pago"            → destino explícito
```

**Regla práctica:** si el CTA puede ir en cualquier pantalla sin cambiar, es demasiado genérico.

---

### 2. Labels de formulario — descriptivos, no instructivos
Los labels describen qué es el campo, no cómo rellenarlo.

```
✗ "Introduce tu nombre completo"   → instructivo
✓ "Nombre completo"                → descriptivo

✗ "Por favor, escribe tu email"    → verboso
✓ "Email"                          → limpio

✗ "Contraseña (mínimo 8 caracteres)"  → en el label
✓ "Contraseña"  +  hint: "Mínimo 8 caracteres"  → separado correctamente
```

**La distinción label/hint/error:**
- **Label:** qué es el campo
- **Hint:** información necesaria para rellenarlo correctamente (siempre visible)
- **Error:** qué falló y cómo corregirlo (aparece al fallar la validación)

---

### 3. Mensajes de error — tres partes
Todo mensaje de error debe responder: qué pasó + por qué + cómo solucionarlo.

```
✗ "Error en el campo"              → no dice qué falló
✗ "Email inválido"                 → no dice cómo corregirlo
✓ "El email no tiene formato válido. Usa el formato usuario@dominio.com"
```

**Patrones de error por tipo:**

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Campo vacío | "El [campo] es obligatorio" | "El email es obligatorio" |
| Formato incorrecto | "El [campo] debe tener [formato]" | "El email debe tener formato usuario@ejemplo.com" |
| Fuera de rango | "[Campo] debe estar entre [min] y [max]" | "La edad debe estar entre 18 y 120" |
| No disponible | "[Elemento] ya está en uso. Prueba [alternativa]" | "Este email ya está registrado. ¿Quieres iniciar sesión?" |

---

### 4. Empty states — orientados a la acción
Los estados vacíos no son solo "No hay resultados". Son una oportunidad para orientar al usuario.

**Estructura de un empty state:**
1. Ilustración o icono (opcional, comunica el contexto)
2. Titular: qué está vacío y por qué
3. Cuerpo (opcional): contexto adicional
4. CTA: qué puede hacer el usuario ahora

```
✗ "No hay artículos guardados."
✓ "Todavía no has guardado ningún artículo.
   Guarda los artículos que más te interesen para leerlos más tarde.
   [Explorar artículos]"
```

**Para estados vacíos de búsqueda:**
```
✓ "No encontramos resultados para '[término de búsqueda]'.
   Prueba con palabras más generales o revisa la ortografía.
   [Ver todos los artículos]"
```

---

### 5. Onboarding — progressive disclosure de información
El onboarding eficiente revela información cuando el usuario la necesita, no todo de golpe.

- **Just-in-time:** el tooltip o hint aparece cuando el usuario llega al elemento, no en la pantalla inicial
- **Contextual:** el texto de ayuda aparece en el contexto de la acción, no en un modal de bienvenida
- **Accionable:** cada paso de onboarding termina con una acción concreta que el usuario puede hacer

---

### 6. Textos de confirmación
Cuando se completa una acción, el feedback debe confirmar el resultado, no la acción.

```
✗ "Tu solicitud ha sido enviada."           → confirma la acción
✓ "Tu cuenta está lista. Puedes empezar a publicar."  → confirma el resultado
```

**Para acciones con consecuencias:**
```
✓ "Se ha eliminado el artículo 'Título'. Esta acción no se puede deshacer. [Deshacer]"
```

---

### 7. Tonalidad
El tono de la interfaz debe ser consistente con la personalidad de la publicación, pero siempre:
- **Claro sobre ingenioso:** mejor entendido que gracioso
- **Honesto sobre optimista:** no ocultar limitaciones con eufemismos
- **Específico sobre genérico:** "5 artículos guardados" no "Tus artículos"

---

## checklist

- [ ] ¿Los CTAs comunican el resultado para el usuario, no la acción del sistema?
- [ ] ¿Los labels son descriptivos (no instructivos)?
- [ ] ¿Los hints están visibles siempre (no solo al hacer hover)?
- [ ] ¿Los mensajes de error tienen tres partes: qué, por qué, cómo?
- [ ] ¿Los empty states tienen un CTA que orienta al usuario?
- [ ] ¿Las confirmaciones confirman el resultado, no la acción?
- [ ] ¿El texto puede reducirse sin pérdida de información?
- [ ] ¿El tono es consistente en todos los componentes de la interfaz?
