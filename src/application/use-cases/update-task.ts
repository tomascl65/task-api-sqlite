import { TaskRepository } from '../ports/task.repository.js';
import { Task } from '../../domain/task/task.entity.js';
import { UpdateTaskInput } from '../ports/task.repository.js';
import { canTransition } from '../../domain/task/task.rules.js';
import { isValidIsoDate } from '../../domain/task/task.rules.js';
import { InvalidStatusTransitionError } from '../../domain/errors/InvalidStatusTransitionError.js';
import { AppError } from '../../domain/errors/AppError.js';
import { NotFoundError } from '../../domain/errors/NotFoundError.js';

export class UpdateTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Tarea con id "${id}" no encontrada`);
    }

    if (input.status !== undefined && input.status !== existing.status) {
      if (!canTransition(existing.status, input.status)) {
        throw new InvalidStatusTransitionError(existing.status, input.status);
      }
    }

    if (input.due_date !== undefined && !isValidIsoDate(input.due_date)) {
      throw new AppError({
        code: 'INVALID_DUE_DATE',
        httpStatus: 422,
        message: 'La fecha límite debe ser un ISO-8601 válido',
        details: { due_date: input.due_date },
      });
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new NotFoundError(`Tarea con id "${id}" no encontrada`);
    }
    return updated;
  }
}

/* Pruebas unitarias sugeridas:
   - Actualiza solo los campos enviados (actualización parcial).
   - Valida transición de estado solo si status cambia (canTransition).
   - Rechaza transición inválida con InvalidStatusTransitionError (422).
   - Rechaza due_date inválido con INVALID_DUE_DATE (422).
   - Lanza NotFoundError (404) cuando el id no existe.
   - updated_at se actualiza en el repository (no aquí).
*/
