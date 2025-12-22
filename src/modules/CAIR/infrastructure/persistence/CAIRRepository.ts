import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import { ICAIRRepository } from '../../domain/repositories/ICAIRRepository.js';
import { DevueltoTipo } from '../../domain/entities/DevueltoTipo.js';
import { ChequeLeyenda } from '../../domain/entities/ChequeLeyenda.js';
import { SARDevolucion } from '../../domain/entities/SARDevolucion.js';
import { CAIRError, CAIRErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'CAIRRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class CAIRRepository implements ICAIRRepository {
  async getDevueltoTipos(): Promise<DevueltoTipo[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getDevueltoTipos'
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        r.TIPO, 
        r.DESCRIPCION, 
        r.GENERA_CHEQUE, 
        r.STATUS
      FROM SAR_DEVUELTO_TIPOS r
    `;

    return executeSerializedQuery((db) => {
      return new Promise<DevueltoTipo[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando consulta a SAR_DEVUELTO_TIPOS');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new CAIRError(
            'Conexión a Firebird no disponible o inválida',
            CAIRErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [],
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
                reject(new CAIRError(
                  `Error al ejecutar consulta SAR_DEVUELTO_TIPOS: ${err.message || String(err)}`,
                  CAIRErrorCode.FIREBIRD_QUERY_ERROR
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

              const tipos: DevueltoTipo[] = decodedResult.map((row: any) => ({
                tipo: String(row.TIPO || ''),
                descripcion: String(row.DESCRIPCION || ''),
                generaCheque: String(row.GENERA_CHEQUE || ''),
                status: String(row.STATUS || '')
              }));

              logger.info({
                ...logContext,
                recordCount: tipos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(tipos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando consulta');
          reject(new CAIRError(
            `Error síncrono al ejecutar consulta SAR_DEVUELTO_TIPOS: ${syncError.message || String(syncError)}`,
            CAIRErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getChequesLeyendas(): Promise<ChequeLeyenda[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getChequesLeyendas'
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        r.CVE_LEYENDA, 
        r.LEYENDA
      FROM CHEQUES_LEYENDAS_CAT r
      WHERE r.STATUS = 'A'
    `;

    return executeSerializedQuery((db) => {
      return new Promise<ChequeLeyenda[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando consulta a CHEQUES_LEYENDAS_CAT');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new CAIRError(
            'Conexión a Firebird no disponible o inválida',
            CAIRErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [],
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
                reject(new CAIRError(
                  `Error al ejecutar consulta CHEQUES_LEYENDAS_CAT: ${err.message || String(err)}`,
                  CAIRErrorCode.FIREBIRD_QUERY_ERROR
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

              const leyendas: ChequeLeyenda[] = decodedResult.map((row: any) => ({
                cveLeyenda: String(row.CVE_LEYENDA || ''),
                leyenda: String(row.LEYENDA || '')
              }));

              logger.info({
                ...logContext,
                recordCount: leyendas.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(leyendas);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando consulta');
          reject(new CAIRError(
            `Error síncrono al ejecutar consulta CHEQUES_LEYENDAS_CAT: ${syncError.message || String(syncError)}`,
            CAIRErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getSARDevolucion(interno: string, tipo: string): Promise<SARDevolucion[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getSARDevolucion',
      interno,
      tipo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.NO_APORTA, 
        p.APORTACION, 
        p.APORTACION_INTERES, 
        p.VOLUNTARIO,
        p.VOLUNTARIO_INTERES, 
        p.RECUPERADO, 
        p.INTERES, 
        p.TOTAL, 
        p.ERROR, 
        p.NERROR
      FROM SAR_DEVOLUCION(?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<SARDevolucion[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado SAR_DEVOLUCION');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new CAIRError(
            'Conexión a Firebird no disponible o inválida',
            CAIRErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [interno, tipo],
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
                }, 'Error ejecutando procedimiento');
                reject(new CAIRError(
                  `Error al ejecutar procedimiento SAR_DEVOLUCION: ${err.message || String(err)}`,
                  CAIRErrorCode.FIREBIRD_QUERY_ERROR
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

              const devoluciones: SARDevolucion[] = decodedResult.map((row: any) => ({
                noAporta: Number(row.NO_APORTA || 0),
                aportacion: Number(row.APORTACION || 0),
                aportacionInteres: Number(row.APORTACION_INTERES || 0),
                voluntario: Number(row.VOLUNTARIO || 0),
                voluntarioInteres: Number(row.VOLUNTARIO_INTERES || 0),
                recuperado: Number(row.RECUPERADO || 0),
                interes: Number(row.INTERES || 0),
                total: Number(row.TOTAL || 0),
                error: String(row.ERROR || ''),
                nerror: String(row.NERROR || '')
              }));

              logger.info({
                ...logContext,
                recordCount: devoluciones.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(devoluciones);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new CAIRError(
            `Error síncrono al ejecutar procedimiento SAR_DEVOLUCION: ${syncError.message || String(syncError)}`,
            CAIRErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }
}

