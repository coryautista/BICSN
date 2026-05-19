import { IOrgPersonalRepository } from '../../domain/repositories/IOrgPersonalRepository.js';
import { OrgPersonal, CreateOrgPersonalData, UpdateOrgPersonalData } from '../../domain/entities/OrgPersonal.js';
import { executeSerializedQuery, executeSafeQuery } from '../../../../db/firebird.js';

const toIsoString = (value: any): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
  }
  try {
    return String(value);
  } catch {
    return null;
  }
};

const mapOrgPersonalRow = (row: any): OrgPersonal => ({
  interno: row.INTERNO || row.interno || null,
  clave_organica_0: row.CLAVE_ORGANICA_0 || row.clave_organica_0 || null,
  clave_organica_1: row.CLAVE_ORGANICA_1 || row.clave_organica_1 || null,
  clave_organica_2: row.CLAVE_ORGANICA_2 || row.clave_organica_2 || null,
  clave_organica_3: row.CLAVE_ORGANICA_3 || row.clave_organica_3 || null,
  sueldo: row.SUELDO || row.sueldo || null,
  otras_prestaciones: row.OTRAS_PRESTACIONES || row.otras_prestaciones || null,
  quinquenios: row.QUINQUENIOS || row.quinquenios || null,
  activo: row.ACTIVO || row.activo || null,
  fecha_mov_alt: toIsoString(row.FECHA_MOV_ALT || row.fecha_mov_alt),
  orgs1: row.ORGS1 || row.orgs1 || null,
  orgs2: row.ORGS2 || row.orgs2 || null,
  orgs3: row.ORGS3 || row.orgs3 || null,
  orgs: row.ORGS || row.orgs || null,
  dsueldo: row.DSUELDO || row.dsueldo || null,
  dotras_prestaciones: row.DOTRAS_PRESTACIONES || row.dotras_prestaciones || null,
  dquinquenios: row.DQUINQUENIOS || row.dquinquenios || null,
  aplicar: row.APLICAR || row.aplicar || null,
  bc: row.BC || row.bc || null,
  porcentaje: row.PORCENTAJE || row.porcentaje || null
});

function detectSearchType(searchTerm: string): 'CURP' | 'RFC' | 'NAME' {
  const trimmed = searchTerm.trim();

  if (trimmed.length === 18 && /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(trimmed)) {
    return 'CURP';
  }

  if ((trimmed.length === 13 || trimmed.length === 12) && /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(trimmed)) {
    return 'RFC';
  }

  return 'NAME';
}

export async function getOrgPersonalByClavesOrganicas(
  claveOrganica0: string,
  claveOrganica1: string
): Promise<OrgPersonal[]> {
  try {
    const sql = `
      SELECT
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
      FROM ORG_PERSONAL
      WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND ACTIVO = 'A'
      ORDER BY INTERNO
    `;

    const result = await executeSafeQuery(sql, [claveOrganica0, claveOrganica1]);

    const records = result.map((row: any) => {
      try {
        if (!row || typeof row !== 'object') {
          console.warn('Invalid row data received, skipping:', row);
          return null;
        }

        return mapOrgPersonalRow(row);
      } catch (mapError) {
        console.error('Error mapping row:', mapError, 'Row data:', row);
        return null;
      }
    }).filter((record): record is OrgPersonal => record !== null);

    console.log(`Successfully retrieved ${records.length} records for org0=${claveOrganica0}, org1=${claveOrganica1}`);
    return records;
  } catch (error: any) {
    console.error('Error in getOrgPersonalByClavesOrganicas:', error);
    throw new Error(`Database query failed: ${error.message || 'Unknown error'}`);
  }
}

export class OrgPersonalRepository implements IOrgPersonalRepository {
  async findAll(): Promise<OrgPersonal[]> {
    try {
      const sql = `
        SELECT
          INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
          SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
          ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,
          APLICAR, BC, PORCENTAJE
        FROM ORG_PERSONAL
        ORDER BY INTERNO
      `;

      const result = await executeSafeQuery(sql, []);
      return result.map(mapOrgPersonalRow);
    } catch (error) {
      console.error('Error in findAll OrgPersonal:', error);
      return [];
    }
  }

  async findById(interno: number): Promise<OrgPersonal | undefined> {
    try {
      const sql = 'SELECT * FROM ORG_PERSONAL WHERE INTERNO = ?';
      const result = await executeSafeQuery(sql, [interno]);
      return result[0] ? mapOrgPersonalRow(result[0]) : undefined;
    } catch (error) {
      console.error('Error in findById OrgPersonal:', error);
      return undefined;
    }
  }

  async findBySearch(searchTerm: string): Promise<OrgPersonal | undefined> {
    const trimmedTerm = searchTerm.trim();
    const searchType = detectSearchType(trimmedTerm);

    let sql: string;
    let params: any[];

    if (searchType === 'CURP' && trimmedTerm.length === 18) {
      sql = `
        SELECT FIRST 1
          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
          OP.APLICAR, OP.BC, OP.PORCENTAJE
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE TRIM(UPPER(P.CURP)) = TRIM(UPPER(?))
        ORDER BY OP.FECHA_MOV_ALT DESC
      `;
      params = [trimmedTerm];
    } else if (searchType === 'RFC' && (trimmedTerm.length === 12 || trimmedTerm.length === 13)) {
      sql = `
        SELECT FIRST 1
          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
          OP.APLICAR, OP.BC, OP.PORCENTAJE
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE TRIM(UPPER(P.RFC)) = TRIM(UPPER(?))
        ORDER BY OP.FECHA_MOV_ALT DESC
      `;
      params = [trimmedTerm.substring(0, 13)];
    } else {
      sql = `
        SELECT FIRST 1
          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
          OP.APLICAR, OP.BC, OP.PORCENTAJE
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE UPPER(P.FULLNAME) LIKE UPPER(?)
        ORDER BY OP.FECHA_MOV_ALT DESC
      `;
      params = [`%${trimmedTerm}%`];
    }

    const result = await executeSafeQuery(sql, params);
    return result[0] ? mapOrgPersonalRow(result[0]) : undefined;
  }

  async findByNombreApellidosFechaNac(
    nombre: string,
    apellidoPaterno: string,
    apellidoMaterno: string | null,
    fechaNacimiento: string
  ): Promise<OrgPersonal | undefined> {
    const nombreTrimmed = nombre.trim();
    const apellidoPaternoTrimmed = apellidoPaterno.trim();
    const apellidoMaternoTrimmed = apellidoMaterno ? apellidoMaterno.trim() : null;

    let fechaNac: Date;
    try {
      fechaNac = new Date(fechaNacimiento);
      if (isNaN(fechaNac.getTime())) {
        console.error('Fecha de nacimiento inválida:', fechaNacimiento);
        return undefined;
      }
    } catch (error) {
      console.error('Error al parsear fecha de nacimiento:', error);
      return undefined;
    }

    const fechaFormateada = fechaNac.toISOString().split('T')[0];

    let sql: string;
    let params: any[];

    if (apellidoMaternoTrimmed) {
      sql = `
        SELECT FIRST 1
          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
          OP.APLICAR, OP.BC, OP.PORCENTAJE
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE TRIM(UPPER(P.NOMBRE)) = TRIM(UPPER(?))
          AND TRIM(UPPER(P.APELLIDO_PATERNO)) = TRIM(UPPER(?))
          AND TRIM(UPPER(P.APELLIDO_MATERNO)) = TRIM(UPPER(?))
          AND P.FECHA_NACIMIENTO >= CAST(? AS DATE)
          AND P.FECHA_NACIMIENTO < DATEADD(1 DAY TO CAST(? AS DATE))
        ORDER BY OP.FECHA_MOV_ALT DESC
      `;
      params = [nombreTrimmed, apellidoPaternoTrimmed, apellidoMaternoTrimmed, fechaFormateada, fechaFormateada];
    } else {
      sql = `
        SELECT FIRST 1
          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
          OP.APLICAR, OP.BC, OP.PORCENTAJE
        FROM ORG_PERSONAL OP
        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
        WHERE TRIM(UPPER(P.NOMBRE)) = TRIM(UPPER(?))
          AND TRIM(UPPER(P.APELLIDO_PATERNO)) = TRIM(UPPER(?))
          AND (P.APELLIDO_MATERNO IS NULL OR TRIM(P.APELLIDO_MATERNO) = '')
          AND P.FECHA_NACIMIENTO >= CAST(? AS DATE)
          AND P.FECHA_NACIMIENTO < DATEADD(1 DAY TO CAST(? AS DATE))
        ORDER BY OP.FECHA_MOV_ALT DESC
      `;
      params = [nombreTrimmed, apellidoPaternoTrimmed, fechaFormateada, fechaFormateada];
    }

    const result = await executeSafeQuery(sql, params);
    return result[0] ? mapOrgPersonalRow(result[0]) : undefined;
  }

  async create(data: CreateOrgPersonalData): Promise<OrgPersonal> {
    const sql = `
      INSERT INTO ORG_PERSONAL (
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;

    const params = [
      data.interno || null,
      data.clave_organica_0 || null,
      data.clave_organica_1 || null,
      data.clave_organica_2 || null,
      data.clave_organica_3 || null,
      data.sueldo || null,
      data.otras_prestaciones || null,
      data.quinquenios || null,
      data.activo || 'A',
      data.fecha_mov_alt || null,
      null,
      null,
      null,
      null,
      data.dsueldo || null,
      data.dotras_prestaciones || null,
      data.dquinquenios || null,
      data.aplicar || null,
      data.bc || null,
      data.porcentaje || null
    ];

    return executeSerializedQuery((db) => {
      return new Promise<OrgPersonal>((resolve, reject) => {
        db.query(sql, params, (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(mapOrgPersonalRow(result[0]));
        });
      });
    });
  }

  async update(interno: number, data: UpdateOrgPersonalData): Promise<OrgPersonal> {
    const fields = [
      'CLAVE_ORGANICA_0', 'CLAVE_ORGANICA_1', 'CLAVE_ORGANICA_2', 'CLAVE_ORGANICA_3',
      'SUELDO', 'OTRAS_PRESTACIONES', 'QUINQUENIOS', 'ACTIVO', 'FECHA_MOV_ALT',
      'DSUELDO', 'DOTRAS_PRESTACIONES', 'DQUINQUENIOS',
      'APLICAR', 'BC', 'PORCENTAJE'
    ] as const;

    const params: any[] = [];
    const updates: string[] = [];

    for (const field of fields) {
      const key = field.toLowerCase() as keyof UpdateOrgPersonalData;
      if (data[key] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[key]);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = `UPDATE ORG_PERSONAL SET ${updates.join(', ')} WHERE INTERNO = ? RETURNING *`;
    params.push(interno);

    return executeSerializedQuery((db) => {
      return new Promise<OrgPersonal>((resolve, reject) => {
        db.query(sql, params, (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(mapOrgPersonalRow(result[0]));
        });
      });
    });
  }

  async delete(interno: number): Promise<void> {
    const sql = 'DELETE FROM ORG_PERSONAL WHERE INTERNO = ?';

    return executeSerializedQuery((db) => {
      return new Promise<void>((resolve, reject) => {
        db.query(sql, [interno], (err: any, result: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (result === 0) {
            reject(new Error('ORG_PERSONAL_NOT_FOUND'));
            return;
          }

          resolve();
        });
      });
    });
  }
}
