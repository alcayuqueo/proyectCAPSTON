# Paso 14 · Diseño adaptable: menú en celulares y tablets

**Fecha:** 23 de octubre de 2026

Antes de este cambio, la barra lateral ocupaba siempre 256 px, por lo que en un celular dejaba muy poco espacio al contenido. Las capturas se tomaron en un entorno local con datos de prueba (celular de 390 px, tablet de 820 px y escritorio de 1280 px).

| Archivo | Descripción |
|---|---|
| `01_movil_inicio.png` | Celular: la barra lateral se oculta y aparece una barra superior con el botón de menú. |
| `02_movil_menu_abierto.png` | Menú abierto sobre el contenido, con fondo oscurecido y botón para cerrar. |
| `03_movil_explorador.png` | Explorador curricular en celular: los filtros quedan uno bajo otro. |
| `04_movil_planificador.png` | Lista de clases en celular. |
| `05_movil_formulario_clase.png` | Formulario de clase: la barra con "Cancelar" y "Crear clase" ahora ocupa todo el ancho (antes quedaba desplazada y tapaba el contenido). |
| `06_escritorio_planificador.png` | Escritorio: la barra lateral sigue fija como antes. |
| `07_tablet_explorador.png` | Tablet: usa el menú desplegable. |

## Comportamiento

- Bajo 1024 px de ancho, la barra lateral se abre desde el botón ☰ y se cierra al elegir una página, al tocar el fondo, con el botón ✕ o con la tecla Escape.
- Con el menú abierto, la página de fondo no se desplaza; con el menú cerrado, sus enlaces no reciben el foco del teclado.
- Desde 1024 px, la barra lateral queda fija a la izquierda, igual que antes.

## Verificación (Playwright)

- El menú se cierra al navegar, con Escape y al tocar el fondo.
- Ninguna página (inicio, explorador, recursos, actividades, planificador y formulario) tiene desplazamiento horizontal a 390 px.
- En escritorio, el botón de menú no aparece y la barra lateral está visible.
