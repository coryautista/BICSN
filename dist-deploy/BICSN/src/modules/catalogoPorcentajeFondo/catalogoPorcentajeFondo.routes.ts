import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { ok } from '../../utils/http.js';
import {
  CatalogoPorcentajeFondoIdParamSchema,
  CatalogoPorcentajeFondoTipoParamSchema,
  CreateCatalogoPorcentajeFondoSchema,
  ListCatalogoPorcentajeFondoSchema,
  UpdateCatalogoPorcentajeFondoSchema
} from './catalogoPorcentajeFondo.schemas.js';
import { handleCatalogoPorcentajeFondoError } from './infrastructure/errorHandler.js';
import type { GetAllCatalogoPorcentajeFondoQuery } from './application/queries/GetAllCatalogoPorcentajeFondoQuery.js';
import type { GetCatalogoPorcentajeFondoByIdQuery } from './application/queries/GetCatalogoPorcentajeFondoByIdQuery.js';
import type { GetUltimoPorcentajeFondoVigenteQuery } from './application/queries/GetUltimoPorcentajeFondoVigenteQuery.js';
import type { CreateCatalogoPorcentajeFondoCommand } from './application/commands/CreateCatalogoPorcentajeFondoCommand.js';
import type { UpdateCatalogoPorcentajeFondoCommand } from './application/commands/UpdateCatalogoPorcentajeFondoCommand.js';
import type { DeleteCatalogoPorcentajeFondoCommand } from './application/commands/DeleteCatalogoPorcentajeFondoCommand.js';

const porcentajeItemSchema = {
  type: 'object',
  properties: {
    catalogoPorcentajeFondoId: { type: 'number' },
    tipoFondo: { type: 'string', enum: ['ahorro', 'vivienda', 'prestaciones', 'cair'] },
    anioVigencia: { type: 'number' },
    porcentajePatron: { type: 'number' },
    porcentajeAfiliado: { type: 'number', nullable: true },
    vigente: { type: 'boolean' },
    observaciones: { type: 'string', nullable: true },
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

export default async function catalogoPorcentajeFondoRoutes(app: FastifyInstance) {
  app.get('/catalogo-porcentaje-fondo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Lista porcentajes de fondos de aportacion con filtros opcionales',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          tipoFondo: { type: 'string', enum: ['ahorro', 'vivienda', 'prestaciones', 'cair'] },
          anioVigencia: { type: 'number' },
          vigente: { type: 'boolean' }
        }
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' }, data: { type: 'array', items: porcentajeItemSchema } } },
        400: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  }, async (req, reply) => {
    const parsed = ListCatalogoPorcentajeFondoSchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const query = req.diScope.resolve<GetAllCatalogoPorcentajeFondoQuery>('getAllCatalogoPorcentajeFondoQuery');
      return reply.send(ok(await query.execute(parsed.data)));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });

  app.get('/catalogo-porcentaje-fondo/:tipoFondo/ultimo-vigente', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene el ultimo porcentaje vigente utilizado para calcular un fondo',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['tipoFondo'], properties: { tipoFondo: { type: 'string', enum: ['ahorro', 'vivienda', 'prestaciones', 'cair'] } } },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' }, data: porcentajeItemSchema } },
        400: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    }
  }, async (req, reply) => {
    const parsed = CatalogoPorcentajeFondoTipoParamSchema.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const query = req.diScope.resolve<GetUltimoPorcentajeFondoVigenteQuery>('getUltimoPorcentajeFondoVigenteQuery');
      return reply.send(ok(await query.execute(parsed.data.tipoFondo)));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });

  app.get('/catalogo-porcentaje-fondo/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene un porcentaje de fondo por id',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: porcentajeItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CatalogoPorcentajeFondoIdParamSchema.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const query = req.diScope.resolve<GetCatalogoPorcentajeFondoByIdQuery>('getCatalogoPorcentajeFondoByIdQuery');
      return reply.send(ok(await query.execute(parsed.data.id)));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });

  app.post('/catalogo-porcentaje-fondo', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crea un porcentaje de fondo. Si vigente=true, desactiva otros vigentes del mismo fondo.',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['tipoFondo', 'anioVigencia', 'porcentajePatron'],
        properties: {
          tipoFondo: { type: 'string', enum: ['ahorro', 'vivienda', 'prestaciones', 'cair'] },
          anioVigencia: { type: 'number', minimum: 2000, maximum: 2100 },
          porcentajePatron: { type: 'number', minimum: 0, maximum: 1 },
          porcentajeAfiliado: { type: 'number', minimum: 0, maximum: 1, nullable: true },
          vigente: { type: 'boolean' },
          observaciones: { type: 'string', maxLength: 500, nullable: true }
        }
      },
      response: { 201: { type: 'object', properties: { ok: { type: 'boolean' }, data: porcentajeItemSchema } }, 400: errorResponseSchema, 409: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CreateCatalogoPorcentajeFondoSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const command = req.diScope.resolve<CreateCatalogoPorcentajeFondoCommand>('createCatalogoPorcentajeFondoCommand');
      return reply.code(201).send(ok(await command.execute({ ...parsed.data, usuario: req.user?.sub ?? null })));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });

  app.put('/catalogo-porcentaje-fondo/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Actualiza un porcentaje de fondo. Si vigente=true, desactiva otros vigentes del mismo fondo.',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      body: {
        type: 'object',
        properties: {
          anioVigencia: { type: 'number', minimum: 2000, maximum: 2100 },
          porcentajePatron: { type: 'number', minimum: 0, maximum: 1 },
          porcentajeAfiliado: { type: 'number', minimum: 0, maximum: 1, nullable: true },
          vigente: { type: 'boolean' },
          observaciones: { type: 'string', maxLength: 500, nullable: true }
        }
      },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: porcentajeItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 409: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const params = CatalogoPorcentajeFondoIdParamSchema.safeParse(req.params);
    const body = UpdateCatalogoPorcentajeFondoSchema.safeParse(req.body);
    if (!params.success || !body.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: params.success ? body.error?.message : params.error.message } });
    try {
      const command = req.diScope.resolve<UpdateCatalogoPorcentajeFondoCommand>('updateCatalogoPorcentajeFondoCommand');
      return reply.send(ok(await command.execute({ catalogoPorcentajeFondoId: params.data.id, ...body.data, usuario: req.user?.sub ?? null })));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });

  app.delete('/catalogo-porcentaje-fondo/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Desactiva un porcentaje de fondo. No elimina historico.',
      tags: ['catalogo-porcentaje-fondo'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'number' } } },
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' }, data: porcentajeItemSchema } }, 400: errorResponseSchema, 404: errorResponseSchema, 500: errorResponseSchema }
    }
  }, async (req, reply) => {
    const parsed = CatalogoPorcentajeFondoIdParamSchema.safeParse(req.params);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } });
    try {
      const command = req.diScope.resolve<DeleteCatalogoPorcentajeFondoCommand>('deleteCatalogoPorcentajeFondoCommand');
      return reply.send(ok(await command.execute(parsed.data.id, req.user?.sub ?? null)));
    } catch (error) {
      return handleCatalogoPorcentajeFondoError(error, reply);
    }
  });
}
