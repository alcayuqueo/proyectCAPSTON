# Paso 15 · Recursos y actividades: crear, editar y eliminar

**Fecha:** 24 de octubre de 2026

Las capturas se tomaron en un entorno local con una API simulada y datos de prueba (escritorio de 1280 px y celular de 390 px).

| Archivo | Descripción |
|---|---|
| `01_recursos_catalogo.png` | Página de recursos con sesión: botón «Nuevo recurso», buscador y filtros por asignatura, tipo y origen (todos, catálogo o propios). |
| `02_nuevo_recurso_validacion.png` | Formulario de nuevo recurso rechazando un enlace `javascript:` (solo se aceptan direcciones http/https). |
| `03_recurso_creado.png` | Recurso creado: aviso de confirmación y tarjeta marcada «Mío», con botones para editar y eliminar. Los del catálogo no los tienen. |
| `04_confirmar_eliminar.png` | Confirmación antes de eliminar un recurso. |
| `05_nueva_actividad.png` | Formulario de nueva actividad con duraciones sugeridas. |
| `06_actividad_creada.png` | Actividad creada, marcada «Mía», al inicio de la lista. |
| `07_movil_recursos.png` | Página de recursos en celular. |
| `08_movil_formulario.png` | En celular, el formulario aparece desde abajo y ocupa todo el ancho. |

## Funcionalidad implementada

**Base de datos**
- Campo `autorId` en `Recurso` y `Actividad` (migración `20261024160000_autor_recursos_actividades`). Vacío = elemento del **catálogo**, compartido y de solo lectura; con valor = elemento **propio** del docente. Los recursos y actividades existentes quedan en el catálogo.

**Backend**
- `POST`, `PATCH` y `DELETE` en `/api/resources` y `/api/activities`, protegidos con JWT.
- El listado es público: sin sesión muestra el catálogo; con sesión, también los propios (`propio: true`) y en cuántas clases se usa cada uno (`usos`).
- Permisos: el catálogo no se puede modificar (403); los elementos de otro docente responden 404, igual que si no existieran.
- Validaciones con mensajes en español. Los enlaces solo aceptan `http://` o `https://`, para impedir enlaces peligrosos como `javascript:`.
- El planificador solo acepta recursos y actividades del catálogo o propios.
- Al eliminar un recurso o actividad, las clases que lo usaban se conservan y solo lo dejan de incluir.

**Frontend**
- Páginas de recursos y actividades con buscador, filtros, formulario en ventana (crear y editar), confirmación al eliminar y avisos.
- Validación antes de enviar, foco en el primer error y cierre con Escape.

## Pruebas

- **Unitarias (Jest):** 30 casos en `backend/src/**/*.spec.ts`, todos aprobados (`npm test`).
- **Interfaz (Playwright, con API simulada):** 20 casos, todos aprobados: permisos sin sesión, validaciones, crear, editar, filtrar, eliminar y vista en celular.
- **Migración:** aplicada sobre PostgreSQL 16 con datos existentes; se comprobó que eliminar un recurso conserva la clase y que borrar una cuenta elimina sus recursos.
- **API:** `pruebas/prueba_api_recursos_actividades.py` (22 casos) para ejecutar con el backend local.
