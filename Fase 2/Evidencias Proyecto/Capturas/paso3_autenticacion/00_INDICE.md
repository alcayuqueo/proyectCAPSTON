# Evidencias: Módulo de autenticación (Paso 3)

**Fecha:** 27-09-2026
**Herramientas:** NestJS (`npm run start:dev`), curl desde Git Bash, PostgreSQL en Docker.

| Archivo | Qué muestra |
|---|---|
| 01_backend_corriendo_rutas_auth.png | Backend iniciado sin errores, módulos Prisma/Auth/JWT cargados y rutas `POST /api/auth/register` y `POST /api/auth/login` mapeadas. |
| 02_registro_usuario_token.png | Servidor y cliente lado a lado: registro de un usuario y respuesta con token JWT. |
| 03_pruebas_auth_4_casos.png | Ejecución de los 4 casos de prueba (registro, login correcto, contraseña incorrecta, correo duplicado). |
| 04_tabla_casos_de_prueba.png | Tabla resumen de los casos de prueba. |
| 05_usuario_password_encriptada.png | Prisma Studio, tabla Usuario: un solo registro (confirma AUTH-04), rol DOCENTE por defecto y contraseña almacenada como hash bcrypt (`$2b$10$...`). |
| 06_commit_y_push_paso3.png | Commit y push a GitHub del módulo de autenticación (7 archivos). |

## Plan de pruebas: autenticación (pruebas de integración de la API)

| ID | Caso de prueba | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| AUTH-01 | Registro de usuario nuevo | nombre, email y contraseña válidos | Token JWT | `accessToken` generado | Aprobado |
| AUTH-02 | Login con credenciales correctas | email y contraseña registrados | Token JWT | `accessToken` generado | Aprobado |
| AUTH-03 | Login con contraseña incorrecta | email registrado, contraseña errónea | Error 401 | `401 Unauthorized`, "Credenciales inválidas." | Aprobado |
| AUTH-04 | Registro con correo duplicado | email ya existente | Error 409 | `409 Conflict`, "Ya existe una cuenta con ese correo." | Aprobado |

## Observaciones de seguridad para el informe

- Las contraseñas se almacenan encriptadas con bcrypt (campo `passwordHash`), nunca en texto plano. El prefijo `$2b$10$` indica la versión del algoritmo y un factor de costo 10 (ver captura 05).
- El error de login es genérico ("Credenciales inválidas") para no revelar si un correo está registrado.
- Los tokens JWT expiran a los 7 días y se firman con una clave definida en variables de entorno.
