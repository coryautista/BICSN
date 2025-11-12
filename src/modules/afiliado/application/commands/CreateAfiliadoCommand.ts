import { IAfiliadoRepository } from '../../domain/repositories/IAfiliadoRepository.js';
import { Afiliado, CreateAfiliadoData } from '../../domain/entities/Afiliado.js';
import pino from 'pino';
import {
  InvalidAfiliadoDataError,
  AfiliadoRegistrationError
} from '../../domain/errors.js';

const logger = pino({
  name: 'createAfiliadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class CreateAfiliadoCommand {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(data: CreateAfiliadoData): Promise<Afiliado> {
    const logContext = {
      operation: 'createAfiliado',
      curp: data.curp,
      rfc: data.rfc,
      numeroSeguroSocial: data.numeroSeguroSocial
    };

    logger.info(logContext, 'Iniciando creación de afiliado');

    // Validaciones básicas
    if (!data.curp || !data.rfc || !data.numeroSeguroSocial) {
      logger.warn(logContext, 'Datos requeridos faltantes para crear afiliado');
      throw new InvalidAfiliadoDataError('curp/rfc/nss', 'Datos requeridos faltantes');
    }

    try {
      const result = await this.afiliadoRepo.create(data);
      logger.info({ ...logContext, afiliadoId: result.id }, 'Afiliado creado exitosamente');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al crear afiliado');

      throw new AfiliadoRegistrationError('Error al crear afiliado', {
        originalError: errorMessage,
        curp: data.curp
      });
    }
  }
}
