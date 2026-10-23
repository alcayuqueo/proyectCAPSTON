# Pruebas de la API: autenticación y planificador (25 casos).
# Uso: con el backend corriendo en local ->  python pruebas/prueba_api_planificador.py
# Requiere los datos de ejemplo del seed (Matemática y Ciencias Naturales, 5° básico).
import json, urllib.request, urllib.error
import os, time
SUF=str(int(time.time()))
CORREO=f'alex{SUF}@x.cl'
B=os.environ.get('API_URL', 'http://localhost:3000/api')
def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(B+path, data=data, method=method, headers={'content-type':'application/json'})
    if token: r.add_header('Authorization','Bearer '+token)
    try:
        with urllib.request.urlopen(r) as resp: return resp.status, json.loads(resp.read() or 'null')
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or 'null')
res=[]
def ok(n,c,extra=''): res.append(c); print(('PASS' if c else 'FAIL'), n, extra if not c else '')
s,b=req('POST','/auth/register',{'nombre':'Alex','email':f'a{SUF}@x.cl','password':'123'})
ok('AUTH-05 registro con contraseña corta: 400 en español', s==400 and 'al menos 6' in json.dumps(b,ensure_ascii=False), (s,b))
s,b=req('POST','/auth/register',{'nombre':'Alex Cayuqueo','email':CORREO.replace('alex','Alex'),'password':'secreto123'})
ok('AUTH-01 registro devuelve token y usuario', s==201 and b['usuario']['nombre']=='Alex Cayuqueo' and 'accessToken' in b and 'passwordHash' not in b['usuario'], (s,b))
t1=b['accessToken']
s,b=req('POST','/auth/register',{'nombre':'Otro','email':CORREO,'password':'secreto123'})
ok('AUTH-04 correo duplicado (sin importar mayúsculas): 409', s==409, (s,b))
s,b=req('POST','/auth/login',{'email':CORREO.upper(),'password':'secreto123'})
ok('AUTH-02 login devuelve usuario con nombre', s==201 and b['usuario']['nombre']=='Alex Cayuqueo', (s,b))
s,b=req('POST','/auth/login',{'email':CORREO,'password':'mala'})
ok('AUTH-03 contraseña incorrecta: 401', s==401 and b['message']=='Credenciales inválidas.', (s,b))
s,b=req('GET','/auth/me',token=t1); ok('AUTH-06 /auth/me devuelve el perfil', s==200 and b['email']==CORREO, (s,b))
s,b=req('GET','/auth/me'); ok('AUTH-07 /auth/me sin token: 401', s==401, (s,b))
s,objs=req('GET','/curriculum/objetivos'); oa=[o for o in objs if o['codigo']=='OA05'][0]
ok('CUR-06 objetivos incluyen asignaturaId', 'asignaturaId' in oa, oa)
s,recs=req('GET','/resources'); s2,acts=req('GET','/activities')
ok('REC-02 recursos incluyen asignaturaId y url', 'asignaturaId' in recs[0] and 'url' in recs[0], recs[0])
rm=[r for r in recs if r['asignaturaId']==oa['asignaturaId']]; am=[a for a in acts if a['asignaturaId']==oa['asignaturaId']]
rc=[r for r in recs if r['asignaturaId']!=oa['asignaturaId']]
s,b=req('POST','/planner',{'titulo':'x','fecha':'2026-10-28','objetivoId':oa['id']})
ok('PLAN-01 crear sin sesión: 401', s==401, (s,b))
s,b=req('POST','/planner',{'fecha':'2026-10-28','objetivoId':oa['id']},t1)
ok('PLAN-05 crear sin título: 400 en español', s==400 and 'Ingresa un título' in json.dumps(b,ensure_ascii=False), (s,b))
s,b=req('POST','/planner',{'titulo':'Fracciones','fecha':'2026-10-28','objetivoId':'no-existe'},t1)
ok('PLAN-06 objetivo inexistente: 400 (antes 500)', s==400 and 'no existe' in b['message'], (s,b))
s,b=req('POST','/planner',{'titulo':'Fracciones','fecha':'2026-10-28','objetivoId':oa['id'],'recursoIds':['zzz']},t1)
ok('PLAN-07 recurso inexistente: 400', s==400, (s,b))
s,b=req('POST','/planner',{'titulo':'  Fracciones en la recta  ','fecha':'2026-10-28','objetivoId':oa['id'],'notas':'Llevar regla','recursoIds':[rm[0]['id']],'actividadIds':[am[0]['id']]},t1)
ok('PLAN-02 crear clase con recurso y actividad', s==201 and b['titulo']=='Fracciones en la recta' and b['fecha']=='2026-10-28' and len(b['recursos'])==1 and b['duracionTotalMinutos']==am[0]['duracionMinutos'] and b['asignatura']['nombre']=='Matemática', (s,b))
pid=b['id']
s,b=req('GET','/planner',token=t1); ok('PLAN-03 listar clases propias', s==200 and len(b)==1 and b[0]['objetivo']['codigo']=='OA05', (s,b))
s,b=req('GET','/planner/'+pid,token=t1); ok('PLAN-08 obtener una clase', s==200 and b['id']==pid, (s,b))
s,b=req('PATCH','/planner/'+pid,{'titulo':'Fracciones (v2)','recursoIds':[rc[0]['id'],rm[0]['id']],'actividadIds':[]},t1)
ok('PLAN-09 editar: título, recursos en orden y quitar actividades', s==200 and b['titulo']=='Fracciones (v2)' and [r['id'] for r in b['recursos']]==[rc[0]['id'],rm[0]['id']] and b['actividades']==[] and b['notas']=='Llevar regla', (s,b))
s,b=req('PATCH','/planner/'+pid,{'fecha':'no-es-fecha'},t1); ok('PLAN-04 fecha inválida al editar: 400', s==400, (s,b))
s,b=req('POST','/planner/'+pid+'/duplicar',token=t1); ok('PLAN-10 duplicar', s==201 and b['titulo']=='Fracciones (v2) (copia)' and len(b['recursos'])==2 and b['id']!=pid, (s,b))
dup=b['id']
s,b=req('POST','/auth/register',{'nombre':'Otra Docente','email':f'otra{SUF}@x.cl','password':'secreto123'}); t2=b['accessToken']
s,b=req('GET','/planner/'+pid,token=t2); ok('PLAN-11 otra docente no ve mi clase: 404', s==404, (s,b))
s,b=req('DELETE','/planner/'+pid,token=t2); ok('PLAN-12 otra docente no puede eliminar mi clase: 404', s==404, (s,b))
s,b=req('GET','/planner',token=t2); ok('PLAN-13 la lista de otra docente está vacía', s==200 and b==[], (s,b))
s,b=req('DELETE','/planner/'+dup,token=t1); ok('PLAN-14 eliminar clase', s==200 and b['id']==dup, (s,b))
s,b=req('GET','/planner/'+dup,token=t1); ok('PLAN-15 clase eliminada ya no existe: 404', s==404, (s,b))
s,b=req('GET','/planner',token=t1); ok('PLAN-16 queda una clase', len(b)==1, (s,b))
print(f'{sum(res)}/{len(res)} aprobadas')
