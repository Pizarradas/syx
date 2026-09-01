# JavaScript Patterns — Patrones JS para interactividad accesible

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — JavaScript para componentes interactivos |
| **Fuente** | ARIA Authoring Practices Guide (APG); Heydon Pickering — *Inclusive Components* (2017) |
| **Objetivo** | Patrones JS para implementar componentes interactivos accesibles en SYX |
| **Agent tags** | `#javascript` `#aria` `#keyboard` `#focus` `#interactive` |

---

## concepts

El JavaScript en componentes SYX sigue un patrón consistente:
1. El componente tiene un estado funcional sin JS (ver `progressive-enhancement.md`)
2. JS mejora el comportamiento añadiendo estados dinámicos y gestión de foco
3. Los atributos ARIA se actualizan programáticamente para reflejar el estado

---

## rules

### 1. Inicialización — DOMContentLoaded o al final del body

```javascript
// Patrón estándar de inicialización
function initComponent() {
  document.querySelectorAll('.mol-accordion').forEach((el, i) => {
    const trigger = el.querySelector('.mol-accordion__trigger');
    trigger.id = `syx-accordion-trigger-${i + 1}`;
    trigger.setAttribute('aria-expanded', 'false');
    // Estado inicial: colapsado (JS mejora sobre el estado visible no-JS)
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComponent);
} else {
  initComponent(); // DOM ya cargado
}
```

---

### 2. Gestión de ARIA en estados dinámicos

```javascript
// Toggle con aria-expanded
function toggleAccordion(trigger) {
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));

  trigger.setAttribute('aria-expanded', !isExpanded);
  panel.hidden = isExpanded;
}

// aria-pressed para toggles binarios
function toggleFavorite(btn) {
  const isPressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', !isPressed);
  btn.querySelector('.atom-icon').setAttribute('aria-label',
    isPressed ? 'Añadir a favoritos' : 'Eliminar de favoritos'
  );
}
```

---

### 3. Gestión del foco — modales y overlays

```javascript
// Focus trap en modales
function openModal(modal, trigger) {
  modal.hidden = false;
  modal.setAttribute('aria-modal', 'true');

  // Guardar referencia al trigger para restaurar el foco
  modal._returnFocus = trigger;

  // Mover el foco al primer elemento focusable del modal
  const firstFocusable = modal.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (firstFocusable) firstFocusable.focus();

  // Trap focus dentro del modal
  modal.addEventListener('keydown', trapFocus);
}

function closeModal(modal) {
  modal.hidden = true;
  modal.removeEventListener('keydown', trapFocus);

  // Restaurar el foco al elemento que abrió el modal
  if (modal._returnFocus) {
    modal._returnFocus.focus();
    modal._returnFocus = null;
  }
}

function trapFocus(event) {
  if (event.key !== 'Tab') return;
  const modal = event.currentTarget;
  const focusables = modal.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    last.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === last) {
    first.focus();
    event.preventDefault();
  }
}
```

---

### 4. Escape key — cerrar overlays

```javascript
// Escape cierra cualquier overlay abierto
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  const openModal = document.querySelector('[role="dialog"]:not([hidden])');
  if (openModal) {
    closeModal(openModal);
    return;
  }

  const openDropdown = document.querySelector('.mol-dropdown[aria-expanded="true"]');
  if (openDropdown) {
    closeDropdown(openDropdown);
    return;
  }
});
```

---

### 5. Navegación por teclado en listas de opciones (tabs, menu)

```javascript
// Tabs: flechas izquierda/derecha para navegar entre tabs
tabList.addEventListener('keydown', (event) => {
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(document.activeElement);

  let nextIndex;
  if (event.key === 'ArrowRight') {
    nextIndex = (current + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (current - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  tabs[nextIndex].focus();
  activateTab(tabs[nextIndex]);
});
```

---

### 6. aria-live para actualizaciones dinámicas

```javascript
// Anunciar cambios de contenido a lectores de pantalla
function announceUpdate(message, politeness = 'polite') {
  // Usar una región live dedicada
  let liveRegion = document.getElementById('syx-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'syx-live-region';
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // visualmente oculto
    document.body.appendChild(liveRegion);
  }

  // Limpiar primero para garantizar que el cambio se anuncia
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

// Uso:
announceUpdate('3 resultados encontrados');
announceUpdate('Error: el email es obligatorio', 'assertive');
```

---

## checklist

- [ ] ¿La inicialización espera a DOMContentLoaded?
- [ ] ¿Los toggles actualizan `aria-expanded` o `aria-pressed`?
- [ ] ¿Los modales tienen focus trap al abrir?
- [ ] ¿Los modales restauran el foco al trigger al cerrar?
- [ ] ¿Escape cierra todos los tipos de overlay?
- [ ] ¿Las listas de opciones (tabs, menu) tienen navegación con flechas?
- [ ] ¿Las actualizaciones dinámicas usan `aria-live` para anunciarse?
- [ ] ¿El estado no-JS de cada componente está documentado en el HTML?
