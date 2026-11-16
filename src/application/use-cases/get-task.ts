import { TaskRepository } from "../ports/task.repository.js";
import { Task } from "../../domain/task/task.entity.js";
import { NotFoundError } from "../../domain/errors/NotFoundError.js";

export class GetTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) {
      throw new NotFoundError(`Tarea con id "${id}" no encontrada`);
    }
    return task;
  }
}

/* Pruebas unitarias sugeridas:
   - Devuelve la tarea existente por id.
   - Lanza NotFoundError (404) cuando el id no existe.
   - No modifica la tarea; solo la lee.
*/
