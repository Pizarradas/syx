# Lottie: compatibilidad e integración

## meta

| Campo | Valor |
|-------|-------|
| **Dominio** | motion — ejecución · Lottie |
| **Fuente** | lottie-web y players nativos; LottieFiles |
| **Objetivo** | Saber qué sobrevive a la exportación y cómo integrarlo en producto |
| **Agent tags** | `#motion` `#lottie` `#export` |

---

## concepts

---

## rules

### Compatibilidad (exportación desde AE con Bodymovin o LottieFiles)

| Estado | Funciones |
|---|---|
| ✅ Soportado | Shape layers, transformaciones, máscaras, trim paths, mattes de alfa (con coste de rendimiento), time remap básico en precomps, imágenes, texto básico o como glifos |
| ⚠️ Parcial | Efectos Fill, Stroke y Tint; blend modes (multiply, screen, add: dependen del player) |
| ❌ No soportado | Capas 3D, cámaras, luces, la mayoría de efectos (blur, distorsión, generate), layer styles, adjustment layers |
| ⚠️ Expresiones | Limitadas y distintas en cada player (ES5 en lottie-web). **Hornéalas** |
| ⚠️ Luma mattes | Históricamente no soportados; hoy depende del player. Evítalos |

Cavalry exporta Lottie directamente desde el Render Manager. Revisa el resultado en el player de destino, porque el soporte también varía.

### Optimización (peor escenario: móvil modesto)

- Menos vértices: simplifica los paths y evita trazos expandidos innecesarios.
- Sin imágenes embebidas grandes: mejor vectores, o imágenes externas optimizadas.
- Pocos mattes y máscaras (cada uno cuesta un render offscreen).
- Precomps planos; nada de capas ocultas o fuera de tiempo (se exportan igual).
- 30 fps suele bastar para UI; 60 solo si hace falta.
- Considera **dotLottie** (`.lottie`, comprimido, con varias animaciones y temas).
- Prueba el tamaño del JSON y el FPS real en un dispositivo modesto.

### Integración en producto

- **Web:** `@lottiefiles/dotlottie-web` o `lottie-web`. Carga diferida; pausa fuera de pantalla.
- **Reduced motion:** el player no la conoce. El producto debe hacer `if (reduce) goToAndStop(finalFrame)`, o mostrar un SVG estático.
- **Pausa (WCAG 2.2.2):** los loops de más de 5 s necesitan un control visible.
- **Accesibilidad:** contenedor con `role="img"` y `aria-label`, o `aria-hidden` si es decorativo.
- **¿Lottie o Rive?** Lottie para animaciones lineales exportadas de AE o Cavalry (iconos, ilustraciones, loaders). **Rive** si hay interactividad, estados, data binding o varios estados en un mismo asset (ver `motion/08-ejecucion/rive/`).

---

## checklist

- [ ] Solo features soportadas por el player de destino
- [ ] Peso comprobado en móvil modesto
- [ ] Frame estático o segunda animación para reduced motion
- [ ] Loops de más de 5 s con pausa
