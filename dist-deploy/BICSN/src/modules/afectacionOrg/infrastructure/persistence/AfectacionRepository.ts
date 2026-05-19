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
      // Normalizar las claves orgánicas a 2 caracteres con padding
      const org0Normalized = typeof data.org0 === 'string'
        ? data.org0.padStart(2, '0').substring(0, 2)
        : (data.org0 !== undefined && data.org0 !== null
            ? String(data.org0).padStart(2, '0').substring(0, 2)
            : null);

      const org1Normalized = data.org1 !== undefined && data.org1 !== null
        ? (typeof data.org1 === 'string' 
            ? data.org1.padStart(2, '0').substring(0, 2)
            : String(data.org1).padStart(2, '0').substring(0, 2))
        : null;
      
      // Normalizar org2 y org3: si son null, undefined o vacío, usar "01" por defecto
      const org2Normalized = (!data.org2 || (typeof data.org2 === 'string' && data.org2.trim() === ''))
        ? '01'
        : (typeof data.org2 === 'string'
            ? data.org2.padStart(2, '0').substring(0, 2)
            : String(data.org2).padStart(2, '0').substring(0, 2));
      
      const org3Normalized = (!data.org3 || (typeof data.org3 === 'string' && data.org3.trim() === ''))
        ? '01'
        : (typeof data.org3 === 'string'
            ? data.org3.padStart(2, '0').substring(0, 2)
            : String(data.org3).padStart(2, '0').substring(0, 2));

      // Validar que no exista un registro duplicado antes de insertar
      // Solo validar por: Org0, Org1, Org2, Org3, Anio, Quincena
      const checkDuplicateRequest = this.mssqlPool.request()
        .input('Anio', sql.SmallInt, data.anio)
        .input('Quincena', sql.TinyInt, data.quincena)
        .input('Org0', sql.Char(2), org0Normalized)
        .input('Org1', sql.Char(2), org1Normalized)
        .input('Org2', sql.Char(2), org2Normalized)
        .input('Org3', sql.Char(2), org3Normalized);

      const duplicateCheck = await checkDuplicateRequest.query(`
        SELECT TOP 1 AfectacionId, Resultado, Mensaje, CreatedAt, Anio, Quincena, Accion
        FROM afec.BitacoraAfectacionOrg
        WHERE Anio = @Anio
          AND Quincena = @Quincena
          AND Org0 = @Org0
          AND (Org1 = @Org1 OR (@Org1 IS NULL AND Org1 IS NULL))
          AND Org2 = @Org2
          AND Org3 = @Org3
        ORDER BY CreatedAt DESC
      `);

      if (duplicateCheck.recordset.length > 0) {
        const existingRecord = duplicateCheck.recordset[0];
        logger.info({
          operation: 'registrar',
          entidad: data.entidad,
          anio: data.anio,
          quincena: data.quincena,
          org0: org0Normalized,
          org1: org1Normalized,
          org2: org2Normalized,
          org3: org3Normalized,
          afectacionId: existingRecord.AfectacionId,
          createdAt: existingRecord.CreatedAt
        }, 'Registro existente encontrado, retornando registro duplicado');
        
        // Obtener quincena y año del registro existente desde la base de datos
        const existingQuincena = existingRecord.Quincena || data.quincena;
        const existingAnio = existingRecord.Anio || data.anio;
        
        // Calcular período de trabajo (formato QQAA: quincena 2 dígitos + año 2 últimos dígitos)
        const quincenaStr = String(existingQuincena).padStart(2, '0');
        const anioStr = String(existingAnio).slice(-2);
        const periodo = quincenaStr + anioStr;
        
        // Retornar el registro existente en lugar de lanzar error
        return {
          success: true,
          afectacionId: existingRecord.AfectacionId,
          message: existingRecord.Mensaje || 'Registro existente encontrado',
          quincena: existingQuincena,
          anio: existingAnio,
          periodo: periodo,
          accion: existingRecord.Accion || data.accion
        };
      }

      const request = this.mssqlPool.request()
        .input('Entidad', sql.NVarChar(128), data.entidad)
        .input('Anio', sql.SmallInt, data.anio)
        .input('Quincena', sql.TinyInt, data.quincena)
        .input('OrgNivel', sql.TinyInt, data.orgNivel)
        .input('Org0', sql.Char(2), org0Normalized)
        .input('Org1', sql.Char(2), org1Normalized)
        .input('Org2', sql.Char(2), org2Normalized)
        .input('Org3', sql.Char(2), org3Normalized)
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
        .input('Org0', sql.Char(2), org0Normalized)
        .input('Org1', sql.Char(2), org1Normalized)
        .input('Org2', sql.Char(2), org2Normalized)
        .input('Org3', sql.Char(2), org3Normalized)
        .input('Usuario', sql.NVarChar(100), data.usuario)
        .input('Accion', sql.VarChar(20), data.accion);

      const verifyResult = await verifyRequest.query(`
        SELECT TOP 1 AfectacionId, Resultado, Mensaje, Org0, Org1, Org2, Org3, Accion
        FROM afec.BitacoraAfectacionOrg
        WHERE Entidad = @Entidad
          AND Anio = @Anio
          AND Quincena = @Quincena
          AND Org0 = @Org0
          AND (Org1 = @Org1 OR (@Org1 IS NULL AND Org1 IS NULL))
          AND Org2 = @Org2
          AND Org3 = @Org3
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

      // Calcular período de trabajo (formato QQAA: quincena 2 dígitos + año 2 últimos dígitos)
      const quincenaStr = String(data.quincena).padStart(2, '0');
      const anioStr = String(data.anio).slice(-2);
      const periodo = quincenaStr + anioStr;

      return {
        success: true,
        afectacionId: logEntry.AfectacionId,
        message: logEntry.Mensaje || 'Afectacion registered successfully',
        quincena: data.quincena,
        anio: data.anio,
        periodo: periodo,
        accion: logEntry.Accion || data.accion
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
