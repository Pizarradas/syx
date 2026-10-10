"""iso_export_svg.py — Exporta una escena de Blender a SVG isométrico vectorial, por piezas y animable.

Proyecta la geometría evaluada (con modificadores: biseles, booleanas, arrays…) con la
misma fórmula que iso.mjs, ordena la profundidad, sombrea con tres tonos desde el color
del material y emite un <g data-iso-part> por objeto. Si hay animación en Blender:
  - las traslaciones se convierten en @keyframes de transform (exactas en proyección paralela);
  - las piezas que rotan o escalan (aspas, engranajes, puertas…) se exportan en modo flipbook:
    N fotogramas vectoriales de la pieza que se alternan por opacidad.

Uso (línea de comandos, sin interfaz):
  blender escena.blend --background --python iso_export_svg.py -- --salida escena.svg [opciones]
Uso por MCP o desde la consola de Python de Blender:
  import sys, runpy; sys.argv = ["blender", "--", "--salida", r"C:\\ruta\\escena.svg"]
  runpy.run_path(r"C:\\ruta\\iso_export_svg.py", run_name="__main__")

Opciones:
  --salida RUTA         SVG de salida (obligatoria). Escribe también RUTA.json (manifiesto).
  --modo iso|dimetric   proyección (por defecto iso)
  --unidad N            px por unidad de Blender a lo largo de cada eje (40)
  --luz left|right      lado del lateral iluminado (left)
  --sombreado bandas|suave   bandas: 3 tonos exactos; suave: mezcla por normal en superficies curvas
  --tokens PREFIJO      colores como tokens CSS --PREFIJO-<material>-top/left/right (fuerza bandas)
  --coleccion NOMBRE    exporta solo esa colección (incluye subcolecciones)
  --sombras             sombras exactas (también de formas cóncavas) sobre la pieza que las recibe
  --animacion           exporta la animación (traslaciones como transform; rotaciones/escalas en flipbook)
  --paso N              cada cuántos fotogramas se muestrean las traslaciones (2)
  --fotogramas N        fotogramas del flipbook por ciclo para piezas que rotan o escalan (12)
  --rotaciones flipbook|ignorar   qué hacer con rotaciones y escalas animadas (flipbook)
  --margen N            margen en px alrededor del dibujo (24)
  --titulo TEXTO / --desc TEXTO / --fondo #hex

Propiedades personalizadas que respeta (objeto o material):
  iso_color  "#hex"  color base exacto (si no, diffuse_color del material, convertido a sRGB)
  iso_token  "nombre" nombre de token (si no, el del material)
  iso_id     "nombre" id/data-iso-part (si no, el nombre del objeto)
  iso_ignorar 1      no exportar ese objeto

La geometría estática se toma en el fotograma inicial cuando hay --animacion (si no, en el actual).
Se avisa si durante la animación dos piezas intercambian su orden de profundidad: el orden del
DOM es fijo, así que habrá que dividir la pieza o reordenar con JS en ese tramo.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

_dir = os.path.dirname(os.path.abspath(globals().get("__file__", "") or ""))
for cand in (_dir, os.path.dirname(bpy.data.filepath or "")):
    if cand and cand not in sys.path:
        sys.path.insert(0, cand)
from iso_comun import (blender_a_iso, clasificar_cara, color_base, detras_de, es_suelo, mezclar_hex,
                       ordenar_por_profundidad, proyectar, receptor_de, slug, tres_tonos, vectores_eje)

# ---------- Argumentos ----------
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(nombre, defecto):
    if nombre not in ARGS:
        return defecto
    if isinstance(defecto, bool):
        return True
    valor = ARGS[ARGS.index(nombre) + 1]
    return type(defecto)(valor) if defecto is not None else valor


SALIDA = arg("--salida", None)
MODO = arg("--modo", "iso")
UNIDAD = arg("--unidad", 40.0)
LUZ = arg("--luz", "left")
SOMBREADO = arg("--sombreado", "bandas")
TOKENS = arg("--tokens", None)
COLECCION = arg("--coleccion", None)
SOMBRAS = arg("--sombras", False)
ANIMACION = arg("--animacion", False)
PASO = arg("--paso", 2)
FOTOGRAMAS = max(2, arg("--fotogramas", 12))
ROTACIONES = arg("--rotaciones", "flipbook")
MARGEN = arg("--margen", 24.0)
TITULO = arg("--titulo", "Ilustración isométrica")
DESC = arg("--desc", "")
FONDO = arg("--fondo", None)
if not SALIDA:
    raise SystemExit("iso_export_svg: falta --salida RUTA.svg")
if TOKENS:
    SOMBREADO = "bandas"

VISTA = (1.0, 1.0, 1.0)  # dirección hacia el observador en mundo iso (núcleo de la proyección)
# Desplazamiento de la sombra en el suelo por unidad de altura (igual que iso.mjs); se refleja con luz a la derecha.
DIR_SOMBRA = (0.6, 0.25) if LUZ == "left" else (0.25, 0.6)
HACIA_LUZ = (-DIR_SOMBRA[0], -DIR_SOMBRA[1], 1.0)  # caras con n·HACIA_LUZ > 0 proyectan sombra
TIPOS = {"MESH", "CURVE", "SURFACE", "META", "FONT"}
r2 = lambda n: round(n + 0.0, 2)
escena = bpy.context.scene


def aviso(msg):
    print(f"[iso_export_svg] aviso: {msg}")


def normal(v):
    m = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / m for c in v)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def ir_a(fotograma):
    """Fotograma con fracción (para muestrear ciclos de flipbook de forma uniforme)."""
    entero = math.floor(fotograma)
    escena.frame_set(int(entero), subframe=fotograma - entero)


# ---------- Selección ----------
fuente = list(bpy.data.collections[COLECCION].all_objects) if COLECCION else list(escena.objects)
objetos = [o for o in fuente if o.type in TIPOS and not o.hide_render and o.visible_get()
           and not o.get("iso_ignorar")]
if not objetos:
    raise SystemExit("iso_export_svg: no hay objetos visibles que exportar")

F0, F1 = escena.frame_start, escena.frame_end
ACTUAL = escena.frame_current
ir_a(F0 if ANIMACION else ACTUAL)


# ---------- Geometría ----------
def geometria(o, tonos):
    """Caras visibles de o en el fotograma actual (mundo iso, de atrás adelante), sus vértices
    y los polígonos de las caras que miran a la luz (los que forman la sombra)."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(dg)
    malla = ev.to_mesh()
    mw = ev.matrix_world.copy()
    mn = mw.to_3x3().inverted_safe().transposed()
    verts = [blender_a_iso(mw @ v.co) for v in malla.vertices]
    caras, a_la_luz = [], []
    for p in malla.polygons:
        n = normal(blender_a_iso(mn @ p.normal))
        if dot(n, HACIA_LUZ) > 1e-6:
            a_la_luz.append([verts[i] for i in p.vertices])
        if dot(n, VISTA) <= 1e-6:
            continue  # cara de espaldas
        puntos = [verts[i] for i in p.vertices]
        centro = tuple(sum(c[k] for c in puntos) / len(puntos) for k in range(3))
        clase = clasificar_cara(n)
        if SOMBREADO == "suave":
            pesos = {"top": max(0.0, n[2]), "right": max(0.0, n[0]), "left": max(0.0, n[1])}
            relleno = mezclar_hex([(tonos[k], w ** 2) for k, w in pesos.items()])
        else:
            relleno = tonos[clase]
        caras.append({"puntos": puntos, "prof": dot(centro, VISTA), "clase": clase, "relleno": relleno})
    ev.to_mesh_clear()
    caras.sort(key=lambda c: c["prof"])
    return verts, caras, a_la_luz


def caja(verts):
    return (tuple(min(v[k] for v in verts) for k in range(3)),
            tuple(max(v[k] for v in verts) for k in range(3)))


def caja_rapida(o):
    """Caja en mundo iso a partir del bound_box evaluado (barato, para muestrear la animación)."""
    ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return caja([blender_a_iso(ev.matrix_world @ Vector(c)) for c in ev.bound_box])


piezas = []
ids_usados = set()
for o in objetos:
    tonos = tres_tonos(color_base(o), LUZ)
    verts, caras, luz = geometria(o, tonos)
    if not caras:
        continue
    pid = slug(str(o.get("iso_id") or o.name))
    while pid in ids_usados:
        pid += "-2"
    ids_usados.add(pid)
    mat = o.active_material
    token = slug(str(o.get("iso_token") or (mat.get("iso_token") if mat else None) or (mat.name if mat else pid)))
    mins, maxs = caja(verts)
    piezas.append({"id": pid, "obj": o, "min": mins, "max": maxs, "caras": caras, "verts": verts, "luz": luz,
                   "token": token, "tonos": tonos, "padre": slug(o.parent.name) if o.parent else None,
                   "pista": None, "flipbook": None})

orden = ordenar_por_profundidad(piezas)
por_id = {p["id"]: p for p in orden}

# ---------- Animación ----------
duracion = (F1 - F0) / (escena.render.fps / escena.render.fps_base) if F1 > F0 else 0
cruces = {}
if ANIMACION and F1 > F0:
    reposo = {p["id"]: blender_a_iso(p["obj"].matrix_world.translation) for p in orden}
    rot0 = {p["id"]: p["obj"].matrix_world.to_3x3().copy() for p in orden}
    gira = set()
    cajas0 = {p["id"]: caja_rapida(p["obj"]) for p in orden}
    fotogramas = list(range(F0, F1 + 1, max(1, PASO)))
    if fotogramas[-1] != F1:
        fotogramas.append(F1)
    pistas = {p["id"]: [] for p in orden}
    for f in fotogramas:
        ir_a(f)
        cajas = {}
        for p in orden:
            pos = blender_a_iso(p["obj"].matrix_world.translation)
            pistas[p["id"]].append((f, tuple(pos[k] - reposo[p["id"]][k] for k in range(3))))
            m3 = p["obj"].matrix_world.to_3x3()
            if any(abs(m3[i][j] - rot0[p["id"]][i][j]) > 1e-4 for i in range(3) for j in range(3)):
                gira.add(p["id"])
            mn, mx = caja_rapida(p["obj"])
            cajas[p["id"]] = {"min": mn, "max": mx}
        # ¿Algún par invierte su relación de profundidad respecto al fotograma inicial?
        for i, a in enumerate(orden):
            for b in orden[i + 1:]:
                ca0 = {"min": cajas0[a["id"]][0], "max": cajas0[a["id"]][1]}
                cb0 = {"min": cajas0[b["id"]][0], "max": cajas0[b["id"]][1]}
                antes = detras_de(ca0, cb0), detras_de(cb0, ca0)
                ahora = detras_de(cajas[a["id"]], cajas[b["id"]]), detras_de(cajas[b["id"]], cajas[a["id"]])
                if (antes[0] and ahora[1]) or (antes[1] and ahora[0]):
                    cruces.setdefault((a["id"], b["id"]), f)
    for (a, b), f in cruces.items():
        aviso(f"'{a}' y '{b}' intercambian su orden de profundidad (desde el fotograma {f}); "
              "el orden del DOM es fijo: divide una de las piezas o reordénalas con JS en ese tramo")

    for p in orden:
        pista = pistas[p["id"]]
        if p["id"] in gira and ROTACIONES == "flipbook":
            # Flipbook: N fotogramas uniformes del ciclo [F0, F1); la traslación queda horneada en cada uno.
            z_plano = p["min"][2]
            marcos = []
            for k in range(FOTOGRAMAS):
                ir_a(F0 + k * (F1 - F0) / FOTOGRAMAS)
                v_k, c_k, l_k = geometria(p["obj"], p["tonos"])
                marcos.append({"verts": v_k, "caras": c_k, "luz": l_k})
            p["flipbook"] = {"marcos": marcos, "z_plano": z_plano}
            todos_v = [v for m in marcos for v in m["verts"]]
            p["min_anim"], p["max_anim"] = caja(todos_v)
        elif any(any(abs(c) > 1e-5 for c in d) for _, d in pista):
            p["pista"] = pista
            if p["id"] in gira:
                aviso(f"'{p['id']}' rota o escala; con --rotaciones ignorar solo se exporta su traslación")
    ir_a(ACTUAL)
else:
    ir_a(ACTUAL)


# ---------- Sombras planas ----------
def area2(poly):
    return abs(sum(poly[i][0] * poly[i - 1][1] - poly[i - 1][0] * poly[i][1] for i in range(len(poly))))


def anillos_sombra(caras_luz, z_plano):
    """Sombra exacta (también de formas cóncavas): cada cara orientada a la luz proyectada en el plano.
    Los polígonos se solapan; la opacidad va en el grupo para que los solapes no oscurezcan más."""
    anillos = []
    for cara in caras_luz:
        anillo = [(round(v[0] + DIR_SOMBRA[0] * (v[2] - z_plano), 5),
                   round(v[1] + DIR_SOMBRA[1] * (v[2] - z_plano), 5)) for v in cara]
        if area2(anillo) > 1e-6:
            anillos.append(anillo)
    return anillos


suelo_z = min(p["min"][2] for p in orden)
sombras = []
if SOMBRAS:
    for p in orden:
        if es_suelo(p, suelo_z):
            continue  # losa o suelo: recibe, no proyecta
        receptor, z_plano = receptor_de(p, orden)
        sobre = receptor["id"]
        s = {"de": p["id"], "z": z_plano, "anillos": anillos_sombra(p["luz"], z_plano), "sobre": sobre}
        if p["flipbook"]:
            s["marcos"] = [anillos_sombra(m["luz"], z_plano) for m in p["flipbook"]["marcos"]]
        sombras.append(s)

# ---------- Encuadre ----------
todos = []
for p in orden:
    if p["flipbook"]:
        todos += [proyectar(v, MODO, UNIDAD) for m in p["flipbook"]["marcos"] for c in m["caras"] for v in c["puntos"]]
    else:
        todos += [proyectar(v, MODO, UNIDAD) for c in p["caras"] for v in c["puntos"]]
    if p["pista"]:  # que lo animado no se salga del lienzo
        for _, d in p["pista"]:
            todos += [proyectar(tuple(v[k] + d[k] for k in range(3)), MODO, UNIDAD) for v in (p["min"], p["max"])]
for s in sombras:
    for anillos in s.get("marcos", [s["anillos"]]):
        todos += [proyectar((x, y, s["z"]), MODO, UNIDAD) for a in anillos for x, y in a]
x0, y0 = min(p[0] for p in todos) - MARGEN, min(p[1] for p in todos) - MARGEN
x1, y1 = max(p[0] for p in todos) + MARGEN, max(p[1] for p in todos) + MARGEN
vb = f"{r2(x0)} {r2(y0)} {r2(x1 - x0)} {r2(y1 - y0)}"


def pts(lista):
    return " ".join(",".join(f"{r2(c):g}" for c in proyectar(v, MODO, UNIDAD)) for v in lista)


def relleno(p, c):
    if TOKENS:
        var = f"var(--{TOKENS}-{p['token']}-{c['clase']})"
        return f'style="fill:{var};stroke:{var}"'
    return f'fill="{c["relleno"]}" stroke="{c["relleno"]}"'


def poligonos(p, caras):
    return "".join(f'<polygon class="face-{c["clase"]}" {relleno(p, c)} points="{pts(c["puntos"])}"/>'
                   for c in caras)


def retraso(k):
    """animation-delay del fotograma k: visible en [(k − ½)·T/N, (k + ½)·T/N).
    El medio paso aleja los cambios de las fronteras, así el redondeo a ms nunca deja
    dos fotogramas visibles a la vez (ni ninguno)."""
    return -(((FOTOGRAMAS - k) % FOTOGRAMAS) + 0.5) * duracion / FOTOGRAMAS


# ---------- CSS ----------
animadas = [p for p in orden if p["pista"] or p["flipbook"]]
css = [".iso-obj polygon { stroke-width: .5; stroke-linejoin: round; }"]
if any(p["flipbook"] for p in orden):
    # Estado estático (sin animación o con movimiento reducido): solo el primer fotograma.
    css.append(".iso-flipbook > .iso-fotograma + .iso-fotograma { opacity: 0; }")
if TOKENS:
    paleta, vistos = [], set()
    for p in orden:
        if p["token"] in vistos:
            continue
        vistos.add(p["token"])
        paleta += [f"  --{TOKENS}-{p['token']}-{k}: {p['tonos'][k]};" for k in ("top", "left", "right")]
    paleta += [f"  --{TOKENS}-sombra: #000;"]
    if FONDO:
        paleta += [f"  --{TOKENS}-fondo: {FONDO};"]
    css.insert(0, ":root {\n" + "\n".join(paleta) + "\n}")
if animadas:
    reglas = []
    if any(p["flipbook"] for p in orden):
        corte = round(100 / FOTOGRAMAS, 4)
        css.append(f"@keyframes iso-flipbook-{FOTOGRAMAS} {{\n    0% {{ opacity: 1; }}\n    {corte:g}% {{ opacity: 0; }}\n"
                   f"    100% {{ opacity: 0; }}\n}}")
    for p in animadas:
        pid = p["id"]
        if p["flipbook"]:
            regla = f"animation: iso-flipbook-{FOTOGRAMAS} {duracion:.5f}s step-end infinite;"
            reglas.append(f'  [data-iso-part="{pid}"] > .iso-fotograma {{ {regla} }}')
            if any(s["de"] == pid for s in sombras):
                reglas.append(f'  [data-iso-shadow-of="{pid}"] > .iso-fotograma {{ {regla} }}')
            continue
        pista = p["pista"]
        f0 = pista[0][0]
        span = (pista[-1][0] - f0) or 1
        pasos, pasos_s = [], []
        for f, d in pista:
            pct = f"{round((f - f0) / span * 100, 2):g}%"
            sx, sy = proyectar(d, MODO, UNIDAD)
            pasos.append(f"    {pct} {{ transform: translate({r2(sx):g}px, {r2(sy):g}px); }}")
            # La sombra se desliza con la pieza y, si sube, se corre en la dirección de la luz.
            sx, sy = proyectar((d[0] + DIR_SOMBRA[0] * d[2], d[1] + DIR_SOMBRA[1] * d[2], 0.0), MODO, UNIDAD)
            pasos_s.append(f"    {pct} {{ transform: translate({r2(sx):g}px, {r2(sy):g}px); }}")
        nombre = f"iso-{pid}"
        css.append(f"@keyframes {nombre} {{\n" + "\n".join(pasos) + "\n}")
        reglas.append(f'  [data-iso-part="{pid}"] {{ animation: {nombre} {duracion:.5f}s linear infinite; }}')
        if any(s["de"] == pid for s in sombras):
            css.append(f"@keyframes {nombre}-sombra {{\n" + "\n".join(pasos_s) + "\n}")
            reglas.append(f'  [data-iso-shadow-of="{pid}"] {{ animation: {nombre}-sombra {duracion:.5f}s linear infinite; }}')
    css.append("@media (prefers-reduced-motion: no-preference) {\n" + "\n".join(reglas) + "\n}")

# ---------- SVG ----------
salida = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-labelledby="iso-title iso-desc">',
          f'<title id="iso-title">{TITULO}</title><desc id="iso-desc">{DESC}</desc>',
          "<style>\n" + "\n".join(css) + "\n</style>"]
if FONDO:
    fondo_fill = f'style="fill:var(--{TOKENS}-fondo)"' if TOKENS else f'fill="{FONDO}"'
    salida.append(f'<rect class="iso-bg" x="{r2(x0)}" y="{r2(y0)}" width="{r2(x1 - x0)}" height="{r2(y1 - y0)}" {fondo_fill}/>')

# Cada sombra se dibuja justo después de la pieza que la recibe, recortada a sus caras superiores.
fill_sombra = f'style="fill:var(--{TOKENS}-sombra)"' if TOKENS else 'fill="#000"'


def poligonos_sombra(s, anillos):
    return "".join(f'<polygon {fill_sombra} points="{pts([(x, y, s["z"]) for x, y in a])}"/>' for a in anillos)


def sombra_svg(s):
    # opacity en el grupo (no fill-opacity en cada polígono): los solapes no se acumulan.
    if "marcos" in s:
        marcos = "".join(f'<g class="iso-fotograma" style="animation-delay:{retraso(k):.5f}s">{poligonos_sombra(s, a)}</g>'
                         for k, a in enumerate(s["marcos"]))
        return f'<g class="iso-shadow iso-flipbook" data-iso-shadow-of="{s["de"]}" opacity=".12">{marcos}</g>'
    return f'<g class="iso-shadow" data-iso-shadow-of="{s["de"]}" opacity=".12">{poligonos_sombra(s, s["anillos"])}</g>'


receptores = {}
for s in sombras:
    receptores.setdefault(s["sobre"], []).append(s)
clips = []
for rid in receptores:
    techo = "".join(f'<polygon points="{pts(c["puntos"])}"/>' for c in por_id[rid]["caras"] if c["clase"] == "top")
    if techo:
        clips.append(f'<clipPath id="iso-clip-{rid}">{techo}</clipPath>')
if clips:
    salida.append("<defs>" + "".join(clips) + "</defs>")

for p in orden:
    padre = f' data-iso-parent="{p["padre"]}"' if p["padre"] else ""
    if p["flipbook"]:
        marcos = "".join(f'<g class="iso-fotograma" style="animation-delay:{retraso(k):.5f}s">{poligonos(p, m["caras"])}</g>'
                         for k, m in enumerate(p["flipbook"]["marcos"]))
        salida.append(f'<g id="{p["id"]}" data-iso-part="{p["id"]}" class="iso-obj iso-flipbook"{padre}>{marcos}</g>')
    else:
        salida.append(f'<g id="{p["id"]}" data-iso-part="{p["id"]}" class="iso-obj"{padre}>{poligonos(p, p["caras"])}</g>')
    if p["id"] in receptores:
        clip = f' clip-path="url(#iso-clip-{p["id"]})"' if f'id="iso-clip-{p["id"]}"' in "".join(clips) else ""
        salida.append(f'<g class="iso-sombras" data-iso-shadows-on="{p["id"]}"{clip}>' +
                      "".join(sombra_svg(s) for s in receptores[p["id"]]) + "</g>")
salida.append("</svg>")

os.makedirs(os.path.dirname(os.path.abspath(SALIDA)), exist_ok=True)
with open(SALIDA, "w", encoding="utf-8") as f:
    f.write("\n".join(salida) + "\n")

manifiesto = {
    "fuente": bpy.data.filepath or "(sin guardar)",
    "modo": MODO, "unidad": UNIDAD, "luz": LUZ, "viewBox": vb,
    "ejes_px": vectores_eje(MODO, UNIDAD),
    "duracion_s": round(duracion, 5) if animadas else None,
    # Pares que intercambian su orden de profundidad durante la animación (para reordenar con JS).
    "cruces": [{"piezas": [a, b], "desde_fotograma": f,
                "desde_s": round((f - F0) / (escena.render.fps / escena.render.fps_base), 3)}
               for (a, b), f in cruces.items()],
    "piezas": [{"id": p["id"], "objeto": p["obj"].name, "orden": i, "padre": p["padre"],
                "color_base": color_base(p["obj"]), "token": p["token"] if TOKENS else None,
                "bbox_mundo": {"min": [round(c, 4) for c in p["min"]], "max": [round(c, 4) for c in p["max"]]},
                "caras": len(p["caras"]),
                "animada": "flipbook" if p["flipbook"] else ("traslacion" if p["pista"] else None),
                "fotogramas": FOTOGRAMAS if p["flipbook"] else None}
               for i, p in enumerate(orden)],
}
with open(os.path.splitext(SALIDA)[0] + ".json", "w", encoding="utf-8") as f:
    json.dump(manifiesto, f, ensure_ascii=False, indent=2)

n_fb = sum(1 for p in orden if p["flipbook"])
print(f"[iso_export_svg] {SALIDA}: {len(orden)} piezas, {sum(len(p['caras']) for p in orden)} caras, "
      f"{len(sombras)} sombras, {len(animadas)} animadas ({n_fb} en flipbook)")
