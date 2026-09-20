import { executeInTransactionWithOutcome, type FirebirdScope, type FirebirdTransactionExecution } from '../../../../db/firebird.js';
import type { NominaAplicacionQnalRegistroParsed } from '../../domain/entities/NominaAplicacionQnalTxt.js';
import {
  NominaLayout20FirebirdSyncError,
  type NominaLayout20FirebirdSyncEvidence,
  type NominaLayout20FirebirdSyncInput,
} from '../../domain/services/NominaLayout20FirebirdSync.js';

interface FirebirdTx {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  execute(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
}

type TransactionRunner = <T>(fn: (tx: FirebirdTx) => Promise<T>, scope: FirebirdScope) => Promise<FirebirdTransactionExecution<T>>;

interface IdentifiedPersonal {
  interno: number;
  plazaOrigen: string;
  organica0: string;
  organica1: string;
  organica2: string;
  organica3: string;
  activo: string;
}

const DETAIL_COLUMNS = [
  'ANIO','QUINCENA','CONSEC','ORGANICA','RFC','NOEMPLEADO','NOMBRES','MOVIMIENTO','FECHAMOV',
  'SUELDOMEN','AYUDASMEN','QUINQMEN','SDOBCOT','AQBCOT','FAA','FAE','EBIA','EBIE','PCP','HIP',
  'VIV','EBI','DOMICILIO','COLONIA','CIUDAD','CLAVE_EDO','CLAVE_MPIO','COD_POS','TELEFONO',
  'FECHANAC','SEXO','EDO_CIVIL','CAIR','CAIRVOL','INTERNO','PLAZAORIGEN','CORG0','CORG1',
  'CORG2','CORG3','ACTIVO','QNA','ENCONTRO','N_ERROR','ORG0','ORG1','FPEA','DESCTOS','AYUDBCOT',
  'QUINQBCOT',
] as const;

const SUMMARY_COLUMNS = [
  'ORG0','ORG1','ORG2','ORG3','PERIODO','TIPO','FA_SA','FO_AFIL','FO_SDO','FO_SDOB','FO_OP','FO_OPB','FO_Q','FO_QB','FO_SAR','FO_FRA','FO_FRE','FO_FHE','FO_FVE','FO_FAA','FO_FAE','FO_FAI','FM_AFIL','FM_SDO','FM_SAR','FM_FRA','FM_FRE','FM_FHE','FM_FVE','FM_FAA','FM_FAE','FR_AFIL','FR_SDO','FR_OP','FR_Q','FR_SAR','FR_FRA','FR_FRE','FR_FHE','FR_FVE','FR_FAA','FR_FAE','FA_PE','FA_FV','FA_SAR','FV_SAR','EBIA','EBIE','EBI_N','PCP_SA','PCP_N_COBRO','PCP_COBRO','PCP_COBRO_K','PCP_COBRO_I','PCP_COBRO_M','PCP_N_NUEVOS','PCP_NUEVOS','PCP_N_ALTAS','PCP_ALTAS','PCP_N_BAJAS','PCP_BAJAS','PCP_N_CANCELADO','PCP_CANCELADO','PCP_N_DIRECTOS','PCP_DIRECTOS','PPV_N_HIP','PPV_HIP_K','PPV_HIP_M','PPV_HIP_S','PPV_HIP_I','PPV_N_PC','PPV_PC_K','PPV_PC_M','PPV_PC_S','PPV_PC_I','PMP_N_EV','PMP_EV','PMP_EV_K','PMP_EV_M','PMP_EV_S','PMP_EV_I','PMP_N_GM','PMP_GM','PMP_GM_K','PMP_GM_M','PMP_GM_S','PMP_GM_I','PMP_N_AV','PMP_AV','PMP_AV_K','PMP_AV_M','PMP_AV_S','PMP_AV_I','PMP_N_ET','PMP_ET','PMP_ET_K','PMP_ET_M','PMP_ET_S','PMP_ET_I','PMP_N_CO','PMP_CO','PMP_CO_K','PMP_CO_M','PMP_CO_S','PMP_CO_I','FMOV_ALT'
] as const;

const FECHANAC_DEFAULT = new Date(2050, 0, 1);
const PAD2 = (value: string): string => value.trim().padStart(2, '0');

export class NominaLayout20FirebirdSyncService {
  constructor(private readonly runTransaction: TransactionRunner = executeInTransactionWithOutcome) {}

  async sincronizar(input: NominaLayout20FirebirdSyncInput): Promise<FirebirdTransactionExecution<NominaLayout20FirebirdSyncEvidence>> {
    if (['01', '02'].includes(input.scope.organica0)) {
      throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_ORGANICA_NO_CERTIFICADA', 'ORG0 01/02 no está soportada: ORGANICA no está certificada.');
    }
    if (input.registros.length === 0) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_SIN_DETALLES');

    const lote = parseLote(input.registros);
    return this.runTransaction((tx) => this.sincronizarEnTransaccion(tx, input, lote), {
      org0: input.scope.organica0,
      org1: input.scope.organica1,
    });
  }

  async corregirPendientesEnSitio(input: NominaLayout20FirebirdSyncInput): Promise<FirebirdTransactionExecution<NominaLayout20FirebirdSyncEvidence>> {
    if (['01', '02'].includes(input.scope.organica0)) {
      throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_ORGANICA_NO_CERTIFICADA', 'ORG0 01/02 no está soportada: ORGANICA no está certificada.');
    }
    if (input.registros.length === 0) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_SIN_DETALLES');
    const lote = parseLote(input.registros);
    return this.runTransaction((tx) => this.corregirPendientesEnTransaccion(tx, input, lote), {
      org0: input.scope.organica0,
      org1: input.scope.organica1,
    });
  }

  private async sincronizarEnTransaccion(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote): Promise<NominaLayout20FirebirdSyncEvidence> {
    const scope = [lote.periodo, input.scope.organica0, input.scope.organica1];
    const applied = await tx.query("SELECT COUNT(*) AS TOTAL FROM AP_D_ORIGEN_TODOS WHERE QNA = ? AND ORG0 = ? AND ORG1 = ? AND STATUS = 'A'", scope);
    if (number(applied[0], 'TOTAL') !== 0) {
      throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_SCOPE_APLICADO', 'La quincena ya fue aplicada (STATUS A); no se puede recargar el TXT.');
    }
    const detailPrecheck = await tx.query('SELECT COUNT(*) AS TOTAL FROM AP_D_ORIGEN_TODOS WHERE QNA = ? AND ORG0 = ? AND ORG1 = ?', scope);
    const summaryPrecheck = await tx.query('SELECT COUNT(*) AS TOTAL FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ?', scope);
    if (number(detailPrecheck[0], 'TOTAL') !== 0 || number(summaryPrecheck[0], 'TOTAL') !== 0) {
      try {
        await tx.execute('DELETE FROM AP_D_ORIGEN_TODOS WHERE QNA = ? AND ORG0 = ? AND ORG1 = ?', scope);
        await tx.execute('DELETE FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ?', scope);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_RECARGA_FALLIDA', message);
      }
    }

    for (const registro of input.registros) await insertDetail(tx, input, lote, registro);
    const initial = await statusCounts(tx, scope);
    if (initial.n !== input.registros.length || initial.p !== 0) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_DETALLE_N_INCONSISTENTE');

    await tx.execute("UPDATE AP_D_ORIGEN_TODOS SET STATUS = 'P' WHERE QNA = ? AND ORG0 = ? AND ORG1 = ? AND STATUS = 'N'", scope);
    const totals = await aggregateSummary(tx, input, lote);
    const fechaResumen = summaryDate(input);
    await insertSummary(tx, input, lote, totals, fechaResumen);

    const final = await statusCounts(tx, scope);
    const summary = await tx.query(`SELECT ${SUMMARY_NUMERIC_COLUMNS.join(', ')}, FMOV_ALT FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ? AND TIPO = ?`, [...scope, 'AN']);
    if (final.n !== 0 || final.p !== input.registros.length || summary.length !== 1) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_CONCILIACION_FALLIDA');
    for (const key of SUMMARY_NUMERIC_COLUMNS) {
      if (money(number(summary[0], key)) !== money(totals[key] ?? 0)) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_TOTALES_INCONSISTENTES', `El campo ${key} no concilia.`);
    }
    assertSummaryDate(summary[0], fechaResumen);
    return { periodo: lote.periodo, detallesEsperados: input.registros.length, detallesP: final.p, resumenes: 1, totales: totals };
  }

  private async corregirPendientesEnTransaccion(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote): Promise<NominaLayout20FirebirdSyncEvidence> {
    const scope = [lote.periodo, input.scope.organica0, input.scope.organica1];
    const counts = await tx.query("SELECT COUNT(*) AS TOTAL, SUM(CASE WHEN STATUS='A' THEN 1 ELSE 0 END) AS TOTAL_A, SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) AS TOTAL_P FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?", scope);
    if (number(counts[0], 'TOTAL_A') !== 0) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_SCOPE_APLICADO');
    if (number(counts[0], 'TOTAL') !== input.registros.length || number(counts[0], 'TOTAL_P') !== input.registros.length) {
      throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_REPARACION_SCOPE_INCONSISTENTE');
    }
    const summaries = await tx.query('SELECT COUNT(*) AS TOTAL FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO=? AND ORG0=? AND ORG1=?', scope);
    if (number(summaries[0], 'TOTAL') !== 1) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_REPARACION_RESUMEN_INCONSISTENTE');

    for (const registro of input.registros) await updateDetail(tx, input, lote, registro);
    const totals = await aggregateSummary(tx, input, lote);
    const fechaResumen = summaryDate(input);
    const summaryParams = SUMMARY_UPDATABLE_NUMERIC_COLUMNS.map((column) => totals[column] ?? 0);
    await tx.execute(`UPDATE AP_D_ORIGEN_RESUMEN SET ${SUMMARY_UPDATABLE_NUMERIC_COLUMNS.map((column) => `${column}=?`).join(', ')}, FMOV_ALT=? WHERE PERIODO=? AND ORG0=? AND ORG1=? AND TIPO='AN'`, [...summaryParams, fechaResumen, ...scope]);

    const final = await statusCounts(tx, scope);
    const summary = await tx.query(`SELECT ${SUMMARY_UPDATABLE_NUMERIC_COLUMNS.join(', ')}, FMOV_ALT FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO=? AND ORG0=? AND ORG1=? AND TIPO='AN'`, scope);
    if (final.n !== 0 || final.p !== input.registros.length || summary.length !== 1) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_CONCILIACION_FALLIDA');
    for (const key of SUMMARY_UPDATABLE_NUMERIC_COLUMNS) {
      if (money(number(summary[0], key)) !== money(totals[key] ?? 0)) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_TOTALES_INCONSISTENTES', `El campo ${key} no concilia.`);
    }
    assertSummaryDate(summary[0], fechaResumen);
    return { periodo: lote.periodo, detallesEsperados: input.registros.length, detallesP: final.p, resumenes: 1, totales: totals };
  }
}

interface Lote { anio: string; quincena: string; periodo: string }

function parseLote(registros: NominaAplicacionQnalRegistroParsed[]): Lote {
  const lote = registros[0].lote;
  if (!/^\d{7}$/.test(lote) || registros.some((item) => item.lote !== lote)) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_LOTE_INVALIDO');
  const anio = lote.slice(2, 4);
  const quincena = lote.slice(4, 7);
  return { anio, quincena, periodo: `${quincena.slice(1)}${anio}` };
}

async function insertDetail(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote, row: NominaAplicacionQnalRegistroParsed): Promise<void> {
  const personal = await identifyPersonal(tx, input.scope, row);
  const params = detailValues(input, lote, row, personal);
  if (params.length !== DETAIL_COLUMNS.length) {
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_INSERT_DETALLE_INVALIDO', `Se esperaban ${DETAIL_COLUMNS.length} valores y se construyeron ${params.length}.`);
  }
  try {
    await tx.execute(
      `INSERT INTO AP_D_ORIGEN_TODOS (${DETAIL_COLUMNS.join(', ')}) VALUES (${params.map(() => '?').join(', ')})`,
      params
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_INSERT_DETALLE_FALLIDO', `Línea ${row.numeroLinea}: ${message}`);
  }
}

async function updateDetail(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote, row: NominaAplicacionQnalRegistroParsed): Promise<void> {
  const personal = await identifyPersonal(tx, input.scope, row);
  const params = detailValues(input, lote, row, personal);
  try {
    await tx.execute(`UPDATE AP_D_ORIGEN_TODOS SET ${DETAIL_COLUMNS.map((column) => `${column}=?`).join(', ')} WHERE QNA=? AND ORG0=? AND ORG1=? AND UPPER(TRIM(RFC))=? AND STATUS='P'`, [
      ...params, lote.periodo, input.scope.organica0, input.scope.organica1, row.rfc.trim().toUpperCase(),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_UPDATE_DETALLE_FALLIDO', `Línea ${row.numeroLinea}: ${message}`);
  }
}

function detailValues(input: NominaLayout20FirebirdSyncInput, lote: Lote, row: NominaAplicacionQnalRegistroParsed, personal: IdentifiedPersonal): unknown[] {
  const s = input.scope;
  return [
    lote.anio, lote.quincena, row.tipoRegistro, ' ', row.rfc, row.clavePersonal, row.nombreAfiliado,
    ' ', row.fechaMovimiento, row.sueldoMensual, row.ayudasMensuales ?? 0, row.quinqueniosMensual ?? 0,
    row.baseCotizacionSueldo, row.baseCotizacionQuinquenios ?? 0,
    row.aportacionEntidadFondoAhorro ?? 0, 0, 0, 0,
    row.descuentoPrestamoCortoPlazo ?? 0, row.descuentoPrestamoHipotecario ?? 0, 0, 0,
    '.', '.', '.', '.', '.', '.', '.', FECHANAC_DEFAULT, '.', '.',
    row.cair ?? 0, row.cairVoluntario ?? 0,
    personal.interno, personal.plazaOrigen, PAD2(personal.organica0), PAD2(personal.organica1),
    PAD2(personal.organica2), PAD2(personal.organica3), personal.activo, lote.periodo, 'S', 0,
    s.organica0, s.organica1, row.aportacionAfiliadoFondoAhorro ?? 0, row.descuentosOtros ?? 0, 0, 0,
  ];
}

async function identifyPersonal(
  tx: FirebirdTx,
  scope: NominaLayout20FirebirdSyncInput['scope'],
  row: NominaAplicacionQnalRegistroParsed
): Promise<IdentifiedPersonal> {
  const matches = await tx.query(`
    SELECT P.INTERNO, TRIM(P.NOEMPLEADO) AS PLAZAORIGEN,
      TRIM(O.CLAVE_ORGANICA_0) AS CORG0, TRIM(O.CLAVE_ORGANICA_1) AS CORG1,
      TRIM(O.CLAVE_ORGANICA_2) AS CORG2, TRIM(O.CLAVE_ORGANICA_3) AS CORG3,
      TRIM(O.ACTIVO) AS ACTIVO
    FROM PERSONAL P
    INNER JOIN ORG_PERSONAL O ON O.INTERNO = P.INTERNO
    WHERE UPPER(TRIM(P.RFC)) = ?
      AND O.CLAVE_ORGANICA_0 = ? AND O.CLAVE_ORGANICA_1 = ?
      AND O.CLAVE_ORGANICA_2 = ? AND O.CLAVE_ORGANICA_3 = ?
      AND O.ACTIVO = 'A'
  `, [row.rfc.trim().toUpperCase(), scope.organica0, scope.organica1, scope.organica2, scope.organica3]);

  if (matches.length === 0) {
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_PERSONAL_NO_IDENTIFICADO', `Línea ${row.numeroLinea}: no existe una coincidencia activa en PERSONAL + ORG_PERSONAL para el scope.`);
  }
  if (matches.length !== 1) {
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_PERSONAL_AMBIGUO', `Línea ${row.numeroLinea}: existe más de una coincidencia activa en PERSONAL + ORG_PERSONAL para el scope.`);
  }

  const match = matches[0];
  const interno = Number(value(match, 'INTERNO'));
  const plazaOrigen = String(value(match, 'PLAZAORIGEN') ?? '').trim();
  if (!Number.isInteger(interno) || interno <= 0 || !plazaOrigen) {
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_PERSONAL_INCOMPLETO', `Línea ${row.numeroLinea}: PERSONAL + ORG_PERSONAL no proporciona INTERNO y PLAZAORIGEN válidos.`);
  }

  return {
    interno,
    plazaOrigen,
    organica0: String(value(match, 'CORG0') ?? '').trim(),
    organica1: String(value(match, 'CORG1') ?? '').trim(),
    organica2: String(value(match, 'CORG2') ?? '').trim(),
    organica3: String(value(match, 'CORG3') ?? '').trim(),
    activo: String(value(match, 'ACTIVO') ?? '').trim(),
  };
}

async function statusCounts(tx: FirebirdTx, scope: unknown[]) {
  const rows = await tx.query("SELECT SUM(CASE WHEN STATUS = 'N' THEN 1 ELSE 0 END) AS N, SUM(CASE WHEN STATUS = 'P' THEN 1 ELSE 0 END) AS P FROM AP_D_ORIGEN_TODOS WHERE QNA = ? AND ORG0 = ? AND ORG1 = ?", scope);
  return { n: number(rows[0], 'N'), p: number(rows[0], 'P') };
}

async function aggregateSummary(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote): Promise<Record<string, number>> {
  const s = input.scope;
  const p = [lote.periodo, s.organica0, s.organica1, s.organica2, s.organica3];
  const [fondos, minimos, pcp, hip, pc, ebi, pmp] = await Promise.all([
    aggregate(tx, 'AP_DN_FONDOS', 'SELECT COUNT(*) FO_AFIL, COALESCE(SUM(SUELDOM),0) FO_SDO, COALESCE(SUM(SUELDOB),0) FO_SDOB, COALESCE(SUM(OPM),0) FO_OP, COALESCE(SUM(PRESB),0) FO_OPB, COALESCE(SUM(QM),0) FO_Q, COALESCE(SUM(SARE),0) FO_SAR, COALESCE(SUM(FRA),0) FO_FRA, COALESCE(SUM(FRE),0) FO_FRE, COALESCE(SUM(FHE),0) FO_FHE, COALESCE(SUM(FVE),0) FO_FVE, COALESCE(SUM(FAA),0) FO_FAA, COALESCE(SUM(FAE),0) FO_FAE, COALESCE(SUM(FAI),0) FO_FAI FROM AP_DN_FONDOS(?,?,?,?,?)', p),
    aggregate(tx, 'AP_DN_MINIMOS', 'SELECT COUNT(*) FM_AFIL, COALESCE(SUM(SAA),0) FM_SDO, COALESCE(SUM(SARE),0) FM_SAR, COALESCE(SUM(FRA),0) FM_FRA, COALESCE(SUM(FRE),0) FM_FRE, COALESCE(SUM(FHE),0) FM_FHE, COALESCE(SUM(FVE),0) FM_FVE, COALESCE(SUM(FAA),0) FM_FAA, COALESCE(SUM(FAE),0) FM_FAE FROM AP_DN_MINIMOS(?,?,?,?,?)', p),
    aggregate(tx, 'AP_DN_PCP_COBRAR', 'SELECT COUNT(*) PCP_N_COBRO, COALESCE(SUM(MONTO),0) PCP_COBRO, COALESCE(SUM(CAPITAL),0) PCP_COBRO_K, COALESCE(SUM(INTERES),0) PCP_COBRO_I, COALESCE(SUM(MORATORIOS),0) PCP_COBRO_M FROM AP_DN_PCP_COBRAR(?,?,?,?,?)', p),
    aggregate(tx, 'AP_DN_PPV_HIP_TIPO4', 'SELECT COUNT(*) PPV_N_HIP, COALESCE(SUM(CAPITAL),0) PPV_HIP_K, COALESCE(SUM(MORATORIOS),0) PPV_HIP_M, COALESCE(SUM(SEGURO),0) PPV_HIP_S, COALESCE(SUM(COALESCE(INTERES,0) + COALESCE(INTERES_D,0)),0) PPV_HIP_I FROM AP_DN_PPV_HIP(?,?,?,?,?) WHERE CLASE <> 4', p),
    aggregate(tx, 'AP_DN_PPV_HIP_TIPO5', 'SELECT COUNT(*) PPV_N_PC, COALESCE(SUM(CAPITAL),0) PPV_PC_K, COALESCE(SUM(MORATORIOS),0) PPV_PC_M, COALESCE(SUM(SEGURO),0) PPV_PC_S, COALESCE(SUM(COALESCE(INTERES,0) + COALESCE(INTERES_D,0)),0) PPV_PC_I FROM AP_DN_PPV_HIP(?,?,?,?,?) WHERE CLASE = 4', p),
    aggregate(tx, 'AP_DN_EBI', 'SELECT COALESCE(MAX(EBIA),0) EBIA, COALESCE(MAX(EBIE),0) EBIE, COALESCE(MAX(EBIC),0) EBI_N FROM AP_DN_EBI(?,?,?,?,?)', p),
    aggregate(tx, 'AP_DN_PMP', 'SELECT CLASE, COUNT(*) N, COALESCE(SUM(CAPITAL),0) K, COALESCE(SUM(MORATORIOS),0) M, COALESCE(SUM(SEGURO),0) S, COALESCE(SUM(INTERES),0) I FROM AP_DN_PMP(?,?,?,?,?) WHERE CLASE BETWEEN 1 AND 5 GROUP BY CLASE', p),
  ]);
  const totals: Record<string, number> = {};
  for (const row of [fondos[0], minimos[0], pcp[0], hip[0], pc[0], ebi[0]]) for (const [key, raw] of Object.entries(row ?? {})) totals[key.toUpperCase()] = Number(raw ?? 0);
  const classes: Record<number, string> = { 1: 'EV', 2: 'GM', 3: 'AV', 4: 'ET', 5: 'CO' };
  for (const row of pmp) {
    const clase = number(row, 'CLASE');
    const suffix = classes[clase];
    if (!suffix) throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_PMP_CLASE_INVALIDA', `AP_DN_PMP devolvió la clase no soportada ${clase}.`);
    for (const key of ['N','K','M','S','I']) totals[`PMP_${key === 'N' ? 'N_' : ''}${suffix}${key === 'N' ? '' : `_${key}`}`] = number(row, key);
    totals[`PMP_${suffix}`] = number(row, 'K') + number(row, 'S') + number(row, 'I');
  }
  return totals;
}

// Columnas que el legacy deja en NULL (el trigger AP_D_ORIGEN_RESUMEN_BI0 no las
// normaliza a cero). Omitirlas del INSERT reproduce el resumen de Produccion.
const SUMMARY_NULL_COLUMNS = ['FR_AFIL', 'PCP_N_NUEVOS', 'PCP_N_ALTAS', 'PCP_N_BAJAS', 'PCP_N_CANCELADO', 'PCP_N_DIRECTOS'] as const;

async function insertSummary(tx: FirebirdTx, input: NominaLayout20FirebirdSyncInput, lote: Lote, totals: Record<string, number>, fechaResumen: Date) {
  const identity: Record<string, unknown> = { ORG0: input.scope.organica0, ORG1: input.scope.organica1, ORG2: input.scope.organica2, ORG3: input.scope.organica3, PERIODO: lote.periodo, TIPO: 'AN', FMOV_ALT: fechaResumen };
  const columns = SUMMARY_COLUMNS.filter((column) => !(SUMMARY_NULL_COLUMNS as readonly string[]).includes(column));
  const params = columns.map((column) => Object.hasOwn(identity, column) ? identity[column] : totals[column] ?? 0);
  await tx.execute(`INSERT INTO AP_D_ORIGEN_RESUMEN (${columns.join(', ')}) VALUES (${params.map(() => '?').join(', ')})`, params);
}

function value(row: Record<string, unknown> | undefined, key: string): unknown {
  if (!row) return undefined;
  return row[key] ?? row[key.toLowerCase()];
}
function number(row: Record<string, unknown> | undefined, key: string): number { return Number(value(row, key) ?? 0); }
function money(value: number): number { return Math.round(value * 100); }
function summaryDate(input: NominaLayout20FirebirdSyncInput): Date { return input.fechaResumen ?? new Date(); }
function assertSummaryDate(row: Record<string, unknown>, expected: Date): void {
  const actualValue = value(row, 'FMOV_ALT');
  const actual = actualValue instanceof Date ? actualValue : new Date(String(actualValue ?? ''));
  if (!Number.isFinite(actual.getTime()) || localDateTime(actual) !== localDateTime(expected)) {
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_FECHA_RESUMEN_INCONSISTENTE');
  }
}
function localDateTime(date: Date): string {
  return [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()].join('-');
}
async function aggregate(tx: FirebirdTx, name: string, sql: string, params: unknown[]) {
  try {
    return await tx.query(sql, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new NominaLayout20FirebirdSyncError('NOMINA_FIREBIRD_AUXILIAR_FALLIDO', `${name}: ${message}`);
  }
}

const SUMMARY_NUMERIC_COLUMNS = SUMMARY_COLUMNS.filter((column) => !['ORG0', 'ORG1', 'ORG2', 'ORG3', 'PERIODO', 'TIPO', 'FMOV_ALT'].includes(column));
const SUMMARY_UPDATABLE_NUMERIC_COLUMNS = SUMMARY_NUMERIC_COLUMNS.filter((column) => !(SUMMARY_NULL_COLUMNS as readonly string[]).includes(column));
