# Awesome Design — Catálogo de sistemas de referencia

Colección de 58 DESIGN.md extraídos de webs reales. Formato Google Stitch: Visual Theme, Color, Typography, Components, Layout, Depth, Do's/Don'ts, Responsive, Agent Prompt Guide.

**Uso**: no se carga automáticamente. Se consulta on-demand cuando se solicita una estética concreta o un referente de paleta/tipografía específico.

**Ruta base**: `awesome-design-md-main/design-md/[empresa]/DESIGN.md`

**Procedencia**: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md), MIT — la licencia viaja en `awesome-design-md-main/LICENSE`. No son sistemas de diseño oficiales: son extracciones de webs públicas, así que los colores y las métricas son aproximados y sirven de referencia estética, nunca de fuente de valores.

> **Filtro SYX.** Nada de este catálogo entra en producción tal cual. Un `DESIGN.md` trae hex crudos, escalas propias y nombres de token ajenos; es material de *brief*, no de implementación. La ruta es siempre la misma: CREATIVE lo usa para fijar el registro visual, TOKEN convierte lo que sobreviva a OKLCH y a la jerarquía de tiers, y UI lo implementa contra `--semantic-*`. Copiar un valor de aquí a un fichero de componente viola R01 y R07 a la vez.

Del repositorio original se conservan los 58 `DESIGN.md`, el `README.md` y la licencia. Se retiraron los `preview.html` / `preview-dark.html` (catálogos visuales renderizados, 3,0 MB, que ningún modo consulta) y los `README.md` por empresa (plantilla de 1,3 KB que solo describía esos previews).

---

## Cómo usar este catálogo

1. Identifica la categoría estética que buscas.
2. Localiza la empresa con la descripción más próxima al brief.
3. Lee el DESIGN.md específico solo cuando sea necesario — no todos a la vez.

**Señales de activación típicas:**
- "como Stripe", "estilo Vercel", "dark como Linear" → buscar por nombre
- "fintech premium", "developer tool oscuro", "lujo editorial" → buscar por categoría
- "negativo letter-spacing extremo", "tipografía 300 weight" → buscar en la columna "Clave tipográfica"

---

## Categorías estéticas

### 1. Dark / Developer Native
UI donde la oscuridad es el medio nativo. Acromatismo con acento único.

| Empresa | Descriptor | Fuente tipográfica | Acento | Fondo base | DESIGN.md |
|---------|-----------|-------------------|--------|------------|-----------|
| **Linear** | Dark-mode-first, starlight hierarchy | Inter Variable, weight 510 (signature) | Indigo-violet `#5e6ad2` / `#7170ff` | `#08090a` near-black | [→](awesome-design-md-main/design-md/linear.app/DESIGN.md) |
| **Raycast** | macOS-native dark, precision instrument | Inter con OpenType `calt, liga, ss03` | Raycast Red `#FF6363` (puntual) | `#07080a` blue-tinted | [→](awesome-design-md-main/design-md/raycast/DESIGN.md) |
| **Spotify** | Content-first darkness, theater mode | SpotifyMixUI / CircularSp | Spotify Green `#1ed760` | `#121212` | [→](awesome-design-md-main/design-md/spotify/DESIGN.md) |
| **Warp** | Terminal-native dark | GeistMono / system-ui | Brand accent (ver DESIGN.md) | Near-black | [→](awesome-design-md-main/design-md/warp/DESIGN.md) |
| **Ollama** | Dev tool, minimal dark | Monospace-forward | Neutral/subtle | Dark | [→](awesome-design-md-main/design-md/ollama/DESIGN.md) |
| **x.ai** | Engineering dark, minimal | Inter / system-ui | Grok Blue/neutral | Near-black | [→](awesome-design-md-main/design-md/x.ai/DESIGN.md) |

---

### 2. White / Minimal / Engineering
Canvas blanco con tipografía como único elemento visual.

| Empresa | Descriptor | Fuente tipográfica | Acento | Filosofía | DESIGN.md |
|---------|-----------|-------------------|--------|-----------|-----------|
| **Vercel** | Infrastructure as invisible design | Geist Sans (-2.4px display) + Geist Mono | Negro sobre blanco | Shadow-as-border | [→](awesome-design-md-main/design-md/vercel/DESIGN.md) |
| **Apple** | Producto como héroe, interfaz que desaparece | SF Pro Display/Text, optical sizing | Apple Blue `#0071e3` (solo interactivo) | Binary black/white sections | [→](awesome-design-md-main/design-md/apple/DESIGN.md) |
| **Tesla** | Sustracción radical, fotografía como UI | Universal Sans Display/Text | Electric Blue `#3E6AE1` (solo CTA) | 100vh hero, zero decoration | [→](awesome-design-md-main/design-md/tesla/DESIGN.md) |
| **Figma** | Galería en blanco: la interfaz es monocroma, el producto es el color | figmaSans variable (pesos inusuales: 320–540) | Negro puro (chrome), gradientes vibrantes (producto) | Binary B&W interface | [→](awesome-design-md-main/design-md/figma/DESIGN.md) |
| **Notion** | Papel cálido, minimalismo analógico | NotionInter (-2.125px display) | Negro sobre cálido | Warm neutrals, whisper-borders | [→](awesome-design-md-main/design-md/notion/DESIGN.md) |
| **Resend** | Dev tool white, tipografía como statement | Inter / Geist | Neutral | Clean-code aesthetic | [→](awesome-design-md-main/design-md/resend/DESIGN.md) |
| **Cal** | Open-source calendar, clean neutral | Inter | Brand color suave | Minimal SaaS | [→](awesome-design-md-main/design-md/cal/DESIGN.md) |

---

### 3. Premium / Editorial / Luxury
Contraste dramático, tipografía como identidad, uso quirúrgico del color de marca.

| Empresa | Descriptor | Fuente tipográfica | Acento | Gesto signature | DESIGN.md |
|---------|-----------|-------------------|--------|-----------------|-----------|
| **Stripe** | Fintech-luxe: tipo ligero con autoridad susurrada | sohne-var weight 300 (headlines) | Purple `#533afd` + Deep Navy `#061b31` | Blue-tinted multi-layer shadows | [→](awesome-design-md-main/design-md/stripe/DESIGN.md) |
| **Ferrari** | Editorial de lujo, chiaroscuro, rojo quirúrgico | FerrariSans 500–700 | Ferrari Red `#DA291C` (ultra-escaso) | Negro/blanco alternos, like a yearbook | [→](awesome-design-md-main/design-md/ferrari/DESIGN.md) |
| **BMW** | Ingeniería alemana, zero border-radius | BMWTypeNextLatin Light (uppercase, 300) | BMW Blue `#1c69d4` (solo interactivo) | Angular, 0 radius, CSS variable-driven | [→](awesome-design-md-main/design-md/bmw/DESIGN.md) |
| **Lamborghini** | Supercar aggressive, yellow + black | Custom/bold | Lamborghini Yellow | High contrast, geometric | [→](awesome-design-md-main/design-md/lamborghini/DESIGN.md) |
| **Renault** | French automotive, clean modern | Custom sans | Renault Yellow | Editorial sections | [→](awesome-design-md-main/design-md/renault/DESIGN.md) |
| **SpaceX** | Mission control aesthetic, white on dark | System-ui / Helvetica | White/neutral | Full-bleed photography | [→](awesome-design-md-main/design-md/spacex/DESIGN.md) |
| **Superhuman** | Email premium, speed as aesthetic | Custom / system-ui | Brand orange/red | Keyboard-first UI | [→](awesome-design-md-main/design-md/superhuman/DESIGN.md) |

---

### 4. Developer Tools / Infrastructure
Paletas neutras o oscuras, densidad técnica, código como contenido primario.

| Empresa | Descriptor | Fuente | Acento | DESIGN.md |
|---------|-----------|--------|--------|-----------|
| **Cursor** | Warm minimal, cálido como papel de impresión | CursorGothic + jjannon serif + berkeleyMono | Warm-shifted todo | [→](awesome-design-md-main/design-md/cursor/DESIGN.md) |
| **Supabase** | Open-source BaaS, green brand | Inter / custom | Supabase Green | [→](awesome-design-md-main/design-md/supabase/DESIGN.md) |
| **Sentry** | Error tracking, purple brand | Inter | Sentry Purple | [→](awesome-design-md-main/design-md/sentry/DESIGN.md) |
| **PostHog** | Product analytics, warm + hedgehog brand | Inter | PostHog Yellow | [→](awesome-design-md-main/design-md/posthog/DESIGN.md) |
| **HashiCorp** | Infrastructure, dark + teal | Custom / system-ui | HashiCorp Teal | [→](awesome-design-md-main/design-md/hashicorp/DESIGN.md) |
| **MongoDB** | Database, dark green | Custom | MongoDB Green | [→](awesome-design-md-main/design-md/mongodb/DESIGN.md) |
| **ClickHouse** | OLAP database, yellow accent | Inter | ClickHouse Yellow | [→](awesome-design-md-main/design-md/clickhouse/DESIGN.md) |
| **Mintlify** | Docs platform, clean + gradient | Inter | Purple/gradient | [→](awesome-design-md-main/design-md/mintlify/DESIGN.md) |
| **Sanity** | Headless CMS, red accent | Custom / Inter | Sanity Red | [→](awesome-design-md-main/design-md/sanity/DESIGN.md) |
| **Expo** | React Native, blue/purple | Inter | Expo Blue | [→](awesome-design-md-main/design-md/expo/DESIGN.md) |
| **Webflow** | No-code web, blue + dark | Custom | Webflow Blue | [→](awesome-design-md-main/design-md/webflow/DESIGN.md) |

---

### 5. AI / Machine Learning
Gradientes controlados, oscuro con acento luminoso, futurismo funcional.

| Empresa | Descriptor | Fuente | Acento | DESIGN.md |
|---------|-----------|--------|--------|-----------|
| **Claude** | Warm, thoughtful AI — neutral warm | Inter / custom | Warm accent | [→](awesome-design-md-main/design-md/claude/DESIGN.md) |
| **Mistral** | European AI, dark + orange flame | Inter | Mistral Orange | [→](awesome-design-md-main/design-md/mistral.ai/DESIGN.md) |
| **Cohere** | Enterprise AI, purple/coral | Inter | Cohere Purple | [→](awesome-design-md-main/design-md/cohere/DESIGN.md) |
| **Together.ai** | Open AI infra, neutral dark | Inter | Blue | [→](awesome-design-md-main/design-md/together.ai/DESIGN.md) |
| **Replicate** | AI model hosting, dark minimal | Inter / mono | Replicate accent | [→](awesome-design-md-main/design-md/replicate/DESIGN.md) |
| **RunwayML** | Creative AI, dark cinematic | Custom | Gradient/accent | [→](awesome-design-md-main/design-md/runwayml/DESIGN.md) |
| **ElevenLabs** | Voice AI, dark + sound-wave | Inter | Blue/accent | [→](awesome-design-md-main/design-md/elevenlabs/DESIGN.md) |
| **MiniMax** | Chinese AI lab, clean | Custom | Brand accent | [→](awesome-design-md-main/design-md/minimax/DESIGN.md) |
| **Nvidia** | GPU/AI, dark + green | Custom bold | Nvidia Green | [→](awesome-design-md-main/design-md/nvidia/DESIGN.md) |
| **Composio** | Agent tooling, purple/gradient | Inter | Purple | [→](awesome-design-md-main/design-md/composio/DESIGN.md) |
| **Lovable** | Vibe coding, playful + warm | Inter | Pink/warm | [→](awesome-design-md-main/design-md/lovable/DESIGN.md) |
| **VoltAgent** | AI agent framework | Inter | Brand accent | [→](awesome-design-md-main/design-md/voltagent/DESIGN.md) |
| **Opencode.ai** | Code AI, minimal | Inter/mono | Brand accent | [→](awesome-design-md-main/design-md/opencode.ai/DESIGN.md) |

---

### 6. SaaS / Productivity / Design Tools
Paletas claras o mixtas, foco en legibilidad y densidad funcional.

| Empresa | Descriptor | Fuente | Acento | DESIGN.md |
|---------|-----------|--------|--------|-----------|
| **Airtable** | Database meets spreadsheet, blue | Custom | Airtable Blue | [→](awesome-design-md-main/design-md/airtable/DESIGN.md) |
| **Miro** | Collaborative canvas, yellow | Inter | Miro Yellow `#FFD02F` | [→](awesome-design-md-main/design-md/miro/DESIGN.md) |
| **Framer** | Design tool, dark + gradient | Custom | Purple/gradient | [→](awesome-design-md-main/design-md/framer/DESIGN.md) |
| **Clay** | CRM enrichment, warm colorful | Custom | Coral/warm | [→](awesome-design-md-main/design-md/clay/DESIGN.md) |
| **Intercom** | Customer messaging, dark blue | Custom | Intercom Blue | [→](awesome-design-md-main/design-md/intercom/DESIGN.md) |
| **Zapier** | Automation, orange | Custom | Zapier Orange | [→](awesome-design-md-main/design-md/zapier/DESIGN.md) |
| **IBM** | Enterprise, mono + blue | IBM Plex | IBM Blue | [→](awesome-design-md-main/design-md/ibm/DESIGN.md) |

---

### 7. Fintech / Crypto / Finance
Confianza, precisión, colores fríos o neutros.

| Empresa | Descriptor | Fuente | Acento | DESIGN.md |
|---------|-----------|--------|--------|-----------|
| **Revolut** | Neo-bank, dark + color pops | Custom | Revolut Blue | [→](awesome-design-md-main/design-md/revolut/DESIGN.md) |
| **Coinbase** | Crypto blue, clean + trustworthy | Custom | Coinbase Blue | [→](awesome-design-md-main/design-md/coinbase/DESIGN.md) |
| **Kraken** | Crypto exchange, purple | Custom | Kraken Purple | [→](awesome-design-md-main/design-md/kraken/DESIGN.md) |
| **Wise** | Money transfer, green + accessible | Custom | Wise Green | [→](awesome-design-md-main/design-md/wise/DESIGN.md) |

---

### 8. Consumer / Lifestyle
Color como identidad, geometría redonda, fotografía de producto.

| Empresa | Descriptor | Fuente | Acento | DESIGN.md |
|---------|-----------|--------|--------|-----------|
| **Airbnb** | Community warmth, Rausch red | Cereal (custom) | Airbnb Red `#FF5A5F` | [→](awesome-design-md-main/design-md/airbnb/DESIGN.md) |
| **Pinterest** | Inspiration red, visual-first | Custom | Pinterest Red | [→](awesome-design-md-main/design-md/pinterest/DESIGN.md) |
| **Uber** | Mobility, black + white minimal | Uber Move | Black/white | [→](awesome-design-md-main/design-md/uber/DESIGN.md) |

---

## Índice rápido por característica tipográfica

| Característica | Empresas |
|---------------|----------|
| **Weight 300 como headline** | Stripe, BMW, SpaceX |
| **Variable font con pesos inusuales** | Figma (figmaSans 320–540), Linear (Inter 510), Cursor (CursorGothic) |
| **Letra-spacing muy negativo en display** | Vercel (-2.4/2.88px), Cursor (-2.16px), Linear (-1.584px), Notion (-2.125px), Stripe (-1.4px) |
| **Serif como segunda voz** | Cursor (jjannon), Ferrari (Body-Font editorial) |
| **Monospace prominente** | Cursor (berkeleyMono), Linear (Berkeley Mono), Vercel (Geist Mono), Warp |
| **Tipografía propietaria** | Apple (SF Pro), Spotify (CircularSp), Figma (figmaSans), BMW (BMWTypeNextLatin), Ferrari (FerrariSans), Tesla (Universal Sans) |

---

## Índice rápido por filosofía de sombras

| Técnica | Empresas |
|---------|----------|
| **Shadow-as-border** | Vercel (0px 0px 0px 1px) |
| **Blue-tinted multi-layer** | Stripe (rgba 50,50,93) |
| **macOS-native inset** | Raycast |
| **Zero shadows** | Tesla, BMW |
| **Whisper shadows ≤ 0.05 opacity** | Notion |

---

## Índice rápido por filosofía de bordes

| Radio | Empresas |
|-------|----------|
| **0 radius (angular)** | BMW |
| **4–8px (conservative)** | Stripe, IBM, Apple |
| **Pill / full-round** | Spotify, Figma, Cursor |
| **Whisper borders (1px rgba 0.1)** | Notion |
| **oklab() border colors** | Cursor |
