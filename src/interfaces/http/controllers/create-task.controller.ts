import type { Request, Response } from 'express';
import { CreateTaskUseCase } from '../../../application/use-cases/create-task.js';
import { CreateTaskInputDto } from '../schemas/task.schemas.js';

export class CreateTaskController {
  constructor(private readonly createTaskUseCase: CreateTaskUseCase) {}

  handle = async (req: Request, res: Response) => {
    const input: CreateTaskInputDto = req.body as CreateTaskInputDto;
    const task = await this.createTaskUseCase.execute({
      title: input.title,
      description: input.description,
      status: input.status,
      assignee: input.assignee,
      due_date: input.dueDate,
    });
    res.status(201).json(task);
  };
}
