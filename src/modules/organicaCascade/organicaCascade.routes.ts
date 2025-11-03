import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import * as service from './organicaCascade.service.js';

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
      const { claveOrganica0 } = request.query as { claveOrganica0: string };
      const result = await service.getOrganica1Children(claveOrganica0);
      return reply.send(result);
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
      const { claveOrganica0, claveOrganica1 } = request.query as {
        claveOrganica0: string;
        claveOrganica1: string;
      };
      const result = await service.getOrganica2Children(claveOrganica0, claveOrganica1);
      return reply.send(result);
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
      const { claveOrganica0, claveOrganica1, claveOrganica2 } = request.query as {
        claveOrganica0: string;
        claveOrganica1: string;
        claveOrganica2: string;
      };
      const result = await service.getOrganica3Children(claveOrganica0, claveOrganica1, claveOrganica2);
      return reply.send(result);
    }
  );
}
