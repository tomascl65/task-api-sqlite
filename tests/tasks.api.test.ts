import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { app } from '../src/interfaces/http/app.js';
import { openDb, closeDb } from '../src/infrastructure/sqlite/connection.js';
import fs from 'fs';
import path from 'path';
import { Server } from 'http';
import supertest from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';

let db: ReturnType<typeof openDb>;

function applyMigration() {
  const sql = fs.readFileSync(path.resolve('migrations/001_init_tasks.sql'), 'utf-8');
  db.exec(sql);
}

describe('Tasks API', () => {
  let server: Server;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    db = openDb();
    applyMigration();
    server = app.listen(0);
    request = supertest(server);
  });

  afterAll(async () => {
    server.close();
    closeDb();
  });

  beforeEach(async () => {
    db.exec('DELETE FROM tasks');
  });

  describe('POST /api/v1/tasks', () => {
    it('crea una tarea válida y devuelve 201', async () => {
      const res = await request.post('/api/v1/tasks').send({
        title: 'Revisar PR',
        assignee: 'ana',
        dueDate: '2026-11-20T10:00:00Z',
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Revisar PR');
      expect(res.body.status).toBe('pendiente');
      expect(res.body.assignee).toBe('ana');
      expect(res.body.due_date).toBe('2026-11-20T10:00:00Z');
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    it('rechaza título faltante con 400', async () => {
      const res = await request
        .post('/api/v1/tasks')
        .send({ assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details.some((d: any) => d.field === 'title')).toBe(true);
    });

    it('rechaza campo desconocido con 400 (strict)', async () => {
      const res = await request.post('/api/v1/tasks').send({
        title: 'Tarea',
        assignee: 'ana',
        dueDate: '2026-11-20T10:00:00Z',
        campoExtra: 'no',
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza fecha inválida con 400', async () => {
      const res = await request
        .post('/api/v1/tasks')
        .send({ title: 'Tarea', assignee: 'ana', dueDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details.some((d: any) => d.field === 'dueDate')).toBe(true);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      await request
        .post('/api/v1/tasks')
        .send({ title: 'Tarea A', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });
      await request.post('/api/v1/tasks').send({
        title: 'Tarea B',
        status: 'en_curso',
        assignee: 'luis',
        dueDate: '2026-11-21T12:00:00Z',
      });
      await request.post('/api/v1/tasks').send({
        title: 'Tarea C',
        status: 'hecha',
        assignee: 'ana',
        dueDate: '2026-11-22T14:00:00Z',
      });
    });

    it('lista todas las tareas con metadatos de paginación', async () => {
      const res = await request.get('/api/v1/tasks');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('filtra por status', async () => {
      const res = await request.get('/api/v1/tasks?status=en_curso');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Tarea B');
      expect(res.body.meta.total).toBe(1);
    });

    it('filtra por assignee', async () => {
      const res = await request.get('/api/v1/tasks?assignee=ana');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('pagina correctamente', async () => {
      const res = await request.get('/api/v1/tasks?page=1&pageSize=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    it('ordena por campo whitelisted', async () => {
      const res = await request.get('/api/v1/tasks?orderBy=title&orderDir=ASC');

      expect(res.status).toBe(200);
      const titles = res.body.data.map((t: any) => t.title);
      expect(titles).toEqual(['Tarea A', 'Tarea B', 'Tarea C']);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('devuelve 200 con la tarea existente', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'Detalle', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request.get(`/api/v1/tasks/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.title).toBe('Detalle');
    });

    it('devuelve 404 si la tarea no existe', async () => {
      const res = await request.get('/api/v1/tasks/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('devuelve 400 si el id no es UUID válido', async () => {
      const res = await request.get('/api/v1/tasks/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('actualiza campos parciales y devuelve 200', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'Original', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request
        .patch(`/api/v1/tasks/${created.body.id}`)
        .send({ title: 'Modificado' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Modificado');
      expect(res.body.status).toBe('pendiente');
      expect(res.body.updated_at).not.toBe(created.body.updated_at);
    });

    it('permite transición válida pendiente→en_curso', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'T', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request
        .patch(`/api/v1/tasks/${created.body.id}`)
        .send({ status: 'en_curso' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('en_curso');
    });

    it('rechaza transición inválida en_curso→pendiente con 422', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'T', status: 'en_curso', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request
        .patch(`/api/v1/tasks/${created.body.id}`)
        .send({ status: 'pendiente' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('rechaza transición inválida hecha→pendiente con 422 (hecha es terminal)', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'T', status: 'hecha', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request
        .patch(`/api/v1/tasks/${created.body.id}`)
        .send({ status: 'pendiente' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('devuelve 404 si la tarea no existe', async () => {
      const res = await request
        .patch('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .send({ title: 'x' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('devuelve 400 si el body está vacío', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'T', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request.patch(`/api/v1/tasks/${created.body.id}`).send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('elimina una tarea existente y devuelve 204 sin cuerpo', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'Para eliminar', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      const res = await request.delete(`/api/v1/tasks/${created.body.id}`);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('devuelve 404 al eliminar una tarea ya eliminada', async () => {
      const created = await request
        .post('/api/v1/tasks')
        .send({ title: 'Para eliminar', assignee: 'ana', dueDate: '2026-11-20T10:00:00Z' });

      await request.delete(`/api/v1/tasks/${created.body.id}`);
      const res = await request.delete(`/api/v1/tasks/${created.body.id}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('devuelve 400 si el id no es UUID válido', async () => {
      const res = await request.delete('/api/v1/tasks/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
