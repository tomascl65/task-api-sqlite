import type { Request, Response } from 'express';
import { ListTasksUseCase } from '../../../application/use-cases/list-tasks.js';
import { ListTasksQueryDto } from '../schemas/task.schemas.js';

export class ListTasksController {
  constructor(private readonly listTasksUseCase: ListTasksUseCase) {}

  handle = async (req: Request, res: Response) => {
    const filters: ListTasksQueryDto = {
      status: req.query.status as ListTasksQueryDto['status'],
      assignee: req.query.assignee as ListTasksQueryDto['assignee'],
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
      orderBy: req.query.orderBy as ListTasksQueryDto['orderBy'],
      orderDir: req.query.orderDir as ListTasksQueryDto['orderDir'],
    };

    const pagination = { page: filters.page, limit: filters.pageSize };
    const result = await this.listTasksUseCase.execute(filters, pagination);

    res.status(200).json({
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  };
}
