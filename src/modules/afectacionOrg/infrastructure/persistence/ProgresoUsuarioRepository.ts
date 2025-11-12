import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { ProgresoUsuario } from '../../domain/entities/ProgresoUsuario.js';
import { IProgresoUsuarioRepository, ProgresoUsuarioFilters } from '../../domain/repositories/IProgresoUsuarioRepository.js';

export class ProgresoUsuarioRepository implements IProgresoUsuarioRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(filters: ProgresoUsuarioFilters): Promise<ProgresoUsuario[]> {
    let query = `
      SELECT
        Entidad,
        Anio,
        OrgNivel,
        Org0,
        Org1,
        Org2,
        Org3,
        Usuario,
        QuincenaUltima,
        FechaUltima
      FROM afec.ProgresoUsuarioOrg
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
    if (filters.usuario) {
      query += ' AND Usuario = @usuario';
      request.input('usuario', sql.NVarChar(100), filters.usuario);
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
      usuario: row.Usuario,
      quincenaUltima: row.QuincenaUltima,
      fechaUltima: row.FechaUltima
    }));
  }
}
