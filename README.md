# task-api-sqlite

API REST de gestión de tareas (CRUD + filtros + paginación) sobre SQLite.

## Stack y decisiones técnicas

- **Node.js LTS** + **TypeScript** (tipado estricto, `strict: true`).
- **Express 4** como framework HTTP.
- **SQLite** con **better-sqlite3** como base de datos local (archivo `.sqlite`, sin servidor).
- **Zod** para validación de esquemas de entrada.
- **Vitest** + **Supertest** para pruebas unitarias e de integración.
- **dotenv** para variables de entorno.

### ¿Por qué SQLite?

Es una base de datos embebida en un único archivo, sin proceso servidor, sin configuración de conexión y cero dependencias externas de infraestructura. Encaja con el requisito de no usar bases de datos servidor y simplifica desarrollo, pruebas y despliegues ligeros.

### ¿Por qué NO Docker?

El alcance no requiere contenedores: la base de datos es un archivo local y la aplicación se ejecuta directamente sobre Node.js. Añadir Docker agregaría complejidad de orquestación innecesaria para este stack.

### ¿Por qué capas (domain → application → infrastructure → interfaces/http)?

Separación de responsabilidades: el dominio no conoce ni Express ni SQLite, lo que permite probar reglas de negocio aisladamente y cambiar la infraestructura sin tocar la lógica de aplicación.

### ¿Por qué Zod?

Validación declarativa de esquemas de entrada con inferencia de tipos TypeScript, integrada en middlewares HTTP para rechazar peticiones inválidas antes de llegar a los casos de uso.

### ¿Por qué better-sqlite3?

Síncrono, simple y con excelente performance para consultas locales. Consulta preparada nativa que evita inyección SQL por construcción.

### ¿Por qué migraciones propias (sin ORM)?

Control total sobre el esquema SQL, sin la abstracción y el peso de un ORM. Las migraciones son archivos SQL versionados, aplicados en orden dentro de transacciones, con registro idempotente en `schema_migrations`.

## Prerrequisitos del host

- Node.js LTS instalado (`node >= 18`, `npm` disponible).
- Acceso de escritura al directorio del proyecto para crear el archivo de base de datos SQLite.

## Instalación y ejecución desde cero

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env si es necesario (PORT, DATABASE_PATH, NODE_ENV, etc.)

# 3. Aplicar migraciones (crea la tabla tasks y schema_migrations)
npm run migrate

# 4. Poblar con datos de ejemplo (opcional)
npm run seed

# 4. Modo desarrollo (con recarga automática)
npm run dev

# 5. Ejecutar pruebas
npm test

# 6. Modo pruebas en watch
npm run test:watch

# 7. Compilar TypeScript
npm run build

# 8. Iniciar en producción (después de build)
npm start
```

El servidor escucha en `http://localhost:3000` (o el `PORT` definido en `.env`).

### Verificación rápida

```bash
# Salud del servidor
curl http://localhost:3000/health

# Crear una tarea
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi tarea","assignee":"ana","dueDate":"2026-11-20T10:00:00Z"}'

# Listar tareas
curl "http://localhost:3000/api/v1/tasks?status=pendiente&page=1&pageSize=10"
```

## Estructura de carpetas (por capas)

```
src/
  config/            # Variables de entorno validadas con Zod (env.ts)
  domain/            # Entidad Task, reglas de negocio y errores de dominio (puro, sin frameworks)
  application/       # Casos de uso y puertos/interfaces de repositorio (task.repository.ts, use-cases/)
  infrastructure/    # Conexión SQLite, migraciones y repositorio concreto (connection.ts, migrate.ts, task.repository.ts)
  interfaces/http/   # Servidor Express, rutas, controladores, middlewares y esquemas Zod (app.ts, server.ts, routes/, controllers/, middlewares/, schemas/)
tests/               # Pruebas funcionales con Vitest + Supertest (contra app real y SQLite en memoria)
migrations/          # Archivos SQL numerados (001_init_tasks.sql, etc.)
.env                 # Variables de entorno (no versionado)
dist/                # Salida de compilación TypeScript (generada)
```

## Reglas de desarrollo

- **Ningún commit con el proyecto roto:** antes de commitear, verificar que la aplicación compila (`npm run build`), las pruebas pasan (`npm test`) y el servidor arranca sin errores.
- Un commit por unidad lógica, mensaje en formato Conventional Commits.
- Prohibido un único commit final con todo el proyecto.

## Endpoints de la API

Base: `http://localhost:3000/api/v1`

| Método | Ruta         | Propósito                              | Éxito | Errores                                                                            |
| ------ | ------------ | -------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| GET    | `/health`    | Estado del servidor                    | 200   | —                                                                                  |
| POST   | `/tasks`     | Crear una tarea                        | 201   | 400 (validación)                                                                   |
| GET    | `/tasks`     | Listar tareas con filtros y paginación | 200   | 400 (query inválida)                                                               |
| GET    | `/tasks/:id` | Obtener una tarea por ID               | 200   | 400 (UUID inválido), 404 (no existe)                                               |
| PATCH  | `/tasks/:id` | Actualizar una tarea parcialmente      | 200   | 400 (UUID/body inválido), 404 (no existe), 422 (transición de estado no permitida) |
| DELETE | `/tasks/:id` | Eliminar una tarea por ID              | 204   | 400 (UUID inválido), 404 (no existe)                                               |

### Matriz de transiciones de estado

| Desde → Hacia                                | Permitido              |
| -------------------------------------------- | ---------------------- |
| pendiente → en_curso                         | ✅                     |
| en_curso → hecha                             | ✅                     |
| hecha → cualquiera                           | ❌ (hecha es terminal) |
| cualquiera → hecha (directo desde pendiente) | ❌                     |

## Variables de entorno

| Variable          | Descripción                                                  | Valor por defecto   |
| ----------------- | ------------------------------------------------------------ | ------------------- |
| `PORT`            | Puerto del servidor HTTP                                     | `3000`              |
| `NODE_ENV`        | Entorno de ejecución (`development`, `test`, `production`)   | `development`       |
| `DATABASE_PATH`   | Ruta al archivo de base de datos SQLite                      | `./database.sqlite` |
| `DB_JOURNAL_MODE` | Modo de journal de SQLite (`DELETE`, `WAL`, `MEMORY`, `OFF`) | `WAL`               |
| `LOG_LEVEL`       | Nivel de logs (`silent`, `error`, `warn`, `info`, `debug`)   | `info`              |

Cuando `NODE_ENV=test`, la conexión usa `:memory:` para pruebas aisladas y rápidas.

## Bitácora de uso de IA

| Tarea                                                                                  | ¿Delegada a IA? | Aceptada/Corregida/Rechazada | Justificación                                                                                                  |
| -------------------------------------------------------------------------------------- | --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Commit inicial con .editorconfig y .gitignore                                          | Sí              | Aceptada                     | Estructura base correcta, sin lógica de aplicación.                                                            |
| README inicial con stack, decisiones y placeholders                                    | Sí              | Aceptada                     | Contenido acorde al alcance, sin inventar funcionalidades.                                                     |
| Regla "ningún commit con el proyecto roto"                                             | Sí              | Aceptada                     | Buena práctica de calidad, aplicada en todos los commits.                                                      |
| Configuración Node.js + TypeScript (package.json, tsconfig, ESLint, Prettier, Vitest)  | Sí              | Aceptada                     | Stack completo y coherente con ESM, verificable con `tsc --noEmit`.                                            |
| Variables de entorno validadas con Zod (src/config/env.ts)                             | Sí              | Aceptada                     | Falla al arrancar si falta o es inválida alguna variable.                                                      |
| Separación app vs server con /health                                                   | Sí              | Aceptada                     | Facilita pruebas con Supertest sin puerto real.                                                                |
| Manejo base de errores HTTP (AppError, NotFoundError, middlewares)                     | Sí              | Aceptada                     | Formato uniforme { code, message, details }, stack oculto en producción.                                       |
| Capa de conexión SQLite (singleton, PRAGMAs, :memory: en test)                         | Sí              | Aceptada                     | better-sqlite3, foreign_keys ON, WAL, busy_timeout.                                                            |
| Runner de migraciones SQL (sin ORM, idempotente, transacción por archivo)              | Sí              | Aceptada                     | schema_migrations, rollback ante fallo, mensaje con nombre de archivo.                                         |
| Migración 001: entidad tasks e índices                                                 | Sí              | Aceptada                     | CHECK constraint para status, índices para filtros frecuentes.                                                 |
| Dominio de tareas (entity, rules, InvalidStatusTransitionError, puerto TaskRepository) | Sí              | Aceptada                     | Puro, sin dependencias de Express/SQLite, reglas testeables.                                                   |
| Repositorio SQLite (consultas preparadas, mapeo snake_case↔camelCase, updated_at)      | Sí              | Aceptada                     | Sin concatenación de strings, errores de SQLite traducidos a dominio.                                          |
| Casos de uso (create, get, list, update, delete)                                       | Sí              | Aceptada                     | Inyección de repositorio, reglas de dominio, errores tipados.                                                  |
| Esquemas Zod y middleware de validación                                                | Sí              | Aceptada                     | .strict(), 400 con detalle por campo, distinción 400 vs 422.                                                   |
| Endpoint POST /api/v1/tasks                                                            | Sí              | Aceptada                     | Controlador delgado, 201 con tarea creada.                                                                     |
| Endpoints GET /api/v1/tasks y GET /api/v1/tasks/:id                                    | Sí              | Aceptada                     | Listado con filtros/paginación/meta, detalle 200/404.                                                          |
| asyncHandler para capturar promesas rechazadas en Express 4                            | Sí              | Corregida                    | Express 4 no captura async handlers por defecto; wrapper necesario.                                            |
| Endpoint PATCH /api/v1/tasks/:id                                                       | Sí              | Aceptada                     | Actualización parcial, transición validada en caso de uso, 422 si no permitida.                                |
| Endpoint DELETE /api/v1/tasks/:id                                                      | Sí              | Aceptada                     | 204 sin cuerpo, 404 si no existe, 400 si UUID inválido.                                                        |
| Pruebas funcionales Vitest + Supertest (21 pruebas)                                    | Sí              | Aceptada                     | Contra SQLite en memoria, sin mocks de persistencia.                                                           |
| CONTRIBUTING.md con cadencia de commits                                                | Sí              | Aceptada                     | Documenta un commit por unidad lógica y mapa del historial.                                                    |
| README completo                                                                        | Sí              | Corregida                    | Se agregaron ejecución, tabla de endpoints, decisiones, escalabilidad, limitaciones y bitácora de IA completa. |

## Escalabilidad futura

- **Autenticación / RBAC:** middleware de JWT o sesión, roles de usuario, autorización por operación y recurso.
- **Soft delete:** campo `deleted_at` en lugar de eliminación física, filtrado por defecto en listados.
- **Auditoría:** tabla de logs de quién creó/actualizó/eliminó cada tarea y cuándo.
- **OpenAPI (Swagger):** especificación generada a partir de los esquemas Zod para documentación y clientes.
- **Rate limiting:** middleware de límite de peticiones por IP o usuario.
- **Caché:** capa de caché en memoria o Redis para lecturas frecuentes de listados.
- **CI/CD:** pipeline de GitHub Actions que ejecute `npm run lint`, `npx tsc --noEmit` y `npm test` en cada push.
- **Bloqueo optimista:** campo `version` en tareas para detectar actualizaciones concurrentes (HTTP 409).
- **Migración a PostgreSQL:** si el volumen lo requiere, cambiar solo la capa `infrastructure/` manteniendo domain y application intactos.

## Limitaciones conocidas

- No hay autenticación ni autorización: cualquier cliente puede crear, leer, actualizar y eliminar tareas.
- No hay soft delete: la eliminación es física.
- La paginación usa `LIMIT/OFFSET`, que puede degradarse en tablas muy grandes (no es el caso esperado para este alcance).
- El archivo SQLite es local: no hay replicación ni alta disponibilidad.
- No hay OpenAPI/Swagger generado automáticamente.

## Aclaración sobre la prueba técnica

Este proyecto se entrega como parte de una prueba técnica con prioridad en la **intervención manual** para demostrar dominio del código: arquitectura por capas, separación de dominio e infraestructura, validación con Zod, reglas de transición de estado, pruebas funcionales sin mocks, y compromiso de un commit por unidad lógica con el proyecto siempre en verde.

## Comandos de resumen

| Comando                | Propósito                          |
| ---------------------- | ---------------------------------- |
| `npm install`          | Instalar dependencias              |
| `cp .env.example .env` | Crear variables de entorno         |
| `npm run migrate`      | Aplicar migraciones SQL |
| `npm run seed` | Poblar con datos de ejemplo (seed.sql) |
| `npm run dev` | Servidor en desarrollo con recarga |
| `npm test`             | Ejecutar suite de pruebas          |
| `npm run test:watch`   | Pruebas en modo watch              |
| `npm run build`        | Compilar TypeScript a `dist/`      |
| `npm start`            | Iniciar servidor en producción     |
| `npm run lint`         | Linter ESLint                      |
| `npm run format`       | Formateo con Prettier              |
