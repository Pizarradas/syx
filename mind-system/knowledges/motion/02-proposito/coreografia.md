# Coreografía avanzada

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — propósito · orden, solape, interrupción y scroll |
| **Fuente** | Microsoft Fluent 2; Material Design 2/3; IBM Carbon; UX in Motion |
| **Objetivo** | Ordenar varios movimientos para que construyan jerarquía y sigan funcionando al interrumpirse o con listas largas |
| **Agent tags** | `#motion` `#choreography` `#stagger` `#interruption` `#scroll` |

---

## concepts

### Anatomía de una coreografía

```
t=0        ┌─ hero (container) ──────────────────────┐
t=+60      │   ┌─ título ─────────────┐
t=+100     │   │   ┌─ cuerpo ─────────────┐
t=+140     │   │   │   ┌─ acciones ───────────┐
           └───┴───┴───┴── total en el peor escenario ≤ tope
```

- **Roles:** hero (1), support (n) y background (el resto, quieto o con un fade mínimo).
- **Anclas:** los offsets de los support se definen **relativos al hero** (`after:hero@40%`), no en ms absolutos. Así, si el hero cambia de duración, la coreografía se reajusta sola.
- **Solapamiento:** entre el 30 % y el 60 %. Sin solapamiento parece una secuencia lenta; con solapamiento total, se pierde la jerarquía.

---

## rules

### Direccionalidad

- El contenido entra desde la dirección de la que viene conceptualmente (el siguiente paso, desde la derecha en LTR). **En idiomas RTL, se invierte.**
- Las salidas siguen la dirección del gesto o de la navegación.
- En Z: al profundizar, entra desde "detrás" (escala < 1 → 1); al volver, el saliente se aleja hacia delante.

### Interrupción

Los casos que hay que diseñar siempre:

1. **Doble clic o doble tap** durante la transición → ignorarlo o redirigir sin reiniciar.
2. **"Atrás" a mitad de transición** → invertir desde el estado actual con la velocidad actual (los springs lo hacen de forma natural; las curvas necesitan partir del valor actual y usar una duración proporcional a lo que queda).
3. **Llega el contenido mientras se muestra el skeleton** → crossfade corto y no se reinicia el shimmer.
4. **Cambio de tamaño de ventana o rotación** → no animes el relayout, o hazlo con FLIP.

Duración proporcional al invertir:

```
d_restante = d_total × (distancia_restante / distancia_total), con un mínimo del nivel micro (≈ 100 ms)
```

### Escenarios con n variable

- La coreografía se valida con **n = máximo realista** (el peor escenario): si una lista puede tener 50 ítems, se escalona solo lo visible (el viewport) y el resto aparece sin animación o en bloque.
- Fórmula: `each = min(each_deseado, max_total / (n_visible − 1))`.

### Scroll

- **Scroll-linked** (el progreso ligado a la posición del scroll): parallax, barras de progreso, reveals. El usuario controla el tiempo, así que el easing suele ser lineal respecto al scroll.
- **Scroll-triggered** (se dispara al entrar en el viewport): reveals con duración propia. Solo una vez, no cada vez que se vuelve a pasar.
- **Nunca** secuestres el scroll (scrolljacking) ni cambies su velocidad nativa sin una razón narrativa muy fuerte y sin la variante reducida.
- Parallax: diferencias de velocidad moderadas (0,8–1,2×). Desactívalo con reduced motion.

### Momentos protagonistas vs productivos

Carbon y Material 3 distinguen dos estilos:

- **Productive:** tareas y uso frecuente. Corto, sin rebote, discreto.
- **Expressive:** momentos importantes (onboarding, éxito, primer uso, marca). Más largo y con overshoot o rebote.

Regla: en una pantalla de tarea, **como mucho un** momento expressive a la vez.

---

## checklist

- [ ] Un solo hero por beat; offsets de los support relativos al hero
- [ ] Solape entre el 30 % y el 60 %
- [ ] Stagger con tope, calculado con el n máximo realista
- [ ] Los cuatro casos de interrupción diseñados
- [ ] Sin scrolljacking; parallax desactivado con reduced motion
- [ ] Como mucho un momento expressive a la vez en pantallas de tarea
