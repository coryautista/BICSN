import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { executeSafeQuery } from '../../../../db/firebird.js';
import { HistoricoQuincenalFilters, HistoricoQuincenalResult, HistoricoTipoConfig } from '../../domain/entities/HistoricoQuincenal.js';
import { IHistoricosQuincenalesRepository } from '../../domain/repositories/IHistoricosQuincenalesRepository.js';

const CONFIGS: Record<string, HistoricoTipoConfig> = {
  'aportaciones:ahorro': {
    grupo: 'aportaciones',
    tipo: 'ahorro',
    schema: 'aportaciones',
    table: 'IndividualesAhorroHistorico',
    searchableColumns: ['nombre', 'interno']
  },
  'aportaciones:vivienda': {
    grupo: 'aportaciones',
    tipo: 'vivienda',
    schema: 'aportaciones',
    table: 'IndividualesViviendaHistorico',
    searchableColumns: ['nombre', 'interno']
  },
  'aportaciones:prestaciones': {
    grupo: 'aportaciones',
    tipo: 'prestaciones',
    schema: 'aportaciones',
    table: 'IndividualesPrestacionesHistorico',
    searchableColumns: ['nombre', 'interno']
  },
  'aportaciones:cair': {
    grupo: 'aportaciones',
    tipo: 'cair',
    schema: 'aportaciones',
    table: 'IndividualesCairHistorico',
    searchableColumns: ['nombre', 'interno']
  },
  'aportaciones:transitorio': {
    grupo: 'aportaciones',
    tipo: 'transitorio',
    schema: 'aportaciones',
    table: 'PensionNominaTransitorioHistorico',
    searchableColumns: ['nombres', 'rfc', 'norfc', 'nonombre', 'interno']
  },
  'aportaciones:guarderias': {
    grupo: 'aportaciones',
    tipo: 'guarderias',
    schema: 'aportaciones',
    table: 'GuarderiasHistorico',
    searchableColumns: ['titular_nombre', 'titular_no_empleado', 'titular_rfc', 'menor_nombre', 'menor_rfc']
  },
  'aportaciones:aguinaldo': {
    grupo: 'aportaciones',
    tipo: 'aguinaldo',
    schema: 'aportaciones',
    table: 'AguinaldoHistorico',
    searchableColumns: ['nombres', 'rfc', 'curp', 'noempleado', 'interno']
  },
  'aportaciones:detalle-aguinaldo': {
    grupo: 'aportaciones',
    tipo: 'detalle-aguinaldo',
    schema: 'aportaciones',
    table: 'DetalleHistoricoAguinaldo',
    searchableColumns: ['nombres', 'rfc', 'curp', 'noempleado', 'interno']
  },
  'aportaciones:resumen': {
    grupo: 'aportaciones',
    tipo: 'resumen',
    schema: 'aportaciones',
    table: 'ResumenHistorico',
    searchableColumns: ['tipo_endpoint']
  },
  'retenciones:pcp': {
    grupo: 'retenciones',
    tipo: 'pcp',
    schema: 'retenciones',
    table: 'PrestamosCortoPlazoHistorico',
    searchableColumns: ['nombre', 'rfc', 'interno', 'prestamo']
  },
  'retenciones:pmp': {
    grupo: 'retenciones',
    tipo: 'pmp',
    schema: 'retenciones',
    table: 'PrestamosMedianoPlazoHistorico',
    searchableColumns: ['nombre', 'rfc', 'noemple', 'interno', 'prestamo']
  },
  'retenciones:hip': {
    grupo: 'retenciones',
    tipo: 'hip',
    schema: 'retenciones',
    table: 'PrestamosHipotecariosHistorico',
    searchableColumns: ['nombre', 'rfc', 'noempleado', 'interno', 'pno_solicitud', 'pclave_prestamo']
  },
  'retenciones:resumen': {
    grupo: 'retenciones',
    tipo: 'resumen',
    schema: 'retenciones',
    table: 'ResumenHistorico',
    searchableColumns: ['tipo_endpoint']
  }
};

export class HistoricosQuincenalesRepository implements IHistoricosQuincenalesRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  getConfig(grupo: string, tipo: string): HistoricoTipoConfig | undefined {
    return CONFIGS[`${grupo}:${tipo}`];
  }

  async consultarPorTipo(filters: HistoricoQuincenalFilters): Promise<HistoricoQuincenalResult> {
    const config = this.getConfig(filters.grupo, filters.tipo);
    if (!config) throw new Error('TIPO_HISTORICO_INVALIDO');

    const offset = (filters.page - 1) * filters.pageSize;
    const tableName = `[${config.schema}].[${config.table}]`;
    const request = this.mssqlPool.request()
      .input('org0', sql.Char(2), filters.org0)
      .input('org1', sql.Char(2), filters.org1)
      .input('quincena', sql.Int, filters.quincena)
      .input('anio', sql.Int, filters.anio)
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, filters.pageSize);

    const searchClause = this.buildSearchClause(config, filters.buscar, request);

    const result = await request.query(`
      SELECT COUNT(1) AS Total
      FROM ${tableName}
      WHERE clave_organica_0 = @org0
        AND clave_organica_1 = @org1
        AND quincena = @quincena
        AND anio = @anio
        ${searchClause};

      SELECT *
      FROM ${tableName}
      WHERE clave_organica_0 = @org0
        AND clave_organica_1 = @org1
        AND quincena = @quincena
        AND anio = @anio
        ${searchClause}
      ORDER BY id
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    const total = Number(recordsets[0][0]?.Total ?? 0);

    const data = await this.enriquecerAportacionesHistoricas(recordsets[1] as Record<string, unknown>[], filters);

    return {
      data,
      meta: {
        grupo: config.grupo,
        tipo: config.tipo,
        tabla: `${config.schema}.${config.table}`,
        org0: filters.org0,
        org1: filters.org1,
        periodo: filters.periodo,
        quincena: filters.quincena,
        anio: filters.anio,
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    };
  }

  private buildSearchClause(config: HistoricoTipoConfig, buscar: string | undefined, request: sql.Request): string {
    const value = buscar?.trim();
    if (!value) return '';

    request.input('buscar', sql.NVarChar(200), `%${value}%`);
    request.input('buscarExacto', sql.NVarChar(200), value);

    const clauses = config.searchableColumns.map((column) => {
      if (['interno', 'prestamo', 'pno_solicitud'].includes(column)) {
        return `TRY_CONVERT(NVARCHAR(200), [${column}]) = @buscarExacto`;
      }

      return `[${column}] LIKE @buscar`;
    });

    return `AND (${clauses.join(' OR ')})`;
  }

  private esAportacionRecalculable(filters: HistoricoQuincenalFilters): boolean {
    return filters.grupo === 'aportaciones' && ['ahorro', 'vivienda', 'prestaciones', 'cair'].includes(filters.tipo);
  }

  private normalizarRfc(value: unknown): string | null {
    const rfc = String(value ?? '').trim().toUpperCase();
    return rfc ? rfc : null;
  }

  private normalizarInterno(value: unknown): string | null {
    const interno = String(value ?? '').trim();
    return interno ? interno : null;
  }

  private obtenerRfc(row: Record<string, unknown>): string | null {
    return this.normalizarRfc(row.rfc ?? row.RFC ?? row.titular_rfc ?? row.TitularRFC);
  }

  private obtenerInterno(row: Record<string, unknown>): string | null {
    return this.normalizarInterno(row.interno ?? row.INTERNO ?? row.titular_no_empleado ?? row.TitularNoEmpleado);
  }

  private async obtenerRfcPorInternoMap(org0: string, org1: string, rows: Record<string, unknown>[]): Promise<Map<string, string>> {
    const internos = Array.from(new Set(rows
      .map((row) => this.obtenerInterno(row))
      .filter((interno): interno is string => Boolean(interno))));

    if (internos.length === 0) return new Map();

    const placeholders = internos.map(() => '?').join(', ');
    const result = await executeSafeQuery(`
      SELECT
        CAST(p.INTERNO AS VARCHAR(30)) AS INTERNO,
        p.RFC
      FROM PERSONAL p
      INNER JOIN ORG_PERSONAL o ON o.INTERNO = p.INTERNO
      WHERE o.CLAVE_ORGANICA_0 = ?
        AND o.CLAVE_ORGANICA_1 = ?
        AND CAST(p.INTERNO AS VARCHAR(30)) IN (${placeholders})
    `, [org0, org1, ...internos]);

    const map = new Map<string, string>();
    result.forEach((row: any) => {
      const interno = this.normalizarInterno(row.INTERNO ?? row.interno);
      const rfc = this.normalizarRfc(row.RFC ?? row.rfc);
      if (interno && rfc && !map.has(interno)) map.set(interno, rfc);
    });
    return map;
  }

  private async obtenerDiasLaboradosMap(filters: HistoricoQuincenalFilters, rows: Record<string, unknown>[]): Promise<Map<string, number>> {
    const rfcPorInterno = await this.obtenerRfcPorInternoMap(filters.org0, filters.org1, rows);
    const rfcs = Array.from(new Set(rows
      .map((row) => this.obtenerRfc(row) ?? rfcPorInterno.get(this.obtenerInterno(row) ?? ''))
      .filter((rfc): rfc is string => Boolean(rfc))));

    if (rfcs.length === 0) return new Map();

    const request = this.mssqlPool.request()
      .input('org0', sql.Char(2), filters.org0)
      .input('org1', sql.Char(2), filters.org1)
      .input('quincena', sql.Int, filters.quincena)
      .input('anio', sql.Int, filters.anio);

    const placeholders = rfcs.map((rfc, index) => {
      const name = `rfc${index}`;
      request.input(name, sql.VarChar(20), rfc);
      return `@${name}`;
    }).join(', ');

    const result = await request.query(`
      SELECT UPPER(LTRIM(RTRIM(RFC))) AS rfc, MAX(DiasLaborados) AS dias_laborados
      FROM dbo.NominaAplicacionQnalDetalle
      WHERE Organica0 = @org0
        AND Organica1 = @org1
        AND Anio = @anio
        AND Quincena = @quincena
        AND UPPER(LTRIM(RTRIM(RFC))) IN (${placeholders})
      GROUP BY UPPER(LTRIM(RTRIM(RFC)))
    `);

    const diasMap = new Map<string, number>();
    result.recordset.forEach((row: any) => {
      const rfc = this.normalizarRfc(row.rfc);
      const dias = row.dias_laborados == null ? null : Number(row.dias_laborados);
      if (rfc && dias !== null && Number.isFinite(dias)) diasMap.set(rfc, dias);
    });

    rfcPorInterno.forEach((rfc, interno) => {
      const dias = diasMap.get(rfc);
      if (dias !== undefined) diasMap.set(interno, dias);
    });

    return diasMap;
  }

  private async obtenerPorcentajesMap(): Promise<Map<string, { porcentajePatron: number; porcentajeAfiliado: number }>> {
    const result = await this.mssqlPool.request().query(`
      SELECT TipoFondo, PorcentajePatron, PorcentajeAfiliado
      FROM aportaciones.CatalogoPorcentajeFondo
      WHERE Vigente = 1
        AND TipoFondo IN ('ahorro', 'vivienda', 'prestaciones', 'cair')
    `);

    const map = new Map<string, { porcentajePatron: number; porcentajeAfiliado: number }>();
    result.recordset.forEach((row: any) => {
      const tipo = String(row.TipoFondo ?? '').trim().toLowerCase();
      const porcentajePatron = Number(row.PorcentajePatron ?? 0);
      const porcentajeAfiliado = Number(row.PorcentajeAfiliado ?? 0);
      if (tipo && Number.isFinite(porcentajePatron) && Number.isFinite(porcentajeAfiliado)) {
        map.set(tipo, { porcentajePatron, porcentajeAfiliado });
      }
    });
    return map;
  }

  private recalcularRow(row: Record<string, unknown>, tipo: string, dias: number, porcentajes: { porcentajePatron: number; porcentajeAfiliado: number }): Record<string, unknown> {
    const sueldo = Number(row.sueldo ?? row.Sueldo ?? 0);
    const otrasPrestaciones = Number(row.otras_prestaciones ?? row.OtrasPrestaciones ?? 0);
    const quinquenios = Number(row.quinquenios ?? row.Quinquenios ?? 0);
    const sueldoBase = ((sueldo + otrasPrestaciones + quinquenios) / 30) * dias;

    if (![sueldo, otrasPrestaciones, quinquenios, sueldoBase].every(Number.isFinite)) return row;

    if (tipo === 'ahorro') {
      const afae = ((sueldo / 30) * dias) * porcentajes.porcentajePatron;
      const afaa = ((sueldo / 30) * dias) * porcentajes.porcentajeAfiliado;
      return { ...row, sueldo_base: sueldoBase, afae, afaa, total: afae + afaa };
    }

    if (tipo === 'vivienda' || tipo === 'cair') {
      const afe = ((sueldo / 30) * dias) * porcentajes.porcentajePatron;
      return { ...row, sueldo_base: sueldoBase, afe, total: afe };
    }

    if (tipo === 'prestaciones') {
      const afpe = sueldoBase * porcentajes.porcentajePatron;
      const afpa = sueldoBase * porcentajes.porcentajeAfiliado;
      return { ...row, sueldo_base: sueldoBase, afpe, afpa, total: afpe + afpa };
    }

    return row;
  }

  private async enriquecerAportacionesHistoricas(rows: Record<string, unknown>[], filters: HistoricoQuincenalFilters): Promise<Record<string, unknown>[]> {
    if (!this.esAportacionRecalculable(filters) || rows.length === 0) return rows;

    const [diasMap, porcentajesMap] = await Promise.all([
      this.obtenerDiasLaboradosMap(filters, rows),
      this.obtenerPorcentajesMap()
    ]);
    const porcentajes = porcentajesMap.get(filters.tipo);
    if (!porcentajes) return rows;

    return rows.map((row) => {
      const rfc = this.obtenerRfc(row);
      const interno = this.obtenerInterno(row);
      const dias = (rfc ? diasMap.get(rfc) : undefined) ?? (interno ? diasMap.get(interno) : undefined);
      const recalculado = this.recalcularRow(row, filters.tipo, dias ?? 15, porcentajes);
      return {
        ...recalculado,
        dias_laborados: dias ?? 15,
        dias_laborados_origen: dias === undefined ? 'categoriapuesto' : 'txt'
      };
    });
  }
}
