# Paso 19 · Diseño lúdico en toda la aplicación

**Fecha:** 25 de octubre de 2026

A partir de la retroalimentación de que la interfaz se veía «muy tosca» para un software escolar, se rediseñó toda la aplicación con un estilo lúdico y colorido, inspirado en el espíritu de los juegos educativos infantiles (colores vivos, formas redondeadas y botones grandes), con un diseño propio. Solo cambia lo visual: la navegación, los formularios, los videos y el cronómetro funcionan igual.

Las capturas se tomaron con el build de producción y la API simulada (datos de ejemplo). El entorno de pruebas no tiene internet, por lo que el video de YouTube se reemplazó por una imagen de prueba; en la aplicación publicada se reproduce el video real.

## Sistema visual

- **Un color por asignatura** (`frontend/src/lib/temas.ts`): Matemática azul, Lenguaje y Comunicación fucsia con letras flotantes, Ciencias Naturales verde y otras asignaturas turquesa. El mismo color aparece en el modo presentación, en las etiquetas de asignatura de las listas y en la fecha de cada clase del planificador. Los tonos oscuros usados para texto cumplen un contraste mínimo de 4,5:1.
- **Un color por sección** en el menú, los títulos y las tarjetas del inicio: Explorador azul, Recursos rosado, Actividades amarillo y Planificador verde.
- **Tipografías redondeadas:** Fredoka para títulos y Nunito para el texto, incluidas en la app con `@fontsource` (sin Google Fonts), para respetar la Content-Security-Policy y funcionar sin internet en la app Android.
- **Estilo «sticker»:** tarjetas y botones con borde grueso y sombra marcada; botón principal amarillo; fondo crema en lugar de gris.
- **Fondo de universo** en las pantallas del docente. Área central: azul profundo con estrellas, nebulosas, un planeta con anillo y una luna (en celulares y tablets solo las estrellas, para no tapar el texto). El panel lateral y la barra superior del celular usan el mismo cielo, solo con estrellas. Los títulos, descripciones y opciones del menú sobre el fondo se ven en blanco, y las tarjetas mantienen su texto oscuro.
- **Modo presentación:** «¡Hoy vamos a descubrir!», la meta de la clase con una diana, cronómetro circular, cierre «¡Lo logramos!» y escala proporcional en pantallas grandes (el texto base crece hasta 28 px).

## Capturas

`presentacion/`: portada, recurso de video, recurso con enlace, actividad (lista, en curso y «¡Tiempo!»), cierre, pantalla Full HD, colores de Matemática y Lenguaje, celular y Lenguaje con letras flotantes.

`pantallas_docente/`: inicio, explorador curricular, recursos, actividades, planificador, nueva clase, formulario de nuevo recurso, inicio de sesión, planificador en celular y menú en celular.

## Pruebas

- `pruebas/prueba_interfaz_presentacion.mjs`: 15 verificaciones del modo presentación (portada, video incrustado, enlace, cronómetro con inicio, +1 minuto, pausa, reinicio y «¡Tiempo!», cierre, teclado, puntos y celular sin desplazamiento horizontal). Todas aprobadas y sin errores en la consola.
- Recorrido de las pantallas del docente en escritorio (1366 px) y celular (390 px): sin errores en la consola ni desplazamiento horizontal.
- `npm run build` (TypeScript estricto) sin errores.
