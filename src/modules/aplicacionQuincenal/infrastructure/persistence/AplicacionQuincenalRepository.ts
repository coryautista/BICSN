import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import { IAplicacionQuincenalRepository } from '../../domain/repositories/IAplicacionQuincenalRepository.js';
import { AportacionQuincenalResumen } from '../../domain/entities/AportacionQuincenalResumen.js';
import { AplicacionQuincenalError, AplicacionQuincenalErrorCode } from '../../domain/errors.js';
import pino from 'pino';

const logger = pino({
  name: 'AplicacionQuincenalRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AplicacionQuincenalRepository implements IAplicacionQuincenalRepository {
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
}

