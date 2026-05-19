import { executeSafeQuery, executeInTransaction, executeQueryInTransaction } from '../../../../db/firebird.js';
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

    logger.info(logContext, 'Iniciando consulta a ORGANICAS_INT_MORATORIO_GEN');

    // Asegurar que los parámetros sean strings; claves 2 dígitos, periodo 4 dígitos (0226 no 226)
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const periodoStr = String(periodo).trim().padStart(4, '0');

    // Comparar como texto; en BD PERIODO puede ser INTEGER (226) o CHAR; normalizamos con LPAD
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
      WHERE LPAD(TRIM(CAST(r.CLAVE_ORGANICA_0 AS VARCHAR(10))), 2, '0') = ?
        AND LPAD(TRIM(CAST(r.CLAVE_ORGANICA_1 AS VARCHAR(10))), 2, '0') = ?
        AND LPAD(TRIM(CAST(r.PERIODO AS VARCHAR(10))), 4, '0') = ?
    `;

    try {
      // executeSafeQuery ya incluye serialización, timeout, y decodificación
      const result = await executeSafeQuery(sql, [clave0, clave1, periodoStr]);
      const duration = Date.now() - startTime;

      if (!result || result.length === 0) {
        logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros');
        return [];
      }

      logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

      // executeSafeQuery ya aplica decodeValue a cada fila
      const retenciones: RetencionPorCobrar[] = result.map((row: any) => ({
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

      return retenciones;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        errorCode: error.code,
        errorName: error.name,
        stack: error.stack,
        duracionMs: duration
      }, 'Error ejecutando consulta');
      
      throw new RetencionesPorCobrarError(
        `Error al ejecutar consulta ORGANICAS_INT_MORATORIO_GEN: ${error.message || String(error)}`,
        RetencionesPorCobrarErrorCode.FIREBIRD_QUERY_ERROR
      );
    }
  }

  async createRetencionesMoratorio(
    org0: string,
    org1: string,
    org2: string,
    org3: string,
    periodo: string,
    userAlta: string
  ): Promise<RetencionPorCobrar[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'createRetencionesMoratorio',
      org0,
      org1,
      org2,
      org3,
      periodo,
      userAlta
    };

    logger.info(logContext, 'Iniciando creación de retenciones moratorio');

    // Asegurar que los parámetros sean strings y estén limpios
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const clave2 = String(org2).trim().padStart(2, '0');
    const clave3 = String(org3).trim().padStart(2, '0');
    // Periodo siempre 4 dígitos con cero a la izquierda (ej. 226 -> 0226)
    const periodoStr = String(periodo).trim().padStart(4, '0');
    const userAltaStr = String(userAlta).trim();

    const tiposRequeridos = ['PPV', 'PMP', 'PCP'];

    return executeInTransaction(async (transaction) => {
      // Consultar por org0, org1 y periodo solamente; el filtro exacto (org2, org3) lo hacemos en código
      // para evitar que Firebird no coincida por tipo/formato de columnas
      const sqlExistentes = `
        SELECT r.CLAVE_ORGANICA_0, r.CLAVE_ORGANICA_1, r.CLAVE_ORGANICA_2, r.CLAVE_ORGANICA_3,
               r.PERIODO, r.FECHA_GENERACION, r.USER_ALTA, r.TIPO
        FROM ORGANICAS_INT_MORATORIO_GEN r
        WHERE LPAD(TRIM(CAST(r.CLAVE_ORGANICA_0 AS VARCHAR(10))), 2, '0') = ?
          AND LPAD(TRIM(CAST(r.CLAVE_ORGANICA_1 AS VARCHAR(10))), 2, '0') = ?
          AND LPAD(TRIM(CAST(r.PERIODO AS VARCHAR(10))), 4, '0') = ?
      `;
      const filasBrutas = await executeQueryInTransaction(transaction, sqlExistentes, [
        clave0, clave1, periodoStr
      ]);

      const getCol = (row: any, name: string): any => {
        if (row[name] !== undefined && row[name] !== null) return row[name];
        const lower = name.toLowerCase();
        if (row[lower] !== undefined && row[lower] !== null) return row[lower];
        return undefined;
      };

      const mapRow = (row: any): RetencionPorCobrar => ({
        claveOrganica0: String(getCol(row, 'CLAVE_ORGANICA_0') ?? ''),
        claveOrganica1: String(getCol(row, 'CLAVE_ORGANICA_1') ?? ''),
        claveOrganica2: getCol(row, 'CLAVE_ORGANICA_2') != null ? String(getCol(row, 'CLAVE_ORGANICA_2')) : null,
        claveOrganica3: getCol(row, 'CLAVE_ORGANICA_3') != null ? String(getCol(row, 'CLAVE_ORGANICA_3')) : null,
        periodo: String(getCol(row, 'PERIODO') ?? ''),
        fechaGeneracion: getCol(row, 'FECHA_GENERACION') ? new Date(getCol(row, 'FECHA_GENERACION')) : null,
        userAlta: getCol(row, 'USER_ALTA') != null ? String(getCol(row, 'USER_ALTA')) : null,
        tipo: String(getCol(row, 'TIPO') ?? '').trim()
      });

      const todosMapeados = (filasBrutas || []).map(mapRow);
      const registrosExistentes = todosMapeados.filter((r) => {
        const r2 = (r.claveOrganica2 ?? '').trim().padStart(2, '0');
        const r3 = (r.claveOrganica3 ?? '').trim().padStart(2, '0');
        const p = (r.periodo ?? '').trim().padStart(4, '0');
        return r2 === clave2 && r3 === clave3 && p === periodoStr;
      });

      const tiposExistentes = new Set(registrosExistentes.map(r => r.tipo.toUpperCase().trim()));
      const tiposAFaltantes = tiposRequeridos.filter(t => !tiposExistentes.has(t));

      logger.info({
        ...logContext,
        filasOrgPeriodo: filasBrutas?.length ?? 0,
        filasMismaClave: registrosExistentes.length,
        tiposEncontrados: [...tiposExistentes],
        tiposAFaltantes
      }, 'Estado después de consultar existentes');

      if (tiposAFaltantes.length > 0) {
        logger.info({
          ...logContext,
          existentes: registrosExistentes.length,
          tiposAFaltantes
        }, 'Insertando solo los tipos que faltan');
      }

      const registrosCreados: RetencionPorCobrar[] = [...registrosExistentes];

      for (const tipo of tiposAFaltantes) {
        const fechaGeneracion = new Date();
        const sql = `
          INSERT INTO ORGANICAS_INT_MORATORIO_GEN 
            (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
             PERIODO, FECHA_GENERACION, USER_ALTA, TIPO)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [clave0, clave1, clave2, clave3, periodoStr, fechaGeneracion, userAltaStr, tipo];

        logger.debug({ ...logContext, tipo }, 'Insertando registro');

        try {
          await executeQueryInTransaction(transaction, sql, params);
          registrosCreados.push({
            claveOrganica0: clave0,
            claveOrganica1: clave1,
            claveOrganica2: clave2,
            claveOrganica3: clave3,
            periodo: periodoStr,
            fechaGeneracion,
            userAlta: userAltaStr,
            tipo
          });
        } catch (error: any) {
          logger.error({ ...logContext, tipo, error: error.message || String(error), stack: error.stack }, 'Error insertando registro');
          throw new RetencionesPorCobrarError(
            `Error al insertar registro ${tipo} en ORGANICAS_INT_MORATORIO_GEN: ${error.message || String(error)}`,
            RetencionesPorCobrarErrorCode.FIREBIRD_QUERY_ERROR
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        totalRegistros: registrosCreados.length,
        insertados: tiposAFaltantes.length,
        duracionMs: duration
      }, 'Retenciones moratorio creadas/actualizadas');

      return registrosCreados;
    });
  }
}

