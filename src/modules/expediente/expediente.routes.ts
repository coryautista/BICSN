import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import {
  CreateDocumentTypeSchema,
  UpdateDocumentTypeSchema,
  DocumentTypeIdParamSchema,
  CreateExpedienteSchema,
  UpdateExpedienteSchema,
  ExpedienteCurpParamSchema,
  CreateExpedienteArchivoSchema,
  UpdateExpedienteArchivoSchema,
  ExpedienteArchivoIdParamSchema
} from './expediente.schemas.js';
import {
  uploadExpedienteFile,
  downloadExpedienteFile,
  uploadDocumentToExpediente
} from './expediente.service.js';
import { ok, validationError, notFound, internalError } from '../../utils/http.js';
import { handleExpedienteError } from './infrastructure/errorHandler.js';
import { withDbContext } from '../../db/context.js';
import fs from 'fs';
import path from 'path';

// Queries
import { GetAllDocumentTypesQuery } from './application/queries/GetAllDocumentTypesQuery.js';
import { GetDocumentTypeByIdQuery } from './application/queries/GetDocumentTypeByIdQuery.js';
import { GetAllExpedientesQuery } from './application/queries/GetAllExpedientesQuery.js';
import { GetExpedienteByCurpQuery } from './application/queries/GetExpedienteByCurpQuery.js';
import { GetExpedienteArchivoByIdQuery } from './application/queries/GetExpedienteArchivoByIdQuery.js';
import { GetExpedienteArchivosByCurpQuery } from './application/queries/GetExpedienteArchivosByCurpQuery.js';

// Commands
import { CreateDocumentTypeCommand } from './application/commands/CreateDocumentTypeCommand.js';
import { UpdateDocumentTypeCommand } from './application/commands/UpdateDocumentTypeCommand.js';
import { DeleteDocumentTypeCommand } from './application/commands/DeleteDocumentTypeCommand.js';
import { CreateExpedienteCommand } from './application/commands/CreateExpedienteCommand.js';
import { UpdateExpedienteCommand } from './application/commands/UpdateExpedienteCommand.js';
import { DeleteExpedienteCommand } from './application/commands/DeleteExpedienteCommand.js';
import { CreateExpedienteArchivoCommand } from './application/commands/CreateExpedienteArchivoCommand.js';
import { UpdateExpedienteArchivoCommand } from './application/commands/UpdateExpedienteArchivoCommand.js';
import { DeleteExpedienteArchivoCommand } from './application/commands/DeleteExpedienteArchivoCommand.js';

export default async function expedienteRoutes(app: FastifyInstance) {

  // Resolve dependencies from DI container
  const getAllDocumentTypesQuery = app.diContainer.resolve<GetAllDocumentTypesQuery>('getAllDocumentTypesQuery');
  const getDocumentTypeByIdQuery = app.diContainer.resolve<GetDocumentTypeByIdQuery>('getDocumentTypeByIdQuery');
  const getAllExpedientesQuery = app.diContainer.resolve<GetAllExpedientesQuery>('getAllExpedientesQuery');
  const getExpedienteByCurpQuery = app.diContainer.resolve<GetExpedienteByCurpQuery>('getExpedienteByCurpQuery');
  const getExpedienteArchivoByIdQuery = app.diContainer.resolve<GetExpedienteArchivoByIdQuery>('getExpedienteArchivoByIdQuery');
  const getExpedienteArchivosByCurpQuery = app.diContainer.resolve<GetExpedienteArchivosByCurpQuery>('getExpedienteArchivosByCurpQuery');

  const createDocumentTypeCommand = app.diContainer.resolve<CreateDocumentTypeCommand>('createDocumentTypeCommand');
  const updateDocumentTypeCommand = app.diContainer.resolve<UpdateDocumentTypeCommand>('updateDocumentTypeCommand');
  const deleteDocumentTypeCommand = app.diContainer.resolve<DeleteDocumentTypeCommand>('deleteDocumentTypeCommand');
  const createExpedienteCommand = app.diContainer.resolve<CreateExpedienteCommand>('createExpedienteCommand');
  const updateExpedienteCommand = app.diContainer.resolve<UpdateExpedienteCommand>('updateExpedienteCommand');
  const deleteExpedienteCommand = app.diContainer.resolve<DeleteExpedienteCommand>('deleteExpedienteCommand');
  const createExpedienteArchivoCommand = app.diContainer.resolve<CreateExpedienteArchivoCommand>('createExpedienteArchivoCommand');
  const updateExpedienteArchivoCommand = app.diContainer.resolve<UpdateExpedienteArchivoCommand>('updateExpedienteArchivoCommand');
  const deleteExpedienteArchivoCommand = app.diContainer.resolve<DeleteExpedienteArchivoCommand>('deleteExpedienteArchivoCommand');

  // Register multipart support for file uploads
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1
    }
  });

  // DocumentType routes

  // Listar todos los tipos de documento (requiere auth)
  app.get('/document-types', {
    preHandler: [requireAuth],
    schema: {
      description: 'Listar todos los tipos de documento',
      tags: ['document-types'],
      security: [{ bearerAuth: [] }]
    }
  }, async (_req, reply) => {
    try {
      const documentTypes = await getAllDocumentTypesQuery.execute();
      return reply.send(ok(documentTypes));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Obtener tipo de documento por ID (requiere auth)
  app.get('/document-types/:documentTypeId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener tipo de documento por ID',
      tags: ['document-types'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          documentTypeId: { type: 'string' }
        },
        required: ['documentTypeId']
      }
    }
  }, async (req, reply) => {
    const { documentTypeId } = req.params as { documentTypeId: string };

    // Validate parameter
    const paramValidation = DocumentTypeIdParamSchema.safeParse({ documentTypeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const documentType = await getDocumentTypeByIdQuery.execute(parseInt(documentTypeId));
      return reply.send(ok(documentType));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Crear tipo de documento (requiere admin)
  app.post('/document-types', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Crear un nuevo tipo de documento',
      tags: ['document-types'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['code', 'name'],
        properties: {
          code: { type: 'string', minLength: 1, maxLength: 30 },
          name: { type: 'string', minLength: 1, maxLength: 120 },
          isRequired: { type: 'boolean' },
          validityDays: { type: ['number', 'null'] },
          active: { type: 'boolean' }
        }
      }
    }
  }, async (req, reply) => {
    const parsed = CreateDocumentTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const documentType = await createDocumentTypeCommand.execute({
        code: parsed.data.code,
        name: parsed.data.name,
        required: parsed.data.required ?? false,
        validityDays: parsed.data.validityDays ?? null,
        active: parsed.data.active ?? true
      }, userId);
      return reply.code(201).send(ok(documentType));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Actualizar tipo de documento (requiere admin)
  app.put('/document-types/:documentTypeId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Actualizar tipo de documento',
      tags: ['document-types'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          documentTypeId: { type: 'string' }
        },
        required: ['documentTypeId']
      },
      body: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 1, maxLength: 30 },
          name: { type: 'string', minLength: 1, maxLength: 120 },
          required: { type: 'boolean' },
          validityDays: { type: ['number', 'null'] },
          active: { type: 'boolean' }
        }
      },
    }
  }, async (req, reply) => {
    const { documentTypeId } = req.params as { documentTypeId: string };

    // Validate parameter
    const paramValidation = DocumentTypeIdParamSchema.safeParse({ documentTypeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateDocumentTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const documentType = await updateDocumentTypeCommand.execute({
        documentTypeId: parseInt(documentTypeId),
        code: parsed.data.code,
        name: parsed.data.name,
        required: parsed.data.required,
        validityDays: parsed.data.validityDays,
        active: parsed.data.active
      }, userId);
      return reply.send(ok(documentType));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Eliminar tipo de documento (requiere admin)
  app.delete('/document-types/:documentTypeId', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Eliminar tipo de documento',
      tags: ['document-types'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          documentTypeId: { type: 'string' }
        },
        required: ['documentTypeId']
      },
    }
  }, async (req, reply) => {
    const { documentTypeId } = req.params as { documentTypeId: string };

    // Validate parameter
    const paramValidation = DocumentTypeIdParamSchema.safeParse({ documentTypeId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      await deleteDocumentTypeCommand.execute(parseInt(documentTypeId));
      return reply.send(ok({ documentTypeId: parseInt(documentTypeId) }));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Expediente routes

  // Listar todos los expedientes (requiere auth)
  app.get('/expedientes', {
    preHandler: [requireAuth],
    schema: {
      description: 'Listar todos los expedientes',
      tags: ['expedientes'],
      security: [{ bearerAuth: [] }],
    }
  }, async (_req, reply) => {
    try {
      const expedientes = await getAllExpedientesQuery.execute();
      return reply.send(ok(expedientes));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Obtener expediente por CURP (requiere auth)
  app.get('/expedientes/:curp', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener expediente por CURP',
      tags: ['expedientes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string' }
        },
        required: ['curp']
      },
    }
  }, async (req, reply) => {
    const { curp } = req.params as { curp: string };

    // Validate parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const expediente = await getExpedienteByCurpQuery.execute(curp);
      return reply.send(ok(expediente));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Crear expediente (requiere auth)
  app.post('/expedientes', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear un nuevo expediente',
      tags: ['expedientes'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['curp'],
        properties: {
          curp: { type: 'string' },
          afiliadoId: { type: ['number', 'null'] },
          interno: { type: ['number', 'null'] },
          estado: { type: 'string', maxLength: 20 },
          notas: { type: ['string', 'null'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                curp: { type: 'string' },
                afiliadoId: { type: ['number', 'null'] },
                interno: { type: ['number', 'null'] },
                estado: { type: 'string' },
                notas: { type: ['string', 'null'] }
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
                message: { type: 'string' },
                details: { type: 'object' }
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
    const parsed = CreateExpedienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const expediente = await createExpedienteCommand.execute({
        curp: parsed.data.curp,
        afiliadoId: parsed.data.afiliadoId ?? null,
        interno: parsed.data.interno ?? null,
        estado: parsed.data.estado ?? 'ABIERTO',
        notas: parsed.data.notas ?? null
      }, userId);
      return reply.code(201).send(ok(expediente));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Actualizar expediente (requiere auth)
  app.put('/expedientes/:curp', {
    preHandler: [requireAuth],
    schema: {
      description: 'Actualizar expediente',
      tags: ['expedientes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string' }
        },
        required: ['curp']
      },
      body: {
        type: 'object',
        properties: {
          afiliadoId: { type: ['number', 'null'] },
          interno: { type: ['number', 'null'] },
          estado: { type: 'string', maxLength: 20 },
          notas: { type: ['string', 'null'] }
        }
      },
    }
  }, async (req, reply) => {
    const { curp } = req.params as { curp: string };

    // Validate parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateExpedienteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const expediente = await updateExpedienteCommand.execute({
        curp,
        afiliadoId: parsed.data.afiliadoId,
        interno: parsed.data.interno,
        estado: parsed.data.estado,
        notas: parsed.data.notas
      }, userId);
      return reply.send(ok(expediente));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Eliminar expediente (requiere admin)
  app.delete('/expedientes/:curp', {
    preHandler: [requireAuth, requireRole('admin')],
    schema: {
      description: 'Eliminar expediente',
      tags: ['expedientes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string' }
        },
        required: ['curp']
      },
    }
  }, async (req, reply) => {
    const { curp } = req.params as { curp: string };

    // Validate parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      await deleteExpedienteCommand.execute(curp);
      return reply.send(ok({ curp }));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // ExpedienteArchivo routes

  // Listar archivos de un expediente (requiere auth)
  app.get('/expedientes/:curp/archivos', {
    preHandler: [requireAuth],
    schema: {
      description: 'Listar archivos de un expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string' }
        },
        required: ['curp']
      }
    }
  }, async (req, reply) => {
    const { curp } = req.params as { curp: string };

    // Validate parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const archivos = await getExpedienteArchivosByCurpQuery.execute(curp);
      return reply.send(ok(archivos));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Obtener archivo por ID (requiere auth)
  app.get('/expediente-archivos/:archivoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Obtener archivo de expediente por ID',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          archivoId: { type: 'string' }
        },
        required: ['archivoId']
      }
    }
  }, async (req, reply) => {
    const { archivoId } = req.params as { archivoId: string };

    // Validate parameter
    const paramValidation = ExpedienteArchivoIdParamSchema.safeParse({ archivoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const archivo = await getExpedienteArchivoByIdQuery.execute(parseInt(archivoId));
      return reply.send(ok(archivo));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Download archivo (requiere auth)
  app.get('/expediente-archivos/:archivoId/download', {
    preHandler: [requireAuth],
    schema: {
      description: 'Descargar archivo de expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          archivoId: { type: 'string' }
        },
        required: ['archivoId']
      }
    }
  }, async (req, reply) => {
    const { archivoId } = req.params as { archivoId: string };

    // Validate parameter
    const paramValidation = ExpedienteArchivoIdParamSchema.safeParse({ archivoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      // Create temporary download path
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `download_${archivoId}_${Date.now()}`);

      const archivo = await downloadExpedienteFile(parseInt(archivoId), tempFilePath);

      // Set headers for file download
      reply.header('Content-Type', archivo.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${archivo.fileName}"`);

      // Stream file and cleanup
      const fileStream = fs.createReadStream(tempFilePath);
      
      // Cleanup temp file after response
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError);
        }
      });
      
      // Return the stream to ensure CORS headers are properly set
      return reply.send(fileStream);

    } catch (error: any) {
      if (error.message === 'EXPEDIENTE_ARCHIVO_NOT_FOUND') {
        return reply.code(404).send(notFound('ExpedienteArchivo', archivoId));
      }
      if (error.message === 'UNSUPPORTED_STORAGE_PROVIDER') {
        return reply.code(400).send(validationError([{ message: 'Proveedor de almacenamiento no soportado' }]));
      }
      console.error('Error downloading expediente archivo:', error);
      return reply.code(500).send(internalError('Error al descargar archivo del expediente'));
    }
  });

  // Crear archivo de expediente (requiere auth)
  app.post('/expediente-archivos', {
    preHandler: [requireAuth],
    schema: {
      description: 'Crear un nuevo archivo de expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['curp', 'titulo', 'fileName', 'mimeType', 'byteSize', 'sha256Hex', 'storageProvider', 'storagePath'],
        properties: {
          curp: { type: 'string' },
          tipoCodigo: { type: ['string', 'null'] },
          titulo: { type: 'string', minLength: 1, maxLength: 200 },
          fileName: { type: 'string', minLength: 1, maxLength: 260 },
          mimeType: { type: 'string', minLength: 1, maxLength: 120 },
          byteSize: { type: 'number', minimum: 0 },
          sha256Hex: { type: 'string', minLength: 64, maxLength: 64 },
          storageProvider: { type: 'string', minLength: 1, maxLength: 20 },
          storagePath: { type: 'string', minLength: 1, maxLength: 500 },
          observaciones: { type: ['string', 'null'] },
          documentTypeId: { type: ['number', 'null'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                archivoId: { type: 'number' },
                curp: { type: 'string' },
                tipoCodigo: { type: ['string', 'null'] },
                titulo: { type: 'string' },
                fileName: { type: 'string' },
                mimeType: { type: 'string' },
                byteSize: { type: 'number' },
                sha256Hex: { type: 'string' },
                storageProvider: { type: 'string' },
                storagePath: { type: 'string' },
                observaciones: { type: ['string', 'null'] },
                createdBy: { type: 'string' },
                documentTypeId: { type: ['number', 'null'] }
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
    const parsed = CreateExpedienteArchivoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const archivo = await createExpedienteArchivoCommand.execute({
        curp: parsed.data.curp,
        tipoCodigo: parsed.data.tipoCodigo ?? null,
        titulo: parsed.data.titulo,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
        byteSize: parsed.data.byteSize,
        sha256Hex: parsed.data.sha256Hex,
        storageProvider: parsed.data.storageProvider,
        storagePath: parsed.data.storagePath,
        observaciones: parsed.data.observaciones ?? null,
        documentTypeId: parsed.data.documentTypeId ?? null
      }, userId);
      return reply.code(201).send(ok(archivo));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });  // Upload archivo de expediente (requiere auth)
  app.post('/expedientes/:curp/upload', {
    preHandler: [requireAuth],
    schema: {
      description: 'Subir archivo a expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string' }
        },
        required: ['curp']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                archivoId: { type: 'number' },
                curp: { type: 'string' },
                titulo: { type: 'string' },
                fileName: { type: 'string' },
                mimeType: { type: 'string' },
                byteSize: { type: 'number' },
                sha256Hex: { type: 'string' },
                storageProvider: { type: 'string' },
                storagePath: { type: 'string' },
                observaciones: { type: ['string', 'null'] },
                documentTypeId: { type: ['number', 'null'] }
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
    console.log('🚀 Starting upload-document endpoint for CURP:', (req.params as any).curp);

    const { curp } = req.params as { curp: string };
    console.log('📋 CURP parameter:', curp);

    // Validate CURP parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      console.log('❌ CURP validation failed:', paramValidation.error.issues);
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    console.log('✅ CURP validation passed');

    try {
      console.log('📁 Attempting to get file from request...');
      const data = await req.file();
      console.log('📄 File data received:', data ? 'YES' : 'NO');

      if (!data) {
        console.log('❌ No file uploaded');
        return reply.code(400).send(validationError([{ message: 'No se subió ningún archivo' }]));
      }

      console.log('📊 File details:', {
        filename: data.filename,
        mimetype: data.mimetype,
        fieldname: data.fieldname
      });

      // Get form fields
      const titulo = (data.fields.titulo as any)?.value || data.filename;
      const tipoCodigo = (data.fields.tipoCodigo as any)?.value;
      const observaciones = (data.fields.observaciones as any)?.value;
      const documentTypeId = (data.fields.documentTypeId as any)?.value ? parseInt((data.fields.documentTypeId as any).value) : undefined;

      // Create temp file path
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `upload_${Date.now()}_${data.filename}`);

      // Save uploaded file to temp location
      await data.toBuffer().then(buffer => fs.writeFileSync(tempFilePath, buffer));

      // Upload to expediente
      const archivo = await uploadExpedienteFile(
        curp,
        tempFilePath,
        data.filename,
        titulo,
        tipoCodigo,
        observaciones,
        documentTypeId,
        req.user?.sub
      );

      // Cleanup temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      return reply.code(201).send(ok(archivo));

    } catch (error: any) {
      if (error.message === 'EXPEDIENTE_NOT_FOUND') {
        return reply.code(404).send(notFound('Expediente', curp));
      }
      if (error.message === 'DOCUMENT_TYPE_NOT_FOUND') {
        return reply.code(404).send(notFound('DocumentType', ''));
      }
      if (error.message === 'EXPEDIENTE_ARCHIVO_HASH_EXISTS') {
        return reply.code(409 as any).send({ ok: false, error: { code: 'CONFLICT', message: 'Archivo with this hash already exists' } });
      }
      console.error('Error uploading expediente archivo:', error);
      return reply.code(500).send(internalError('Error al subir archivo del expediente'));
    }
  });

  // Actualizar archivo de expediente (requiere auth)
  app.put('/expediente-archivos/:archivoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Actualizar archivo de expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          archivoId: { type: 'string' }
        },
        required: ['archivoId']
      },
      body: {
        type: 'object',
        properties: {
          tipoCodigo: { type: ['string', 'null'] },
          titulo: { type: 'string', minLength: 1, maxLength: 200 },
          fileName: { type: 'string', minLength: 1, maxLength: 260 },
          mimeType: { type: 'string', minLength: 1, maxLength: 120 },
          byteSize: { type: 'number', minimum: 0 },
          sha256Hex: { type: 'string', minLength: 64, maxLength: 64 },
          storageProvider: { type: 'string', minLength: 1, maxLength: 20 },
          storagePath: { type: 'string', minLength: 1, maxLength: 500 },
          observaciones: { type: ['string', 'null'] },
          documentTypeId: { type: ['number', 'null'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                archivoId: { type: 'number' },
                curp: { type: 'string' },
                tipoCodigo: { type: ['string', 'null'] },
                titulo: { type: 'string' },
                fileName: { type: 'string' },
                mimeType: { type: 'string' },
                byteSize: { type: 'number' },
                sha256Hex: { type: 'string' },
                storageProvider: { type: 'string' },
                storagePath: { type: 'string' },
                observaciones: { type: ['string', 'null'] },
                createdBy: { type: 'string' },
                documentTypeId: { type: ['number', 'null'] }
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
    const { archivoId } = req.params as { archivoId: string };

    // Validate parameter
    const paramValidation = ExpedienteArchivoIdParamSchema.safeParse({ archivoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    const parsed = UpdateExpedienteArchivoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send(validationError(parsed.error.issues));
    }

    try {
      const userId = req.user?.sub;
      const archivo = await updateExpedienteArchivoCommand.execute({
        archivoId: parseInt(archivoId),
        tipoCodigo: parsed.data.tipoCodigo,
        titulo: parsed.data.titulo,
        fileName: parsed.data.fileName,
        mimeType: parsed.data.mimeType,
        byteSize: parsed.data.byteSize,
        sha256Hex: parsed.data.sha256Hex,
        storageProvider: parsed.data.storageProvider,
        storagePath: parsed.data.storagePath,
        observaciones: parsed.data.observaciones,
        documentTypeId: parsed.data.documentTypeId
      }, userId);
      return reply.send(ok(archivo));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Eliminar archivo de expediente (requiere auth)
  app.delete('/expediente-archivos/:archivoId', {
    preHandler: [requireAuth],
    schema: {
      description: 'Eliminar archivo de expediente',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          archivoId: { type: 'string' }
        },
        required: ['archivoId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                archivoId: { type: 'number' }
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
    const { archivoId } = req.params as { archivoId: string };

    // Validate parameter
    const paramValidation = ExpedienteArchivoIdParamSchema.safeParse({ archivoId });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      await deleteExpedienteArchivoCommand.execute(parseInt(archivoId));
      return reply.send(ok({ archivoId: parseInt(archivoId) }));
    } catch (error: any) {
      return handleExpedienteError(error, reply);
    }
  });

  // Upload document to expediente (simple upload)
  app.post('/expedientes/:curp/upload-document', {
    preHandler: [requireAuth],
    schema: {
      description: 'Subir documento al expediente (multipart/form-data). Campos: file (requerido), titulo (opcional, usa filename si no se proporciona), tipoCodigo (opcional), observaciones (opcional), documentTypeId (opcional, número)',
      tags: ['expediente-archivos'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          curp: { type: 'string', description: 'CURP del expediente' }
        },
        required: ['curp']
      },
      consumes: ['multipart/form-data'],
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                archivoId: { type: 'number' },
                success: { type: 'boolean' },
                message: { type: 'string' }
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
    const { curp } = req.params as { curp: string };

    // Validate CURP parameter
    const paramValidation = ExpedienteCurpParamSchema.safeParse({ curp });
    if (!paramValidation.success) {
      return reply.code(400).send(validationError(paramValidation.error.issues));
    }

    try {
      const result = await withDbContext(req, async (tx) => {
        const data = await req.file();
        if (!data) {
          throw new Error('NO_FILE_UPLOADED');
        }

        // Get form fields
        const titulo = (data.fields.titulo as any)?.value || data.filename;
        const tipoCodigo = (data.fields.tipoCodigo as any)?.value;
        const observaciones = (data.fields.observaciones as any)?.value;
        const documentTypeId = (data.fields.documentTypeId as any)?.value ? parseInt((data.fields.documentTypeId as any).value) : undefined;

        const uploadResult = await uploadDocumentToExpediente(
          curp,
          data,
          titulo,
          req.user?.sub,
          tipoCodigo,
          observaciones,
          documentTypeId,
          tx
        );

        // Return result - commit will happen after this function returns
        return uploadResult;
      });

      // Response is sent AFTER commit completes
      const responseData = ok(result);
      
      // Log response details
      req.log.info({
        curp,
        archivoId: result.archivoId,
        fileName: result.fileName,
        statusCode: 201
      }, '[upload-document] Upload completed successfully, sending response');
      
      req.log.debug({
        curp,
        response: responseData
      }, '[upload-document] Response data');
      
      console.log('[upload-document] Response data:', JSON.stringify(responseData, null, 2));
      
      const response = reply.code(201).send(responseData);
      
      req.log.info({
        curp,
        archivoId: result.archivoId,
        statusCode: 201
      }, '[upload-document] Response sent successfully');
      
      return response;

    } catch (error: any) {
      console.error('Error uploading document:', error);
      console.error('Error stack:', error.stack);
      console.error('Error code:', error.code);
      console.error('Error number:', error.number);
      
      // Handle timeout errors specifically
      if (error.code === 'ETIMEOUT' || error.number === 'ETIMEOUT') {
        return reply.code(504 as any).send({ 
          ok: false, 
          error: { 
            code: 'TIMEOUT', 
            message: 'La operación tardó demasiado tiempo. Por favor, intente nuevamente.' 
          } 
        });
      }
      
      if (error.message === 'NO_FILE_UPLOADED') {
        return reply.code(400).send(validationError([{ message: 'No se subió ningún archivo' }]));
      }
      
      if (error.message === 'EXPEDIENTE_NOT_FOUND') {
        return reply.code(404).send(notFound('Expediente', curp));
      }
      if (error.message === 'DOCUMENT_TYPE_NOT_FOUND') {
        return reply.code(404).send(notFound('DocumentType', ''));
      }
      if (error.message === 'EXPEDIENTE_ARCHIVO_HASH_EXISTS') {
        return reply.code(409).send({ ok: false, error: { code: 'CONFLICT', message: 'Ya existe un archivo con este hash' } });
      }
      return reply.code(500).send(internalError('Error al subir documento'));
    }
  });
}