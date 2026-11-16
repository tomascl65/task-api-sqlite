import express from "express";
import { validate } from "../middlewares/validate.js";
import { createTaskSchema } from "../schemas/task.schemas.js";
import { CreateTaskController } from "../controllers/create-task.controller.js";
import { CreateTaskUseCase } from "../../../application/use-cases/create-task.js";
import { TaskRepository } from "../../../application/ports/task.repository.js";
import { SqliteTaskRepository } from "../../../infrastructure/sqlite/task.repository.js";

const router = express.Router();
const repository: TaskRepository = new SqliteTaskRepository();
const createTaskUseCase = new CreateTaskUseCase(repository);
const createTaskController = new CreateTaskController(createTaskUseCase);

router.post(
  "/",
  validate(createTaskSchema, "body"),
  createTaskController.handle
);

export { router as taskRouter };
