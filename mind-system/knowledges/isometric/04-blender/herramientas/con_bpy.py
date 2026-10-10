"""con_bpy.py — Ejecuta un script del kit sobre un .blend usando el módulo bpy de pip, sin Blender instalado.

Uso:
  pip install bpy            # Blender como módulo de Python (bpy 5.x requiere Python 3.13)
  python3 con_bpy.py escena.blend iso_export_svg.py -- --salida escena.svg --sombras

Equivale a:
  blender escena.blend --background --python iso_export_svg.py -- --salida escena.svg --sombras
Útil para servidores, CI y agentes de IA sin Blender. Si el script modifica la escena
(iso_setup.py), añade --guardar ARCHIVO.blend antes de "--" para conservar el resultado.
"""
import os
import runpy
import sys

import bpy

if len(sys.argv) < 3:
    raise SystemExit(__doc__)
blend, script, *resto = sys.argv[1:]
guardar = None
if "--guardar" in resto[: resto.index("--") if "--" in resto else len(resto)]:
    i = resto.index("--guardar")
    guardar = resto[i + 1]
    del resto[i:i + 2]
if resto and resto[0] == "--":
    resto = resto[1:]

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(blend))
script = os.path.abspath(script if os.path.exists(script) else os.path.join(os.path.dirname(__file__), script))
sys.argv = ["blender", "--"] + resto
runpy.run_path(script, run_name="__main__")
if guardar:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(guardar))
    print(f"con_bpy: guardado {guardar}")
