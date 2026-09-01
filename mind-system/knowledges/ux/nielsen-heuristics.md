# Nielsen's 10 Usability Heuristics

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UX — evaluación de usabilidad |
| **Fuente** | Jakob Nielsen — [nngroup.com/articles/ten-usability-heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) (1994, actualizado 2020) |
| **Objetivo** | Marco de evaluación heurística para componentes e interfaces SYX |
| **Agent tags** | `#ux` `#heuristics` `#evaluation` `#usability` |

---

## concepts

Las heurísticas de Nielsen son principios generales de diseño de interacción, no reglas estrictas. Se usan como guías para evaluar interfaces y como criterios de decisión durante el diseño. Una interfaz que viola múltiples heurísticas tiene problemas de usabilidad — independientemente de su estética.

---

## rules

### H1 — Visibility of System Status
**The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.**

En SYX:
- Todo estado de carga debe tener un loading state visual (`is-loading`, `aria-busy="true"`)
- Las operaciones completadas deben tener confirmación visible (toast, cambio de estado del botón)
- El progreso en flujos de múltiples pasos debe ser visible (stepper, progress bar)
- El estado de un formulario (vacío / relleno / con error / enviado) debe ser siempre legible

**Check:** ¿El usuario siempre sabe qué está pasando? ¿Nunca queda en espera sin feedback?

---

### H2 — Match Between System and the Real World
**The system should speak the users' language, with words, phrases, and concepts familiar to the user.**

En SYX:
- Los labels de formulario usan el idioma del usuario, no el de la base de datos
- Los mensajes de error son específicos y en lenguaje natural ("Introduce un email válido" no "Error 422")
- Los iconos representan conceptos universales o van acompañados de texto
- Las metáforas visuales (papelera = eliminar, lupa = buscar) solo se usan cuando son culturalmente consolidadas

**Check:** ¿El vocabulario de la interfaz coincide con el que el usuario usaría para describir su tarea?

---

### H3 — User Control and Freedom
**Users often choose system functions by mistake and need a clearly marked "emergency exit".**

En SYX:
- Toda acción destructiva tiene confirmación (modal, undo)
- Los formularios de múltiples pasos tienen "atrás"
- Las modales se cierran con Escape y con un botón de cierre visible
- Las acciones en masa (eliminar varios elementos) son reversibles o tienen confirmación
- El usuario nunca queda atrapado sin una salida clara

**Check:** ¿El usuario puede deshacer o salir de cualquier estado sin consecuencias permanentes?

---

### H4 — Consistency and Standards
**Users should not have to wonder whether different words, situations, or actions mean the same thing.**

En SYX:
- El mismo componente con la misma función tiene el mismo aspecto en toda la aplicación
- Los tokens de color semánticos (`--semantic-color-primary`) garantizan consistencia visual
- Los patrones de interacción son idénticos en todo el sistema (todos los dropdowns abren igual)
- Las convenciones de la plataforma se respetan (form submit con Enter, Escape cierra overlays)

**Check:** ¿El componente sigue las convenciones establecidas en el resto del sistema?

---

### H5 — Error Prevention
**Even better than good error messages is a careful design which prevents a problem from occurring in the first place.**

En SYX:
- Las acciones destructivas requieren confirmación (H3 + H5)
- Los campos de formulario validan con feedback inmediato, no solo al enviar
- Las opciones no aplicables se deshabilitan (no solo se ocultan)
- Los inputs tienen `type` correcto para activar el teclado móvil adecuado
- Los placeholders no sustituyen a los labels (el placeholder desaparece al escribir)

**Check:** ¿La interfaz hace difícil cometer errores, además de recuperarse de ellos?

---

### H6 — Recognition Rather Than Recall
**Minimize the user's memory load by making objects, actions, and options visible.**

En SYX:
- Las opciones disponibles son visibles — no requieren que el usuario las recuerde
- Los breadcrumbs muestran dónde está el usuario en la jerarquía
- El historial o los estados anteriores están disponibles cuando son relevantes
- Los iconos en botones tienen labels de texto (no solo iconos para acciones no obvias)
- Los campos con autocompletar reducen la carga de memoria en formularios repetitivos

**Check:** ¿El usuario necesita recordar información de un paso anterior para completar el paso actual?

---

### H7 — Flexibility and Efficiency of Use
**Accelerators — unseen by the novice user — may often speed up the interaction for the expert user.**

En SYX:
- Los flujos críticos tienen atajos de teclado documentados
- Los formularios con datos frecuentes tienen autocompletado (`autocomplete` attribute)
- Las operaciones frecuentes están en el nivel de interacción más corto posible
- Las listas largas tienen filtro o búsqueda

**Check:** ¿Un usuario experto puede completar la tarea más rápido que un usuario novato, sin que la interfaz sea confusa para el novato?

---

### H8 — Aesthetic and Minimalist Design
**Dialogs should not contain irrelevant or rarely needed information.**

En SYX:
- Cada elemento en pantalla tiene una función — sin decoración que compite con el contenido
- Los modales contienen solo la información necesaria para la decisión que piden
- Las notificaciones son breves y accionables
- La regla 60/30/10 de color evita la saturación visual

**Check:** ¿Hay elementos en pantalla que no contribuyen a la tarea del usuario?

---

### H9 — Help Users Recognize, Diagnose, and Recover from Errors
**Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.**

En SYX:
- Los mensajes de error tienen 3 partes: qué falló + por qué + cómo corregirlo
- Los errores están asociados al campo que los causó (`aria-describedby`)
- Los errores usan `role="alert"` para anunciarse en lectores de pantalla
- Los errores nunca solo cambian color — añaden icono y texto descriptivo (WCAG 1.4.1)

**Check:** ¿El mensaje de error le dice al usuario exactamente qué salió mal y cómo solucionarlo?

---

### H10 — Help and Documentation
**Even though it is better if the system can be used without documentation, it may be necessary to provide help.**

En SYX:
- Los campos complejos tienen `hint` text visible (no solo tooltip)
- Los hints están siempre visibles para campos que los necesitan — no escondidos tras hover
- Las acciones con consecuencias no obvias tienen texto de apoyo
- Los estados de error son lo suficientemente descriptivos para que el usuario no necesite buscar ayuda externa

**Check:** ¿El usuario puede completar la tarea sin documentación externa?

---

## checklist

Aplicar en cada revisión de componente o flujo:

- [ ] H1: ¿El sistema informa al usuario de su estado en todo momento?
- [ ] H2: ¿El lenguaje es el del usuario, no el del sistema?
- [ ] H3: ¿Puede el usuario salir o deshacer cualquier acción?
- [ ] H4: ¿El componente es consistente con el resto del sistema?
- [ ] H5: ¿La interfaz previene errores, no solo los gestiona?
- [ ] H6: ¿El usuario puede reconocer opciones sin tener que recordarlas?
- [ ] H7: ¿Los usuarios expertos tienen atajos disponibles?
- [ ] H8: ¿Hay elementos decorativos que compiten con el contenido funcional?
- [ ] H9: ¿Los mensajes de error son específicos y proponen solución?
- [ ] H10: ¿Los campos complejos tienen texto de apoyo siempre visible?
