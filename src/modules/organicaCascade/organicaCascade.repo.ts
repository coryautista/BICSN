import { getFirebirdDb } from '../../db/firebird.js';

// Get Organica1 children for a given Organica0
export async function getOrganica1ByOrganica0(claveOrganica0: string): Promise<any[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        CLAVE_ORGANICA_0, 
        CLAVE_ORGANICA_1, 
        DESCRIPCION, 
        TITULAR,
        ESTATUS
      FROM ORGANICA_1 
      WHERE CLAVE_ORGANICA_0 = ?
      ORDER BY CLAVE_ORGANICA_1`,
      [claveOrganica0],
      (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        const records = result.map((row: any) => ({
          claveOrganica0: row.CLAVE_ORGANICA_0,
          claveOrganica1: row.CLAVE_ORGANICA_1,
          descripcion: row.DESCRIPCION,
          titular: row.TITULAR,
          estatus: row.ESTATUS
        }));
        resolve(records);
      }
    );
  });
}

// Get Organica2 children for a given Organica1
export async function getOrganica2ByOrganica1(claveOrganica0: string, claveOrganica1: string): Promise<any[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        CLAVE_ORGANICA_0, 
        CLAVE_ORGANICA_1, 
        CLAVE_ORGANICA_2,
        DESCRIPCION, 
        TITULAR,
        ESTATUS
      FROM ORGANICA_2 
      WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?
      ORDER BY CLAVE_ORGANICA_2`,
      [claveOrganica0, claveOrganica1],
      (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        const records = result.map((row: any) => ({
          claveOrganica0: row.CLAVE_ORGANICA_0,
          claveOrganica1: row.CLAVE_ORGANICA_1,
          claveOrganica2: row.CLAVE_ORGANICA_2,
          descripcion: row.DESCRIPCION,
          titular: row.TITULAR,
          estatus: row.ESTATUS
        }));
        resolve(records);
      }
    );
  });
}

// Get Organica3 children for a given Organica2
export async function getOrganica3ByOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<any[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        CLAVE_ORGANICA_0, 
        CLAVE_ORGANICA_1, 
        CLAVE_ORGANICA_2,
        CLAVE_ORGANICA_3,
        DESCRIPCION, 
        TITULAR,
        ESTATUS
      FROM ORGANICA_3 
      WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?
      ORDER BY CLAVE_ORGANICA_3`,
      [claveOrganica0, claveOrganica1, claveOrganica2],
      (err: any, result: any) => {
        if (err) {
          reject(err);
          return;
        }
        const records = result.map((row: any) => ({
          claveOrganica0: row.CLAVE_ORGANICA_0,
          claveOrganica1: row.CLAVE_ORGANICA_1,
          claveOrganica2: row.CLAVE_ORGANICA_2,
          claveOrganica3: row.CLAVE_ORGANICA_3,
          descripcion: row.DESCRIPCION,
          titular: row.TITULAR,
          estatus: row.ESTATUS
        }));
        resolve(records);
      }
    );
  });
}
