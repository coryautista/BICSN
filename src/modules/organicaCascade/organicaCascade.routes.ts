import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { GetOrganica1ChildrenQuery } from './application/queries/GetOrganica1ChildrenQuery.js';
import { GetOrganica2ChildrenQuery } from './application/queries/GetOrganica2ChildrenQuery.js';
import { GetOrganica3ChildrenQuery } from './application/queries/GetOrganica3ChildrenQuery.js';
import { handleOrganicaCascadeError } from './infrastructure/errorHandler.js';

export default async function organicaCascadeRoutes(app: FastifyInstance) {
  // GET /v1/organica-cascade/org1?claveOrganica0={clave}
  app.get(
    '/organica-cascade/org1',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            claveOrganica0: { type: 'string' }
          },
          required: ['claveOrganica0']
        },
        tags: ['Organica Cascade'],
        security: [{ bearerAuth: [] }],
        description: 'Get Organica1 children for a given Organica0',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claveOrganica0: { type: 'string' },
                claveOrganica1: { type: 'string' },
                descripcion: { type: 'string' },
                titular: { type: 'string' },
                estatus: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { claveOrganica0 } = request.query as { claveOrganica0: string };
        const getOrganica1ChildrenQuery = request.diScope.resolve<GetOrganica1ChildrenQuery>('getOrganica1ChildrenQuery');
        const result = await getOrganica1ChildrenQuery.execute(claveOrganica0, request.user?.sub?.toString());
        return reply.send(result);
      } catch (error: any) {
        return handleOrganicaCascadeError(error, reply);
      }
    }
  );

  // GET /v1/organica-cascade/org2?claveOrganica0={clave0}&claveOrganica1={clave1}
  app.get(
    '/organica-cascade/org2',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            claveOrganica0: { type: 'string' },
            claveOrganica1: { type: 'string' }
          },
          required: ['claveOrganica0', 'claveOrganica1']
        },
        tags: ['Organica Cascade'],
        security: [{ bearerAuth: [] }],
        description: 'Get Organica2 children for a given Organica1',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claveOrganica0: { type: 'string' },
                claveOrganica1: { type: 'string' },
                claveOrganica2: { type: 'string' },
                descripcion: { type: 'string' },
                titular: { type: 'string' },
                estatus: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { claveOrganica0, claveOrganica1 } = request.query as {
          claveOrganica0: string;
          claveOrganica1: string;
        };
        const getOrganica2ChildrenQuery = request.diScope.resolve<GetOrganica2ChildrenQuery>('getOrganica2ChildrenQuery');
        const result = await getOrganica2ChildrenQuery.execute(claveOrganica0, claveOrganica1, request.user?.sub?.toString());
        return reply.send(result);
      } catch (error: any) {
        return handleOrganicaCascadeError(error, reply);
      }
    }
  );

  // GET /v1/organica-cascade/org3?claveOrganica0={clave0}&claveOrganica1={clave1}&claveOrganica2={clave2}
  app.get(
    '/organica-cascade/org3',
    {
      preHandler: [requireAuth],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            claveOrganica0: { type: 'string' },
            claveOrganica1: { type: 'string' },
            claveOrganica2: { type: 'string' }
          },
          required: ['claveOrganica0', 'claveOrganica1', 'claveOrganica2']
        },
        tags: ['Organica Cascade'],
        security: [{ bearerAuth: [] }],
        description: 'Get Organica3 children for a given Organica2',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                claveOrganica0: { type: 'string' },
                claveOrganica1: { type: 'string' },
                claveOrganica2: { type: 'string' },
                claveOrganica3: { type: 'string' },
                descripcion: { type: 'string' },
                titular: { type: 'string' },
                estatus: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { claveOrganica0, claveOrganica1, claveOrganica2 } = request.query as {
          claveOrganica0: string;
          claveOrganica1: string;
          claveOrganica2: string;
        };
        const getOrganica3ChildrenQuery = request.diScope.resolve<GetOrganica3ChildrenQuery>('getOrganica3ChildrenQuery');
        const result = await getOrganica3ChildrenQuery.execute(claveOrganica0, claveOrganica1, claveOrganica2, request.user?.sub?.toString());
        return reply.send(result);
      } catch (error: any) {
        return handleOrganicaCascadeError(error, reply);
      }
    }
  );
}
