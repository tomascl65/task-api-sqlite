import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado", details?: Record<string, unknown>) {
    super({ code: "NOT_FOUND", httpStatus: 404, message, details });
  }
}
