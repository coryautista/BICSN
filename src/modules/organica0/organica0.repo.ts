import { getFirebirdDb } from '../../db/firebird.js';
import { Organica0, CreateOrganica0, UpdateOrganica0 } from './organica0.schemas.js';

// [FIREBIRD] Repository for ORGANICA_0 table operations
export async function findOrganica0ById(claveOrganica: string): Promise<Organica0 | undefined> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
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
        const row = result[0];
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
}

export async function listOrganica0(): Promise<Organica0[]> {
  const db = getFirebirdDb();
  const startTime = Date.now();
  console.log(`[DEBUG] listOrganica0: Starting query at ${new Date().toISOString()}`);
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0 ORDER BY CLAVE_ORGANICA',
      [],
      (err: any, result: any) => {
        const queryEndTime = Date.now();
        console.log(`[DEBUG] listOrganica0: Query completed in ${queryEndTime - startTime}ms`);
        if (err) {
          reject(err);
          return;
        }
        console.log(`[DEBUG] listOrganica0: Raw result count: ${result ? result.length : 0}`);
        const mapStartTime = Date.now();
        const records = result.map((row: any) => ({
          claveOrganica: row.CLAVE_ORGANICA,
          nombreOrganica: row.NOMBRE_ORGANICA,
          usuario: row.USUARIO,
          fechaRegistro: new Date(row.FECHA_REGISTRO),
          fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
          estatus: row.ESTATUS
        }));
        const mapEndTime = Date.now();
        console.log(`[DEBUG] listOrganica0: Mapping completed in ${mapEndTime - mapStartTime}ms, total records: ${records.length}`);
        console.log(`[DEBUG] listOrganica0: Total function time: ${mapEndTime - startTime}ms`);
        resolve(records);
      }
    );
  });
}

export async function createOrganica0(data: CreateOrganica0): Promise<Organica0> {
  const db = getFirebirdDb();
  const fechaRegistro = new Date();

  return new Promise((resolve, reject) => {
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
}

export async function updateOrganica0(claveOrganica: string, data: UpdateOrganica0): Promise<Organica0 | undefined> {
  const db = getFirebirdDb();

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

  return new Promise((resolve, reject) => {
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
}

export async function deleteOrganica0(claveOrganica: string): Promise<boolean> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
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
}