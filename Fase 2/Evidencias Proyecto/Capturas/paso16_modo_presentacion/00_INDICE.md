# Paso 16 · Modo presentación para la pantalla interactiva

**Fecha:** 24 de octubre de 2026

Las capturas se tomaron en un entorno local con una API simulada y una clase de ejemplo (Matemática 3° básico, OA11). Como el entorno de pruebas no tiene internet, la imagen de la diapositiva 3 es una imagen de prueba servida localmente y el video de YouTube no se muestra; en la aplicación publicada ambos se cargan desde su enlace.

| Archivo | Descripción |
|---|---|
| `01_planificador_boton_presentar.png` | Botón «Presentar» en cada clase del planificador. |
| `02_portada_objetivo.png` | Portada: título, fecha, asignatura, objetivo de aprendizaje con sus viñetas y agenda de la clase. |
| `03_recurso_imagen.png` | Recurso de tipo imagen mostrado dentro de la diapositiva. |
| `04_actividad_cronometro.png` | Actividad con cronómetro en curso (pausar, sumar un minuto, reiniciar). |
| `05_actividad_tiempo_cumplido.png` | Cronómetro en cero: aviso «¡Tiempo!». |
| `06_cierre.png` | Cierre de la clase: «¿Qué aprendimos hoy?» y el objetivo. |
| `07_pantalla_interactiva_1080p.png` | Portada en una pantalla interactiva Full HD (1920 × 1080). |
| `08_pantalla_interactiva_actividad.png` | Actividad en pantalla Full HD. |
| `09_movil_portada.png` | Portada en celular. |
| `10_movil_actividad.png` | Actividad en celular. |

## Funcionalidad

- Nueva ruta `/planificador/:id/presentar`, protegida con sesión y sin barra lateral.
- Diapositivas en el orden de la clase: portada con el objetivo → cada recurso → cada actividad → cierre.
- **Recursos dentro de la diapositiva:** videos de YouTube (con `youtube-nocookie.com`, sin cookies de seguimiento), archivos de Google Drive, imágenes y videos MP4. Otros enlaces muestran un botón para abrirlos en una pestaña nueva. Solo se incrustan YouTube y Drive, armando la dirección a partir del identificador del video o archivo.
- **Cronómetro por actividad:** iniciar, pausar, continuar, sumar un minuto y reiniciar. Sigue corriendo si se cambia de diapositiva, cambia de color cuando queda poco y avisa «¡Tiempo!» al llegar a cero.
- **Navegación pensada para la pantalla táctil:** botones grandes (56 px), puntos de progreso para saltar a una diapositiva, deslizar con el dedo, flechas del teclado, AvPág/RePág (controles de presentación), Inicio/Fin y la tecla F para pantalla completa.
- Pantalla completa con un botón. Respeta la preferencia del sistema de reducir animaciones.

## Pruebas (Playwright, 25 casos, todos aprobados)

Botón en el planificador, portada y agenda, avance y retroceso con teclado y botones, video incrustado con la dirección correcta, imagen, recurso sin enlace, cronómetro (descuento, pausa, +1 minuto, «¡Tiempo!» aunque se cambie de diapositiva, reinicio), cierre, salto con los puntos, salir, clase inexistente, gesto de deslizar y celular sin desplazamiento horizontal.
