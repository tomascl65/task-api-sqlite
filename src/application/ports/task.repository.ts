import { Status, Task } from "../../domain/task/task.entity.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Status;
  assignee: string;
  due_date: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Status;
  assignee?: string;
  due_date?: string;
}

export interface TaskFilters {
  status?: Status;
  assignee?: string;
  search?: string;
  due_before?: string;
  due_after?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskRepository {
  create(input: CreateTaskInput): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(
    filters: TaskFilters,
    pagination: Pagination
  ): Promise<PaginatedResult<Task>>;
  update(id: string, input: UpdateTaskInput): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}

export type { Task, Status };
