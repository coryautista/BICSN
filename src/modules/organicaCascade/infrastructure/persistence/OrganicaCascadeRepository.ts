import { IOrganicaCascadeRepository } from '../../domain/repositories/IOrganicaCascadeRepository.js';
import { OrganicaChild } from '../../domain/entities/OrganicaChild.js';
import { executeSerializedQuery } from '../../../../db/firebird.js';

export class OrganicaCascadeRepository implements IOrganicaCascadeRepository {
  async findOrganica1ByOrganica0(claveOrganica0: string): Promise<OrganicaChild[]> {
    return executeSerializedQuery((db) => {
      return new Promise<OrganicaChild[]>((resolve, reject) => {
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
    });
  }

  async findOrganica2ByOrganica1(claveOrganica0: string, claveOrganica1: string): Promise<OrganicaChild[]> {
    return executeSerializedQuery((db) => {
      return new Promise<OrganicaChild[]>((resolve, reject) => {
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
    });
  }

  async findOrganica3ByOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<OrganicaChild[]> {
    return executeSerializedQuery((db) => {
      return new Promise<OrganicaChild[]>((resolve, reject) => {
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
    });
  }
}
