# Paso 21 · Clases listas de 45 minutos

**Fecha:** 25 de octubre de 2026

Al probar el material del paso 20, el objetivo quedó más claro: que un profesor abra el **Planificador** y encuentre la clase ya hecha, completa y lista para proyectar. Para eso se amplió cada uno de los 48 materiales a una **clase completa de unos 45 minutos** y se agregó la pestaña **Clases listas**.

Las capturas se tomaron con el build de producción y la API simulada, usando el material real de `backend/prisma/data`. El reproductor de YouTube y las miniaturas se reemplazaron por imágenes de prueba porque el entorno de pruebas no tiene acceso a YouTube.

## Estructura de cada clase

| Momento | Contenido | Tiempo aprox. |
|---|---|---|
| Inicio | Objetivo de la clase y pregunta de activación («Para empezar») | 5 min |
| Desarrollo | Explicación, ejemplo y 1 o 2 videos | 10 min |
| Práctica | Ejercicios guiados con botón «Ver soluciones» | 5 min |
| Actividad 1 | Actividad grupal para la pantalla interactiva, con cronómetro | 15 min |
| Preguntas | Dos preguntas con alternativas y «Ver respuesta» | — |
| Actividad 2 | Práctica breve individual o en parejas, con cronómetro | 10 min |
| Cierre | Ticket de salida y recordatorio de la meta | 3 min |

Además, cada clase incluye una nota **«Antes de la clase»** con los materiales que debe preparar el docente. Esta nota no se muestra a los estudiantes y queda guardada en las notas de la clase.

En total son 48 clases, con 336 diapositivas, 63 videos y 96 actividades.

## Pestaña «Clases listas» (Planificador)

- Galería agrupada por asignatura y nivel, con filtros. Cada tarjeta muestra el tema, el OA, la duración, la cantidad de diapositivas, videos y actividades, y qué preparar.
- **Presentar ahora:** abre la clase en el modo presentación sin guardarla. Al cerrar, vuelve a la galería.
- **Agregar a mis clases:** pide la fecha y copia la clase al planificador del docente con sus videos, actividades, diapositivas y preparación. Después se puede editar como cualquier clase.
- **Ver:** muestra la clase completa, momento por momento.
- Si el docente aún no tiene clases, el Planificador se abre directamente en «Clases listas».

## Cambios técnicos

| Capa | Cambio |
|---|---|
| Datos | `material-*.json`: nuevos tipos de diapositiva `inicio`, `practica` y `cierre`; `actividades` (2 por OA) y `preparacion`. |
| API | `GET /api/curriculum/clases-listas` (galería) y `GET /api/curriculum/objetivos/:id/clase` (clase completa con el formato del planificador). |
| Carga | `npm run material:cargar` carga las dos actividades por OA, actualiza la duración de la primera a 15 min y quita los videos reemplazados. |
| Frontend | Pestaña «Clases listas», componente `VistaMaterial` compartido con el explorador, ruta `/clases-listas/:objetivoId/presentar` y diapositivas de inicio, práctica y ticket de salida en el modo presentación. |

## Pruebas

- Jest: **64/64**. `material.spec.ts` verifica que las 48 clases tengan la estructura completa (inicio, explicación, práctica, preguntas y ticket), que duren 45 minutos y que traigan preparación.
- `prueba_interfaz_material.mjs`: **47/47**, incluido el flujo de «Clases listas» (filtro, detalle, agregar con fecha, presentar sin guardar y volver).
- `prueba_interfaz_presentacion.mjs`: sigue en **15/15**.

## Capturas

| Archivo | Muestra |
|---|---|
| 15_clases_listas.png | Pestaña «Clases listas» en el Planificador |
| 16_clase_lista_detalle.png | Detalle de una clase lista, con la preparación y cada momento |
| 17_agregar_clase_lista.png | Agregar la clase a «Mis clases» eligiendo la fecha |
| 18_mis_clases_agregada.png | La clase agregada aparece en «Mis clases» |
| 05_portada_con_material.png | Portada con la agenda completa y «unos 45 min de clase» |
| 06a_diapositiva_inicio.png | Inicio: pregunta de activación |
| 06_diapositiva_explicacion.png | Explicación |
| 08b_practica.png | Práctica guiada con soluciones |
| 09_pregunta.png | Pregunta para el curso |
| 10b_ticket_salida.png | Ticket de salida |
| 12_celular_pregunta.png | Vista en celular |
