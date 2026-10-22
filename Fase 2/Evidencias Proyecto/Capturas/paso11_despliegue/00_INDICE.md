# Paso 11 · Despliegue en la nube (Vercel + Render + Supabase)

**Tarea del tablero:** #21 Despliegue en línea
**Fecha:** 21 de octubre de 2026

A solicitud del docente, la aplicación se publicó en la nube. Docker se mantiene en el repositorio como alternativa de ejecución local.

| Componente | Plataforma | Dirección |
|---|---|---|
| Frontend | Vercel (plan Hobby) | https://software-educativo-azure.vercel.app |
| Backend | Render (Web Service Node, plan gratuito, Virginia) | https://software-educativo-api.onrender.com/api |
| Base de datos | Supabase (PostgreSQL, East US) | — |

| Archivo | Descripción |
|---|---|
| `01_render_deploy_exitoso.png` | Despliegue del backend en Render a partir del commit `676bd9f`: NestJS registra todas las rutas, inicia correctamente y Render publica el servicio ("Your service is live"). |
| `02_api_en_render_responde_datos_supabase.png` | El endpoint público `/api/curriculum/asignaturas` responde con las asignaturas almacenadas en Supabase, lo que confirma la conexión entre Render y la base de datos. |
| `03_vercel_despliegue_frontend.png` | Despliegue exitoso del frontend en Vercel, con la vista previa de la página de inicio. |
| `04_explorador_curricular_en_linea.png` | Explorador curricular en la versión publicada, mostrando los objetivos de aprendizaje obtenidos desde la API en Render. |
| `05_planificador_en_linea_con_sesion.png` | Inicio de sesión exitoso en la versión publicada: el docente accede al Planificador protegido con JWT. |

## Configuración

- **Render:** root directory `backend`; build `npm install && npx prisma generate && npm run build`; start `npx prisma migrate deploy && node dist/main`; variables `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET` (clave aleatoria de 64 caracteres).
- **Vercel:** root directory `frontend`, preset Vite, variable `VITE_API_URL`; `vercel.json` redirige las rutas a `index.html` para que la navegación directa funcione.
- **Supabase:** Row Level Security activado en todas las tablas (ver `paso10_supabase`).
- Render y Vercel publican automáticamente cada `git push` a la rama `main`.

## Observaciones

- El plan gratuito de Render suspende el backend tras unos minutos sin uso; la primera petición posterior tarda hasta un minuto (observado en la prueba del explorador curricular).
- Al iniciar sesión desde un dominio distinto al del registro, la barra lateral muestra solo el correo, porque el endpoint de login no devuelve el nombre del docente. Se corregirá junto con el planificador.
