# Prueba de los datos del currículum oficial (backend/prisma/data/oa-basica-1-6.json).
# Verifica que estén todos los OA de cada nivel, con su eje y sin restos de la extracción del PDF.
# Uso: python pruebas/prueba_datos_curriculum.py   (solo Python 3, sin dependencias)
import json, os, re, sys
from collections import Counter

RUTA = os.path.join(os.path.dirname(__file__), '..', 'backend', 'prisma', 'data', 'oa-basica-1-6.json')
datos = json.load(open(RUTA, encoding='utf-8'))['objetivos']

# Cantidad de OA por nivel según las Bases Curriculares Primero a Sexto Básico (MINEDUC, 2018)
ESPERADO = {
    'Matemática': [20, 22, 26, 27, 27, 24],
    'Lenguaje y Comunicación': [26, 30, 31, 30, 30, 31],
}
EJES = {
    'Matemática': {'Números y Operaciones', 'Patrones y Álgebra', 'Geometría', 'Medición', 'Datos y Probabilidades'},
    'Lenguaje y Comunicación': {'Lectura', 'Escritura', 'Comunicación oral'},
}

aprobadas = fallidas = 0
def ok(nombre, condicion, detalle=''):
    global aprobadas, fallidas
    if condicion: aprobadas += 1; print(f'  OK   {nombre}')
    else: fallidas += 1; print(f'  FALLA {nombre} -> {detalle}')

conteo = Counter((o['asignatura'], o['nivel']) for o in datos)
for asignatura, cantidades in ESPERADO.items():
    for i, n in enumerate(cantidades, start=1):
        nivel = f'{i}° básico'
        ok(f'{asignatura} {nivel}: {n} OA', conteo[(asignatura, nivel)] == n, conteo[(asignatura, nivel)])
        codigos = [o['codigo'] for o in datos if o['asignatura'] == asignatura and o['nivel'] == nivel]
        ok(f'{asignatura} {nivel}: códigos OA01 a OA{n:02d} sin saltos', codigos == [f'OA{k:02d}' for k in range(1, n + 1)], codigos)

ok('Todos los OA tienen un eje válido', all(o['eje'] in EJES[o['asignatura']] for o in datos),
   [o['codigo'] for o in datos if o['eje'] not in EJES[o['asignatura']]])
ok('Cada asignatura usa todos sus ejes', all({o['eje'] for o in datos if o['asignatura'] == a} == e for a, e in EJES.items()))
ok('Sin códigos repetidos', len({(o['asignatura'], o['nivel'], o['codigo']) for o in datos}) == len(datos))

RESTOS = [
    (r'\bú', 'viñeta sin convertir'), (r'Bases Curriculares', 'encabezado de página'),
    (r'[a-záéíóúñ]\d\b(?<!cm2)(?<!m2)', 'nota al pie pegada a una palabra'), (r'(?:\b\d\b\s+){3,}', 'números sueltos (fracciones)'),
    (r'\n•\s*(\n|$)', 'viñeta vacía'), (r'[a-záéíóú]- [a-záéíóú]', 'palabra cortada con guion'), (r'\s{2,}', 'espacios dobles'),
]
for patron, nombre in RESTOS:
    malos = [f"{o['asignatura'][:4]} {o['nivel']} {o['codigo']}" for o in datos if re.search(patron, o['descripcion'])]
    ok(f'Sin {nombre}', not malos, malos[:5])
ok('Todos los OA empiezan con mayúscula', all(o['descripcion'][:1].isupper() for o in datos))

print(f'\nResultado: {aprobadas} aprobadas, {fallidas} fallidas')
sys.exit(1 if fallidas else 0)
