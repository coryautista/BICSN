import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { ok } from '../../utils/http.js';
import {
  CatalogoMotivoBajaIdParamSchema,
  CreateCatalogoMotivoBajaSchema,
  ListCatalogoMotivoBajaSchema,
  UpdateCatalogoMotivoBajaSchema
} from './catalogoMotivoBaja.schemas.js';
import { handleCatalogoMotivoBajaError } from './infrastructure/errorHandler.js';
import type { GetAllCatalogoMotivoBajaQuery } from './application/queries/GetAllCatalogoMotivoBajaQuery.js';
import type { GetCatalogoMotivoBajaByIdQuery } from './application/queries/GetCatalogoMotivoBajaByIdQuery.js';
import type { CreateCatalogoMotivoBajaCommand } from './application/commands/CreateCatalogoMotivoBajaCommand.js';
import type { UpdateCatalogoMotivoBajaCommand } from './application/commands/UpdateCatalogoMotivoBajaCommand.js';
import type { DeleteCatalogoMotivoBajaCommand } from './application/commands/DeleteCatalogoMotivoBajaCommand.js';

const motivoBajaItemSchema = {
  type: 'object',
  properties: {
    motivoBajaId: { type: 'number' },
    clave: { type: 'string' },
    nombre: { type: 'string' },
    descripcion: { type: 'string', nullable: true },
    aplicaBajaPermanente: { type: 'boolean' },
    aplicaSuspension: { type: 'boolean' },
    requiereObservaciones: { type: 'boolean' },
    activo: { type: 'boolean' },
    orden: { type: 'number' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string', nullable: true },
    createdBy: { type: 'string', nullable: true },
    updatedBy: { type: 'string', nullable: true }
  }
} as const;

const errorResponseSchema = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
} as const;

export default async function catalogoMotivoBajaRoutes(app: FastifyInstance) {
  app.get('/catalogo-motivo-baja', {
    preHandler: [requireAuth],
    schema: {
      description: 'Lista motivos de baja con filtros opcionales',
      tags: ['catalogo-motivo-baja'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          activo: { type: 'boolean' },
          aplicaBajaPermanente: { type: 'boolean' },
          aplicaSuspension: { type: 'boolean' },
          requiereObservaciones: { type: 'boolean' },
          search: { type: 'string', maxLength: 100 }
        }
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' }, data: { type: 'array', items: motivoBajaItemSchema } } },
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  }, async (req, reply) => {
    const parsed = ListCatalogoMotivoBajaSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const query = req.diScope.resolve<GetAllCatalogoMotivoBajaQuery>('getAllCatalogoMotivoBajaQuery');
      return reply.send(ok(await query.execute(parsed.data)));
    } catch (error) {
      return handleCatalogoMotivoBajaError(error, reply);
    }
  });

  app.get('/catalogo-motivo-baja/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene un motivo de baja por id',
      tags: ['catalogo-motivo-baja'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: motivoBajaItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CatalogoMotivoBajaIdParamSchema.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const query = req.diScope.resolve<GetCatalogoMotivoBajaByIdQuery>('getCatalogoMotivoBajaByIdQuery');
      return reply.send(ok(await query.execute(parsed.data.id)));
    } catch (error) {
      return handleCatalogoMotivoBajaError(error, reply);
    }
  });

  app.post('/catalogo-motivo-baja', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crea un motivo de baja',
      tags: ['catalogo-motivo-baja'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['clave', 'nombre'],
        properties: {
          clave: { type: 'string', maxLength: 30, pattern: '^[A-Za-z0-9_]+$' },
          nombre: { type: 'string', maxLength: 100 },
          descripcion: { type: 'string', maxLength: 500, nullable: true },
          aplicaBajaPermanente: { type: 'boolean' },
          aplicaSuspension: { type: 'boolean' },
          requiereObservaciones: { type: 'boolean' },
          activo: { type: 'boolean' },
          orden: { type: 'number', minimum: 0 }
        }
      },
      response: { 201: { type: 'object', properties: { ok: { type: 'boolean' }, data: motivoBajaItemSchema } }, 400: errorResponseSchema, 409: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CreateCatalogoMotivoBajaSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const command = req.diScope.resolve<CreateCatalogoMotivoBajaCommand>('createCatalogoMotivoBajaCommand');
      return reply.code(201).send(ok(await command.execute({ ...parsed.data, usuario: req.user?.sub ?? null })));
    } catch (error) {
      return handleCatalogoMotivoBajaError(error, reply);
    }
  });

  app.put('/catalogo-motivo-baja/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Actualiza un motivo de baja',
      tags: ['catalogo-motivo-baja'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      body: {
        type: 'object',
        properties: {
          clave: { type: 'string', maxLength: 30, pattern: '^[A-Za-z0-9_]+$' },
          nombre: { type: 'string', maxLength: 100 },
          descripcion: { type: 'string', maxLength: 500, nullable: true },
          aplicaBajaPermanente: { type: 'boolean' },
          aplicaSuspension: { type: 'boolean' },
          requiereObservaciones: { type: 'boolean' },
          activo: { type: 'boolean' },
          orden: { type: 'number', minimum: 0 }
        }
      },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: motivoBajaItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 409: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const params = CatalogoMotivoBajaIdParamSchema.safeParse(req.params);
    const body = UpdateCatalogoMotivoBajaSchema.safeParse(req.body);
    if (!params.success || !body.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: params.success ? body.error?.message : params.error.message } });
    try {
      const command = req.diScope.resolve<UpdateCatalogoMotivoBajaCommand>('updateCatalogoMotivoBajaCommand');
      return reply.send(ok(await command.execute({ motivoBajaId: params.data.id, ...body.data, usuario: req.user?.sub ?? null })));
    } catch (error) {
      return handleCatalogoMotivoBajaError(error, reply);
    }
  });

  app.delete('/catalogo-motivo-baja/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Desactiva un motivo de baja. No elimina historico.',
      tags: ['catalogo-motivo-baja'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: motivoBajaItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CatalogoMotivoBajaIdParamSchema.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const command = req.diScope.resolve<DeleteCatalogoMotivoBajaCommand>('deleteCatalogoMotivoBajaCommand');
      return reply.send(ok(await command.execute(parsed.data.id, req.user?.sub ?? null)));
    } catch (error) {
      return handleCatalogoMotivoBajaError(error, reply);
    }
  });
}
