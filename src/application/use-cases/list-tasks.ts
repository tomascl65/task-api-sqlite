import {
  TaskFilters,
  Pagination,
  PaginatedResult,
  TaskRepository,
} from '../ports/task.repository.js';
import { Task } from '../../domain/task/task.entity.js';

export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(filters: TaskFilters, pagination: Pagination): Promise<PaginatedResult<Task>> {
    return this.repository.findAll(filters, pagination);
  }
}

/* Pruebas unitarias sugeridas:
   - Devuelve items, total, page, limit y totalPages del repository.
   - Pasa filtros y paginación tal cual al repository.
   - Filtro por status devuelve solo tareas con ese status.
   - Paginación respeta limit y calcula totalPages correctamente.
*/
