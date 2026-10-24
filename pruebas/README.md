# Pruebas automatizadas

| Archivo | Qué prueba | Casos |
|---|---|---|
| `prueba_api_planificador.py` | API: registro, login, perfil, validaciones en español y planificador (crear, listar, editar, duplicar, eliminar y aislamiento entre docentes) | 25 |
| `prueba_api_recursos_actividades.py` | API: crear, editar y eliminar recursos y actividades; validaciones (enlaces seguros, duración); catálogo de solo lectura; aislamiento entre docentes; uso en el planificador | 22 |
| `prueba_datos_curriculum.py` | Datos del currículum oficial: cantidad de OA por nivel según las Bases Curriculares, códigos sin saltos, ejes válidos y texto sin restos de la extracción del PDF | 35 |
| `prueba_interfaz_planificador.py` | Interfaz en el navegador (Playwright): registro, formulario de clase, validaciones, edición, duplicar, eliminar con confirmación y sesión | 18 |

**Pruebas unitarias del backend (Jest):** están junto al código (`backend/src/**/*.spec.ts`) y no necesitan base de datos.

```bash
cd backend
npm test
```

| Archivo | Qué prueba | Casos |
|---|---|---|
| `resources/resources.service.spec.ts` | Servicio de recursos: crear, listar (catálogo + propios), editar, eliminar y permisos | 11 |
| `activities/activities.service.spec.ts` | Servicio de actividades: crear, listar, editar, eliminar y permisos | 7 |
| `common/validacion.spec.ts` | Reglas de validación: campos obligatorios, tipos, enlaces inseguros y duración | 12 |

## Cómo ejecutarlas

Se ejecutan contra el entorno **local** (crean usuarios y clases de prueba; no usarlas contra la base de datos de producción).

```bash
# 1. Backend y frontend corriendo en local (ver README principal)
# 2. Pruebas de la API (solo Python 3, sin dependencias):
python pruebas/prueba_api_planificador.py
python pruebas/prueba_api_recursos_actividades.py

# Datos del currículum (no necesita backend):
python pruebas/prueba_datos_curriculum.py

# 3. Pruebas de interfaz:
pip install playwright
playwright install chromium
python pruebas/prueba_interfaz_planificador.py capturas
```

Las pruebas de interfaz esperan, además de los datos del seed y del currículum oficial (`npm run curriculum:cargar`), un recurso **"Imagen: recta numérica con fracciones"** y una actividad **"Ticket de salida"** (10 min) en Matemática 5° básico.

Las URL se pueden cambiar con las variables `API_URL` y `APP_URL`.

## Resultado (22 de octubre de 2026)

- API: **25/25** aprobadas.
- Interfaz: **18/18** aprobadas.

## Resultado (23 de octubre de 2026)

- Datos del currículum: **35/35** aprobadas.

## Resultado (24 de octubre de 2026)

- Unitarias (Jest): **30/30** aprobadas.
- Interfaz de recursos y actividades (Playwright, con API simulada): **20/20** aprobadas.
