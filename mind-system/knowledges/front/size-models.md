# size-models

## meta

- dominio: `front`
- fuente: prácticas de escalas modulares, número áureo, modelos métricos y sistemas de espaciado basados en unidades.
- objetivo: definir modelos matemáticos para razonar sobre tamaños en front (tipos y espacios) y convertirlos en tokens coherentes.
- agent_tags: `front`, `ui`, `design-system`, `layout`, `typography`

---

## core

### 1. Escala modular multiplicativa

Partimos de:

- tamaño base \( b \) (por ejemplo, 16 px)  
- razón \( r \) (por ejemplo, 1.125, 1.2, 1.25, 1.333, 1.5, 1.618)

Definición:

\[
size(n) = b \cdot r^{n}
\]

- \(n = 0\) → tamaño base  
- \(n > 0\) → tamaños mayores (headings)  
- \(n < 0\) → tamaños menores (captions, labels)

Ejemplo con \( b = 16 \), \( r = 1.25 \):

- \( n = -2 \): \( 16 \cdot 1.25^{-2} \approx 10.24 \)  
- \( n = -1 \): \( 16 \cdot 1.25^{-1} \approx 12.8 \)  
- \( n = 0 \): 16  
- \( n = 1 \): \( 16 \cdot 1.25 \approx 20 \)  
- \( n = 2 \): \( 16 \cdot 1.25^2 \approx 25 \)

Estos valores se redondean al entero más cercano o al múltiplo de 0.5 más cercano.

### 2. Escala basada en número áureo

Usamos el número áureo:

\[
\phi \approx 1.618
\]

Definición:

\[
size_{\phi}(n) = b \cdot \phi^{n}
\]

Útil para:

- Jerarquías tipográficas con saltos más dramáticos  
- Relación entre bloques (ej.: ancho de columna vs sidebar)

Ejemplo con \( b = 16 \):

- \( n = -1 \): \( 16 / 1.618 \approx 9.9 \)  
- \( n = 0 \): 16  
- \( n = 1 \): \( 16 \cdot 1.618 \approx 25.9 \)  
- \( n = 2 \): \( 16 \cdot 1.618^2 \approx 41.9 \)

### 3. Escala métrica / híbrida

Cuando los saltos geométricos son demasiado bruscos, se puede usar un modelo híbrido:

- escalón básico \( s \) (por ejemplo 2 px o 4 px)  
- módulo \( m \): cada \( m \) pasos, el escalón aumenta

Definición simple:

\[
size(0) = b
\]
\[
size(n) = size(n-1) + step(n)
\]

donde

\[
step(n) =
  \begin{cases}
    s & \text{si } n \leq m \\
    s + \Delta & \text{si } n > m
  \end{cases}
\]

Ejemplo:

- \( b = 16 \), \( s = 2 \), \( \Delta = 2 \), \( m = 2 \)

Entonces:

- \( size(1) = 18 \)  
- \( size(2) = 20 \)  
- \( size(3) = 24 \)  
- \( size(4) = 28 \)

Esta lógica genera una escala que primero crece de forma suave y luego introduce saltos más grandes para headings altos.

### 4. Sistema de espaciado basado en unidad

Definimos una unidad de espaciado \( u \) (4 px u 8 px) y construimos una progresión aritmética:

\[
space(n) = n \cdot u
\]

- \( n = 0 \): 0  
- \( n = 1 \): 4 / 8  
- \( n = 2 \): 8 / 16  
- \( n = 3 \): 12 / 24  
- …

Este mismo modelo se puede aplicar a:

- márgenes y paddings  
- gaps de grid/flex  
- alturas mínimas de componentes

Para coherencia con tipografía, es habitual elegir \( u \) como submúltiplo del tamaño base \( b \) (por ejemplo \( b = 16 \), \( u = 4 \)).

### 5. Relación entre tipografía y espaciado

Una forma de conectar ambos mundos:

- base tipográfica \( b \)  
- unidad de espaciado \( u = b/4 \)

Reglas posibles:

- altura de línea aproximada:  
  \[
  line\_height(size) \approx size + k \cdot u
  \]
  con \( k \in \{1,2\} \) según densidad  
- padding vertical de botones ≈ \( 1 \)–\( 1.5 \) unidades \( u \)  
- padding horizontal ≈ \( 2 \)–\( 3 \) unidades \( u \)

---

## patterns

### Pattern 1: Tipografía con escala modular

- Elegir base \( b \) (por ejemplo 16 px).  
- Elegir razón \( r \) en función del carácter del sistema:  
  - 1.125–1.2 → jerarquía suave  
  - 1.25–1.333 → jerarquía marcada  
  - 1.5–1.618 → jerarquía muy contrastada  
- Definir rangos de \( n \) (p.ej. de −2 a 4) y generar:  
  \[
  font\_size\_token(n) = \text{round}(b \cdot r^{n})
  \]

Asignación típica:

- \( n = -2 \): caption  
- \( n = -1 \): label / small  
- \( n = 0 \): body  
- \( n = 1 \): h6 / h5  
- \( n = 2 \): h4 / h3  
- \( n = 3,4 \): h2 / h1

### Pattern 2: Layout con proporciones áureas

- Ancho total \( W \).  
- Calcular:  
  \[
  main = \frac{W}{\phi}, \quad side = W - main
  \]
- Usar `main` para contenido principal y `side` para navegación/aside.  
- Para bloques internos, usar la misma lógica de división recursiva.

### Pattern 3: Espaciado 4/8pt

- Definir \( u = 4 \) o \( u = 8 \).  
- Definir tokens:

  - `space-0` = 0  
  - `space-1` = \( 1u \)  
  - `space-2` = \( 2u \)  
  - `space-3` = \( 3u \)…  

- Limitar el sistema a un rango razonable (por ejemplo, 0–12).  
- Mapear estos tokens a:  
  - gutters de grid  
  - paddings en componentes  
  - separación entre elementos de listas

### Pattern 4: Coherencia entre tamaños y espacios

- Conectar escala modular y spacing:

  - si \( b = 16 \), \( u = 4 \)  
  - heading de 32 px → padding vertical 2–3 × \( u \)  
  - body de 16 px → padding vertical 1–2 × \( u \)

- Columns / cards: anchuras como múltiplos de \( u \) y alto mínimo como múltiplo de la línea de texto.

---

## checklist

- ¿Existe un tamaño base \( b \) explícito y documentado para tipografía?  
- ¿La escala tipográfica se describe con una fórmula (modular, áurea, métrica) y no solo como una lista de números sueltos?  
- ¿Los tokens de tamaño están indexados por un entero \( n \) (…−2, −1, 0, 1, 2…) para poder generar y razonar?  
- ¿El espaciado se define mediante una unidad \( u \) con progresión \( space(n) = n \cdot u \)?  
- ¿Los componentes utilizan combinaciones coherentes de `font-size(n)` y `space(k)` (sin valores arbitrarios)?  
- ¿Se documentan las decisiones de ratio \( r \), unidad \( u \) y sus implicaciones (densidad, jerarquía, legibilidad)?  

Si alguna respuesta es “no”, ajustar los modelos antes de seguir añadiendo tokens o componentes.