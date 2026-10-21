# Paso 9 · Inicio de sesión y registro en el frontend

**Tarea del tablero:** #9 Login y registro en el frontend
**Fecha:** 20 de octubre de 2026

| Archivo | Descripción |
|---|---|
| `01_pantalla_inicio_sesion.png` | Pantalla de inicio de sesión con el diseño de la aplicación: panel de marca a la izquierda y formulario a la derecha. |
| `02_planificador_con_sesion_iniciada.png` | Tras iniciar sesión, el docente accede al Planificador (ruta protegida). La barra lateral muestra su nombre, correo y el botón para cerrar sesión. |
| `03_usuario_registrado_en_supabase.png` | Cuenta creada desde el formulario de registro, almacenada en la tabla `Usuario` de Supabase. La contraseña se guarda como hash bcrypt (`$2b$10$...`) y el rol por defecto es `DOCENTE`. |

## Funcionalidad implementada

- Pantallas de inicio de sesión y registro con validación de datos en el navegador (correo válido, contraseña de al menos 6 caracteres, confirmación de contraseña).
- Mensajes de error en español, incluidos los del backend: credenciales inválidas (401) y correo duplicado (409).
- Sesión persistente con token JWT; se cierra automáticamente si el backend rechaza el token.
- Planificador protegido: sin sesión, redirige al inicio de sesión y luego vuelve a la página solicitada.
- URL de la API configurable con `VITE_API_URL`, para el despliegue en Vercel.

## Pruebas realizadas

12 casos de prueba de interfaz automatizados (Playwright), todos aprobados: redirección sin sesión, validaciones, registro, persistencia al recargar, cierre de sesión, credenciales inválidas, correo duplicado, token inválido y vista en celular. Además, se validó el flujo completo contra el backend real conectado a Supabase.
