# Prueba de rendimiento de la API (carga con usuarios simultáneos).
#
# Uso:   python pruebas/prueba_rendimiento.py                 (contra producción, en Render)
#        API_URL=http://localhost:3000/api python pruebas/prueba_rendimiento.py   (contra local)
#
# Solo hace consultas de LECTURA (currículum, recursos y actividades): no crea ni modifica datos,
# así que se puede ejecutar contra producción. Simula 1, 10, 25 y 50 docentes navegando a la vez
# y mide los tiempos de respuesta. Entre cada nivel espera 1 minuto, porque la API limita a
# 300 solicitudes por minuto por IP y todas las solicitudes de esta prueba salen del mismo equipo.
# Duración aproximada: 5 minutos. Requiere solo Python 3.
import json, os, statistics, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

API = os.environ.get('API_URL', 'https://software-educativo-api.onrender.com/api').rstrip('/')
NIVELES = [1, 10, 25, 50]          # docentes simultáneos
SOLICITUDES_POR_NIVEL = 200        # menos de 300 por minuto (límite de la API por IP)
PAUSA_ENTRE_NIVELES = int(os.environ.get('PAUSA', 61))  # segundos
OBJETIVO_P95_MS = 1000             # requisito no funcional: 95 % de las respuestas en menos de 1 s

q = urllib.parse.urlencode
# Lo que hace un docente al preparar una clase: explorar el currículum, buscar y revisar recursos y actividades.
RECORRIDO = [
    '/curriculum/asignaturas',
    '/curriculum/objetivos?' + q({'asignatura': 'Matemática', 'nivel': '3° básico'}),
    '/curriculum/ejes?' + q({'asignatura': 'Matemática'}),
    '/curriculum/objetivos?' + q({'q': 'fracciones'}),
    '/curriculum/objetivos?' + q({'asignatura': 'Lenguaje y Comunicación', 'nivel': '5° básico', 'eje': 'Lectura'}),
    '/resources',
    '/activities',
]


def pedir(ruta, timeout=30):
    inicio = time.perf_counter()
    try:
        with urllib.request.urlopen(API + ruta, timeout=timeout) as r:
            r.read()
            codigo = r.status
    except urllib.error.HTTPError as e:
        codigo = e.code
    except Exception:
        codigo = 0  # sin respuesta (tiempo agotado o conexión rechazada)
    return codigo, (time.perf_counter() - inicio) * 1000


def percentil(valores, p):
    if not valores:
        return 0
    v = sorted(valores)
    return v[min(len(v) - 1, int(round(p / 100 * (len(v) - 1))))]


def despertar():
    """El plan gratuito de Render suspende el servidor sin uso; la primera respuesta puede tardar."""
    print('Despertando el servidor (puede tardar hasta 1 minuto)…', flush=True)
    inicio = time.perf_counter()
    for _ in range(12):
        codigo, _ = pedir('/curriculum/asignaturas', timeout=90)
        if codigo == 200:
            seg = time.perf_counter() - inicio
            print(f'  Servidor listo en {seg:.1f} s\n')
            return seg
        time.sleep(5)
    sys.exit('El servidor no respondió. Revisa la dirección de la API o vuelve a intentarlo.')


def nivel(usuarios):
    rutas = [RECORRIDO[i % len(RECORRIDO)] for i in range(SOLICITUDES_POR_NIVEL)]
    inicio = time.perf_counter()
    with ThreadPoolExecutor(max_workers=usuarios) as ex:
        resultados = list(ex.map(pedir, rutas))
    duracion = time.perf_counter() - inicio
    ok = [ms for c, ms in resultados if c == 200]
    return {
        'usuarios': usuarios,
        'solicitudes': len(resultados),
        'exitosas': len(ok),
        'limitadas_429': sum(1 for c, _ in resultados if c == 429),
        'errores': sum(1 for c, _ in resultados if c not in (200, 429)),
        'por_segundo': len(resultados) / duracion,
        'promedio': statistics.mean(ok) if ok else 0,
        'p50': percentil(ok, 50),
        'p95': percentil(ok, 95),
        'p99': percentil(ok, 99),
        'maximo': max(ok) if ok else 0,
    }


def main():
    print(f'Prueba de rendimiento · {API}\n')
    arranque = despertar()
    for r in RECORRIDO:  # calentamiento: una vez cada consulta
        pedir(r)
    filas = []
    for i, u in enumerate(NIVELES):
        if i:
            print(f'  (pausa de {PAUSA_ENTRE_NIVELES} s para no superar el límite por minuto)', flush=True)
            time.sleep(PAUSA_ENTRE_NIVELES)
        print(f'Nivel {i + 1}/{len(NIVELES)}: {u} docente(s) simultáneo(s)…', flush=True)
        f = nivel(u)
        filas.append(f)
        print(f"  {f['exitosas']}/{f['solicitudes']} correctas · {f['por_segundo']:.1f} solicitudes/s · "
              f"p50 {f['p50']:.0f} ms · p95 {f['p95']:.0f} ms · máx {f['maximo']:.0f} ms", flush=True)

    fecha = datetime.now().strftime('%Y-%m-%d %H:%M')
    md = [
        f'# Resultado de la prueba de rendimiento\n',
        f'- **Fecha:** {fecha}',
        f'- **API:** `{API}`',
        f'- **Arranque en frío (Render plan gratuito):** {arranque:.1f} s',
        f'- **Solicitudes por nivel:** {SOLICITUDES_POR_NIVEL}, repartidas entre {len(RECORRIDO)} consultas de lectura\n',
        '| Docentes simultáneos | Correctas | Solicitudes/s | Promedio | p50 | p95 | p99 | Máximo | Errores |',
        '|---|---|---|---|---|---|---|---|---|',
    ]
    for f in filas:
        md.append(f"| {f['usuarios']} | {f['exitosas']}/{f['solicitudes']} | {f['por_segundo']:.1f} | {f['promedio']:.0f} ms | "
                  f"{f['p50']:.0f} ms | {f['p95']:.0f} ms | {f['p99']:.0f} ms | {f['maximo']:.0f} ms | "
                  f"{f['errores'] + f['limitadas_429']} |")
    cumple = all(f['p95'] <= OBJETIVO_P95_MS and f['errores'] == 0 for f in filas)
    md.append(f"\n**Requisito (p95 < {OBJETIVO_P95_MS} ms y sin errores con hasta {NIVELES[-1]} docentes simultáneos):** "
              f"{'✅ cumple' if cumple else '❌ no cumple'}\n")
    salida = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resultado_rendimiento.md')
    with open(salida, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(md))
    print('\n' + '\n'.join(md[5:]))
    print(f'\nResultado guardado en {salida}')


if __name__ == '__main__':
    main()
