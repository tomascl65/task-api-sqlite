import express, { type Request, type Response, type NextFunction } from "express";

let requestCounter = 0;

export const app = express();

app.set("x-powered-by", false);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req: Request, _res: Response, next: NextFunction) => {
  requestCounter += 1;
  _req.headers["x-request-id"] = `req-${Date.now()}-${requestCounter}`;
  next();
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// TODO: montar router de tareas aquí
// app.use("/tasks", taskRouter);
