import type { RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";

export type ValidationSource = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: ValidationSource): RequestHandler {
  return (req, res, next) => {
    try {
      schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Entrada inválida",
          details,
        });
        return;
      }
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Entrada inválida",
        details: [],
      });
    }
  };
}
