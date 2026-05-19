import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { UltimaAfectacion } from '../../domain/entities/UltimaAfectacion.js';
import { IUltimaAfectacionRepository, UltimaAfectacionFilters } from '../../domain/repositories/IUltimaAfectacionRepository.js';
import pino from 'pino';

const logger = pino({
  name: 'ultimaAfectacionRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class UltimaAfectacionRepository implements IUltimaAfectacionRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async findAll(filters: UltimaAfectacionFilters): Promise<UltimaAfectacion[]> {
    let query = `
      SELECT
        Entidad,
        Anio,
        OrgNivel,
        Org0,
        Org1,
        Org2,
        Org3,
        Quincena,
        Accion,
        Resultado,
        Usuario,
        CreatedAt,
        Mensaje
      FROM afec.v_UltimaAfectacionOrg
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
      // Normalizar org0 a 2 caracteres con padding y trim para eliminar espacios
      const org0Value = String(filters.org0).trim();
      const org0Normalized = org0Value.padStart(2, '0').substring(0, 2);
      // Usar RTRIM y LTRIM en la consulta para manejar espacios en la base de datos
      query += ' AND RTRIM(LTRIM(Org0)) = @org0';
      request.input('org0', sql.Char(2), org0Normalized);
    }
    if (filters.org1) {
      // Normalizar org1 a 2 caracteres con padding y trim para eliminar espacios
      const org1Value = String(filters.org1).trim();
      const org1Normalized = org1Value.padStart(2, '0').substring(0, 2);
      // Usar RTRIM y LTRIM en la consulta para manejar espacios en la base de datos
      query += ' AND RTRIM(LTRIM(Org1)) = @org1';
      request.input('org1', sql.Char(2), org1Normalized);
    }
    if (filters.org2) {
      // Normalizar org2 a 2 caracteres con padding y trim para eliminar espacios
      const org2Value = String(filters.org2).trim();
      const org2Normalized = org2Value.padStart(2, '0').substring(0, 2);
      // Usar RTRIM y LTRIM en la consulta para manejar espacios en la base de datos
      query += ' AND RTRIM(LTRIM(Org2)) = @org2';
      request.input('org2', sql.Char(2), org2Normalized);
    }
    if (filters.org3) {
      // Normalizar org3 a 2 caracteres con padding y trim para eliminar espacios
      const org3Value = String(filters.org3).trim();
      const org3Normalized = org3Value.padStart(2, '0').substring(0, 2);
      // Usar RTRIM y LTRIM en la consulta para manejar espacios en la base de datos
      query += ' AND RTRIM(LTRIM(Org3)) = @org3';
      request.input('org3', sql.Char(2), org3Normalized);
    }
    if (filters.usuario) {
      query += ' AND Usuario = @usuario';
      request.input('usuario', sql.NVarChar(100), filters.usuario);
    }

    // Log de la consulta para debugging
    logger.debug({
      operation: 'findAll',
      filters: {
        org0: filters.org0,
        org1: filters.org1,
        org2: filters.org2,
        org3: filters.org3,
        entidad: filters.entidad,
        anio: filters.anio,
        orgNivel: filters.orgNivel,
        usuario: filters.usuario
      },
      query: query.substring(0, 500) // Primeros 500 caracteres de la query
    }, 'Ejecutando consulta en v_UltimaAfectacionOrg');

    const result = await request.query(query);
    
    logger.debug({
      operation: 'findAll',
      recordCount: result.recordset.length,
      filters: {
        org0: filters.org0,
        org1: filters.org1
      }
    }, 'Resultado de consulta v_UltimaAfectacionOrg');

    // Si no hay resultados y tenemos filtros de org0/org1, intentar consulta directa a BitacoraAfectacionOrg
    if (result.recordset.length === 0 && (filters.org0 || filters.org1)) {
      logger.debug({
        operation: 'findAll',
        fallback: 'consulting BitacoraAfectacionOrg directly'
      }, 'No se encontraron resultados en la vista, consultando BitacoraAfectacionOrg directamente');
      
      let fallbackQuery = `
        SELECT TOP 10
          Entidad,
          Anio,
          OrgNivel,
          Org0,
          Org1,
          Org2,
          Org3,
          Quincena,
          Accion,
          Resultado,
          Usuario,
          CreatedAt,
          Mensaje
        FROM afec.BitacoraAfectacionOrg
        WHERE 1=1
      `;
      
      const fallbackRequest = this.mssqlPool.request();
      
      if (filters.org0) {
        const org0Value = String(filters.org0).trim();
        const org0Normalized = org0Value.padStart(2, '0').substring(0, 2);
        fallbackQuery += ' AND RTRIM(LTRIM(Org0)) = @org0';
        fallbackRequest.input('org0', sql.Char(2), org0Normalized);
      }
      if (filters.org1) {
        const org1Value = String(filters.org1).trim();
        const org1Normalized = org1Value.padStart(2, '0').substring(0, 2);
        fallbackQuery += ' AND RTRIM(LTRIM(Org1)) = @org1';
        fallbackRequest.input('org1', sql.Char(2), org1Normalized);
      }
      
      fallbackQuery += ' ORDER BY CreatedAt DESC';
      
      const fallbackResult = await fallbackRequest.query(fallbackQuery);
      
      logger.debug({
        operation: 'findAll',
        fallbackRecordCount: fallbackResult.recordset.length,
        filters: {
          org0: filters.org0,
          org1: filters.org1
        }
      }, 'Resultado de consulta directa a BitacoraAfectacionOrg');
      
      if (fallbackResult.recordset.length > 0) {
        return fallbackResult.recordset.map((row: any) => ({
          entidad: row.Entidad,
          anio: row.Anio,
          orgNivel: row.OrgNivel,
          org0: row.Org0,
          org1: row.Org1,
          org2: row.Org2,
          org3: row.Org3,
          quincena: row.Quincena,
          accion: row.Accion,
          resultado: row.Resultado,
          usuario: row.Usuario,
          createdAt: row.CreatedAt,
          mensaje: row.Mensaje
        }));
      }
    }

    return result.recordset.map((row: any) => ({
      entidad: row.Entidad,
      anio: row.Anio,
      orgNivel: row.OrgNivel,
      org0: row.Org0,
      org1: row.Org1,
      org2: row.Org2,
      org3: row.Org3,
      quincena: row.Quincena,
      accion: row.Accion,
      resultado: row.Resultado,
      usuario: row.Usuario,
      createdAt: row.CreatedAt,
      mensaje: row.Mensaje
    }));
  }
}
