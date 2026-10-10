"""Crea la escena de ejemplo: losa, torre biselada, cilindro y caja con hueco booleano.

Uso: blender --background --python crear_escena.py   (o python3 crear_escena.py con pip install bpy)
Guarda escena.blend en la carpeta actual.
"""
import os
import bpy

if not bpy.app.background and bpy.data.is_dirty:
    raise SystemExit("crear_escena: hay cambios sin guardar en tu sesión. Guarda o ejecuta en segundo plano (--background).")
DESTINO = os.path.abspath("escena.blend")
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(n, rgb):
    m = bpy.data.materials.new(n); m.diffuse_color = (*rgb, 1); return m
def cube(name, loc, scale, m):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object
    o.name = name; o.scale = scale; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(m); return o
losa = cube("losa", (0, 0, 0.2), (3, 3, 0.2), mat("losa", (0.58, 0.67, 0.80)))
torre = cube("torre", (-1.2, 1.2, 1.9), (0.75, 0.75, 1.5), mat("azul", (0.10, 0.27, 0.86)))
bev = torre.modifiers.new("bisel", "BEVEL"); bev.width = 0.12; bev.segments = 3
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.8, depth=1.6, location=(1.2, -1.2, 1.2))
c = bpy.context.object; c.name = "tanque"; c.data.materials.append(mat("naranja", (0.89, 0.38, 0.03)))
caja = cube("caja", (1.2, 1.4, 0.9), (0.6, 0.6, 0.5), mat("verde", (0.09, 0.56, 0.31)))
hueco = cube("hueco", (1.2, 1.4, 1.3), (0.35, 0.35, 0.5), mat("x", (1, 1, 1)))
b = caja.modifiers.new("hueco", "BOOLEAN"); b.object = hueco; b.operation = "DIFFERENCE"; hueco.hide_render = True; hueco.display_type = "WIRE"; hueco.hide_set(True)
bpy.ops.wm.save_as_mainfile(filepath=DESTINO)
print(f"crear_escena: {DESTINO}")
