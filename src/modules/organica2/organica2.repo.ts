import { executeSerializedQuery, executeSafeQuery } from '../../db/firebird.js';
import { Organica2, CreateOrganica2, UpdateOrganica2, DynamicQuery } from './organica2.schemas.js';

// [FIREBIRD] Repository for ORGANICA_2 table operations
export async function findOrganica2ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<Organica2 | undefined> {
  const result = await executeSafeQuery(
    'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?',
    [claveOrganica0, claveOrganica1, claveOrganica2]
  );
  
  if (!result || result.length === 0) {
    return undefined;
  }
  
  const row = result[0];
  return {
    claveOrganica0: row.CLAVE_ORGANICA_0,
    claveOrganica1: row.CLAVE_ORGANICA_1,
    claveOrganica2: row.CLAVE_ORGANICA_2,
    descripcion: row.DESCRIPCION,
    titular: row.TITULAR,
    fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
    fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
    usuario: row.USUARIO,
    estatus: row.ESTATUS
  };
}

export async function listOrganica2(): Promise<Organica2[]> {
  const result = await executeSafeQuery(
    'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2',
    []
  );
  
  return result.map((row: any) => ({
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
}

export async function createOrganica2(data: CreateOrganica2): Promise<Organica2> {
  const fechaRegistro2 = new Date();

  return executeSerializedQuery((db) => {
    return new Promise<Organica2>((resolve, reject) => {
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
        (data as any).usuario || null,
        data.estatus
      ],
      (err: any, _result: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          claveOrganica0: data.claveOrganica0,
          claveOrganica1: data.claveOrganica1,
          claveOrganica2: data.claveOrganica2,
          descripcion: data.descripcion,
          titular: data.titular,
          fechaRegistro2,
          fechaFin2: data.fechaFin2,
          usuario: (data as any).usuario || null,
          estatus: data.estatus
        });
      }
    );
    });
  });
}

export async function updateOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, data: UpdateOrganica2): Promise<Organica2 | undefined> {

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
    return findOrganica2ById(claveOrganica0, claveOrganica1, claveOrganica2);
  }

  params.push(claveOrganica0, claveOrganica1, claveOrganica2);

  return executeSerializedQuery((db) => {
    return new Promise<Organica2 | undefined>((resolve, reject) => {
      db.query(
        `UPDATE ORGANICA_2 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?`,
      params,
      (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        // Return updated record
        findOrganica2ById(claveOrganica0, claveOrganica1, claveOrganica2).then(resolve).catch(reject);
      }
    );
    });
  });
}

export async function deleteOrganica2(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string): Promise<boolean> {
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

export async function dynamicQueryOrganica2(query: DynamicQuery): Promise<Organica2[]> {

  let sql = 'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2';
  const params: any[] = [];
  const conditions: string[] = [];

  // Build WHERE conditions from filters
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      if (value !== undefined && value !== null) {
        const columnName = key.toUpperCase();
        conditions.push(`${columnName} = ?`);
        params.push(value);
      }
    }
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  // Add sorting
  if (query.sortBy) {
    const sortColumn = query.sortBy.toUpperCase();
    const sortOrder = query.sortOrder || 'ASC';
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;
  } else {
    sql += ' ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2';
  }

  // Add pagination
  if (query.limit) {
    sql += ' ROWS ?';
    params.push(query.limit);
    if (query.offset) {
      sql += ' TO ?';
      params.push(query.offset + query.limit);
    }
  } else if (query.offset) {
    sql += ' ROWS ? TO ?';
    params.push(query.offset + 1);
    params.push(query.offset + 1000); // Default limit if offset specified
  }

  const result = await executeSafeQuery(sql, params);
  
  return result.map((row: any) => ({
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
}

export async function findOrganica2ByUser(claveOrganica0?: string, claveOrganica1?: string): Promise<Organica2[]> {
  
  let sql = 'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2';
  const params: any[] = [];
  const conditions: string[] = [];

  if (claveOrganica0) {
    conditions.push('CLAVE_ORGANICA_0 = ?');
    params.push(claveOrganica0);
  }

  if (claveOrganica1) {
    conditions.push('CLAVE_ORGANICA_1 = ?');
    params.push(claveOrganica1);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2';

  const result = await executeSafeQuery(sql, params);
  
  return result.map((row: any) => ({
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
}