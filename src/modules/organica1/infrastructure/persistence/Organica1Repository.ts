import { executeSerializedQuery, decodeFirebirdObject } from '../../../../db/firebird.js';
import { IOrganica1Repository } from '../../domain/repositories/IOrganica1Repository.js';
import { Organica1, CreateOrganica1Data, UpdateOrganica1Data } from '../../domain/entities/Organica1.js';

export class Organica1Repository implements IOrganica1Repository {
  async findById(claveOrganica0: string, claveOrganica1: string): Promise<Organica1 | undefined> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica1 | undefined>((resolve, reject) => {
        db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, DESCRIPCION, TITULAR, RFC, IMSS, INFONAVIT, BANCO_SAR, CUENTA_SAR, TIPO_EMPRESA_SAR, PCP, PH, FV, FG, DI, FECHA_REGISTRO_1, FECHA_FIN_1, USUARIO, ESTATUS, SAR FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?',
        [claveOrganica0, claveOrganica1],
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
            claveOrganica0: decodedRow.CLAVE_ORGANICA_0,
            claveOrganica1: decodedRow.CLAVE_ORGANICA_1,
            descripcion: decodedRow.DESCRIPCION,
            titular: decodedRow.TITULAR,
            rfc: decodedRow.RFC,
            imss: decodedRow.IMSS,
            infonavit: decodedRow.INFONAVIT,
            bancoSar: decodedRow.BANCO_SAR,
            cuentaSar: decodedRow.CUENTA_SAR,
            tipoEmpresaSar: decodedRow.TIPO_EMPRESA_SAR,
            pcp: decodedRow.PCP,
            ph: decodedRow.PH,
            fv: decodedRow.FV,
            fg: decodedRow.FG,
            di: decodedRow.DI,
            fechaRegistro1: new Date(decodedRow.FECHA_REGISTRO_1),
            fechaFin1: decodedRow.FECHA_FIN_1 ? new Date(decodedRow.FECHA_FIN_1) : undefined,
            usuario: decodedRow.USUARIO,
            estatus: decodedRow.ESTATUS,
            sar: decodedRow.SAR
          });
        }
      );
      });
    });
  }

  async findAll(): Promise<Organica1[]> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica1[]>((resolve, reject) => {
        db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, DESCRIPCION, TITULAR, RFC, IMSS, INFONAVIT, BANCO_SAR, CUENTA_SAR, TIPO_EMPRESA_SAR, PCP, PH, FV, FG, DI, FECHA_REGISTRO_1, FECHA_FIN_1, USUARIO, ESTATUS, SAR FROM ORGANICA_1 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1',
        [],
        (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Decodificar resultados de Firebird antes de mapear
          const decodedResult = result.map((row: any) => decodeFirebirdObject(row));
          const records = decodedResult.map((row: any) => ({
            claveOrganica0: row.CLAVE_ORGANICA_0,
            claveOrganica1: row.CLAVE_ORGANICA_1,
            descripcion: row.DESCRIPCION,
            titular: row.TITULAR,
            rfc: row.RFC,
            imss: row.IMSS,
            infonavit: row.INFONAVIT,
            bancoSar: row.BANCO_SAR,
            cuentaSar: row.CUENTA_SAR,
            tipoEmpresaSar: row.TIPO_EMPRESA_SAR,
            pcp: row.PCP,
            ph: row.PH,
            fv: row.FV,
            fg: row.FG,
            di: row.DI,
            fechaRegistro1: new Date(row.FECHA_REGISTRO_1),
            fechaFin1: row.FECHA_FIN_1 ? new Date(row.FECHA_FIN_1) : undefined,
            usuario: row.USUARIO,
            estatus: row.ESTATUS,
            sar: row.SAR
          }));
          resolve(records);
        }
      );
      });
    });
  }

  async findByClaveOrganica0(claveOrganica0: string): Promise<Organica1[]> {
    return executeSerializedQuery((db) => {
      return new Promise<Organica1[]>((resolve, reject) => {
        db.query(
        'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, DESCRIPCION, TITULAR, RFC, IMSS, INFONAVIT, BANCO_SAR, CUENTA_SAR, TIPO_EMPRESA_SAR, PCP, PH, FV, FG, DI, FECHA_REGISTRO_1, FECHA_FIN_1, USUARIO, ESTATUS, SAR FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ? ORDER BY CLAVE_ORGANICA_1',
        [claveOrganica0],
        (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Decodificar resultados de Firebird antes de mapear
          const decodedResult = result.map((row: any) => decodeFirebirdObject(row));
          const records = decodedResult.map((row: any) => ({
            claveOrganica0: row.CLAVE_ORGANICA_0,
            claveOrganica1: row.CLAVE_ORGANICA_1,
            descripcion: row.DESCRIPCION,
            titular: row.TITULAR,
            rfc: row.RFC,
            imss: row.IMSS,
            infonavit: row.INFONAVIT,
            bancoSar: row.BANCO_SAR,
            cuentaSar: row.CUENTA_SAR,
            tipoEmpresaSar: row.TIPO_EMPRESA_SAR,
            pcp: row.PCP,
            ph: row.PH,
            fv: row.FV,
            fg: row.FG,
            di: row.DI,
            fechaRegistro1: new Date(row.FECHA_REGISTRO_1),
            fechaFin1: row.FECHA_FIN_1 ? new Date(row.FECHA_FIN_1) : undefined,
            usuario: row.USUARIO,
            estatus: row.ESTATUS,
            sar: row.SAR
          }));
          resolve(records);
        }
      );
      });
    });
  }

  async create(data: CreateOrganica1Data): Promise<Organica1> {
    const fechaRegistro1 = new Date();

    return executeSerializedQuery((db) => {
      return new Promise<Organica1>((resolve, reject) => {
      db.query(
        'INSERT INTO ORGANICA_1 (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, DESCRIPCION, TITULAR, RFC, IMSS, INFONAVIT, BANCO_SAR, CUENTA_SAR, TIPO_EMPRESA_SAR, PCP, PH, FV, FG, DI, FECHA_REGISTRO_1, FECHA_FIN_1, USUARIO, ESTATUS, SAR) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          data.claveOrganica0,
          data.claveOrganica1,
          data.descripcion || null,
          data.titular || null,
          data.rfc || null,
          data.imss || null,
          data.infonavit || null,
          data.bancoSar || null,
          data.cuentaSar || null,
          data.tipoEmpresaSar || null,
          data.pcp || null,
          data.ph || null,
          data.fv || null,
          data.fg || null,
          data.di || null,
          fechaRegistro1,
          data.fechaFin1 || null,
          data.usuario || null,
          data.estatus,
          data.sar || null
        ],
        (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            claveOrganica0: data.claveOrganica0,
            claveOrganica1: data.claveOrganica1,
            descripcion: data.descripcion,
            titular: data.titular,
            rfc: data.rfc,
            imss: data.imss,
            infonavit: data.infonavit,
            bancoSar: data.bancoSar,
            cuentaSar: data.cuentaSar,
            tipoEmpresaSar: data.tipoEmpresaSar,
            pcp: data.pcp,
            ph: data.ph,
            fv: data.fv,
            fg: data.fg,
            di: data.di,
            fechaRegistro1,
            fechaFin1: data.fechaFin1,
            usuario: data.usuario,
            estatus: data.estatus,
            sar: data.sar
          });
        }
      );
      });
    });
  }

  async update(claveOrganica0: string, claveOrganica1: string, data: UpdateOrganica1Data): Promise<Organica1> {

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
    if (data.rfc !== undefined) {
      updates.push('RFC = ?');
      params.push(data.rfc);
    }
    if (data.imss !== undefined) {
      updates.push('IMSS = ?');
      params.push(data.imss);
    }
    if (data.infonavit !== undefined) {
      updates.push('INFONAVIT = ?');
      params.push(data.infonavit);
    }
    if (data.bancoSar !== undefined) {
      updates.push('BANCO_SAR = ?');
      params.push(data.bancoSar);
    }
    if (data.cuentaSar !== undefined) {
      updates.push('CUENTA_SAR = ?');
      params.push(data.cuentaSar);
    }
    if (data.tipoEmpresaSar !== undefined) {
      updates.push('TIPO_EMPRESA_SAR = ?');
      params.push(data.tipoEmpresaSar);
    }
    if (data.pcp !== undefined) {
      updates.push('PCP = ?');
      params.push(data.pcp);
    }
    if (data.ph !== undefined) {
      updates.push('PH = ?');
      params.push(data.ph);
    }
    if (data.fv !== undefined) {
      updates.push('FV = ?');
      params.push(data.fv);
    }
    if (data.fg !== undefined) {
      updates.push('FG = ?');
      params.push(data.fg);
    }
    if (data.di !== undefined) {
      updates.push('DI = ?');
      params.push(data.di);
    }
    if (data.fechaFin1 !== undefined) {
      updates.push('FECHA_FIN_1 = ?');
      params.push(data.fechaFin1);
    }
    if (data.usuario !== undefined) {
      updates.push('USUARIO = ?');
      params.push(data.usuario);
    }
    if (data.estatus !== undefined) {
      updates.push('ESTATUS = ?');
      params.push(data.estatus);
    }
    if (data.sar !== undefined) {
      updates.push('SAR = ?');
      params.push(data.sar);
    }

    if (updates.length === 0) {
      // No updates, just return current record
      const existing = await this.findById(claveOrganica0, claveOrganica1);
      if (!existing) {
        throw new Error('ORGANICA1_NOT_FOUND');
      }
      return existing;
    }

    params.push(claveOrganica0, claveOrganica1);

    return executeSerializedQuery((db) => {
      return new Promise<Organica1>((resolve, reject) => {
      db.query(
        `UPDATE ORGANICA_1 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?`,
        params,
        async (err: any) => {
          if (err) {
            reject(err);
            return;
          }
          // Return updated record
          try {
            const updated = await this.findById(claveOrganica0, claveOrganica1);
            if (!updated) {
              reject(new Error('ORGANICA1_NOT_FOUND'));
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

  async delete(claveOrganica0: string, claveOrganica1: string): Promise<boolean> {
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve, reject) => {
      db.query(
        'DELETE FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?',
        [claveOrganica0, claveOrganica1],
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

  async isInUse(claveOrganica0: string, claveOrganica1: string): Promise<boolean> {
    return executeSerializedQuery((db) => {
      return new Promise<boolean>((resolve, reject) => {
        // Verificar si hay registros dependientes en ORGANICA_2
        db.query(
        'SELECT COUNT(*) as count FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?',
        [claveOrganica0, claveOrganica1],
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
