# Scramble text

## Intención
Producir la sensación de "decifrado" o "data feed en tiempo real" — el texto pasa por un estado intermedio de caracteres aleatorios antes de fijarse en el valor objetivo. Estética forense, financiera o tecnológica.

## Definición
Un tween artificial sobre un objeto `{ p: 0 → 1 }` controla cuántos caracteres del texto objetivo ya están "fijos" (`floor(p * length)`). Los caracteres no fijos se reemplazan en cada frame por uno aleatorio de un alfabeto definido (`0-9A-F` típicamente). Al completar `p=1`, el texto queda en su estado final.

## Sinónimos útiles
Decode effect, decryption text, hex scramble, terminal text, data scramble.

## Se suele confundir con
- **Typewriter**: el typewriter añade un carácter por unidad de tiempo; el scramble cambia todos los caracteres simultáneamente.
- **GSAP ScrambleText plugin** (de pago): hace algo similar, pero esta versión manual es gratuita y suficiente para los casos típicos.

## Control GSAP
```js
const SCRAMBLE_CHARS = "0123456789ABCDEF";

function scramble(el, target) {
  if (!el) return;
  const len = target.length;
  const obj = { p: 0 };
  gsap.killTweensOf(obj);  // si llega un nuevo target, abortar el anterior
  gsap.to(obj, {
    p: 1,
    duration: 0.45,
    ease: "power2.out",
    onUpdate: () => {
      let out = "";
      const reveal = Math.floor(obj.p * len);
      for (let i = 0; i < len; i++) {
        out += i < reveal
          ? target[i]
          : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => { el.textContent = target; }
  });
}

// uso en scrub readout
if (newYear !== lastYear) {
  scramble(yearEl, String(newYear));
  lastYear = newYear;
}
```

## Parámetros sensibles
| Parámetro | Rango |
|---|---|
| `duration` | 0.3 — 0.6 s. Más alto se vuelve molesto. |
| Alfabeto | `0-9A-F` (terminal/financiero), `0-9` (cifras), `A-Z` (telétipo), Unicode (radical) |
| Estrategia de reveal | Izquierda a derecha (típico), aleatorio (más caótico), por palabras |
| Trigger | Cambio de valor — guardar `lastValue` y solo scramble si cambia |
| `gsap.killTweensOf(obj)` | Imprescindible: evita superposición cuando los valores cambian rápido (scrub chart) |

## Casos de uso
- Readouts de scrub chart (year + AUM en OBSIDIANA)
- Dashboards de datos en tiempo real
- Terminales / códigos de acceso
- Identificadores forenses (caso, dossier, evidencia)
- **No** para texto largo o de lectura — solo para valores cortos (≤ 12 caracteres)

## Prompt IA
> "Scramble text en el readout `<span data-scramble>`. Helper: tween `{p: 0→1}` 0.45s power2.out; en cada update escribir letra a letra con `0123456789ABCDEF` hasta `floor(p*len)` caracteres fijos. Llamar `scramble(el, newValue)` solo cuando el valor cambie respecto al anterior. `gsap.killTweensOf` antes de cada nuevo tween para evitar superposición."

## Fallback reduced-motion
```js
if (reduced) { el.textContent = target; return; }
```

## Anti-patrón
- **Texto largo**: pasar de 12 caracteres se vuelve ilegible.
- **Sin `killTweensOf`**: cuando varios valores cambian seguidos (ej. scrub rápido), las animaciones se solapan y dejan basura en pantalla.
- **Alfabeto incoherente con el contexto**: usar `0-9A-F` en una marca de moda rompe el registro; usar caracteres romanos en un dossier financiero suaviza el efecto.
