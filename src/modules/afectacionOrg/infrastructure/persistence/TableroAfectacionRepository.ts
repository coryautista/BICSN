import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { TableroAfectacion } from '../../domain/entities/TableroAfectacion.js';
import { ITableroAfectacionRepository, TableroAfectacionFilters } from '../../domain/repositories/ITableroAfectacionRepository.js';

export class TableroAfectacionRepository implements ITableroAfectacionRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(filters: TableroAfectacionFilters): Promise<TableroAfectacion[]> {
    let query = `
      SELECT
        Entidad,
        Anio,
        OrgNivel,
        Org0,
        Org1,
        Org2,
        Org3,
        QuincenaActual,
        UltimaFecha,
        UltimoUsuario,
        Accion,
        Resultado,
        Mensaje
      FROM afec.v_TableroAfectacionesOrg
      WHERE 1=1
    `;
    
    const request = this.mssqlPool.request();

    if (filters.entidad) {
      query += ' AND Entidad = @entidad';
      request.input('entidad', sql.NVarChar(128), filters.entidad);
    }
    if (filters.anio) {
      query += ' AND Anio = @anio';
      request.input('anio', sql.SmallInt, filters.anio);
    }
    if (filters.orgNivel !== undefined) {
      query += ' AND OrgNivel = @orgNivel';
      request.input('orgNivel', sql.TinyInt, filters.orgNivel);
    }
    if (filters.org0) {
      query += ' AND Org0 = @org0';
      request.input('org0', sql.Char(2), filters.org0);
    }
    if (filters.org1) {
      query += ' AND Org1 = @org1';
      request.input('org1', sql.Char(2), filters.org1);
    }
    if (filters.org2) {
      query += ' AND Org2 = @org2';
      request.input('org2', sql.Char(2), filters.org2);
    }
    if (filters.org3) {
      query += ' AND Org3 = @org3';
      request.input('org3', sql.Char(2), filters.org3);
    }

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      entidad: row.Entidad,
      anio: row.Anio,
      orgNivel: row.OrgNivel,
      org0: row.Org0,
      org1: row.Org1,
      org2: row.Org2,
      org3: row.Org3,
      quincenaActual: row.QuincenaActual,
      ultimaFecha: row.UltimaFecha,
      ultimoUsuario: row.UltimoUsuario,
      accion: row.Accion,
      resultado: row.Resultado,
      mensaje: row.Mensaje
    }));
  }
}
