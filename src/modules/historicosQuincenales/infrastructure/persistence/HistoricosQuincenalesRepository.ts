import { ConnectionPool } from 'mssql';
import sql from 'mssql';
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

    return {
      data: recordsets[1] as Record<string, unknown>[],
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
}
