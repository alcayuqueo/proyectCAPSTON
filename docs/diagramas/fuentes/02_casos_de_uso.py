"""Genera el diagrama de casos de uso (UML) en SVG: python 02_casos_de_uso.py salida.svg

Mermaid no tiene diagramas de casos de uso, así que este se dibuja directamente en SVG
con la notación UML: actores, límite del sistema, asociaciones, generalización,
«include» y «extend».
"""
import sys
from html import escape

ANCHO, ALTO = 1240, 990
F = "Inter, Arial, Helvetica, sans-serif"
svg = []
def add(s): svg.append(s)

def texto(x, y, lineas, size=14, peso='normal', anchor='middle', color='#1a1f1c'):
    if isinstance(lineas, str): lineas = [lineas]
    alto = size * 1.25
    y0 = y - (len(lineas) - 1) * alto / 2
    for i, l in enumerate(lineas):
        add(f'<text x="{x}" y="{y0 + i*alto:.1f}" font-family="{F}" font-size="{size}" font-weight="{peso}" '
            f'text-anchor="{anchor}" dominant-baseline="middle" fill="{color}">{escape(l)}</text>')

def actor(x, y, nombre, estereotipo=None):
    """Monigote UML; (x, y) es el centro de la cabeza. Devuelve puntos de conexión."""
    add(f'<g stroke="#1a1f1c" stroke-width="2" fill="none">'
        f'<circle cx="{x}" cy="{y}" r="13" fill="#fff"/>'
        f'<line x1="{x}" y1="{y+13}" x2="{x}" y2="{y+50}"/>'
        f'<line x1="{x-22}" y1="{y+26}" x2="{x+22}" y2="{y+26}"/>'
        f'<line x1="{x}" y1="{y+50}" x2="{x-18}" y2="{y+80}"/>'
        f'<line x1="{x}" y1="{y+50}" x2="{x+18}" y2="{y+80}"/></g>')
    if estereotipo: texto(x, y + 98, f'«{estereotipo}»', 12, color='#6b7370')
    texto(x, y + (116 if estereotipo else 100), nombre, 15, 'bold')
    return {'centro': (x, y + 30), 'pies': (x, y + 80), 'cabeza': (x, y - 13)}

CU = {}
def caso(clave, x, y, lineas, ancho=None, destacado=False):
    if isinstance(lineas, str): lineas = [lineas]
    w = ancho or max(len(l) for l in lineas) * 7.6 + 46
    h = 30 + len(lineas) * 17
    fondo = '#eefaf6' if destacado else '#fff'
    add(f'<ellipse cx="{x}" cy="{y}" rx="{w/2:.1f}" ry="{h/2:.1f}" fill="{fondo}" stroke="#0c6f59" stroke-width="1.8"/>')
    texto(x, y, lineas, 14)
    CU[clave] = (x, y, w / 2, h / 2)

def borde(clave, hacia):
    """Punto en el borde de la elipse en dirección a 'hacia'."""
    x, y, rx, ry = CU[clave]
    dx, dy = hacia[0] - x, hacia[1] - y
    if dx == dy == 0: return (x, y)
    t = 1 / ((dx / rx) ** 2 + (dy / ry) ** 2) ** 0.5
    return (x + dx * t, y + dy * t)

def linea(p1, p2, punteada=False, flecha=None, etiqueta=None, desplaz=(0, -10)):
    dash = ' stroke-dasharray="7 5"' if punteada else ''
    marca = f' marker-end="url(#{flecha})"' if flecha else ''
    add(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="#3f4744" stroke-width="1.5"{dash}{marca}/>')
    if etiqueta:
        mx, my = (p1[0] + p2[0]) / 2 + desplaz[0], (p1[1] + p2[1]) / 2 + desplaz[1]
        add(f'<rect x="{mx-48}" y="{my-10}" width="96" height="20" fill="#fff"/>')
        texto(mx, my, etiqueta, 12.5, color='#3f4744')

def relacion(origen, destino, tipo):
    """«include»: base → incluido. «extend»: extensión → base."""
    a = borde(origen, CU[destino][:2]); b = borde(destino, CU[origen][:2])
    linea(a, b, punteada=True, flecha='abierta', etiqueta=f'«{tipo}»')

add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{ANCHO}" height="{ALTO}" viewBox="0 0 {ANCHO} {ALTO}">')
add('''<defs>
  <marker id="abierta" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
    <path d="M1,1 L11,6 L1,11" fill="none" stroke="#3f4744" stroke-width="1.6"/></marker>
  <marker id="triangulo" viewBox="0 0 16 16" refX="15" refY="8" markerWidth="16" markerHeight="16" orient="auto-start-reverse">
    <path d="M1,1 L15,8 L1,15 Z" fill="#fff" stroke="#3f4744" stroke-width="1.6"/></marker>
</defs>''')
add(f'<rect width="{ANCHO}" height="{ALTO}" fill="#ffffff"/>')
texto(ANCHO / 2, 26, 'Diagrama de casos de uso · Software Educativo', 18, 'bold')

# Límite del sistema
SX, SY, SW, SH = 250, 56, 770, 860
add(f'<rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" rx="10" fill="#f6f8f7" stroke="#6b7370" stroke-width="1.5"/>')
texto(SX + SW / 2, SY + 22, 'Software Educativo', 16, 'bold')
add(f'<line x1="{SX+20}" y1="{SY+352}" x2="{SX+SW-20}" y2="{SY+352}" stroke="#aab0ad" stroke-dasharray="4 6"/>')
texto(SX + 30, SY + 50, 'Sin sesión', 12.5, anchor='start', color='#6b7370')
texto(SX + 30, SY + 375, 'Con sesión iniciada (JWT)', 12.5, anchor='start', color='#6b7370')

A, B = 470, 840   # columnas de casos principales y de casos incluidos / extensiones

caso('explorar', A, 125, ['Explorar el currículum oficial'], destacado=True)
caso('catalogo', A, 205, ['Ver catálogo de recursos', 'y actividades'])
caso('registro', A, 285, ['Registrarse'])
caso('login', A, 355, ['Iniciar sesión'])
caso('filtrar', B, 125, ['Filtrar OA por asignatura,', 'nivel, eje o palabra clave'])

caso('recursos', A, 545, ['Gestionar recursos propios', '(crear, editar, eliminar)'])
caso('actividades', A, 630, ['Gestionar actividades propias', '(crear, editar, eliminar)'])
caso('planificar', A + 40, 720, ['Planificar una clase', '(crear, editar, duplicar, eliminar)'], destacado=True)
caso('presentar', A - 30, 815, ['Presentar la clase', 'en la pantalla interactiva'], destacado=True)
caso('salir', A, 470, ['Cerrar sesión'])

caso('elegirOA', B, 680, ['Seleccionar el OA', 'del currículum'])
caso('cronometro', B, 775, ['Usar cronómetro', 'de la actividad'])
caso('incrustar', B, 865, ['Reproducir video o', 'archivo incrustado'])

relacion('filtrar', 'explorar', 'extend')
relacion('planificar', 'elegirOA', 'include')
relacion('cronometro', 'presentar', 'extend')
relacion('incrustar', 'presentar', 'extend')

# Actores
vis = actor(120, 200, 'Visitante')
doc = actor(120, 575, 'Docente')
ext = actor(1130, 810, 'YouTube / Drive', 'sistema externo')

for c in ['explorar', 'catalogo', 'registro', 'login']:
    linea((vis['centro'][0] + 24, vis['centro'][1]), borde(c, vis['centro']))
for c in ['recursos', 'actividades', 'planificar', 'presentar', 'salir']:
    linea((doc['centro'][0] + 24, doc['centro'][1]), borde(c, doc['centro']))
linea((ext['centro'][0] - 24, ext['centro'][1]), borde('incrustar', ext['centro']))
# Generalización: el Docente es un Visitante con sesión (hereda sus casos de uso)
linea(doc['cabeza'], (vis['pies'][0], vis['pies'][1] + 44), flecha='triangulo')
texto(132, 420, 'generalización', 11.5, anchor='start', color='#6b7370')

# Nota
add(f'<g><path d="M{SX} {SY+SH+12} h420 l14 14 v30 h-434 z" fill="#fffbe6" stroke="#aab0ad"/>'
    f'<path d="M{SX+420} {SY+SH+12} v14 h14" fill="none" stroke="#aab0ad"/></g>')
texto(SX + 10, SY + SH + 34, 'Los recursos y actividades del catálogo son de solo lectura.', 12, anchor='start', color='#3f4744')
add('</svg>')

open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(svg))
