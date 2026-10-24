"""Extrae los OA de Matemática y Lenguaje (1° a 6° básico) desde el PDF de Bases Curriculares.

Uso (requiere pdftotext, del paquete poppler-utils):
    python extraer_oa.py articles-22394_bases.pdf oa.json

El resultado se revisó contra el PDF y se guardó en oa-basica-1-6.json, que es el
archivo que usa prisma/cargar-curriculum.ts. Los rangos de páginas corresponden a la
1ª edición (diciembre 2018) de las Bases Curriculares Primero a Sexto Básico.
"""
import json, re, subprocess, sys

PDF = sys.argv[1]
OUT = sys.argv[2]

RANGOS = {
    'Matemática': {1: (229, 230), 2: (233, 234), 3: (237, 240), 4: (243, 246), 5: (249, 252), 6: (255, 256)},
    'Lenguaje y Comunicación': {1: (310, 312), 2: (314, 317), 3: (320, 324), 4: (326, 330), 5: (332, 336), 6: (338, 343)},
}
EJES = [
    ('Números', 'Números y Operaciones'), ('Patrones', 'Patrones y Álgebra'), ('Geometría', 'Geometría'),
    ('Medición', 'Medición'), ('Datos', 'Datos y Probabilidades'), ('Lectura', 'Lectura'),
    ('Escritura', 'Escritura'), ('Comunicación', 'Comunicación oral'), ('Investigación', 'Investigación'),
]
CONTINUACION = re.compile(r'^\s{0,4}(Operaciones|Álgebra|Probabilidades|oral|Oral)(\s+|$)')
RUIDO = re.compile(r'Bases Curriculares Ú|^\s*(Matemática|Lenguaje y Comunicación)\s{2,}\d|Objetivos de Aprendizaje\s*$|^\s*Ejes\s*$|serán capaces de:')


def canon(prefijo):
    for clave, nombre in EJES:
        if prefijo.startswith(clave):
            return nombre
    raise ValueError(f'Eje desconocido: {prefijo!r}')


def agregar(lineas, linea):
    """Guarda cada línea como [es_viñeta, texto]. En el PDF, a veces la viñeta (ú)
    queda sola en la línea siguiente a su texto: en ese caso marca la línea anterior."""
    linea = linea.strip()
    if not linea:
        return
    if linea == 'ú':
        if len(lineas) > 1:
            lineas[-1][0] = True
        return
    if linea.startswith('ú'):
        lineas.append([True, linea[1:].strip()])
    else:
        lineas.append([False, linea])


def unir(lineas):
    texto = ''
    for vineta, linea in lineas:
        if vineta:
            texto = texto.rstrip() + '\n• ' + linea
        elif texto.endswith('-') and linea[:1].islower():
            texto = texto[:-1] + linea
        else:
            texto = (texto + ' ' + linea) if texto else linea
    return texto


resultado = []
for asignatura, niveles in RANGOS.items():
    for nivel, (ini, fin) in niveles.items():
        txt = subprocess.run(['pdftotext', '-f', str(ini), '-l', str(fin), '-layout', PDF, '-'],
                             capture_output=True, text=True).stdout
        esperado, eje, actual = 1, None, None
        for linea in txt.splitlines():
            if not linea.strip() or RUIDO.search(linea):
                continue
            linea = CONTINUACION.sub(lambda m: ' ' * len(m.group(0)), linea)
            m = re.search(r'(?<!\S)(\d{1,2})\s+(?=\S)', linea)
            if m and int(m.group(1)) == esperado and m.start() < 45:
                prefijo = linea[:m.start()].strip()
                if prefijo == '' or re.fullmatch(r'[A-Za-zÁÉÍÓÚáéíóúñÑ ]+', prefijo):
                    if prefijo:
                        eje = canon(prefijo)
                    actual = {'asignatura': asignatura, 'nivel': f'{nivel}° básico', 'eje': eje,
                              'numero': esperado, 'codigo': f'OA{esperado:02d}', 'lineas': []}
                    resultado.append(actual)
                    agregar(actual['lineas'], linea[m.end():])
                    esperado += 1
                    continue
            if actual is None:
                continue
            agregar(actual['lineas'], linea)

CORRECCIONES = [
    # Notas al pie del PDF pegadas a la palabra
    (r'tablas7 ', 'tablas '), (r'todo8,', 'todo,'),
    # Fracciones que el PDF dibuja en dos líneas (numerador arriba, denominador abajo)
    (r'\s*1 1 1 2 3$', ''),
    (r'de uso común: , , , , : 4 3 2 3 4', 'de uso común: 1/4, 1/3, 1/2, 2/3, 3/4:'),
    (r'\(por ejemplo: 1 , 1 , 1 , 1 , 1 \) con 100 8 5 4 2 material', '(por ejemplo: 1/100, 1/8, 1/5, 1/4, 1/2) con material'),
    (r'letra- sonido', 'letra-sonido'), (r'de 90o\b', 'de 90º'),
    # Unidades con exponente
    (r'\b(cm|mm|m)2\b', r'\1²'), (r'\b(cm|mm|m)3\b', r'\1³'),
]
for oa in resultado:
    t = unir(oa.pop('lineas'))
    t = re.sub(r'[ \t]+', ' ', t).strip()
    for patron, reemplazo in CORRECCIONES:
        t = re.sub(patron, reemplazo, t)
    oa['descripcion'] = t

# Matemática 2° básico: en el PDF, los OA 20 y 21 quedan desalineados (el número 21
# aparece en la segunda línea del OA 20). Se reparte el texto según el original.
for oa in resultado:
    if oa['asignatura'] == 'Matemática' and oa['nivel'] == '2° básico':
        if oa['codigo'] == 'OA20':
            oa['descripcion'] = ('Recolectar y registrar datos para responder preguntas estadísticas sobre juegos '
                                 'con monedas y dados, usando bloques y tablas de conteo y pictogramas.')
        elif oa['codigo'] == 'OA21':
            oa['descripcion'] = ('Registrar en tablas y gráficos de barra simple, resultados de juegos aleatorios '
                                 'con dados y monedas.')

json.dump(resultado, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
from collections import Counter
c = Counter((o['asignatura'], o['nivel']) for o in resultado)
for k, v in c.items():
    print(k, v)
print('total', len(resultado))
