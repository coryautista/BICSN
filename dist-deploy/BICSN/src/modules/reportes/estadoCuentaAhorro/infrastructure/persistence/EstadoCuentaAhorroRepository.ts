import sql from 'mssql';
import type { ConnectionPool } from 'mssql';
import { decodeFirebirdObject, executeSerializedQuery } from '../../../../../db/firebird.js';
import {
  ConceptoEstadoCuentaAhorro,
  crearImportesCero,
  DetalleEstadoCuentaAhorro,
  EstadoCuentaAhorro,
  FONDOS_ESTADO_CUENTA,
  FondoEstadoCuenta,
  ImportesEstadoCuenta,
  IncidenciaEstadoCuentaAhorro,
  ParametrosEstadoCuentaAhorro,
  recalcularTotal
} from '../../domain/entities/EstadoCuentaAhorro.js';
import { IEstadoCuentaAhorroRepository } from '../../domain/repositories/IEstadoCuentaAhorroRepository.js';

type RegistroFuente = Record<string, unknown>;

const CATALOGO_CONCEPTOS: Array<Omit<ConceptoEstadoCuentaAhorro, 'importes' | 'tieneAdvertencia' | 'procedimientoOrigen' | 'campoOrigen'>> = [
  { orden: 1, clave: 'SALDO_ANTERIOR', concepto: 'SALDO ANTERIOR', tipoMovimiento: 'INFORMATIVO', signo: 0 },
  { orden: 2, clave: 'APLICACION_QUINCENAL', concepto: 'APLICACION QUINCENAL', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 3, clave: 'ALTA_REINGRESO', concepto: 'ALTA O REINGRESO', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 4, clave: 'BAJA', concepto: 'BAJA', tipoMovimiento: 'SALIDA', signo: -1 },
  { orden: 5, clave: 'SUSPENSION_BAJA', concepto: 'SUSPENSION Y BAJA', tipoMovimiento: 'SALIDA', signo: -1 },
  { orden: 6, clave: 'TRASPASO_SALIDA', concepto: 'TRASPASO SALIDA', tipoMovimiento: 'SALIDA', signo: -1 },
  { orden: 7, clave: 'TRASPASO_ENTRADA', concepto: 'TRASPASO ENTRADA', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 8, clave: 'APORTACION_EXTEMPORANEA', concepto: 'APORTACION EXTEMPORANEA', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 9, clave: 'DEVOLUCION_INTERESES_ACTIVOS', concepto: 'DEVOLUCION DE INTERESES ACTIVOS', tipoMovimiento: 'SALIDA', signo: -1 },
  { orden: 10, clave: 'DEVOLUCION_INTERESES_LICENCIAS', concepto: 'DEVOLUCION DE INTERESES LICENCIAS', tipoMovimiento: 'SALIDA', signo: -1 },
  { orden: 11, clave: 'CAPITALIZACION_INTERESES_LICENCIAS', concepto: 'CAPITALIZACION DE INTERESES LICENCIAS', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 12, clave: 'CAPITALIZACION_INTERESES_ACTIVOS', concepto: 'CAPITALIZACION DE INTERESES ACTIVOS', tipoMovimiento: 'ENTRADA', signo: 1 },
  { orden: 13, clave: 'TOTAL', concepto: 'TOTAL', tipoMovimiento: 'INFORMATIVO', signo: 0 },
  { orden: 14, clave: 'SALDO_ACTUAL', concepto: 'SALDO ACTUAL', tipoMovimiento: 'INFORMATIVO', signo: 0 }
];

const CAMPOS_APLICACION: Array<[FondoEstadoCuenta, string]> = [
  ['CAIR', 'SAR'],
  ['FRA', 'FRA'],
  ['FRE', 'FRE'],
  ['FH', 'FH'],
  ['FV', 'FV'],
  ['FAA', 'FAA'],
  ['FAE', 'FAE'],
  ['FAT', 'FAT']
];

const CAMPOS_EXTEMPORANEA: Array<[FondoEstadoCuenta, string]> = [
  ['CAIR', 'Cair'],
  ['FRA', 'Fra'],
  ['FRE', 'Fre'],
  ['FH', 'Fh'],
  ['FV', 'Fv'],
  ['FAA', 'Faa'],
  ['FAE', 'Fae']
];

export class EstadoCuentaAhorroRepository implements IEstadoCuentaAhorroRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async generar(parametros: ParametrosEstadoCuentaAhorro, generadoPor?: string): Promise<EstadoCuentaAhorro> {
    const periodo = this.obtenerPeriodo(parametros.quincena, parametros.anio);
    const incidencias: IncidenciaEstadoCuentaAhorro[] = [];
    const detalles: DetalleEstadoCuentaAhorro[] = [];
    const conceptos = this.crearConceptos();

    const fuentes = await this.obtenerFuentes(parametros, periodo, incidencias);
    this.aplicarResumenAplicacion(fuentes.resumenAplicacion, conceptos, detalles);
    this.aplicarExtemporaneas(fuentes.extemporaneas, conceptos, detalles);

    this.marcarPendientesDeClasificar(fuentes, incidencias);
    this.aplicarTotales(conceptos);

    const estatus = incidencias.some((incidencia) => incidencia.severidad !== 'INFO') ? 'INCOMPLETO' : 'GENERADO';
    const estado: EstadoCuentaAhorro = {
      idHistorico: 0,
      version: 0,
      estatus,
      estadoConciliacion: 'NO_VERIFICABLE',
      periodo,
      fechaCorte: this.obtenerFechaCorte(parametros.quincena, parametros.anio),
      parametros,
      conceptos,
      saldoCalculado: conceptos[13].importes,
      saldoReportado: null,
      diferencia: null,
      incidencias
    };

    const guardado = await this.guardarHistorico(estado, detalles, generadoPor);
    estado.idHistorico = guardado.idHistorico;
    estado.version = guardado.version;
    return estado;
  }

  async obtenerHistorico(idHistorico: number): Promise<EstadoCuentaAhorro | null> {
    const principal = await this.mssqlPool.request()
      .input('idHistorico', sql.BigInt, idHistorico)
      .query(`
        SELECT *
        FROM reportes.EstadoCuentaAhorroHistorico
        WHERE EstadoCuentaAhorroHistoricoId = @idHistorico
      `);

    if (principal.recordset.length === 0) {
      return null;
    }

    const [conceptosResult, incidenciasResult] = await Promise.all([
      this.mssqlPool.request().input('idHistorico', sql.BigInt, idHistorico).query(`
        SELECT * FROM reportes.EstadoCuentaAhorroHistoricoConcepto
        WHERE EstadoCuentaAhorroHistoricoId = @idHistorico ORDER BY Orden
      `),
      this.mssqlPool.request().input('idHistorico', sql.BigInt, idHistorico).query(`
        SELECT * FROM reportes.EstadoCuentaAhorroHistoricoIncidencia
        WHERE EstadoCuentaAhorroHistoricoId = @idHistorico ORDER BY EstadoCuentaAhorroHistoricoIncidenciaId
      `)
    ]);

    const row = principal.recordset[0];
    const parametros: ParametrosEstadoCuentaAhorro = {
      quincena: Number(row.Quincena),
      anio: Number(row.Anio),
      org0: String(row.Org0).trim(),
      org1: String(row.Org1).trim(),
      org2: String(row.Org2).trim(),
      org3: String(row.Org3).trim()
    };

    return {
      idHistorico,
      version: Number(row.Version),
      estatus: row.Estatus,
      estadoConciliacion: row.EstadoConciliacion,
      periodo: String(row.Periodo),
      fechaCorte: new Date(row.FechaCorte).toISOString().slice(0, 10),
      parametros,
      conceptos: conceptosResult.recordset.map((concepto) => this.mapearConceptoHistorico(concepto)),
      saldoCalculado: this.mapearImportes(row, 'SaldoCalculado'),
      saldoReportado: row.SaldoReportadoTotal == null ? null : this.mapearImportes(row, 'SaldoReportado'),
      diferencia: row.DiferenciaTotal == null ? null : this.mapearImportes(row, 'Diferencia'),
      incidencias: incidenciasResult.recordset.map((incidencia) => ({
        severidad: incidencia.Severidad,
        codigo: incidencia.Codigo,
        mensaje: incidencia.Mensaje,
        procedimientoOrigen: incidencia.ProcedimientoOrigen || undefined,
        parametros: incidencia.ParametrosJson ? JSON.parse(incidencia.ParametrosJson) : undefined
      }))
    };
  }

  async obtenerUltimoHistorico(parametros: ParametrosEstadoCuentaAhorro): Promise<EstadoCuentaAhorro | null> {
    const periodo = this.obtenerPeriodo(parametros.quincena, parametros.anio);
    const resultado = await this.mssqlPool.request()
      .input('periodo', sql.Char(4), periodo)
      .input('org0', sql.Char(2), parametros.org0)
      .input('org1', sql.Char(2), parametros.org1)
      .input('org2', sql.Char(2), parametros.org2)
      .input('org3', sql.Char(2), parametros.org3)
      .query(`
        SELECT TOP (1) EstadoCuentaAhorroHistoricoId
        FROM reportes.EstadoCuentaAhorroHistorico
        WHERE Periodo = @periodo AND Org0 = @org0 AND Org1 = @org1 AND Org2 = @org2 AND Org3 = @org3
        ORDER BY Version DESC, EstadoCuentaAhorroHistoricoId DESC
      `);

    if (resultado.recordset.length === 0) {
      return null;
    }
    return this.obtenerHistorico(Number(resultado.recordset[0].EstadoCuentaAhorroHistoricoId));
  }

  private crearConceptos(): ConceptoEstadoCuentaAhorro[] {
    return CATALOGO_CONCEPTOS.map((concepto) => ({ ...concepto, importes: crearImportesCero(), tieneAdvertencia: false }));
  }

  private async obtenerFuentes(parametros: ParametrosEstadoCuentaAhorro, periodo: string, incidencias: IncidenciaEstadoCuentaAhorro[]) {
    const fuentes: Record<string, RegistroFuente[]> = {};
    const ejecutar = async (clave: string, procedimiento: string, consulta: () => Promise<RegistroFuente[]>) => {
      try {
        fuentes[clave] = await consulta();
      } catch (error) {
        fuentes[clave] = [];
        incidencias.push({
          severidad: 'ERROR',
          codigo: 'FUENTE_NO_DISPONIBLE',
          mensaje: `No fue posible consultar ${procedimiento}: ${error instanceof Error ? error.message : String(error)}`,
          procedimientoOrigen: procedimiento
        });
      }
    };

    await ejecutar('resumenAplicacion', 'AP_RESUMEN_ORG_QNA_ALL', () => this.obtenerResumenAplicacion(periodo, parametros));

    try {
      fuentes.extemporaneas = await this.obtenerExtemporaneas(periodo, parametros);
    } catch (error) {
      fuentes.extemporaneas = [];
      incidencias.push({
        severidad: 'ERROR',
        codigo: 'FUENTE_NO_DISPONIBLE',
        mensaje: `No fue posible consultar afi.Formato_Extemporanea: ${error instanceof Error ? error.message : String(error)}`,
        procedimientoOrigen: 'afi.Formato_Extemporanea'
      });
    }

    const rangoFechas = this.obtenerRangoFechas(parametros.quincena, parametros.anio);
    await ejecutar('devolucionesEntregadas', 'SAR_DEVOLUCION_REPORTE (TIPO E)', () =>
      this.obtenerDevolucionesIntereses(rangoFechas.fechaInicio, rangoFechas.fechaFin, 'E', parametros));
    await ejecutar('devolucionesCanceladas', 'SAR_DEVOLUCION_REPORTE (TIPO C)', () =>
      this.obtenerDevolucionesIntereses(rangoFechas.fechaInicio, rangoFechas.fechaFin, 'C', parametros));
    await ejecutar('devolucionesEnTramite', 'SAR_DEVOLUCION_REPORTE (TIPO T)', () =>
      this.obtenerDevolucionesIntereses(rangoFechas.fechaInicio, rangoFechas.fechaFin, 'T', parametros));

    const fuentesPendientes = [
      'HISTORIAL_MOVIMIENTOS_QUIN',
      'HISTORIAL_MOV_PROMEDIO_SDO',
      'ADEUDO_ORGANICA_LAYOUT',
      'SAR_TOTAL_A_ORG',
      'AP_G_FONDOS_REINGRESO',
      'PENSION_NOMINA_QNAL_TRANSITORIO',
      'AP_G_FONDOS_ALTBAJ'
    ];
    for (const procedimiento of fuentesPendientes) {
      incidencias.push({
        severidad: 'ADVERTENCIA',
        codigo: 'FUENTE_PENDIENTE_DE_CATALOGO',
        mensaje: `${procedimiento} no se consulta durante la generacion hasta validar su catalogo de movimientos y evitar demoras sin importes clasificados.`,
        procedimientoOrigen: procedimiento
      });
    }

    return fuentes;
  }

  private obtenerHistorialMovimientos(periodo: string) {
    return this.consultarFirebird('SELECT * FROM HISTORIAL_MOVIMIENTOS_QUIN(?)', [periodo]);
  }

  private obtenerHistorialPromedio(periodo: string, parametros: ParametrosEstadoCuentaAhorro) {
    return this.consultarFirebird('SELECT * FROM HISTORIAL_MOV_PROMEDIO_SDO(?, ?, ?, ?, ?)', [periodo, parametros.org0, parametros.org1, parametros.org2, parametros.org3]);
  }

  private obtenerAdeudoOrganica(periodo: string, parametros: ParametrosEstadoCuentaAhorro) {
    return this.consultarFirebird('SELECT * FROM ADEUDO_ORGANICA_LAYOUT(?, ?, ?, ?, ?)', [parametros.org0, parametros.org1, parametros.org2, parametros.org3, periodo]);
  }

  private obtenerSarTotal(periodo: string) {
    return this.consultarFirebird('SELECT * FROM SAR_TOTAL_A_ORG(?)', [periodo]);
  }

  private async obtenerDevolucionesIntereses(fechaInicio: string, fechaFin: string, tipo: 'E' | 'C' | 'T', parametros: ParametrosEstadoCuentaAhorro) {
    const registros = await this.consultarFirebird('SELECT * FROM SAR_DEVOLUCION_REPORTE(?, ?, ?)', [
      new Date(`${fechaInicio}T00:00:00`),
      new Date(`${fechaFin}T00:00:00`),
      tipo
    ]);
    return registros
      .filter((registro) => ['ORG00', 'ORG11', 'ORG22', 'ORG33'].every((campo, indice) =>
        String(registro[campo] ?? '').trim() === [parametros.org0, parametros.org1, parametros.org2, parametros.org3][indice]))
      .map((registro) => ({ ...registro, TIPO_REPORTE: tipo }));
  }

  private obtenerReingresos(periodo: string) {
    return this.consultarFirebird('SELECT * FROM AP_G_FONDOS_REINGRESO(?)', [periodo]);
  }

  private obtenerPensionTransitorio(periodo: string) {
    return this.consultarFirebird('SELECT * FROM PENSION_NOMINA_QNAL_TRANSITORIO(?)', [periodo]);
  }

  private obtenerAltasBajas(periodo: string, parametros: ParametrosEstadoCuentaAhorro) {
    return this.consultarFirebird('SELECT * FROM AP_G_FONDOS_ALTBAJ(?, ?, ?)', [parametros.org0, parametros.org1, periodo]);
  }

  private obtenerResumenAplicacion(periodo: string, parametros: ParametrosEstadoCuentaAhorro) {
    return this.consultarFirebird('SELECT * FROM AP_RESUMEN_ORG_QNA_ALL(?, ?, ?)', [parametros.org0, parametros.org1, periodo]);
  }

  private async obtenerExtemporaneas(periodo: string, parametros: ParametrosEstadoCuentaAhorro): Promise<RegistroFuente[]> {
    const resultado = await this.mssqlPool.request()
      .input('periodo', sql.Int, Number(periodo))
      .input('org0', sql.VarChar(2), parametros.org0)
      .input('org1', sql.VarChar(2), parametros.org1)
      .input('org2', sql.VarChar(2), parametros.org2)
      .input('org3', sql.VarChar(2), parametros.org3)
      .query(`
        SELECT Id, QnaAplica, Interno, Org0, Org1, Org2, Org3, QnasPlus, Cair, Fra, Fre, Fh, Fv, Faa, Fae, Usuario
        FROM afi.Formato_Extemporanea
        WHERE QnaAplica = @periodo AND Org0 = @org0 AND Org1 = @org1 AND Org2 = @org2 AND Org3 = @org3
      `);
    return resultado.recordset;
  }

  private consultarFirebird(consulta: string, parametros: unknown[]): Promise<RegistroFuente[]> {
    return executeSerializedQuery((db) => new Promise<RegistroFuente[]>((resolve, reject) => {
      db.query(consulta, parametros, (error: Error | null, resultado: RegistroFuente[] | undefined) => {
        if (error) {
          reject(error);
          return;
        }
        resolve((resultado || []).map((registro) => decodeFirebirdObject(registro)));
      });
    }));
  }

  private aplicarResumenAplicacion(registros: RegistroFuente[], conceptos: ConceptoEstadoCuentaAhorro[], detalles: DetalleEstadoCuentaAhorro[]) {
    const concepto = this.buscarConcepto(conceptos, 'APLICACION_QUINCENAL');
    concepto.procedimientoOrigen = 'AP_RESUMEN_ORG_QNA_ALL';
    concepto.campoOrigen = CAMPOS_APLICACION.map(([, campo]) => campo).join(', ');

    for (const registro of registros) {
      for (const [fondo, campo] of CAMPOS_APLICACION) {
        const importe = this.aNumero(registro[campo]);
        if (importe === 0) continue;
        concepto.importes[fondo] += importe;
        detalles.push({
          conceptoClave: concepto.clave,
          procedimientoOrigen: concepto.procedimientoOrigen,
          campoOrigen: campo,
          registroOrigenClave: `${registro.ORG0 ?? ''}-${registro.ORG1 ?? ''}-${registro.QNA ?? ''}`,
          registroOrigen: registro,
          fondo,
          importe,
          signo: concepto.signo,
          tipoMovimiento: concepto.tipoMovimiento
        });
      }
    }
    concepto.importes = recalcularTotal(concepto.importes);
  }

  private aplicarExtemporaneas(registros: RegistroFuente[], conceptos: ConceptoEstadoCuentaAhorro[], detalles: DetalleEstadoCuentaAhorro[]) {
    const concepto = this.buscarConcepto(conceptos, 'APORTACION_EXTEMPORANEA');
    concepto.procedimientoOrigen = 'afi.Formato_Extemporanea';
    concepto.campoOrigen = CAMPOS_EXTEMPORANEA.map(([, campo]) => campo).join(', ');

    for (const registro of registros) {
      for (const [fondo, campo] of CAMPOS_EXTEMPORANEA) {
        const importe = this.aNumero(registro[campo]);
        if (importe === 0) continue;
        concepto.importes[fondo] += importe;
        detalles.push({
          conceptoClave: concepto.clave,
          procedimientoOrigen: concepto.procedimientoOrigen,
          campoOrigen: campo,
          registroOrigenClave: String(registro.Id ?? ''),
          registroOrigen: registro,
          fondo,
          importe,
          signo: concepto.signo,
          tipoMovimiento: concepto.tipoMovimiento
        });
      }
    }
    concepto.importes = recalcularTotal(concepto.importes);
  }

  private marcarPendientesDeClasificar(fuentes: Record<string, RegistroFuente[]>, incidencias: IncidenciaEstadoCuentaAhorro[]) {
    const pendientes: Array<[string, string]> = [
      ['historialMovimientos', 'HISTORIAL_MOVIMIENTOS_QUIN'],
      ['historialPromedio', 'HISTORIAL_MOV_PROMEDIO_SDO'],
      ['adeudoOrganica', 'ADEUDO_ORGANICA_LAYOUT'],
      ['sarTotal', 'SAR_TOTAL_A_ORG'],
      ['devolucionesEntregadas', 'SAR_DEVOLUCION_REPORTE (TIPO E)'],
      ['devolucionesCanceladas', 'SAR_DEVOLUCION_REPORTE (TIPO C)'],
      ['devolucionesEnTramite', 'SAR_DEVOLUCION_REPORTE (TIPO T)'],
      ['reingresos', 'AP_G_FONDOS_REINGRESO'],
      ['pensionTransitorio', 'PENSION_NOMINA_QNAL_TRANSITORIO'],
      ['altasBajas', 'AP_G_FONDOS_ALTBAJ']
    ];

    for (const [clave, procedimiento] of pendientes) {
      if ((fuentes[clave] || []).length > 0) {
        incidencias.push({
          severidad: 'ADVERTENCIA',
          codigo: 'FUENTE_SIN_CATALOGO_DE_MOVIMIENTOS',
          mensaje: `${procedimiento} devolvió registros, pero sus códigos de movimiento aún no están validados para clasificar importes.`,
          procedimientoOrigen: procedimiento,
          parametros: { totalRegistros: fuentes[clave].length }
        });
      }
    }

    incidencias.push({
      severidad: 'ADVERTENCIA',
      codigo: 'SALDO_ANTERIOR_SIN_FUENTE_VALIDADA',
      mensaje: 'No existe una fuente validada para el saldo anterior ni para el saldo reportado por fondo; la conciliación queda como NO_VERIFICABLE.'
    });
  }

  private aplicarTotales(conceptos: ConceptoEstadoCuentaAhorro[]) {
    const saldoAnterior = this.buscarConcepto(conceptos, 'SALDO_ANTERIOR');
    const total = this.buscarConcepto(conceptos, 'TOTAL');
    const saldoActual = this.buscarConcepto(conceptos, 'SALDO_ACTUAL');
    const movimientos = conceptos.slice(1, 12);

    for (const fondo of FONDOS_ESTADO_CUENTA) {
      total.importes[fondo] = movimientos.reduce((acumulado, concepto) => acumulado + concepto.importes[fondo], 0);
      saldoActual.importes[fondo] = saldoAnterior.importes[fondo] + total.importes[fondo];
    }
    total.importes = recalcularTotal(total.importes);
    saldoActual.importes = recalcularTotal(saldoActual.importes);
    saldoAnterior.tieneAdvertencia = true;
    saldoActual.tieneAdvertencia = true;
  }

  private async guardarHistorico(estado: EstadoCuentaAhorro, detalles: DetalleEstadoCuentaAhorro[], generadoPor?: string) {
    const transaccion = new sql.Transaction(this.mssqlPool);
    await transaccion.begin();
    try {
      const versionResult = await new sql.Request(transaccion)
        .input('periodo', sql.Char(4), estado.periodo)
        .input('org0', sql.Char(2), estado.parametros.org0)
        .input('org1', sql.Char(2), estado.parametros.org1)
        .input('org2', sql.Char(2), estado.parametros.org2)
        .input('org3', sql.Char(2), estado.parametros.org3)
        .query(`
          SELECT ISNULL(MAX(Version), 0) + 1 AS Version
          FROM reportes.EstadoCuentaAhorroHistorico WITH (UPDLOCK, HOLDLOCK)
          WHERE Periodo = @periodo AND Org0 = @org0 AND Org1 = @org1 AND Org2 = @org2 AND Org3 = @org3
        `);
      const version = Number(versionResult.recordset[0].Version);
      const solicitud = new sql.Request(transaccion)
        .input('version', sql.Int, version)
        .input('estatus', sql.VarChar(20), estado.estatus)
        .input('periodo', sql.Char(4), estado.periodo)
        .input('quincena', sql.TinyInt, estado.parametros.quincena)
        .input('anio', sql.SmallInt, estado.parametros.anio)
        .input('fechaCorte', sql.Date, estado.fechaCorte)
        .input('org0', sql.Char(2), estado.parametros.org0)
        .input('org1', sql.Char(2), estado.parametros.org1)
        .input('org2', sql.Char(2), estado.parametros.org2)
        .input('org3', sql.Char(2), estado.parametros.org3)
        .input('parametrosJson', sql.NVarChar(sql.MAX), JSON.stringify(estado.parametros))
        .input('totalGeneral', sql.Decimal(19, 2), estado.saldoCalculado.total)
        .input('estadoConciliacion', sql.VarChar(20), estado.estadoConciliacion)
        .input('generadoPor', sql.NVarChar(100), generadoPor || null);

      this.agregarImportes(solicitud, 'SaldoAnterior', estado.conceptos[0].importes);
      this.agregarImportes(solicitud, 'SaldoCalculado', estado.saldoCalculado);
      const historicoResult = await solicitud.query(`
        INSERT INTO reportes.EstadoCuentaAhorroHistorico (
          Version, Estatus, Periodo, Quincena, Anio, FechaCorte, Org0, Org1, Org2, Org3, ParametrosJson,
          SaldoAnteriorCAIR, SaldoAnteriorFRA, SaldoAnteriorFRE, SaldoAnteriorFH, SaldoAnteriorFV, SaldoAnteriorFAA, SaldoAnteriorFAE, SaldoAnteriorFAT, SaldoAnteriorFAI, SaldoAnteriorTotal,
          SaldoCalculadoCAIR, SaldoCalculadoFRA, SaldoCalculadoFRE, SaldoCalculadoFH, SaldoCalculadoFV, SaldoCalculadoFAA, SaldoCalculadoFAE, SaldoCalculadoFAT, SaldoCalculadoFAI, SaldoCalculadoTotal,
          TotalGeneral, EstadoConciliacion, GeneradoPor
        ) OUTPUT INSERTED.EstadoCuentaAhorroHistoricoId VALUES (
          @version, @estatus, @periodo, @quincena, @anio, @fechaCorte, @org0, @org1, @org2, @org3, @parametrosJson,
          @SaldoAnteriorCAIR, @SaldoAnteriorFRA, @SaldoAnteriorFRE, @SaldoAnteriorFH, @SaldoAnteriorFV, @SaldoAnteriorFAA, @SaldoAnteriorFAE, @SaldoAnteriorFAT, @SaldoAnteriorFAI, @SaldoAnteriorTotal,
          @SaldoCalculadoCAIR, @SaldoCalculadoFRA, @SaldoCalculadoFRE, @SaldoCalculadoFH, @SaldoCalculadoFV, @SaldoCalculadoFAA, @SaldoCalculadoFAE, @SaldoCalculadoFAT, @SaldoCalculadoFAI, @SaldoCalculadoTotal,
          @totalGeneral, @estadoConciliacion, @generadoPor
        )
      `);
      const idHistorico = Number(historicoResult.recordset[0].EstadoCuentaAhorroHistoricoId);

      const conceptosIds = new Map<string, number>();
      for (const concepto of estado.conceptos) {
        const request = new sql.Request(transaccion)
          .input('idHistorico', sql.BigInt, idHistorico)
          .input('orden', sql.SmallInt, concepto.orden)
          .input('clave', sql.VarChar(60), concepto.clave)
          .input('concepto', sql.NVarChar(250), concepto.concepto)
          .input('tipoMovimiento', sql.VarChar(20), concepto.tipoMovimiento)
          .input('signo', sql.SmallInt, concepto.signo)
          .input('procedimientoOrigen', sql.NVarChar(150), concepto.procedimientoOrigen || null)
          .input('campoOrigen', sql.NVarChar(150), concepto.campoOrigen || null)
          .input('tieneAdvertencia', sql.Bit, concepto.tieneAdvertencia);
        this.agregarImportes(request, '', concepto.importes);
        const result = await request.query(`
          INSERT INTO reportes.EstadoCuentaAhorroHistoricoConcepto (
            EstadoCuentaAhorroHistoricoId, Orden, Clave, Concepto, TipoMovimiento, Signo,
            CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI, Total, ProcedimientoOrigen, CampoOrigen, TieneAdvertencia
          ) OUTPUT INSERTED.EstadoCuentaAhorroHistoricoConceptoId VALUES (
            @idHistorico, @orden, @clave, @concepto, @tipoMovimiento, @signo,
            @CAIR, @FRA, @FRE, @FH, @FV, @FAA, @FAE, @FAT, @FAI, @total, @procedimientoOrigen, @campoOrigen, @tieneAdvertencia
          )
        `);
        conceptosIds.set(concepto.clave, Number(result.recordset[0].EstadoCuentaAhorroHistoricoConceptoId));
      }

      for (const detalle of detalles) {
        await new sql.Request(transaccion)
          .input('idHistorico', sql.BigInt, idHistorico)
          .input('idConcepto', sql.BigInt, conceptosIds.get(detalle.conceptoClave) || null)
          .input('procedimientoOrigen', sql.NVarChar(150), detalle.procedimientoOrigen)
          .input('campoOrigen', sql.NVarChar(150), detalle.campoOrigen || null)
          .input('registroOrigenClave', sql.NVarChar(250), detalle.registroOrigenClave || null)
          .input('registroOrigenJson', sql.NVarChar(sql.MAX), JSON.stringify(detalle.registroOrigen))
          .input('conceptoClave', sql.VarChar(60), detalle.conceptoClave)
          .input('periodo', sql.Char(4), estado.periodo)
          .input('quincena', sql.TinyInt, estado.parametros.quincena)
          .input('org0', sql.Char(2), estado.parametros.org0)
          .input('org1', sql.Char(2), estado.parametros.org1)
          .input('org2', sql.Char(2), estado.parametros.org2)
          .input('org3', sql.Char(2), estado.parametros.org3)
          .input('fondo', sql.VarChar(10), detalle.fondo || 'SIN_FONDO')
          .input('importe', sql.Decimal(19, 2), detalle.importe ?? null)
          .input('signo', sql.SmallInt, detalle.signo)
          .input('tipoMovimiento', sql.VarChar(20), detalle.tipoMovimiento)
          .query(`
            INSERT INTO reportes.EstadoCuentaAhorroHistoricoDetalle (
              EstadoCuentaAhorroHistoricoId, EstadoCuentaAhorroHistoricoConceptoId, ProcedimientoOrigen, CampoOrigen,
              RegistroOrigenClave, RegistroOrigenJson, ConceptoClave, Periodo, Quincena, Org0, Org1, Org2, Org3,
              Fondo, Importe, Signo, TipoMovimiento
            ) VALUES (
              @idHistorico, @idConcepto, @procedimientoOrigen, @campoOrigen, @registroOrigenClave, @registroOrigenJson,
              @conceptoClave, @periodo, @quincena, @org0, @org1, @org2, @org3, @fondo, @importe, @signo, @tipoMovimiento
            )
          `);
      }

      for (const incidencia of estado.incidencias) {
        await new sql.Request(transaccion)
          .input('idHistorico', sql.BigInt, idHistorico)
          .input('severidad', sql.VarChar(20), incidencia.severidad)
          .input('codigo', sql.VarChar(80), incidencia.codigo)
          .input('mensaje', sql.NVarChar(2000), incidencia.mensaje)
          .input('procedimientoOrigen', sql.NVarChar(150), incidencia.procedimientoOrigen || null)
          .input('parametrosJson', sql.NVarChar(sql.MAX), incidencia.parametros ? JSON.stringify(incidencia.parametros) : null)
          .query(`
            INSERT INTO reportes.EstadoCuentaAhorroHistoricoIncidencia (
              EstadoCuentaAhorroHistoricoId, Severidad, Codigo, Mensaje, ProcedimientoOrigen, ParametrosJson
            ) VALUES (@idHistorico, @severidad, @codigo, @mensaje, @procedimientoOrigen, @parametrosJson)
          `);
      }

      await transaccion.commit();
      return { idHistorico, version };
    } catch (error) {
      await transaccion.rollback();
      throw error;
    }
  }

  private agregarImportes(request: sql.Request, prefijo: string, importes: ImportesEstadoCuenta) {
    for (const fondo of FONDOS_ESTADO_CUENTA) {
      request.input(`${prefijo}${fondo}`, sql.Decimal(19, 2), importes[fondo]);
    }
    request.input(`${prefijo}${prefijo ? 'Total' : 'total'}`, sql.Decimal(19, 2), importes.total);
  }

  private mapearImportes(row: Record<string, unknown>, prefijo: string): ImportesEstadoCuenta {
    const valores = crearImportesCero();
    for (const fondo of FONDOS_ESTADO_CUENTA) valores[fondo] = this.aNumero(row[`${prefijo}${fondo}`]);
    return recalcularTotal(valores);
  }

  private mapearConceptoHistorico(row: Record<string, unknown>): ConceptoEstadoCuentaAhorro {
    const valores = crearImportesCero();
    for (const fondo of FONDOS_ESTADO_CUENTA) valores[fondo] = this.aNumero(row[fondo]);
    return {
      orden: Number(row.Orden),
      clave: String(row.Clave),
      concepto: String(row.Concepto),
      tipoMovimiento: row.TipoMovimiento as ConceptoEstadoCuentaAhorro['tipoMovimiento'],
      signo: Number(row.Signo) as -1 | 0 | 1,
      importes: recalcularTotal(valores),
      procedimientoOrigen: row.ProcedimientoOrigen ? String(row.ProcedimientoOrigen) : undefined,
      campoOrigen: row.CampoOrigen ? String(row.CampoOrigen) : undefined,
      tieneAdvertencia: Boolean(row.TieneAdvertencia)
    };
  }

  private buscarConcepto(conceptos: ConceptoEstadoCuentaAhorro[], clave: string) {
    const concepto = conceptos.find((item) => item.clave === clave);
    if (!concepto) throw new Error(`Concepto no configurado: ${clave}`);
    return concepto;
  }

  private obtenerPeriodo(quincena: number, anio: number) {
    return `${String(quincena).padStart(2, '0')}${String(anio).slice(-2)}`;
  }

  private obtenerFechaCorte(quincena: number, anio: number) {
    return this.obtenerRangoFechas(quincena, anio).fechaFin;
  }

  private obtenerRangoFechas(quincena: number, anio: number) {
    const mes = Math.ceil(quincena / 2);
    const inicio = quincena % 2 === 1 ? 1 : 16;
    const fin = quincena % 2 === 1 ? 15 : new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    const formatear = (dia: number) => new Date(Date.UTC(anio, mes - 1, dia)).toISOString().slice(0, 10);
    return { fechaInicio: formatear(inicio), fechaFin: formatear(fin) };
  }

  private aNumero(valor: unknown) {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? numero : 0;
  }
}
