import express, { type Request, type Response, type NextFunction } from 'express';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { taskRouter } from './routes/task.routes.js';

let requestCounter = 0;

export const app = express();

app.set('x-powered-by', false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req: Request, _res: Response, next: NextFunction) => {
  requestCounter += 1;
  _req.headers['x-request-id'] = `req-${Date.now()}-${requestCounter}`;
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/tasks', taskRouter);

app.use(notFoundHandler);
app.use(errorHandler);
