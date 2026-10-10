"""iso_comun.py — Utilidades compartidas por los scripts de Blender de la familia iso-flat.

Mantiene en un único sitio lo que tiene que coincidir con la web (iso.mjs):
  - el sombreado de tres tonos (misma fórmula que shade() en iso.mjs, en sRGB),
  - la conversión de ejes Blender → mundo isométrico,
  - la proyección isométrica / dimétrica a pantalla.

Convención (igual que iso.mjs y matematicas.md):
  mundo iso: x → abajo-derecha, y → abajo-izquierda, z → arriba.
  Blender, con la cámara iso estándar (X = 54.736°, Z = 45°): cara derecha = normal +X,
  cara izquierda = normal −Y. Por tanto: iso.x = X, iso.y = −Y, iso.z = Z.
"""
import colorsys
import math
import re

C30 = math.cos(math.pi / 6)  # 0.8660254
PROYECCIONES = {"iso": (C30, 0.5), "dimetric": (1.0, 0.5)}


# ---------- Ejes y proyección ----------
def blender_a_iso(v):
    """Vector o punto de Blender (X, Y, Z) → mundo isométrico (x, y, z)."""
    return (v[0], -v[1], v[2])


def proyectar(p, modo="iso", unidad=40.0):
    """Punto del mundo iso → pantalla SVG (y hacia abajo). Idéntico a project() de iso.mjs."""
    kx, ky = PROYECCIONES[modo]
    x, y, z = p
    return ((x - y) * kx * unidad, ((x + y) * ky - z) * unidad)


def vectores_eje(modo="iso", unidad=40.0):
    """Desplazamiento en pantalla de 1 unidad de mundo por eje (para animar en espacio de mundo)."""
    kx, ky = PROYECCIONES[modo]
    return {"x": [round(kx * unidad, 4), round(ky * unidad, 4)],
            "y": [round(-kx * unidad, 4), round(ky * unidad, 4)],
            "z": [0.0, round(-unidad, 4)]}


# ---------- Color ----------
def lineal_a_srgb(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def srgb_a_lineal(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_a_hex(rgb):
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02x}" for c in rgb)


def hex_a_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _hacia(h, objetivo, cantidad):
    d = ((objetivo - h + 540) % 360) - 180
    return h + math.copysign(min(abs(d), cantidad), d) if d else h


def _hsl_a_hex(h, s, l):
    h = (h % 360) / 360
    s = max(0.0, min(100.0, s)) / 100
    l = max(0.0, min(100.0, l)) / 100
    return rgb_a_hex(colorsys.hls_to_rgb(h, l, s))


def tres_tonos(base_hex, luz="left", sube=12, baja=16, matiz=6):
    """Misma fórmula que shade() de iso.mjs. Devuelve {'top','left','right'} en hex sRGB."""
    r, g, b = hex_a_rgb(base_hex)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h, s, l = h * 360, s * 100, l * 100
    top = _hsl_a_hex(_hacia(h, 50, matiz), s, l + sube)
    medio = base_hex.lower()
    oscuro = _hsl_a_hex(_hacia(h, 230, matiz), s * 0.85, l - baja)
    if luz == "left":
        return {"top": top, "left": medio, "right": oscuro}
    return {"top": top, "left": oscuro, "right": medio}


def mezclar_hex(colores_pesos):
    """[(hex, peso), …] → hex mezclado en sRGB (para sombreado suave de superficies curvas)."""
    total = sum(p for _, p in colores_pesos) or 1
    acc = [0.0, 0.0, 0.0]
    for hx, p in colores_pesos:
        for i, c in enumerate(hex_a_rgb(hx)):
            acc[i] += c * p / total
    return rgb_a_hex(acc)


def color_base(obj):
    """Color base sRGB de un objeto: propiedad 'iso_color' (hex) del objeto o de su material;
    si no, diffuse_color del primer material (lineal → sRGB, como lo muestra el render)."""
    if obj.get("iso_color"):
        return str(obj["iso_color"])
    mat = obj.active_material
    if mat is not None:
        if mat.get("iso_color"):
            return str(mat["iso_color"])
        return rgb_a_hex([lineal_a_srgb(c) for c in mat.diffuse_color[:3]])
    return "#5b8def"


def slug(texto):
    t = texto.lower()
    for a, b in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-") or "pieza"


# ---------- Orden de profundidad ----------
def detras_de(a, b, eps=1e-4):
    """True si la caja a queda detrás de la caja b (separadas en algún eje con a en el lado bajo).
    El observador mira desde +x +y +z. Cajas: {'min': (x,y,z), 'max': (x,y,z)}."""
    return any(a["max"][k] <= b["min"][k] + eps for k in range(3)) and \
        not any(b["max"][k] <= a["min"][k] + eps for k in range(3))


UMBRAL_TECHO = 0.5  # sen(30°): el mismo criterio que el shader de iso_setup.py


def clasificar_cara(n):
    """Clase de tono de una cara según su normal en mundo iso.

    'top' si la normal sube más de 30° sobre el horizonte (nz > 0.5); si no, el lateral dominante.
    El umbral de 30° coincide con iso_setup.py (render y SVG clasifican igual) y cae entre las
    caras de un bisel en lugar de sobre ellas, así las esquinas biseladas salen limpias.
    (Con 45° las caras centrales del bisel quedan justo en el umbral y aparecen muescas.)
    """
    if n[2] > UMBRAL_TECHO:
        return "top"
    return "right" if n[0] >= n[1] else "left"


def ordenar_por_profundidad(cajas, eps=1e-4):
    """Orden del pintor para cajas alineadas (bbox en mundo iso), de atrás hacia delante.

    El observador mira desde +x +y +z. A está detrás de B si están separadas en algún
    eje y A queda en el lado bajo (A.max <= B.min + eps). Se ordena topológicamente;
    si hay ciclos o interpenetración, se cae al orden por centro (x + y + z).
    cajas: [{'id', 'min': (x,y,z), 'max': (x,y,z)}, …]
    """
    n = len(cajas)
    detras = {i: set() for i in range(n)}  # j ∈ detras[i] → j se pinta antes que i
    for i in range(n):
        for j in range(n):
            if i != j and detras_de(cajas[j], cajas[i], eps):
                detras[i].add(j)
    centro = lambda c: sum((c["min"][k] + c["max"][k]) / 2 for k in range(3))
    orden, hechos = [], set()
    pendientes = sorted(range(n), key=lambda i: centro(cajas[i]))
    while pendientes:
        listos = [i for i in pendientes if detras[i] <= hechos]
        elegido = listos[0] if listos else pendientes[0]  # ciclo: cae al orden por centro
        orden.append(elegido)
        hechos.add(elegido)
        pendientes.remove(elegido)
    return [cajas[i] for i in orden]


def solapa_xy(a, b):
    """Las cajas a y b se solapan en planta (x, y del mundo iso)."""
    return all(a["min"][k] < b["max"][k] and b["min"][k] < a["max"][k] for k in (0, 1))


def piezas_debajo(p, piezas, margen=0.02):
    """Piezas sobre las que descansa p (solapan en planta y su techo no supera la base de p)."""
    return [q for q in piezas if q is not p and solapa_xy(p, q) and q["max"][2] <= p["min"][2] + margen]


def receptor_de(p, piezas, margen=0.02):
    """Superficie que recibe la sombra de p: la pieza más alta bajo p (solapando en planta) cuyo
    techo no supera la base de p (con margen). Devuelve (pieza, z del techo). Si no hay ninguna,
    (la pieza más baja, z de la base de p)."""
    debajo = piezas_debajo(p, piezas, margen)
    if debajo:
        q = max(debajo, key=lambda q: q["max"][2])
        return q, q["max"][2]
    return min(piezas, key=lambda q: q["min"][2]), p["min"][2]


def es_suelo(p, suelo_z, eps=1e-4):
    """Pieza que recibe sombras pero no las proyecta: apoyada en el nivel más bajo y plana
    (altura menor que el 60 % de su anchura), como una losa o un suelo."""
    return p["min"][2] <= suelo_z + eps and p["max"][2] - p["min"][2] < 0.6 * max(p["max"][0] - p["min"][0], 1e-3)
