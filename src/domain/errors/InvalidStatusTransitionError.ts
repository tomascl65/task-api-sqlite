import { AppError } from "../errors/AppError.js";

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super({
      code: "INVALID_STATUS_TRANSITION",
      httpStatus: 422,
      message: `Transición de estado inválida: ${from} → ${to}`,
      details: { from, to },
    });
  }
}
