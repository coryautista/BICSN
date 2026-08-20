import { FastifyRequest } from 'fastify';
import { executeSerializedQuery, decodeFirebirdObject, executeSelectableProcedure, executeSafeQuery, FIREBIRD_TIMEOUTS } from '../../../../db/firebird.js';
import { withDbContext, sql } from '../../../../db/context.js';
import { getPool } from '../../../../db/mssql.js';
import { env } from '../../../../config/env.js';
import { resolveDatabaseEnvironment } from '../../../../config/databaseEnvironments.js';
import type { SnapshotCalculoV2Input } from '../../../aportacionesFondos/domain/entities/SnapshotCalculoV2.js';
import { SnapshotCalculoV2Factory, seleccionarCargaTxtSnapshotV2 } from '../../../aportacionesFondos/domain/services/SnapshotCalculoV2Factory.js';
import { SnapshotCalculoV2Repository } from '../../../aportacionesFondos/infrastructure/persistence/SnapshotCalculoV2Repository.js';
import type { NominaDiasContext } from '../../../aportacionesFondos/domain/services/NominaDiasLaboradosResolver.js';
import type { IFormulaCalculoRepository } from '../../../aportacionesFondos/domain/repositories/IFormulaCalculoRepository.js';
import { IAplicacionQuincenalRepository, GuardarHistoricoAportacionesResult, GuardarHistoricoRetencionesResult, ValidarAplicacionQnaAportacionesResult } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import { RevisionAplicacionDiasFactory } from '../../domain/services/RevisionAplicacionDiasFactory.js';
import { AportacionQuincenalResumen } from '../../domain/entities/AportacionQuincenalResumen.js';
import { ResumenOrgQnaAll } from '../../domain/entities/ResumenOrgQnaAll.js';
import { AplicacionQuincenalError, AplicacionQuincenalErrorCode } from '../../domain/errors.js';
import {
  GuardarHistoricoAportaciones,
  AhorroHeader,
  AhorroDetalle,
  ViviendaHeader,
  ViviendaDetalle,
  PrestacionesHeader,
  PrestacionesDetalle,
  CairHeader,
  CairDetalle,
  TransitorioHeader,
  TransitorioDetalle,
  GuarderiasHeader,
  GuarderiasDetalle,
  AguinaldoHeader,
  AguinaldoDetalle,
  GuardarHistoricoRetenciones,
  PrestamosCortoPlazoHeader,
  PrestamosCortoPlazoDetalle,
  PrestamosMedianoPlazoHeader,
  PrestamosMedianoPlazoDetalle,
  PrestamosHipotecariosHeader,
  PrestamosHipotecariosDetalle
} from '../../aplicacionQuincenal.schemas.js';
import pino from 'pino';

const logger = pino({
  name: 'AplicacionQuincenalRepository',
  level: process.env.LOG_LEVEL || 'info'
});

interface SnapshotAplicacionRevision {
  org0: string;
  org1: string;
  periodo: string;
  usuarioId: string;
  registros: number;
  CAIR: number;
  FRA: number;
  FRE: number;
  FH: number;
  FV: number;
  FAA: number;
  FAE: number;
  FAT: number;
  FAI: number;
}

export class AplicacionQuincenalRepository implements IAplicacionQuincenalRepository {
  private readonly snapshotCalculoV2Factory = new SnapshotCalculoV2Factory();
  private readonly revisionAplicacionDiasFactory = new RevisionAplicacionDiasFactory();

  constructor(
    private readonly snapshotCalculoV2Repo: SnapshotCalculoV2Repository,
    private readonly formulaCalculoRepo: IFormulaCalculoRepository
  ) {}

  async validarAplicacionQnaAportaciones(organica0: string, organica1: string, periodo: string): Promise<ValidarAplicacionQnaAportacionesResult> {
    const org0 = String(organica0).trim().toUpperCase().padStart(2, '0');
    const org1 = String(organica1).trim().toUpperCase().padStart(2, '0');
    const periodoStr = String(periodo).trim();
    const quincena = Number(periodoStr.slice(0, 2));
    const anio = 2000 + Number(periodoStr.slice(2, 4));

    if (!/^\d{4}$/.test(periodoStr) || quincena < 1 || quincena > 24) {
      throw new Error('PERIODO_INVALIDO');
    }

    const p = await getPool();
    const bitacoraResult = await p.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT TOP 1
          AfectacionId AS afectacionId,
          Entidad AS entidad,
          Anio AS anio,
          Quincena AS quincena,
          Accion AS accion,
          Org0 AS organica0,
          Org1 AS organica1,
          Org2 AS organica2,
          Org3 AS organica3,
          Resultado AS resultado,
          Mensaje AS mensaje,
          Usuario AS usuario,
          UserId AS userId,
          AppName AS appName,
          Ip AS ip,
          UserAgent AS userAgent,
          CreatedAt AS createdAt,
          ModifiedAt AS modifiedAt
        FROM afec.BitacoraAfectacionOrg
        WHERE Entidad = 'AFILIADOS'
          AND Org0 = @org0
          AND Org1 = @org1
          AND Quincena = @quincena
          AND Anio = @anio
          AND Accion = 'TERMINADO'
        ORDER BY ModifiedAt DESC, CreatedAt DESC
      `);

    const bitacora = bitacoraResult.recordset[0] || null;
    const baseResult = {
      organica0: org0,
      organica1: org1,
      periodo: periodoStr,
      quincena,
      anio
    };

    if (!bitacora) {
      return {
        aplicada: false,
        ...baseResult,
        bitacora: null,
        parametrosAplicacion: null,
        aportaciones: null,
        totales: null
      };
    }

    const createRequest = () => p.request()
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio);

    const [
      ahorroResult,
      viviendaResult,
      prestacionesResult,
      cairResult,
      transitorioResult,
      guarderiasResult,
      aguinaldoResult,
      detalleAguinaldoResult,
      resumenResult
    ] = await Promise.all([
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesAhorroHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesViviendaHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesPrestacionesHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.IndividualesCairHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.PensionNominaTransitorioHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.GuarderiasHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.AguinaldoHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.DetalleHistoricoAguinaldo
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `),
      createRequest().query(`
        SELECT * FROM aportaciones.ResumenHistorico
        WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
          AND quincena = @quincena AND anio = @anio
        ORDER BY id
      `)
    ]);

    const aportaciones = {
      ahorro: ahorroResult.recordset,
      vivienda: viviendaResult.recordset,
      prestaciones: prestacionesResult.recordset,
      cair: cairResult.recordset,
      transitorio: transitorioResult.recordset,
      guarderias: guarderiasResult.recordset,
      aguinaldo: aguinaldoResult.recordset,
      detalleAguinaldo: detalleAguinaldoResult.recordset,
      resumen: resumenResult.recordset
    };

    return {
      aplicada: true,
      ...baseResult,
      bitacora,
      parametrosAplicacion: {
        aplicarC: {
          sp: 'AP_P_APLICAR',
          org0,
          org1,
          quincenaC: periodoStr,
          quincenaA: periodoStr,
          tipo: 'C'
        },
        aplicarF: {
          sp: 'AP_P_APLICAR',
          org0,
          org1,
          quincenaC: periodoStr,
          quincenaA: periodoStr,
          tipo: 'F'
        }
      },
      aportaciones,
      totales: {
        ahorro: aportaciones.ahorro.length,
        vivienda: aportaciones.vivienda.length,
        prestaciones: aportaciones.prestaciones.length,
        cair: aportaciones.cair.length,
        transitorio: aportaciones.transitorio.length,
        guarderias: aportaciones.guarderias.length,
        aguinaldo: aportaciones.aguinaldo.length,
        detalleAguinaldo: aportaciones.detalleAguinaldo.length,
        resumen: aportaciones.resumen.length
      }
    };
  }

  async getEntidadesRptPdfInserta(organica0: string, organica1: string, periodo: string): Promise<Record<string, unknown>[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getEntidadesRptPdfInserta',
      organica0,
      organica1,
      periodo
    };

    const clave0 = String(organica0).trim().toUpperCase().padStart(2, '0');
    const clave1 = String(organica1).trim().toUpperCase().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT
        r.CLAVE_ORGANICA_0,
        r.CLAVE_ORGANICA_1,
        r.CLAVE_ORGANICA_2,
        r.CLAVE_ORGANICA_3,
        r.PERIODO,
        r.FECHA_GENERACION,
        r.STATUS
      FROM AQ_ENTIDADES_RPT_PDF r
      WHERE r.CLAVE_ORGANICA_0 = ?
        AND r.CLAVE_ORGANICA_1 = ?
        AND r.PERIODO = ?
        AND r.STATUS = 'A'
    `;

    try {
      logger.info(logContext, 'Consultando AQ_ENTIDADES_RPT_PDF');

      const result = await executeSerializedQuery((db) => {
        return new Promise<Record<string, unknown>[]>((resolve, reject) => {
          if (!db || typeof db.query !== 'function') {
            reject(new AplicacionQuincenalError(
              'Conexión a Firebird no disponible o inválida',
              AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
            ));
            return;
          }

          db.query(sql, [clave0, clave1, periodoStr], (err: any, rows: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(Array.isArray(rows) ? rows : []);
          });
        });
      });
      const duration = Date.now() - startTime;

      const registros = (Array.isArray(result) ? result : [])
        .map((row: any) => decodeFirebirdObject(row));

      logger.info({
        ...logContext,
        recordCount: registros.length,
        duracionMs: duration
      }, 'Consulta AQ_ENTIDADES_RPT_PDF completada exitosamente');

      return registros;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        errorCode: error.code,
        errorName: error.name,
        stack: error.stack,
        duracionMs: duration
      }, 'Error consultando AQ_ENTIDADES_RPT_PDF');

      throw new AplicacionQuincenalError(
        `Error al consultar AQ_ENTIDADES_RPT_PDF: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
      );
    }
  }

  async getAportacionQuincenalResumen(org0: string, org1: string, periodo: string): Promise<AportacionQuincenalResumen[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getAportacionQuincenalResumen',
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
        r.RDB$DB_KEY, r.ORG0, r.ORG1, r.ORG2, r.ORG3, r.PERIODO, r.TIPO, r.FA_SA,
        r.FO_AFIL, r.FO_SDO, r.FO_SDOB, r.FO_OP, r.FO_OPB, r.FO_Q, r.FO_QB,
        r.FO_SAR, r.FO_FRA, r.FO_FRE, r.FO_FHE, r.FO_FVE, r.FO_FAA, r.FO_FAE,
        r.FM_AFIL, r.FM_SDO, r.FM_SAR, r.FM_FRA, r.FM_FRE, r.FM_FHE, r.FM_FVE,
        r.FM_FAA, r.FM_FAE, r.FR_AFIL, r.FR_SDO, r.FR_OP, r.FR_Q, r.FR_SAR,
        r.FR_FRA, r.FR_FRE, r.FR_FHE, r.FR_FVE, r.FR_FAA, r.FR_FAE, r.FA_PE,
        r.FA_FV, r.FA_SAR, r.FV_SAR, r.EBIA, r.EBIE, r.EBIC, r.PCP_SA,
        r.PCP_N_NUEVOS, r.PCP_NUEVOS, r.PCP_N_COBRO, r.PCP_COBRO, r.PCP_COBRO_K,
        r.PCP_COBRO_I, r.PCP_COBRO_M, r.PCP_N_ALTAS, r.PCP_ALTAS, r.PCP_N_BAJAS,
        r.PCP_BAJAS, r.PCP_N_CANCELADO, r.PCP_CANCELADO, r.PCP_N_DIRECTOS,
        r.PCP_DIRECTOS, r.PPV_N_HIP, r.PPV_HIP, r.PPV_HIP_K, r.PPV_HIP_I,
        r.PPV_HIP_S, r.PPV_HIP_M, r.PPV_N_PC, r.PPV_PC, r.PPV_PC_K, r.PPV_PC_I,
        r.PPV_PC_S, r.PPV_PC_M, r.PMP_N_EV, r.PMP_EV, r.PMP_EV_M, r.PMP_EV_S,
        r.PMP_EV_K, r.PENS_SDO, r.PENS_SDO_BONIFICADO, r.PENS_DEFUNCION,
        r.PENS_TRANS, r.PENS_FORAN, r.AGUI_FRE, r.PMP_EV_I, r.PMP_N_GM, r.PMP_GM,
        r.PMP_GM_K, r.PMP_GM_M, r.PMP_GM_S, r.PMP_GM_I, r.PMP_N_AV, r.PMP_AV,
        r.PMP_AV_K, r.PMP_AV_M, r.PMP_AV_S, r.PMP_AV_I, r.PMP_N_ET, r.PMP_ET,
        r.PMP_ET_K, r.PMP_ET_M, r.PMP_ET_S, r.PMP_ET_I, r.PMP_N_CO, r.PMP_CO,
        r.PMP_CO_K, r.PMP_CO_M, r.PMP_CO_S, r.PMP_CO_I, r.FMOV_ALT, r.USER_ALT
      FROM APORTACION_QUINCENAL_RESUMEN r
      WHERE r.ORG0 = ? 
        AND r.ORG1 = ? 
        AND r.PERIODO = ?
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AportacionQuincenalResumen[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando consulta a APORTACION_QUINCENAL_RESUMEN');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionQuincenalError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
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
                reject(new AplicacionQuincenalError(
                  `Error al ejecutar consulta APORTACION_QUINCENAL_RESUMEN: ${err.message || String(err)}`,
                  AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
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

              const registros: AportacionQuincenalResumen[] = decodedResult.map((row: any) => ({
                rdbDbKey: row.RDB$DB_KEY ? String(row.RDB$DB_KEY) : null,
                org0: String(row.ORG0 || ''),
                org1: String(row.ORG1 || ''),
                org2: row.ORG2 ? String(row.ORG2) : null,
                org3: row.ORG3 ? String(row.ORG3) : null,
                periodo: String(row.PERIODO || ''),
                tipo: row.TIPO ? String(row.TIPO) : null,
                faSa: row.FA_SA != null ? Number(row.FA_SA) : null,
                foAfil: row.FO_AFIL != null ? Number(row.FO_AFIL) : null,
                foSdo: row.FO_SDO != null ? Number(row.FO_SDO) : null,
                foSdob: row.FO_SDOB != null ? Number(row.FO_SDOB) : null,
                foOp: row.FO_OP != null ? Number(row.FO_OP) : null,
                foOpb: row.FO_OPB != null ? Number(row.FO_OPB) : null,
                foQ: row.FO_Q != null ? Number(row.FO_Q) : null,
                foQb: row.FO_QB != null ? Number(row.FO_QB) : null,
                foSar: row.FO_SAR != null ? Number(row.FO_SAR) : null,
                foFra: row.FO_FRA != null ? Number(row.FO_FRA) : null,
                foFre: row.FO_FRE != null ? Number(row.FO_FRE) : null,
                foFhe: row.FO_FHE != null ? Number(row.FO_FHE) : null,
                foFve: row.FO_FVE != null ? Number(row.FO_FVE) : null,
                foFaa: row.FO_FAA != null ? Number(row.FO_FAA) : null,
                foFae: row.FO_FAE != null ? Number(row.FO_FAE) : null,
                fmAfil: row.FM_AFIL != null ? Number(row.FM_AFIL) : null,
                fmSdo: row.FM_SDO != null ? Number(row.FM_SDO) : null,
                fmSar: row.FM_SAR != null ? Number(row.FM_SAR) : null,
                fmFra: row.FM_FRA != null ? Number(row.FM_FRA) : null,
                fmFre: row.FM_FRE != null ? Number(row.FM_FRE) : null,
                fmFhe: row.FM_FHE != null ? Number(row.FM_FHE) : null,
                fmFve: row.FM_FVE != null ? Number(row.FM_FVE) : null,
                fmFaa: row.FM_FAA != null ? Number(row.FM_FAA) : null,
                fmFae: row.FM_FAE != null ? Number(row.FM_FAE) : null,
                frAfil: row.FR_AFIL != null ? Number(row.FR_AFIL) : null,
                frSdo: row.FR_SDO != null ? Number(row.FR_SDO) : null,
                frOp: row.FR_OP != null ? Number(row.FR_OP) : null,
                frQ: row.FR_Q != null ? Number(row.FR_Q) : null,
                frSar: row.FR_SAR != null ? Number(row.FR_SAR) : null,
                frFra: row.FR_FRA != null ? Number(row.FR_FRA) : null,
                frFre: row.FR_FRE != null ? Number(row.FR_FRE) : null,
                frFhe: row.FR_FHE != null ? Number(row.FR_FHE) : null,
                frFve: row.FR_FVE != null ? Number(row.FR_FVE) : null,
                frFaa: row.FR_FAA != null ? Number(row.FR_FAA) : null,
                frFae: row.FR_FAE != null ? Number(row.FR_FAE) : null,
                faPe: row.FA_PE != null ? Number(row.FA_PE) : null,
                faFv: row.FA_FV != null ? Number(row.FA_FV) : null,
                faSar: row.FA_SAR != null ? Number(row.FA_SAR) : null,
                fvSar: row.FV_SAR != null ? Number(row.FV_SAR) : null,
                ebia: row.EBIA != null ? Number(row.EBIA) : null,
                ebie: row.EBIE != null ? Number(row.EBIE) : null,
                ebic: row.EBIC != null ? Number(row.EBIC) : null,
                pcpSa: row.PCP_SA != null ? Number(row.PCP_SA) : null,
                pcpNNuevos: row.PCP_N_NUEVOS != null ? Number(row.PCP_N_NUEVOS) : null,
                pcpNuevos: row.PCP_NUEVOS != null ? Number(row.PCP_NUEVOS) : null,
                pcpNCobro: row.PCP_N_COBRO != null ? Number(row.PCP_N_COBRO) : null,
                pcpCobro: row.PCP_COBRO != null ? Number(row.PCP_COBRO) : null,
                pcpCobroK: row.PCP_COBRO_K != null ? Number(row.PCP_COBRO_K) : null,
                pcpCobroI: row.PCP_COBRO_I != null ? Number(row.PCP_COBRO_I) : null,
                pcpCobroM: row.PCP_COBRO_M != null ? Number(row.PCP_COBRO_M) : null,
                pcpNAltas: row.PCP_N_ALTAS != null ? Number(row.PCP_N_ALTAS) : null,
                pcpAltas: row.PCP_ALTAS != null ? Number(row.PCP_ALTAS) : null,
                pcpNBajas: row.PCP_N_BAJAS != null ? Number(row.PCP_N_BAJAS) : null,
                pcpBajas: row.PCP_BAJAS != null ? Number(row.PCP_BAJAS) : null,
                pcpNCancelado: row.PCP_N_CANCELADO != null ? Number(row.PCP_N_CANCELADO) : null,
                pcpCancelado: row.PCP_CANCELADO != null ? Number(row.PCP_CANCELADO) : null,
                pcpNDirectos: row.PCP_N_DIRECTOS != null ? Number(row.PCP_N_DIRECTOS) : null,
                pcpDirectos: row.PCP_DIRECTOS != null ? Number(row.PCP_DIRECTOS) : null,
                ppvNHip: row.PPV_N_HIP != null ? Number(row.PPV_N_HIP) : null,
                ppvHip: row.PPV_HIP != null ? Number(row.PPV_HIP) : null,
                ppvHipK: row.PPV_HIP_K != null ? Number(row.PPV_HIP_K) : null,
                ppvHipI: row.PPV_HIP_I != null ? Number(row.PPV_HIP_I) : null,
                ppvHipS: row.PPV_HIP_S != null ? Number(row.PPV_HIP_S) : null,
                ppvHipM: row.PPV_HIP_M != null ? Number(row.PPV_HIP_M) : null,
                ppvNPC: row.PPV_N_PC != null ? Number(row.PPV_N_PC) : null,
                ppvPC: row.PPV_PC != null ? Number(row.PPV_PC) : null,
                ppvPCK: row.PPV_PC_K != null ? Number(row.PPV_PC_K) : null,
                ppvPCI: row.PPV_PC_I != null ? Number(row.PPV_PC_I) : null,
                ppvPCS: row.PPV_PC_S != null ? Number(row.PPV_PC_S) : null,
                ppvPCM: row.PPV_PC_M != null ? Number(row.PPV_PC_M) : null,
                pmpNEv: row.PMP_N_EV != null ? Number(row.PMP_N_EV) : null,
                pmpEv: row.PMP_EV != null ? Number(row.PMP_EV) : null,
                pmpEvM: row.PMP_EV_M != null ? Number(row.PMP_EV_M) : null,
                pmpEvS: row.PMP_EV_S != null ? Number(row.PMP_EV_S) : null,
                pmpEvK: row.PMP_EV_K != null ? Number(row.PMP_EV_K) : null,
                pensSdo: row.PENS_SDO != null ? Number(row.PENS_SDO) : null,
                pensSdoBonificado: row.PENS_SDO_BONIFICADO != null ? Number(row.PENS_SDO_BONIFICADO) : null,
                pensDefuncion: row.PENS_DEFUNCION != null ? Number(row.PENS_DEFUNCION) : null,
                pensTrans: row.PENS_TRANS != null ? Number(row.PENS_TRANS) : null,
                pensForan: row.PENS_FORAN != null ? Number(row.PENS_FORAN) : null,
                aguiFre: row.AGUI_FRE != null ? Number(row.AGUI_FRE) : null,
                pmpEvI: row.PMP_EV_I != null ? Number(row.PMP_EV_I) : null,
                pmpNGm: row.PMP_N_GM != null ? Number(row.PMP_N_GM) : null,
                pmpGm: row.PMP_GM != null ? Number(row.PMP_GM) : null,
                pmpGmK: row.PMP_GM_K != null ? Number(row.PMP_GM_K) : null,
                pmpGmM: row.PMP_GM_M != null ? Number(row.PMP_GM_M) : null,
                pmpGmS: row.PMP_GM_S != null ? Number(row.PMP_GM_S) : null,
                pmpGmI: row.PMP_GM_I != null ? Number(row.PMP_GM_I) : null,
                pmpNAv: row.PMP_N_AV != null ? Number(row.PMP_N_AV) : null,
                pmpAv: row.PMP_AV != null ? Number(row.PMP_AV) : null,
                pmpAvK: row.PMP_AV_K != null ? Number(row.PMP_AV_K) : null,
                pmpAvM: row.PMP_AV_M != null ? Number(row.PMP_AV_M) : null,
                pmpAvS: row.PMP_AV_S != null ? Number(row.PMP_AV_S) : null,
                pmpAvI: row.PMP_AV_I != null ? Number(row.PMP_AV_I) : null,
                pmpNEt: row.PMP_N_ET != null ? Number(row.PMP_N_ET) : null,
                pmpEt: row.PMP_ET != null ? Number(row.PMP_ET) : null,
                pmpEtK: row.PMP_ET_K != null ? Number(row.PMP_ET_K) : null,
                pmpEtM: row.PMP_ET_M != null ? Number(row.PMP_ET_M) : null,
                pmpEtS: row.PMP_ET_S != null ? Number(row.PMP_ET_S) : null,
                pmpEtI: row.PMP_ET_I != null ? Number(row.PMP_ET_I) : null,
                pmpNCo: row.PMP_N_CO != null ? Number(row.PMP_N_CO) : null,
                pmpCo: row.PMP_CO != null ? Number(row.PMP_CO) : null,
                pmpCoK: row.PMP_CO_K != null ? Number(row.PMP_CO_K) : null,
                pmpCoM: row.PMP_CO_M != null ? Number(row.PMP_CO_M) : null,
                pmpCoS: row.PMP_CO_S != null ? Number(row.PMP_CO_S) : null,
                pmpCoI: row.PMP_CO_I != null ? Number(row.PMP_CO_I) : null,
                fmovAlt: row.FMOV_ALT ? new Date(row.FMOV_ALT) : null,
                userAlt: row.USER_ALT ? String(row.USER_ALT) : null
              }));

              logger.info({
                ...logContext,
                recordCount: registros.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(registros);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando consulta');
          reject(new AplicacionQuincenalError(
            `Error síncrono al ejecutar consulta APORTACION_QUINCENAL_RESUMEN: ${syncError.message || String(syncError)}`,
            AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async getResumenOrgQnaAll(org0: string, org1: string, periodo: string): Promise<ResumenOrgQnaAll[]> {
    const startTime = Date.now();
    const logContext = {
      operation: 'getResumenOrgQnaAll',
      org0,
      org1,
      periodo
    };

    logger.info(logContext, 'Iniciando consulta serializada a AP_RESUMEN_ORG_QNA_ALL');

    // Asegurar que los parámetros sean strings y estén limpios
    const clave0 = String(org0).trim().padStart(2, '0');
    const clave1 = String(org1).trim().padStart(2, '0');
    const periodoStr = String(periodo).trim();

    const sql = `
      SELECT 
        p.PORG0, p.PORG1, p.QNA, p.NORG, p.AFILIADOS, p.SDO, p.SDOBC, p.OP,
        p.OPBC, p.QNQ, p.QNQBC, p.PCP, p.PCP_M, p.PH, p.PH_M, p.EV, p.EV_M, p.PC,
        p.PC_M, p.FAA, p.FAE, p.FAT, p.FO_FAA, p.FO_FAE, p.FO_FAT, p.FM_FAA,
        p.FM_FAE, p.FM_FAT, p.FR_FAA, p.FR_FAE, p.FR_FAT, p.FRA, p.FRE, p.FRT,
        p.FO_FRA, p.FO_FRE, p.FO_FRT, p.FM_FRA, p.FM_FRE, p.FM_FRT, p.FR_FRA,
        p.FR_FRE, p.FR_FRT, p.FV, p.FO_FV, p.FM_FV, p.FR_FV, p.FH, p.FO_FH, p.FM_FH,
        p.FR_FH, p.SAR, p.FO_SAR, p.FM_SAR, p.FR_SAR, p.SARV, p.EBIA, p.EBIE,
        p.EBIT, p.AGUI, p.P_TRANS, p.P_FORAN, p.PMP_GM_M, p.PMP_GM, p.PMP_AV_M,
        p.PMP_AV, p.PMP_ET_M, p.PMP_ET, p.PMP_HO_M, p.PMP_HO, p.PMP_TU_M, p.PMP_TU,
        p.PMP_ED_M, p.PMP_ED, p.PMP_OT_M, p.PMP_OT, p.CONCEPTO, p.MONTO
      FROM AP_RESUMEN_ORG_QNA_ALL(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<ResumenOrgQnaAll[]>((resolve, reject) => {
        logger.info(logContext, 'Ejecutando stored procedure AP_RESUMEN_ORG_QNA_ALL');

        if (!db || typeof db.query !== 'function') {
          logger.error(logContext, 'Conexión Firebird inválida');
          reject(new AplicacionQuincenalError(
            'Conexión a Firebird no disponible o inválida',
            AplicacionQuincenalErrorCode.FIREBIRD_CONNECTION_ERROR
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
                }, 'Error ejecutando stored procedure');
                reject(new AplicacionQuincenalError(
                  `Error al ejecutar AP_RESUMEN_ORG_QNA_ALL: ${err.message || String(err)}`,
                  AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
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

              const registros: ResumenOrgQnaAll[] = decodedResult.map((row: any) => ({
                porg0: String(row.PORG0 || ''),
                porg1: String(row.PORG1 || ''),
                qna: String(row.QNA || ''),
                norg: row.NORG ? String(row.NORG) : null,
                afiliados: row.AFILIADOS != null ? Number(row.AFILIADOS) : null,
                sdo: row.SDO != null ? Number(row.SDO) : null,
                sdoBc: row.SDOBC != null ? Number(row.SDOBC) : null,
                op: row.OP != null ? Number(row.OP) : null,
                opBc: row.OPBC != null ? Number(row.OPBC) : null,
                qnq: row.QNQ != null ? Number(row.QNQ) : null,
                qnqBc: row.QNQBC != null ? Number(row.QNQBC) : null,
                pcp: row.PCP != null ? Number(row.PCP) : null,
                pcpM: row.PCP_M != null ? Number(row.PCP_M) : null,
                ph: row.PH != null ? Number(row.PH) : null,
                phM: row.PH_M != null ? Number(row.PH_M) : null,
                ev: row.EV != null ? Number(row.EV) : null,
                evM: row.EV_M != null ? Number(row.EV_M) : null,
                pc: row.PC != null ? Number(row.PC) : null,
                pcM: row.PC_M != null ? Number(row.PC_M) : null,
                faa: row.FAA != null ? Number(row.FAA) : null,
                fae: row.FAE != null ? Number(row.FAE) : null,
                fat: row.FAT != null ? Number(row.FAT) : null,
                foFaa: row.FO_FAA != null ? Number(row.FO_FAA) : null,
                foFae: row.FO_FAE != null ? Number(row.FO_FAE) : null,
                foFat: row.FO_FAT != null ? Number(row.FO_FAT) : null,
                fmFaa: row.FM_FAA != null ? Number(row.FM_FAA) : null,
                fmFae: row.FM_FAE != null ? Number(row.FM_FAE) : null,
                fmFat: row.FM_FAT != null ? Number(row.FM_FAT) : null,
                frFaa: row.FR_FAA != null ? Number(row.FR_FAA) : null,
                frFae: row.FR_FAE != null ? Number(row.FR_FAE) : null,
                frFat: row.FR_FAT != null ? Number(row.FR_FAT) : null,
                fra: row.FRA != null ? Number(row.FRA) : null,
                fre: row.FRE != null ? Number(row.FRE) : null,
                frt: row.FRT != null ? Number(row.FRT) : null,
                foFra: row.FO_FRA != null ? Number(row.FO_FRA) : null,
                foFre: row.FO_FRE != null ? Number(row.FO_FRE) : null,
                foFrt: row.FO_FRT != null ? Number(row.FO_FRT) : null,
                fmFra: row.FM_FRA != null ? Number(row.FM_FRA) : null,
                fmFre: row.FM_FRE != null ? Number(row.FM_FRE) : null,
                fmFrt: row.FM_FRT != null ? Number(row.FM_FRT) : null,
                frFra: row.FR_FRA != null ? Number(row.FR_FRA) : null,
                frFre: row.FR_FRE != null ? Number(row.FR_FRE) : null,
                frFrt: row.FR_FRT != null ? Number(row.FR_FRT) : null,
                fv: row.FV != null ? Number(row.FV) : null,
                foFv: row.FO_FV != null ? Number(row.FO_FV) : null,
                fmFv: row.FM_FV != null ? Number(row.FM_FV) : null,
                frFv: row.FR_FV != null ? Number(row.FR_FV) : null,
                fh: row.FH != null ? Number(row.FH) : null,
                foFh: row.FO_FH != null ? Number(row.FO_FH) : null,
                fmFh: row.FM_FH != null ? Number(row.FM_FH) : null,
                frFh: row.FR_FH != null ? Number(row.FR_FH) : null,
                sar: row.SAR != null ? Number(row.SAR) : null,
                foSar: row.FO_SAR != null ? Number(row.FO_SAR) : null,
                fmSar: row.FM_SAR != null ? Number(row.FM_SAR) : null,
                frSar: row.FR_SAR != null ? Number(row.FR_SAR) : null,
                sarv: row.SARV != null ? Number(row.SARV) : null,
                ebia: row.EBIA != null ? Number(row.EBIA) : null,
                ebie: row.EBIE != null ? Number(row.EBIE) : null,
                ebit: row.EBIT != null ? Number(row.EBIT) : null,
                agui: row.AGUI != null ? Number(row.AGUI) : null,
                pTrans: row.P_TRANS != null ? Number(row.P_TRANS) : null,
                pForan: row.P_FORAN != null ? Number(row.P_FORAN) : null,
                pmpGmM: row.PMP_GM_M != null ? Number(row.PMP_GM_M) : null,
                pmpGm: row.PMP_GM != null ? Number(row.PMP_GM) : null,
                pmpAvM: row.PMP_AV_M != null ? Number(row.PMP_AV_M) : null,
                pmpAv: row.PMP_AV != null ? Number(row.PMP_AV) : null,
                pmpEtM: row.PMP_ET_M != null ? Number(row.PMP_ET_M) : null,
                pmpEt: row.PMP_ET != null ? Number(row.PMP_ET) : null,
                pmpHoM: row.PMP_HO_M != null ? Number(row.PMP_HO_M) : null,
                pmpHo: row.PMP_HO != null ? Number(row.PMP_HO) : null,
                pmpTuM: row.PMP_TU_M != null ? Number(row.PMP_TU_M) : null,
                pmpTu: row.PMP_TU != null ? Number(row.PMP_TU) : null,
                pmpEdM: row.PMP_ED_M != null ? Number(row.PMP_ED_M) : null,
                pmpEd: row.PMP_ED != null ? Number(row.PMP_ED) : null,
                pmpOtM: row.PMP_OT_M != null ? Number(row.PMP_OT_M) : null,
                pmpOt: row.PMP_OT != null ? Number(row.PMP_OT) : null,
                concepto: row.CONCEPTO ? String(row.CONCEPTO) : null,
                monto: row.MONTO != null ? Number(row.MONTO) : null
              }));

              logger.info({
                ...logContext,
                recordCount: registros.length,
                duracionMs: duration
              }, 'Consulta completada exitosamente');

              resolve(registros);
            }
          );
        } catch (syncError: any) {
          logger.error({
            ...logContext,
            error: syncError.message || String(syncError),
            stack: syncError.stack
          }, 'Error síncrono ejecutando stored procedure');
          reject(new AplicacionQuincenalError(
            `Error síncrono al ejecutar AP_RESUMEN_ORG_QNA_ALL: ${syncError.message || String(syncError)}`,
            AplicacionQuincenalErrorCode.FIREBIRD_QUERY_ERROR
          ));
        }
      });
    });
  }

  async guardarHistoricoAportaciones(
    req: FastifyRequest,
    data: GuardarHistoricoAportaciones,
    snapshotV2Required = false
  ): Promise<GuardarHistoricoAportacionesResult> {
    const startTime = Date.now();
    const logContext = {
      operation: 'guardarHistoricoAportaciones',
      tipos: Object.keys(data).filter(key => data[key as keyof GuardarHistoricoAportaciones] !== undefined)
    };

    logger.info(logContext, 'Iniciando guardado de histórico de aportaciones');

    const procesados: string[] = [];
    const totalRegistros: Record<string, number> = {};

    try {
      const referencia = data.ahorro?.header
        || data.vivienda?.header
        || data.prestaciones?.header
        || data.cair?.header
        || data.transitorio?.header
        || data.guarderias?.header
        || data.aguinaldo?.header;
      if (!referencia) {
        throw new Error('APLICACION_QUINCENAL_SIN_REFERENCIA');
      }
      const periodo = `${String(referencia.quincena).padStart(2, '0')}${String(referencia.anio).slice(-2)}`;
      const snapshotRevision = await this.calcularSnapshotAplicacionRevision(
        referencia.clave_organica_0,
        referencia.clave_organica_1,
        periodo,
        String((req as any).user?.sub || referencia.usuario_id)
      );
      const snapshotV2 = snapshotV2Required || env.features.snapshotCalculoV2ShadowEnabled
        ? await this.prepararSnapshotCalculoV2(
          data,
          referencia,
          String((req as any).user?.sub || referencia.usuario_id)
        )
        : null;
      if (snapshotV2Required && !snapshotV2) {
        throw new Error('SNAPSHOT_V2_NO_GENERADO');
      }

      await withDbContext(req, async (tx) => {
        // Procesar Ahorro (siempre, incluso con 0 registros)
        if (data.ahorro) {
          try {
            await this.crearYEjecutarAhorro(tx, data.ahorro.header, data.ahorro.detalle);
            procesados.push('ahorro');
            totalRegistros.ahorro = data.ahorro.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'ahorro', error: err.message || String(err), stack: err.stack }, 'Error al procesar ahorro');
            throw err;
          }
        }

        // Procesar Vivienda (siempre, incluso con 0 registros)
        if (data.vivienda) {
          try {
            await this.crearYEjecutarVivienda(tx, data.vivienda.header, data.vivienda.detalle);
            procesados.push('vivienda');
            totalRegistros.vivienda = data.vivienda.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'vivienda', error: err.message || String(err), stack: err.stack }, 'Error al procesar vivienda');
            throw err;
          }
        }

        // Procesar Prestaciones (siempre, incluso con 0 registros)
        if (data.prestaciones) {
          try {
            await this.crearYEjecutarPrestaciones(tx, data.prestaciones.header, data.prestaciones.detalle);
            procesados.push('prestaciones');
            totalRegistros.prestaciones = data.prestaciones.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'prestaciones', error: err.message || String(err), stack: err.stack }, 'Error al procesar prestaciones');
            throw err;
          }
        }

        // Procesar Cair (siempre, incluso con 0 registros)
        if (data.cair) {
          try {
            await this.crearYEjecutarCair(tx, data.cair.header, data.cair.detalle);
            procesados.push('cair');
            totalRegistros.cair = data.cair.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'cair', error: err.message || String(err), stack: err.stack }, 'Error al procesar cair');
            throw err;
          }
        }

        // Procesar Transitorio (siempre, incluso con 0 registros)
        if (data.transitorio) {
          try {
            await this.crearYEjecutarTransitorio(tx, data.transitorio.header, data.transitorio.detalle);
            procesados.push('transitorio');
            totalRegistros.transitorio = data.transitorio.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'transitorio', error: err.message || String(err), stack: err.stack }, 'Error al procesar transitorio');
            throw err;
          }
        }

        // Procesar Guarderias (siempre, incluso con 0 registros)
        if (data.guarderias) {
          try {
            await this.crearYEjecutarGuarderias(tx, data.guarderias.header, data.guarderias.detalle);
            procesados.push('guarderias');
            totalRegistros.guarderias = data.guarderias.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'guarderias', error: err.message || String(err), stack: err.stack }, 'Error al procesar guarderias');
            throw err;
          }
        }

        // Procesar Aguinaldo (siempre, incluso con 0 registros)
        if (data.aguinaldo) {
          try {
            await this.crearYEjecutarAguinaldo(tx, data.aguinaldo.header, data.aguinaldo.detalle);
            procesados.push('aguinaldo');
            totalRegistros.aguinaldo = data.aguinaldo.detalle.length;
          } catch (err: any) {
            logger.error({ ...logContext, tipo: 'aguinaldo', error: err.message || String(err), stack: err.stack }, 'Error al procesar aguinaldo');
            throw err;
          }
        }

        await this.guardarSnapshotAplicacionRevision(tx, snapshotRevision);
        if (snapshotV2) {
          const result = await this.snapshotCalculoV2Repo.guardarEnTransaccion(tx, snapshotV2);
          logger.info({
            ...logContext,
            snapshotId: result.snapshotId,
            snapshotRevision: result.revision,
            snapshotIdempotente: result.idempotente,
            snapshotObligatorio: snapshotV2Required
          }, 'Snapshot de calculo V2 guardado');
        }
      });

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        duracionMs: duration
      }, 'Guardado de histórico completado exitosamente');

      return {
        procesados,
        totalRegistros
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Capturar información detallada del error de mssql
      const errorDetails: any = {
        message: error.message || String(error),
        name: error.name,
        stack: error.stack
      };
      
      // Si es un error de mssql, agregar información adicional
      if (error.code) errorDetails.code = error.code;
      if (error.number) errorDetails.number = error.number;
      if (error.class) errorDetails.class = error.class;
      if (error.state) errorDetails.state = error.state;
      if (error.procName) errorDetails.procName = error.procName;
      if (error.lineNumber) errorDetails.lineNumber = error.lineNumber;
      if (error.info) errorDetails.info = error.info;
      
      // Capturar originalError con todas sus propiedades
      if (error.originalError) {
        errorDetails.originalError = {
          message: error.originalError.message,
          name: error.originalError.name,
          code: error.originalError.code,
          number: error.originalError.number,
          class: error.originalError.class,
          state: error.originalError.state,
          procName: error.originalError.procName,
          lineNumber: error.originalError.lineNumber,
          info: error.originalError.info,
          serverName: error.originalError.serverName,
          sqlState: error.originalError.sqlState
        };
      }
      
      // Intentar obtener el mensaje del error de diferentes fuentes
      let errorMessage = error.message || String(error);
      if (error.originalError?.message) {
        errorMessage = error.originalError.message;
      } else if (error.originalError && typeof error.originalError === 'object') {
        // Intentar serializar el originalError completo
        try {
          const serialized = JSON.stringify(error.originalError, Object.getOwnPropertyNames(error.originalError));
          errorDetails.originalErrorSerialized = serialized;
          if (serialized.includes('message')) {
            const parsed = JSON.parse(serialized);
            if (parsed.message) errorMessage = parsed.message;
          }
        } catch (e) {
          // Ignorar errores de serialización
        }
      }
      
      logger.error({
        ...logContext,
        ...errorDetails,
        errorMessage,
        duracionMs: duration
      }, 'Error al guardar histórico de aportaciones');

      throw new AplicacionQuincenalError(
        `Error al guardar histórico de aportaciones: ${errorMessage}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  // Funciones helper privadas para cada tipo de aportación

  private async prepararSnapshotCalculoV2(
    data: GuardarHistoricoAportaciones,
    referencia: AhorroHeader | ViviendaHeader | PrestacionesHeader | CairHeader | TransitorioHeader | GuarderiasHeader | AguinaldoHeader,
    usuarioId: string
  ): Promise<SnapshotCalculoV2Input | null> {
    const scope = {
      org0: referencia.clave_organica_0,
      org1: referencia.clave_organica_1,
      anio: referencia.anio,
      quincena: referencia.quincena
    };
    const omit = (reason: string, context: Record<string, unknown> = {}): null => {
      logger.warn({ operation: 'prepararSnapshotCalculoV2', ...scope, reason, ...context }, 'Snapshot V2 omitido');
      return null;
    };

    if (!data.ahorro || !data.vivienda || !data.prestaciones || !data.cair) {
      return omit('FONDOS_INCOMPLETOS');
    }
    if ([data.ahorro.detalle, data.vivienda.detalle, data.prestaciones.detalle, data.cair.detalle].some((rows) => rows.length === 0)) {
      return omit('FONDOS_SIN_DETALLE');
    }

    const ambiente = resolveDatabaseEnvironment(env.sql.database, env.firebird.database);
    if (!ambiente) return omit('AMBIENTE_FUERA_DE_MATRIZ');
    const pool = await getPool();
    const metadata = await pool.request()
      .input('Anio', sql.SmallInt, scope.anio)
      .input('Quincena', sql.TinyInt, scope.quincena)
      .input('Organica0', sql.Char(2), scope.org0)
      .input('Organica1', sql.Char(2), scope.org1)
      .query(`
        SELECT Id AS CargaId,EntidadId,Organica2,Organica3,TipoCarga
        FROM dbo.NominaAplicacionQnalCarga
        WHERE Anio=@Anio AND Quincena=@Quincena
          AND Organica0=@Organica0 AND Organica1=@Organica1
          AND Estatus='APLICADA'
          AND ((TipoCarga='TXT' AND EsVigente=1) OR TipoCarga='MOVIMIENTO')
        ORDER BY Id;

      `);
    const sets = metadata.recordsets as Array<Array<Record<string, unknown>>>;
    const cargasTxt = sets[0].filter((row) => row.TipoCarga === 'TXT').map((row) => ({
      CargaId: row.CargaId,
      EntidadId: row.EntidadId,
      Organica2: row.Organica2,
      Organica3: row.Organica3
    }));
    const cargaSeleccionada = seleccionarCargaTxtSnapshotV2(cargasTxt);
    if (!cargaSeleccionada.carga && cargaSeleccionada.reason === 'TXT_VIGENTE_AMBIGUO') {
      return omit(cargaSeleccionada.reason, { cargas: cargasTxt.length });
    }
    const formula = await this.formulaCalculoRepo.obtenerPorPeriodo(scope.anio, scope.quincena);
    const cargasMovimiento = sets[0].filter((row) => row.TipoCarga === 'MOVIMIENTO');
    const ambitosMovimiento = new Map<string, Record<string, unknown>>();
    for (const row of cargasMovimiento) {
      ambitosMovimiento.set(`${row.EntidadId}|${row.Organica2}|${row.Organica3}`, row);
    }
    if (!cargaSeleccionada.carga && ambitosMovimiento.size === 0) return omit('SIN_TXT_NI_MOVIMIENTO');
    if (!cargaSeleccionada.carga && ambitosMovimiento.size !== 1) {
      return omit('MOVIMIENTO_AMBITO_AMBIGUO', { ambitos: ambitosMovimiento.size });
    }
    const carga = cargaSeleccionada.carga ?? [...ambitosMovimiento.values()][0];
    const cargaId = cargaSeleccionada.carga ? String(carga.CargaId) : null;
    const fuenteNomina = cargaSeleccionada.carga ? 'txt' : 'movimiento';

    const nominaRequest = pool.request()
      .input('CargaId', sql.BigInt, cargaId)
      .input('Anio', sql.SmallInt, scope.anio)
      .input('Quincena', sql.TinyInt, scope.quincena)
      .input('Organica0', sql.Char(2), scope.org0)
      .input('Organica1', sql.Char(2), scope.org1)
      .input('Organica2', sql.Char(2), String(carga.Organica2))
      .input('Organica3', sql.Char(2), String(carga.Organica3));
    const nominaResult = await nominaRequest
      .query(`
        SELECT d.RFC,d.DiasLaborados,
          CONVERT(VARCHAR(40), d.BaseCotizacionSueldo) AS BaseCotizacionSueldo,
          CONVERT(VARCHAR(40), d.BaseCotizacionQuinquenios) AS BaseCotizacionQuinquenios,d.Id
        FROM dbo.NominaAplicacionQnalDetalle d
        INNER JOIN dbo.NominaAplicacionQnalCarga c ON c.Id=d.CargaId
        WHERE (@CargaId IS NOT NULL AND d.CargaId=@CargaId)
           OR (@CargaId IS NULL AND c.TipoCarga='MOVIMIENTO' AND c.Estatus='APLICADA'
             AND c.Anio=@Anio AND c.Quincena=@Quincena
             AND c.Organica0=@Organica0 AND c.Organica1=@Organica1
             AND c.Organica2=@Organica2 AND c.Organica3=@Organica3)
        ORDER BY d.Id DESC;
      `);
    if (nominaResult.recordset.length === 0) return omit(`${fuenteNomina.toUpperCase()}_SIN_DETALLE`, { cargaId });
    const nomina = new Map<string, {
      dias: number | null;
      baseCotizacionSueldo: string | null;
      baseCotizacionQuinquenios: string | null;
    }>();
    for (const row of nominaResult.recordset) {
      const rfc = String(row.RFC ?? '').trim().toUpperCase();
      if (!rfc) continue;
      if (nomina.has(rfc) && fuenteNomina === 'txt') return omit('TXT_RFC_DUPLICADO', { cargaId });
      if (nomina.has(rfc)) continue;
      nomina.set(rfc, {
        dias: row.DiasLaborados === null ? null : Number(row.DiasLaborados),
        baseCotizacionSueldo: row.BaseCotizacionSueldo === null ? null : String(row.BaseCotizacionSueldo),
        baseCotizacionQuinquenios: row.BaseCotizacionQuinquenios === null ? null : String(row.BaseCotizacionQuinquenios)
      });
    }

    const periodo = `${String(scope.quincena).padStart(2, '0')}${String(scope.anio).slice(-2)}`;
    const firebirdRows = await executeSafeQuery(`
      SELECT INTERNO,RFC,CAST(FAI AS VARCHAR(40)) AS FAI
      FROM AP_S_FONDOS(?, ?, ?)
    `, [scope.org0, scope.org1, periodo], FIREBIRD_TIMEOUTS.BATCH_OPERATION);
    if (firebirdRows.length === 0) return omit('FIREBIRD_SIN_DETALLE');

    try {
      return this.snapshotCalculoV2Factory.crear({
        entidadId: Number(carga.EntidadId),
        anio: scope.anio,
        quincena: scope.quincena,
        organica0: scope.org0,
        organica1: scope.org1,
        organica2: String(carga.Organica2),
        organica3: String(carga.Organica3),
        ambiente,
        formulaCalculoVersionId: formula.formulaCalculoVersionId,
        diasPolicy: {
          default: Number(formula.parametros.DIAS_DEFAULT_SIN_TXT),
          min: Number(formula.parametros.DIAS_MIN),
          max: Number(formula.parametros.DIAS_MAX)
        },
        nominaCargaId: cargaId,
        usuarioId,
        ahorro: data.ahorro.detalle,
        vivienda: data.vivienda.detalle,
        prestaciones: data.prestaciones.detalle,
        cair: data.cair.detalle,
        identidadesFai: firebirdRows.map((row) => ({
          interno: Number(row.INTERNO),
          rfc: row.RFC === null || row.RFC === undefined ? null : String(row.RFC),
          faiD6: String(row.FAI ?? '0')
        })),
        nomina: { tieneArchivo: fuenteNomina === 'txt', fuente: fuenteNomina, registros: nomina }
      });
    } catch (error) {
      return omit('DATOS_INCOMPLETOS', {
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async calcularSnapshotAplicacionRevision(
    org0: string,
    org1: string,
    periodo: string,
    usuarioId: string
  ): Promise<SnapshotAplicacionRevision> {
    const [rows, nomina] = await Promise.all([
      executeSafeQuery(`
        SELECT RFC,SARE,FRA,FRE,FHE,FVE,FAA,FAE,FAI
        FROM AP_S_FONDOS(?, ?, ?)
      `, [org0, org1, periodo], FIREBIRD_TIMEOUTS.BATCH_OPERATION),
      this.obtenerNominaRevisionContext(org0, org1, periodo)
    ]);
    const calculo = this.revisionAplicacionDiasFactory.crear(rows, nomina);
    logger.info({
      operation: 'calcularSnapshotAplicacionRevision',
      org0,
      org1,
      periodo,
      registros: calculo.registros,
      registrosNomina: calculo.registrosNomina,
      registrosMovimiento: calculo.registrosMovimiento,
      registrosDefault: calculo.registrosDefault
    }, 'Snapshot de aplicacion para REVISA calculado con dias laborados');
    return {
      org0,
      org1,
      periodo,
      usuarioId,
      registros: calculo.registros,
      CAIR: calculo.CAIR,
      FRA: calculo.FRA,
      FRE: calculo.FRE,
      FH: calculo.FH,
      FV: calculo.FV,
      FAA: calculo.FAA,
      FAE: calculo.FAE,
      FAT: calculo.FAT,
      FAI: calculo.FAI
    };
  }

  private async obtenerNominaRevisionContext(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<NominaDiasContext> {
    const registros = new Map<string, { dias: number | null; baseCotizacionQuinquenios: number | null }>();
    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));
    const pool = await getPool();
    const cargasResult = await pool.request()
      .input('anio', sql.SmallInt, anio)
      .input('quincena', sql.TinyInt, quincena)
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1)
      .query(`
        SELECT Id AS CargaId,TipoCarga
        FROM dbo.NominaAplicacionQnalCarga
        WHERE Anio=@anio AND Quincena=@quincena
          AND Organica0=@org0 AND Organica1=@org1
          AND Estatus='APLICADA'
          AND ((TipoCarga='TXT' AND EsVigente=1) OR TipoCarga='MOVIMIENTO')
        ORDER BY Id DESC;
      `);
    const cargasTxt = cargasResult.recordset.filter((row) => String(row.TipoCarga).trim() === 'TXT');
    if (cargasTxt.length > 1) throw new Error('REVISION_APLICACION_TXT_VIGENTE_AMBIGUO');
    const fuente: 'txt' | 'movimiento' | 'default' = cargasTxt.length === 1
      ? 'txt'
      : cargasResult.recordset.length > 0
        ? 'movimiento'
        : 'default';
    if (fuente === 'default') return { tieneArchivo: false, fuente, registros };
    const cargasSeleccionadas = fuente === 'txt' ? cargasTxt : cargasResult.recordset;

    const detalleRequest = pool.request();
    const cargaPlaceholders = cargasSeleccionadas.map((row, index) => {
      const name = `cargaId${index}`;
      detalleRequest.input(name, sql.BigInt, String(row.CargaId));
      return `@${name}`;
    }).join(',');
    const detalles = await detalleRequest.query(`
        SELECT Id,RFC,DiasLaborados
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE CargaId IN (${cargaPlaceholders})
        ORDER BY Id DESC;
      `);
    if (detalles.recordset.length === 0 && fuente === 'txt') throw new Error('REVISION_APLICACION_TXT_VIGENTE_SIN_DETALLE');

    for (const row of detalles.recordset) {
      const rfc = String(row.RFC ?? '').trim().toUpperCase();
      if (!rfc) continue;
      if (registros.has(rfc) && fuente === 'txt') throw new Error(`REVISION_APLICACION_TXT_RFC_DUPLICADO:${rfc}`);
      if (registros.has(rfc)) continue;
      if (row.DiasLaborados === null || row.DiasLaborados === undefined) {
        throw new Error(`REVISION_APLICACION_TXT_DIAS_NULOS:${rfc}`);
      }
      registros.set(rfc, {
        dias: Number(row.DiasLaborados),
        baseCotizacionQuinquenios: null
      });
    }
    return { tieneArchivo: fuente === 'txt', fuente, registros };
  }

  private async guardarSnapshotAplicacionRevision(
    tx: sql.Transaction,
    snapshot: SnapshotAplicacionRevision
  ): Promise<void> {
    const request = new sql.Request(tx)
      .input('org0', sql.Char(2), snapshot.org0)
      .input('org1', sql.Char(2), snapshot.org1)
      .input('periodo', sql.Char(4), snapshot.periodo)
      .input('usuarioId', sql.UniqueIdentifier, snapshot.usuarioId)
      .input('registros', sql.Int, snapshot.registros);
    for (const fondo of ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const) {
      request.input(fondo, sql.Decimal(19, 2), snapshot[fondo]);
    }
    await request.query(`
      DECLARE @id BIGINT;
      SELECT @id = IdRevisionAplicacionHistorico
      FROM conciliacion.RevisionAplicacionHistorico WITH (UPDLOCK, HOLDLOCK)
      WHERE Organica0 = @org0 AND Organica1 = @org1
        AND Organica2 = '01' AND Organica3 = '01' AND Periodo = @periodo;

      IF @id IS NOT NULL AND EXISTS (
        SELECT 1 FROM conciliacion.RevisionTarea
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = '01' AND Organica3 = '01' AND Periodo = @periodo
      )
        THROW 50031, 'REVISION_APLICACION_HISTORICO_CERRADO', 1;

      IF @id IS NULL
      BEGIN
        INSERT INTO conciliacion.RevisionAplicacionHistorico (
          Organica0, Organica1, Organica2, Organica3, Periodo,
          CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI,
          RegistrosOrigen, UsuarioId
        ) VALUES (
          @org0, @org1, '01', '01', @periodo,
          @CAIR, @FRA, @FRE, @FH, @FV, @FAA, @FAE, @FAT, @FAI,
          @registros, @usuarioId
        );
      END
      ELSE
      BEGIN
        UPDATE conciliacion.RevisionAplicacionHistorico
        SET CAIR = @CAIR, FRA = @FRA, FRE = @FRE, FH = @FH, FV = @FV,
          FAA = @FAA, FAE = @FAE, FAT = @FAT, FAI = @FAI,
          RegistrosOrigen = @registros, UsuarioId = @usuarioId,
          FechaActualizacion = SYSDATETIME()
        WHERE IdRevisionAplicacionHistorico = @id;
      END;
    `);
  }

  private async crearYEjecutarAhorro(
    tx: sql.Transaction,
    header: AhorroHeader,
    detalle: AhorroDetalle[]
  ): Promise<void> {
    // Crear TVP Header
    const headerTable = new sql.Table('aportaciones.TVP_AhorroLoteHeader_V2');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(19, 6));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(19, 6));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados,
      header.total_contribucion_a2,
      header.total_sueldo_base_a2
    );

    // Crear TVP Detalle
    const detalleTable = new sql.Table('aportaciones.TVP_AhorroLoteDetalle_V2');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('sueldo_base', sql.Decimal(19, 6));
    detalleTable.columns.add('afae', sql.Decimal(19, 6));
    detalleTable.columns.add('afaa', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo_d6,
        row.quinquenios_d6,
        row.otras_prestaciones_d6,
        row.sueldo_base_d6,
        row.afae_d6,
        row.afaa_d6,
        row.total_d6
      );
    });

    // Ejecutar stored procedure
    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesAhorroHistorico_Lote');
  }

  private async crearYEjecutarVivienda(
    tx: sql.Transaction,
    header: ViviendaHeader,
    detalle: ViviendaDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_ViviendaLoteHeader_V2');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(19, 6));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(19, 6));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion_a2,
      header.total_sueldo_base_a2
    );

    const detalleTable = new sql.Table('aportaciones.TVP_ViviendaLoteDetalle_V2');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('sueldo_base', sql.Decimal(19, 6));
    detalleTable.columns.add('afe', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo_d6,
        row.quinquenios_d6,
        row.otras_prestaciones_d6,
        row.sueldo_base_d6,
        row.afe_d6,
        row.total_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesViviendaHistorico_Lote');
  }

  private async crearYEjecutarPrestaciones(
    tx: sql.Transaction,
    header: PrestacionesHeader,
    detalle: PrestacionesDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_PrestacionesLoteHeader_V2');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(19, 6));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(19, 6));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion_a2,
      header.total_sueldo_base_a2
    );

    const detalleTable = new sql.Table('aportaciones.TVP_PrestacionesLoteDetalle_V2');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('sueldo_base', sql.Decimal(19, 6));
    detalleTable.columns.add('afpe', sql.Decimal(19, 6));
    detalleTable.columns.add('afpa', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo_d6,
        row.quinquenios_d6,
        row.otras_prestaciones_d6,
        row.sueldo_base_d6,
        row.afpe_d6,
        row.afpa_d6,
        row.total_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesPrestacionesHistorico_Lote');
  }

  private async crearYEjecutarCair(
    tx: sql.Transaction,
    header: CairHeader,
    detalle: CairDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_CairLoteHeader_V2');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(19, 6));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(19, 6));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion_a2,
      header.total_sueldo_base_a2
    );

    const detalleTable = new sql.Table('aportaciones.TVP_CairLoteDetalle_V2');
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombre', sql.NVarChar(200));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('otras_prestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('sueldo_base', sql.Decimal(19, 6));
    detalleTable.columns.add('afe', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.nombre,
        row.sueldo_d6,
        row.quinquenios_d6,
        row.otras_prestaciones_d6,
        row.sueldo_base_d6,
        row.afe_d6,
        row.total_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarIndividualesCairHistorico_Lote');
  }

  private async crearYEjecutarTransitorio(
    tx: sql.Transaction,
    header: TransitorioHeader,
    detalle: TransitorioDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_TransitorioLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_TransitorioLoteDetalle');
    // Agregar todas las columnas requeridas (63 en total)
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('fpension', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('nombres', sql.NVarChar(255));
    detalleTable.columns.add('nonombre', sql.NVarChar(50));
    detalleTable.columns.add('rfc', sql.NVarChar(13));
    detalleTable.columns.add('norfc', sql.NVarChar(13));
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('norg0', sql.NVarChar(255));
    detalleTable.columns.add('norg1', sql.NVarChar(255));
    detalleTable.columns.add('norg2', sql.NVarChar(255));
    detalleTable.columns.add('norg3', sql.NVarChar(255));
    detalleTable.columns.add('sueldo', sql.Decimal(19, 6));
    detalleTable.columns.add('oprestaciones', sql.Decimal(19, 6));
    detalleTable.columns.add('quinquenios', sql.Decimal(19, 6));
    detalleTable.columns.add('sdo', sql.Decimal(19, 6));
    detalleTable.columns.add('oprest', sql.Decimal(19, 6));
    detalleTable.columns.add('quinq', sql.Decimal(19, 6));
    detalleTable.columns.add('tpension', sql.Decimal(19, 6));
    detalleTable.columns.add('transitorio', sql.Decimal(19, 6));
    detalleTable.columns.add('cconcepto', sql.NVarChar(20));
    detalleTable.columns.add('descripcion', sql.NVarChar(255));
    detalleTable.columns.add('importe', sql.Decimal(19, 6));
    detalleTable.columns.add('defuncion', sql.DateTime2(7));
    detalleTable.columns.add('pcp', sql.Decimal(19, 6));
    detalleTable.columns.add('palimenticia', sql.Decimal(19, 6));
    detalleTable.columns.add('retroactivo', sql.Decimal(19, 6));
    detalleTable.columns.add('payudaecon', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp1', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp2', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp3', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp4', sql.Decimal(19, 6));
    detalleTable.columns.add('otrosp5', sql.Decimal(19, 6));
    detalleTable.columns.add('terreno', sql.Decimal(19, 6));
    detalleTable.columns.add('hipviv', sql.Decimal(19, 6));
    detalleTable.columns.add('prodental', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod1', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod2', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod3', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod4', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod5', sql.Decimal(19, 6));
    detalleTable.columns.add('otrod6', sql.Decimal(19, 6));
    detalleTable.columns.add('tpercep', sql.Decimal(19, 6));
    detalleTable.columns.add('tdeduc', sql.Decimal(19, 6));
    detalleTable.columns.add('total', sql.Decimal(19, 6));
    detalleTable.columns.add('fin', sql.DateTime2(7));
    detalleTable.columns.add('inicio', sql.DateTime2(7));
    detalleTable.columns.add('anio_registro', sql.Int);
    detalleTable.columns.add('sihay', sql.NVarChar(10));
    detalleTable.columns.add('porcentaje', sql.Decimal(19, 6));
    detalleTable.columns.add('sdoporc', sql.Decimal(19, 6));
    detalleTable.columns.add('ayudporc', sql.Decimal(19, 6));
    detalleTable.columns.add('quinqporc', sql.Decimal(19, 6));
    detalleTable.columns.add('transorg0', sql.Char(2));
    detalleTable.columns.add('transorg1', sql.Char(2));
    detalleTable.columns.add('transnorg0', sql.NVarChar(255));
    detalleTable.columns.add('transnorg1', sql.NVarChar(255));

    const truncate = (value: string | null | undefined, maxLength: number) => {
      if (value === null || value === undefined) return null;
      if (value.length <= maxLength) return value;
      return value.slice(0, maxLength);
    };

    detalle.forEach(row => {
      // Validar campos Char(2) para asegurar que sean strings de exactamente 2 caracteres
      const org0Str = (row.org0 && String(row.org0).length === 2) ? String(row.org0) : (row.clave_organica_0 || '00');
      const org1Str = (row.org1 && String(row.org1).length === 2) ? String(row.org1) : (row.clave_organica_1 || '00');
      const org2Str = (row.org2 && String(row.org2).length === 2) ? String(row.org2) : '00';
      const org3Str = (row.org3 && String(row.org3).length === 2) ? String(row.org3) : '00';
      const transorg0Str = (row.transorg0 && String(row.transorg0).length === 2) ? String(row.transorg0) : (row.clave_organica_0 || '00');
      const transorg1Str = (row.transorg1 && String(row.transorg1).length === 2) ? String(row.transorg1) : (row.clave_organica_1 || '00');
      const claveOrg0Str = (row.clave_organica_0 && String(row.clave_organica_0).length === 2) ? String(row.clave_organica_0) : '00';
      const claveOrg1Str = (row.clave_organica_1 && String(row.clave_organica_1).length === 2) ? String(row.clave_organica_1) : '00';

      detalleTable.rows.add(
        claveOrg0Str,
        claveOrg1Str,
        row.quincena,
        row.anio,
        row.fpension ?? null,
        row.interno ?? null,
        truncate(row.nombres ?? null, 255),
        truncate(row.nonombre ?? null, 50),
        truncate(row.rfc ?? null, 13),
        truncate(row.norfc ?? null, 13),
        org0Str,
        org1Str,
        org2Str,
        org3Str,
        truncate(row.norg0 ?? null, 255),
        truncate(row.norg1 ?? null, 255),
        truncate(row.norg2 ?? null, 255),
        truncate(row.norg3 ?? null, 255),
        row.sueldo ?? null,
        row.oprestaciones ?? null,
        row.quinquenios ?? null,
        row.sdo ?? null,
        row.oprest ?? null,
        row.quinq ?? null,
        row.tpension ?? null,
        row.transitorio ?? null,
        truncate(row.cconcepto ?? null, 20),
        truncate(row.descripcion ?? null, 255),
        row.importe ?? null,
        row.defuncion ? new Date(row.defuncion) : null,
        row.pcp ?? null,
        row.palimenticia ?? null,
        row.retroactivo ?? null,
        row.payudaecon ?? null,
        row.otrosp1 ?? null,
        row.otrosp2 ?? null,
        row.otrosp3 ?? null,
        row.otrosp4 ?? null,
        row.otrosp5 ?? null,
        row.terreno ?? null,
        row.hipviv ?? null,
        row.prodental ?? null,
        row.otrod1 ?? null,
        row.otrod2 ?? null,
        row.otrod3 ?? null,
        row.otrod4 ?? null,
        row.otrod5 ?? null,
        row.otrod6 ?? null,
        row.tpercep ?? null,
        row.tdeduc ?? null,
        row.total ?? null,
        row.fin ? new Date(row.fin) : null,
        row.inicio ? new Date(row.inicio) : null,
        row.anio_detalle ?? null,
        truncate(row.sihay ?? null, 10),
        row.porcentaje ?? null,
        row.sdoporc ?? null,
        row.ayudporc ?? null,
        row.quinqporc ?? null,
        transorg0Str,
        transorg1Str,
        truncate(row.transnorg0 ?? null, 255),
        truncate(row.transnorg1 ?? null, 255)
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarPensionNominaTransitorioHistorico_Lote');
  }

  private async crearYEjecutarGuarderias(
    tx: sql.Transaction,
    header: GuarderiasHeader,
    detalle: GuarderiasDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_GuarderiasLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_GuarderiasLoteDetalle');
    // Agregar todas las columnas requeridas (29 en total)
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('titular_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_no_empleado', sql.NVarChar(50));
    detalleTable.columns.add('titular_monto', sql.Decimal(18, 2));
    detalleTable.columns.add('titular_rfc', sql.NVarChar(20));
    detalleTable.columns.add('titular_monto_texto', sql.NVarChar(200));
    detalleTable.columns.add('titular_org0', sql.Char(2));
    detalleTable.columns.add('titular_org0_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org1', sql.Char(2));
    detalleTable.columns.add('titular_org1_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org2', sql.Char(2));
    detalleTable.columns.add('titular_org2_nombre', sql.NVarChar(200));
    detalleTable.columns.add('titular_org3', sql.Char(2));
    detalleTable.columns.add('titular_org3_nombre', sql.NVarChar(200));
    detalleTable.columns.add('entidad_monto', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_ajuste', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_total', sql.Decimal(18, 2));
    detalleTable.columns.add('recibo_mes_ano', sql.NVarChar(50));
    detalleTable.columns.add('recibo_fecha_venc', sql.Date);
    detalleTable.columns.add('recibo_folio', sql.NVarChar(50));
    detalleTable.columns.add('menor_id', sql.Int);
    detalleTable.columns.add('menor_nombre', sql.NVarChar(200));
    detalleTable.columns.add('menor_rfc', sql.NVarChar(20));
    detalleTable.columns.add('menor_nivel', sql.NVarChar(100));
    detalleTable.columns.add('menor_sala', sql.NVarChar(100));
    detalleTable.columns.add('estatus', sql.NVarChar(50));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.titular_nombre,
        row.titular_no_empleado,
        row.titular_monto,
        row.titular_rfc,
        row.titular_monto_texto ?? null,
        row.titular_org0 ?? null,
        row.titular_org0_nombre ?? null,
        row.titular_org1 ?? null,
        row.titular_org1_nombre ?? null,
        row.titular_org2 ?? null,
        row.titular_org2_nombre ?? null,
        row.titular_org3 ?? null,
        row.titular_org3_nombre ?? null,
        row.entidad_monto ?? null,
        row.recibo_ajuste ?? null,
        row.recibo_total,
        row.recibo_mes_ano,
        new Date(row.recibo_fecha_venc),
        row.recibo_folio,
        row.menor_id,
        row.menor_nombre,
        row.menor_rfc ?? null,
        row.menor_nivel,
        row.menor_sala,
        row.estatus
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarGuarderiasHistorico_Lote');
  }

  private async crearYEjecutarAguinaldo(
    tx: sql.Transaction,
    header: AguinaldoHeader,
    detalle: AguinaldoDetalle[]
  ): Promise<void> {
    const headerTable = new sql.Table('aportaciones.TVP_AguinaldoLoteHeader');
    headerTable.columns.add('clave_organica_0', sql.Char(2));
    headerTable.columns.add('clave_organica_1', sql.Char(2));
    headerTable.columns.add('quincena', sql.Int);
    headerTable.columns.add('anio', sql.Int);
    headerTable.columns.add('usuario_id', sql.NVarChar(100));
    headerTable.columns.add('total_empleados', sql.Int);
    headerTable.columns.add('total_contribucion', sql.Decimal(18, 2));
    headerTable.columns.add('total_sueldo_base', sql.Decimal(18, 2));
    headerTable.rows.add(
      header.clave_organica_0,
      header.clave_organica_1,
      header.quincena,
      header.anio,
      header.usuario_id,
      header.total_empleados ?? 0,
      header.total_contribucion ?? 0,
      header.total_sueldo_base ?? 0
    );

    const detalleTable = new sql.Table('aportaciones.TVP_AguinaldoLoteDetalle');
    // Agregar todas las columnas requeridas (41 en total) en el orden correcto del TVP
    detalleTable.columns.add('clave_organica_0', sql.Char(2));
    detalleTable.columns.add('clave_organica_1', sql.Char(2));
    detalleTable.columns.add('quincena', sql.Int);
    detalleTable.columns.add('anio', sql.Int);
    detalleTable.columns.add('interno', sql.Int);
    detalleTable.columns.add('org0', sql.Char(2));
    detalleTable.columns.add('org1', sql.Char(2));
    detalleTable.columns.add('org2', sql.Char(2));
    detalleTable.columns.add('org3', sql.Char(2));
    detalleTable.columns.add('movimiento', sql.NVarChar(50));
    detalleTable.columns.add('noempleado', sql.NVarChar(50));
    detalleTable.columns.add('tipomovimiento', sql.NVarChar(50));
    detalleTable.columns.add('nombres', sql.NVarChar(200));
    detalleTable.columns.add('rfc', sql.NVarChar(20));
    detalleTable.columns.add('curp', sql.NVarChar(20));
    detalleTable.columns.add('fecha', sql.Date);
    detalleTable.columns.add('dias_aguinaldo', sql.Int);
    detalleTable.columns.add('cuantos', sql.Int);
    detalleTable.columns.add('cuantos_ori', sql.Int);
    detalleTable.columns.add('nocontar', sql.NVarChar(50));
    detalleTable.columns.add('sdo', sql.Decimal(18, 2));
    detalleTable.columns.add('op', sql.Decimal(18, 2));
    detalleTable.columns.add('q', sql.Decimal(18, 2));
    detalleTable.columns.add('activo', sql.NVarChar(50));
    detalleTable.columns.add('nom_activo', sql.NVarChar(200));
    detalleTable.columns.add('qna_a', sql.Int);
    detalleTable.columns.add('porcentaje_a', sql.Decimal(18, 2));
    detalleTable.columns.add('diario', sql.Decimal(18, 2));
    detalleTable.columns.add('general', sql.Decimal(18, 2));
    detalleTable.columns.add('porcentaje', sql.Decimal(18, 2));
    detalleTable.columns.add('proporcion', sql.Decimal(18, 2));
    detalleTable.columns.add('mensaje', sql.NVarChar(500));
    detalleTable.columns.add('dias_gral_agui', sql.Int);
    detalleTable.columns.add('fecha_lf', sql.Date);
    detalleTable.columns.add('fecha_li', sql.Date);
    detalleTable.columns.add('f_inicio', sql.Date);
    detalleTable.columns.add('f_fin', sql.Date);
    detalleTable.columns.add('norg0', sql.NVarChar(200));
    detalleTable.columns.add('norg1', sql.NVarChar(200));
    detalleTable.columns.add('norg2', sql.NVarChar(200));
    detalleTable.columns.add('norg3', sql.NVarChar(200));

    detalle.forEach(row => {
      detalleTable.rows.add(
        row.clave_organica_0,
        row.clave_organica_1,
        row.quincena,
        row.anio,
        row.interno,
        row.org0,
        row.org1,
        row.org2,
        row.org3,
        row.movimiento ?? null,
        row.noempleado,
        row.tipomovimiento ?? null,
        row.nombres,
        row.rfc,
        row.curp,
        row.fecha ? new Date(row.fecha) : new Date('1900-01-01'),
        row.dias_aguinaldo ?? null,
        row.cuantos ?? null,
        row.cuantos_ori ?? null,
        row.nocontar ?? null,
        row.sdo ?? 0,
        row.op ?? null,
        row.q ?? null,
        row.activo ?? null,
        row.nom_activo ?? null,
        row.qna_a ?? null,
        row.porcentaje_a ?? null,
        row.diario ?? null,
        row.general ?? 0,
        row.porcentaje ?? null,
        row.proporcion ?? 0,
        row.mensaje ?? null,
        row.dias_gral_agui ?? null,
        row.fecha_lf ? new Date(row.fecha_lf) : null,
        row.fecha_li ? new Date(row.fecha_li) : null,
        row.f_inicio ? new Date(row.f_inicio) : null,
        row.f_fin ? new Date(row.f_fin) : null,
        row.norg0,
        row.norg1,
        row.norg2,
        row.norg3
      );
    });

    const request = new sql.Request(tx);
    request.input('Lotes', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    request.input('Modo', sql.NVarChar(50), 'REPLACE');
    await request.execute('aportaciones.spGuardarAguinaldoHistorico_Lote');
  }

  async guardarHistoricoRetenciones(
    req: FastifyRequest,
    data: GuardarHistoricoRetenciones
  ): Promise<GuardarHistoricoRetencionesResult> {
    const startTime = Date.now();
    const logContext = {
      operation: 'guardarHistoricoRetenciones',
      tipos: Object.keys(data).filter(key => data[key as keyof GuardarHistoricoRetenciones] !== undefined)
    };

    logger.info(logContext, 'Iniciando guardado de histórico de retenciones');

    const procesados: string[] = [];
    const totalRegistros: Record<string, number> = {};

    try {
      await withDbContext(req, async (tx) => {
        // Procesar PrestamosCortoPlazo
        if (data.prestamosCortoPlazo) {
          const detalleLength = Array.isArray(data.prestamosCortoPlazo.detalle) ? data.prestamosCortoPlazo.detalle.length : 0;
          await this.crearYEjecutarPrestamosCortoPlazo(tx, data.prestamosCortoPlazo.header, data.prestamosCortoPlazo.detalle);
          procesados.push('prestamosCortoPlazo');
          totalRegistros.prestamosCortoPlazo = detalleLength;
          logger.info({ tipo: 'prestamosCortoPlazo', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosCortoPlazo');
        }

        // Procesar PrestamosMedianoPlazo
        if (data.prestamosMedianoPlazo) {
          const detalleLength = Array.isArray(data.prestamosMedianoPlazo.detalle) ? data.prestamosMedianoPlazo.detalle.length : 0;
          await this.crearYEjecutarPrestamosMedianoPlazo(tx, data.prestamosMedianoPlazo.header, data.prestamosMedianoPlazo.detalle);
          procesados.push('prestamosMedianoPlazo');
          totalRegistros.prestamosMedianoPlazo = detalleLength;
          logger.info({ tipo: 'prestamosMedianoPlazo', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosMedianoPlazo');
        }

        // Procesar PrestamosHipotecarios
        if (data.prestamosHipotecarios) {
          const detalleLength = Array.isArray(data.prestamosHipotecarios.detalle) ? data.prestamosHipotecarios.detalle.length : 0;
          await this.crearYEjecutarPrestamosHipotecarios(tx, data.prestamosHipotecarios.header, data.prestamosHipotecarios.detalle);
          procesados.push('prestamosHipotecarios');
          totalRegistros.prestamosHipotecarios = detalleLength;
          logger.info({ tipo: 'prestamosHipotecarios', detalleLength, totalRegistros }, 'Asignado totalRegistros para prestamosHipotecarios');
        }
      });

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        totalRegistrosKeys: Object.keys(totalRegistros),
        totalRegistrosString: JSON.stringify(totalRegistros),
        duracionMs: duration
      }, 'Guardado de histórico de retenciones completado exitosamente');

      // Asegurar que totalRegistros tenga valores para todos los procesados
      // Usar el mismo objeto totalRegistros directamente, asegurando que todos los procesados tengan un valor
      procesados.forEach(tipo => {
        if (totalRegistros[tipo] === undefined || totalRegistros[tipo] === null) {
          totalRegistros[tipo] = 0;
          logger.warn({ tipo, totalRegistros }, `totalRegistros[${tipo}] era undefined/null, asignando 0`);
        }
      });

      logger.info({
        ...logContext,
        procesados,
        totalRegistros,
        totalRegistrosKeys: Object.keys(totalRegistros),
        totalRegistrosString: JSON.stringify(totalRegistros),
        totalRegistrosEntries: Object.entries(totalRegistros)
      }, 'Retornando resultado final con totalRegistros');

      return {
        procesados,
        totalRegistros: { ...totalRegistros } // Crear una copia para asegurar que se retorne correctamente
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al guardar histórico de retenciones');

      throw new AplicacionQuincenalError(
        `Error al guardar histórico de retenciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  // Funciones helper privadas para cada tipo de préstamo

  private async crearYEjecutarPrestamosCortoPlazo(
    tx: sql.Transaction,
    header: PrestamosCortoPlazoHeader,
    detalle: PrestamosCortoPlazoDetalle[]
  ): Promise<void> {
    await this.assertRetencionSnapshotScope(tx, header);
    const headerTable = new sql.Table('retenciones.TVP_RetencionPCPHeader_V3');
    headerTable.columns.add('LiquidacionSnapshotId', sql.BigInt);
    headerTable.columns.add('SourceScale', sql.TinyInt);
    headerTable.columns.add('Registros', sql.Int);
    headerTable.columns.add('TotalA2', sql.Decimal(19, 2));
    headerTable.columns.add('UsuarioId', sql.NVarChar(100));
    headerTable.rows.add(
      header.liquidacion_snapshot_id,
      header.source_scale,
      detalle.length,
      header.total_contribucion_a2,
      header.usuario_id
    );

    const detalleTable = new sql.Table('retenciones.TVP_RetencionPCPDetalle_V3');
    detalleTable.columns.add('Orden', sql.Int);
    detalleTable.columns.add('EmpleadoClave', sql.NVarChar(50));
    detalleTable.columns.add('Rfc', sql.NVarChar(20));
    detalleTable.columns.add('Prestamo', sql.Int);
    detalleTable.columns.add('Letra', sql.Int);
    detalleTable.columns.add('Plazo', sql.Int);
    detalleTable.columns.add('CapitalD6', sql.Decimal(19, 6));
    detalleTable.columns.add('InteresD6', sql.Decimal(19, 6));
    detalleTable.columns.add('MontoD6', sql.Decimal(19, 6));
    detalleTable.columns.add('MoratoriosD6', sql.Decimal(19, 6));
    detalleTable.columns.add('TotalD6', sql.Decimal(19, 6));

    detalle.forEach((row, index) => {
      detalleTable.rows.add(
        index + 1,
        String(row.interno),
        row.rfc,
        row.prestamo,
        row.letra,
        row.plazo,
        row.capital_d6,
        row.interes_d6,
        row.monto_d6,
        row.moratorios_d6,
        row.total_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Header', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    await request.execute('retenciones.spGuardarRetencionPCPHistorico_V3');
  }

  private async crearYEjecutarPrestamosMedianoPlazo(
    tx: sql.Transaction,
    header: PrestamosMedianoPlazoHeader,
    detalle: PrestamosMedianoPlazoDetalle[]
  ): Promise<void> {
    await this.assertRetencionSnapshotScope(tx, header);
    const headerTable = new sql.Table('retenciones.TVP_RetencionPMPHeader_V3');
    headerTable.columns.add('LiquidacionSnapshotId', sql.BigInt);
    headerTable.columns.add('SourceScale', sql.TinyInt);
    headerTable.columns.add('Registros', sql.Int);
    headerTable.columns.add('TotalA2', sql.Decimal(19, 2));
    headerTable.columns.add('UsuarioId', sql.NVarChar(100));
    headerTable.rows.add(
      header.liquidacion_snapshot_id,
      header.source_scale,
      detalle.length,
      header.total_contribucion_a2,
      header.usuario_id
    );

    const detalleTable = new sql.Table('retenciones.TVP_RetencionPMPDetalle_V3');
    detalleTable.columns.add('Orden', sql.Int);
    detalleTable.columns.add('EmpleadoClave', sql.NVarChar(50));
    detalleTable.columns.add('Rfc', sql.NVarChar(20));
    detalleTable.columns.add('Prestamo', sql.Int);
    detalleTable.columns.add('Letra', sql.Int);
    detalleTable.columns.add('Plazo', sql.Int);
    detalleTable.columns.add('CapitalD6', sql.Decimal(19, 6));
    detalleTable.columns.add('InteresD6', sql.Decimal(19, 6));
    detalleTable.columns.add('MoratoriosD6', sql.Decimal(19, 6));
    detalleTable.columns.add('SeguroD6', sql.Decimal(19, 6));
    detalleTable.columns.add('TotalD6', sql.Decimal(19, 6));

    detalle.forEach((row, index) => {
      detalleTable.rows.add(
        index + 1,
        row.noemple,
        row.rfc,
        row.prestamo,
        row.letra,
        row.plazo,
        row.capital_d6,
        row.interes_d6,
        row.moratorios_d6,
        row.seguro_d6,
        row.total_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Header', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    await request.execute('retenciones.spGuardarRetencionPMPHistorico_V3');
  }

  private async crearYEjecutarPrestamosHipotecarios(
    tx: sql.Transaction,
    header: PrestamosHipotecariosHeader,
    detalle: PrestamosHipotecariosDetalle[]
  ): Promise<void> {
    await this.assertRetencionSnapshotScope(tx, header);
    const headerTable = new sql.Table('retenciones.TVP_RetencionHIPHeader_V3');
    headerTable.columns.add('LiquidacionSnapshotId', sql.BigInt);
    headerTable.columns.add('SourceScale', sql.TinyInt);
    headerTable.columns.add('Registros', sql.Int);
    headerTable.columns.add('TotalA2', sql.Decimal(19, 2));
    headerTable.columns.add('UsuarioId', sql.NVarChar(100));
    headerTable.rows.add(
      header.liquidacion_snapshot_id,
      header.source_scale,
      detalle.length,
      header.total_contribucion_a2,
      header.usuario_id
    );

    const detalleTable = new sql.Table('retenciones.TVP_RetencionHIPDetalle_V3');
    detalleTable.columns.add('Orden', sql.Int);
    detalleTable.columns.add('EmpleadoClave', sql.NVarChar(50));
    detalleTable.columns.add('Rfc', sql.NVarChar(20));
    detalleTable.columns.add('Solicitud', sql.Int);
    detalleTable.columns.add('AnioPrestamo', sql.SmallInt);
    detalleTable.columns.add('Plazo', sql.Int);
    detalleTable.columns.add('CantidadD6', sql.Decimal(19, 6));
    detalleTable.columns.add('DescuentoD6', sql.Decimal(19, 6));
    detalleTable.columns.add('CapitalD6', sql.Decimal(19, 6));
    detalleTable.columns.add('InteresD6', sql.Decimal(19, 6));
    detalleTable.columns.add('InteresDiferidoD6', sql.Decimal(19, 6));
    detalleTable.columns.add('SeguroD6', sql.Decimal(19, 6));
    detalleTable.columns.add('MoratorioD6', sql.Decimal(19, 6));
    detalleTable.columns.add('TotalD6', sql.Decimal(19, 6));

    detalle.forEach((row, index) => {
      detalleTable.rows.add(
        index + 1,
        row.noempleado,
        row.rfc,
        row.pno_solicitud,
        row.pano,
        row.plazo,
        row.cantidad_d6,
        row.descto_d6,
        row.capital_pagar_d6,
        row.interes_pagar_d6,
        row.interes_diferido_pagar_d6,
        row.seguro_pagar_d6,
        row.moratorio_pagar_d6,
        row.cantidad_d6
      );
    });

    const request = new sql.Request(tx);
    request.input('Header', sql.TVP, headerTable);
    request.input('Detalle', sql.TVP, detalleTable);
    await request.execute('retenciones.spGuardarRetencionHIPHistorico_V3');
  }

  // ============================================================================
  // Métodos de consulta de históricos
  // ============================================================================

  async obtenerHistoricoAportaciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<{
    ahorro: any[];
    vivienda: any[];
    prestaciones: any[];
    cair: any[];
    transitorio: any[];
    guarderias: any[];
    aguinaldo: any[];
  }> {
    const startTime = Date.now();
    const logContext = {
      operation: 'obtenerHistoricoAportaciones',
      org0,
      org1,
      quincena,
      anio
    };

    logger.info(logContext, 'Iniciando consulta de histórico de aportaciones');

    try {
      const p = await getPool();

      // Ejecutar todas las consultas en paralelo
      const [
        ahorroResult,
        viviendaResult,
        prestacionesResult,
        cairResult,
        transitorioResult,
        guarderiasResult,
        aguinaldoResult
      ] = await Promise.all([
        // Ahorro
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesAhorroHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Vivienda
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesViviendaHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Prestaciones
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesPrestacionesHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Cair
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.IndividualesCairHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Transitorio
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.PensionNominaTransitorioHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Guarderias
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.GuarderiasHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Aguinaldo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM aportaciones.AguinaldoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `)
      ]);

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        duracionMs: duration,
        registros: {
          ahorro: ahorroResult.recordset.length,
          vivienda: viviendaResult.recordset.length,
          prestaciones: prestacionesResult.recordset.length,
          cair: cairResult.recordset.length,
          transitorio: transitorioResult.recordset.length,
          guarderias: guarderiasResult.recordset.length,
          aguinaldo: aguinaldoResult.recordset.length
        }
      }, 'Consulta de histórico de aportaciones completada');

      return {
        ahorro: ahorroResult.recordset,
        vivienda: viviendaResult.recordset,
        prestaciones: prestacionesResult.recordset,
        cair: cairResult.recordset,
        transitorio: transitorioResult.recordset,
        guarderias: guarderiasResult.recordset,
        aguinaldo: aguinaldoResult.recordset
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al consultar histórico de aportaciones');

      throw new AplicacionQuincenalError(
        `Error al consultar histórico de aportaciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  async obtenerHistoricoRetenciones(
    org0: string,
    org1: string,
    quincena: number,
    anio: number
  ): Promise<{
    prestamosCortoPlazo: any[];
    prestamosMedianoPlazo: any[];
    prestamosHipotecarios: any[];
  }> {
    const startTime = Date.now();
    const logContext = {
      operation: 'obtenerHistoricoRetenciones',
      org0,
      org1,
      quincena,
      anio
    };

    logger.info(logContext, 'Iniciando consulta de histórico de retenciones');

    try {
      const p = await getPool();

      // Ejecutar todas las consultas en paralelo
      const [
        cortoPlazoResult,
        medianoPlazoResult,
        hipotecariosResult
      ] = await Promise.all([
        // Préstamos Corto Plazo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosCortoPlazoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Préstamos Mediano Plazo
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosMedianoPlazoHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `),
        // Préstamos Hipotecarios
        p.request()
          .input('org0', sql.Char(2), org0)
          .input('org1', sql.Char(2), org1)
          .input('quincena', sql.Int, quincena)
          .input('anio', sql.Int, anio)
          .query(`
            SELECT * FROM retenciones.PrestamosHipotecariosHistorico
            WHERE clave_organica_0 = @org0 AND clave_organica_1 = @org1
              AND quincena = @quincena AND anio = @anio
          `)
      ]);

      const duration = Date.now() - startTime;
      logger.info({
        ...logContext,
        duracionMs: duration,
        registros: {
          prestamosCortoPlazo: cortoPlazoResult.recordset.length,
          prestamosMedianoPlazo: medianoPlazoResult.recordset.length,
          prestamosHipotecarios: hipotecariosResult.recordset.length
        }
      }, 'Consulta de histórico de retenciones completada');

      return {
        prestamosCortoPlazo: cortoPlazoResult.recordset,
        prestamosMedianoPlazo: medianoPlazoResult.recordset,
        prestamosHipotecarios: hipotecariosResult.recordset
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error({
        ...logContext,
        error: error.message || String(error),
        stack: error.stack,
        duracionMs: duration
      }, 'Error al consultar histórico de retenciones');

      throw new AplicacionQuincenalError(
        `Error al consultar histórico de retenciones: ${error.message || String(error)}`,
        AplicacionQuincenalErrorCode.SQL_SERVER_ERROR
      );
    }
  }

  private async assertRetencionSnapshotScope(tx: sql.Transaction, header: {
    liquidacion_snapshot_id: number;
    clave_organica_0: string;
    clave_organica_1: string;
    quincena: number;
    anio: number;
  }): Promise<void> {
    const result = await new sql.Request(tx)
      .input('LiquidacionSnapshotId', sql.BigInt, header.liquidacion_snapshot_id)
      .input('Organica0', sql.Char(2), header.clave_organica_0.padStart(2, '0'))
      .input('Organica1', sql.Char(2), header.clave_organica_1.padStart(2, '0'))
      .input('Quincena', sql.TinyInt, header.quincena)
      .input('Anio', sql.SmallInt, header.anio)
      .query(`
        SELECT TOP (1) 1 AS Existe
        FROM liquidacion.QnaSnapshot WITH (UPDLOCK, HOLDLOCK)
        WHERE LiquidacionSnapshotId=@LiquidacionSnapshotId
          AND Organica0=@Organica0 AND Organica1=@Organica1
          AND Quincena=@Quincena AND Anio=@Anio
          AND Estado='COMPLETO'
      `);
    if (result.recordset.length === 0) {
      throw new AplicacionQuincenalError(
        'El snapshot no corresponde al ámbito de las retenciones',
        AplicacionQuincenalErrorCode.VALIDATION_ERROR
      );
    }
  }

}

