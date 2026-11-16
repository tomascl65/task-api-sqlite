import { TaskRepository } from "../ports/task.repository.js";
import { NotFoundError } from "../../domain/errors/NotFoundError.js";

export class DeleteTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(id: string): Promise<void> {
    const exists = await this.repository.findById(id);
    if (!exists) {
      throw new NotFoundError(`Tarea con id "${id}" no encontrada`);
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Tarea con id "${id}" no encontrada`);
    }
  }
}

/* Pruebas unitarias sugeridas:
   - Elimina una tarea existente y no lanza error.
   - Lanza NotFoundError (404) cuando el id no existe.
   - No elimina dos veces la misma tarea (segundo delete lanza NotFoundError).
*/
