import { executeSerializedQuery } from '../../../../db/firebird.js';
import { IOrganica2Repository } from '../../domain/repositories/IOrganica2Repository.js';
import { Organica2, CreateOrganica2Data, UpdateOrganica2Data } from '../../domain/entities/Organica2.js';

export class Organica2Repository implements IOrganica2Repository {
  async findById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<Organica2 | undefined> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica2 | undefined>((resolve, reject) => {
      db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?',
        [claveOrganica0, claveOrganica1, claveOrganica2],
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
            claveOrganica0: row.CLAVE_ORGANICA_0,
            claveOrganica1: row.CLAVE_ORGANICA_1,
            claveOrganica2: row.CLAVE_ORGANICA_2,
            descripcion: row.DESCRIPCION,
            titular: row.TITULAR,
            fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
            fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
            usuario: row.USUARIO,
            estatus: row.ESTATUS
          });
        }
      );
      });
    });
  }

  async findAll(): Promise<Organica2[]> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica2[]>((resolve, reject) => {
      db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2',
        [],
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
            fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
            fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
            usuario: row.USUARIO,
            estatus: row.ESTATUS
          }));
          resolve(records);
        }
      );
      });
    });
  }

  async findByClaveOrganica0And1(claveOrganica0: string, claveOrganica1: string): Promise<Organica2[]> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica2[]>((resolve, reject) => {
      db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? ORDER BY CLAVE_ORGANICA_2',
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
            fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
            fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
            usuario: row.USUARIO,
            estatus: row.ESTATUS
          }));
          resolve(records);
        }
      );
      });
    });
  }

  async create(data: CreateOrganica2Data): Promise<Organica2> {
    const fechaRegistro2 = new Date();

    // Primero hacer el INSERT
    await executeSerializedQuery((db) => {
      return new Promise<void>((resolve, reject) => {
        db.query(
          'INSERT INTO ORGANICA_2 (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            data.claveOrganica0,
            data.claveOrganica1,
            data.claveOrganica2,
            data.descripcion || null,
            data.titular || null,
            fechaRegistro2,
            data.fechaFin2 || null,
            data.usuario || null,
            data.estatus
          ],
          (err: any) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
    });

    // Luego recuperar el registro completo
    const created = await this.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2);
    if (created) {
      return created;
    }

    // Si no se puede recuperar, devolver los datos insertados con estructura completa
    return {
      claveOrganica0: data.claveOrganica0,
      claveOrganica1: data.claveOrganica1,
      claveOrganica2: data.claveOrganica2,
      descripcion: data.descripcion ?? undefined,
      titular: data.titular ?? undefined,
      fechaRegistro2,
      fechaFin2: data.fechaFin2 ?? undefined,
      usuario: data.usuario ?? undefined,
      estatus: data.estatus
    };
  }

  async update(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2Data): Promise<Organica2> {

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (data.descripcion !== undefined) {
      updates.push('DESCRIPCION = ?');
      params.push(data.descripcion);
    }
    if (data.titular !== undefined) {
      updates.push('TITULAR = ?');
      params.push(data.titular);
    }
    if (data.fechaFin2 !== undefined) {
      updates.push('FECHA_FIN_2 = ?');
      params.push(data.fechaFin2);
    }
    if (data.usuario !== undefined) {
      updates.push('USUARIO = ?');
      params.push(data.usuario);
    }
    if (data.estatus !== undefined) {
      updates.push('ESTATUS = ?');
      params.push(data.estatus);
    }

    if (updates.length === 0) {
      // No updates, just return current record
      const existing = await this.findById(claveOrganica0, claveOrganica1, claveOrganica2);
      if (!existing) {
        throw new Error('ORGANICA2_NOT_FOUND');
      }
      return existing;
    }

    params.push(claveOrganica0, claveOrganica1, claveOrganica2);

    return executeSerializedQuery((db) => {
      return new Promise<Organica2>((resolve, reject) => {
      db.query(
        `UPDATE ORGANICA_2 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?`,
        params,
        async (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Return updated record
          try {
            const updated = await this.findById(claveOrganica0, claveOrganica1, claveOrganica2);
            if (!updated) {
              reject(new Error('ORGANICA2_NOT_FOUND'));
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

  async delete(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<boolean> {
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve, reject) => {
      db.query(
        'DELETE FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?',
        [claveOrganica0, claveOrganica1, claveOrganica2],
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

  async isInUse(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<boolean> {
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve, reject) => {
      // Verificar si hay registros dependientes en ORGANICA_3
      db.query(
        'SELECT COUNT(*) as count FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?',
        [claveOrganica0, claveOrganica1, claveOrganica2],
        (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          const count = result[0].COUNT;
          resolve(count > 0);
        }
      );
      });
    });
  }
}
