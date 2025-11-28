import { IAfiliadoRepository, AplicarBDIsspeaLoteResult } from '../../domain/repositories/IAfiliadoRepository.js';
import pino from 'pino';
import {
  AplicarBDIsspeaError,
  OrganicaNoConfiguradaError,
  NoAfiliadosElegiblesError
} from '../../domain/errors.js';

const logger = pino({
  name: 'aplicarBDIsspeaLoteCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export interface AplicarBDIsspeaLoteData {
  org0: string;
  org1: string;
  usuarioId: string;
  motivo?: string;
  observaciones?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AplicarBDIsspeaLoteCommand {
  constructor(private afiliadoRepo: IAfiliadoRepository) {}

  async execute(data: AplicarBDIsspeaLoteData): Promise<AplicarBDIsspeaLoteResult> {
    const logContext = {
      operation: 'aplicarBDIsspeaLote',
      org0: data.org0,
      org1: data.org1,
      usuarioId: data.usuarioId
    };

    logger.info(logContext, 'Iniciando aplicación de BDISSPEA en lote');

    // Validar orgánica
    if (!data.org0 || !data.org1) {
      logger.warn(logContext, 'Orgánica no configurada para el usuario');
      throw new OrganicaNoConfiguradaError();
    }

    try {
      // Validar que existan afiliados elegibles antes de procesar
      const afiliadosElegibles = await this.afiliadoRepo.findByStatusAndOrganica(
        data.org0,
        data.org1,
        [2, 3] // Estados 2 (Aprobado) y 3 (En Revisión)
      );

      if (afiliadosElegibles.length === 0) {
        logger.warn({
          ...logContext,
          estadosBuscados: [2, 3]
        }, 'No se encontraron afiliados elegibles');
        throw new NoAfiliadosElegiblesError(data.org0, data.org1);
      }

      logger.info({
        ...logContext,
        afiliadosEncontrados: afiliadosElegibles.length
      }, 'Afiliados elegibles encontrados, iniciando procesamiento');

      // Ejecutar el procesamiento en lote
      const resultado = await this.afiliadoRepo.aplicarBDIsspeaLote(
        data.org0,
        data.org1,
        data.usuarioId,
        data.motivo,
        data.observaciones,
        data.ipAddress,
        data.userAgent
      );

      logger.info({
        ...logContext,
        afiliadosProcesados: resultado.afiliadosCambiadosEstado,
        afiliadosCompletos: resultado.afiliadosCompletos,
        bitacoraActualizada: resultado.bitacoraActualizada
      }, 'Proceso de aplicación BDISSPEA en lote completado exitosamente');

      return resultado;

    } catch (error: any) {
      // Re-lanzar errores del dominio sin modificar
      if (
        error instanceof OrganicaNoConfiguradaError ||
        error instanceof NoAfiliadosElegiblesError
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        operation: 'AplicarBDIsspeaLoteCommand',
        step: 'errorDuranteProcesamiento',
        org0: data.org0,
        org1: data.org1,
        usuarioId: data.usuarioId,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
          code: (error as any)?.code
        },
        resumenProcesamiento: {
          // Aquí podríamos agregar información sobre lo que se procesó antes del error
          // si tuviéramos acceso a esa información en este punto
        },
        timestamp: new Date().toISOString()
      }, 'Error detallado durante procesamiento de BDISSPEA en lote');

      throw new AplicarBDIsspeaError('Error durante el procesamiento en lote', {
        originalError: errorMessage,
        org0: data.org0,
        org1: data.org1
      });
    }
  }
}

