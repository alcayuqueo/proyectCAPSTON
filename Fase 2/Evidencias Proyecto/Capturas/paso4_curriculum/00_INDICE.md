# Evidencias: Módulo de currículum (Paso 4)

**Fecha:** 27-09-2026
**Herramientas:** NestJS (`npm run start:dev`), curl desde Git Bash, PostgreSQL en Docker.

| Archivo | Qué muestra |
|---|---|
| 01_backend_corriendo_rutas_curriculum.png | Backend iniciado con CurriculumModule cargado y rutas `GET /api/curriculum/objetivos` y `GET /api/curriculum/asignaturas` mapeadas, junto a las de autenticación. |
| 02_CUR01_listar_asignaturas.png | Prueba CUR-01: listado de asignaturas desde la API. |
| 03_pruebas_curriculum_5_casos.png | Ejecución de los 5 casos de prueba del módulo de currículum. |
| 04_commit_y_push_paso4.png | Commit y push a GitHub del módulo de currículum (4 archivos). |

## Plan de pruebas: currículum (pruebas de integración de la API)

| ID | Caso de prueba | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CUR-01 | Listar asignaturas | `GET /api/curriculum/asignaturas` | 2 asignaturas | Matemática y Ciencias Naturales | Aprobado |
| CUR-02 | Listar todos los OA | `GET /api/curriculum/objetivos` | 3 objetivos | OA03, OA05 y OA08 | Aprobado |
| CUR-03 | Buscar por palabra clave | `?q=fracciones` | Solo el OA de fracciones | OA05 de Matemática | Aprobado |
| CUR-04 | Buscar por asignatura | `?q=ciencias` | Solo OA de Ciencias | OA03 de Ciencias Naturales | Aprobado |
| CUR-05 | Búsqueda sin coincidencias | `?q=historia` | Lista vacía, sin error | `[]` | Aprobado |

## Observaciones para el informe

- La búsqueda no distingue mayúsculas de minúsculas y busca en código, descripción, asignatura y nivel (CUR-04 encontró "Ciencias Naturales" con "ciencias").
- Una búsqueda sin coincidencias devuelve una lista vacía en vez de un error (CUR-05), lo que permite al frontend mostrar un mensaje amigable.
- Los endpoints del currículum son públicos (no requieren login), porque los OA del MINEDUC son información pública.
