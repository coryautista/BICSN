import { executeSerializedQuery, executeSafeQuery, decodeFirebirdObject } from '../../db/firebird.js';
import { Organica0, CreateOrganica0, UpdateOrganica0 } from './organica0.schemas.js';

// [FIREBIRD] Repository for ORGANICA_0 table operations
export async function findOrganica0ById(claveOrganica: string): Promise<Organica0 | undefined> {
  return executeSerializedQuery((db) => {
    return new Promise<Organica0 | undefined>((resolve, reject) => {
      db.query(
        'SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0 WHERE CLAVE_ORGANICA = ?',
        [claveOrganica],
        (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          if (!result || result.length === 0) {
            resolve(undefined);
            return;
          }
          // Decodificar resultados de Firebird antes de mapear
          const row = decodeFirebirdObject(result[0]);
          resolve({
            claveOrganica: row.CLAVE_ORGANICA,
            nombreOrganica: row.NOMBRE_ORGANICA,
            usuario: row.USUARIO,
            fechaRegistro: new Date(row.FECHA_REGISTRO),
            fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
            estatus: row.ESTATUS
          });
        }
      );
    });
  });
}

export async function listOrganica0(limit?: number, offset?: number): Promise<Organica0[]> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`[DEBUG] [${requestId}] listOrganica0: Starting query at ${new Date().toISOString()}`);
  console.log(`[DEBUG] [${requestId}] listOrganica0: Request params - limit: ${limit}, offset: ${offset}`);
  
  // Build query with optional pagination (Firebird syntax)
  let query = 'SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0';
  let params: any[] = [];
  
  query += ' ORDER BY CLAVE_ORGANICA';
  
  if (limit && limit > 0) {
    if (offset && offset > 0) {
      // Firebird ROWS syntax: ROWS start TO end
      query += ' ROWS ? TO ?';
      params = [offset + 1, offset + limit];
    } else {
      // Firebird ROWS syntax: ROWS count
      query += ' ROWS ?';
      params = [limit];
    }
  } 
  
  console.log(`[DEBUG] [${requestId}] listOrganica0: Query built: ${query.substring(0, 100)}...`);
  
  return executeSerializedQuery((db) => {
    return new Promise<Organica0[]>((resolve, reject) => {
      const queryStartTime = Date.now();
      db.query(query, params, (err: any, result: any) => {
        const queryEndTime = Date.now();
        const queryDuration = queryEndTime - queryStartTime;
        
        console.log(`[DEBUG] [${requestId}] listOrganica0: Database query completed in ${queryDuration}ms`);
        console.log(`[DEBUG] [${requestId}] listOrganica0: Raw result count: ${result ? result.length : 0}`);
        
        if (err) {
          console.error(`[DEBUG] [${requestId}] listOrganica0: Database error:`, err.message);
          reject(err);
          return;
        }
        
        if (!result || result.length === 0) {
          console.log(`[DEBUG] [${requestId}] listOrganica0: No records found, returning empty array`);
          resolve([]);
          return;
        }
        
        const mapStartTime = Date.now();
        // Decodificar resultados de Firebird antes de mapear
        const decodedResult = result.map((row: any) => decodeFirebirdObject(row));
        const records = decodedResult.map((row: any) => ({
          claveOrganica: row.CLAVE_ORGANICA,
          nombreOrganica: row.NOMBRE_ORGANICA,
          usuario: row.USUARIO,
          fechaRegistro: new Date(row.FECHA_REGISTRO),
          fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
          estatus: row.ESTATUS
        }));
        const mapEndTime = Date.now();
        const mapDuration = mapEndTime - mapStartTime;
        
        const totalDuration = mapEndTime - startTime;
        console.log(`[DEBUG] [${requestId}] listOrganica0: Mapping completed in ${mapDuration}ms, total records: ${records.length}`);
        console.log(`[DEBUG] [${requestId}] listOrganica0: Total function time: ${totalDuration}ms`);
        
        if (totalDuration > 5000) {
          console.warn(`[DEBUG] [${requestId}] listOrganica0: SLOW OPERATION DETECTED - took ${totalDuration}ms`);
        }
        
        resolve(records);
      });
    });
  });
}

// Add count function for pagination
export async function countOrganica0(): Promise<number> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`[DEBUG] [${requestId}] countOrganica0: Starting count query at ${new Date().toISOString()}`);
  
  return executeSerializedQuery((db) => {
    return new Promise<number>((resolve, reject) => {
      const queryStartTime = Date.now();
      db.query('SELECT COUNT(*) as TOTAL FROM ORGANICA_0', [], (err: any, result: any) => {
        const queryEndTime = Date.now();
        const queryDuration = queryEndTime - queryStartTime;
        
        console.log(`[DEBUG] [${requestId}] countOrganica0: Database count query completed in ${queryDuration}ms`);
        
        if (err) {
          console.error(`[DEBUG] [${requestId}] countOrganica0: Database error:`, err.message);
          reject(err);
          return;
        }
        
        const totalDuration = Date.now() - startTime;
        // Decodificar resultado de Firebird antes de leer valores (aunque COUNT retorna números, es buena práctica)
        const decodedRow = result[0] ? decodeFirebirdObject(result[0]) : null;
        const total = decodedRow?.TOTAL || decodedRow?.total || 0;
        console.log(`[DEBUG] [${requestId}] countOrganica0: Total count: ${total}, completed in ${totalDuration}ms`);
        
        resolve(total);
      });
    });
  });
}

export async function createOrganica0(data: CreateOrganica0): Promise<Organica0> {
  const fechaRegistro = new Date();

  return executeSerializedQuery((db) => {
    return new Promise<Organica0>((resolve, reject) => {
      db.query(
        'INSERT INTO ORGANICA_0 (CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS) VALUES (?, ?, ?, ?, ?, ?)',
        [
          data.claveOrganica,
          data.nombreOrganica,
          data.usuario || null,
          fechaRegistro,
          data.fechaFin || null,
          data.estatus
        ],
        (err: any, _result: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            claveOrganica: data.claveOrganica,
            nombreOrganica: data.nombreOrganica,
            usuario: data.usuario,
            fechaRegistro,
            fechaFin: data.fechaFin,
            estatus: data.estatus
          });
        }
      );
    });
  });
}

export async function updateOrganica0(claveOrganica: string, data: UpdateOrganica0): Promise<Organica0 | undefined> {
  // Build dynamic update query
  const updates: string[] = [];
  const params: any[] = [];

  if (data.nombreOrganica !== undefined) {
    updates.push('NOMBRE_ORGANICA = ?');
    params.push(data.nombreOrganica);
  }
  if (data.usuario !== undefined) {
    updates.push('USUARIO = ?');
    params.push(data.usuario);
  }
  if (data.fechaFin !== undefined) {
    updates.push('FECHA_FIN = ?');
    params.push(data.fechaFin);
  }
  if (data.estatus !== undefined) {
    updates.push('ESTATUS = ?');
    params.push(data.estatus);
  }

  if (updates.length === 0) {
    // No updates, just return current record
    return findOrganica0ById(claveOrganica);
  }

  params.push(claveOrganica);

  return executeSerializedQuery((db) => {
    return new Promise<Organica0 | undefined>((resolve, reject) => {
      db.query(
        `UPDATE ORGANICA_0 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA = ?`,
        params,
        (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Return updated record
          findOrganica0ById(claveOrganica).then(resolve).catch(reject);
        }
      );
    });
  });
}

export async function deleteOrganica0(claveOrganica: string): Promise<boolean> {
  return executeSerializedQuery((db) => {
    return new Promise<boolean>((resolve, reject) => {
      db.query(
        'DELETE FROM ORGANICA_0 WHERE CLAVE_ORGANICA = ?',
        [claveOrganica],
        (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result > 0);
        }
      );
    });
  });
}