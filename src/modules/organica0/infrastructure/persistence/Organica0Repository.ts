import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import { IOrganica0Repository } from '../../domain/repositories/IOrganica0Repository.js';
import { Organica0, CreateOrganica0Data, UpdateOrganica0Data } from '../../domain/entities/Organica0.js';
import pino from 'pino';

const logger = pino({
  name: 'Organica0Repository',
  level: process.env.LOG_LEVEL || 'info'
});

export class Organica0Repository implements IOrganica0Repository {
  async findById(claveOrganica: string): Promise<Organica0 | undefined> {
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
          // Decodificar resultado de Firebird antes de mapear
          const decodedRow = decodeFirebirdObject(result[0]);
          resolve({
            claveOrganica: decodedRow.CLAVE_ORGANICA,
            nombreOrganica: decodedRow.NOMBRE_ORGANICA,
            usuario: decodedRow.USUARIO,
            fechaRegistro: new Date(decodedRow.FECHA_REGISTRO),
            fechaFin: decodedRow.FECHA_FIN ? new Date(decodedRow.FECHA_FIN) : undefined,
            estatus: decodedRow.ESTATUS
          });
        }
      );
      });
    });
  }

  async findAll(): Promise<Organica0[]> {
    logger.info('Starting findAll operation in Organica0Repository');
    return executeSerializedQuery((db) => {
      return new Promise<Organica0[]>((resolve, reject) => {
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
          logger.info(`findAll operation completed successfully, returning ${records.length} records`);
          resolve(records);
        }
      );
      });
    });
  }

  async create(data: CreateOrganica0Data): Promise<Organica0> {
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
    });
  }

  async update(claveOrganica: string, data: UpdateOrganica0Data): Promise<Organica0> {

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

    return executeSerializedQuery((db) => {
      return new Promise<Organica0>((resolve, reject) => {
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
    });
  }

  async delete(claveOrganica: string): Promise<boolean> {
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

  async isInUse(claveOrganica: string): Promise<boolean> {
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve, reject) => {
      // Check if there are any dependent records in related tables
      const sql = `
        SELECT
          (SELECT COUNT(*) FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ?) +
          (SELECT COUNT(*) FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ?) +
          (SELECT COUNT(*) FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ?) +
          (SELECT COUNT(*) FROM ORG_PERSONAL WHERE CLAVE_ORGANICA_0 = ?) as total_dependents
        FROM RDB$DATABASE
      `;

      db.query(sql, [claveOrganica, claveOrganica, claveOrganica, claveOrganica], (err: any, result: any) => {
        if (err) {
          logger.error({
            error: err.message,
            operation: 'isInUse',
            claveOrganica
          }, 'Error checking if organica0 is in use');
          reject(err);
          return;
        }

        const totalDependents = result[0]?.TOTAL_DEPENDENTS || 0;
        const inUse = totalDependents > 0;

        logger.debug({
          operation: 'isInUse',
          claveOrganica,
          totalDependents,
          inUse
        }, 'Checked organica0 usage');

        resolve(inUse);
      });
      });
    });
  }
}
