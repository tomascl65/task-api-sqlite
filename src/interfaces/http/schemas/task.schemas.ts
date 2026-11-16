import { z } from "zod";

const statusEnum = z.enum(["pendiente", "en_curso", "hecha"]);

const isoDateString = z.string().refine(
  (value) => {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
    if (!regex.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  {
    message: "debe ser una fecha ISO-8601 válida",
  }
);

export const createTaskSchema = z
  .object({
    title: z.string().min(1, "el título es obligatorio").max(200, "el título no puede exceder 200 caracteres"),
    description: z.string().max(1000, "la descripción no puede exceder 1000 caracteres").optional(),
    status: statusEnum.optional(),
    assignee: z.string().min(1, "el responsable es obligatorio").max(200, "el responsable no puede exceder 200 caracteres"),
    dueDate: isoDateString,
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: statusEnum.optional(),
    assignee: z.string().min(1).max(200).optional(),
    dueDate: isoDateString.optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "se debe proporcionar al menos un campo para actualizar",
    }
  );

export const listTasksQuerySchema = z.object({
  status: statusEnum.optional(),
  assignee: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "updated_at", "due_date", "title"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid("el id debe ser un UUID válido"),
});

export type CreateTaskInputDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskInputDto = z.infer<typeof updateTaskSchema>;
export type ListTasksQueryDto = z.infer<typeof listTasksQuerySchema>;
export type TaskIdParamDto = z.infer<typeof taskIdParamSchema>;
