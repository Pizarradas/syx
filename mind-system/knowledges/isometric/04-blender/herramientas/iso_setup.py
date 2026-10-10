"""iso_setup.py — Prepara una escena de Blender para render flat isométrico.

Uso dentro de Blender (Scripting > Run Script) o en línea de comandos:
    blender escena.blend --python iso_setup.py -- --mode iso --light left --res 2048 --outline 0 --engine eevee
    … -- --materiales conservar     solo cámara y encuadre, para renders con materiales y luces reales

Qué hace:
  1. Crea o ajusta una cámara ortográfica isométrica (real 54.736° o dimétrica 60°, Z = 45°).
  2. Reemplaza los materiales por un shader "flat de 3 tonos" basado en la normal:
     la cara superior es clara, el lateral iluminado es medio y el lateral en sombra es oscuro.
     El resultado no depende de las luces de la escena.
  3. Pone View Transform = Standard (si no, AgX o Filmic alteran los hex de la paleta)
     y activa el fondo transparente.
  4. Activa Freestyle de forma opcional para dibujar contornos.
Con --materiales conservar solo hace 1 y el fondo transparente: no toca materiales, luces ni
View Transform (para un render «rico» que luego se exporta con iso_export_capas.py).
Los tres tonos salen de iso_comun.tres_tonos(): la misma fórmula que shade() en iso.mjs,
así el render de Blender, el SVG exportado y la web comparten hex exactos. Cada material
nuevo guarda su color base en la propiedad 'iso_color' (la lee iso_export_svg.py).
Probado con bpy 4.2 y 5.2 (Cycles, CPU). En 5.x EEVEE usa el identificador BLENDER_EEVEE (el script prueba ambos).
Revisa el resultado en el visor antes de renderizar en lote.
"""
import math
import os
import sys
import bpy
from mathutils import Vector

_dir = os.path.dirname(os.path.abspath(globals().get("__file__", "") or ""))
if _dir and _dir not in sys.path:
    sys.path.insert(0, _dir)
from iso_comun import color_base, hex_a_rgb, srgb_a_lineal, tres_tonos

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return type(default)(ARGS[ARGS.index(name) + 1]) if name in ARGS else default

MODE = arg("--mode", "iso")          # iso | dimetric
LIGHT = arg("--light", "left")       # left | right (lado del lateral iluminado)
RES = arg("--res", 2048)
OUTLINE = arg("--outline", 0)        # 0 sin contorno, >0 grosor en px
ENGINE = arg("--engine", "eevee")    # eevee | cycles (cycles sirve en servidores sin GPU)
MATERIALES = arg("--materiales", "flat")  # flat | conservar

scene = bpy.context.scene

# ---------- Cámara ----------
cam = scene.camera
if cam is None:
    cam = bpy.data.objects.new("IsoCam", bpy.data.cameras.new("IsoCam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
cam.data.type = "ORTHO"
rx = math.degrees(math.atan(math.sqrt(2))) if MODE == "iso" else 60.0   # 54.7356 o 60
cam.rotation_euler = (math.radians(rx), 0.0, math.radians(45.0))
# Coloca la cámara lejos en la dirección de visión y encuadra la escena.
bpy.context.view_layer.update()      # matrix_world al día antes de medir
meshes = [o for o in scene.objects if o.type == "MESH"]
if meshes:
    # Encuadre: proyecta las esquinas sobre los ejes derecha/arriba de la cámara y centra el rectángulo resultante.
    rot = cam.rotation_euler.to_matrix()
    right, up, back = rot @ Vector((1, 0, 0)), rot @ Vector((0, 1, 0)), rot @ Vector((0, 0, 1))
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    xs, ys, zs = [p.dot(right) for p in pts], [p.dot(up) for p in pts], [p.dot(back) for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    depth = max(zs) - min(zs)
    cam.location = right * cx + up * cy + back * (max(zs) + depth + 1)
    cam.data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.1
    cam.data.clip_end = (depth + 1) * 4
scene.render.resolution_x = RES
scene.render.resolution_y = RES

# ---------- Color exacto y transparencia ----------
if MATERIALES == "flat":
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
scene.render.film_transparent = True

# ---------- Motor ----------
for engine in (("CYCLES",) if ENGINE == "cycles" else ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT")):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
if scene.render.engine == "CYCLES":
    scene.cycles.samples = 16          # con emisión pura bastan pocas muestras
    scene.cycles.device = "CPU"

# ---------- Shader flat de 3 tonos ----------
def lineal(hexcol):
    """Hex sRGB → RGB lineal (lo que espera el nodo de emisión; Standard lo devuelve a sRGB)."""
    return tuple(srgb_a_lineal(c) for c in hex_a_rgb(hexcol))

def flat_material(mat, base_hex):
    t = tres_tonos(base_hex, "left")          # left = medio, right = oscuro
    top, mid, dark = lineal(t["top"]), lineal(t["left"]), lineal(t["right"])
    side_lit, side_dark = (mid, dark) if LIGHT == "left" else (dark, mid)
    m = bpy.data.materials.new((mat.name if mat else "Iso") + "_flat")
    m["iso_color"] = base_hex
    m.diffuse_color = (*mid, 1)
    import warnings
    with warnings.catch_warnings():               # use_nodes desaparece en Blender 6.0 (siempre activo)
        warnings.simplefilter("ignore", DeprecationWarning)
        if hasattr(m, "use_nodes") and not m.use_nodes:
            m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    # Con la cámara en (X, 0, 45°) la cámara queda en el cuadrante (+X, −Y) del mundo:
    # la cara con normal +X sale a la DERECHA de pantalla y la de normal −Y a la IZQUIERDA.
    mix1 = nt.nodes.new("ShaderNodeMix"); mix1.data_type = "RGBA"
    mix2 = nt.nodes.new("ShaderNodeMix"); mix2.data_type = "RGBA"
    gt_y = nt.nodes.new("ShaderNodeMath"); gt_y.operation = "LESS_THAN"; gt_y.inputs[1].default_value = -0.5
    gt_z = nt.nodes.new("ShaderNodeMath"); gt_z.operation = "GREATER_THAN"; gt_z.inputs[1].default_value = 0.5
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    L = nt.links
    L.new(geo.outputs["Normal"], sep.inputs[0])
    L.new(sep.outputs["Y"], gt_y.inputs[0])
    L.new(sep.outputs["Z"], gt_z.inputs[0])
    # mix1: cara derecha (+X) frente a cara izquierda (−Y)
    L.new(gt_y.outputs[0], mix1.inputs["Factor"])
    mix1.inputs[6].default_value = (*side_dark, 1)   # A = derecha
    mix1.inputs[7].default_value = (*side_lit, 1)    # B = izquierda
    # mix2: lateral frente a superior
    L.new(gt_z.outputs[0], mix2.inputs["Factor"])
    L.new(mix1.outputs[2], mix2.inputs[6])
    mix2.inputs[7].default_value = (*top, 1)
    L.new(mix2.outputs[2], emit.inputs["Color"])
    L.new(emit.outputs[0], out.inputs["Surface"])
    return m

cache = {}
for o in (meshes if MATERIALES == "flat" else []):
    for slot in o.material_slots or []:
        mat = slot.material
        if mat is not None and mat.name.endswith("_flat") and mat.get("iso_color"):
            continue                          # ya preparado en una pasada anterior
        base_hex = str(mat["iso_color"]) if mat is not None and mat.get("iso_color") else color_base(o)
        key = (mat.name if mat else None, base_hex)
        if key not in cache:
            cache[key] = flat_material(mat, base_hex)
        slot.material = cache[key]
    if not o.material_slots:
        base_hex = color_base(o)
        if (None, base_hex) not in cache:
            cache[(None, base_hex)] = flat_material(None, base_hex)
        o.data.materials.append(cache[(None, base_hex)])

# ---------- Contorno opcional ----------
scene.render.use_freestyle = OUTLINE > 0
if OUTLINE > 0:
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = float(OUTLINE)
    fs = bpy.context.view_layer.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new("IsoContorno")
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("IsoLinea")
    ls.linestyle.color = (0.08, 0.09, 0.15)    # oscuro azulado, no negro puro
    ls.linestyle.thickness = float(OUTLINE)

print(f"[iso_setup] modo={MODE} camX={rx:.4f} luz={LIGHT} res={RES} contorno={OUTLINE} materiales={MATERIALES}")
