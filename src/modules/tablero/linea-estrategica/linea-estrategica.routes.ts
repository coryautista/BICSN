import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateLineaEstrategicaSchema, UpdateLineaEstrategicaSchema, LineaEstrategicaIdParamSchema, EjeIdParamSchema } from './linea-estrategica.schemas.js';
import { LineaEstrategicaService } from './linea-estrategica.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

export default async function lineaEstrategicaRoutes(app: FastifyInstance) {

  // Listar todas las líneas estratégicas (requiere auth)
  app.get('/lineas-estrategicas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all strategic lines',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idEje: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    try {
      const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
      const lineasEstrategicas = await lineaEstrategicaService.getAllLineasEstrategicas();
      return reply.send(ok(lineasEstrategicas));
    } catch (error: any) {
      console.error('Error listing lineas estrategicas:', error);
      return reply.code(500).send(internalError('Failed to retrieve lineas estrategicas'));
    }
  });

  // Listar líneas estratégicas por eje (requiere auth)
  app.get('/ejes/:ejeId/lineas-estrategicas-list', {
    preHandler: [requireAuth],
    schema: {
      description: 'List strategic lines by strategic axis',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          ejeId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['ejeId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idEje: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    const { ejeId } = req.params as { ejeId: string };

    // Validate parameter
    const paramValidation = EjeIdParamSchema.safeParse({ ejeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
      const lineasEstrategicas = await lineaEstrategicaService.getLineasEstrategicasByEje(paramValidation.data.ejeId);
      return reply.send(ok(lineasEstrategicas));
    } catch (error: any) {
      console.error('Error listing lineas estrategicas by eje:', error);
      return reply.code(500).send(internalError('Failed to retrieve lineas estrategicas'));
    }
  });

  // Obtener línea estratégica por ID (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic line by ID',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                eje: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: {
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
        },
        404: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
      const lineaEstrategica = await lineaEstrategicaService.getLineaEstrategicaById(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(lineaEstrategica));
    } catch (error: any) {
      if (error.message === 'LINEA_ESTRATEGICA_NOT_FOUND') {
        return reply.code(404).send(notFound('Linea estrategica', lineaEstrategicaId));
      }
      console.error('Error getting linea estrategica:', error);
      return reply.code(500).send(internalError('Failed to retrieve linea estrategica'));
    }
  });

  // Obtener línea estratégica con programas (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId/programas-list', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get strategic line with programs',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                idEje: { type: 'number' },
                eje: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                },
                programas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
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
        },
        404: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
      const lineaEstrategica = await lineaEstrategicaService.getLineaEstrategicaWithProgramas(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(lineaEstrategica));
    } catch (error: any) {
      if (error.message === 'LINEA_ESTRATEGICA_NOT_FOUND') {
        return reply.code(404).send(notFound('Linea estrategica', lineaEstrategicaId));
      }
      console.error('Error getting linea estrategica with programas:', error);
      return reply.code(500).send(internalError('Failed to retrieve linea estrategica with programas'));
    }
  });

  // Crear línea estratégica (requiere admin)
  app.post('/lineas-estrategicas', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new strategic line',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['idEje', 'nombre', 'descripcion'],
        properties: {
          idEje: { type: 'number', minimum: 1 },
          nombre: { type: 'string', minLength: 1, maxLength: 500 },
          descripcion: { type: 'string', minLength: 1, maxLength: 5000 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' }
              }
            }
          }
        },
        400: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    return withDbContext(req, async (tx) => {
      const parsed = CreateLineaEstrategicaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
        const lineaEstrategica = await lineaEstrategicaService.createLineaEstrategicaItem(
          parsed.data.idEje,
          parsed.data.nombre,
          parsed.data.descripcion,
          userId,
          tx
        );
        return reply.code(201).send(ok(lineaEstrategica));
      } catch (error: any) {
        if (error.message === 'EJE_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Eje not found' } });
        }
        console.error('Error creating linea estrategica:', error);
        return reply.code(500).send(internalError('Failed to create linea estrategica'));
      }
    });
  });

  // Actualizar línea estratégica (requiere admin)
  app.put('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update strategic line',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 500 },
          descripcion: { type: 'string', minLength: 1, maxLength: 5000 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                idEje: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' }
              }
            }
          }
        },
        400: {
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
        },
        404: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    return withDbContext(req, async (tx) => {
      const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

      // Validate parameter
      const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateLineaEstrategicaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
        const lineaEstrategica = await lineaEstrategicaService.updateLineaEstrategicaItem(
          paramValidation.data.lineaEstrategicaId,
          parsed.data.nombre,
          parsed.data.descripcion,
          userId,
          tx
        );
        return reply.send(ok(lineaEstrategica));
      } catch (error: any) {
        if (error.message === 'LINEA_ESTRATEGICA_NOT_FOUND') {
          return reply.code(404).send(notFound('Linea estrategica', lineaEstrategicaId));
        }
        console.error('Error updating linea estrategica:', error);
        return reply.code(500).send(internalError('Failed to update linea estrategica'));
      }
    });
  });

  // Eliminar línea estratégica (requiere admin)
  app.delete('/lineas-estrategicas/:lineaEstrategicaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete strategic line',
      tags: ['lineas-estrategicas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          lineaEstrategicaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['lineaEstrategicaId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' }
              }
            }
          }
        },
        400: {
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
        },
        404: {
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
        },
        500: {
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
        }
      }
    }
  }, async (req, reply) => {
    return withDbContext(req, async (tx) => {
      const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

      // Validate parameter
      const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const lineaEstrategicaService = req.diScope.resolve<LineaEstrategicaService>('lineaEstrategicaService');
        const deletedId = await lineaEstrategicaService.deleteLineaEstrategicaItem(paramValidation.data.lineaEstrategicaId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'LINEA_ESTRATEGICA_NOT_FOUND') {
          return reply.code(404).send(notFound('Linea estrategica', lineaEstrategicaId));
        }
        console.error('Error deleting linea estrategica:', error);
        return reply.code(500).send(internalError('Failed to delete linea estrategica'));
      }
    });
  });
}