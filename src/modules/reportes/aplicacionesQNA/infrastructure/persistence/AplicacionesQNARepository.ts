import { executeSerializedQuery } from '../../../../../db/firebird.js';
import { getPool, sql } from '../../../../../db/mssql.js';
import { IAplicacionesQNARepository, PeriodoTrabajo } from '../../domain/repositories/IAplicacionesQNARepository.js';
import { MovimientoQuincenal } from '../../domain/entities/MovimientoQuincenal.js';
import { AplicacionAportaciones } from '../../domain/entities/AplicacionAportaciones.js';
import { AplicacionPCP } from '../../domain/entities/AplicacionPCP.js';
import { AplicacionPMP } from '../../domain/entities/AplicacionPMP.js';
import { AplicacionHIP } from '../../domain/entities/AplicacionHIP.js';
import { Concentrado } from '../../domain/entities/Concentrado.js';
import { AplicacionesQNAError, AplicacionesQNAErrorCode } from '../../domain/errors.js';
import pino from 'pino';
import { decodeFirebirdObject } from '../../../../../db/firebird.js';

const logger = pino({
  name: 'AplicacionesQNARepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AplicacionesQNARepository implements IAplicacionesQNARepository {
  async getMovimientosQuincenales(periodo: string, pOrg0: string, pOrg1: string): Promise<MovimientoQuincenal[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getMovimientosQuincenales',
      periodo,
      pOrg0,
      pOrg1
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.CONSECUTIVO, 
        p.CVE_MOVIMIENTO, 
        p.NOM_MOVIMIENTO, 
        p.NOMBRE,
        p.NOEMPLEADO, 
        p.RFC, 
        p.S_A, 
        p.OP_A, 
        p.Q_A, 
        p.S_N, 
        p.OP_N, 
        p.Q_N,
        p.RETROACTIVAS, 
        p.S_R, 
        p.OP_R, 
        p.Q_R, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3,
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.USUARIO, 
        p.FREALM
      FROM HISTORIAL_MOVIMIENTOS_QUIN_IND(?, ?, ?) p
    `;

    // Primero obtener los datos base
    const movimientosBase = await executeSerializedQuery((db) => {
      return new Promise<MovimientoQuincenal[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado HISTORIAL_MOVIMIENTOS_QUIN_IND');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodo, pOrg0, pOrg1],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN_IND: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron movimientos');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados base');

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));
              
              // Log temporal para debugging
              if (decodedResult.length > 0) {
                logger.debug({ ...logContext, primerRegistro: decodedResult[0] }, 'Primer registro decodificado');
              }

              // Mapear datos base
              const movimientos: MovimientoQuincenal[] = decodedResult.map((row: any) => ({
                interno: row.INTERNO || 0,
                consecutivo: row.CONSECUTIVO || 0,
                cveMovimiento: String(row.CVE_MOVIMIENTO || ''),
                nomMovimiento: String(row.NOM_MOVIMIENTO || ''),
                nombre: String(row.NOMBRE || ''),
                noEmpleado: String(row.NOEMPLEADO || ''),
                rfc: String(row.RFC || ''),
                sA: Number(row.S_A || 0),
                opA: Number(row.OP_A || 0),
                qA: Number(row.Q_A || 0),
                sN: Number(row.S_N || 0),
                opN: Number(row.OP_N || 0),
                qN: Number(row.Q_N || 0),
                retroactivas: Number(row.RETROACTIVAS || 0),
                sR: Number(row.S_R || 0),
                opR: Number(row.OP_R || 0),
                qR: Number(row.Q_R || 0),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                usuario: String(row.USUARIO || ''),
                fRealm: String(row.FREALM || ''),
                // Inicializar campos nuevos como null
                sexo: null,
                fechaNacimiento: null,
                periodos: null,
                anios: null,
                meses: null,
                dias: null,
                amd: null
              }));

              resolve(movimientos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento HISTORIAL_MOVIMIENTOS_QUIN_IND: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });

    // Si no hay movimientos, retornar vacío
    if (movimientosBase.length === 0) {
      return movimientosBase;
    }

    // Enriquecer movimientos con datos de PERSONAL y antigüedad usando batch loading
    // OPTIMIZACIÓN: En lugar de hacer 2 consultas por cada movimiento (N+1 pattern),
    // hacemos batch loading: obtenemos todos los datos en 2 consultas totales
    logger.info({ ...logContext, totalRegistros: movimientosBase.length }, 'Enriqueciendo movimientos con datos de PERSONAL y antigüedad (batch loading)');
    
    // Obtener todos los internos únicos
    const internosUnicos = [...new Set(movimientosBase.map(m => m.interno))];
    
    // Batch loading: obtener todos los datos de PERSONAL y antigüedad en 2 consultas
    const [datosPersonalMap, datosAntiguedadMap] = await Promise.all([
      this.obtenerDatosPersonalBatch(internosUnicos),
      this.obtenerAntiguedadBatch(internosUnicos)
    ]);
    
    // Combinar datos usando los mapas para lookup O(1)
    const movimientosEnriquecidos: MovimientoQuincenal[] = movimientosBase.map(movimiento => {
      const datosPersonal = datosPersonalMap.get(movimiento.interno) || { sexo: null, fechaNacimiento: null };
      const datosAntiguedad = datosAntiguedadMap.get(movimiento.interno) || {
        periodos: null,
        anios: null,
        meses: null,
        dias: null,
        amd: null
      };
      
      return {
        ...movimiento,
        sexo: datosPersonal.sexo,
        fechaNacimiento: datosPersonal.fechaNacimiento,
        periodos: datosAntiguedad.periodos,
        anios: datosAntiguedad.anios,
        meses: datosAntiguedad.meses,
        dias: datosAntiguedad.dias,
        amd: datosAntiguedad.amd
      };
    });

    logger.info({
      ...logContext,
      recordCount: movimientosEnriquecidos.length,
      duracionMs: Date.now() - startTime
    }, 'Consulta completada exitosamente con datos enriquecidos');

    return movimientosEnriquecidos;
  }

  /**
   * Obtiene datos de PERSONAL (SEXO y FECHA_NACIMIENTO) por INTERNO - BATCH VERSION
   * Retorna un Map<interno, {sexo, fechaNacimiento}> para lookup O(1)
   */
  private async obtenerDatosPersonalBatch(internos: number[]): Promise<Map<number, { sexo: string | null; fechaNacimiento: string | null }>> {
    const logContext = {
      operation: 'obtenerDatosPersonalBatch',
      totalInternos: internos.length
    };

    const resultado = new Map<number, { sexo: string | null; fechaNacimiento: string | null }>();

    if (internos.length === 0) {
      return resultado;
    }

    try {
      // Firebird no soporta IN con muchos parámetros, así que procesamos en lotes de 100
      const BATCH_SIZE = 100;
      const lotes = [];
      for (let i = 0; i < internos.length; i += BATCH_SIZE) {
        lotes.push(internos.slice(i, i + BATCH_SIZE));
      }

      for (const lote of lotes) {
        // Construir SQL con parámetros dinámicos
        const placeholders = lote.map(() => '?').join(',');
        const sql = `SELECT INTERNO, SEXO, FECHA_NACIMIENTO FROM PERSONAL WHERE INTERNO IN (${placeholders})`;

        await executeSerializedQuery((db) => {
          return new Promise<void>((resolve, reject) => {
            db.query(
              sql,
              lote,
              (err: any, result: any) => {
                if (err) {
                  logger.warn({
                    ...logContext,
                    error: err.message || String(err),
                    loteSize: lote.length
                  }, 'Error al consultar PERSONAL en batch, continuando con nulls');
                  resolve();
                  return;
                }

                if (result && result.length > 0) {
                  result.forEach((row: any) => {
                    const decoded = decodeFirebirdObject(row);
                    const interno = Number(decoded.INTERNO);
                    const sexo = decoded.SEXO ? String(decoded.SEXO) : null;
                    const fechaNacimiento = decoded.FECHA_NACIMIENTO 
                      ? (decoded.FECHA_NACIMIENTO instanceof Date 
                          ? decoded.FECHA_NACIMIENTO.toISOString().split('T')[0] 
                          : String(decoded.FECHA_NACIMIENTO))
                      : null;
                    
                    resultado.set(interno, { sexo, fechaNacimiento });
                  });
                }

                resolve();
              }
            );
          });
        });
      }

      logger.debug({
        ...logContext,
        registrosEncontrados: resultado.size
      }, 'Batch loading de PERSONAL completado');

      return resultado;
    } catch (error: any) {
      logger.warn({
        ...logContext,
        error: error.message || String(error)
      }, 'Excepción al consultar PERSONAL en batch, retornando mapa vacío');
      return resultado;
    }
  }

  /**
   * Obtiene datos de antigüedad ejecutando DP_ANTIGUEDAD_IND - BATCH VERSION
   * Retorna un Map<interno, {periodos, anios, meses, dias, amd}> para lookup O(1)
   * Nota: Como DP_ANTIGUEDAD_IND es un stored procedure que acepta un solo INTERNO,
   * ejecutamos múltiples llamadas en paralelo (limitado por executeSerializedQuery)
   */
  private async obtenerAntiguedadBatch(internos: number[]): Promise<Map<number, {
    periodos: number | null;
    anios: number | null;
    meses: number | null;
    dias: number | null;
    amd: string | null;
  }>> {
    const logContext = {
      operation: 'obtenerAntiguedadBatch',
      totalInternos: internos.length
    };

    const resultado = new Map<number, {
      periodos: number | null;
      anios: number | null;
      meses: number | null;
      dias: number | null;
      amd: string | null;
    }>();

    if (internos.length === 0) {
      return resultado;
    }

    try {
      // Como DP_ANTIGUEDAD_IND solo acepta un INTERNO, ejecutamos secuencialmente
      // pero agrupamos en una sola transacción serializada para mejor rendimiento
      const sql = `SELECT p.PERIODOS, p.ANIOS, p.MESES, p.DIAS, p.AMD FROM DP_ANTIGUEDAD_IND(?) p`;

      // Ejecutar todas las consultas en una sola transacción serializada
      await executeSerializedQuery(async (db) => {
        for (const interno of internos) {
          try {
            await new Promise<void>((resolve, reject) => {
              db.query(
                sql,
                [interno],
                (err: any, result: any) => {
                  if (err) {
                    logger.debug({
                      ...logContext,
                      interno,
                      error: err.message || String(err)
                    }, 'Error al ejecutar DP_ANTIGUEDAD_IND para interno, usando nulls');
                    resultado.set(interno, {
                      periodos: null,
                      anios: null,
                      meses: null,
                      dias: null,
                      amd: null
                    });
                    resolve();
                    return;
                  }

                  if (!result || result.length === 0) {
                    resultado.set(interno, {
                      periodos: null,
                      anios: null,
                      meses: null,
                      dias: null,
                      amd: null
                    });
                    resolve();
                    return;
                  }

                  const row = decodeFirebirdObject(result[0]);
                  resultado.set(interno, {
                    periodos: row.PERIODOS != null ? Number(row.PERIODOS) : null,
                    anios: row.ANIOS != null ? Number(row.ANIOS) : null,
                    meses: row.MESES != null ? Number(row.MESES) : null,
                    dias: row.DIAS != null ? Number(row.DIAS) : null,
                    amd: row.AMD ? String(row.AMD) : null
                  });
                  resolve();
                }
              );
            });
          } catch (error: any) {
            logger.debug({
              ...logContext,
              interno,
              error: error.message || String(error)
            }, 'Excepción al ejecutar DP_ANTIGUEDAD_IND para interno, usando nulls');
            resultado.set(interno, {
              periodos: null,
              anios: null,
              meses: null,
              dias: null,
              amd: null
            });
          }
        }
      });

      logger.debug({
        ...logContext,
        registrosEncontrados: resultado.size
      }, 'Batch loading de antigüedad completado');

      return resultado;
    } catch (error: any) {
      logger.warn({
        ...logContext,
        error: error.message || String(error)
      }, 'Excepción al ejecutar DP_ANTIGUEDAD_IND en batch, retornando mapa vacío');
      return resultado;
    }
  }

  async getAplicacionAportaciones(pOrg0: string, pOrg1: string, periodo: string): Promise<AplicacionAportaciones[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionAportaciones',
      pOrg0,
      pOrg1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.SUELDOM, 
        p.OTRAS_PRESTACIONES, 
        p.QUINQUENIOS,
        p.SUELDOQ, 
        p.OPQ, 
        p.QQ, 
        p.SARE, 
        p.FRA, 
        p.FRE, 
        p.FHE, 
        p.FVE, 
        p.FAA, 
        p.FAE,
        p.FAT, 
        p.FAI, 
        p.SFRA, 
        p.SFRE, 
        p.SFHE, 
        p.SFVE, 
        p.SFAA, 
        p.SFAE, 
        p.SFAT,
        p.SFAI, 
        p.TFRA, 
        p.TFRE, 
        p.TFHE, 
        p.TFVE, 
        p.TFAA, 
        p.TFAE, 
        p.TFAT, 
        p.TFAI,
        p.ORG0, 
        p.ORG1, 
        p.RFC
      FROM AP_P_FONDOS(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionAportaciones[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_P_FONDOS');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, periodo],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_P_FONDOS: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron aportaciones');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const aportaciones: AplicacionAportaciones[] = decodedResult.map((row: any) => {
                // Mapear datos del histórico
                const registro: AplicacionAportaciones = {
                  interno: row.INTERNO || 0,
                  nombre: String(row.NOMBRE || ''),
                  sueldom: Number(row.SUELDOM || 0),
                  otrasPrestaciones: Number(row.OTRAS_PRESTACIONES || 0),
                  quinquenios: Number(row.QUINQUENIOS || 0),
                  sueldoq: Number(row.SUELDOQ || 0),
                  opq: Number(row.OPQ || 0),
                  qq: Number(row.QQ || 0),
                  sare: Number(row.SARE || 0),
                  fra: Number(row.FRA || 0),
                  fre: Number(row.FRE || 0),
                  fhe: Number(row.FHE || 0),
                  fve: Number(row.FVE || 0),
                  faa: Number(row.FAA || 0),
                  fae: Number(row.FAE || 0),
                  fat: Number(row.FAT || 0),
                  fai: Number(row.FAI || 0),
                  sFra: Number(row.SFRA || 0),
                  sFre: Number(row.SFRE || 0),
                  sFhe: Number(row.SFHE || 0),
                  sFve: Number(row.SFVE || 0),
                  sFaa: Number(row.SFAA || 0),
                  sFae: Number(row.SFAE || 0),
                  sFat: Number(row.SFAT || 0),
                  sFai: Number(row.SFAI || 0),
                  tFra: Number(row.TFRA || 0),
                  tFre: Number(row.TFRE || 0),
                  tFhe: Number(row.TFHE || 0),
                  tFve: Number(row.TFVE || 0),
                  tFaa: Number(row.TFAA || 0),
                  tFae: Number(row.TFAE || 0),
                  tFat: Number(row.TFAT || 0),
                  tFai: Number(row.TFAI || 0),
                  org0: String(row.ORG0 || ''),
                  org1: String(row.ORG1 || ''),
                  rfc: String(row.RFC || '')
                };

                // Aplicar cálculos de aportaciones
                return this.calcularAportacionesDesdeHistorico(registro);
              });

              logger.info({
                ...logContext,
                recordCount: aportaciones.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente con cálculos de aportaciones');

              resolve(aportaciones);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_P_FONDOS: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionPCP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPCP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionPCP',
      pOrg0,
      pOrg1,
      pPeriodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C,
        p.FECHA_C, 
        p.CAPITAL, 
        p.INTERES, 
        p.MONTO, 
        p.MORATORIOS, 
        p.TOTAL,
        p.RESULTADO, 
        p.TD, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1,
        p.NORG2, 
        p.NORG3
      FROM AP_S_PCP(?, ?, ?) p
    `;

    try {
      return await executeSerializedQuery((db) => {
      return new Promise<AplicacionPCP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_PCP');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, pPeriodo],
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
                
                // Detectar errores de conexión específicos
                const errorCode = err.code || '';
                const errorMessage = err.message || String(err);
                
                if (errorCode === 'ECONNREFUSED' || 
                    errorMessage.includes('ECONNREFUSED') || 
                    errorMessage.includes('connection refused') ||
                    errorMessage.includes('No se pudo conectar') ||
                    errorMessage.includes('Conexión a Firebird no disponible')) {
                  reject(new AplicacionesQNAError(
                    `Error de conexión con Firebird: ${errorMessage}`,
                    AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR,
                    503
                  ));
                  return;
                }
                
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_PCP: ${errorMessage}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos PCP');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Log del primer registro RAW para diagnóstico
              if (result.length > 0) {
                logger.info({ 
                  ...logContext, 
                  primerRegistroRaw: result[0],
                  keysRaw: Object.keys(result[0] || {})
                }, 'Primer registro RAW de Firebird');
              }

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              // Log del primer registro después de decodificar
              if (decodedResult.length > 0) {
                logger.info({ 
                  ...logContext, 
                  primerRegistroDecodificado: decodedResult[0],
                  keysDecodificado: Object.keys(decodedResult[0] || {})
                }, 'Primer registro después de decodificar');
              }

              // Helper para formatear fechas de Firebird
              const formatFirebirdDate = (dateValue: any): string => {
                if (!dateValue) return '';
                if (dateValue instanceof Date) {
                  // Formatear como YYYY-MM-DD
                  const year = dateValue.getFullYear();
                  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                  const day = String(dateValue.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                }
                if (typeof dateValue === 'string') {
                  // Si ya es string, intentar parsearlo y formatearlo
                  const parsed = new Date(dateValue);
                  if (!isNaN(parsed.getTime())) {
                    const year = parsed.getFullYear();
                    const month = String(parsed.getMonth() + 1).padStart(2, '0');
                    const day = String(parsed.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                  return dateValue;
                }
                return String(dateValue);
              };

              const prestamos: AplicacionPCP[] = decodedResult.map((row: any, index: number) => {
                // Log para diagnóstico si el objeto está vacío o tiene problemas
                const rowKeys = Object.keys(row || {});
                if (rowKeys.length === 0 || (!row.INTERNO && !row.interno)) {
                  logger.warn({ 
                    ...logContext, 
                    index,
                    rowKeys,
                    rowSample: JSON.stringify(row).substring(0, 500),
                    allRowValues: row
                  }, 'Registro con posibles problemas en mapeo');
                }

                return {
                  interno: row.INTERNO || row.interno || 0,
                  rfc: String(row.RFC || row.rfc || ''),
                  nombre: String(row.NOMBRE || row.nombre || ''),
                  prestamo: String(row.PRESTAMO || row.prestamo || ''),
                  letra: Number(row.LETRA || row.letra || 0),
                  plazo: Number(row.PLAZO || row.plazo || 0),
                  periodoC: String(row.PERIODO_C || row.periodo_c || row.PERIODOC || ''),
                  fechaC: formatFirebirdDate(row.FECHA_C || row.fecha_c || row.FECHAC),
                  capital: Number(row.CAPITAL || row.capital || 0),
                  interes: Number(row.INTERES || row.interes || 0),
                  monto: Number(row.MONTO || row.monto || 0),
                  moratorios: Number(row.MORATORIOS || row.moratorios || 0),
                  total: Number(row.TOTAL || row.total || 0),
                  resultado: String(row.RESULTADO || row.resultado || ''),
                  td: String(row.TD || row.td || ''),
                  org0: String(row.ORG0 || row.org0 || ''),
                  org1: String(row.ORG1 || row.org1 || ''),
                  org2: String(row.ORG2 || row.org2 || ''),
                  org3: String(row.ORG3 || row.org3 || ''),
                  nOrg0: String(row.NORG0 || row.norg0 || row.NORG_0 || ''),
                  nOrg1: String(row.NORG1 || row.norg1 || row.NORG_1 || ''),
                  nOrg2: String(row.NORG2 || row.norg2 || row.NORG_2 || ''),
                  nOrg3: String(row.NORG3 || row.norg3 || row.NORG_3 || '')
                };
              });

              // Log de muestra del primer préstamo mapeado
              if (prestamos.length > 0) {
                logger.info({
                  ...logContext,
                  primerPrestamoMapeado: prestamos[0],
                  totalCampos: Object.keys(prestamos[0] || {}).length
                }, 'Primer préstamo después del mapeo');
              }

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            errorCode: syncError.code,
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          
          // Detectar errores de conexión específicos
          const errorCode = syncError.code || '';
          const errorMessage = syncError.message || String(syncError);
          
          if (errorCode === 'ECONNREFUSED' || 
              errorMessage.includes('ECONNREFUSED') || 
              errorMessage.includes('connection refused') ||
              errorMessage.includes('No se pudo conectar') ||
              errorMessage.includes('Conexión a Firebird no disponible')) {
            reject(new AplicacionesQNAError(
              `Error de conexión con Firebird: ${errorMessage}`,
              AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR,
              503
            ));
            return;
          }
          
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_PCP: ${errorMessage}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        errorCode: error.code,
        stack: error.stack,
        duracionMs: duration
      }, 'Error al ejecutar consulta serializada');
      
      // Detectar errores de conexión específicos
      const errorCode = error.code || '';
      const errorMessage = error.message || String(error);
      
      if (errorCode === 'ECONNREFUSED' || 
          errorMessage.includes('ECONNREFUSED') || 
          errorMessage.includes('connection refused') ||
          errorMessage.includes('No se pudo conectar') ||
          errorMessage.includes('Conexión a Firebird no disponible') ||
          errorMessage.includes('Base de datos Firebird no conectada')) {
        throw new AplicacionesQNAError(
          `Error de conexión con Firebird: ${errorMessage}`,
          AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR,
          503
        );
      }
      
      // Re-lanzar otros errores
      throw error;
    }
  }

  async getAplicacionPMP(pOrg0: string, pOrg1: string, pPeriodo: string): Promise<AplicacionPMP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionPMP',
      pOrg0,
      pOrg1,
      pPeriodo
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C,
        p.FECHA_C, 
        p.CAPITAL, 
        p.MORATORIOS, 
        p.INTERES, 
        p.SEGURO, 
        p.TOTAL,
        p.RESULTADO, 
        p.CLASE, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1,
        p.NORG2, 
        p.NORG3, 
        p.DESC_CLASE, 
        p.DESC_PRESTAMO, 
        p.CLAVE_P, 
        p.NOEMPLE,
        p.FOLIO, 
        p.ANIO, 
        p.PO, 
        p.FECHA_ORIGEN
      FROM AP_S_VIV(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionPMP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_VIV');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [pOrg0, pOrg1, pPeriodo],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_VIV: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos PMP');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const prestamos: AplicacionPMP[] = decodedResult.map((row: any) => ({
                interno: row.INTERNO || 0,
                rfc: String(row.RFC || ''),
                nombre: String(row.NOMBRE || ''),
                prestamo: String(row.PRESTAMO || ''),
                letra: Number(row.LETRA || 0),
                plazo: Number(row.PLAZO || 0),
                periodoC: String(row.PERIODO_C || ''),
                fechaC: String(row.FECHA_C || ''),
                capital: Number(row.CAPITAL || 0),
                moratorios: Number(row.MORATORIOS || 0),
                interes: Number(row.INTERES || 0),
                seguro: Number(row.SEGURO || 0),
                total: Number(row.TOTAL || 0),
                resultado: String(row.RESULTADO || ''),
                clase: String(row.CLASE || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                descClase: String(row.DESC_CLASE || ''),
                descPrestamo: String(row.DESC_PRESTAMO || ''),
                claveP: String(row.CLAVE_P || ''),
                noEmple: String(row.NOEMPLE || ''),
                folio: String(row.FOLIO || ''),
                anio: Number(row.ANIO || 0),
                po: String(row.PO || ''),
                fechaOrigen: String(row.FECHA_ORIGEN || '')
              }));

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_VIV: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getAplicacionHIP(org0: string, org1: string, quincena: string): Promise<AplicacionHIP[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAplicacionHIP',
      org0,
      org1,
      quincena
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.NOEMPLEADO, 
        p.CANTIDAD, 
        p.STATUS, 
        p.REFERENCIA_1,
        p.REFERENCIA_2, 
        p.CAPITAL_PAGAR, 
        p.INTERES_PAGAR, 
        p.INTERES_DIFERIDO_PAGAR,
        p.SEGURO_PAGAR, 
        p.MORATORIO_PAGAR, 
        p.PNO_SOLICITUD, 
        p.PANO,
        p.PCLAVE_CLASE_PRESTAMO, 
        p.PDESCRIPCION, 
        p.RFC, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.PCLAVE_PRESTAMO,
        p.PRESTAMO_DESC, 
        p.TIPO, 
        p.PERIODO_C, 
        p.DESCTO, 
        p.FECHA_C, 
        p.RESULTADO,
        p.PO, 
        p.FECHA_ORIGEN, 
        p.PLAZO
      FROM AP_S_HIP_QNA(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AplicacionHIP[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado AP_S_HIP_QNA');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [org0, org1, quincena],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento AP_S_HIP_QNA: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              if (result.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron préstamos hipotecarios');
                resolve([]);
                return;
              }

              logger.info({ ...logContext, totalRegistros: result.length }, 'Mapeando resultados');

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = result.map((row: any) => decodeFirebirdObject(row));

              const prestamos: AplicacionHIP[] = decodedResult.map((row: any) => ({
                interno: row.INTERNO || 0,
                nombre: String(row.NOMBRE || ''),
                noEmpleado: String(row.NOEMPLEADO || ''),
                cantidad: Number(row.CANTIDAD || 0),
                status: String(row.STATUS || ''),
                referencia1: String(row.REFERENCIA_1 || ''),
                referencia2: String(row.REFERENCIA_2 || ''),
                capitalPagar: Number(row.CAPITAL_PAGAR || 0),
                interesPagar: Number(row.INTERES_PAGAR || 0),
                interesDiferidoPagar: Number(row.INTERES_DIFERIDO_PAGAR || 0),
                seguroPagar: Number(row.SEGURO_PAGAR || 0),
                moratorioPagar: Number(row.MORATORIO_PAGAR || 0),
                pnoSolicitud: String(row.PNO_SOLICITUD || ''),
                pano: Number(row.PANO || 0),
                pclaveClasePrestamo: String(row.PCLAVE_CLASE_PRESTAMO || ''),
                pdescripcion: String(row.PDESCRIPCION || ''),
                rfc: String(row.RFC || ''),
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: String(row.ORG2 || ''),
                org3: String(row.ORG3 || ''),
                nOrg0: String(row.NORG0 || ''),
                nOrg1: String(row.NORG1 || ''),
                nOrg2: String(row.NORG2 || ''),
                nOrg3: String(row.NORG3 || ''),
                pclavePrestamo: String(row.PCLAVE_PRESTAMO || ''),
                prestamoDesc: String(row.PRESTAMO_DESC || ''),
                tipo: String(row.TIPO || ''),
                periodoC: String(row.PERIODO_C || ''),
                descto: Number(row.DESCTO || 0),
                fechaC: String(row.FECHA_C || ''),
                resultado: String(row.RESULTADO || ''),
                po: String(row.PO || ''),
                fechaOrigen: String(row.FECHA_ORIGEN || ''),
                plazo: Number(row.PLAZO || 0)
              }));

              logger.info({
                ...logContext,
                recordCount: prestamos.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(prestamos);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento AP_S_HIP_QNA: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getConcentrado(org0: string, org1: string, org2: string, org3: string, periodo: string): Promise<Concentrado[]> {
    const startTime = Date.now();
    
    // Asegurar que el período tenga exactamente 4 caracteres (formato esperado por Firebird)
    const periodoFormateado = String(periodo || '').trim().substring(0, 4).padStart(4, '0');
    
    const logContext = {
      operation: 'getConcentrado',
      org0,
      org1,
      org2,
      org3,
      periodo,
      periodoFormateado
    };

    logger.info(logContext, 'Iniciando consulta serializada');

    const sql = `
      SELECT 
        p.TIPO, 
        p.CONCEPTO, 
        p.PARCIAL, 
        p.TOTAL, 
        p.TIPO_FONDO
      FROM ADEUDO_ORGANICA_LAYOUT(?, ?, ?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<Concentrado[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando procedimiento almacenado ADEUDO_ORGANICA_LAYOUT');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionesQNAError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionesQNAErrorCode.FIREBIRD_CONNECTION_ERROR
          ));
          return;
        }

        try {
          db.query(
            sql,
            [org0, org1, org2, org3, periodoFormateado],
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
                reject(new AplicacionesQNAError(
                  `Error al ejecutar procedimiento ADEUDO_ORGANICA_LAYOUT: ${err.message || String(err)}`,
                  AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
                ));
                return;
              }

              if (!result) {
                logger.warn({ ...logContext, duracionMs: duration }, 'Resultado nulo recibido');
                resolve([]);
                return;
              }

              // Asegurar que el resultado sea un array
              const records = Array.isArray(result) ? result : [result];
              
              if (records.length === 0) {
                logger.info({ ...logContext, duracionMs: duration }, 'No se encontraron registros de concentrado');
                resolve([]);
                return;
              }

              // Decodificar los records de Firebird ANTES del mapeo
              const decodedRecords = records.map(record => decodeFirebirdObject(record));

              logger.info({ 
                ...logContext, 
                totalRegistros: decodedRecords.length, 
                tipoResultado: Array.isArray(result) ? 'array' : typeof result,
                primerRegistro: decodedRecords.length > 0 ? decodedRecords[0] : null,
                keys: decodedRecords.length > 0 ? Object.keys(decodedRecords[0]) : []
              }, 'Mapeando resultados');

              const concentrados: Concentrado[] = decodedRecords.map((row: any, index: number) => {
                try {
                  // Log detallado del primer registro para debugging
                  if (index === 0) {
                    logger.info({ 
                      ...logContext, 
                      rowRaw: row,
                      rowKeys: Object.keys(row),
                      rowTIPO: row.TIPO,
                      rowCONCEPTO: row.CONCEPTO,
                      rowPARCIAL: row.PARCIAL,
                      rowTOTAL: row.TOTAL,
                      rowTIPO_FONDO: row.TIPO_FONDO
                    }, 'Primer registro raw de Firebird');
                  }
                  
                  // Mapear campos directamente - Firebird retorna en mayúsculas con lowercase_keys: false
                  const mapped: Concentrado = {
                    tipo: String(row.TIPO || ''),
                    concepto: String(row.CONCEPTO || ''),
                    parcial: Number(row.PARCIAL || 0),
                    total: Number(row.TOTAL || 0),
                    tipoFondo: String(row.TIPO_FONDO || '')
                  };
                  
                  // Log del primer registro mapeado
                  if (index === 0) {
                    logger.info({ ...logContext, mapped, mappedKeys: Object.keys(mapped) }, 'Primer registro mapeado');
                  }

                  // CREAR COPIA PROFUNDA para asegurar que las referencias se mantengan
                  // Esto resuelve el problema de serialización de Fastify
                  const safeMapped = JSON.parse(JSON.stringify(mapped));
                  
                  return safeMapped;
                } catch (error: any) {
                  logger.error({
                    ...logContext,
                    index,
                    error: error.message,
                    row: row,
                    stack: error.stack
                  }, 'Error mapeando registro');
                  // Retornar objeto vacío si hay error en el mapeo
                  return {
                    tipo: '',
                    concepto: '',
                    parcial: 0,
                    total: 0,
                    tipoFondo: ''
                  };
                }
              });

              logger.info({
                ...logContext,
                recordCount: concentrados.length,
                duracionMs: duration,
                primerConcentrado: concentrados.length > 0 ? concentrados[0] : null,
                todosConcentrados: JSON.stringify(concentrados),
                todosConcentradosKeys: concentrados.length > 0 ? concentrados.map(c => Object.keys(c)) : []
              }, 'Consulta completada exitosamente');

              resolve(concentrados);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando procedimiento');
          reject(new AplicacionesQNAError(
            `Error síncrono al ejecutar procedimiento ADEUDO_ORGANICA_LAYOUT: ${syncError.message || String(syncError)}`,
            AplicacionesQNAErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  /**
   * Obtiene el período de trabajo desde BitacoraAfectacionOrg
   * Incluye quincena, año, período formateado y fechas de inicio y fin de la quincena
   */
  async obtenerPeriodoTrabajo(org0: string, org1: string): Promise<PeriodoTrabajo> {
    const logContext = {
      operation: 'obtenerPeriodoTrabajo',
      org0,
      org1
    };

    logger.info(logContext, 'Iniciando consulta de período de trabajo');

    try {
      // Validar parámetros
      if (!org0 || org0.trim().length === 0) {
        throw new AplicacionesQNAError(
          'Clave orgánica 0 es requerida para obtener el período',
          AplicacionesQNAErrorCode.INVALID_PARAMETERS,
          400
        );
      }

      if (!org1 || org1.trim().length === 0) {
        throw new AplicacionesQNAError(
          'Clave orgánica 1 es requerida para obtener el período',
          AplicacionesQNAErrorCode.INVALID_PARAMETERS,
          400
        );
      }

      // Normalizar org0 y org1 a 2 caracteres
      const org0Normalized = typeof org0 === 'string'
        ? org0.padStart(2, '0').substring(0, 2)
        : String(org0).padStart(2, '0').substring(0, 2);

      const org1Normalized = typeof org1 === 'string'
        ? org1.padStart(2, '0').substring(0, 2)
        : String(org1).padStart(2, '0').substring(0, 2);

      const p = await getPool();

      const result = await p.request()
        .input('Org0', sql.Char(2), org0Normalized)
        .input('Org1', sql.Char(2), org1Normalized)
        .query(`
          SELECT TOP 1 Quincena, Anio, Accion
          FROM afec.BitacoraAfectacionOrg
          WHERE Org0 = @Org0
            AND Org1 = @Org1
            AND (Accion = 'APLICAR' OR Accion = 'TERMINADO')
          ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        logger.warn({ ...logContext, org0Normalized, org1Normalized }, 'No se encontró período de trabajo');
        throw new AplicacionesQNAError(
          `No se encontró período de trabajo para las claves orgánicas ${org0Normalized}/${org1Normalized}. Verifique que exista un registro con Accion='APLICAR' o Accion='TERMINADO' en BitacoraAfectacionOrg`,
          AplicacionesQNAErrorCode.NOT_FOUND,
          404
        );
      }

      const registro = result.recordset[0];
      const quincena = registro.Quincena;
      const anio = registro.Anio;
      const accion = registro.Accion;

      // Validar que quincena y año sean válidos
      if (!quincena || quincena < 1 || quincena > 24) {
        throw new AplicacionesQNAError(
          `Quincena inválida: ${quincena}. Debe estar entre 1 y 24`,
          AplicacionesQNAErrorCode.INVALID_PARAMETERS,
          400
        );
      }

      if (!anio || anio < 2000 || anio > 2100) {
        throw new AplicacionesQNAError(
          `Año inválido: ${anio}. Debe estar entre 2000 y 2100`,
          AplicacionesQNAErrorCode.INVALID_PARAMETERS,
          400
        );
      }

      // Formatear período: quincena (2 dígitos) + año (2 últimos dígitos)
      const quincenaStr = String(quincena).padStart(2, '0');
      const anioStr = String(anio).slice(-2);
      const periodo = quincenaStr + anioStr;

      // Calcular fechas de inicio y fin de la quincena
      const { fechaInicio, fechaFin } = this.calcularFechasQuincena(quincena, anio);

      logger.info({
        ...logContext,
        periodo,
        quincena,
        anio,
        accion,
        fechaInicio,
        fechaFin
      }, 'Período obtenido exitosamente');

      return {
        periodo,
        quincena,
        anio,
        accion,
        fechaInicio,
        fechaFin
      };
    } catch (error) {
      if (error instanceof AplicacionesQNAError) {
        throw error;
      }
      logger.error({
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 'Error al obtener período de trabajo');
      throw new AplicacionesQNAError(
        `Error al obtener el período de trabajo para ${org0}/${org1}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AplicacionesQNAErrorCode.DATABASE_ERROR,
        500
      );
    }
  }

  /**
   * Calcula las aportaciones de fondos desde los datos del histórico
   * @param registro Registro de AplicacionAportaciones sin campos calculados
   * @returns Registro con los campos calculados agregados
   */
  private calcularAportacionesDesdeHistorico(registro: AplicacionAportaciones): AplicacionAportaciones {
    const sueldom = registro.sueldom || 0;
    const otrasPrestaciones = registro.otrasPrestaciones || 0;
    const quinquenios = registro.quinquenios || 0;

    // Calcular sueldo base (común para todos los tipos)
    const sueldoBase = ((sueldom + otrasPrestaciones + quinquenios) / 30) * 15;

    // Calcular aportación Ahorro
    const aportacionAhorroPatron = ((sueldom / 30) * 15) * 0.0250; // AFAE - Patrón 2.5%
    const aportacionAhorroEmpleado = ((sueldom / 30) * 15) * 0.050; // AFAA - Empleado 5.0%
    const aportacionAhorro = aportacionAhorroPatron + aportacionAhorroEmpleado;

    // Calcular aportación Vivienda
    const aportacionVivienda = ((sueldom / 30) * 15) * 0.0175; // AFE - Patrón 1.75%

    // Calcular aportación Prestaciones (usa sueldoBase)
    const aportacionPrestacionesPatron = sueldoBase * 0.2225; // AFPE - Patrón 22.25%
    const aportacionPrestacionesEmpleado = sueldoBase * 0.0450; // AFPA - Empleado 4.5%
    const aportacionPrestaciones = aportacionPrestacionesPatron + aportacionPrestacionesEmpleado;

    // Calcular aportación CAIR
    const aportacionCair = ((sueldom / 30) * 15) * 0.020; // AFE - Patrón 2.0%

    // Calcular total de todas las aportaciones
    const totalAportaciones = aportacionAhorro + aportacionVivienda + aportacionPrestaciones + aportacionCair;

    // Retornar registro con campos calculados agregados
    return {
      ...registro,
      sueldoBase,
      aportacionAhorro,
      aportacionAhorroPatron,
      aportacionAhorroEmpleado,
      aportacionVivienda,
      aportacionPrestaciones,
      aportacionPrestacionesPatron,
      aportacionPrestacionesEmpleado,
      aportacionCair,
      totalAportaciones
    };
  }

  /**
   * Calcula las fechas de inicio y fin de una quincena
   * @param quincena Número de quincena (1-24)
   * @param anio Año (2000-2100)
   * @returns Objeto con fechaInicio y fechaFin en formato YYYY-MM-DD
   */
  private calcularFechasQuincena(quincena: number, anio: number): { fechaInicio: string; fechaFin: string } {
    // Calcular el mes: Math.ceil(quincena / 2)
    // Quincena 1-2 = mes 1 (enero), quincena 3-4 = mes 2 (febrero), etc.
    const mes = Math.ceil(quincena / 2);

    // Determinar si es quincena impar (primera quincena del mes) o par (segunda quincena del mes)
    const esQuincenaImpar = quincena % 2 === 1;

    let fechaInicio: Date;
    let fechaFin: Date;

    if (esQuincenaImpar) {
      // Primera quincena: días 1-15
      fechaInicio = new Date(anio, mes - 1, 1);
      fechaFin = new Date(anio, mes - 1, 15);
    } else {
      // Segunda quincena: días 16-fin del mes
      fechaInicio = new Date(anio, mes - 1, 16);
      // Último día del mes: día 0 del mes siguiente
      fechaFin = new Date(anio, mes, 0);
    }

    // Formatear a YYYY-MM-DD
    const formatoFecha = (fecha: Date): string => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      fechaInicio: formatoFecha(fechaInicio),
      fechaFin: formatoFecha(fechaFin)
    };
  }
}

