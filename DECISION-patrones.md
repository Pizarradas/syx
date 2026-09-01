# Decisión — dónde vive un patrón

> **Estado:** decisión tomada. Cierra la Propuesta B de
> `PROPUESTA-CAPA-SEMANTICA.md`.
> **Quién decide:** delegada por José Luis el 2026-09-01.
> **Qué falta para ejecutarla:** una línea en `contracts/trust.json`. Ver
> *El primer trazo* al final — no es un trámite, es la decisión funcionando.

---

## La decisión, en una frase

**`patterns.json` en la raíz, tier `pr`, con los patrones genéricos dentro y
los editoriales quedándose en `atlas-rules/` referenciados por id.**

Es la opción B3 de la propuesta. Lo que sigue es por qué, y por qué no las
otras dos.

## Por qué ahí y no en el córtex

`mind-system/` es el sitio natural: ya es donde vive el conocimiento de
composición, ya tiene precedencia declarada, y meter los patrones ahí no
obligaba a decidir nada nuevo. Se cae por un dato de fontanería que pesa más
que la elegancia: **`mind-system/` no se publica a npm**. Una app que instala
`syx-design-system` en vez de clonar el repositorio no lo ve.

Y quien instala el paquete es justo quien más necesita que le digan qué
componer: dentro de este repositorio siempre hay alguien que puede leer el
córtex entero. Un patrón que no llega al consumidor es documentación interna,
no infraestructura de decisión.

## Por qué no todo al núcleo

Meter también los patrones editoriales resolvía la publicación, pero rompe la
tabla de precedencia que ya existe. ATLAS es el dominio invitado del peldaño 5:
decide jerarquía, densidad, nivel editorial. Si `patterns.json` también
declarase que una portada es N1 sobre N3, habría dos documentos diciendo lo
mismo y ninguno mandando sobre el otro — que es la deriva del punto 3.7 del
brief, plantada a mano.

## El reparto exacto

| | Núcleo (`patterns.json`) | Dominio (`atlas-rules/`) |
|---|---|---|
| Contesta | **con qué** se construye | **qué** se construye y **por qué** |
| Dice | rejilla, componentes, roles, reglas responsive y de accesibilidad | jerarquía editorial, densidad, nivel, zona |
| Ejemplo | `feature-rail` es 8/4 en escritorio, 12/12 en móvil, y admite estos componentes | una portada con una historia dominante es N1 sobre N3, y se compone con `feature-rail` |
| Publica | sí, con el paquete | no |
| Peldaño | 5.5 — entre `atlas-rules/` y `knowledges/` | 5 |

La regla que evita la duplicación es una sola: **un patrón del núcleo nunca
menciona una jerarquía editorial, y una regla de ATLAS nunca redefine una
rejilla.** Si un documento necesita decir lo que le toca al otro, lo referencia
por id.

## Peldaño 5.5, y por qué no es un contrato

`patterns.json` **no valida nada**. No tiene severidades, no rechaza un cambio,
no ejecuta. R01–R08 siguen siendo lo único que puede decir que no. Es
conocimiento — pero con esquema y publicado, así que va por encima de la prosa
de `knowledges/` y por debajo de `atlas-rules/`, que es dominio con autoridad
propia.

En la tabla de `CLAUDE.md`, entre las filas 5 y 6:

| # | Autoridad | Decide | ¿Comprobado? |
|---|---|---|---|
| 5.5 | `patterns.json` | Composición: rejilla, componentes y roles de cada patrón | ⚠️ `check:patterns` (pendiente) |

## Tier `pr`, no `auto`

La misma casilla que `tokens.json`. Alcance acotado, reversible de un vistazo,
pero se publica — y un patrón dirige lo que se construye después, así que se
propaga más lejos que un componente suelto. `auto` convertiría el registro de
patrones en el único sitio del sistema donde un agente puede fijar criterio de
diseño sin que nadie lo lea.

## Esquema

El del brief, con tres cambios y un recorte:

```json
{
  "id": "feature-rail",
  "name": "Feature + rail",
  "problem": "",
  "purpose": "",
  "useWhen": [],
  "avoidWhen": [],
  "layout": { "desktop": "8/4", "mobile": "12/12" },
  "recommendedComponents": [],
  "discouragedComponents": [],
  "requiredSemanticRoles": [],
  "responsiveRules": [],
  "accessibilityRules": [],
  "antiPatterns": [],
  "examples": [],
  "status": "active"
}
```

- **Fuera `hierarchy`.** Es del dominio. Un patrón del núcleo que declarase
  `["N1","N3"]` estaría invadiendo el peldaño 5. ATLAS lo pone al referenciar.
- **Fuera `tokens`.** Los roles semánticos ya apuntan al token; listar el token
  además es la misma información en dos sitios, y el que envejece es este.
- **Dentro `discouragedComponents`.** El brief solo tenía la lista de los
  recomendados. Lo que hacía falta en la prueba del propio brief —«`mol-feature-card`
  es inapropiado para jerarquía editorial»— es la lista contraria.
- **Fuera `validationRules`.** Un patrón no valida. Si alguna vez hace falta,
  es una regla en `rules.json`, no un campo aquí.

## Los tres primeros patrones

Tres, no los cinco a ocho que pedía el brief, y solo con uso demostrado en
disco. Un patrón escrito sin una página que lo respalde es una opinión con
esquema.

| id | Respaldo real |
|---|---|
| `equal-card-grid` | `org-home-features` + `mol-feature-card`, con su `avoidWhen` ya escrito en el registro |
| `media-stage` | los cuatro reportajes de ATLAS y `mol-bg-media` |
| `form-flow` | `mol-form-field` + `mol-form-field-set` + `mol-btn-group`, los tres ya en el sistema |

`feature-rail` **no** entra todavía: es el patrón editorial estrella del brief,
pero en este repositorio no hay ninguna página que lo use. Entra cuando ATLAS
lo estrene.

## El guardián

`check:patterns`, al nivel de los que ya existen:

- cada `recommendedComponents` y `discouragedComponents` existe en el registro
- cada id referenciado desde `atlas-rules/` existe en `patterns.json`
- ningún patrón del núcleo menciona `N1`–`N4` — la regla del reparto, comprobada

Sin esto, la capa de patrones sería el primer sitio del sistema donde se puede
mentir sin que salte nada. `scripts/` es `human`, así que lo escribes tú o me
lo pides como borrador.

## El primer trazo

`patterns.json` no existe, no encaja en ningún patrón de `trust.json`, y por el
`default` cae en `human`. Para que un agente pueda escribirlo hay que añadir la
ruta al tier `pr` — y `trust.json` es `human` a propósito, porque *«un agente
que pudiera ampliar sus propios permisos no tendría permisos, tendría una
sugerencia»*.

Así que la decisión la he tomado yo y el primer trazo es tuyo. No es un
formalismo: es el mecanismo haciendo exactamente lo que se le pidió. Una línea:

```diff
   "pr": {
     "paths": [
       "scss/abstracts/tokens/components/",
       ...
+      "patterns.json",
       "tokens.json"
     ]
   },
```

En cuanto esté, escribo `patterns.json` con los tres patrones y la fila 5.5 de
`CLAUDE.md`.
