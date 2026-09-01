# Don't Make Me Think — Diseño auto-evidente

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UX — carga cognitiva y diseño auto-evidente |
| **Fuente** | Steve Krug — *Don't Make Me Think, Revisited* (3ª ed., 2014) |
| **Objetivo** | Principios para reducir la carga cognitiva del usuario en interfaces SYX |
| **Agent tags** | `#ux` `#cognitive-load` `#self-evident` `#scanning` |

---

## concepts

El principio central de Krug: **una buena interfaz no requiere que el usuario piense**. El usuario no lee — escanea. No toma decisiones óptimas — toma la primera que parece suficientemente buena (satisficing). Diseñar para este comportamiento real, no para el comportamiento ideal.

### Los tres axiomas de Krug

**1. Don't make me think.**
El usuario no debe necesitar esfuerzo cognitivo para entender qué hace un elemento, cómo interactuar con él, o cuál es el siguiente paso. Si el usuario tiene que preguntarse "¿se puede hacer clic en esto?" o "¿qué pasa si pulso aquí?", el diseño ha fallado.

**2. Users don't read — they scan.**
El usuario escanea en búsqueda de lo que le interesa, ignorando el resto. El orden en el DOM y la jerarquía visual deben facilitar ese escaneo, no obstaculizarlo.

**3. Users don't make optimal choices — they satisfice.**
El usuario no evalúa todas las opciones y elige la mejor. Elige la primera opción que parece suficientemente buena y sigue adelante. El diseño debe hacer que la opción correcta sea la más obvia, no simplemente la mejor de una lista.

---

## rules

### 1. Self-evident design
Un elemento es auto-evidente cuando su función es obvia sin explicación. Si no es auto-evidente, puede ser auto-explicativo (requiere un momento de lectura). Si requiere documentación, está fallando.

**En SYX:**
- Los botones parecen botones: tienen borde, padding, y estado hover/focus
- Los inputs parecen inputs: tienen borde, fondo diferente al de la página
- Los enlaces parecen enlaces: subrayados o con color diferencial, no solo color
- Los elementos interactivos tienen affordances claras

**Check:** Un usuario que ve este elemento por primera vez, ¿sabe instantáneamente si puede interactuar con él?

---

### 2. Scan design
El contenido se diseña para ser escaneado, no leído linealmente.

**Técnicas:**
- **Jerarquía visual clara:** el elemento más importante visualmente grande, los menos importantes más pequeños
- **Bullet points y listas** para conjuntos de elementos, no párrafos
- **Negritas para lo crítico:** máximo una frase por párrafo, no listas enteras en negrita
- **Espaciado consistente:** agrupación visual refleja agrupación semántica (Gestalt: proximidad)
- **Breadcrumbs y labels** en cada sección

**En SYX:**
- El componente `atom-title` establece la jerarquía de lectura
- Los componentes `mol-card` tienen jerarquía visual interna: imagen → título → descripción → CTA
- Los formularios agrupan campos relacionados con `mol-form-field-set`

---

### 3. Happy talk elimination
El texto que no aporta información — bienvenidas, introducciones, explicaciones de lo obvio — aumenta la carga cognitiva sin añadir valor.

**Ejemplos de happy talk:**
- "Bienvenido a nuestra plataforma. Aquí podrás gestionar tu cuenta."
- "Por favor, rellena el formulario para completar tu registro."
- "Haz clic en el botón de abajo para continuar."

**Regla:** si el texto no responde a una pregunta que el usuario tiene, eliminarlo.

---

### 4. Navigation clarity
La navegación es la interfaz del modelo mental del usuario sobre el sistema. Debe comunicar:
- Dónde estoy (estado activo)
- A dónde puedo ir (opciones disponibles)
- Cómo llegué aquí (breadcrumbs en flujos profundos)

**En SYX:**
- El estado activo en `mol-menu` usa `aria-current="page"`
- Los flujos profundos tienen `mol-breadcrumb` con destino etiquetado
- El primer nivel de navegación tiene máximo 7 ítems

---

### 5. The trunk test
El usuario puede llegar a cualquier página de la aplicación sin contexto (desde un enlace directo, una búsqueda, etc.). La página debe responder cinco preguntas sin que el usuario tenga que navegar:
- ¿Qué sitio es este?
- ¿En qué sección estoy?
- ¿Qué puedo hacer aquí?
- ¿Dónde puedo ir desde aquí?
- ¿Dónde estoy en la jerarquía?

**En SYX:** cada template debe tener: logo, navegación con estado activo, título de la sección, breadcrumbs (si es una sección profunda).

---

## checklist

- [ ] ¿Todos los elementos interactivos tienen affordances claras (parecen clicables)?
- [ ] ¿La jerarquía visual refleja la jerarquía de importancia del contenido?
- [ ] ¿El texto se puede escanear (headers, bullets, negritas estratégicas)?
- [ ] ¿Hay "happy talk" que puede eliminarse?
- [ ] ¿La navegación muestra el estado activo?
- [ ] ¿Las rutas profundas tienen breadcrumbs?
- [ ] ¿El usuario sabe dónde está y a dónde puede ir sin leer todo el contenido?
- [ ] ¿La acción principal es la más visualmente prominente?
