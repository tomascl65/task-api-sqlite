export type Status = 'pendiente' | 'en_curso' | 'hecha';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  assignee: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}
