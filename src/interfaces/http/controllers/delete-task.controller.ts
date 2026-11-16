import type { Request, Response } from "express";
import { DeleteTaskUseCase } from "../../../application/use-cases/delete-task.js";

export class DeleteTaskController {
  constructor(private readonly deleteTaskUseCase: DeleteTaskUseCase) {}

  handle = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.deleteTaskUseCase.execute(id);
    res.status(204).end();
  };
}
