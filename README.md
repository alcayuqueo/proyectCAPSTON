# Software Educativo

Plataforma web y móvil que ayuda a docentes de establecimientos chilenos a **planificar y preparar sus clases alineadas al currículum nacional del MINEDUC** (1° básico a 4° medio), aprovechando las pantallas interactivas que ya existen en las salas de clases.

> Proyecto APT – Asignatura CAPSTONE · Ingeniería en Informática · Duoc UC · 2026

---

## Descripción

**Qué hace:** permite buscar Objetivos de Aprendizaje (OA) por asignatura, nivel o palabra clave, explorar recursos y actividades asociados, y armar planificaciones de clase guardadas en la cuenta del docente.

**A quién va dirigido:** docentes de enseñanza básica y media, y a los establecimientos que adquieren pantallas interactivas (muchas veces por licitación) y no cuentan con contenido curricular preparado para usarlas.

**Qué problema resuelve:** los colegios invierten en equipamiento tecnológico, pero el docente sigue preparando material a mano y buscando el currículum en distintas fuentes. La plataforma reúne en un solo lugar el currículum oficial, los recursos y la planificación, listos para proyectar en clase.

**Modelo de negocio:** freemium institucional (planes Gratuito, Docente Pro e Institucional), con un canal de alianza con distribuidores de pantallas interactivas. En el MVP no se implementan pagos; un campo `plan` en el usuario permite restringir funcionalidades.

---

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS, axios, react-router-dom |
| App móvil | Capacitor (generación de APK Android) |
| Backend | NestJS (Node.js) + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma (modelo, migraciones y seed) |
| Seguridad | Autenticación JWT, contraseñas cifradas con bcrypt |
| Contenedores | Docker + Docker Compose |
| Almacenamiento de archivos | MinIO *(planificado)* |
| Control de versiones | Git + GitHub |

---

## Arquitectura de la solución

Arquitectura en **tres capas**: cliente (web y móvil), API REST y persistencia. El backend sigue el patrón **Controller → Service → Prisma** en cada módulo.

```mermaid
flowchart LR
    subgraph Cliente
        W[Web React + Vite]
        M[App Android - Capacitor]
    end
    subgraph API["Backend NestJS (Docker)"]
        A[auth]
        C[curriculum]
        R[resources]
        AC[activities]
        P[planner]
    end
    subgraph Datos
        DB[(PostgreSQL 16 - Docker)]
        S[(MinIO - planificado)]
    end
    W -- HTTP/JSON + JWT --> API
    M -- HTTP/JSON + JWT --> API
    API -- Prisma ORM --> DB
    API -.-> S
```

| Componente | Responsabilidad | Estado |
|---|---|---|
| `auth` | Registro e inicio de sesión, emisión de JWT | Implementado |
| `curriculum` | Asignaturas y búsqueda de OA | Implementado |
| `resources` | Recursos educativos | Implementado (listado) |
| `activities` | Actividades por objetivo | Implementado (listado) |
| `planner` | Planificaciones del docente (protegido con JWT) | Implementado |
| App Android | Empaquetado del frontend con Capacitor | Planificado |
| MinIO | Almacenamiento de archivos de recursos | Planificado |

El detalle completo (diagramas UML, modelo de datos y decisiones técnicas) está en el documento de diseño dentro de las carpetas de evidencias.

---

## Estructura del repositorio

```
├── backend/              # API NestJS + Prisma
│   ├── prisma/           # schema.prisma, migraciones y seed
│   ├── src/              # módulos auth, curriculum, resources, activities, planner
│   ├── Dockerfile
│   └── .env.example
├── frontend/             # React + Vite + Tailwind
│   └── src/              # components, pages, lib/api.ts
├── docker-compose.yml    # PostgreSQL + backend
├── Fase 1/               # Evidencias de la Fase 1 (definición del proyecto)
├── Fase 2/               # Evidencias de la Fase 2 (desarrollo)
└── README.md
```

---

## Instrucciones para ejecutar el proyecto localmente

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows requiere WSL activado)
- Node.js 20 o superior y npm
- Git

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd <carpeta-del-repositorio>
```

### 2. Levantar base de datos y backend con Docker

```bash
docker compose up --build -d
docker compose ps
```

Esto levanta PostgreSQL y el backend. Al iniciar, el backend aplica automáticamente las migraciones (`prisma migrate deploy`).

- API disponible en: `http://localhost:3000/api`

### 3. Cargar datos de ejemplo (solo la primera vez)

```bash
cd backend
cp .env.example .env
npm install
npx prisma db seed
cd ..
```

Carga asignaturas y objetivos de ejemplo (Matemática y Ciencias Naturales, 5° básico). Ejecutarlo una sola vez para no duplicar datos.

### 4. Levantar el frontend

```bash
cd frontend
npm install
npm run dev
```

- Aplicación disponible en: `http://localhost:5173`

### 5. (Opcional) Ver la base de datos

```bash
cd backend
npx prisma studio
```

Se abre en `http://localhost:5555`.

### Detener el sistema

```bash
docker compose down
```

### Variables de entorno (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://postgres:postgres@localhost:5432/software_educativo?schema=public` |
| `JWT_SECRET` | Clave para firmar los tokens JWT | un texto largo y aleatorio |
| `PORT` | Puerto del backend | `3000` |

> Dentro de Docker, el backend usa el host `db` en lugar de `localhost` (ya configurado en `docker-compose.yml`).

### Problemas frecuentes

- **`port is already allocated` (5432):** hay otro PostgreSQL instalado en el equipo. Detenlo o cambia el puerto en `docker-compose.yml`.
- **"Virtualization support not detected" en Docker Desktop:** ejecutar `wsl --install --no-distribution` y reiniciar.
- **npm bloquea scripts de instalación (npm 11):** aprobar los de `bcrypt`, `prisma`, `@prisma/client`, `@prisma/engines` y `esbuild`.

### Generar el APK Android *(en desarrollo)*

```bash
cd frontend
npm run build
npx cap add android
npx cap sync
npx cap open android
```

---

## Endpoints principales de la API

| Método | Ruta | Descripción | Requiere JWT |
|---|---|---|---|
| POST | `/api/auth/register` | Registro de docente | No |
| POST | `/api/auth/login` | Inicio de sesión, retorna JWT | No |
| GET | `/api/curriculum/asignaturas` | Lista asignaturas y niveles | No |
| GET | `/api/curriculum/objetivos?q=` | Busca objetivos de aprendizaje | No |
| GET | `/api/resources` | Lista recursos | No |
| GET | `/api/activities` | Lista actividades | No |
| GET | `/api/planner` | Lista planificaciones del docente | Sí |
| POST | `/api/planner` | Crea una planificación de clase | Sí |

---

## Pruebas

Se ejecutaron **15 casos de prueba funcionales sobre la API**, todos aprobados:

| Módulo | Casos |
|---|---|
| Autenticación | Registro, login correcto, contraseña incorrecta (401), correo duplicado (409) |
| Currículum | Listar asignaturas, listar OA, búsqueda por palabra clave, por asignatura y sin resultados |
| Recursos y actividades | Listados |
| Planificador | Acceso sin sesión (401), crear, listar, datos inválidos (400) |

Además se validó el funcionamiento de punta a punta en el navegador. Las capturas están en la carpeta de evidencias de la Fase 2.

**Pendiente:** pruebas unitarias automatizadas, de integración, de rendimiento y de seguridad.

---

## Integrantes del equipo

| Nombre | Rol |
|---|---|
| Alex Cayuqueo | Desarrollador Full Stack: análisis, diseño, frontend, backend, base de datos, despliegue con Docker y documentación |

---

## Metodología de trabajo

El proyecto se gestiona con **Kanban**:

- **Tablero:** columnas *Por hacer → En progreso → En revisión → Hecho*, en GitHub Projects. *(enlace al tablero)*
- **Tareas semanales** con evidencia verificable, derivadas del cronograma ajustado tras la retroalimentación de la Fase 1.
- **Límite de trabajo en progreso** para mantener el foco en pocas tareas a la vez.
- **Commits pequeños y descriptivos** con prefijos convencionales (`feat`, `fix`, `chore`, `docs`), asociados a las tarjetas del tablero.

---

## Estado del proyecto

🟢 **Fase 1 – Definición del proyecto:** completada y evaluada.
🟡 **Fase 2 – Desarrollo:** en curso (informe de avance).

| Funcionalidad | Estado |
|---|---|
| Autenticación con JWT | ✅ |
| Modelo de datos, migraciones y seed | ✅ |
| Explorador curricular | ✅ |
| Recursos y actividades | ✅ (listado) |
| Planificador de clases | ✅ (API) |
| Despliegue con Docker Compose | ✅ |
| Pantalla de login en el frontend | 🔄 |
| Carga del currículum oficial MINEDUC completo | 🔄 |
| App Android (APK) | ⏳ |
| Almacenamiento de archivos (MinIO) | ⏳ |
| Pruebas automatizadas | ⏳ |

✅ hecho · 🔄 en progreso · ⏳ planificado
