import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { BitacoraAfectacion } from '../../domain/entities/BitacoraAfectacion.js';
import { IBitacoraAfectacionRepository, BitacoraAfectacionFilters } from '../../domain/repositories/IBitacoraAfectacionRepository.js';

export class BitacoraAfectacionRepository implements IBitacoraAfectacionRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(filters: BitacoraAfectacionFilters): Promise<BitacoraAfectacion[]> {
    let query = `
      SELECT
        AfectacionId,
        OrgNivel,
        Org0,
        Org1,
        Org2,
        Org3,
        Entidad,
        EntidadId,
        Anio,
        Quincena,
        Accion,
        Resultado,
        Mensaje,
        Usuario,
        UserId,
        AppName,
        Ip,
        UserAgent,
        RequestId,
        CreatedAt
      FROM afec.BitacoraAfectacionOrg
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
    if (filters.quincena) {
      query += ' AND Quincena = @quincena';
      request.input('quincena', sql.TinyInt, filters.quincena);
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
    if (filters.accion) {
      query += ' AND Accion = @accion';
      request.input('accion', sql.VarChar(20), filters.accion);
    }
    if (filters.resultado) {
      query += ' AND Resultado = @resultado';
      request.input('resultado', sql.VarChar(10), filters.resultado);
    }

    query += ' ORDER BY CreatedAt DESC';

    if (filters.limit) {
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
      request.input('offset', sql.Int, filters.offset || 0);
      request.input('limit', sql.Int, filters.limit);
    }

    const result = await request.query(query);

    return result.recordset.map((row: any) => ({
      afectacionId: row.AfectacionId,
      orgNivel: row.OrgNivel,
      org0: row.Org0,
      org1: row.Org1,
      org2: row.Org2,
      org3: row.Org3,
      entidad: row.Entidad,
      entidadId: row.EntidadId,
      anio: row.Anio,
      quincena: row.Quincena,
      accion: row.Accion,
      resultado: row.Resultado,
      mensaje: row.Mensaje,
      usuario: row.Usuario,
      userId: row.UserId,
      appName: row.AppName,
      ip: row.Ip,
      userAgent: row.UserAgent,
      requestId: row.RequestId,
      createdAt: row.CreatedAt
    }));
  }
}
