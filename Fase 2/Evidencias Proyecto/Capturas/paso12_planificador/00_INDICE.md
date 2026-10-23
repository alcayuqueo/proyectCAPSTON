# Paso 12 · Planificador de clases completo

**Tarea del tablero:** #6 Planificador completo en el frontend (crear, editar, eliminar)
**Fecha:** 22 de octubre de 2026

Las capturas 01 a 03 se tomaron durante la ejecución de las pruebas automatizadas de interfaz (entorno local con un usuario de prueba). Las capturas 04 a 09 corresponden a la validación manual del estudiante, con su cuenta y la base de datos en Supabase.

| Archivo | Descripción |
|---|---|
| `01_planificador_lista_de_clases.png` | Lista de clases agrupada en "Próximas clases" y "Clases anteriores". Cada tarjeta muestra fecha, título, asignatura y nivel, OA, cantidad de recursos y actividades, duración total y las acciones editar, duplicar y eliminar. Se ve el aviso tras duplicar una clase. |
| `02_formulario_nueva_clase.png` | Formulario de nueva clase: título, fecha, asignatura y nivel, objetivo de aprendizaje (solo los OA de la asignatura elegida) y recursos numerados según el orden de selección. |
| `03_confirmacion_eliminar_clase.png` | Ventana de confirmación antes de eliminar una clase. |
| `04_planificador_vacio_con_nombre_del_docente.png` | Validación manual: el planificador sin clases y el nombre del docente en la barra lateral, obtenido desde el backend. |
| `05_nueva_clase_asignatura_y_objetivo.png` | Validación manual: inicio del formulario con título, fecha y asignatura elegida. |
| `06_nueva_clase_actividades_y_notas.png` | Validación manual: actividad seleccionada, duración total calculada y notas. |
| `07_clases_creadas_en_supabase.png` | Validación manual: clases guardadas en Supabase y mostradas en "Próximas clases" con su OA, recurso, actividad y duración. |
| `08_editar_clase.png` | Validación manual: edición de una clase existente con sus datos precargados. |
| `09_clase_eliminada.png` | Validación manual: aviso tras eliminar una clase. |

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
