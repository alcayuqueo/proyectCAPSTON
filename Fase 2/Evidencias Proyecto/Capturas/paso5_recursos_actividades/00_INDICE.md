# Evidencias: Módulos de recursos y actividades (Paso 5)

**Fecha:** 27-09-2026
**Herramientas:** NestJS (`npm run start:dev`), curl desde Git Bash, PostgreSQL en Docker.

| Archivo | Qué muestra |
|---|---|
| 01_pruebas_recursos_actividades.png | Ejecución de las pruebas REC-01 y ACT-01: listado de recursos y actividades desde la API. |
| 02_commit_y_push_paso5.png | Commit y push a GitHub de los módulos de recursos y actividades (7 archivos). |

## Plan de pruebas: recursos y actividades (pruebas de integración de la API)

| ID | Caso de prueba | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| REC-01 | Listar recursos | `GET /api/resources` | 2 recursos con título, tipo, unidad y asignatura | Video de fracciones (`video`, Unidad 1 - Números, Matemática) y guía del sistema digestivo (`documento`, Unidad 2 - Cuerpo humano, Ciencias Naturales) | Aprobado |
| ACT-01 | Listar actividades | `GET /api/activities` | 2 actividades con descripción y duración | Ordenar fracciones (15 min, Matemática) y rotulado del sistema digestivo (20 min, Ciencias Naturales) | Aprobado |

## Observaciones para el informe

- Los módulos incluyen el nombre de la asignatura en cada respuesta (relación resuelta en el backend), para que el frontend no necesite hacer consultas adicionales.
- Alcance actual: solo listado (GET). Crear, editar y eliminar recursos y actividades, y la subida de archivos, quedan planificados como trabajo posterior.
