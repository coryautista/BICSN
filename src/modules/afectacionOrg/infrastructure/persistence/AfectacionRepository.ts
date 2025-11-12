import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { RegistrarAfectacionData, RegistrarAfectacionResult } from '../../domain/entities/RegistrarAfectacion.js';
import { IAfectacionRepository } from '../../domain/repositories/IAfectacionRepository.js';
import pino from 'pino';

const logger = pino({
  name: 'afectacionRepository',
  level: process.env.LOG_LEVEL || 'info'
});

export class AfectacionRepository implements IAfectacionRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async registrar(data: RegistrarAfectacionData): Promise<RegistrarAfectacionResult> {
    try {
      const request = this.mssqlPool.request()
        .input('Entidad', sql.NVarChar(128), data.entidad)
        .input('Anio', sql.SmallInt, data.anio)
        .input('Quincena', sql.TinyInt, data.quincena)
        .input('OrgNivel', sql.TinyInt, data.orgNivel)
        .input('Org0', sql.Char(2), data.org0)
        .input('Org1', sql.Char(2), data.org1 || null)
        .input('Org2', sql.Char(2), data.org2 || null)
        .input('Org3', sql.Char(2), data.org3 || null)
        .input('Accion', sql.VarChar(20), data.accion)
        .input('Resultado', sql.VarChar(10), data.resultado)
        .input('Mensaje', sql.NVarChar(4000), data.mensaje || null)
        .input('Usuario', sql.NVarChar(100), data.usuario)
        .input('AppName', sql.NVarChar(100), data.appName)
        .input('Ip', sql.NVarChar(64), data.ip);

      await request.execute('afec.usp_RegistrarAfectacionOrg');

      // Verify the stored procedure executed successfully
      const verifyRequest = this.mssqlPool.request()
        .input('Entidad', sql.NVarChar(128), data.entidad)
        .input('Anio', sql.SmallInt, data.anio)
        .input('Quincena', sql.TinyInt, data.quincena)
        .input('Usuario', sql.NVarChar(100), data.usuario)
        .input('Accion', sql.VarChar(20), data.accion);

      const verifyResult = await verifyRequest.query(`
        SELECT TOP 1 AfectacionId, Resultado, Mensaje
        FROM afec.BitacoraAfectacionOrg
        WHERE Entidad = @Entidad
          AND Anio = @Anio
          AND Quincena = @Quincena
          AND Usuario = @Usuario
          AND Accion = @Accion
        ORDER BY CreatedAt DESC
      `);

      if (verifyResult.recordset.length === 0) {
        throw new Error('Afectacion registration failed: No record found in audit log');
      }

      const logEntry = verifyResult.recordset[0];
      if (logEntry.Resultado !== 'OK') {
        throw new Error(`Afectacion registration failed: ${logEntry.Mensaje || 'Unknown error'}`);
      }

      return {
        success: true,
        afectacionId: logEntry.AfectacionId,
        message: logEntry.Mensaje || 'Afectacion registered successfully'
      };

    } catch (error: any) {
      logger.error({
        operation: 'registrar',
        entidad: data.entidad,
        anio: data.anio,
        quincena: data.quincena,
        error: error.message,
        stack: error.stack
      }, 'Error al registrar afectación en repository');

      if (error.message.includes('Afectacion registration failed')) {
        throw error;
      }

      if (error.code) {
        throw new Error(`Database error during affectation registration: ${error.message}`);
      }

      throw new Error(`Failed to register affectation: ${error.message}`);
    }
  }
}
