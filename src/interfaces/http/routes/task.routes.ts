import express from "express";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "../schemas/task.schemas.js";
import { CreateTaskController } from "../controllers/create-task.controller.js";
import { GetTaskController } from "../controllers/get-task.controller.js";
import { ListTasksController } from "../controllers/list-tasks.controller.js";
import { UpdateTaskController } from "../controllers/update-task.controller.js";
import { DeleteTaskController } from "../controllers/delete-task.controller.js";
import { CreateTaskUseCase } from "../../../application/use-cases/create-task.js";
import { GetTaskUseCase } from "../../../application/use-cases/get-task.js";
import { ListTasksUseCase } from "../../../application/use-cases/list-tasks.js";
import { UpdateTaskUseCase } from "../../../application/use-cases/update-task.js";
import { DeleteTaskUseCase } from "../../../application/use-cases/delete-task.js";
import { TaskRepository } from "../../../application/ports/task.repository.js";
import { SqliteTaskRepository } from "../../../infrastructure/sqlite/task.repository.js";

const router = express.Router();
const repository: TaskRepository = new SqliteTaskRepository();

const createTaskUseCase = new CreateTaskUseCase(repository);
const createTaskController = new CreateTaskController(createTaskUseCase);

const getTaskUseCase = new GetTaskUseCase(repository);
const getTaskController = new GetTaskController(getTaskUseCase);

const listTasksUseCase = new ListTasksUseCase(repository);
const listTasksController = new ListTasksController(listTasksUseCase);

const updateTaskUseCase = new UpdateTaskUseCase(repository);
const updateTaskController = new UpdateTaskController(updateTaskUseCase);

const deleteTaskUseCase = new DeleteTaskUseCase(repository);
const deleteTaskController = new DeleteTaskController(deleteTaskUseCase);

router.post(
  "/",
  validate(createTaskSchema, "body"),
  asyncHandler(createTaskController.handle)
);

router.get(
  "/",
  validate(listTasksQuerySchema, "query"),
  asyncHandler(listTasksController.handle)
);

router.get(
  "/:id",
  validate(taskIdParamSchema, "params"),
  asyncHandler(getTaskController.handle)
);

router.patch(
  "/:id",
  validate(taskIdParamSchema, "params"),
  validate(updateTaskSchema, "body"),
  asyncHandler(updateTaskController.handle)
);

router.delete(
  "/:id",
  validate(taskIdParamSchema, "params"),
  asyncHandler(deleteTaskController.handle)
);

export { router as taskRouter };
