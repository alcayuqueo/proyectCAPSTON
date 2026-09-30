# Evidencias: Planificador de clases (Paso 6)

**Fecha:** 27-09-2026
**Herramientas:** NestJS (`npm run start:dev`), curl desde Git Bash, PostgreSQL en Docker.

| Archivo | Qué muestra |
|---|---|
| 01_backend_completo_todas_las_rutas.png | Backend completo iniciado: rutas de auth, curriculum, resources, activities y planner (`GET` y `POST /api/planner`) mapeadas. |
| 02_pruebas_planificador_4_casos.png | Ejecución de los 4 casos de prueba del planificador, incluida la obtención del token JWT. |

## Plan de pruebas: planificador (pruebas de integración y seguridad de la API)

| ID | Caso de prueba | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| PLAN-01 | Acceso sin sesión | `GET /api/planner` sin token | Error 401 | `401 Unauthorized` | Aprobado |
| PLAN-02 | Crear planificación | `POST /api/planner` con token, fecha 2026-10-05 y OA05 | Planificación creada y asociada al docente | Registro creado con `docenteId` del usuario autenticado | Aprobado |
| PLAN-03 | Listar planificaciones propias | `GET /api/planner` con token | La planificación creada | Clase del 2026-10-05, Matemática, OA05 | Aprobado |
| PLAN-04 | Datos inválidos | fecha "mañana" | Error 400 | `400 Bad Request`, "fecha must be a valid ISO 8601 date string" | Aprobado |

## Observaciones para el informe

- El planificador está protegido con JWT: sin token, la API rechaza la petición (PLAN-01).
- El docente no envía su identificador: el backend lo obtiene del token, por lo que un usuario no puede crear planificaciones a nombre de otro (PLAN-02).
- Cada docente solo ve sus propias planificaciones (PLAN-03).
- Los datos se validan antes de llegar a la base de datos (PLAN-04).

## Mejoras identificadas

- Los mensajes de validación aparecen en inglés; conviene traducirlos al español para los docentes.
- Si se envía una fecha válida pero un `objetivoId` que no existe, la base de datos rechaza el registro y la API respondería con un error 500 genérico. Conviene validar que el objetivo exista y responder con un error 404 o 400 claro.

## Capturas adicionales

| Archivo | Qué muestra |
|---|---|
| 03_historial_commits_y_detalle_paso6.png | `git log --oneline`: historial completo del repositorio, con los 6 commits del backend sobre los commits de Fase 1. `git show --stat HEAD`: detalle del commit del planificador (5 archivos, 82 líneas). |
