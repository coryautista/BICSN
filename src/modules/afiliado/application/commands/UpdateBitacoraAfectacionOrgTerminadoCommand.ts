import { actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId } from '../../afiliado.repo.js';
import pino from 'pino';

const logger = pino({
  name: 'updateBitacoraAfectacionOrgTerminadoCommand',
  level: process.env.LOG_LEVEL || 'info'
});

export class UpdateBitacoraAfectacionOrgTerminadoCommand {
  async execute(afectacionId: number): Promise<{ actualizado: boolean; registrosAfectados: number }> {
    const logContext = {
      operation: 'updateBitacoraAfectacionOrgTerminado',
      afectacionId
    };

    logger.info(logContext, 'Iniciando actualización de BitacoraAfectacionOrg a TERMINADO');

    // Validar que el AfectacionId sea válido
    if (!afectacionId || afectacionId <= 0) {
      logger.warn(logContext, 'AfectacionId inválido para actualización');
      throw new Error('AfectacionId debe ser un número positivo');
    }

    try {
      const result = await actualizarBitacoraAfectacionOrgTerminadoPorAfectacionId(afectacionId);
      
      if (!result.actualizado) {
        logger.warn(logContext, 'No se encontró registro para actualizar');
        throw new Error('No se encontró registro con el AfectacionId proporcionado');
      }

      logger.info({ ...logContext, success: true, registrosAfectados: result.registrosAfectados }, 'BitacoraAfectacionOrg actualizada exitosamente a TERMINADO');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error({
        ...logContext,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al actualizar BitacoraAfectacionOrg');

      // Re-lanzar el error para que el handler lo maneje
      throw error;
    }
  }
}

