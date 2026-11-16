import { CreateTaskInput, TaskRepository } from "../ports/task.repository.js";
import { Task } from "../../domain/task/task.entity.js";
import { isValidIsoDate } from "../../domain/task/task.rules.js";
import { AppError } from "../../domain/errors/AppError.js";

export class CreateTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    if (!isValidIsoDate(input.due_date)) {
      throw new AppError({
        code: "INVALID_DUE_DATE",
        httpStatus: 422,
        message: "La fecha límite debe ser un ISO-8601 válido",
        details: { due_date: input.due_date },
      });
    }

    return this.repository.create(input);
  }
}

/* Pruebas unitarias sugeridas:
   - Crea una tarea con status por defecto "pendiente" y verifica que se devuelve.
   - Rechaza due_date con formato inválido (422 INVALID_DUE_DATE).
   - Acepta due_date ISO-8601 con y sin milisegundos.
   - Pasa el input tal cual al repository.create (sin modificar campos).
*/
