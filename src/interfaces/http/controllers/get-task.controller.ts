import type { Request, Response } from 'express';
import { GetTaskUseCase } from '../../../application/use-cases/get-task.js';

export class GetTaskController {
  constructor(private readonly getTaskUseCase: GetTaskUseCase) {}

  handle = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const task = await this.getTaskUseCase.execute(id);
    res.status(200).json(task);
  };
}
