# Mapa del dominio motion

## Objetivo

Recorrer el dominio en el orden en que se toma una decisión de movimiento: primero el propósito, después el carácter, la física, los valores y las restricciones; solo entonces la herramienta, y al final la revisión.

## Flujo de consulta (recorrido completo)

1. **Dirección** — `01-direccion/direccion.md`. Clasificar el encargo y elegir recorrido: rápido, completo o exploratorio. Si faltan datos, `01-direccion/brief.md`.
2. **Intención** — `02-proposito/proposito.md` (producto) o `03-creativa/creativa.md` (marca, narrativa). Si no hay propósito, la respuesta puede ser no animar.
3. **Carácter** — `03-creativa/` fija los cinco ejes y el estilo productive o expressive. Si BRAND ya decidió la identidad, se hereda.
4. **Física y tiempo** — `04-teoria/` traduce el carácter a curvas, springs y timing.
5. **Sistema** — `06-sistema/escala.md` da la escala de referencia; en SYX, el valor sale de `tokens.json`.
6. **Coreografía** — `02-proposito/patrones-de-transicion.md` y `02-proposito/coreografia.md`; si hay texto, `05-tipografia/`.
7. **Accesibilidad** — `07-accesibilidad/accesibilidad.md`: variante reducida, destellos, pausa.
8. **Motion Spec** — `01-direccion/motion-spec.md`. Es el contrato y el handoff entre modos.
9. **Ejecución** — `08-ejecucion/` del destino: `css/`, `js/` (+ `gsap/`), `rive/`, `cavalry-ae/`, `blender/`.
10. **Crítica** — `09-critica/critica.md`. Si falla, se vuelve al estrato responsable, no al código por defecto.

## Recorrido rápido

Sistema → ejecución → accesibilidad → crítica exprés. Sin spec escrita salvo que se pida.

## Quién decide cada estrato en SYX

| Estrato | Modo |
|---|---|
| Propósito, coreografía | UX |
| Carácter, concepto, prototipo, herramientas externas | CREATIVE (BRAND si es identidad) |
| Valores | TOKEN (THEME si reajusta un tema) |
| Implementación en `scss/` | UI |
| Revisión | AUDIT, a petición y como asesor |

## Precedencia

Dentro del dominio: accesibilidad > propósito > sistema > dirección creativa > preferencia técnica. Dentro del repositorio, todo el dominio es el escalón 6 de `mind-system/README.md`, y para código de `scss/` prevalece `ui/motion-principles.md`.
