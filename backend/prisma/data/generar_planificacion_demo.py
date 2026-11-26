# Uso: python prisma/data/generar_planificacion_demo.py prisma/data/planificacion-demo-3basico.json
# Genera la planificación anual de ejemplo (3° básico, Matemática y Lenguaje) para Educapp.
# Basada en: Programa de Estudio 3° básico MINEDUC (Visión global del año: unidades, OA y horas),
# Plan de estudio Decreto 2960/2012 (Lenguaje 8 h, Matemática 6 h semanales) y
# calendario escolar 2026 de la Región Metropolitana (4-mar a 4-dic con JEC; vacaciones 22-jun a 3-jul).
import json, datetime as dt, sys

INICIO = dt.date(2026, 3, 4)
FIN = dt.date(2026, 12, 4)
VACACIONES = (dt.date(2026, 6, 22), dt.date(2026, 7, 3))
FERIADOS = {dt.date(2026, 4, 3), dt.date(2026, 5, 1), dt.date(2026, 5, 21), dt.date(2026, 7, 16),
            dt.date(2026, 9, 18), dt.date(2026, 10, 12)}

# Horario semanal (bloques de 90 min = 2 horas pedagógicas). 0 = lunes.
HORARIO = {'Matemática': [0, 2, 4], 'Lenguaje y Comunicación': [0, 1, 3, 4]}

def dias_de_clase():
    d = INICIO
    while d <= FIN:
        if d.weekday() < 5 and d not in FERIADOS and not (VACACIONES[0] <= d <= VACACIONES[1]):
            yield d
        d += dt.timedelta(days=1)

# ---------------- Matemática 3° básico ----------------
MAT_UNIDADES = [
    ('Unidad 1', 57, ['OA01', 'OA02', 'OA03', 'OA04', 'OA05', 'OA06', 'OA07']),
    ('Unidad 2', 57, ['OA08', 'OA09', 'OA12', 'OA13', 'OA15', 'OA16', 'OA21']),
    ('Unidad 3', 57, ['OA08', 'OA09', 'OA12', 'OA19', 'OA20', 'OA23', 'OA24', 'OA25', 'OA26']),
    ('Unidad 4', 57, ['OA10', 'OA11', 'OA14', 'OA17', 'OA18', 'OA22']),
]
MAT_TITULOS = {
    ('Unidad 1', 'OA01'): ['Contar de 5 en 5 y de 10 en 10 hasta 1.000', 'Contar de 100 en 100', 'Contar hacia atrás', 'Contar con material concreto y en la recta numérica'],
    ('Unidad 1', 'OA02'): ['Leer números hasta 1.000', 'Representar números con bloques y dibujos', 'Escribir números en palabras y cifras', 'Números en situaciones cotidianas'],
    ('Unidad 1', 'OA03'): ['Comparar números hasta 1.000', 'Ordenar números en la recta numérica', 'Mayor que, menor que e igual', 'Ordenar números de menor a mayor'],
    ('Unidad 1', 'OA04'): ['Cálculo mental: sumar y restar decenas', 'Cálculo mental: dobles y mitades', 'Estrategias de cálculo mental', 'Juegos de cálculo mental'],
    ('Unidad 1', 'OA05'): ['Unidades, decenas y centenas', 'Valor posicional en la tabla', 'Componer y descomponer números', 'Valor posicional con material concreto'],
    ('Unidad 1', 'OA06'): ['Sumar números hasta 1.000', 'Restar números hasta 1.000', 'Sumar y restar con reserva', 'Resolver problemas de adición y sustracción'],
    ('Unidad 1', 'OA07'): ['Relación entre adición y sustracción', 'Familias de operaciones', 'Comprobar restas con sumas', 'Problemas con adición y sustracción'],
    ('Unidad 2', 'OA08'): ['La multiplicación como suma repetida', 'Tablas del 2, 5 y 10', 'Tablas del 3 y 4', 'Multiplicación con material concreto'],
    ('Unidad 2', 'OA09'): ['La división como repartir en partes iguales', 'La división como agrupar', 'División con material concreto', 'Relación entre multiplicación y división'],
    ('Unidad 2', 'OA12'): ['Patrones numéricos en la tabla del 100', 'Descubrir la regla de un patrón', 'Crear patrones propios', 'Patrones con figuras'],
    ('Unidad 2', 'OA13'): ['Ecuaciones con un símbolo desconocido', 'Resolver ecuaciones de suma', 'Resolver ecuaciones de resta', 'Ecuaciones en la balanza'],
    ('Unidad 2', 'OA15'): ['Figuras 3D y sus caras 2D', 'Redes de cuerpos geométricos', 'Armar cuerpos geométricos', 'Figuras 2D en objetos del entorno'],
    ('Unidad 2', 'OA16'): ['Cubos, paralelepípedos y pirámides', 'Esferas, conos y cilindros', 'Caras, aristas y vértices', 'Clasificar cuerpos geométricos'],
    ('Unidad 2', 'OA21'): ['El perímetro', 'Medir el perímetro con regla', 'Perímetro de figuras irregulares', 'Problemas de perímetro'],
    ('Unidad 3', 'OA08'): ['Tablas del 6 y 7', 'Tablas del 8 y 9', 'Repaso de las tablas hasta el 10', 'Problemas de multiplicación'],
    ('Unidad 3', 'OA09'): ['Dividir usando las tablas', 'Problemas de división', 'Multiplicación y división: operaciones inversas'],
    ('Unidad 3', 'OA12'): ['Patrones en tablas de multiplicar', 'Patrones con software educativo', 'Registrar patrones en tablas'],
    ('Unidad 3', 'OA19'): ['Leer calendarios', 'Líneas de tiempo', 'Problemas con días, semanas y meses'],
    ('Unidad 3', 'OA20'): ['Leer la hora: horas y medias horas', 'Cuartos de hora y minutos', 'Reloj análogo y digital'],
    ('Unidad 3', 'OA23'): ['Encuestas y gráficos de barra', 'Organizar datos en tablas', 'Hacer una encuesta en el curso'],
    ('Unidad 3', 'OA24'): ['Juegos aleatorios con dados', 'Juegos aleatorios con monedas', 'Registrar resultados de juegos'],
    ('Unidad 3', 'OA25'): ['Construir pictogramas', 'Gráficos de barra con escala', 'Interpretar gráficos'],
    ('Unidad 3', 'OA26'): ['Diagramas de puntos', 'Representar datos del curso', 'Comparar representaciones de datos'],
    ('Unidad 4', 'OA10'): ['Problemas con dinero', 'Problemas de compras y vueltos', 'Crear problemas con dinero', 'Problemas de varios pasos'],
    ('Unidad 4', 'OA11'): ['Fracciones de uso común', 'Representar 1/2, 1/3 y 1/4', 'Comparar fracciones', 'Fracciones en la recta y en objetos'],
    ('Unidad 4', 'OA14'): ['Ubicar objetos en una cuadrícula', 'Leer mapas simples', 'Dar instrucciones de ubicación', 'Recorridos en el mapa del colegio'],
    ('Unidad 4', 'OA17'): ['Traslación de figuras', 'Reflexión de figuras', 'Rotación de figuras', 'Transformaciones en el entorno'],
    ('Unidad 4', 'OA18'): ['El concepto de ángulo', 'Ángulos en el entorno', 'Comparar ángulos con el ángulo recto', 'Ángulos en figuras 2D'],
    ('Unidad 4', 'OA22'): ['Medir peso en gramos y kilos', 'Comparar y ordenar pesos', 'Estimar pesos', 'Problemas de peso'],
}

# ---------------- Lenguaje y Comunicación 3° básico ----------------
LEN_UNIDADES = [
    ('Unidad 1', 79, ['OA02', 'OA04', 'OA03', 'OA11', 'OA06', 'OA14', 'OA20', 'OA22', 'OA26']),
    ('Unidad 2', 77, ['OA05', 'OA03', 'OA10', 'OA06', 'OA09', 'OA14', 'OA22', 'OA24', 'OA28']),
    ('Unidad 3', 73, ['OA04', 'OA02', 'OA03', 'OA05', 'OA13', 'OA21', 'OA26', 'OA31']),
    ('Unidad 4', 76, ['OA03', 'OA04', 'OA06', 'OA15', 'OA24', 'OA25', 'OA26', 'OA30']),
]
LEN_TITULOS = {
    ('Unidad 1', 'OA02'): ['Estrategias de comprensión: predecir', 'Relacionar el texto con experiencias', 'Hacer preguntas mientras se lee', 'Visualizar lo leído'],
    ('Unidad 1', 'OA04'): ['Personajes de un cuento', 'Secuencia de acciones del cuento', 'El ambiente del relato', 'Opinar sobre un cuento'],
    ('Unidad 1', 'OA03'): ['Lectura de cuentos', 'Cuentos tradicionales', 'Comparar dos cuentos'],
    ('Unidad 1', 'OA11'): ['Uso del diccionario', 'El orden alfabético', 'Buscar palabras desconocidas'],
    ('Unidad 1', 'OA06'): ['Leer textos informativos', 'Extraer información de un texto', 'Títulos, subtítulos e imágenes'],
    ('Unidad 1', 'OA14'): ['Escribir un artículo informativo', 'Organizar ideas en párrafos', 'Revisar el artículo informativo'],
    ('Unidad 1', 'OA20'): ['Artículos y sustantivos', 'Adjetivos calificativos', 'Sustantivos y adjetivos en textos'],
    ('Unidad 1', 'OA22'): ['Mayúsculas y punto', 'Uso de la coma en enumeraciones', 'Ortografía: c, s, z'],
    ('Unidad 1', 'OA26'): ['Conversar sobre lo leído', 'Turnos para hablar y escuchar', 'Comentar cuentos en grupo'],
    ('Unidad 2', 'OA05'): ['Lenguaje figurado en los poemas', 'Rima y ritmo', 'Comparaciones en poemas', 'Crear versos'],
    ('Unidad 2', 'OA03'): ['Lectura de fábulas', 'La moraleja', 'Leyendas chilenas'],
    ('Unidad 2', 'OA10'): ['Significado por el contexto', 'Prefijos y sufijos', 'Familias de palabras'],
    ('Unidad 2', 'OA06'): ['Leer textos informativos sobre animales', 'Infografías', 'Comparar información de dos textos'],
    ('Unidad 2', 'OA09'): ['Buscar información en libros', 'Buscar información en internet', 'Registrar lo investigado'],
    ('Unidad 2', 'OA14'): ['Escribir un artículo con lo investigado', 'Revisar y publicar el artículo'],
    ('Unidad 2', 'OA22'): ['Signos de interrogación y exclamación', 'Acentuación: palabras agudas', 'Ortografía: b y v'],
    ('Unidad 2', 'OA24'): ['La noticia', 'Comprender textos orales', 'Escuchar y comentar un documental'],
    ('Unidad 2', 'OA28'): ['Exponer sobre un tema', 'Preparar una exposición oral', 'Presentar al curso'],
    ('Unidad 3', 'OA04'): ['Leyendas y mitos', 'Problema y solución en el relato', 'Inferir sentimientos de personajes'],
    ('Unidad 3', 'OA02'): ['Estrategias: resumir lo leído', 'Releer para comprender', 'Comprensión de narraciones'],
    ('Unidad 3', 'OA03'): ['Lectura de leyendas', 'Lectura de relatos de aventura'],
    ('Unidad 3', 'OA05'): ['Poemas sobre la naturaleza', 'Imágenes en los poemas', 'Interpretar un poema'],
    ('Unidad 3', 'OA13'): ['Escribir una narración', 'Inicio, desarrollo y final', 'Escribir un relato de aventura', 'Revisar y reescribir la narración'],
    ('Unidad 3', 'OA21'): ['Los pronombres', 'Pronombres para no repetir palabras', 'Pronombres en textos propios'],
    ('Unidad 3', 'OA26'): ['Conversar sobre leyendas', 'Dar opiniones con fundamentos'],
    ('Unidad 3', 'OA31'): ['Recitar poemas', 'Entonación y expresión', 'Recital de poesía del curso'],
    ('Unidad 4', 'OA03'): ['Lectura de una novela breve', 'Capítulos de la novela', 'Comentar la novela'],
    ('Unidad 4', 'OA04'): ['Personajes de la novela', 'Causas y consecuencias en el relato', 'Opinar sobre las acciones de personajes'],
    ('Unidad 4', 'OA06'): ['Leer instructivos', 'Leer afiches', 'Leer cartas'],
    ('Unidad 4', 'OA15'): ['Escribir cartas', 'Escribir instrucciones', 'Diseñar un afiche', 'Escribir un reporte de una experiencia'],
    ('Unidad 4', 'OA24'): ['Comprender instrucciones orales', 'Escuchar noticias y comentarlas'],
    ('Unidad 4', 'OA25'): ['Obras de teatro infantil', 'Elementos del teatro', 'Comentar una obra vista'],
    ('Unidad 4', 'OA26'): ['Conversar sobre la novela', 'Debate en el curso'],
    ('Unidad 4', 'OA30'): ['Caracterizar personajes', 'Ensayo de dramatización', 'Presentación de la dramatización'],
}
# Objetivos para abordar en todas las unidades: una sesión semanal (viernes) rota entre ellos.
LEN_TRANSVERSALES = [
    ('OA07', 'Plan lector: lectura libre'),
    ('OA12', 'Escritura libre: mi diario'),
    ('OA01', 'Lectura en voz alta fluida'),
    ('OA08', 'Visita a la biblioteca (CRA)'),
    ('OA18', 'Revisar y editar mis textos'),
    ('OA23', 'Escuchar y disfrutar un cuento narrado'),
    ('OA19', 'Vocabulario nuevo en la escritura'),
    ('OA27', 'Normas para conversar y participar'),
    ('OA17', 'Planificar un texto: propósito y destinatario'),
    ('OA16', 'Escribir con letra clara'),
    ('OA29', 'Usar vocabulario nuevo al hablar'),
]
# OA que tienen «clase lista» en Educapp (material-*.json): la primera sesión de ese OA la usa.
CLASES_LISTAS = {('Matemática', 'OA11'), ('Matemática', 'OA12'), ('Matemática', 'OA18'), ('Matemática', 'OA21'),
                 ('Matemática', 'OA23'), ('Lenguaje y Comunicación', 'OA05'), ('Lenguaje y Comunicación', 'OA21'),
                 ('Lenguaje y Comunicación', 'OA24')}

EXTRA = ['ejercitación', 'práctica guiada', 'retroalimentación', 'repaso']

def repartir(total, pesos):
    """Reparte 'total' según 'pesos' (método del mayor resto)."""
    s = sum(pesos); base = [total * p // s for p in pesos]
    resto = sorted(range(len(pesos)), key=lambda i: -(total * pesos[i] % s))
    for i in resto[: total - sum(base)]: base[i] += 1
    return base

def planificar(asignatura, unidades, titulos, transversales=None):
    fechas = [d for d in dias_de_clase() if d.weekday() in HORARIO[asignatura]]
    tamanos = repartir(len(fechas), [u[1] for u in unidades])
    clases = []; i = 0; t_idx = 0
    for (unidad, horas, oas), n in zip(unidades, tamanos):
        fechas_u = fechas[i:i + n]; i += n
        # Viernes de Lenguaje: objetivos transversales.
        trans = [d for d in fechas_u if transversales and d.weekday() == 4]
        normales = [d for d in fechas_u if d not in trans]
        sesiones = []
        # Primera sesión: diagnóstico (solo unidad 1) ; última: evaluación de la unidad.
        cuerpo = normales[:]
        primera = None
        if unidad == 'Unidad 1':
            primera = cuerpo.pop(0)
            sesiones.append((primera, oas[0], 'Evaluación diagnóstica', 'evaluacion'))
        ultima = cuerpo.pop()
        por_oa = repartir(len(cuerpo), [1] * len(oas))
        k = 0
        for oa, m in zip(oas, por_oa):
            lista = titulos[(unidad, oa)]
            for j in range(m):
                titulo = lista[j] if j < len(lista) else f'{lista[j % len(lista)]} · {EXTRA[(j - len(lista)) % len(EXTRA)]}'
                sesiones.append((cuerpo[k], oa, titulo, 'clase')); k += 1
        sesiones.append((ultima, oas[0], f'Evaluación {unidad}', 'evaluacion'))
        for d in trans:
            oa, titulo = transversales[t_idx % len(transversales)]; t_idx += 1
            sesiones.append((d, oa, titulo, 'transversal'))
        sesiones.sort(key=lambda x: x[0])
        cuenta = {}
        for d, oa, titulo, tipo in sesiones:
            total_oa = sum(1 for s in sesiones if s[1] == oa and s[3] == 'clase')
            if tipo == 'clase':
                cuenta[oa] = cuenta.get(oa, 0) + 1
                nota = f'{unidad} (Programa de Estudio MINEDUC). Clase {cuenta[oa]} de {total_oa} del {oa}.'
            elif tipo == 'transversal':
                nota = f'{unidad}. Objetivo para abordar en todas las unidades ({oa}).'
            else:
                nota = f'{unidad}. ' + ('Evaluación diagnóstica de inicio de año.' if titulo.startswith('Evaluación diag') else f'Evaluación sumativa de los OA de la {unidad}: {", ".join(oas)}.')
            clases.append({'fecha': d.isoformat(), 'asignatura': asignatura, 'nivel': '3° básico', 'codigo': oa,
                           'titulo': titulo, 'unidad': unidad, 'tipo': tipo, 'notas': nota, 'claseLista': False})
    # Marca la primera clase de cada OA con clase lista.
    vistos = set()
    for c in clases:
        clave = (asignatura, c['codigo'])
        if clave in CLASES_LISTAS and clave not in vistos and c['tipo'] == 'clase':
            vistos.add(clave); c['claseLista'] = True
    return clases

mat = planificar('Matemática', MAT_UNIDADES, MAT_TITULOS)
leng = planificar('Lenguaje y Comunicación', LEN_UNIDADES, LEN_TITULOS, LEN_TRANSVERSALES)
todas = sorted(mat + leng, key=lambda c: (c['fecha'], c['asignatura']))
salida = {
    'descripcion': 'Planificación anual de ejemplo · 3° básico · Matemática y Lenguaje y Comunicación · 2026',
    'fuentes': [
        'Programa de Estudio Matemática 3° básico (MINEDUC): Visión global del año, 4 unidades de 57 horas pedagógicas.',
        'Programa de Estudio Lenguaje y Comunicación 3° básico (MINEDUC): Visión global del año (79, 77, 73 y 76 horas) y objetivos para todas las unidades.',
        'Plan de estudio 1° a 4° básico (Decreto 2960/2012): Lenguaje 8 y Matemática 6 horas semanales.',
        'Calendario escolar 2026 Región Metropolitana (MINEDUC): 4 de marzo a 4 de diciembre (JEC); vacaciones de invierno 22 de junio a 3 de julio.',
    ],
    'horario': {'Matemática': 'lunes, miércoles y viernes (bloques de 90 min)', 'Lenguaje y Comunicación': 'lunes, martes, jueves y viernes (bloques de 90 min); el viernes se trabajan los objetivos para todas las unidades'},
    'clases': todas,
}
json.dump(salida, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
print(f'{len(mat)} clases de Matemática y {len(leng)} de Lenguaje -> {sys.argv[1]}')
