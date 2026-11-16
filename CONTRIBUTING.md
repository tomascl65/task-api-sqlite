# Guía de contribución — Cadencia de commits

## 1. Un commit por prompt o unidad lógica

Cada unidad de trabajo (cada prompt de implementación) debe dar lugar a **un solo commit**, con un mensaje en formato [Conventional Commits](https://www.conventionalcommits.org/) y el proyecto en verde:

- `npm run lint` pasa.
- `npx tsc --noEmit` pasa.
- `npm test` pasa (todas las pruebas funcionales).

No se permiten commits "de avance parcial" que rompan la compilación o las pruebas. Si una unidad de trabajo es grande, se divide en commits lógicos intermedios que mantengan el proyecto en verde en cada paso.

## 2. Prohibido un único commit final con todo el proyecto

Está **expresamente prohibido** acumular todos los cambios y hacer un único commit masivo al final. El historial debe reflejar la evolución incremental del proyecto, capa por capa, con mensajes que describan exactamente qué se agregó en cada paso.

## 3. Mapa de commits esperado

El historial del proyecto (`git log --oneline`) debe seguir este orden por capas:

| Prompt / Unidad de trabajo | Mensaje de commit (ejemplo real) |
|----------------------------|----------------------------------|
| Commit inicial de sincronización | `chore: initial commit with editorconfig and gitignore` |
| README inicial con reglas de desarrollo | `docs: agregar README con reglas de desarrollo y bitácora de IA` |
| Configuración Node.js + TypeScript (ESM) | `feat: configurar proyecto Node.js + TypeScript con ESM` |
| Variables de entorno validadas con Zod | `feat: configurar y validar variables de entorno con Zod` |
| Separación app de Express vs arranque del servidor | `feat: separar app de Express del arranque del servidor con /health` |
| Manejo base de errores HTTP | `feat: manejo base de errores HTTP con formato uniforme` |
| Capa de conexión SQLite (singleton, PRAGMAs) | `feat: capa de conexión SQLite con singleton y PRAGMAs` |
| Runner de migraciones SQL (sin ORM) | `feat: runner de migraciones SQL sin ORM` |
| Migración 001: entidad tasks e índices | `feat: migración 001 con entidad tasks e índices de consulta` |
| Dominio de tareas (entidad, reglas, puerto) | `feat: dominio de tareas con reglas puras y puerto de repositorio` |
| Repositorio SQLite (consultas preparadas) | `feat: repositorio SQLite de tareas con consultas preparadas` |
| Casos de uso de la aplicación | `feat(application): implementar casos de uso de tareas` |
| Esquemas Zod y middleware de validación | `feat(validation): agregar esquemas Zod y middleware de validación` |
| Endpoint POST /api/v1/tasks (creación) | `feat(tasks): implementar creación de tareas` |
| Endpoints GET (listado con filtros + detalle) | `feat(tasks): implementar listado con filtros y detalle` |
| Endpoint PATCH /api/v1/tasks/:id (actualización) | `feat(tasks): implementar actualización con reglas de transición` |
| Endpoint DELETE /api/v1/tasks/:id (eliminación) | `feat(tasks): implementar eliminación de tareas` |
| Pruebas funcionales Vitest + Supertest | `test(tasks): agregar pruebas funcionales de CRUD, filtros y errores` |
| Documentación de cadencia de commits | `docs: documentar cadencia de commits y mapa del historial` |

## 4. Regla de actualización del README

Cualquier commit que **cambie el contrato de la API** (nuevos endpoints, nuevos parámetros de query, nuevos códigos de error, cambios en esquemas de entrada/salida) o **cambie la forma de ejecutar el proyecto** (nuevos scripts de npm, nuevas variables de entorno, nuevos comandos de migración) **debe incluir una actualización del README.md** en el mismo commit.

El README es la fuente de verdad del contrato público; no puede quedar desactualizado respecto al código.

## 5. Verificación del historial

Ejecutar:

```bash
git log --oneline
```

El historial debe mostrar una evolución limpia por capas:

```
configuración → estructura → dominio → infraestructura → HTTP → pruebas → docs
```

Sin saltos ilógicos (por ejemplo, no puede haber un commit de controladores antes que el de casos de uso, ni pruebas antes que la infraestructura de base de datos).

## Mensaje de commit sugerido

`docs: documentar cadencia de commits y mapa del historial`
