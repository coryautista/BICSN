import { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/auth.middleware.js';
import { CargarNominaAplicacionQnalTxtCommand } from './application/commands/CargarNominaAplicacionQnalTxtCommand.js';
import { GetNominaAplicacionQnalTxtRegistrosQuery } from './application/queries/GetNominaAplicacionQnalTxtRegistrosQuery.js';
import { CargarNominaAplicacionQnalTxtFieldsSchema, GetNominaAplicacionQnalTxtRegistrosSchema } from './nomina.schemas.js';

export default async function nominaRoutes(app: FastifyInstance) {
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1
    }
  });

  app.post('/nomina/aplicacion-qnal-txt/cargar', {
    preHandler: [requireAuth],
    schema: {
      description: 'Carga archivo TXT de aplicación quincenal. Si valida correctamente reemplaza los registros vigentes de la misma entidad/año/quincena/orgánicas; si falla solo registra carga rechazada y errores.',
      summary: 'Carga TXT aplicación quincenal',
      tags: ['nomina'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data']
    }
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Archivo TXT requerido.' } });
    }

    const fields = Object.fromEntries(Object.entries(data.fields).map(([key, field]) => [key, (field as any).value]));
    const parsed = CargarNominaAplicacionQnalTxtFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Campos de carga inválidos.', details: parsed.error.issues } });
    }

    const organicas = resolveOrganicas(request.user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    const command = request.diScope.resolve<CargarNominaAplicacionQnalTxtCommand>('cargarNominaAplicacionQnalTxtCommand');
    const result = await command.execute({
      ...parsed.data,
      ...organicas.data,
      archivoNombre: data.filename,
      archivoContenido: await data.toBuffer(),
      usuarioId: request.user?.sub
    });

    return reply.code(result.estado === 'ACEPTADA' ? 201 : 422).send({ ok: result.estado === 'ACEPTADA', data: result });
  });

  app.get('/nomina/aplicacion-qnal-txt/registros', {
    preHandler: [requireAuth],
    schema: {
      description: 'Consulta registros vigentes cargados desde TXT de aplicación quincenal.',
      summary: 'Consulta TXT aplicación quincenal',
      tags: ['nomina'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    const parsed = GetNominaAplicacionQnalTxtRegistrosSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Parámetros inválidos.', details: parsed.error.issues } });
    }

    const organicas = resolveOrganicas(request.user, parsed.data);
    if (!organicas.ok) {
      return reply.code(400).send({ ok: false, error: { code: 'MISSING_ORGANICA_KEYS', message: organicas.message } });
    }

    const query = request.diScope.resolve<GetNominaAplicacionQnalTxtRegistrosQuery>('getNominaAplicacionQnalTxtRegistrosQuery');
    const result = await query.execute({ ...parsed.data, ...organicas.data });
    return reply.send({ ok: true, ...result });
  });
}

function resolveOrganicas(user: any, input: Partial<{ organica0: string; organica1: string; organica2: string; organica3: string }>) {
  const isEntidad = user?.entidades?.[0] === true;
  const source = isEntidad
    ? {
        organica0: user?.idOrganica0,
        organica1: user?.idOrganica1,
        organica2: user?.idOrganica2,
        organica3: user?.idOrganica3
      }
    : {
        organica0: input.organica0 ?? user?.idOrganica0,
        organica1: input.organica1 ?? user?.idOrganica1,
        organica2: input.organica2 ?? user?.idOrganica2,
        organica3: input.organica3 ?? user?.idOrganica3
      };

  const organica0 = normalizeOrganica(source.organica0);
  const organica1 = normalizeOrganica(source.organica1);
  const organica2 = normalizeOrganica(source.organica2);
  const organica3 = normalizeOrganica(source.organica3);

  if (!organica0 || !organica1 || !organica2 || !organica3) {
    return {
      ok: false as const,
      message: isEntidad
        ? 'Las claves orgánicas organica0-3 son requeridas en el token o usuario autenticado.'
        : 'Las claves orgánicas organica0-3 son requeridas para usuarios no entidad.'
    };
  }

  const data = {
    organica0,
    organica1,
    organica2,
    organica3
  };

  return { ok: true as const, data };
}

function normalizeOrganica(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim().padStart(2, '0');
}
