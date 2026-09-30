# Character cascade

## Intención
Generar tensión narrativa al cargar un titular largo o un hero editorial — cada letra aparece desplazándose desde abajo, con pequeño desfase entre caracteres.

## Definición
Un titular cuyo texto se separa en caracteres (`<span class="split-char">`) y cada uno aplica `yPercent: 110 → 0` con `opacity: 0 → 1` en `expo.out`, con `stagger: 0.018-0.025`. Las líneas se contienen en `<span class="split-line">` con `overflow: hidden` para crear el efecto de "máscara horizontal" por línea.

## Sinónimos útiles
Letter-by-letter reveal, split text reveal, cascada de caracteres, kinetic typography intro.

## Se suele confundir con
- **Typewriter**: el typewriter aparece con caret y velocidad lineal; la cascada es expo y simultánea entre líneas.
- **Word stagger**: si el stagger es por palabra (no por carácter), el ritmo es más rápido y menos editorial.

## Control GSAP
- Manual SplitText: tokenizar el texto en `<span>` por carácter (`splitChars()` helper)
- Tween simple: `gsap.from(chars, { yPercent: 110, opacity: 0, stagger: 0.022 })`
- Disparo: al cargar (sin ScrollTrigger) o `ScrollTrigger { once: true }` si está debajo del fold

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| `stagger` | 0.015 (denso) — 0.04 (lento, lujo) |
| `duration` | 0.8 — 1.2 s |
| `ease` | `expo.out`, `power4.out` (frenazo dramático) |
| `yPercent` inicial | 100-130 |
| `delay` | 0.2 — 0.5 s tras carga (deja respirar) |
| Filtro opcional | `filter: blur(8px) → 0` añade halo cinematográfico |

## Casos de uso
- Hero editorial de un long-form (ATELIER, OBSIDIANA)
- Titular de una pieza de prensa premium
- Apertura de pieza creativa o awwwards
- Modal de bienvenida con marca

## Prompt IA
> "Reveal letra por letra del titular hero, stagger 0.022, ease expo.out, yPercent 110 → 0, delay 0.3s tras carga, opcional blur(8px) → blur(0). Líneas envueltas en `overflow: hidden`. Fallback `prefers-reduced-motion` muestra el texto sin animación."

## Fallback reduced-motion
```js
if (reduced) {
  gsap.set(chars, { yPercent: 0, opacity: 1, filter: "blur(0)" });
  return;
}
```
