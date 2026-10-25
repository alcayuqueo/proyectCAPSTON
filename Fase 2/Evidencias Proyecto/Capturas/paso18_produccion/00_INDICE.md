# Paso 18 · Validación en producción

**Fecha:** 24 de octubre de 2026

Capturas tomadas por el estudiante en la aplicación publicada (https://software-educativo-azure.vercel.app), con la API en Render y la base de datos en Supabase, después de activar la seguridad reforzada (Helmet, CORS restringido y Content-Security-Policy). Confirman que el currículum oficial, los recursos y actividades propios, los filtros y el modo presentación con video incrustado funcionan en producción, a diferencia de las capturas de los pasos 15 y 16, tomadas en un entorno local con la API simulada.

| Archivo | Descripción |
|---|---|
| `01_explorador_geometria_6basico.png` | Explorador curricular: OA oficiales de Matemática 6° básico filtrados por el eje Geometría. |
| `02_api_ejes_matematica.png` | Respuesta de la API publicada en Render (ruta `/api/curriculum/ejes`): los cinco ejes de Matemática. |
| `03_recursos_catalogo_y_propios.png` | Recursos: catálogo compartido y recursos propios del docente marcados como «Mío». |
| `04_actividades_filtro_ciencias_5basico.png` | Actividades filtradas por Ciencias Naturales, 5° básico. |
| `05_presentacion_portada.png` | Modo presentación: portada con el objetivo de aprendizaje y la agenda de la clase. |
| `06_presentacion_video_cntv.png` | Modo presentación: video de CNTV Infantil («Cuerpo humano: principales órganos») reproduciéndose dentro de la diapositiva. |

## Qué se verificó

- La Content-Security-Policy de Vercel permite incrustar videos de YouTube (`youtube-nocookie.com`) sin bloquear la aplicación.
- La API responde con CORS solo al frontend autorizado.
- Los recursos y actividades propios se guardan y se muestran solo al docente que los creó.
