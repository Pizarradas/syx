"""Prepara la variante «render rico» de la escena de ejemplo y la guarda como escena_rica.blend.

Convierte el color de vista de cada material en un material Principled con luz real, añade un sol
(luz arriba-izquierda: techo y lateral izquierdo iluminados, derecho en sombra) y luz ambiente,
y deja Cycles como motor. Después:

  python3 ../herramientas/con_bpy.py escena_rica.blend iso_setup.py --guardar escena_rica.blend -- --materiales conservar --engine cycles --res 1024
  python3 ../herramientas/con_bpy.py escena_rica.blend iso_export_capas.py -- --carpeta salida/capas-ricas --sombras

(con Blender instalado: blender escena_rica.blend --background --python … -- …)
"""
import os
import warnings

import bpy
from mathutils import Vector

ORIGEN = os.path.abspath("escena.blend")
DESTINO = os.path.abspath("escena_rica.blend")
if os.path.abspath(bpy.data.filepath or "") != ORIGEN:
    bpy.ops.wm.open_mainfile(filepath=ORIGEN)

# Materiales: el color de vista pasa a ser el color base de un Principled BSDF.
for mat in bpy.data.materials:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        if hasattr(mat, "use_nodes") and not mat.use_nodes:
            mat.use_nodes = True
    nodos = mat.node_tree.nodes
    bsdf = next((n for n in nodos if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        nodos.clear()
        bsdf = nodos.new("ShaderNodeBsdfPrincipled")
        salida = nodos.new("ShaderNodeOutputMaterial")
        mat.node_tree.links.new(bsdf.outputs[0], salida.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = mat.diffuse_color
    bsdf.inputs["Roughness"].default_value = 0.55

# Sol: ilumina techo y lateral izquierdo (normal −Y), deja en sombra el derecho (normal +X).
hacia_luz = Vector((-0.3, -0.5, 1.0)).normalized()
sol = bpy.data.objects.get("sol") or bpy.data.objects.new("sol", bpy.data.lights.new("sol", "SUN"))
if sol.name not in bpy.context.scene.collection.objects:
    bpy.context.scene.collection.objects.link(sol)
sol.data.energy = 3.0
sol.data.angle = 0.05                      # sombras de borde casi duro, como en flat
sol.rotation_euler = hacia_luz.to_track_quat("Z", "Y").to_euler()
sol["iso_ignorar"] = 1                     # no es una pieza

mundo = bpy.context.scene.world or bpy.data.worlds.new("mundo")
bpy.context.scene.world = mundo
with warnings.catch_warnings():
    warnings.simplefilter("ignore", DeprecationWarning)
    if hasattr(mundo, "use_nodes") and not mundo.use_nodes:
        mundo.use_nodes = True
fondo = next(n for n in mundo.node_tree.nodes if n.type == "BACKGROUND")
fondo.inputs["Color"].default_value = (0.75, 0.78, 0.85, 1)
fondo.inputs["Strength"].default_value = 0.6

escena = bpy.context.scene
escena.render.engine = "CYCLES"
escena.cycles.samples = 32
bpy.ops.wm.save_as_mainfile(filepath=DESTINO)
print(f"render_rico: {DESTINO}")
