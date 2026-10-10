#!/usr/bin/env python3
"""iso-check — escáner de ilustraciones isométricas para web.

Uso: python3 iso-check.py [--tokens] ilustracion.svg [ilustracion.css ...]

  --tokens   modo sistema de diseño: los colores literales pasan de aviso a error
             (úsalo en proyectos con tokens, p. ej. SYX).

Sale con código 1 si hay errores. Las advertencias no bloquean.
"""
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter

K = 0.8660254
ISO = {  # (a, b, c, d) permitidos
    "techo": (K, 0.5, -K, 0.5),
    "pared-u": (K, 0.5, 0, 1),
    "pared-v": (-K, 0.5, 0, 1),
    "texto-pared-v": (K, -0.5, 0, 1),
    "texto-pared-u": (-K, -0.5, 0, 1),
}
DIM = {  # dimétrica 2:1
    "techo": (1, 0.5, -1, 0.5),
    "pared-u": (1, 0.5, 0, 1),
    "pared-v": (-1, 0.5, 0, 1),
    "texto-pared-v": (1, -0.5, 0, 1),
    "texto-pared-u": (-1, -0.5, 0, 1),
}
ANIMABLES = {"transform", "opacity", "offset-distance"}
COLOR_LITERAL = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch|lab)a?\(")
DECIMALES = re.compile(r"-?\d+\.(\d{3,})")

errores, avisos = [], []
TOKENS = False


def color(regla, msg):
    (err if TOKENS else warn)(regla, msg)


def err(regla, msg):
    errores.append(f"  error  [{regla}] {msg}")


def warn(regla, msg):
    avisos.append(f"  aviso  [{regla}] {msg}")


def tag(el):
    return el.tag.split("}")[-1]


def cerca(m, ref, tol=2e-4):
    return all(abs(x - y) <= tol for x, y in zip(m, ref))


def revisar_css(css, origen):
    # Keyframes: solo propiedades de composición
    for nombre, cuerpo in re.findall(r"@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}", css):
        for prop in re.findall(r"([\w-]+)\s*:", cuerpo):
            if prop.startswith("--iso-") or prop in ANIMABLES:
                continue
            if prop == "stroke-dashoffset":
                warn("anim-dash", f"{origen}: @keyframes {nombre} anima stroke-dashoffset; solo en elementos pequeños")
            else:
                err("anim-propiedad", f"{origen}: @keyframes {nombre} anima '{prop}' (solo transform, opacity o --iso-*)")
    if "@keyframes" in css and "prefers-reduced-motion" not in css:
        err("reduced-motion", f"{origen}: hay animaciones sin @media (prefers-reduced-motion)")
    # Colores literales fuera de declaraciones de tokens
    for n, linea in enumerate(css.splitlines(), 1):
        s = linea.strip()
        if s.startswith("--") or s.startswith("/*") or s.startswith("*"):
            continue
        if COLOR_LITERAL.search(s):
            color("color-literal", f"{origen}:{n}: color literal fuera de un token → {s[:70]}")
    # Tokens nuevos sin consulta a SYX
    if re.search(r"^\s*--(?!iso-)[\w-]+-iso-[\w-]+\s*:", css, re.M) and "syx-reuse:" not in css:
        warn("sin-consulta", f"{origen}: declara tokens de ilustración sin comentario /* syx-reuse: … */")
    for p in ("--iso-u", "--iso-v", "--iso-w"):
        if re.search(re.escape(p) + r"(?![\w-])", css) and f"@property {p}" not in css:
            err("property", f"{origen}: usa {p} sin registrarlo con @property (no se animará)")


def revisar_svg(ruta):
    try:
        raiz = ET.parse(ruta).getroot()
    except ET.ParseError as e:
        err("xml", f"{ruta}: no es XML válido ({e})")
        return
    if tag(raiz) != "svg":
        err("raiz", "el elemento raíz no es <svg>")
    if "viewBox" not in raiz.attrib:
        err("viewbox", "falta viewBox")
    if "width" in raiz.attrib or "height" in raiz.attrib:
        warn("tamano-fijo", "width/height fijos en <svg>; deja que lo dimensione el contenedor")

    partes, sistemas = Counter(), set()
    padres = {c: p for p in raiz.iter() for c in p}

    for el in raiz.iter():
        t, at = tag(el), el.attrib
        if t == "image" or any("data:image" in v for v in at.values()):
            if raiz.attrib.get("data-iso-raster") == "capas":
                pass  # composición de capas ráster declarada (iso_export_capas.py)
            else:
                err("raster", f"<{t}> con imagen raster; solo vector (o declara data-iso-raster=\"capas\")")
        if t in ("filter", "feGaussianBlur"):
            warn("filtro", f"<{t}>: los filtros son caros de animar y renderizar; usa formas")
        for k in ("fill", "stroke", "stop-color"):
            v = at.get(k, "")
            if COLOR_LITERAL.search(v):
                color("color-literal", f"<{t} {k}=\"{v}\"> — usa un token (clase o style=\"fill:var(--…)\")")
        estilo = re.sub(r"--[\w-]+\s*:[^;]*;?", "", at.get("style", ""))  # las declaraciones de tokens sí llevan literales
        if COLOR_LITERAL.search(estilo):
            color("color-literal", f"<{t} style> con color literal")
        for k in ("d", "points", "x", "y", "cx", "cy", "width", "height", "r", "transform"):
            valor = at.get(k, "")
            if k == "transform":  # la constante de proyección no cuenta
                valor = re.sub(r"-?0?\.8660254\b|-?0?\.8944272\b|-?0?\.4472136\b", "0", valor)
            if valor and DECIMALES.search(valor):
                warn("decimales", f"<{t} {k}> con más de 2 decimales; redondea")
                break

        parte = at.get("data-iso-part")
        if parte is not None:
            partes[parte] += 1
            if "transform" in at:
                err("capa-1", f"data-iso-part=\"{parte}\" tiene atributo transform; "
                    "la proyección va en un <g> hijo, el movimiento CSS en este")
            if tag(el) != "g":
                warn("parte-no-grupo", f"data-iso-part=\"{parte}\" está en <{t}>; usa un <g> envoltorio")

        for m in re.findall(r"matrix\(([^)]*)\)", at.get("transform", "")):
            nums = [float(x) for x in re.split(r"[\s,]+", m.strip()) if x]
            if len(nums) != 6:
                err("matriz", f"matrix() con {len(nums)} valores")
                continue
            abcd = nums[:4]
            if any(cerca(abcd, r) for r in ISO.values()):
                sistemas.add("isométrica")
            elif any(cerca(abcd, r) for r in DIM.values()):
                sistemas.add("dimétrica 2:1")
            elif cerca(abcd, (1, 0, 0, 1)):
                pass
            else:
                err("matriz", f"matrix({m.strip()}) no es un plano isométrico conocido")
        if "skew" in at.get("transform", "") or "rotate" in at.get("transform", ""):
            warn("ssr", f"<{t}> usa skew/rotate en atributo; prefiere las matrices de plano exactas")

    for nombre, n in partes.items():
        if n > 1:
            err("parte-duplicada", f"data-iso-part=\"{nombre}\" aparece {n} veces")
    if len(sistemas) > 1:
        err("proyeccion-mixta", "mezcla proyección isométrica y dimétrica en la misma pieza")
    if not partes:
        warn("sin-partes", "ninguna pieza con data-iso-part; nada queda preparado para animar")

    titulo = any(tag(e) == "title" for e in raiz)
    if not titulo and raiz.attrib.get("aria-hidden") != "true":
        err("a11y", "falta <title> (o aria-hidden=\"true\" si es decorativa)")

    for st in raiz.iter():
        if tag(st) == "style" and st.text:
            revisar_css(st.text, f"{ruta} <style>")


def main(rutas):
    global TOKENS
    if "--tokens" in rutas:
        TOKENS = True
        rutas = [r for r in rutas if r != "--tokens"]
    if not rutas:
        print(__doc__)
        return 2
    for r in rutas:
        if r.endswith(".css"):
            with open(r, encoding="utf-8") as f:
                revisar_css(f.read(), r)
        else:
            revisar_svg(r)
    # Muestra como mucho 3 líneas por regla y resume el resto.
    for lista in (errores, avisos):
        por_regla = {}
        for linea in lista:
            regla = re.search(r"\[([\w-]+)\]", linea).group(1)
            por_regla.setdefault(regla, []).append(linea)
        for regla, lineas in por_regla.items():
            for linea in lineas[:3]:
                print(linea)
            if len(lineas) > 3:
                print(f"         [{regla}] … y {len(lineas) - 3} más iguales")
    print(f"iso-check: {len(errores)} errores, {len(avisos)} avisos")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
