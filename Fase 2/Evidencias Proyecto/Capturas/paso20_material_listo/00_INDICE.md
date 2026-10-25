# Paso 20 · Material listo para usar por OA

**Fecha:** 25 de octubre de 2026

Al probar el software se detectó que, aunque el planificador y el modo presentación estaban completos, el docente debía buscar y cargar por su cuenta todo el contenido de la clase. Para que la aplicación se pueda usar desde el primer día, se agregó **material listo** para una muestra curada del currículum y una **sugerencia de videos** para el resto.

Las capturas se tomaron con el build de producción y la API simulada, usando el material real de `backend/prisma/data`. El entorno de pruebas no tiene acceso a YouTube, por lo que el reproductor y las miniaturas se reemplazaron por imágenes de prueba; en la aplicación publicada se ven los videos reales.

## Qué se agregó

- **48 OA con material listo:** uno por cada eje y nivel de Matemática (5 ejes) y Lenguaje y Comunicación (3 ejes), de 1° a 6° básico. Por cada OA:
  - 2 diapositivas de explicación (concepto y ejemplo) y 2 preguntas para el curso con su respuesta (192 diapositivas en total).
  - 1 o 2 videos de YouTube en español, elegidos por tema y nivel (63 videos).
  - 1 actividad sugerida para la pantalla interactiva (48 actividades).
- **Sugerencia de videos para los otros 276 OA:** botón «Buscar videos para este OA», que abre una búsqueda en YouTube con las palabras clave del objetivo y el nivel.
- **Explorador curricular:** marca «Material listo», filtro «Solo OA con material listo», vista previa del material y botón «Crear clase con este material».
- **Formulario de clase:** al elegir un OA con material aparece el aviso con el botón «Usar material sugerido» (agrega los videos y la actividad y pone el tema como título) y la opción de mostrar u ocultar las diapositivas de contenido en la presentación. Los videos y actividades sugeridos aparecen primero y marcados.
- **Modo presentación:** orden pedagógico de la clase: objetivo → explicación → videos → preguntas («¡A pensar!», con opciones que se pueden marcar y botón «Ver respuesta») → actividades con cronómetro → cierre.
- **Planificador:** cada clase indica cuántas diapositivas de contenido tiene.

## Cambios técnicos

| Capa | Cambio |
|---|---|
| Base de datos | Migración `20261025180000_material_por_oa`: columna `material` (JSONB) en `Objetivo`, `objetivoId` opcional en `Recurso` y `Actividad`, `usarMaterial` en `Plan`. No modifica datos existentes. |
| Datos | `backend/prisma/data/material-matematica.json` y `material-lenguaje.json`. Carga con `npm run material:cargar` (valida antes de cargar, no duplica, solo toca el catálogo). |
| API | `GET /api/curriculum/objetivos/:id/material`; los OA informan `tema` y `tieneMaterial`; las clases devuelven `material` y aceptan `usarMaterial`. |
| Frontend | Explorador, formulario de clase, modo presentación y planificador. |
| Verificación de videos | `npm run material:verificar`: consulta oEmbed de YouTube para confirmar que cada video existe y permite verse incrustado. |

## Pruebas

- `backend/src/common/material.spec.ts` (Jest, 9 casos): formato de los 48 OA, que correspondan a OA oficiales, un OA por eje y nivel, videos de YouTube válidos y sin repetir, y lectura defensiva del material. Total del backend: **63/63**.
- `pruebas/prueba_interfaz_material.mjs` (Playwright, **30/30**): explorador, vista previa, crear clase con el material, OA sin material, búsqueda de videos y presentación en escritorio, celular y 1080p.
- `pruebas/prueba_interfaz_presentacion.mjs` sigue en **15/15** (se corrigió un nombre de variable que impedía ejecutarla).

## Capturas

| Archivo | Muestra |
|---|---|
| 01_explorador_material.png | Explorador con la marca «Material listo» y los botones por OA |
| 02_vista_previa_material.png | Vista previa: diapositivas, preguntas, videos y actividad |
| 03_formulario_material_listo.png | Clase creada desde el explorador con el material ya agregado |
| 04_formulario_sin_material.png | OA sin material: aviso y búsqueda de videos |
| 05_portada_con_material.png | Portada con la agenda «Aprendemos» y «¡A pensar!» |
| 06_diapositiva_explicacion.png | Diapositiva de explicación |
| 07_diapositiva_ejemplo.png | Diapositiva de ejemplo |
| 08_video_material.png | Video del material dentro de la presentación |
| 09_pregunta.png · 10_pregunta_respuesta.png | Pregunta con opción marcada y respuesta revelada |
| 11 a 13 | Vista en celular (explicación, pregunta y explorador) |
| 14_pantalla_interactiva_explicacion.png | Pantalla interactiva Full HD |
