import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateProgramaSchema, UpdateProgramaSchema, ProgramaIdParamSchema, EjeIdParamSchema, LineaEstrategicaIdParamSchema } from './programa.schemas.js';
import { ProgramaService } from './programa.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

export default async function programaRoutes(app: FastifyInstance) {

  // Listar todos los programas (requiere auth)
  app.get('/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all programs',
      tags: ['programas'],
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
                  idLineaEstrategica: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  eje: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' }
                    }
                  },
                  lineaEstrategica: {
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
      const programaService = req.diScope.resolve<ProgramaService>('programaService');
      const programas = await programaService.getAllProgramas();
      return reply.send(ok(programas));
    } catch (error: any) {
      console.error('Error listing programas:', error);
      return reply.code(500).send(internalError('Failed to retrieve programas'));
    }
  });

  // Listar programas por eje (requiere auth)
  app.get('/ejes/:ejeId/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List programs by strategic axis',
      tags: ['programas'],
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
                  idLineaEstrategica: { type: 'number' },
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  lineaEstrategica: {
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
      const programaService = req.diScope.resolve<ProgramaService>('programaService');
      const programas = await programaService.getProgramasByEje(paramValidation.data.ejeId);
      return reply.send(ok(programas));
    } catch (error: any) {
      console.error('Error listing programas by eje:', error);
      return reply.code(500).send(internalError('Failed to retrieve programas'));
    }
  });

  // Listar programas por línea estratégica (requiere auth)
  app.get('/lineas-estrategicas/:lineaEstrategicaId/programas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List programs by strategic line',
      tags: ['programas'],
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
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  idEje: { type: 'number' },
                  idLineaEstrategica: { type: 'number' },
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
    const { lineaEstrategicaId } = req.params as { lineaEstrategicaId: string };

    // Validate parameter
    const paramValidation = LineaEstrategicaIdParamSchema.safeParse({ lineaEstrategicaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const programaService = req.diScope.resolve<ProgramaService>('programaService');
      const programas = await programaService.getProgramasByLineaEstrategica(paramValidation.data.lineaEstrategicaId);
      return reply.send(ok(programas));
    } catch (error: any) {
      console.error('Error listing programas by linea estrategica:', error);
      return reply.code(500).send(internalError('Failed to retrieve programas'));
    }
  });

  // Obtener programa por ID (requiere auth)
  app.get('/programas/:programaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get program by ID',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          programaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['programaId']
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
                idLineaEstrategica: { type: 'number' },
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                eje: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                },
                lineaEstrategica: {
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
    const { programaId } = req.params as { programaId: string };

    // Validate parameter
    const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const programaService = req.diScope.resolve<ProgramaService>('programaService');
      const programa = await programaService.getProgramaById(paramValidation.data.programaId);
      return reply.send(ok(programa));
    } catch (error: any) {
      if (error.message === 'PROGRAMA_NOT_FOUND') {
        return reply.code(404).send(notFound('Programa', programaId));
      }
      console.error('Error getting programa:', error);
      return reply.code(500).send(internalError('Failed to retrieve programa'));
    }
  });

  // Crear programa (requiere admin)
  app.post('/programas', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new program',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['idEje', 'idLineaEstrategica', 'nombre', 'descripcion'],
        properties: {
          idEje: { type: 'number', minimum: 1 },
          idLineaEstrategica: { type: 'number', minimum: 1 },
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
                idLineaEstrategica: { type: 'number' },
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
      const parsed = CreateProgramaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const programaService = req.diScope.resolve<ProgramaService>('programaService');
        const programa = await programaService.createProgramaItem(
          parsed.data.idEje,
          parsed.data.idLineaEstrategica,
          parsed.data.nombre,
          parsed.data.descripcion,
          userId,
          tx
        );
        return reply.code(201).send(ok(programa));
      } catch (error: any) {
        if (error.message === 'EJE_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Eje not found' } });
        }
        if (error.message === 'LINEA_ESTRATEGICA_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Linea estrategica not found' } });
        }
        console.error('Error creating programa:', error);
        return reply.code(500).send(internalError('Failed to create programa'));
      }
    });
  });

  // Actualizar programa (requiere admin)
  app.put('/programas/:programaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update program',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          programaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['programaId']
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
                idLineaEstrategica: { type: 'number' },
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
      const { programaId } = req.params as { programaId: string };

      // Validate parameter
      const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateProgramaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const programaService = req.diScope.resolve<ProgramaService>('programaService');
        const programa = await programaService.updateProgramaItem(
          paramValidation.data.programaId,
          parsed.data.nombre,
          parsed.data.descripcion,
          userId,
          tx
        );
        return reply.send(ok(programa));
      } catch (error: any) {
        if (error.message === 'PROGRAMA_NOT_FOUND') {
          return reply.code(404).send(notFound('Programa', programaId));
        }
        console.error('Error updating programa:', error);
        return reply.code(500).send(internalError('Failed to update programa'));
      }
    });
  });

  // Eliminar programa (requiere admin)
  app.delete('/programas/:programaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete program',
      tags: ['programas'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          programaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['programaId']
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
      const { programaId } = req.params as { programaId: string };

      // Validate parameter
      const paramValidation = ProgramaIdParamSchema.safeParse({ programaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const programaService = req.diScope.resolve<ProgramaService>('programaService');
        const deletedId = await programaService.deleteProgramaItem(paramValidation.data.programaId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'PROGRAMA_NOT_FOUND') {
          return reply.code(404).send(notFound('Programa', programaId));
        }
        console.error('Error deleting programa:', error);
        return reply.code(500).send(internalError('Failed to delete programa'));
      }
    });
  });
}