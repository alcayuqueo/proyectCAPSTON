# Pruebas de la API: recursos y actividades (crear, editar, eliminar y permisos).
# Uso: con el backend corriendo en local ->  python pruebas/prueba_api_recursos_actividades.py
# Requiere el currículum cargado (npm run curriculum:cargar): asignaturas y actividades del catálogo.
import json, os, time, urllib.parse, urllib.request, urllib.error

B = os.environ.get('API_URL', 'http://localhost:3000/api')
SUF = str(int(time.time()))

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(B + path, data=data, method=method, headers={'content-type': 'application/json'})
    if token: r.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(r) as resp: return resp.status, json.loads(resp.read() or 'null')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or 'null')

res = []
def ok(nombre, cond, extra=''):
    res.append(cond); print(('PASS' if cond else 'FAIL'), nombre, '' if cond else extra)

def registrar(nombre):
    s, b = req('POST', '/auth/register', {'nombre': nombre, 'email': f'{nombre.lower()}{SUF}@prueba.cl', 'password': 'secreto123'})
    return b['accessToken']

ana, beto = registrar('Ana'), registrar('Beto')
_, asignaturas = req('GET', '/curriculum/asignaturas')
mat3 = next(a for a in asignaturas if a['nombre'] == 'Matemática' and a['nivel'] == '3° básico')
len5 = next(a for a in asignaturas if a['nombre'].startswith('Lenguaje') and a['nivel'] == '5° básico')
_, objetivos = req('GET', '/curriculum/objetivos?' + urllib.parse.urlencode({'asignatura': 'Matemática', 'nivel': '3° básico'}))
oa = objetivos[0]

# --- Recursos ---
recurso = {'titulo': f'Video prueba {SUF}', 'tipo': 'video', 'url': 'https://www.youtube.com/watch?v=x', 'unidad': 'Unidad 2', 'asignaturaId': mat3['id']}
s, b = req('POST', '/resources', recurso)
ok('REC-01 crear sin sesión: 401', s == 401, (s, b))
s, b = req('POST', '/resources', recurso, ana)
ok('REC-02 crear recurso propio: 201', s == 201 and b['propio'] is True and b['tipo'] == 'video' and b['usos'] == 0, (s, b))
rid = b['id']
s, b = req('POST', '/resources', {**recurso, 'url': 'javascript:alert(1)'}, ana)
ok('REC-03 enlace javascript: rechazado (400)', s == 400 and 'http://' in json.dumps(b, ensure_ascii=False), (s, b))
s, b = req('POST', '/resources', {'tipo': 'audio', 'titulo': '  '}, ana)
msg = json.dumps(b, ensure_ascii=False)
ok('REC-04 validaciones en español (título, tipo, unidad, asignatura)', s == 400 and all(t in msg for t in ['Ingresa un título', 'video, documento o imagen', 'unidad', 'asignatura']), (s, b))
s, b = req('POST', '/resources', {**recurso, 'asignaturaId': 'no-existe'}, ana)
ok('REC-05 asignatura inexistente: 400', s == 400, (s, b))
s, b = req('GET', '/resources')
ok('REC-06 sin sesión no se ven recursos de docentes', rid not in [r['id'] for r in b], len(b))
s, b = req('GET', '/resources', token=ana)
ok('REC-07 el autor ve su recurso marcado como propio', any(r['id'] == rid and r['propio'] for r in b), (s, len(b)))
s, b = req('GET', '/resources', token=beto)
ok('REC-08 otro docente no ve el recurso', rid not in [r['id'] for r in b])
s, b = req('PATCH', f'/resources/{rid}', {'titulo': 'Hackeado'}, beto)
ok('REC-09 otro docente no puede editarlo (404)', s == 404, (s, b))
s, b = req('DELETE', f'/resources/{rid}', token=beto)
ok('REC-10 otro docente no puede eliminarlo (404)', s == 404, (s, b))
s, b = req('PATCH', f'/resources/{rid}', {'titulo': 'Video editado', 'url': ''}, ana)
ok('REC-11 editar título y quitar enlace', s == 200 and b['titulo'] == 'Video editado' and b['url'] is None and b['unidad'] == 'Unidad 2', (s, b))

# --- Actividades ---
_, catalogo = req('GET', '/activities')
ok('ACT-01 hay actividades del catálogo', len(catalogo) > 0 and not any(a['propio'] for a in catalogo), len(catalogo))
s, b = req('PATCH', f"/activities/{catalogo[0]['id']}", {'titulo': 'x'}, ana)
ok('ACT-02 no se puede editar una actividad del catálogo (403)', s == 403 and 'catálogo' in b['message'], (s, b))
actividad = {'titulo': f'Carrera {SUF}', 'descripcion': 'Ubicar fracciones.', 'duracionMinutos': 20, 'asignaturaId': mat3['id']}
s, b = req('POST', '/activities', {**actividad, 'duracionMinutos': 0}, ana)
ok('ACT-03 duración 0: 400', s == 400 and 'al menos 1 minuto' in json.dumps(b, ensure_ascii=False), (s, b))
s, b = req('POST', '/activities', actividad, ana)
ok('ACT-04 crear actividad propia: 201', s == 201 and b['propio'] and b['duracionMinutos'] == 20, (s, b))
aid = b['id']
s, b = req('PATCH', f'/activities/{aid}', {'duracionMinutos': 25, 'asignaturaId': len5['id']}, ana)
ok('ACT-05 editar duración y asignatura', s == 200 and b['duracionMinutos'] == 25 and b['nivel'] == '5° básico', (s, b))

# --- Planificador: solo recursos del catálogo o propios ---
clase = {'titulo': 'Clase con recurso propio', 'fecha': '2026-10-28', 'objetivoId': oa['id'], 'recursoIds': [rid], 'actividadIds': [aid]}
s, b = req('POST', '/planner', clase, beto)
ok('PLAN-R1 otro docente no puede usar recursos ajenos en su clase (400)', s == 400, (s, b))
s, b = req('POST', '/planner', clase, ana)
ok('PLAN-R2 el autor sí puede usarlos', s == 201 and len(b['recursos']) == 1 and len(b['actividades']) == 1, (s, b))
pid = b['id']
_, lista = req('GET', '/resources', token=ana)
ok('REC-12 el recurso informa que se usa en 1 clase', next(r for r in lista if r['id'] == rid)['usos'] == 1)
s, b = req('DELETE', f'/resources/{rid}', token=ana)
ok('REC-13 eliminar recurso propio', s == 200 and b['id'] == rid, (s, b))
s, b = req('GET', f'/planner/{pid}', token=ana)
ok('REC-14 la clase sigue existiendo, sin el recurso eliminado', s == 200 and b['recursos'] == [] and len(b['actividades']) == 1, (s, b))
s, b = req('DELETE', f'/activities/{aid}', token=ana)
ok('ACT-06 eliminar actividad propia', s == 200, (s, b))
req('DELETE', f'/planner/{pid}', token=ana)

print(f'\nResultado: {sum(res)}/{len(res)} aprobadas')
