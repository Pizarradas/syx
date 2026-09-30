# Decisión — dónde vive el contexto de producto

> **Estado:** decisión tomada. Cierra el hueco P0 del informe de evaluación del
> 2026-09-02, secciones 9 y 10.
> **Quién decide:** delegada por José Luis el 2026-09-02.
> **Qué falta para ejecutarla:** una línea en `contracts/trust.json` — la misma
> línea que espera `DECISION-patrones.md`. Ver *El primer trazo* al final.

---

## La decisión, en una frase

**`product-context.json` en la raíz, tier `pr`, servido por MCP, y explícitamente
NO un modo.**

Misma forma que `patterns.json` y por las mismas razones. Lo que sigue es por qué
esa forma, por qué no un modo, y —lo que más importa— **dónde acaba** para que no
se coma a BRAND y a ATLAS.

## El hueco, comprobado

Hay capas que contestan *cómo debe expresarse* (BRAND), *qué contenido pesa más*
(ATLAS), *cómo se organiza la experiencia* (UX) y *cómo se implementa* (UI). No hay
ninguna que conteste:

> ¿Qué producto estamos construyendo y qué tiene que conseguir?

Verificado: cero apariciones de `product-context`, `product_context` o *product
intent* en todo el repositorio. El hueco es real, no una preferencia de formato.

Y se nota aguas abajo. Sin esa capa, cada modo se inventa el contexto que necesita:
UX supone una audiencia, BRAND supone un registro, ATLAS supone un nivel editorial.
Tres suposiciones que nadie escribió, que no coinciden entre sí, y que ningún `##
Why` puede citar porque no existen en ningún sitio.

## Por qué no un modo

El informe lo dice y tiene razón: un hueco no justifica un modo. Aplicada la regla
de cinco preguntas —¿knowledge? ¿contract? ¿recipe? ¿MCP? ¿extender algo?— el
contexto de producto es **un artefacto consultable**, no una responsabilidad con
permisos propios:

- No escribe nada que otro modo no escriba ya.
- No tiene un techo de permisos distinto.
- No razona: **se declara una vez y lo leen todos.**

Un modo `[SYX: PRODUCT]:` añadiría un décimo tier, una décima fila en cuatro
índices y un turno más al principio de cada flujo, a cambio de servir un objeto que
cabe en cuarenta líneas. Eso es exactamente la deriva contra la que avisa el propio
informe en su sección 23.

Se convertirá en modo el día que aparezca una responsabilidad exclusiva: alguien que
*decida* el producto en vez de declararlo. Ese día habrá algo que razonar, y entonces
sí.

## Por qué en la raíz y no en el córtex

El mismo dato de fontanería que movió a `patterns.json`: **`mind-system/` no se
publica a npm**. Una app que instala `syx-design-system` en vez de clonar el
repositorio no lo ve — y quien instala el paquete es justo quien más necesita
declarar qué está construyendo.

## Dónde acaba — el reparto con BRAND y ATLAS

Esta es la parte que decide si la capa sirve o estorba.

| | `product-context.json` | BRAND | ATLAS |
|---|---|---|---|
| Contesta | **qué** producto y **para qué** | **cómo** se expresa | **qué** contenido pesa más |
| Ejemplo | *objetivo de negocio: suscripción* | *registro institucional, acento único* | *esta portada es N1 sobre N3* |
| Cambia si | cambia el negocio | cambia la marca | cambia la edición |
| Peldaño | insumo, no autoridad | modo, peldaño 3 | dominio invitado, peldaño 5 |

**No es autoridad, es insumo.** No entra en la escalera de precedencia de
`CLAUDE.md`: no manda sobre R01–R08, no manda sobre `trust.json`, y no gana una
discusión contra un modo. Es lo que un modo lee para no tener que suponer.

### La regla que impide que se convierta en un vertedero

> **Un campo entra solo si cambia una decisión concreta de un modo concreto, y el
> campo nombra cuál.**

Si nadie lo consume, no es contexto: es relleno con formato de JSON. La comprobación
es barata y es la misma que se le exige a un módulo del córtex en `routing.md` —un
módulo que ningún modo carga es un huérfano— aplicada a un campo en vez de a un
fichero.

## La forma

```jsonc
{
  "product": {
    "type": "editorial",            // ATLAS: elige el modelo editorial
    "audience": "enthusiasts",      // UX: densidad, vocabulario · BRAND: registro
    "business_goal": "subscription",// UX: dónde va la conversión
    "primary_user_goal": "discover",// UX: jerarquía de la home
    "secondary_goal": "deepen",     // ATLAS: profundidad de las piezas
    "conversion": "newsletter"      // UX: qué componente cierra la página
  },
  "constraints": {
    "accessibility": "AA",          // UX, AUDIT: umbral de contraste y foco
    "content_density": "medium",    // ATLAS, BRAND: eje 3, espacio y densidad
    "device_priority": "mobile"     // UX, UI: orden de breakpoints
  }
}
```

El comentario de cada línea no es documentación decorativa: **es el campo declarando
quién lo consume**, que es lo que la regla de arriba exige. Un campo sin consumidor
se borra en la siguiente revisión.

### Lo que NO lleva

- **Nada de expresión visual.** Ni paleta, ni tipografía, ni radios. Eso es BRAND, y
  duplicarlo aquí crea dos documentos diciendo lo mismo sin que ninguno mande — la
  deriva que `DECISION-patrones.md` ya evitó con los patrones editoriales.
- **Nada de jerarquía editorial.** Ni N1, ni zona, ni nivel. Eso es ATLAS.
- **Nada de implementación.** Ni componentes, ni tokens, ni breakpoints concretos.

## Cómo lo consultan los modos

Una herramienta MCP, `get_product_context`, con la misma economía que el resto:
se pregunta, no se carga. Un objeto de cuarenta líneas no justifica una lectura de
fichero en cada turno, y menos cuando el propio informe señala la complejidad
cognitiva como riesgo P0.

Mientras la herramienta no exista, el fichero se lee. Es un fichero pequeño y en la
raíz; el coste de leerlo es el que ya se paga por `component-registry.json`.

## El primer trazo

Igual que con los patrones: `product-context.json` no existe, no encaja en ningún
patrón de `trust.json`, y por el `default` cae en `human`. Para que un agente pueda
escribirlo hay que añadir la ruta al tier `pr` — y `trust.json` es `human` a
propósito.

Las dos decisiones esperan la misma línea, así que es un solo trazo:

```diff
   "pr": {
     "paths": [
       "scss/abstracts/tokens/components/",
       ...
+      "patterns.json",
+      "product-context.json",
       "tokens.json"
     ]
   },
```

En cuanto esté: `patterns.json` con sus tres patrones, `product-context.json` con el
esqueleto de arriba, y las filas correspondientes en `CLAUDE.md` y `AGENTS.md`.
