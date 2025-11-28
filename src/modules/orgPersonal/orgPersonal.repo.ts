import { executeSerializedQuery } from '../../db/firebird.js';
import { executeSafeQuery } from '../../db/firebird.js';

export type OrgPersonal = {
  interno: number;
  clave_organica_0: string | null;
  clave_organica_1: string | null;
  clave_organica_2: string | null;
  clave_organica_3: string | null;
  sueldo: number | null;
  otras_prestaciones: number | null;
  quinquenios: number | null;
  activo: string | null;
  fecha_mov_alt: string | null;
  orgs1: string | null;
  orgs2: string | null;
  orgs3: string | null;
  orgs: string | null;
  dsueldo: number | null;
  dotras_prestaciones: number | null;
  dquinquenios: number | null;
  aplicar: string | null;
  bc: string | null;
  porcentaje: number | null;
};

export async function getAllOrgPersonal(): Promise<OrgPersonal[]> {
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
    
    return result.map((row: any) => ({
      interno: row.INTERNO || null,
      clave_organica_0: row.CLAVE_ORGANICA_0 || null,
      clave_organica_1: row.CLAVE_ORGANICA_1 || null,
      clave_organica_2: row.CLAVE_ORGANICA_2 || null,
      clave_organica_3: row.CLAVE_ORGANICA_3 || null,
      sueldo: row.SUELDO || null,
      otras_prestaciones: row.OTRAS_PRESTACIONES || null,
      quinquenios: row.QUINQUENIOS || null,
      activo: row.ACTIVO || null,
      fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
      orgs1: row.ORGS1 || null,
      orgs2: row.ORGS2 || null,
      orgs3: row.ORGS3 || null,
      orgs: row.ORGS || null,
      dsueldo: row.DSUELDO || null,
      dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
      dquinquenios: row.DQUINQUENIOS || null,
      aplicar: row.APLICAR || null,
      bc: row.BC || null,
      porcentaje: row.PORCENTAJE || null
    }));
  } catch (error) {
    console.error('Error in getAllOrgPersonal:', error);
    return [];
  }
}

export async function createOrgPersonal(data: Partial<OrgPersonal>): Promise<OrgPersonal> {
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
    data.orgs1 || null,
    data.orgs2 || null,
    data.orgs3 || null,
    data.orgs || null,
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
        resolve(result[0]);
      });
    });
  });
}

export async function updateOrgPersonal(interno: number, data: Partial<OrgPersonal>): Promise<OrgPersonal> {
  const fields = [
    'CLAVE_ORGANICA_0', 'CLAVE_ORGANICA_1', 'CLAVE_ORGANICA_2', 'CLAVE_ORGANICA_3',
    'SUELDO', 'OTRAS_PRESTACIONES', 'QUINQUENIOS', 'ACTIVO', 'FECHA_MOV_ALT',
    'ORGS1', 'ORGS2', 'ORGS3', 'ORGS', 'DSUELDO', 'DOTRAS_PRESTACIONES', 'DQUINQUENIOS',
    'APLICAR', 'BC', 'PORCENTAJE'
  ];

  const params: any[] = [];
  const updates: string[] = [];

  // Build dynamic update query
  for (const field of fields) {
    const key = field.toLowerCase() as keyof OrgPersonal;
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
        resolve(result[0]);
      });
    });
  });
}

export async function getOrgPersonalById(interno: number): Promise<OrgPersonal | null> {
  try {
    const sql = 'SELECT * FROM ORG_PERSONAL WHERE INTERNO = ?';
    const result = await executeSafeQuery(sql, [interno]);
    return result[0] || null;
  } catch (error) {
    console.error('Error in getOrgPersonalById:', error);
    return null;
  }
}

export async function getOrgPersonalByClavesOrganicas(
  claveOrganica0: string,
  claveOrganica1: string
): Promise<OrgPersonal[]> {
  try {
    // Use safe query execution with enhanced error handling
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

    // Safely map results, ensuring each row has expected structure
    const records: OrgPersonal[] = result.map((row: any) => {
      try {
        // Validate row structure and provide safe defaults
        if (!row || typeof row !== 'object') {
          console.warn('Invalid row data received, skipping:', row);
          return null;
        }

        return {
          interno: row.INTERNO || row.interno || null,
          clave_organica_0: row.CLAVE_ORGANICA_0 || row.clave_organica_0 || null,
          clave_organica_1: row.CLAVE_ORGANICA_1 || row.clave_organica_1 || null,
          clave_organica_2: row.CLAVE_ORGANICA_2 || row.clave_organica_2 || null,
          clave_organica_3: row.CLAVE_ORGANICA_3 || row.clave_organica_3 || null,
          sueldo: row.SUELDO || row.sueldo || null,
          otras_prestaciones: row.OTRAS_PRESTACIONES || row.otras_prestaciones || null,
          quinquenios: row.QUINQUENIOS || row.quinquenios || null,
          activo: row.ACTIVO || row.activo || null,
          fecha_mov_alt: (row.FECHA_MOV_ALT || row.fecha_mov_alt) ? 
            (row.FECHA_MOV_ALT || row.fecha_mov_alt).toISOString() : null,
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
        };
      } catch (mapError) {
        console.error('Error mapping row:', mapError, 'Row data:', row);
        return null;
      }
    }).filter((record): record is OrgPersonal => record !== null); // Remove null records

    console.log(`Successfully retrieved ${records.length} records for org0=${claveOrganica0}, org1=${claveOrganica1}`);
    return records;
  } catch (error: any) {
    console.error('Error in getOrgPersonalByClavesOrganicas:', error);
    throw new Error(`Database query failed: ${error.message || 'Unknown error'}`);
  }
}

export async function getOrgPersonalBySearch(searchTerm: string): Promise<OrgPersonal | null> {
  const trimmedTerm = searchTerm.trim();
  
  // Detect search type based on format
  const searchType = detectSearchType(trimmedTerm);
  
  let sql: string;
  let params: any[];
  
  if (searchType === 'CURP' && trimmedTerm.length === 18) {
    // Search only by CURP
    sql = `
      SELECT FIRST 1
        OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
        OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
        OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
        OP.APLICAR, OP.BC, OP.PORCENTAJE
      FROM ORG_PERSONAL OP
      INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
      WHERE UPPER(P.CURP) = UPPER(?)
      ORDER BY OP.FECHA_MOV_ALT DESC
    `;
    params = [trimmedTerm];
  } else if (searchType === 'RFC' && (trimmedTerm.length === 12 || trimmedTerm.length === 13)) {
    // Search only by RFC
    sql = `
      SELECT FIRST 1
        OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,
        OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,
        OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,
        OP.APLICAR, OP.BC, OP.PORCENTAJE
      FROM ORG_PERSONAL OP
      INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO
      WHERE UPPER(P.RFC) = UPPER(?)
      ORDER BY OP.FECHA_MOV_ALT DESC
    `;
    params = [trimmedTerm.substring(0, 13)];
  } else {
    // Search by name (FULLNAME)
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

  return executeSerializedQuery((db) => {
    return new Promise<OrgPersonal | null>((resolve, reject) => {
      db.query(sql, params, (err: any, result: any) => {
        if (err) {
          console.error('Error in getOrgPersonalBySearch:', err);
          reject(err);
          return;
        }
        
        if (!result || result.length === 0) {
          resolve(null);
          return;
        }
        
        const row = result[0];
        const record: OrgPersonal = {
          interno: row.INTERNO,
          clave_organica_0: row.CLAVE_ORGANICA_0 || null,
          clave_organica_1: row.CLAVE_ORGANICA_1 || null,
          clave_organica_2: row.CLAVE_ORGANICA_2 || null,
          clave_organica_3: row.CLAVE_ORGANICA_3 || null,
          sueldo: row.SUELDO || null,
          otras_prestaciones: row.OTRAS_PRESTACIONES || null,
          quinquenios: row.QUINQUENIOS || null,
          activo: row.ACTIVO || null,
          fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
          orgs1: row.ORGS1 || null,
          orgs2: row.ORGS2 || null,
          orgs3: row.ORGS3 || null,
          orgs: row.ORGS || null,
          dsueldo: row.DSUELDO || null,
          dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
          dquinquenios: row.DQUINQUENIOS || null,
          aplicar: row.APLICAR || null,
          bc: row.BC || null,
          porcentaje: row.PORCENTAJE || null
        };
        resolve(record);
      });
    });
  });
}

/**
 * Detects the search type based on the format of the search term
 */
function detectSearchType(searchTerm: string): 'CURP' | 'RFC' | 'NAME' {
  const trimmed = searchTerm.trim();
  
  // CURP: 18 characters, format standard Mexican CURP
  if (trimmed.length === 18 && /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(trimmed)) {
    return 'CURP';
  }
  
  // RFC: 12 characters (moral person) or 13 characters (physical person)
  if ((trimmed.length === 13 || trimmed.length === 12) && /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(trimmed)) {
    return 'RFC';
  }
  
  // Default to name search
  return 'NAME';
}

export async function deleteOrgPersonal(interno: number): Promise<void> {
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

export async function searchOrgPersonal(filters: Record<string, any>): Promise<OrgPersonal[]> {
  try {
    let sql = 'SELECT * FROM ORG_PERSONAL WHERE 1=1';
    const params: any[] = [];

    // Add dynamic filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        sql += ` AND ${key} = ?`;
        params.push(value);
      }
    }

    const result = await executeSafeQuery(sql, params);
    return result;
  } catch (error) {
    console.error('Error in searchOrgPersonal:', error);
    return [];
  }
}