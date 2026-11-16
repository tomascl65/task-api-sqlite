import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../domain/errors/AppError.js';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError({ code: 'NOT_FOUND', httpStatus: 404, message: 'Ruta no encontrada' }));
};
