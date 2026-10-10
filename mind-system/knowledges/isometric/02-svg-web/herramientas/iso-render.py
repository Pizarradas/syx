#!/usr/bin/env python3
"""iso-render — renderiza una ilustración isométrica a PNG para revisarla.

Uso: python3 iso-render.py entrada.svg salida.png [--css tokens.css ...] [--ancho 1200]
                           [--fijar 'selector=transform' ...]

Resuelve los tokens var(--…) (con su fallback cuando el token no está definido),
descarta @property, @keyframes y las reglas con calc(), y renderiza el estado
estático. Para revisar un estado intermedio de la animación, pasa --fijar con la
transformación de ese instante, por ejemplo:
  --fijar '.demo-iso-ventilador__aspas=rotate(45 32 32)'
  --fijar '[data-iso-part="caja"]=translate(0 -6)'
La transformación usa sintaxis de atributo SVG y se escribe como atributo
(el renderizador no compone transform desde CSS).
Requiere cairosvg (pip install cairosvg).
"""
import argparse
import re
import sys

import cairosvg

DECL = re.compile(r"(--[\w-]+)\s*:\s*([^;{}]+);")


def resolver(valor, tokens, profundidad=0):
    if profundidad > 20:
        return valor

    def sub(m):
        nombre, fallback = m.group(1), m.group(2)
        if nombre in tokens:
            return resolver(tokens[nombre], tokens, profundidad + 1)
        return resolver(fallback.strip(), tokens, profundidad + 1) if fallback else "black"

    patron = re.compile(r"var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)")
    anterior = None
    while anterior != valor:
        anterior, valor = valor, patron.sub(sub, valor)
    return valor


def fijar(svg, reglas):
    import xml.etree.ElementTree as ET
    import cssselect2
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    raiz = ET.fromstring(svg)
    envoltorio = cssselect2.ElementWrapper.from_xml_root(raiz)
    for regla in reglas:
        selector, _, transform = regla.rpartition("=")  # el selector puede llevar "="
        encontrados = list(envoltorio.query_all(selector.strip()))
        if not encontrados:
            print(f"iso-render: aviso, '{selector}' no encaja con nada", file=sys.stderr)
        for w in encontrados:
            previo = w.etree_element.get("transform", "")
            w.etree_element.set("transform", (transform.strip() + " " + previo).strip())
    return ET.tostring(raiz, encoding="unicode")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("salida")
    ap.add_argument("--css", action="append", default=[])
    ap.add_argument("--ancho", type=int, default=1200)
    ap.add_argument("--fijar", action="append", default=[])
    a = ap.parse_args()

    svg = open(a.entrada, encoding="utf-8").read()
    extra = "".join(open(c, encoding="utf-8").read() for c in a.css)
    fuente = "".join(re.findall(r"<style[^>]*>(.*?)</style>", svg, re.S)) + extra

    tokens = {}
    for nombre, valor in DECL.findall(fuente):
        tokens[nombre] = valor.strip()

    css = re.sub(r"/\*.*?\*/", "", fuente, flags=re.S)
    css = re.sub(r"@property[^{]*\{[^}]*\}", "", css)
    css = re.sub(r"@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}", "", css)
    css = re.sub(r"@media[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}", "", css)
    css = re.sub(r"[^{}]*\{[^{}]*calc\([^{}]*\}", "", css)
    css = DECL.sub("", css)
    # cairosvg no entiende transform-box ni transform-origin con palabras clave
    css = re.sub(r"transform-(?:box|origin)\s*:[^;}]*;?", "", css)
    css = resolver(css, tokens)

    svg = re.sub(r"<style[^>]*>.*?</style>", "", svg, flags=re.S)
    svg = re.sub(r'((?:fill|stroke|stop-color|style)=")([^"]*var\([^"]*)(")',
                 lambda m: m.group(1) + resolver(m.group(2), tokens) + m.group(3), svg)
    svg = re.sub(r"(<svg\b[^>]*>)", lambda m: m.group(1) + f"<style>{css}</style>", svg, count=1)

    if a.fijar:
        svg = fijar(svg, a.fijar)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=a.salida, output_width=a.ancho)
    print(f"iso-render: {a.salida}")


if __name__ == "__main__":
    sys.exit(main())
