# Laws of UX

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | UX — psicología cognitiva y perceptiva aplicada al diseño |
| **Fuente** | [lawsofux.com](https://lawsofux.com/) + fuentes académicas originales |
| **Objetivo** | Fundamentar decisiones de jerarquía, targets, carga cognitiva y feedback en componentes SYX |
| **Agent tags** | `#ux` `#cognitive` `#hierarchy` `#interaction` |

---

## concepts

Las leyes de UX son principios derivados de investigación en psicología cognitiva y perceptiva. No son preferencias estéticas — son descripciones de cómo el cerebro humano procesa información y toma decisiones. Ignorarlas produce interfaces que funcionan contra el usuario.

### Fitts's Law
**El tiempo para alcanzar un objetivo depende de su tamaño y distancia.**

A larger target that is closer is faster to hit. This applies to every interactive element: buttons, links, form fields, checkboxes.

**Practical impact:**
- Minimum 44×44px for all touch targets (WCAG 2.5.5)
- Group related actions — don't scatter them across the screen
- Place the primary action where the user's attention already is (after reading the content that motivates it)
- Destructive actions (delete, cancel) should be visually separated and smaller

**Source:** Paul Fitts — *The information capacity of the human motor system in controlling the amplitude of movement* (1954).

---

### Hick's Law
**Decision time increases logarithmically with the number of options.**

More choices = longer time to decide = higher chance of abandonment. This is not about intelligence — it's about working memory and the cost of evaluation.

**Practical impact:**
- Limit navigation items (7 or fewer at the primary level)
- Use progressive disclosure: show what's needed now, reveal detail on demand
- Split complex forms into steps — one decision per screen
- Don't show all variants of a product simultaneously if the user hasn't expressed a preference

**Source:** William Edmund Hick (1952) + Ray Hyman (1953). Referenced in: [lawsofux.com/hicks-law](https://lawsofux.com/hicks-law/).

---

### Miller's Law
**Working memory holds approximately 7 (±2) chunks of information at once.**

"Chunks" are meaningful units, not individual items. A phone number in groups of 3-3-4 is 3 chunks, not 10 digits.

**Practical impact:**
- Don't display more than 7 items in a navigation, list, or menu without chunking
- Group form fields into logical sections (billing address, personal details, payment)
- Paginate long content — don't load everything at once
- Use visual grouping (Gestalt: proximity, similarity) to reduce cognitive load

**Source:** George A. Miller — *The magical number seven, plus or minus two* (1956).

---

### Jakob's Law
**Users spend most of their time on other sites. They expect your site to work the same way.**

Mental models are built from prior experience. Deviation from convention adds cognitive load. Novelty has a cost — it must justify itself with proportional gain.

**Practical impact:**
- Navigation at top or left. Logo top-left links to home.
- Search bar at top, prominent.
- Shopping cart at top-right.
- Hamburger menu for mobile navigation (users know this pattern).
- Don't rename things that have established names (e.g., don't call a shopping cart a "basket" if the user's market calls it a "cart").

**Source:** Jakob Nielsen. Referenced in: [lawsofux.com/jakobs-law](https://lawsofux.com/jakobs-law/).

---

### Tesler's Law (Law of Conservation of Complexity)
**Every application has an irreducible amount of complexity. Someone must deal with it.**

The question is not whether complexity exists — it's who bears it. The developer or the user.

**Practical impact:**
- Smart defaults eliminate choices the user shouldn't have to make
- Pre-fill what you already know (user's address, past preferences)
- Auto-detect what can be detected (country from IP, timezone from browser)
- The "simple" version of a feature should not be "limited" — it should be complete with good defaults

**Source:** Larry Tesler (1984). Referenced in: [lawsofux.com/teslers-law](https://lawsofux.com/teslers-law/).

---

### Doherty Threshold
**Productivity increases when a system responds in under 400ms.**

Above 400ms, the user loses flow and shifts attention. This was established by IBM research in 1982 — confirmed by decades of web performance data since.

**Practical impact:**
- Optimistic UI: update the interface immediately on user action, reconcile with server later
- Loading states must appear immediately — no invisible 400ms+ waits
- Skeleton loaders are better than spinners for content-heavy loads
- Progress indicators for operations that genuinely take >1s

**Source:** Walter J. Doherty & Richard Kelisky — *Managing VM/CMS systems for user efficiency* (IBM Systems Journal, 1979). Referenced in: [lawsofux.com/doherty-threshold](https://lawsofux.com/doherty-threshold/).

---

### Gestalt Laws (applied to layout)

| Law | What it means in practice |
|-----|---------------------------|
| **Proximity** | Elements close together are perceived as related. Group label + input + hint + error message — don't scatter them. |
| **Similarity** | Elements that look alike are perceived as functionally related. All primary buttons should look the same. |
| **Figure/Ground** | The eye distinguishes foreground from background. Modals, dropdowns, and tooltips must visually separate from the page. |
| **Continuity** | The eye follows lines and curves. Align form fields to a common edge; align buttons to the same baseline. |
| **Closure** | The brain completes incomplete shapes. Use for skeleton loaders and progress rings — the user fills in the rest. |

---

## rules

- [ ] Every interactive target is at minimum 44×44px in the tap area (not necessarily the visual size)
- [ ] No more than 7 items in primary navigation without chunking
- [ ] Complex processes are split into steps — maximum one primary decision per step
- [ ] Loading states appear within 100ms of the user action that triggers them
- [ ] Smart defaults are provided for every optional field
- [ ] Related controls are visually grouped (proximity + visual enclosure)
- [ ] Destructive actions are visually separated from constructive ones
- [ ] The primary action is placed where the user's attention will be after processing the content

---

## checklist

- [ ] Are all interactive elements ≥ 44×44px tap area?
- [ ] Does the primary navigation have ≤ 7 items (or is it chunked)?
- [ ] Are complex flows split into steps with one decision per step?
- [ ] Do loading states appear immediately (< 100ms)?
- [ ] Are related form fields visually grouped?
- [ ] Is the primary CTA placed in the natural reading endpoint of the content?
- [ ] Are destructive actions visually separated from constructive ones?
- [ ] Does the interface follow established conventions (logo top-left, search top, cart top-right)?
