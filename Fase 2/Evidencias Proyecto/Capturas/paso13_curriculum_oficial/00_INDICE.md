# Paso 13 · Currículum oficial: Matemática y Lenguaje, 1° a 6° básico

**Fecha:** 23 de octubre de 2026
**Fuente:** [Bases Curriculares Primero a Sexto Básico](https://www.curriculumnacional.cl/614/articles-22394_bases.pdf), Ministerio de Educación de Chile (1ª edición, diciembre 2018).

Las capturas se tomaron en un entorno local con los datos cargados por `npm run curriculum:cargar`.

| Archivo | Descripción |
|---|---|
| `01_explorador_todos.png` | Explorador curricular con buscador, filtros por asignatura, nivel y eje, y contador de resultados. |
| `02_matematica_3_geometria.png` | Filtro Matemática · 3° básico · Geometría: los 5 OA del eje, con su texto oficial y sus viñetas. |
| `03_lenguaje_5_comunicacion_oral.png` | Filtro Lenguaje y Comunicación · 5° básico · Comunicación oral. |
| `04_busqueda_fracciones.png` | Búsqueda por palabra clave ("fracciones") en todos los niveles. |

## Qué se hizo

**Datos**
- Se extrajo del PDF oficial el texto exacto de los **324 OA** de Matemática (146) y Lenguaje y Comunicación (178), de 1° a 6° básico, con su eje temático (`backend/prisma/data/extraer_oa.py`).
- Se corrigieron a mano los restos de la conversión del PDF: notas al pie pegadas a palabras, fracciones dibujadas en dos líneas, viñetas desplazadas y dos OA de Matemática 2° básico que el PDF muestra desalineados.
- El resultado quedó en `backend/prisma/data/oa-basica-1-6.json`.

**Backend**
- Campo `eje` en el modelo `Objetivo` (migración `20261023230000_eje_objetivo`).
- Script `npm run curriculum:cargar`: carga los OA y 24 actividades de ejemplo, y se puede ejecutar varias veces sin duplicar datos.
- Los dos OA de ejemplo del seed (Matemática 5° básico) tenían códigos distintos a los oficiales; el script pasa las clases que los usaban al OA oficial equivalente (OA05 → OA07, OA08 → OA06) para que ninguna planificación cambie de contenido.
- `GET /api/curriculum/objetivos` acepta filtros `asignatura`, `nivel`, `eje` y `q`; nuevo `GET /api/curriculum/ejes`.

**Frontend**
- Explorador curricular con filtros por asignatura, nivel y eje, búsqueda con retardo y viñetas de cada OA.
- En el formulario de clase, los OA aparecen agrupados por eje.

## Pruebas

- `pruebas/prueba_datos_curriculum.py`: 35 casos (cantidad de OA por nivel según las Bases, códigos sin saltos, ejes, texto limpio), todos aprobados.
- Migraciones aplicadas sobre PostgreSQL 16 local y carga ejecutada dos veces: 324 OA y 24 actividades, sin duplicados; las clases existentes conservan su contenido.
