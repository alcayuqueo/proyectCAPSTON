# Evidencias: Páginas del frontend conectadas a la API (Paso 8)

**Fecha:** 27-09-2026
**Entorno:** PostgreSQL en Docker + backend NestJS (`npm run start:dev`) + frontend Vite (`npm run dev`), funcionando en conjunto.

| Archivo | Qué muestra |
|---|---|
| 01_git_status_paso8.png | Archivos del paso: `App.tsx` modificado, `lib/api.ts` y las 4 páginas nuevas. |
| 02_explorador_curricular.png | Explorador curricular mostrando los 3 OA desde la base de datos, con código, asignatura, nivel y descripción, y buscador. |
| 03_recursos.png | Recursos obtenidos de la API, con ícono según tipo (video, documento), asignatura y unidad. |
| 04_actividades.png | Actividades obtenidas de la API, con duración y etiqueta de asignatura. |
| 05_planificador_sin_sesion.png | Planificador sin sesión iniciada: la API rechaza la petición (401) y la página muestra un aviso. |
| 06_commit_y_push_paso8.png | Commit y push a GitHub de las páginas del frontend (6 archivos, 317 líneas). |

## Resultado

La aplicación funciona de extremo a extremo: el frontend consulta la API, la API consulta PostgreSQL y los datos se muestran en la interfaz. Esto valida la arquitectura cliente → API REST → base de datos definida para el proyecto.

## Mejoras identificadas (trabajo siguiente)

- **Pantalla de inicio de sesión:** hoy no existe en el frontend, por lo que el Planificador no puede mostrar las planificaciones del docente aunque el backend ya implementa el login.
- **Mensaje del Planificador:** dice "No se pudo conectar con el backend todavía", pero el backend sí responde; la causa real es la falta de sesión (401). Conviene distinguir ambos casos y mostrar "Inicia sesión para ver tus planificaciones".
- **Botón "Nueva clase":** todavía no tiene funcionalidad; el backend ya permite crear planificaciones (`POST /api/planner`).
