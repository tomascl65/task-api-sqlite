import type { Request, Response } from "express";
import { UpdateTaskUseCase } from "../../../application/use-cases/update-task.js";
import { UpdateTaskInputDto } from "../schemas/task.schemas.js";

export class UpdateTaskController {
  constructor(private readonly updateTaskUseCase: UpdateTaskUseCase) {}

  handle = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const input: UpdateTaskInputDto = req.body as UpdateTaskInputDto;
    const task = await this.updateTaskUseCase.execute(id, {
      title: input.title,
      description: input.description,
      status: input.status,
      assignee: input.assignee,
      due_date: input.dueDate,
    });
    res.status(200).json(task);
  };
}
