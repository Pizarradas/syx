"""iso_export_capas.py — Renderiza cada pieza de la escena como una capa PNG recortada,
con un manifiesto JSON y un SVG compositor listo para animar en la web.

Úsalo cuando quieras la riqueza de un render real (materiales, iluminación, Cycles/EEVEE)
y aun así mover cada pieza por separado en la web. Para dibujo vectorial puro, usa
iso_export_svg.py.

Uso (línea de comandos, sin interfaz):
  blender escena.blend --background --python iso_export_capas.py -- --carpeta salida/ [opciones]
Uso por MCP o desde la consola de Python de Blender:
  import sys, runpy; sys.argv = ["blender", "--", "--carpeta", r"C:\\ruta\\salida"]
  runpy.run_path(r"C:\\ruta\\iso_export_capas.py", run_name="__main__")

Requiere una cámara ortográfica isométrica (ejecuta antes iso_setup.py o colócala a mano).

Opciones:
  --carpeta RUTA          carpeta de salida (obligatoria): capas/*.png, escena.svg, manifiesto.json, referencia.png
  --por objeto|coleccion  qué es una pieza: cada objeto, o cada colección hija de la escena (objeto)
  --oclusion ninguna|corte
        ninguna: cada capa es la pieza completa (lo mejor para animar; el orden lo da el DOM)
        corte:   las demás piezas actúan como holdout y recortan lo que tapan (composición
                 estática exacta, pero el recorte queda horneado si luego mueves la pieza)
  --margen N              píxeles de aire alrededor de cada recorte (8)
  --sin-referencia        no renderiza la imagen completa de referencia

  --sombras               capa de sombra propia por pieza: la sombra que una pieza proyecta sobre las
                          demás va en <id>-sombra.png y se coloca tras su receptor, así puede moverse con
                          ella. Método por cociente: render sin la pieza / render con la pieza invisible
                          pero proyectando; aísla solo su sombra con cualquier motor (EEVEE o Cycles).
                          Con luces de tipo sol, el render se limita a la zona donde puede caer la sombra.
                          Necesita luces que proyecten sombra.
  --muestras-sombra N     muestras de Cycles para las pasadas de sombra (32; solo con Cycles)

Propiedades personalizadas: iso_id (nombre de la pieza), iso_ignorar (no exportar).
El manifiesto incluye ejes_px: cuántos px se mueve una pieza por cada unidad de Blender
en x, y, z del mundo isométrico, para animar en espacio de mundo.
"""
import json
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

_dir = os.path.dirname(os.path.abspath(globals().get("__file__", "") or ""))
for cand in (_dir, os.path.dirname(bpy.data.filepath or "")):
    if cand and cand not in sys.path:
        sys.path.insert(0, cand)
from iso_comun import blender_a_iso, es_suelo, ordenar_por_profundidad, piezas_debajo, receptor_de, slug

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(nombre, defecto):
    if nombre not in ARGS:
        return defecto
    if isinstance(defecto, bool):
        return True
    valor = ARGS[ARGS.index(nombre) + 1]
    return type(defecto)(valor) if defecto is not None else valor


CARPETA = arg("--carpeta", None)
POR = arg("--por", "objeto")
OCLUSION = arg("--oclusion", "ninguna")
MARGEN = arg("--margen", 8)
REFERENCIA = not arg("--sin-referencia", False)
SOMBRAS = arg("--sombras", False)
MUESTRAS_SOMBRA = arg("--muestras-sombra", 32)
if not CARPETA:
    raise SystemExit("iso_export_capas: falta --carpeta RUTA")

escena = bpy.context.scene
cam = escena.camera
if cam is None or cam.data.type != "ORTHO":
    raise SystemExit("iso_export_capas: la escena necesita una cámara ortográfica (ejecuta iso_setup.py)")

render = escena.render
W = int(render.resolution_x * render.resolution_percentage / 100)
H = int(render.resolution_y * render.resolution_percentage / 100)
TIPOS = {"MESH", "CURVE", "SURFACE", "META", "FONT"}
dg = bpy.context.evaluated_depsgraph_get()

# ---------- Piezas ----------
def visibles(objs):
    return [o for o in objs if o.type in TIPOS and not o.hide_render and o.visible_get() and not o.get("iso_ignorar")]


if POR == "coleccion":
    piezas = [{"id": slug(c.name), "objetos": visibles(c.all_objects)} for c in escena.collection.children]
    sueltos = visibles(escena.collection.objects)
    piezas += [{"id": slug(str(o.get("iso_id") or o.name)), "objetos": [o]} for o in sueltos]
else:
    piezas = [{"id": slug(str(o.get("iso_id") or o.name)), "objetos": [o]} for o in visibles(escena.objects)]
piezas = [p for p in piezas if p["objetos"]]
if not piezas:
    raise SystemExit("iso_export_capas: no hay piezas visibles")


def esquinas(o):
    ev = o.evaluated_get(dg)
    return [ev.matrix_world @ Vector(c) for c in ev.bound_box]


for p in piezas:
    pts = [v for o in p["objetos"] for v in esquinas(o)]
    iso = [blender_a_iso(v) for v in pts]
    p["min"] = tuple(min(v[k] for v in iso) for k in range(3))
    p["max"] = tuple(max(v[k] for v in iso) for k in range(3))
    ndc = [world_to_camera_view(escena, cam, v) for v in pts]
    x0 = max(0.0, min(v.x for v in ndc)); x1 = min(1.0, max(v.x for v in ndc))
    y0 = max(0.0, min(v.y for v in ndc)); y1 = min(1.0, max(v.y for v in ndc))
    mx, my = MARGEN / W, MARGEN / H
    p["borde"] = (max(0.0, x0 - mx), min(1.0, x1 + mx), max(0.0, y0 - my), min(1.0, y1 + my))

orden = ordenar_por_profundidad(piezas)
todos = [o for p in orden for o in p["objetos"]]

# ---------- Vectores de eje en px ----------
def a_px(v):
    c = world_to_camera_view(escena, cam, v)
    return Vector((c.x * W, (1 - c.y) * H))


o0 = a_px(Vector((0, 0, 0)))
ejes = {"x": a_px(Vector((1, 0, 0))) - o0,      # iso.x = +X de Blender
        "y": a_px(Vector((0, -1, 0))) - o0,     # iso.y = −Y de Blender
        "z": a_px(Vector((0, 0, 1))) - o0}
ejes_px = {k: [round(v.x, 4), round(v.y, 4)] for k, v in ejes.items()}

# ---------- Sombras por cociente ----------
# Visibilidades de rayo que se apagan para que una pieza solo proyecte sombra (sin verse ni rebotar luz).
RAYOS = ("visible_camera", "visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter")

def leer_rgba(ruta):
    """PNG → array (alto, ancho, 4) en [0,1], fila 0 arriba. Solo bpy y numpy (vienen con Blender)."""
    import numpy as np
    img = bpy.data.images.load(ruta, check_existing=False)
    try:
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        return px.reshape(h, w, 4)[::-1]
    finally:
        bpy.data.images.remove(img)


def escribir_rgba(arr, ruta):
    import numpy as np
    h, w = arr.shape[:2]
    img = bpy.data.images.new("iso_tmp", w, h, alpha=True)
    img.pixels.foreach_set(np.ascontiguousarray(arr[::-1]).ravel())
    img.filepath_raw = ruta
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


def sombra_por_cociente(con, sin, destino, ox, oy, umbral=0.03):
    """Capa de sombra que, superpuesta sobre 'sin', reproduce 'con'.

    α por píxel = 1 − luminancia(con) / luminancia(sin) donde 'sin' tiene superficie. El color es un
    único tinte por sombra: la mediana de S = (con − sin·(1 − α)) / α en la zona bien sombreada
    (α > 0.3). Por píxel, S amplificaría el ruido de muestreo; un tinte único da una sombra limpia
    con el matiz del ambiente (por ejemplo, azulado bajo un cielo azul). Escribe el PNG recortado
    y devuelve (x, y, w, h) en px de pantalla, o None si no hay sombra."""
    import numpy as np
    a, b = leer_rgba(con), leer_rgba(sin)
    # Cociente en valores sRGB codificados (no lineales): el navegador mezcla la capa negra con alfa
    # en ese espacio, así que es ahí donde negro·α debe reproducir el oscurecimiento del render.
    lum = lambda x: (x[..., :3] * np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)).sum(-1)
    ya, yb = lum(a), lum(b)
    alfa = np.clip(1 - ya / np.maximum(yb, 1e-4), 0, 1)
    alfa[b[..., 3] < 0.5] = 0           # solo donde hay receptor
    alfa[alfa < umbral] = 0             # ruido de muestreo
    filas, cols = np.nonzero(alfa)
    if filas.size == 0:
        return None
    f0, f1, c0, c1 = filas.min(), filas.max(), cols.min(), cols.max()
    al = alfa[..., None]
    zona = alfa > 0.3
    tinte = np.zeros(3, dtype=np.float32)
    if zona.sum() > 20:
        s_px = np.clip((a[..., :3] - b[..., :3] * (1 - al)) / np.maximum(al, 1e-3), 0, 1)
        tinte = np.median(s_px[zona], axis=0)
    trozo = np.zeros((f1 - f0 + 1, c1 - c0 + 1, 4), dtype=np.float32)
    trozo[..., :3] = tinte
    trozo[..., 3] = alfa[f0:f1 + 1, c0:c1 + 1]
    escribir_rgba(trozo, destino)
    return int(ox + c0), int(oy + f0), int(c1 - c0 + 1), int(f1 - f0 + 1)


def borde_sombra(p):
    """Zona de pantalla (borde normalizado) donde puede caer la sombra de p. Con solo luces de tipo sol,
    proyecta la caja de p hasta el plano más bajo de la escena; con otras luces, todo el fotograma."""
    luces = [o for o in escena.objects if o.type == "LIGHT" and not o.hide_render]
    if not luces or any(l.data.type != "SUN" for l in luces):
        return (0.0, 1.0, 0.0, 1.0)
    esq = [v for o in p["objetos"] for v in esquinas(o)]
    z0 = min(v.z for o in todos for v in esquinas(o))
    puntos = list(esq)
    for l in luces:
        d = -(l.matrix_world.to_3x3() @ Vector((0, 0, 1)))   # dirección en la que viaja la luz
        if d.z < -1e-6:
            puntos += [c + d * ((c.z - z0) / -d.z) for c in esq]
    ndc = [world_to_camera_view(escena, cam, v) for v in puntos]
    m = 2 * MARGEN / W
    return (max(0.0, min(v.x for v in ndc) - m), min(1.0, max(v.x for v in ndc) + m),
            max(0.0, min(v.y for v in ndc) - m), min(1.0, max(v.y for v in ndc) + m))


# ---------- Render por capa ----------
capas_dir = os.path.join(CARPETA, "capas")
os.makedirs(capas_dir, exist_ok=True)
estado = {o.name: (o.hide_render, getattr(o, "is_holdout", False)) for o in escena.objects}
r_estado = (render.use_border, render.use_crop_to_border, render.border_min_x, render.border_max_x,
            render.border_min_y, render.border_max_y, render.film_transparent, render.filepath,
            render.image_settings.file_format, render.image_settings.color_mode)
render.film_transparent = True
render.image_settings.file_format = "PNG"
render.image_settings.color_mode = "RGBA"

manifiesto_piezas = []
try:
    for i, p in enumerate(orden):
        mios = {o.name for o in p["objetos"]}
        for o in todos:
            if o.name in mios:
                o.hide_render = False
                o.is_holdout = False
            elif OCLUSION == "corte":
                o.hide_render = False
                o.is_holdout = True
            else:
                o.hide_render = True
        bx0, bx1, by0, by1 = p["borde"]
        render.use_border = True
        render.use_crop_to_border = True
        render.border_min_x, render.border_max_x = bx0, bx1
        render.border_min_y, render.border_max_y = by0, by1
        archivo = os.path.join(capas_dir, f"{p['id']}.png")
        render.filepath = archivo
        bpy.ops.render.render(write_still=True)
        x, y = round(bx0 * W), round((1 - by1) * H)
        w, h = round((bx1 - bx0) * W), round((by1 - by0) * H)
        manifiesto_piezas.append({"id": p["id"], "archivo": f"capas/{p['id']}.png", "orden": i, "sombra": None,
                                  "x": x, "y": y, "w": w, "h": h,
                                  "objetos": sorted(mios),
                                  "bbox_mundo": {"min": [round(c, 4) for c in p["min"]],
                                                 "max": [round(c, 4) for c in p["max"]]}})
        print(f"[iso_export_capas] {i + 1}/{len(orden)} {p['id']} → {w}×{h} en ({x},{y})")

    if SOMBRAS:
        muestras = getattr(escena.cycles, "samples", None) if render.engine == "CYCLES" else None
        if muestras is not None:
            escena.cycles.samples = MUESTRAS_SOMBRA
        suelo_z = min(p["min"][2] for p in orden)
        por_id_m = {m["id"]: m for m in manifiesto_piezas}
        tmp_con = os.path.join(capas_dir, "_sombra_con.png")
        tmp_sin = os.path.join(capas_dir, "_sombra_sin.png")
        try:
            for p in orden:
                if es_suelo(p, suelo_z):
                    continue
                mios = {o.name for o in p["objetos"]}
                bx0, bx1, by0, by1 = borde_sombra(p)
                render.use_border, render.use_crop_to_border = True, True
                render.border_min_x, render.border_max_x = bx0, bx1
                render.border_min_y, render.border_max_y = by0, by1
                # En las dos pasadas solo existen la pieza y lo que tiene debajo (lo que intercepta su
                # sombra). Las demás se ocultan: si proyectaran contaminarían el cociente, y si solo se
                # vieran taparían trozos de la sombra que quedarían como huecos al moverlas.
                base = {o.name for q in piezas_debajo(p, orden) for o in q["objetos"]}
                if not base:                      # nada debajo: recibe la pieza más baja (el suelo)
                    receptor, _ = receptor_de(p, orden)
                    base = {o.name for o in receptor["objetos"]}
                # Sin la pieza.
                for o in todos:
                    o.hide_render, o.is_holdout = o.name not in base, False
                    for rayo in RAYOS + ("visible_shadow",):
                        setattr(o, rayo, True)
                render.filepath = tmp_sin
                bpy.ops.render.render(write_still=True)
                # Con la pieza, invisible para la cámara y para los rebotes: solo proyecta sombra.
                for o in todos:
                    if o.name in mios:
                        o.hide_render = False
                        for rayo in RAYOS:
                            setattr(o, rayo, False)
                render.filepath = tmp_con
                bpy.ops.render.render(write_still=True)
                caja = sombra_por_cociente(tmp_con, tmp_sin, os.path.join(capas_dir, f"{p['id']}-sombra.png"),
                                           round(bx0 * W), round((1 - by1) * H))
                if caja is None:
                    print(f"[iso_export_capas] {p['id']}: sin sombra visible (¿hay luces que proyecten sombra?)")
                    continue
                receptor, _ = receptor_de(p, orden)
                x, y, w, h = caja
                por_id_m[p["id"]]["sombra"] = {"archivo": f"capas/{p['id']}-sombra.png", "x": x, "y": y,
                                               "w": w, "h": h, "sobre": receptor["id"]}
                print(f"[iso_export_capas] sombra de {p['id']} → {w}×{h} en ({x},{y}), sobre {receptor['id']}")
        finally:
            for o in todos:
                for rayo in RAYOS + ("visible_shadow",):
                    setattr(o, rayo, True)
            if muestras is not None:
                escena.cycles.samples = muestras
            for t in (tmp_con, tmp_sin):
                if os.path.exists(t):
                    os.remove(t)

    if REFERENCIA:
        for o in todos:
            o.hide_render, o.is_holdout = False, False
        render.use_border = False
        render.filepath = os.path.join(CARPETA, "referencia.png")
        bpy.ops.render.render(write_still=True)
finally:
    for o in escena.objects:
        if o.name in estado:
            o.hide_render, hold = estado[o.name]
            if hasattr(o, "is_holdout"):
                o.is_holdout = hold
    (render.use_border, render.use_crop_to_border, render.border_min_x, render.border_max_x,
     render.border_min_y, render.border_max_y, render.film_transparent, render.filepath,
     render.image_settings.file_format, render.image_settings.color_mode) = r_estado

# ---------- Manifiesto y SVG compositor ----------
manifiesto = {"fuente": bpy.data.filepath or "(sin guardar)", "ancho": W, "alto": H,
              "oclusion": OCLUSION, "por": POR, "ejes_px": ejes_px, "piezas": manifiesto_piezas}
with open(os.path.join(CARPETA, "manifiesto.json"), "w", encoding="utf-8") as f:
    json.dump(manifiesto, f, ensure_ascii=False, indent=2)

titulo = os.path.splitext(os.path.basename(bpy.data.filepath or "escena"))[0]
lineas = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
          f'viewBox="0 0 {W} {H}" role="img" data-iso-raster="capas">',
          f"<title>{titulo}</title>"]
def imagen(d):
    return (f'<image href="{d["archivo"]}" xlink:href="{d["archivo"]}" x="{d["x"]}" y="{d["y"]}" '
            f'width="{d["w"]}" height="{d["h"]}"/>')


for m in manifiesto_piezas:
    lineas.append(f'<g id="{m["id"]}" data-iso-part="{m["id"]}">{imagen(m)}</g>')
    # Las sombras que recibe esta pieza van justo después de ella y antes de lo que tiene delante.
    for q in manifiesto_piezas:
        if q.get("sombra") and q["sombra"]["sobre"] == m["id"]:
            lineas.append(f'<g class="iso-shadow" data-iso-shadow-of="{q["id"]}">{imagen(q["sombra"])}</g>')
lineas.append("</svg>")
with open(os.path.join(CARPETA, "escena.svg"), "w", encoding="utf-8") as f:
    f.write("\n".join(lineas) + "\n")
n_sombras = sum(1 for m in manifiesto_piezas if m.get("sombra"))
print(f"[iso_export_capas] {CARPETA}: {len(manifiesto_piezas)} capas, {n_sombras} sombras, ejes_px={ejes_px}")
