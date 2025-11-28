import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../../auth/auth.middleware.js';
import { CreateDependenciaSchema, UpdateDependenciaSchema, DependenciaIdParamSchema } from './dependencia.schemas.js';
import { DependenciaService } from './dependencia.service.js';
import { ok, validationError, notFound, internalError } from '../../../utils/http.js';
import { withDbContext } from '../../../db/context.js';

export default async function dependenciaRoutes(app: FastifyInstance) {

  // Listar todas las dependencias (requiere auth)
  app.get('/dependencias', {
    preHandler: [requireAuth],
    schema: {
      description: 'List all dependencies',
      tags: ['dependencias'],
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
      const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
      const dependencias = await dependenciaService.getAllDependencias();
      return reply.send(ok(dependencias));
    } catch (error: any) {
      console.error('Error listing dependencias:', error);
      return reply.code(500).send(internalError('Failed to retrieve dependencias'));
    }
  });

  // Listar dependencias por tipo (requiere auth)
  app.get('/dependencias/tipo/:tipoDependencia', {
    preHandler: [requireAuth],
    schema: {
      description: 'List dependencies by type',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          tipoDependencia: {
            type: 'string',
            enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA']
          }
        },
        required: ['tipoDependencia']
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
    const { tipoDependencia } = req.params as { tipoDependencia: string };

    try {
      const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
      const dependencias = await dependenciaService.getDependenciasByTipo(tipoDependencia);
      return reply.send(ok(dependencias));
    } catch (error: any) {
      console.error('Error listing dependencias by tipo:', error);
      return reply.code(500).send(internalError('Failed to retrieve dependencias'));
    }
  });

  // Listar dependencias hijas (requiere auth)
  app.get('/dependencias/:dependenciaId/hijas', {
    preHandler: [requireAuth],
    schema: {
      description: 'List child dependencies',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  tipoDependencia: { type: 'string' },
                  idDependenciaPadre: { type: 'number' },
                  claveDependencia: { type: 'string' },
                  responsable: { type: 'string' },
                  telefono: { type: 'string' },
                  email: { type: 'string' },
                  esActiva: { type: 'boolean' },
                  dependenciaPadre: {
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
      const dependencias = await dependenciaService.getDependenciasHijas(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencias));
    } catch (error: any) {
      console.error('Error listing dependencias hijas:', error);
      return reply.code(500).send(internalError('Failed to retrieve dependencias'));
    }
  });

  // Obtener dependencia por ID (requiere auth)
  app.get('/dependencias/:dependenciaId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dependency by ID',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                tipoDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                claveDependencia: { type: 'string' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' },
                dependenciaPadre: {
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
      const dependencia = await dependenciaService.getDependenciaById(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencia));
    } catch (error: any) {
      if (error.message === 'DEPENDENCIA_NOT_FOUND') {
        return reply.code(404).send(notFound('Dependencia', dependenciaId));
      }
      console.error('Error getting dependencia:', error);
      return reply.code(500).send(internalError('Failed to retrieve dependencia'));
    }
  });

  // Obtener dependencia con hijas (requiere auth)
  app.get('/dependencias/:dependenciaId/completa', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get dependency with child dependencies',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
                tipoDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                claveDependencia: { type: 'string' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' },
                dependenciaPadre: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    nombre: { type: 'string' }
                  }
                },
                dependenciasHijas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      nombre: { type: 'string' },
                      descripcion: { type: 'string' },
                      tipoDependencia: { type: 'string' },
                      claveDependencia: { type: 'string' },
                      responsable: { type: 'string' },
                      telefono: { type: 'string' },
                      email: { type: 'string' },
                      esActiva: { type: 'boolean' }
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
    const { dependenciaId } = req.params as { dependenciaId: string };

    // Validate parameter
    const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
      const dependencia = await dependenciaService.getDependenciaWithHijas(paramValidation.data.dependenciaId);
      return reply.send(ok(dependencia));
    } catch (error: any) {
      if (error.message === 'DEPENDENCIA_NOT_FOUND') {
        return reply.code(404).send(notFound('Dependencia', dependenciaId));
      }
      console.error('Error getting dependencia completa:', error);
      return reply.code(500).send(internalError('Failed to retrieve dependencia'));
    }
  });

  // Crear dependencia (requiere admin)
  app.post('/dependencias', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Create a new dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nombre', 'descripcion', 'tipoDependencia', 'claveDependencia'],
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDependencia: { type: 'string', enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'] },
          idDependenciaPadre: { type: 'number', minimum: 1 },
          claveDependencia: { type: 'string', minLength: 1, maxLength: 20 },
          responsable: { type: 'string', maxLength: 200 },
          telefono: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          esActiva: { type: 'boolean' }
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
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDependencia: { type: 'string' },
                claveDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' }
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
      const parsed = CreateDependenciaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
        const dependencia = await dependenciaService.createDependenciaItem(
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoDependencia,
          parsed.data.claveDependencia,
          parsed.data.idDependenciaPadre,
          parsed.data.responsable,
          parsed.data.telefono,
          parsed.data.email,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.code(201).send(ok(dependencia));
      } catch (error: any) {
        if (error.message === 'DEPENDENCIA_PADRE_NOT_FOUND') {
          return reply.code(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'Dependencia padre not found' } });
        }
        console.error('Error creating dependencia:', error);
        return reply.code(500).send(internalError('Failed to create dependencia'));
      }
    });
  });

  // Actualizar dependencia (requiere admin)
  app.put('/dependencias/:dependenciaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Update dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
      },
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string', minLength: 1, maxLength: 200 },
          descripcion: { type: 'string', minLength: 1, maxLength: 1000 },
          tipoDependencia: { type: 'string', enum: ['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'] },
          idDependenciaPadre: { type: 'number', minimum: 1 },
          claveDependencia: { type: 'string', minLength: 1, maxLength: 20 },
          responsable: { type: 'string', maxLength: 200 },
          telefono: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          esActiva: { type: 'boolean' }
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
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                tipoDependencia: { type: 'string' },
                claveDependencia: { type: 'string' },
                idDependenciaPadre: { type: 'number' },
                responsable: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' },
                esActiva: { type: 'boolean' }
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
      const { dependenciaId } = req.params as { dependenciaId: string };

      // Validate parameter
      const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      const parsed = UpdateDependenciaSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send(validationError(parsed.error.issues));
      }

      try {
        const userId = req.user?.sub;
        const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
        const dependencia = await dependenciaService.updateDependenciaItem(
          paramValidation.data.dependenciaId,
          parsed.data.nombre,
          parsed.data.descripcion,
          parsed.data.tipoDependencia,
          parsed.data.claveDependencia,
          parsed.data.idDependenciaPadre,
          parsed.data.responsable,
          parsed.data.telefono,
          parsed.data.email,
          parsed.data.esActiva,
          userId,
          tx
        );
        return reply.send(ok(dependencia));
      } catch (error: any) {
        if (error.message === 'DEPENDENCIA_NOT_FOUND') {
          return reply.code(404).send(notFound('Dependencia', dependenciaId));
        }
        console.error('Error updating dependencia:', error);
        return reply.code(500).send(internalError('Failed to update dependencia'));
      }
    });
  });

  // Eliminar dependencia (requiere admin)
  app.delete('/dependencias/:dependenciaId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Delete dependency',
      tags: ['dependencias'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dependenciaId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['dependenciaId']
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
      const { dependenciaId } = req.params as { dependenciaId: string };

      // Validate parameter
      const paramValidation = DependenciaIdParamSchema.safeParse({ dependenciaId });
      if (!paramValidation.success) {
        return reply.code(400).send(validationError(paramValidation.error.issues));
      }

      try {
        const dependenciaService = req.diScope.resolve<DependenciaService>('dependenciaService');
        const deletedId = await dependenciaService.deleteDependenciaItem(paramValidation.data.dependenciaId, tx);
        return reply.send(ok({ id: deletedId }));
      } catch (error: any) {
        if (error.message === 'DEPENDENCIA_NOT_FOUND') {
          return reply.code(404).send(notFound('Dependencia', dependenciaId));
        }
        console.error('Error deleting dependencia:', error);
        return reply.code(500).send(internalError('Failed to delete dependencia'));
      }
    });
  });
}