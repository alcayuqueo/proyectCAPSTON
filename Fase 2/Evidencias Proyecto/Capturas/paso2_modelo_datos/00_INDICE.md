# Evidencias: Modelo de datos (Paso 2)

**Fecha:** 27-09-2026
**Herramienta:** Prisma Studio (`npx prisma studio`, http://localhost:5555)
**Contexto:** Base de datos PostgreSQL 16 levantada con Docker Compose.
Tablas creadas con la migración `20260927235152_init` y datos de ejemplo
cargados con `npx prisma db seed`.

| Archivo | Qué muestra | Uso sugerido en el informe |
|---|---|---|
| 01_prisma_studio_resumen_modelos.png | Las 6 tablas del modelo y la cantidad de registros de cada una (Actividad 2, Asignatura 2, Objetivo 3, Plan 0, Recurso 2, Usuario 0). | Evidencia general de que el modelo de datos está implementado y funcionando. |
| 02_tabla_asignatura.png | Matemática y Ciencias Naturales (5° básico) con sus relaciones hacia objetivos, recursos y actividades. | Entidad central del modelo y relaciones 1 a N. |
| 03_tabla_actividad.png | Actividades de ejemplo con duración en minutos, vinculadas a su asignatura. | Módulo de actividades. |
| 04_tabla_objetivo.png | Objetivos de Aprendizaje (OA03, OA05, OA08) asociados a su asignatura. | Alineación con la estructura curricular MINEDUC (propuesta de valor del proyecto). |
| 05_tabla_recurso.png | Recursos de ejemplo con tipo (VIDEO, DOCUMENTO) y unidad. | Módulo de recursos y uso de tipos enumerados. |
| 06_tabla_plan.png | Tabla de planificaciones vacía, con relación hacia docente y objetivo. | Estructura lista para el planificador (se llena al usarlo). |
| 07_tabla_usuario.png | Tabla de usuarios vacía, con campo passwordHash y rol. | Diseño de autenticación: contraseñas encriptadas y roles. |

## Observaciones para el informe

- Los datos son de **ejemplo** y sirven para validar el modelo. La carga del
  currículum oficial desde curriculumnacional.cl está planificada como tarea
  posterior.
- Mejora identificada: incorporar tablas Nivel y Unidad para reflejar la
  jerarquía curricular asignatura → nivel → unidad → OA.

## Capturas adicionales

| Archivo | Qué muestra |
|---|---|
| 08_migracion_init_aplicada.png | `npx prisma migrate dev --name init`: creación de la migración `20260927235152_init` y sincronización de la base de datos. |
| 09_seed_completado.png | `npx prisma db seed`: carga de los datos de ejemplo. |
| 10_commit_y_push_paso2.png | Commit y push a GitHub del modelo de datos (11 archivos, incluida la migración SQL). |
