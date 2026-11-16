import type { ErrorRequestHandler, Request } from "express";
import { ZodError } from "zod";
import { AppError } from "../../../domain/errors/AppError.js";
import { env } from "../../../config/env.js";

type ErrorResponseBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const requestId = (_req.headers["x-request-id"] as string | undefined) ?? "unknown";

  let httpStatus = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Error interno del servidor";
  let details: Record<string, unknown> | undefined;

  if (err instanceof AppError) {
    httpStatus = err.httpStatus;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    httpStatus = 400;
    code = "VALIDATION_ERROR";
    message = "Error de validación";
    details = err.flatten();
  } else if (err instanceof Error) {
    message = err.message;
  }

  const isProduction = env.NODE_ENV === "production";

  // eslint-disable-next-line no-console
  console.error(`[${requestId}] ${code}: ${message}`, err instanceof Error ? err.stack : String(err));

  const body: ErrorResponseBody = { code, message };
  if (details) body.details = details;
  if (!isProduction) body.stack = err instanceof Error ? err.stack : String(err);

  res.status(httpStatus).json(body);
};
