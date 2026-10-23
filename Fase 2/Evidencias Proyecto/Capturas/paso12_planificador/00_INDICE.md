# Paso 12 · Planificador de clases completo

**Tarea del tablero:** #6 Planificador completo en el frontend (crear, editar, eliminar)
**Fecha:** 22 de octubre de 2026

Las capturas se tomaron durante la ejecución de las pruebas automatizadas de interfaz, en el entorno local (backend NestJS real conectado a PostgreSQL, con un usuario de prueba).

| Archivo | Descripción |
|---|---|
| `01_planificador_lista_de_clases.png` | Lista de clases agrupada en "Próximas clases" y "Clases anteriores". Cada tarjeta muestra fecha, título, asignatura y nivel, OA, cantidad de recursos y actividades, duración total y las acciones editar, duplicar y eliminar. Se ve el aviso tras duplicar una clase. |
| `02_formulario_nueva_clase.png` | Formulario de nueva clase: título, fecha, asignatura y nivel, objetivo de aprendizaje (solo los OA de la asignatura elegida) y recursos numerados según el orden de selección. |
| `03_confirmacion_eliminar_clase.png` | Ventana de confirmación antes de eliminar una clase. |

## Funcionalidad implementada

**Backend**
- Modelo `Plan` con título, y tablas `PlanRecurso` y `PlanActividad` que guardan los recursos y actividades de cada clase **en orden** (base para el modo presentación). Migración `20261022040000_planificador_completo`, con Row Level Security en las tablas nuevas.
- Endpoints para obtener, editar (`PATCH`), duplicar y eliminar clases.
- Validaciones con mensajes en español; un objetivo, recurso o actividad inexistente responde 400 (antes producía un error 500).
- Cada docente solo accede a sus clases: una clase de otra cuenta responde 404.
- `login` y `register` devuelven los datos del docente, y `GET /api/auth/me` entrega su perfil (el nombre aparece siempre en la barra lateral).

**Frontend**
- Lista de clases con próximas y anteriores, aviso de confirmación y estados de carga y vacío.
- Formulario para crear y editar: los OA, recursos y actividades se filtran por asignatura; el orden de selección se muestra numerado y se calcula la duración total.
- Duplicar y eliminar (con confirmación; se cancela con Escape).

## Pruebas

- API: 25 casos (`pruebas/prueba_api_planificador.py`), todos aprobados.
- Interfaz: 18 casos (`pruebas/prueba_interfaz_planificador.py`), todos aprobados.
