# Typewriter

## Intención
Sugerir voz, urgencia o autoría — el texto aparece como si alguien lo estuviera tipeando en tiempo real. Aporta tempo y atención al lector.

## Definición
El texto objetivo se vacía y se restaura carácter a carácter mediante un tween sobre `{i: 0 → length}` con `ease: "none"`. Un `::after` con caret parpadeante CSS aporta la señal visual de "cursor escribiendo".

## Sinónimos útiles
Typing effect, terminal text, simulated typing, text reveal por carácter.

## Se suele confundir con
- **Character cascade**: la cascade es global y simultánea (todas las letras animan a la vez con stagger pequeño); el typewriter es secuencial y lineal.
- **Scramble text**: el scramble cifra todo el texto en cada frame; el typewriter añade un carácter por frame.

## Control GSAP
```js
const fullText = el.textContent.trim();
el.textContent = "";

ScrollTrigger.create({
  trigger: el,
  start: "top 75%",
  once: true,
  onEnter: () => {
    if (reduced) { el.textContent = fullText; el.classList.add("is-done"); return; }
    const obj = { i: 0 };
    gsap.to(obj, {
      i: fullText.length,
      duration: Math.max(0.6, fullText.length * 0.04),  // ~25 chars/seg
      ease: "none",
      onUpdate: () => { el.textContent = fullText.substring(0, Math.round(obj.i)); },
      onComplete: () => el.classList.add("is-done")
    });
  }
});
```

CSS del caret:
```css
.type-it::after {
  content: "▍";
  display: inline-block;
  color: var(--accent);
  animation: caret-blink 1s steps(2, end) infinite;
  margin-left: 1px;
}
.type-it.is-done::after { display: none; }
@keyframes caret-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .type-it::after { animation: none; } }
```

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| Velocidad | `length * 0.04` da ~25 chars/seg (legible y veloz). Para énfasis lento: `0.06`. |
| Duración mínima | `Math.max(0.6, length * 0.04)` — evita typewriter ridículamente rápido en frases cortas |
| Caret | `▍` (block) para terminal; `\|` (pipe) para clásico; quitar `is-done` para mantener caret |
| Disparo | `ScrollTrigger { once: true }` siempre — repetir destruye la sensación de "primer testigo" |

## Casos de uso
- Decks de chapter takeover en dossiers (OBSIDIANA cap. 1-5)
- Terminal interactiva o demo de código
- Mensaje de bienvenida en hero
- Reveal de cita corta en pieza periodística
- **No** para body largo: cansa visualmente

## Prompt IA
> "Typewriter en el `<span class='type-it' data-typewriter>` del deck del capítulo: vaciar el texto al cargar; tween `{i: 0 → length}` con duration `max(0.6, length*0.04)s` ease none. En onUpdate escribir `text.substring(0, round(i))`. Caret CSS `::after` con caret-blink 1s. Trigger ScrollTrigger top 75% once. Reduced-motion: saltar al texto completo."

## Fallback reduced-motion
- Texto completo, sin animación
- `is-done` aplicado para ocultar caret
- Sin sonido implícito (no añadir efectos sonoros — sin acceso de teclado)

## Anti-patrón
- **Texto > 80 caracteres**: el lector pierde paciencia.
- **Múltiples typewriters simultáneos en pantalla**: distraen entre sí. Encadenar uno detrás de otro o usar uno único.
- **Velocidad muy lenta** (>0.08s/char): se siente artificial y aburre.
