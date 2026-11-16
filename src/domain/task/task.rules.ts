import { Status } from './task.entity.js';

export const VALID_TRANSITIONS: Record<Status, Status[]> = {
  pendiente: ['en_curso'],
  en_curso: ['hecha'],
  hecha: [],
};

export function canTransition(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidTransition(from: Status, to: Status): boolean {
  return canTransition(from, to);
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}
