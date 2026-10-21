# Paso 10 · Base de datos en la nube con Supabase

**Fecha:** 20 de octubre de 2026

A solicitud del docente, la base de datos PostgreSQL se trasladó a Supabase como parte del despliegue en la nube (Vercel + Render + Supabase). Docker se mantiene en el repositorio como alternativa de ejecución local.

| Archivo | Descripción |
|---|---|
| `01_migracion_aplicada_en_supabase.png` | `npx prisma migrate deploy` aplica la migración `20260927235152_init` en Supabase usando la conexión directa (Session pooler, puerto 5432). |
| `02_tablas_creadas_sin_rls.png` | Tablas del modelo creadas en Supabase. Se observa la advertencia *UNRESTRICTED*: sin Row Level Security, la API pública de Supabase podría exponer los datos. |
| `03_rls_activado_en_todas_las_tablas.png` | Consulta SQL "Activar RLS" que habilita Row Level Security en las 7 tablas. El backend no se ve afectado porque Prisma se conecta como propietario de las tablas. |

## Cambios de configuración

- `schema.prisma`: se agrega `directUrl` para que las migraciones usen la conexión directa, mientras la aplicación usa el Transaction pooler (puerto 6543).
- `.env.example`: documenta las variables `DATABASE_URL` y `DIRECT_URL` para Supabase y para PostgreSQL local.
- Región de Supabase: East US (North Virginia), la misma que se usará en Render, para minimizar la latencia entre backend y base de datos.

## Decisión de seguridad

Row Level Security activado en todas las tablas: el acceso a los datos queda restringido al backend, sin exposición mediante la API pública de Supabase.
