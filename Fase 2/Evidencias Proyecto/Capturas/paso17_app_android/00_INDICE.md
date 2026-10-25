# Paso 17 · Aplicación Android con Capacitor

**Fecha:** 25 de octubre de 2026

La aplicación web se empaquetó como app Android con **Capacitor 7** y se generó la APK en **Android Studio Rabbit** (Gradle 8.11.1 con Java 21) en el equipo del estudiante. Se probó en el emulador de Android Studio (Medium Phone, API 37) contra la API publicada en Render.

| Archivo | Descripción |
|---|---|
| `01_android_init.png` | `npm run android:init`: compilación del frontend en modo Android y creación del proyecto nativo. |
| `02_apk_generada_android_studio.png` | Android Studio: «Build completed successfully» al generar la APK. |
| `03_tamano_apk.png` | APK generada: `app-debug.apk` de 4,0 MB. |
| `04_app_planificador.png` | App en el emulador con sesión iniciada: planificador con las clases del docente, obtenidas de la API en Render. |
| `05_app_presentacion_video.png` | Modo presentación en la app: diapositiva con un video de CNTV Infantil incrustado. |
| `06_app_video_reproduciendo.png` | El video se reproduce dentro de la app. |
| `07_emulador_android_studio.png` | Emulador en Android Studio con la app en ejecución. |
| `08_app_explorador.png` | Explorador curricular en la app: 26 OA oficiales de Matemática 3° básico. |

## Configuración

- `frontend/capacitor.config.json`: identificador `cl.duocuc.softwareeducativo`, nombre «Software Educativo» y carpeta web `dist`.
- `frontend/.env.android`: la app llama directamente a la API publicada (`VITE_API_URL`), ya que no tiene el proxy de Vite ni de Vercel. La dirección es pública.
- La API autoriza el origen de la app (`https://localhost`) en su lista de CORS.
- Se actualizó Capacitor de la versión 6 a la 7, porque Android Studio Rabbit incluye Java 21 y la versión de Gradle de Capacitor 6 no es compatible con él.
- Scripts: `npm run android:init` (primera vez), `npm run build:android` (actualizar) y `npm run cap:open` (abrir en Android Studio). La carpeta `android/` se genera en cada equipo y no se sube al repositorio.

## Pruebas realizadas

Explorador curricular, inicio de sesión, planificador con las clases del docente, modo presentación y reproducción de un video de YouTube dentro de la diapositiva: todo funciona en la app igual que en la versión web.
