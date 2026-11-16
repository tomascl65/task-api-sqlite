import Database from "better-sqlite3";
import { openDb, closeDb } from "./connection.js";
import { AppError } from "../../domain/errors/AppError.js";
import { InvalidStatusTransitionError } from "../../domain/errors/InvalidStatusTransitionError.js";
import {
  CreateTaskInput,
  Pagination,
  PaginatedResult,
  Task,
  TaskFilters,
  TaskRepository,
  UpdateTaskInput,
} from "../../application/ports/task.repository.js";
import { Status } from "../../domain/task/task.entity.js";
import { canTransition, isValidIsoDate } from "../../domain/task/task.rules.js";

const ALLOWED_ORDER_BY = ["created_at", "updated_at", "due_date", "title"];
const ALLOWED_ORDER_DIR = ["ASC", "DESC"];

const UPDATABLE_FIELDS: (keyof UpdateTaskInput)[] = [
  "title",
  "description",
  "status",
  "assignee",
  "due_date",
];

function mapRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    status: row.status as Status,
    assignee: row.assignee as string,
    due_date: row.due_date as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function normalizeFilters(filters: TaskFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.assignee) {
    conditions.push("assignee = ?");
    params.push(filters.assignee);
  }
  if (filters.due_before) {
    conditions.push("due_date < ?");
    params.push(filters.due_before);
  }
  if (filters.due_after) {
    conditions.push("due_date > ?");
    params.push(filters.due_after);
  }
  if (filters.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  return { conditions, params };
}

function normalizeOrderBy(orderBy?: string, orderDir?: string) {
  const safeOrderBy = ALLOWED_ORDER_BY.includes(orderBy ?? "") ? orderBy : "created_at";
  const safeOrderDir = ALLOWED_ORDER_DIR.includes(orderDir ?? "") ? orderDir : "DESC";
  return { safeOrderBy, safeOrderDir };
}

export class SqliteTaskRepository implements TaskRepository {
  private db: Database.Database;

  constructor() {
    this.db = openDb();
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const { webcrypto } = await import("node:crypto");
    const id = webcrypto.randomUUID();
    const now = new Date().toISOString();

    const status = input.status ?? "pendiente";

    if (!isValidIsoDate(input.due_date)) {
      throw new AppError({
        code: "INVALID_DUE_DATE",
        httpStatus: 422,
        message: "La fecha límite debe ser un ISO-8601 válido",
        details: { due_date: input.due_date },
      });
    }

    const stmt = this.db.prepare(
      `INSERT INTO tasks (id, title, description, status, assignee, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      stmt.run(id, input.title, input.description ?? null, status, input.assignee, input.due_date, now, now);
    } catch (err) {
      throw this.translateError(err, "create");
    }

    const created = await this.findById(id);
    if (!created) {
      throw new AppError({
        code: "CREATE_FAILED",
        httpStatus: 500,
        message: "No se pudo recuperar la tarea creada",
      });
    }
    return created;
  }

  async findById(id: string): Promise<Task | null> {
    const stmt = this.db.prepare("SELECT * FROM tasks WHERE id = ?");
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return mapRowToTask(row);
  }

  async findAll(filters: TaskFilters, pagination: Pagination): Promise<PaginatedResult<Task>> {
    const { conditions, params } = normalizeFilters(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const { safeOrderBy, safeOrderDir } = normalizeOrderBy(filters.orderBy, filters.orderDir);

    const limit = Math.max(1, Math.min(pagination.limit, 100));
    const page = Math.max(1, pagination.page);
    const offset = (page - 1) * limit;

    const countStmt = this.db.prepare(
      `SELECT COUNT(*) AS total FROM tasks ${whereClause}`
    );
    const totalRow = countStmt.get(...params) as { total: number };
    const total = totalRow.total;

    const itemsStmt = this.db.prepare(
      `SELECT * FROM tasks ${whereClause} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`
    );
    const rows = itemsStmt.all(...params, limit, offset) as Record<string, unknown>[];

    return {
      items: rows.map(mapRowToTask),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: unknown[] = [];

    for (const field of UPDATABLE_FIELDS) {
      const value = input[field];
      if (value !== undefined) {
        if (field === "status") {
          const toStatus = value as Status;
          if (!canTransition(existing.status, toStatus)) {
            throw new InvalidStatusTransitionError(existing.status, toStatus);
          }
        }
        if (field === "due_date" && !isValidIsoDate(value as string)) {
          throw new AppError({
            code: "INVALID_DUE_DATE",
            httpStatus: 422,
            message: "La fecha límite debe ser un ISO-8601 válido",
            details: { due_date: value },
          });
        }
        updates.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString(), id);

    const stmt = this.db.prepare(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`
    );

    try {
      stmt.run(...params);
    } catch (err) {
      throw this.translateError(err, "update");
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    const stmt = this.db.prepare("DELETE FROM tasks WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private translateError(err: unknown, operation: string): AppError {
    if (err instanceof Error && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "SQLITE_CONSTRAINT_CHECK") {
        return new AppError({
          code: "INVALID_STATUS_TRANSITION",
          httpStatus: 422,
          message: "Valor no permitido para el campo restringido",
          details: { operation },
        });
      }
      if (code === "SQLITE_CONSTRAINT_UNIQUE") {
        return new AppError({
          code: "DUPLICATE_RECORD",
          httpStatus: 409,
          message: "Ya existe un registro con ese identificador",
          details: { operation },
        });
      }
    }
    return new AppError({
      code: "DATABASE_ERROR",
      httpStatus: 500,
      message: `Error de base de datos durante ${operation}`,
      details: { original: err instanceof Error ? err.message : String(err) },
    });
  }
}
