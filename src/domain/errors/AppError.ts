export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor({
    code,
    httpStatus,
    message,
    details,
  }: {
    code: string;
    httpStatus: number;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
