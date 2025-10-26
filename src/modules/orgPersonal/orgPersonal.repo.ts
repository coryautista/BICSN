import { getFirebirdDb } from '../../db/firebird.js';

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
  daquinquenios: number | null;
  aplicar: string | null;
  bc: string | null;
  porcentaje: number | null;
};

export async function getAllOrgPersonal(): Promise<OrgPersonal[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DAQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
      FROM ORG_PERSONAL
      ORDER BY INTERNO
    `;

    db.query(sql, [], (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const records = result.map((row: any) => ({
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
        daquinquenios: row.DAQUINQUENIOS || null,
        aplicar: row.APLICAR || null,
        bc: row.BC || null,
        porcentaje: row.PORCENTAJE || null
      }));

      resolve(records);
    });
  });
}

export async function getOrgPersonalById(interno: number): Promise<OrgPersonal | undefined> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DAQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
      FROM ORG_PERSONAL
      WHERE INTERNO = ?
    `;

    db.query(sql, [interno], (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (result.length === 0) {
        resolve(undefined);
        return;
      }

      const row = result[0];
      const record = {
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
        daquinquenios: row.DAQUINQUENIOS || null,
        aplicar: row.APLICAR || null,
        bc: row.BC || null,
        porcentaje: row.PORCENTAJE || null
      };

      resolve(record);
    });
  });
}

export async function createOrgPersonal(data: Omit<OrgPersonal, 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>): Promise<OrgPersonal> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO ORG_PERSONAL (
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        DSUELDO, DOTRAS_PRESTACIONES, DAQUINQUENIOS, APLICAR, BC, PORCENTAJE
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DAQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
    `;

    const params = [
      data.interno,
      data.clave_organica_0,
      data.clave_organica_1,
      data.clave_organica_2,
      data.clave_organica_3,
      data.sueldo,
      data.otras_prestaciones,
      data.quinquenios,
      data.activo,
      data.fecha_mov_alt ? new Date(data.fecha_mov_alt) : null,
      data.dsueldo,
      data.dotras_prestaciones,
      data.daquinquenios,
      data.aplicar,
      data.bc,
      data.porcentaje
    ];

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const row = result[0];
      const record = {
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
        daquinquenios: row.DAQUINQUENIOS || null,
        aplicar: row.APLICAR || null,
        bc: row.BC || null,
        porcentaje: row.PORCENTAJE || null
      };

      resolve(record);
    });
  });
}

export async function updateOrgPersonal(interno: number, data: Partial<Omit<OrgPersonal, 'interno' | 'orgs1' | 'orgs2' | 'orgs3' | 'orgs'>>): Promise<OrgPersonal> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.clave_organica_0 !== undefined) {
      updates.push('CLAVE_ORGANICA_0 = ?');
      params.push(data.clave_organica_0);
    }
    if (data.clave_organica_1 !== undefined) {
      updates.push('CLAVE_ORGANICA_1 = ?');
      params.push(data.clave_organica_1);
    }
    if (data.clave_organica_2 !== undefined) {
      updates.push('CLAVE_ORGANICA_2 = ?');
      params.push(data.clave_organica_2);
    }
    if (data.clave_organica_3 !== undefined) {
      updates.push('CLAVE_ORGANICA_3 = ?');
      params.push(data.clave_organica_3);
    }
    if (data.sueldo !== undefined) {
      updates.push('SUELDO = ?');
      params.push(data.sueldo);
    }
    if (data.otras_prestaciones !== undefined) {
      updates.push('OTRAS_PRESTACIONES = ?');
      params.push(data.otras_prestaciones);
    }
    if (data.quinquenios !== undefined) {
      updates.push('QUINQUENIOS = ?');
      params.push(data.quinquenios);
    }
    if (data.activo !== undefined) {
      updates.push('ACTIVO = ?');
      params.push(data.activo);
    }
    if (data.fecha_mov_alt !== undefined) {
      updates.push('FECHA_MOV_ALT = ?');
      params.push(data.fecha_mov_alt ? new Date(data.fecha_mov_alt) : null);
    }
    if (data.dsueldo !== undefined) {
      updates.push('DSUELDO = ?');
      params.push(data.dsueldo);
    }
    if (data.dotras_prestaciones !== undefined) {
      updates.push('DOTRAS_PRESTACIONES = ?');
      params.push(data.dotras_prestaciones);
    }
    if (data.daquinquenios !== undefined) {
      updates.push('DAQUINQUENIOS = ?');
      params.push(data.daquinquenios);
    }
    if (data.aplicar !== undefined) {
      updates.push('APLICAR = ?');
      params.push(data.aplicar);
    }
    if (data.bc !== undefined) {
      updates.push('BC = ?');
      params.push(data.bc);
    }
    if (data.porcentaje !== undefined) {
      updates.push('PORCENTAJE = ?');
      params.push(data.porcentaje);
    }

    params.push(interno);

    const sql = `
      UPDATE ORG_PERSONAL
      SET ${updates.join(', ')}
      WHERE INTERNO = ?
      RETURNING
        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,
        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,
        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DAQUINQUENIOS,
        APLICAR, BC, PORCENTAJE
    `;

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (result.length === 0) {
        reject(new Error('ORG_PERSONAL_NOT_FOUND'));
        return;
      }

      const row = result[0];
      const record = {
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
        daquinquenios: row.DAQUINQUENIOS || null,
        aplicar: row.APLICAR || null,
        bc: row.BC || null,
        porcentaje: row.PORCENTAJE || null
      };

      resolve(record);
    });
  });
}

export async function deleteOrgPersonal(interno: number): Promise<void> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM ORG_PERSONAL WHERE INTERNO = ?';

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
}