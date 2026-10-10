"""Añade la animación de ejemplo y guarda sobre escena.blend:
  - la caja se desliza en x y vuelve (traslación → @keyframes de transform),
  - el tanque flota (traslación en z: su sombra se corre hacia la luz),
  - un ventilador de cuatro aspas gira sobre la torre (rotación → flipbook).
Uso: blender --background --python animar_escena.py   (o python3 animar_escena.py con pip install bpy)
"""
import math
import os

import bpy

RUTA = os.path.abspath("escena.blend")
if os.path.abspath(bpy.data.filepath or "") != RUTA:
    bpy.ops.wm.open_mainfile(filepath=RUTA)
s = bpy.context.scene
s.frame_start, s.frame_end = 1, 48
# Interpolación lineal para los keyframes nuevos (funciona igual en Blender 4.x y 5.x).
# Es una preferencia del usuario: se guarda el valor y se restaura al final.
prefs = bpy.context.preferences.edit
interp_previa = prefs.keyframe_new_interpolation_type
prefs.keyframe_new_interpolation_type = "LINEAR"
s.render.fps = 24

c = bpy.data.objects["caja"]
t = bpy.data.objects["tanque"]
for f, x in ((1, 1.2), (24, 2.2), (48, 1.2)):
    c.location.x = x
    c.keyframe_insert("location", index=0, frame=f)
for f, z in ((1, 1.2), (24, 1.6), (48, 1.2)):
    t.location.z = z
    t.keyframe_insert("location", index=2, frame=f)

# Ventilador: cuatro aspas planas sobre la torre, con eje vertical.
if "ventilador" not in bpy.data.objects:
    torre = bpy.data.objects["torre"]
    z_techo = max((torre.matrix_world @ v.co).z for v in torre.data.vertices)
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    v = bpy.context.object
    v.name = "ventilador"
    v.scale = (0.62, 0.09, 0.03)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    aspa2 = v.copy(); aspa2.data = v.data.copy(); aspa2.rotation_euler.z = math.pi / 2
    bpy.context.collection.objects.link(aspa2)
    bpy.ops.object.select_all(action="DESELECT")
    aspa2.select_set(True); v.select_set(True); bpy.context.view_layer.objects.active = v
    bpy.ops.object.join()
    v.location = (torre.location.x, torre.location.y, z_techo + 0.05)
    m = bpy.data.materials.new("aspas")
    m.diffuse_color = (0.02, 0.02, 0.03, 1)
    v.data.materials.append(m)
ven = bpy.data.objects["ventilador"]
ven.rotation_euler.z = 0
ven.keyframe_insert("rotation_euler", index=2, frame=1)
ven.rotation_euler.z = math.pi / 2          # 90°: con cuatro aspas, el bucle es perfecto
ven.keyframe_insert("rotation_euler", index=2, frame=49)

prefs.keyframe_new_interpolation_type = interp_previa
bpy.ops.wm.save_as_mainfile(filepath=RUTA)
print(f"animar_escena: {RUTA}")
