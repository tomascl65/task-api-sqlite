# task-api-sqlite

API REST de gestión de tareas (CRUD + filtros + paginación) sobre SQLite.

## Stack y decisiones técnicas

- **Node.js LTS** + **TypeScript** (tipado estricto).
- **Express 4** como framework HTTP.
- **SQLite** con **better-sqlite3** como base de datos local (archivo `.sqlite`, sin servidor).
- **Zod** para validación de esquemas de entrada.
- **Vitest** + **Supertest** para pruebas unitarias e de integración.
- **dotenv** para variables de entorno.

### ¿Por qué SQLite?

Es una base de datos embebida en un único archivo, sin proceso servidor, sin configuración de conexión y cero dependencias externas de infraestructura. Encaja con el requisito de no usar bases de datos servidor y simplifica desarrollo, pruebas y despliegues ligeros.

### ¿Por qué NO Docker?

El alcance no requiere contenedores: la base de datos es un archivo local y la aplicación se ejecuta directamente sobre Node.js. Añadir Docker agregaría complejidad de orquestación innecesaria para este stack.

## Prerrequisitos del host

- Node.js LTS instalado (`node >= 18`, `npm` disponible).
- Acceso de escritura al directorio del proyecto para crear el archivo de base de datos SQLite.

## Estructura de carpetas prevista (por capas)

```
src/
  domain/            # Entidad Task y reglas de negocio (sin dependencias de Express/SQLite)
  application/       # Casos de uso de la aplicación
  infrastructure/    # Repositorio SQLite, migraciones y conexión a base de datos
  interfaces/http/   # Rutas, controladores y middlewares HTTP
  config/            # Configuración de la aplicación y variables de entorno
tests/               # Pruebas unitarias e de integración
.env                 # Variables de entorno (no versionado)
```

## Reglas de desarrollo

- **Ningún commit con el proyecto roto:** antes de commitear, verificar que la aplicación compila, las pruebas pasan y el servidor arranca sin errores.

## Instalación y ejecución

Instalación: pendiente (no hay `package.json` todavía).

Ejecución: pendiente (no hay scripts definidos todavía).

## Endpoints previstos de la API

| Método | Ruta         | Propósito                              |
| ------ | ------------ | -------------------------------------- |
| GET    | `/tasks`     | Listar tareas con filtros y paginación |
| GET    | `/tasks/:id` | Obtener una tarea por su ID            |
| POST   | `/tasks`     | Crear una nueva tarea                  |
| PUT    | `/tasks/:id` | Actualizar una tarea existente         |
| DELETE | `/tasks/:id` | Eliminar una tarea por su ID           |

## Variables de entorno previstas

| Variable        | Descripción                                                | Valor por defecto   |
| --------------- | ---------------------------------------------------------- | ------------------- |
| `PORT`          | Puerto del servidor HTTP                                   | `3000`              |
| `NODE_ENV`      | Entorno de ejecución (`development`, `test`, `production`) | `development`       |
| `DATABASE_PATH` | Ruta al archivo de base de datos SQLite                    | `./database.sqlite` |

## Bitácora de uso de IA

| Tarea | ¿Delegada a IA? | Aceptada/Corregida/Rechazada | Justificación |
| ----- | --------------- | ---------------------------- | ------------- |

## Escalabilidad futura

```

```
