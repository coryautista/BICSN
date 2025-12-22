import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import { IRetencionesPorCobrarRepository } from '../../domain/repositories/IRetencionesPorCobrarRepository.js';
import { RetencionPorCobrar } from '../../domain/entities/RetencionPorCobrar.js';
import { RetencionesPorCobrarError, RetencionesPorCobrarErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'RetencionesPorCobrarRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class RetencionesPorCobrarRepository implements IRetencionesPorCobrarRepository {
  async getRetencionesPorCobrar(org0: string, org1: string, periodo: string): Promise<RetencionPorCobrar[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getRetencionesPorCobrar',
      org0,
      org1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    // Asegurar que los parámetros sean strings y estén limpios
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT 
        r.CLAVE_ORGANICA_0, 
        r.CLAVE_ORGANICA_1, 
        r.CLAVE_ORGANICA_2,
        r.CLAVE_ORGANICA_3, 
        r.PERIODO, 
        r.FECHA_GENERACION, 
        r.USER_ALTA, 
        r.TIPO
      FROM ORGANICAS_INT_MORATORIO_GEN r
      WHERE r.CLAVE_ORGANICA_0 = ? 
        AND r.CLAVE_ORGANICA_1 = ? 
        AND r.PERIODO = ?
    `;

    return executeSerializedQuery((db) => {
      return new Promise<RetencionPorCobrar[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando consulta a ORGANICAS_INT_MORATORIO_GEN');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new RetencionesPorCobrarError(
            'Conexión a Firebird no disponible o inválida',
            RetencionesPorCobrarErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [clave0, clave1, periodoStr],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;

              if (err) {
                logger.error({
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                }, 'Error ejecutando consulta');
                reject(new RetencionesPorCobrarError(
                  `Error al ejecutar consulta ORGANICAS_INT_MORATORIO_GEN: ${err.message || String(err)}`,
                  RetencionesPorCobrarErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const retenciones: RetencionPorCobrar[] = decodedResult.map((row: any) => ({
                claveOrganica0: String(row.CLAVE_ORGANICA_0 || ''),
                claveOrganica1: String(row.CLAVE_ORGANICA_1 || ''),
                claveOrganica2: row.CLAVE_ORGANICA_2 ? String(row.CLAVE_ORGANICA_2) : null,
                claveOrganica3: row.CLAVE_ORGANICA_3 ? String(row.CLAVE_ORGANICA_3) : null,
                periodo: String(row.PERIODO || ''),
                fechaGeneracion: row.FECHA_GENERACION ? new Date(row.FECHA_GENERACION) : null,
                userAlta: row.USER_ALTA ? String(row.USER_ALTA) : null,
                tipo: String(row.TIPO || '').trim()
              }));

              logger.info({
                ...logContext,
                recordCount: retenciones.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(retenciones);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando consulta');
          reject(new RetencionesPorCobrarError(
            `Error síncrono al ejecutar consulta ORGANICAS_INT_MORATORIO_GEN: ${syncError.message || String(syncError)}`,
            RetencionesPorCobrarErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }
}

