import { ConnectionPool } from 'mssql';
import sql from 'mssql';
import { QuincenaInfo } from '../../domain/entities/QuincenaInfo.js';
import { IQuincenaRepository, QuincenaFilters } from '../../domain/repositories/IQuincenaRepository.js';

export class QuincenaRepository implements IQuincenaRepository {
  constructor(private mssqlPool: ConnectionPool) {}

  async getQuincenaAltaAfectacion(filters?: QuincenaFilters): Promise<QuincenaInfo> {
    let query = `
      SELECT TOP 1
        Anio,
        QuincenaActual,
        UltimaFecha
      FROM afec.EstadoAfectacionOrg
      WHERE 1=1
    `;
    
    const request = this.mssqlPool.request();

    if (filters?.entidad) {
      query += ' AND Entidad = @entidad';
      request.input('entidad', sql.NVarChar(128), filters.entidad);
    }
    if (filters?.org0) {
      query += ' AND Org0 = @org0';
      request.input('org0', sql.Char(2), filters.org0);
    }
    if (filters?.org1) {
      query += ' AND Org1 = @org1';
      request.input('org1', sql.Char(2), filters.org1);
    }
    if (filters?.org2) {
      query += ' AND Org2 = @org2';
      request.input('org2', sql.Char(2), filters.org2);
    }
    if (filters?.org3) {
      query += ' AND Org3 = @org3';
      request.input('org3', sql.Char(2), filters.org3);
    }

    query += ' ORDER BY Anio DESC, QuincenaActual DESC';
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      // No previous affectations for this organica, start from quincena 1 of current year
      const now = new Date();
      const year = now.getFullYear();
      
      return {
        anio: year,
        mes: 1,
        quincena: 1,
        fechaActual: now.toISOString(),
        descripcion: `Quincena 1 de 01/${year} (primera afectación para esta orgánica)`,
        esNueva: true
      };
    }
    
    const lastAfectacion = result.recordset[0];
    const lastYear = lastAfectacion.Anio;
    const lastQuincena = lastAfectacion.QuincenaActual;
    
    // Calculate current quincena based on current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentQuincenaMonth = currentDay <= 15 ? 1 : 2;
    const currentQuincenaYear = (currentMonth - 1) * 2 + currentQuincenaMonth;
    
    // Check if the last affected quincena is still active
    const isActive = (lastYear === currentYear && lastQuincena === currentQuincenaYear);
    
    if (isActive) {
      // Return the active quincena
      return {
        anio: lastYear,
        mes: currentMonth,
        quincena: lastQuincena,
        fechaActual: now.toISOString(),
        descripcion: `Quincena ${lastQuincena} de ${currentMonth.toString().padStart(2, '0')}/${lastYear} (activa)`,
        esNueva: false
      };
    } else {
      // Calculate next quincena
      let nextYear = lastYear;
      let nextQuincena = lastQuincena + 1;
      
      if (nextQuincena > 24) {
        nextQuincena = 1;
        nextYear = lastYear + 1;
      }
      
      // If next quincena is still in the past, keep advancing until we reach current or future
      while (nextYear < currentYear || (nextYear === currentYear && nextQuincena < currentQuincenaYear)) {
        nextQuincena++;
        if (nextQuincena > 24) {
          nextQuincena = 1;
          nextYear++;
        }
      }
      
      return {
        anio: nextYear,
        mes: currentMonth,
        quincena: nextQuincena,
        fechaActual: now.toISOString(),
        descripcion: `Quincena ${nextQuincena} de ${currentMonth.toString().padStart(2, '0')}/${nextYear} (siguiente)`,
        esNueva: false
      };
    }
  }
}
