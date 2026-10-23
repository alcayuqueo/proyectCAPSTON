# Pruebas de interfaz del planificador (18 casos) con Playwright.
# Uso: backend y frontend corriendo en local ->  pip install playwright && playwright install chromium
#      python pruebas/prueba_interfaz_planificador.py carpeta_capturas
# Requiere los datos del seed más un recurso "Imagen: recta numérica con fracciones" y una actividad
# "Ticket de salida" de Matemática (ver pruebas/README.md).
import sys, time
from playwright.sync_api import sync_playwright
import os
OUT=sys.argv[1] if len(sys.argv) > 1 else '.'; B=os.environ.get('APP_URL', 'http://localhost:5173')
res=[]
def card(pg,t): return pg.locator('li').get_by_text(t, exact=True)
def ok(n,c): res.append(bool(c)); print(('PASS' if c else 'FAIL'), n)
email=f'docente{int(time.time())}@colegio.cl'
with sync_playwright() as p:
    br=p.chromium.launch(); pg=br.new_page(viewport={'width':1366,'height':860})
    errs=[]; pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
    pg.goto(B+'/registro'); pg.fill('#nombre','María González'); pg.fill('#email',email); pg.fill('#password','secreto123'); pg.fill('#confirmar','secreto123'); pg.click('button[type=submit]')
    pg.wait_for_url('**/planificador'); pg.get_by_text('Aún no tienes clases planificadas.').wait_for()
    ok('Registro y planificador vacío', pg.get_by_text('María González').is_visible())
    pg.click('text=Nueva clase'); pg.wait_for_url('**/planificador/nueva'); pg.get_by_text('Datos de la clase').wait_for()
    pg.click('button[type=submit]')
    ok('Validación: título y objetivo obligatorios', pg.get_by_text('Ingresa un título para la clase.').is_visible() and pg.get_by_text('Selecciona el objetivo de aprendizaje de la clase.').is_visible())
    pg.fill('#titulo','Fracciones en la recta numérica'); pg.fill('#fecha','2026-10-28')
    pg.select_option('#asignatura', label='Matemática · 5° básico')
    ok('Al elegir asignatura solo aparecen sus OA', pg.get_by_text('OA05').is_visible() and pg.get_by_text('OA03').count()==0)
    pg.get_by_text('Demostrar que comprenden las fracciones').click()
    pg.get_by_text('Imagen: recta numérica con fracciones').click()
    pg.get_by_text('Video: ¿Qué es una fracción?').click()
    pg.get_by_text('Pizarra interactiva: ordenar fracciones').click()
    pg.get_by_text('Ticket de salida').click()
    ok('Duración total se calcula (15 + 10 = 25 min)', pg.get_by_text('25 min').last.is_visible())
    pg.fill('#notas','Llevar reglas y formar grupos de 4.')
    pg.screenshot(path=f'{OUT}/02_formulario_nueva_clase.png', full_page=True)
    pg.click('button[type=submit]'); pg.wait_for_url('**/planificador')
    card(pg,'Fracciones en la recta numérica').wait_for()
    ok('Clase creada aparece en Próximas clases con aviso', pg.get_by_text('Próximas clases').is_visible() and pg.get_by_role('status').is_visible())
    ok('Tarjeta muestra 2 recursos, 2 actividades y 25 min', pg.get_by_text('2 recursos').is_visible() and pg.get_by_text('2 actividades').is_visible())
    # editar
    pg.get_by_label('Editar Fracciones en la recta numérica').click(); pg.wait_for_url('**/editar'); pg.get_by_text('Editar clase').wait_for()
    ok('Edición precarga título y OA', pg.input_value('#titulo')=='Fracciones en la recta numérica' and pg.is_checked('input[name=objetivo]'))
    orden=pg.locator('label:has-text("Imagen: recta numérica") span').first.inner_text()
    ok('Edición conserva el orden de los recursos (imagen = 1)', orden.strip()=='1')
    pg.fill('#titulo','Fracciones en la recta numérica (v2)')
    pg.click('button[type=submit]'); pg.wait_for_url('**/planificador'); card(pg,'Fracciones en la recta numérica (v2)').wait_for()
    ok('Guardar cambios actualiza la tarjeta', pg.get_by_text('Cambios guardados.').is_visible())
    # clase pasada
    pg.click('text=Nueva clase'); pg.get_by_text('Datos de la clase').wait_for()
    pg.fill('#titulo','Órganos de la nutrición'); pg.fill('#fecha','2026-10-01')
    pg.select_option('#asignatura', label='Ciencias Naturales · 5° básico'); pg.get_by_text('Investigar y explicar').click()
    pg.click('button[type=submit]'); pg.wait_for_url('**/planificador'); card(pg,'Órganos de la nutrición').wait_for()
    ok('Clase con fecha pasada va a Clases anteriores', pg.get_by_text('Clases anteriores').is_visible())
    # duplicar
    pg.get_by_label('Duplicar Fracciones en la recta numérica (v2)').click()
    card(pg,'Fracciones en la recta numérica (v2) (copia)').wait_for()
    ok('Duplicar crea la copia', pg.get_by_text('Se creó una copia').is_visible())
    pg.screenshot(path=f'{OUT}/01_planificador_lista.png', full_page=True)
    # eliminar
    pg.get_by_label('Eliminar Fracciones en la recta numérica (v2) (copia)').click()
    pg.get_by_role('alertdialog').wait_for()
    pg.screenshot(path=f'{OUT}/03_confirmar_eliminar.png')
    pg.get_by_role('alertdialog').get_by_role('button', name='Eliminar').click()
    pg.get_by_text('Se eliminó').wait_for()
    ok('Eliminar con confirmación quita la copia', card(pg,'Fracciones en la recta numérica (v2) (copia)').count()==0)
    # cancelar eliminación con Escape
    pg.get_by_label('Eliminar Órganos de la nutrición').click(); pg.get_by_role('alertdialog').wait_for(); pg.keyboard.press('Escape')
    ok('Escape cancela la eliminación', pg.get_by_role('alertdialog').count()==0 and card(pg,'Órganos de la nutrición').is_visible())
    # cambio de asignatura limpia OA en edición
    pg.get_by_label('Editar Órganos de la nutrición').click(); pg.get_by_text('Editar clase').wait_for()
    pg.select_option('#asignatura', label='Matemática · 5° básico')
    ok('Cambiar de asignatura limpia el OA elegido', not pg.locator('input[name=objetivo]:checked').count())
    # recarga directa en ruta de edición
    pg.reload(); pg.get_by_text('Editar clase').wait_for()
    ok('Recargar en /editar funciona', pg.input_value('#titulo')=='Órganos de la nutrición')
    # sesión: cerrar y volver a entrar -> nombre desde el backend
    pg.goto(B+'/planificador'); card(pg,'Órganos de la nutrición').wait_for()
    pg.evaluate("localStorage.clear()")
    pg.goto(B+'/login'); pg.fill('#email',email); pg.fill('#password','secreto123'); pg.click('button[type=submit]'); pg.wait_for_url('**/planificador')
    card(pg,'Fracciones en la recta numérica (v2)').wait_for()
    ok('Login en "otro equipo" muestra el nombre (viene del backend)', pg.get_by_text('María González').is_visible())
    # sesión antigua sin nombre -> se completa con /auth/me
    pg.evaluate("""() => { const u = JSON.parse(localStorage.getItem('usuario')); delete u.nombre; localStorage.setItem('usuario', JSON.stringify(u)); }""")
    pg.reload(); pg.get_by_text('María González').wait_for(timeout=5000)
    ok('Sesión guardada sin nombre se completa con /auth/me', True)
    ok('Sin errores en la consola', not [e for e in errs if 'Failed to load resource' not in e])
    if errs: print(errs[:3])
    br.close()
print(f'{sum(res)}/{len(res)} aprobadas')
