# Pruebas de seguridad y rendimiento · Requisitos no funcionales

Evidencia de los requisitos no funcionales que pide el Instructivo CAPSTONE (seguridad, rendimiento, escalabilidad, disponibilidad y portabilidad) y de las pruebas de **seguridad** y **rendimiento**. Fecha: 24 de octubre de 2026.

## Resumen de requisitos no funcionales

| Requisito | Criterio | Cómo se cumple | Evidencia | Estado |
|---|---|---|---|---|
| **Seguridad** | Solo el docente accede a sus datos; contraseñas protegidas; sin vulnerabilidades altas ni críticas en producción | JWT HS256 con vencimiento, bcrypt, guards por ruta, permisos por autor, límite de intentos, encabezados HTTP, CORS restringido, CSP, validación de entradas, Row Level Security | 21 pruebas automáticas de seguridad; `npm audit` | ✅ |
| **Rendimiento** | Carga inicial < 2,5 s (LCP) en celular; p95 de la API < 1 s con 50 docentes simultáneos | Build optimizado de Vite (103 KiB comprimido), caché de 1 año para los archivos con hash, índices en las claves de búsqueda (correo, código de OA, autor) | Lighthouse 99–100; prueba de carga | ✅ frontend · ⏳ API (ver abajo) |
| **Escalabilidad** | Crecer en usuarios y contenido sin rediseñar | API sin estado (JWT), base de datos gestionada, frontend en CDN, nuevas asignaturas se cargan con un script sin tocar el código | Diagrama de despliegue; `npm run curriculum:cargar` | ✅ |
| **Disponibilidad** | Accesible en línea; despliegue automático | Vercel (CDN) + Render + Supabase; cada `git push` publica | Aplicación en línea | ✅ (plan gratuito de Render: arranque en frío de hasta 1 min tras inactividad) |
| **Portabilidad** | Funciona en navegador, pantalla interactiva y celular; se puede levantar en otro equipo | Diseño adaptable (390 px a 1920 px), Docker y docker-compose, app Android con Capacitor (planificada) | Capturas paso 14 y 16; `docker compose up` | ✅ |
| **Usabilidad y accesibilidad** | Usable en pantalla táctil y con teclado | Botones grandes, navegación con teclado y gestos, mensajes en español | Lighthouse accesibilidad 100 | ✅ |
| **Mantenibilidad** | Código probado y documentado | 54 pruebas unitarias y de seguridad (Jest) + pruebas de API, datos e interfaz; diagramas UML | `npm test`; `docs/diagramas` | ✅ |

---

## 1. Seguridad

### 1.1 Medidas implementadas

| Riesgo (OWASP Top 10 2021) | Medida |
|---|---|
| **A01 Control de acceso** | Rutas protegidas con `JwtAuthGuard`. Cada consulta filtra por el docente del token: las clases, recursos y actividades de otra cuenta responden 404. El catálogo es de solo lectura (403). El planificador solo acepta recursos y actividades del catálogo o propios. Row Level Security en todas las tablas de Supabase. |
| **A02 Fallas criptográficas** | Contraseñas con bcrypt (costo 10). JWT firmado con HS256 y vencimiento de 7 días; se rechazan tokens sin firma (`alg: none`), alterados o vencidos. HTTPS en Vercel y Render, con HSTS. El backend no arranca en producción sin `JWT_SECRET` y avisa si se usa un valor de ejemplo. |
| **A03 Inyección** | Prisma usa consultas parametrizadas: el texto de búsqueda nunca se interpreta como SQL. React escapa todo el texto que muestra (sin `dangerouslySetInnerHTML`). Los enlaces de recursos solo aceptan `http://` y `https://`, así que se rechaza `javascript:`. Solo se incrustan videos de YouTube y archivos de Drive, armando la dirección a partir de su identificador. |
| **A04 Diseño inseguro** | Validación de cada entrada con DTO (`class-validator`) y `whitelist`: los campos no declarados se descartan, de modo que el cliente no puede asignar el autor ni el id. Límite de 100 KB por solicitud (413). |
| **A05 Configuración insegura** | Encabezados con Helmet en la API (`nosniff`, `frame-ancestors 'none'`, HSTS; se oculta `X-Powered-By`). CORS solo para el frontend publicado, sus vistas previas, localhost y la app Android. En Vercel: Content-Security-Policy, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`. |
| **A06 Componentes vulnerables** | Auditoría con `npm audit` (ver 1.3). |
| **A07 Fallas de autenticación** | Máximo 10 intentos de inicio de sesión por minuto **por correo** (429), lo que impide probar contraseñas aunque se cambie de IP. 5 registros por minuto por IP y 300 solicitudes por minuto por IP en el resto de la API. El login responde lo mismo, y tarda lo mismo, si el correo no existe o si la contraseña es incorrecta, para no revelar qué correos tienen cuenta. El token nunca incluye el hash de la contraseña. |
| **A09 Registro y monitoreo** | Registros de Render. Ver *Mejoras futuras*. |

### 1.2 Pruebas automáticas de seguridad (21 casos, todos aprobados)

Archivo `backend/src/test/seguridad.spec.ts`. Levanta la aplicación NestJS completa (guards, pipes, Helmet, CORS y límites) con una base de datos en memoria. Se ejecuta con `cd backend && npm test`.

| Área | Casos |
|---|---|
| Tokens | Sin token → 401 · token válido → 200 · firmado con otra clave → 401 · `alg: none` → 401 · vencido → 401 · alterado → 401 |
| Login | Misma respuesta para correo inexistente y para contraseña incorrecta · la respuesta no contiene el hash |
| Fuerza bruta | 11° intento en un minuto → 429 · cambiar de IP no lo evita · no bloquea a otros docentes de la misma red · mensaje en español |
| Encabezados y CORS | `nosniff`, CSP, HSTS y sin `X-Powered-By` · el frontend publicado está autorizado · un sitio ajeno no lo está |
| Entradas | Inyección SQL tratada como texto · enlace `javascript:` → 400 · no se puede asignar otro autor · HTML guardado como texto · cuerpo de 200 KB → 413 · recurso de otro docente → 404 |

Además, `backend/src/auth/secreto-jwt.spec.ts` (3 casos) comprueba el chequeo del `JWT_SECRET`, y las pruebas de API (`pruebas/prueba_api_*.py`) verifican el aislamiento entre docentes contra el backend real.

### 1.3 Auditoría de dependencias (`npm audit`)

| Proyecto | Alcance | Antes | Después |
|---|---|---|---|
| Backend | Producción | 1 crítica · 5 altas · 4 moderadas | **0 críticas · 0 altas** · 4 moderadas |
| Backend | Incluye herramientas de desarrollo | 1 crítica · 9 altas · 10 moderadas · 3 bajas | 0 críticas · 4 altas · 10 moderadas · 3 bajas |
| Frontend | Lo que llega al navegador | 1 alta · 2 moderadas | **0 altas** · 2 moderadas |
| Frontend | Incluye herramientas de desarrollo | 1 crítica · 4 altas · 6 moderadas | 1 crítica · 2 altas · 6 moderadas |

**Correcciones:** `bcrypt` 5 → 6, que elimina la vulnerabilidad crítica de `tar`; versiones corregidas de `body-parser`, `multer` y `qs` (con `overrides` dentro de la misma versión mayor); `npm audit fix` en ambos proyectos.

**Riesgos aceptados (moderados, no explotables en este sistema):**

| Paquete | Vulnerabilidad | Por qué no aplica | Plan |
|---|---|---|---|
| `@nestjs/core` 10 | Inyección en Server-Sent Events (GHSA-36xv-jgw5-4q75) | La API no usa Server-Sent Events | Migrar a NestJS 11 después de la presentación |
| `file-type` (vía `@nestjs/common`) | Denegación de servicio con archivos malformados | La API no recibe archivos | Igual que el anterior |
| `react-router-dom` 6 | Redirección abierta (CVE-2025-68470) | La única redirección (después del login) se valida con `destinoSeguro()`, que solo acepta rutas internas | Migrar a react-router 7 |
| Vite, esbuild, Tailwind, Capacitor CLI | Varias (servidor de desarrollo, `tar`) | Son herramientas de desarrollo y compilación; no se publican | Actualizar con la migración de versiones mayores |

### 1.4 Mejoras futuras

Registro de eventos de seguridad (logins fallidos y bloqueos), recuperación de contraseña por correo, tokens de corta duración con renovación, y migración de NestJS 10 a 11 y de react-router 6 a 7.

---

## 2. Rendimiento

### 2.1 Frontend (Lighthouse 12)

Build de producción servido con los mismos encabezados y compresión que Vercel. Celular: Moto G Power simulado con red 4G lenta y CPU 4 veces más lenta; escritorio: perfil estándar de Lighthouse.

| Página | Dispositivo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| Inicio | Celular | **99** | 100 | 100 | 100 | 1,5 s | 1,6 s | 60 ms | 0 |
| Inicio | Escritorio | **100** | 100 | 100 | 100 | 0,4 s | 0,4 s | 0 ms | 0 |
| Explorador curricular | Celular | **100** | 100 | 100 | 100 | 1,4 s | 1,4 s | 30 ms | 0,004 |
| Explorador curricular | Escritorio | **100** | 100 | 100 | 100 | 0,4 s | 0,4 s | 0 ms | 0,001 |

- Peso total de la página: **103–106 KiB** comprimidos (JS 96 KiB, CSS 5 KiB).
- LCP de 1,4–1,6 s en celular, bajo el umbral de 2,5 s que Google considera «bueno».
- La Content-Security-Policy se probó contra las 45 pruebas de interfaz (recursos, actividades y modo presentación) sin ningún bloqueo.
- Informes completos en [`lighthouse/`](lighthouse); se abren en el navegador.

### 2.2 API (prueba de carga)

Script `pruebas/prueba_rendimiento.py`. Simula 1, 10, 25 y 50 docentes navegando a la vez con 7 consultas de lectura (currículum, búsqueda, recursos y actividades), 200 solicitudes por nivel, y mide el promedio, p50, p95, p99 y máximo. Solo lee datos, así que se puede ejecutar contra producción.

**Resultado en producción (Render + Supabase):** *pendiente de ejecutar; el script guarda la tabla en `pruebas/resultado_rendimiento.md`.*
