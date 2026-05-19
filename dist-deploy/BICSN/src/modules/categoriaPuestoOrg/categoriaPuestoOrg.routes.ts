import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import {
  CreateCategoriaPuestoOrgSchema,
  UpdateCategoriaPuestoOrgSchema,
  CategoriaPuestoOrgIdParamSchema
} from './categoriaPuestoOrg.schemas.js';
import { ok, validationError } from '../../utils/http.js';
import { handleCategoriaPuestoOrgError } from './infrastructure/errorHandler.js';
import type { GetAllCategoriaPuestoOrgQuery } from './application/queries/GetAllCategoriaPuestoOrgQuery.js';
import type { GetCategoriaPuestoOrgByIdQuery } from './application/queries/GetCategoriaPuestoOrgByIdQuery.js';
import type { CreateCategoriaPuestoOrgCommand } from './application/commands/CreateCategoriaPuestoOrgCommand.js';
import type { UpdateCategoriaPuestoOrgCommand } from './application/commands/UpdateCategoriaPuestoOrgCommand.js';
import type { DeleteCategoriaPuestoOrgCommand } from './application/commands/DeleteCategoriaPuestoOrgCommand.js';

export default async function categoriaPuestoOrgRoutes(app: FastifyInstance) {

  // Listar todas las categorías de puesto org (requiere auth)
  app.get('/categoria-puesto-org', {
    preHandler: [requireAuth],
    schema: {
      description: 'Lista todas las categorías de puesto orgánico con filtros opcionales',
      summary: 'Listar categorías de puesto orgánico',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          nivel: { 
            type: 'string', 
            description: 'Nivel organizacional (0-3)'
          },
          org0: { 
            type: 'string', 
            description: 'Código organizacional nivel 0 (2 caracteres)'
          },
          org1: { 
            type: 'string', 
            description: 'Código organizacional nivel 1 (2 caracteres)'
          },
          org2: { 
            type: 'string', 
            description: 'Código organizacional nivel 2 (2 caracteres)'
          },
          org3: { 
            type: 'string', 
            description: 'Código organizacional nivel 3 (2 caracteres)'
          },
          vigenciaInicio: { 
            type: 'string', 
            description: 'Fecha de inicio de vigencia (formato YYYY-MM-DD)'
          },
          categoria: { 
            type: 'string', 
            description: 'Nombre de la categoría para filtrar'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Lista de categorías de puesto orgánico',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  categoriaPuestoOrgId: { type: 'number', description: 'ID único de la categoría', example: 1 },
                  nivel: { type: 'number', description: 'Nivel organizacional (0-3)', example: 2 },
                  org0: { type: 'string', description: 'Código organizacional nivel 0', example: '04' },
                  org1: { type: 'string', description: 'Código organizacional nivel 1', example: '44' },
                  org2: { type: 'string', nullable: true, description: 'Código organizacional nivel 2', example: '01' },
                  org3: { type: 'string', nullable: true, description: 'Código organizacional nivel 3', example: null },
                  categoria: { type: 'string', description: 'Nombre de la categoría', example: 'INSTITUTO AGUASCALENTENSE DE LAS MES' },
                  nombreCategoria: { type: 'string', description: 'Nombre descriptivo de la categoría', example: 'ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL' },
                  ingresoBrutoMensual: { type: 'number', description: 'Ingreso bruto mensual', example: 14462 },
                  vigenciaInicio: { type: 'string', description: 'Fecha de inicio de vigencia', example: '2025-11-18' },
                  vigenciaFin: { type: 'string', nullable: true, description: 'Fecha de fin de vigencia', example: '2030-11-18' },
                  baseConfianza: { type: 'string', nullable: true, description: 'Base de confianza (1 carácter alfanumérico). Opcional', example: null },
                  porcentaje: { type: 'number', nullable: true, description: 'Porcentaje (0-100). Opcional', example: null }
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
      const query = req.query as any;
      const filters = {
        nivel: query.nivel ? parseInt(query.nivel) : undefined,
        org0: query.org0,
        org1: query.org1,
        org2: query.org2,
        org3: query.org3,
        vigenciaInicio: query.vigenciaInicio,
        categoria: query.categoria
      };
      const getAllCategoriaPuestoOrgQuery = req.diScope.resolve<GetAllCategoriaPuestoOrgQuery>('getAllCategoriaPuestoOrgQuery');
      const categorias = await getAllCategoriaPuestoOrgQuery.execute(filters);
      return reply.send(ok(categorias));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });

  // Obtener categorías de puesto org del usuario autenticado (requiere auth)
  app.get('/categoria-puesto-org/me', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene las categorías de puesto orgánico del usuario autenticado basándose en org0 y org1 del token',
      summary: 'Obtener categorías del usuario',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          description: 'Lista de categorías de puesto orgánico del usuario',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  categoriaPuestoOrgId: { type: 'number', description: 'ID único de la categoría', example: 1 },
                  nivel: { type: 'number', description: 'Nivel organizacional (0-3)', example: 2 },
                  org0: { type: 'string', description: 'Código organizacional nivel 0', example: '04' },
                  org1: { type: 'string', description: 'Código organizacional nivel 1', example: '44' },
                  org2: { type: 'string', nullable: true, description: 'Código organizacional nivel 2', example: '01' },
                  org3: { type: 'string', nullable: true, description: 'Código organizacional nivel 3', example: null },
                  categoria: { type: 'string', description: 'Nombre de la categoría', example: 'INSTITUTO AGUASCALENTENSE DE LAS MES' },
                  nombreCategoria: { type: 'string', description: 'Nombre descriptivo de la categoría', example: 'ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL' },
                  ingresoBrutoMensual: { type: 'number', description: 'Ingreso bruto mensual', example: 14462 },
                  vigenciaInicio: { type: 'string', description: 'Fecha de inicio de vigencia', example: '2025-11-18' },
                  vigenciaFin: { type: 'string', nullable: true, description: 'Fecha de fin de vigencia', example: '2030-11-18' },
                  baseConfianza: { type: 'string', nullable: true, description: 'Base de confianza (1 carácter alfanumérico). Opcional', example: null },
                  porcentaje: { type: 'number', nullable: true, description: 'Porcentaje (0-100). Opcional', example: null }
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
    try {
      const user = (req as any).user;
      
      // Extract organica0 and organica1 from JWT token
      const idOrg0 = user?.idOrganica0;
      const idOrg1 = user?.idOrganica1;
      
      // Format orgánicas to 2-character strings
      const claveOrganica0 = idOrg0 ? (typeof idOrg0 === 'string' ? idOrg0.padStart(2, '0') : idOrg0.toString().padStart(2, '0')) : null;
      const claveOrganica1 = idOrg1 ? (typeof idOrg1 === 'string' ? idOrg1.padStart(2, '0') : idOrg1.toString().padStart(2, '0')) : null;

      if (!claveOrganica0 || !claveOrganica1) {
        return reply.code(400).send({
          ok: false,
          error: {
            code: 'MISSING_ORGANICA_KEYS',
            message: 'Las claves orgánicas (org0 y org1) son requeridas en el token del usuario.'
          }
        });
      }

      // Filter by user's orgánicas
      const filters = {
        org0: claveOrganica0,
        org1: claveOrganica1
      };

      const getAllCategoriaPuestoOrgQuery = req.diScope.resolve<GetAllCategoriaPuestoOrgQuery>('getAllCategoriaPuestoOrgQuery');
      const categorias = await getAllCategoriaPuestoOrgQuery.execute(filters);
      return reply.send(ok(categorias));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });

  // Obtener categoría de puesto org por ID (requiere auth)
  app.get('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtiene una categoría de puesto orgánico por su ID',
      summary: 'Obtener categoría por ID',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { 
            type: 'number', 
            minimum: 1,
            description: 'ID de la categoría de puesto orgánico'
          }
        },
        required: ['categoriaPuestoOrgId']
      },
      response: {
        200: {
          type: 'object',
          description: 'Categoría de puesto orgánico encontrada',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number', description: 'ID único de la categoría', example: 1 },
                nivel: { type: 'number', description: 'Nivel organizacional (0-3)', example: 2 },
                org0: { type: 'string', description: 'Código organizacional nivel 0', example: '04' },
                org1: { type: 'string', description: 'Código organizacional nivel 1', example: '44' },
                org2: { type: 'string', nullable: true, description: 'Código organizacional nivel 2', example: '01' },
                org3: { type: 'string', nullable: true, description: 'Código organizacional nivel 3', example: null },
                categoria: { type: 'string', description: 'Nombre de la categoría', example: 'INSTITUTO AGUASCALENTENSE DE LAS MES' },
                nombreCategoria: { type: 'string', description: 'Nombre descriptivo de la categoría', example: 'ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL' },
                ingresoBrutoMensual: { type: 'number', description: 'Ingreso bruto mensual', example: 14462 },
                vigenciaInicio: { type: 'string', description: 'Fecha de inicio de vigencia', example: '2025-11-18' },
                vigenciaFin: { type: 'string', nullable: true, description: 'Fecha de fin de vigencia', example: '2030-11-18' },
                baseConfianza: { type: 'string', nullable: true, description: 'Base de confianza (1 carácter alfanumérico). Opcional', example: null },
                porcentaje: { type: 'number', nullable: true, description: 'Porcentaje (0-100). Opcional', example: null }
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const getCategoriaPuestoOrgByIdQuery = req.diScope.resolve<GetCategoriaPuestoOrgByIdQuery>('getCategoriaPuestoOrgByIdQuery');
      const categoria = await getCategoriaPuestoOrgByIdQuery.execute(categoriaPuestoOrgId);
      return reply.send(ok(categoria));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });

  // Crear categoría de puesto org (requiere admin)
  app.post('/categoria-puesto-org', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Crea una nueva categoría de puesto orgánico. Requiere rol de administrador.',
      summary: 'Crear categoría de puesto orgánico',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['nivel', 'org0', 'org1', 'categoria', 'nombreCategoria', 'ingresoBrutoMensual', 'vigenciaInicio'],
        properties: {
          nivel: { 
            type: 'number', 
            minimum: 0, 
            maximum: 3,
            description: 'Nivel organizacional. 0-1: no requiere org2/org3, 2: requiere org2, 3: requiere org2 y org3'
          },
          org0: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 2,
            description: 'Código organizacional nivel 0 (2 caracteres alfanuméricos)'
          },
          org1: { 
            type: 'string', 
            minLength: 2, 
            maxLength: 2,
            description: 'Código organizacional nivel 1 (2 caracteres alfanuméricos)'
          },
          org2: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            nullable: true,
            description: 'Código organizacional nivel 2 (2 caracteres alfanuméricos). Requerido si nivel >= 2'
          },
          org3: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            nullable: true,
            description: 'Código organizacional nivel 3 (2 caracteres alfanuméricos). Requerido si nivel = 3'
          },
          categoria: { 
            type: 'string', 
            maxLength: 200,
            description: 'Nombre de la categoría (máximo 200 caracteres)'
          },
          nombreCategoria: { 
            type: 'string', 
            maxLength: 200,
            description: 'Nombre descriptivo de la categoría (máximo 200 caracteres)'
          },
          ingresoBrutoMensual: { 
            type: 'number', 
            minimum: 0,
            description: 'Ingreso bruto mensual (debe ser mayor a 0)'
          },
          vigenciaInicio: { 
            type: 'string', 
            format: 'date',
            description: 'Fecha de inicio de vigencia (formato YYYY-MM-DD)'
          },
          vigenciaFin: { 
            type: 'string', 
            format: 'date',
            nullable: true,
            description: 'Fecha de fin de vigencia (formato YYYY-MM-DD). Opcional'
          },
          baseConfianza: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
            nullable: true,
            description: 'Base de confianza (1 carácter). Opcional'
          },
          porcentaje: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            nullable: true,
            description: 'Porcentaje (0-100). Opcional'
          }
        }
      },
      response: {
        201: {
          type: 'object',
          description: 'Categoría de puesto orgánico creada exitosamente',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number', description: 'ID único de la categoría creada', example: 1 },
                nivel: { type: 'number', description: 'Nivel organizacional', example: 2 },
                org0: { type: 'string', description: 'Código organizacional nivel 0', example: '04' },
                org1: { type: 'string', description: 'Código organizacional nivel 1', example: '44' },
                org2: { type: 'string', nullable: true, description: 'Código organizacional nivel 2', example: '01' },
                org3: { type: 'string', nullable: true, description: 'Código organizacional nivel 3', example: null },
                categoria: { type: 'string', description: 'Nombre de la categoría', example: 'INSTITUTO AGUASCALENTENSE DE LAS MES' },
                nombreCategoria: { type: 'string', description: 'Nombre descriptivo de la categoría', example: 'ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL' },
                ingresoBrutoMensual: { type: 'number', description: 'Ingreso bruto mensual', example: 14462 },
                vigenciaInicio: { type: 'string', description: 'Fecha de inicio de vigencia', example: '2025-11-18' },
                vigenciaFin: { type: 'string', nullable: true, description: 'Fecha de fin de vigencia', example: '2030-11-18' },
                  baseConfianza: { type: 'string', nullable: true, description: 'Base de confianza (1 carácter alfanumérico). Opcional', example: null },
                  porcentaje: { type: 'number', nullable: true, description: 'Porcentaje (0-100). Opcional', example: null }
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
        409: {
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
    const parsed = CreateCategoriaPuestoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const createCategoriaPuestoOrgCommand = req.diScope.resolve<CreateCategoriaPuestoOrgCommand>('createCategoriaPuestoOrgCommand');
      const categoria = await createCategoriaPuestoOrgCommand.execute({
        ...parsed.data,
        userId
      });
      return reply.code(201).send(ok(categoria));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });

  // Actualizar categoría de puesto org (requiere admin)
  app.put('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Actualiza una categoría de puesto orgánico existente. Requiere rol de administrador. Todos los campos son opcionales, pero debe proporcionar al menos uno.',
      summary: 'Actualizar categoría de puesto orgánico',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { 
            type: 'number', 
            minimum: 1,
            description: 'ID de la categoría de puesto orgánico a actualizar'
          }
        },
        required: ['categoriaPuestoOrgId']
      },
      body: {
        type: 'object',
        description: 'Campos a actualizar (todos opcionales, pero al menos uno es requerido)',
        properties: {
          nombreCategoria: { 
            type: 'string', 
            maxLength: 200,
            description: 'Nombre descriptivo de la categoría (máximo 200 caracteres)'
          },
          ingresoBrutoMensual: { 
            type: 'number', 
            minimum: 0,
            description: 'Ingreso bruto mensual (debe ser mayor a 0)'
          },
          vigenciaFin: { 
            type: 'string', 
            format: 'date',
            nullable: true,
            description: 'Fecha de fin de vigencia (formato YYYY-MM-DD)'
          },
          baseConfianza: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
            nullable: true,
            description: 'Base de confianza (1 carácter alfanumérico). Opcional'
          },
          porcentaje: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            nullable: true,
            description: 'Porcentaje (0-100). Opcional'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          description: 'Categoría de puesto orgánico actualizada exitosamente',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { type: 'number', description: 'ID único de la categoría', example: 1 },
                nivel: { type: 'number', description: 'Nivel organizacional', example: 2 },
                org0: { type: 'string', description: 'Código organizacional nivel 0', example: '04' },
                org1: { type: 'string', description: 'Código organizacional nivel 1', example: '44' },
                org2: { type: 'string', nullable: true, description: 'Código organizacional nivel 2', example: '01' },
                org3: { type: 'string', nullable: true, description: 'Código organizacional nivel 3', example: null },
                categoria: { type: 'string', description: 'Nombre de la categoría', example: 'INSTITUTO AGUASCALENTENSE DE LAS MES' },
                nombreCategoria: { type: 'string', description: 'Nombre descriptivo de la categoría', example: 'ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL' },
                ingresoBrutoMensual: { type: 'number', description: 'Ingreso bruto mensual', example: 15000 },
                vigenciaInicio: { type: 'string', description: 'Fecha de inicio de vigencia', example: '2025-11-18' },
                vigenciaFin: { type: 'string', nullable: true, description: 'Fecha de fin de vigencia', example: '2035-11-18' },
                baseConfianza: { type: 'string', nullable: true, description: 'Base de confianza (1 carácter alfanumérico). Opcional', example: 'A' },
                porcentaje: { type: 'number', nullable: true, description: 'Porcentaje (0-100). Opcional', example: 10 }
              }
            }
          }
        },
        400: {
          type: 'object',
          description: 'Error de validación',
          properties: {
            ok: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_FAILED' },
                message: { type: 'string', example: 'Error de validación en los datos proporcionados' }
              }
            }
          }
        },
        404: {
          type: 'object',
          description: 'Categoría no encontrada',
          properties: {
            ok: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'CATEGORIA_PUESTO_ORG_NOT_FOUND' },
                message: { type: 'string', example: 'Categoría de puesto orgánico no encontrada' }
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateCategoriaPuestoOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const updateCategoriaPuestoOrgCommand = req.diScope.resolve<UpdateCategoriaPuestoOrgCommand>('updateCategoriaPuestoOrgCommand');
      const categoria = await updateCategoriaPuestoOrgCommand.execute({
        categoriaPuestoOrgId,
        ...parsed.data,
        userId
      });
      return reply.send(ok(categoria));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });

  // Eliminar categoría de puesto org (requiere admin)
  app.delete('/categoria-puesto-org/:categoriaPuestoOrgId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Elimina una categoría de puesto orgánico por su ID. Requiere rol de administrador.',
      summary: 'Eliminar categoría de puesto orgánico',
      tags: ['categoria-puesto-org'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          categoriaPuestoOrgId: { 
            type: 'number', 
            minimum: 1,
            description: 'ID de la categoría de puesto orgánico a eliminar'
          }
        },
        required: ['categoriaPuestoOrgId']
      },
      response: {
        200: {
          type: 'object',
          description: 'Categoría de puesto orgánico eliminada exitosamente',
          properties: {
            ok: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                categoriaPuestoOrgId: { 
                  type: 'number',
                  description: 'ID de la categoría eliminada',
                  example: 1
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
    const { categoriaPuestoOrgId } = req.params as { categoriaPuestoOrgId: number };

    // Validate parameter
    const paramValidation = CategoriaPuestoOrgIdParamSchema.safeParse({ categoriaPuestoOrgId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const deleteCategoriaPuestoOrgCommand = req.diScope.resolve<DeleteCategoriaPuestoOrgCommand>('deleteCategoriaPuestoOrgCommand');
      const deletedId = await deleteCategoriaPuestoOrgCommand.execute({ categoriaPuestoOrgId });
      return reply.send(ok({ categoriaPuestoOrgId: deletedId }));
    } catch (error: any) {
      return handleCategoriaPuestoOrgError(error, reply);
    }
  });
}