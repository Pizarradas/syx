# Microinteractions — Diseño de estados y feedback de interacción

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UX — diseño de interacción a nivel micro |
| **Fuente** | Dan Saffer — *Microinteractions: Designing with Details* (O'Reilly, 2013) |
| **Objetivo** | Fundamentar el inventario de estados en componentes SYX y el diseño de feedback |
| **Agent tags** | `#ux` `#states` `#feedback` `#interaction` `#microinteractions` |

---

## concepts

Las microinteracciones son los momentos de un solo uso en una interfaz: hacer un "like", silenciar una notificación, cambiar el estado de un switch. Son pequeñas, pero determinan si el sistema se siente vivo o muerto, responsivo o torpe.

**La estructura de una microinteracción:**

```
1. TRIGGER    → qué activa la microinteracción (usuario o sistema)
2. RULES      → qué pasa cuando se activa
3. FEEDBACK   → cómo se informa al usuario de que algo pasó
4. LOOPS      → qué pasa si se repite la acción, o con el tiempo
```

---

## rules

### 1. Triggers — cómo inicia la interacción

**Triggers de usuario:**
- Click / tap en un elemento interactivo
- Hover sobre un elemento (solo como capa 2 — debe haber equivalente en focus)
- Focus mediante teclado o lector de pantalla
- Gesto táctil (swipe, long-press)

**Triggers del sistema:**
- Estado de carga completado
- Error recibido del servidor
- Tiempo agotado (timeout)
- Evento externo (nuevo mensaje, notificación)

**Regla SYX:** cada trigger de usuario tiene un feedback visual inmediato (< 100ms). Los triggers del sistema usan `aria-live` para anunciar el cambio a lectores de pantalla.

---

### 2. Rules — qué puede y qué no puede pasar

Las reglas definen los límites de la interacción:
- ¿Puede repetirse la acción? (toggle on/off → sí; eliminar → una sola vez con confirmación)
- ¿Hay un límite? (contador de caracteres → máximo; upload → tamaño máximo)
- ¿Es reversible? (like → sí; eliminar → no, requiere confirmación)

**En el inventario de estados de UX mode:**
- Documentar si la acción es reversible
- Documentar si tiene límites (y cuál es el feedback cuando se alcanza el límite)
- Documentar el comportamiento al repetir la acción

---

### 3. Feedback — los 7 estados que todo componente debe cubrir

| Estado | Qué comunica | Cómo se implementa |
|--------|-------------|-------------------|
| **Default** | Estado inicial, en reposo | El diseño base del componente |
| **Hover** | "Puedes interactuar con esto" | Background tint + cursor pointer |
| **Focus-visible** | "Estás aquí, listo para activar" | Focus ring (obligatorio WCAG 2.4.7) |
| **Active/Pressed** | "Estás activando esto ahora" | Scale(0.97) o inset shadow |
| **Loading** | "El sistema está procesando" | Spinner o skeleton + aria-busy |
| **Error** | "Algo falló — requiere acción" | Borde + icono + texto (3 señales, WCAG 1.4.1) |
| **Disabled** | "No disponible en este contexto" | Opacity + cursor not-allowed (no solo gris) |

**Adicionalmente, según el componente:**

| Estado adicional | Contexto |
|-----------------|---------|
| **Success** | Formularios, confirmaciones |
| **Empty** | Listas, búsquedas sin resultados |
| **Filled** | Inputs con contenido |
| **Selected** | Checkboxes, radio buttons, tabs activas |
| **Expanded/Collapsed** | Accordions, dropdowns, menus |

---

### 4. Loops — comportamiento en el tiempo y al repetir

**Toggle loops:** la acción alterna entre dos estados. El feedback debe comunicar el estado actual, no la acción.
```
✗ aria-label: "Marcar como favorito" (siempre el mismo)
✓ aria-label: "Añadir a favoritos" / "Eliminar de favoritos" (según el estado actual)
✓ aria-pressed: "false" / "true" (estado para lectores de pantalla)
```

**Countdown/timer loops:** cuando el sistema actúa en el tiempo (token de sesión expira, código de verificación caduca). El feedback debe anticipar el evento.

**Rate limiting:** si una acción tiene límite de repeticiones, el feedback debe comunicar:
1. Cuántos intentos quedan (mientras quedan)
2. Que el límite se ha alcanzado (cuando se alcanza)
3. Cuándo puede volver a intentarse (si aplica)

---

### 5. The human touch
Las microinteracciones que se sienten bien tienen estas propiedades:
- **Responden inmediatamente** (< 100ms para el feedback inicial)
- **Tienen la duración justa** (no tan rápidas que pasen desapercibidas, no tan lentas que frustren)
- **Comunican lo que importa** (el resultado, no la mecánica)
- **Son consistentes** (el mismo tipo de interacción siempre funciona igual)

---

## checklist

Para cada componente interactivo en SYX:

- [ ] ¿El trigger tiene feedback visual en < 100ms?
- [ ] ¿Están diseñados los 7 estados base: default, hover, focus, active, loading, error, disabled?
- [ ] ¿Los estados de error tienen 3 señales visuales (color + icono + texto)?
- [ ] ¿El disabled usa opacity + cursor:not-allowed, no solo gris?
- [ ] ¿Los toggles actualizan el aria-label y aria-pressed según el estado actual?
- [ ] ¿Los estados dinámicos (loading, success, error) usan aria-live o role="alert"?
- [ ] ¿Los límites de rate tienen feedback anticipatorio?
- [ ] ¿El loading state tiene aria-busy="true" en el contenedor?
