# CSS Architecture — Cascada, especificidad y @layer

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | Front-end — arquitectura CSS |
| **Fuente** | W3C CSS Cascade Level 5 (@layer); Miriam Suzanne — CSS Cascade; MDN Web Docs |
| **Objetivo** | Fundamentar el uso de `@layer` en SYX y las reglas de especificidad del modo UI |
| **Agent tags** | `#css` `#architecture` `#cascade` `#specificity` `#layer` |

---

## concepts

La cascada CSS determina qué regla "gana" cuando múltiples reglas aplican al mismo elemento. Entender la cascada es fundamental para escribir CSS mantenible en un sistema de diseño donde múltiples capas (reset, tokens, componentes, temas, overrides) coexisten.

---

## rules

### 1. @layer — control explícito de la cascada

`@layer` permite organizar las reglas CSS en capas con precedencia explícita. La última capa declarada gana sobre las anteriores, independientemente de la especificidad.

**Stack de layers en SYX:**
```scss
@layer syx.reset,
       syx.tokens,
       syx.base,
       syx.atoms,
       syx.molecules,
       syx.organisms,
       syx.utilities,
       syx.themes;
```

Las capas se declaran en orden de menos a más prioritario. Un estilo en `syx.themes` sobreescribe `syx.atoms` sin necesidad de mayor especificidad.

**Por qué es relevante para los modos:**
- Permite a los temas sobreescribir tokens de componente sin `!important`
- Garantiza que las utilities (clases helper) ganen sobre componentes cuando se necesita
- Hace previsible qué regla aplica sin calcular especificidad

---

### 2. Especificidad — no combatir con !important

La especificidad es la prioridad calculada de un selector. Combatir la especificidad con `!important` es un anti-patrón (R02 en SYX).

```
Regla general de menor a mayor especificidad:
Selector de elemento (div, p)     → 0,0,1
Selector de clase (.atom-btn)     → 0,1,0
Selector de ID (#header)          → 1,0,0
Inline style (style="…")          → 1,0,0,0
!important                        → gana todo (anti-patrón)
```

**La solución en SYX:** `@layer` elimina la necesidad de combatir especificidad. Si un token de tema necesita sobreescribir un componente, está en una capa superior — no necesita `!important`.

---

### 3. BEM — especificidad plana

BEM produce selectores de clase única: `.atom-btn`, `.atom-btn__label`, `.atom-btn--primary`. La especificidad de todos estos selectores es idéntica: `0,1,0`.

```scss
// ✓ BEM — especificidad plana (0,1,0)
.atom-btn { … }
.atom-btn__label { … }
.atom-btn--primary { … }

// ✗ Anidamiento profundo — especificidad acumulada
.mol-card .atom-btn { … }          // 0,2,0 — más específico que .atom-btn--primary
.org-hero .mol-card .atom-btn { … } // 0,3,0 — difícil de sobreescribir
```

**Regla SYX:** nesting máximo de 3 niveles en SCSS. Los selectores compilados no deben tener especificidad mayor que `0,2,0` para estilos de componente.

---

### 4. Cascade layers vs. cascade origins

Las `@layer` en SYX son **cascade layers** (no origin layers). La prioridad es:

```
1. User-agent styles (browser defaults)
2. User styles (user preferences)
3. Author styles ← aquí están las @layer de SYX
   3a. syx.reset
   3b. syx.tokens
   3c. ...
   3n. syx.themes
4. !important (invertido: user > author)
```

Esto significa que las `@layer` de SYX no pueden sobreescribir estilos del usuario (como `prefers-color-scheme`). Es intencional — el usuario tiene control sobre su experiencia.

---

### 5. Custom properties y la cascada

Las CSS Custom Properties (tokens) se heredan y se pueden sobreescribir en cualquier punto del árbol DOM:

```scss
:root {
  --component-btn-bg: var(--semantic-color-primary);
}

// Override en contexto específico
.org-hero {
  --component-btn-bg: var(--semantic-color-bg-inverse);
  // Todos los .atom-btn dentro de .org-hero usan el valor overrideado
}
```

**Ventaja:** permite overrides de tema sin duplicar reglas de componente. Es la base del sistema de temas en SYX.

---

## checklist

- [ ] ¿Los estilos de componente están dentro de `@layer syx.{atoms|molecules|organisms}`?
- [ ] ¿No hay `!important` en ningún archivo de componente (R02)?
- [ ] ¿La especificidad máxima de selectores de componente es 0,2,0?
- [ ] ¿El nesting SCSS no supera 3 niveles?
- [ ] ¿Los overrides de tema usan custom properties, no selectores más específicos?
- [ ] ¿Las utilities están en `syx.utilities` (capa superior a componentes)?
