# Resultado de la prueba de rendimiento

- **Fecha:** 24-10-2026, 10:58:23 p. m.
- **API:** `https://software-educativo-api.onrender.com/api`
- **Arranque en frío (Render plan gratuito):** 0.3 s
- **Solicitudes por nivel:** 200, repartidas entre 7 consultas de lectura
- **Herramienta:** Node.js v24.21.0

| Docentes simultáneos | Correctas | Solicitudes/s | Promedio | p50 | p95 | p99 | Máximo | Errores |
|---|---|---|---|---|---|---|---|---|
| 1 | 200/200 | 5.7 | 175 ms | 175 ms | 189 ms | 200 ms | 269 ms | 0 |
| 10 | 200/200 | 47.2 | 207 ms | 190 ms | 345 ms | 467 ms | 533 ms | 0 |
| 25 | 200/200 | 46.8 | 507 ms | 458 ms | 762 ms | 928 ms | 1709 ms | 0 |
| 50 | 200/200 | 44.1 | 1018 ms | 966 ms | 1245 ms | 1381 ms | 1421 ms | 0 |

**Requisito (p95 < 1000 ms y sin errores con hasta 50 docentes simultáneos):** ❌ no cumple
