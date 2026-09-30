# Nota: corrección del autor de los commits (28-09-2026)

La configuración local de Git tenía un carácter invisible en el correo del autor
(`al.cayuqueo<U+0091>@duocuc.cl`), por lo que GitHub no asociaba los commits a la
cuenta `alcayuqueo`. Se corrigió el correo en el historial con `git filter-branch`
y se subió con `git push --force-with-lease`. Las fechas, los mensajes y el
contenido de los commits no cambiaron.

Como el identificador de un commit depende de su autor, los identificadores
cambiaron. Las capturas tomadas antes de la corrección muestran los antiguos:

| Commit | Identificador anterior | Identificador actual |
|---|---|---|
| Estructura del monorepo, docker-compose y configuración base del backend | 0780a7f | 44b5572 |
| Modelo de datos con Prisma, seed inicial y migración | 0368ccd | afae28c |
| Módulo de autenticación con registro y login JWT | 64fb81e | 30dabb8 |
| API de búsqueda de objetivos de aprendizaje | 9ebaaf1 | 2435469 |
| Módulos de recursos y actividades (listado) | dea4a76 | 01316f9 |
| Planificador de clases protegido con JWT | 2a89b94 | 9aaa6e5 |

Captura de la corrección: `01_correccion_autor_commits.png`.
Resultado en GitHub después de la corrección: `02_commits_asociados_a_cuenta_github.png` (los commits aparecen con el usuario alcayuqueo y su foto de perfil).
