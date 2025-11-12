import { getFirebirdDb } from '../../../../db/firebird.js';
import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0, CreateOrganica0Data, UpdateOrganica0Data } from '../../domain/entities/Organica0.js';
import pino from 'pino';

const logger = pino({
  name: 'Organica0Repository',
  level: process.env.LOG_LEVEL || 'info'
});

export class Organica0Repository implements IOrganica0Repository {
  async findById(claveOrganica: string): Promise<Organica0 | undefined> {
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

  async findAll(): Promise<Organica0[]> {
    logger.info('Starting findAll operation in Organica0Repository');
    const db = getFirebirdDb();
    return new Promise((resolve, reject) => {
      logger.debug('Executing Firebird query for ORGANICA_0');
      db.query(
        'SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0 ORDER BY CLAVE_ORGANICA',
        [],
        (err: any, result: any) => {
          if (err) {
            logger.error({
              error: err.message,
              stack: err.stack,
              operation: 'findAll'
            }, 'Error executing findAll query');
            reject(err);
            return;
          }
          logger.debug(`Query returned ${result.length} rows`);
          const records = result.map((row: any) => ({
            claveOrganica: row.CLAVE_ORGANICA,
            nombreOrganica: row.NOMBRE_ORGANICA,
            usuario: row.USUARIO,
            fechaRegistro: new Date(row.FECHA_REGISTRO),
            fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
            estatus: row.ESTATUS
          }));
          logger.info(`findAll operation completed successfully, returning ${records.length} records`);
          resolve(records);
        }
      );
    });
  }

  async create(data: CreateOrganica0Data): Promise<Organica0> {
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
        (err: any) => {
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

  async update(claveOrganica: string, data: UpdateOrganica0Data): Promise<Organica0> {
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
      const existing = await this.findById(claveOrganica);
      if (!existing) {
        throw new Error('ORGANICA0_NOT_FOUND');
      }
      return existing;
    }

    params.push(claveOrganica);

    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE ORGANICA_0 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA = ?`,
        params,
        async (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Return updated record
          try {
            const updated = await this.findById(claveOrganica);
            if (!updated) {
              reject(new Error('ORGANICA0_NOT_FOUND'));
              return;
            }
            resolve(updated);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async delete(claveOrganica: string): Promise<boolean> {
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
}
