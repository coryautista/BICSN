import { getFirebirdDb } from '../../db/firebird.js';
import { Organica3, CreateOrganica3, UpdateOrganica3, DynamicQuery } from './organica3.schemas.js';

// [FIREBIRD] Repository for ORGANICA_3 table operations
export async function findOrganica3ById(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string): Promise<Organica3 | undefined> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?',
      [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3],
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
          claveOrganica3: row.CLAVE_ORGANICA_3,
          descripcion: row.DESCRIPCION,
          titular: row.TITULAR,
          calleNum: row.CALLE_NUM,
          fraccionamiento: row.FRACCIONAMIENTO,
          codigoPostal: row.CODIGO_POSTAL,
          telefono: row.TELEFONO,
          fax: row.FAX,
          localidad: row.LOCALIDAD,
          municipio: row.MUNICIPIO,
          estado: row.ESTADO,
          fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
          fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
          usuario: row.USUARIO,
          estatus: row.ESTATUS
        });
      }
    );
  });
}

export async function listOrganica3(): Promise<Organica3[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3',
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
          claveOrganica3: row.CLAVE_ORGANICA_3,
          descripcion: row.DESCRIPCION,
          titular: row.TITULAR,
          calleNum: row.CALLE_NUM,
          fraccionamiento: row.FRACCIONAMIENTO,
          codigoPostal: row.CODIGO_POSTAL,
          telefono: row.TELEFONO,
          fax: row.FAX,
          localidad: row.LOCALIDAD,
          municipio: row.MUNICIPIO,
          estado: row.ESTADO,
          fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
          fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
          usuario: row.USUARIO,
          estatus: row.ESTATUS
        }));
        resolve(records);
      }
    );
  });
}

export async function createOrganica3(data: CreateOrganica3): Promise<Organica3> {
  const db = getFirebirdDb();
  const fechaRegistro3 = new Date();

  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO ORGANICA_3 (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.claveOrganica0,
        data.claveOrganica1,
        data.claveOrganica2,
        data.claveOrganica3,
        data.descripcion || null,
        data.titular || null,
        data.calleNum || null,
        data.fraccionamiento || null,
        data.codigoPostal || null,
        data.telefono || null,
        data.fax || null,
        data.localidad || null,
        data.municipio || null,
        data.estado || null,
        fechaRegistro3,
        data.fechaFin3 || null,
        data.usuario || null,
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
          claveOrganica3: data.claveOrganica3,
          descripcion: data.descripcion,
          titular: data.titular,
          calleNum: data.calleNum,
          fraccionamiento: data.fraccionamiento,
          codigoPostal: data.codigoPostal,
          telefono: data.telefono,
          fax: data.fax,
          localidad: data.localidad,
          municipio: data.municipio,
          estado: data.estado,
          fechaRegistro3,
          fechaFin3: data.fechaFin3,
          usuario: data.usuario,
          estatus: data.estatus
        });
      }
    );
  });
}

export async function updateOrganica3(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string, data: UpdateOrganica3): Promise<Organica3 | undefined> {
  const db = getFirebirdDb();

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
  if (data.calleNum !== undefined) {
    updates.push('CALLE_NUM = ?');
    params.push(data.calleNum);
  }
  if (data.fraccionamiento !== undefined) {
    updates.push('FRACCIONAMIENTO = ?');
    params.push(data.fraccionamiento);
  }
  if (data.codigoPostal !== undefined) {
    updates.push('CODIGO_POSTAL = ?');
    params.push(data.codigoPostal);
  }
  if (data.telefono !== undefined) {
    updates.push('TELEFONO = ?');
    params.push(data.telefono);
  }
  if (data.fax !== undefined) {
    updates.push('FAX = ?');
    params.push(data.fax);
  }
  if (data.localidad !== undefined) {
    updates.push('LOCALIDAD = ?');
    params.push(data.localidad);
  }
  if (data.municipio !== undefined) {
    updates.push('MUNICIPIO = ?');
    params.push(data.municipio);
  }
  if (data.estado !== undefined) {
    updates.push('ESTADO = ?');
    params.push(data.estado);
  }
  if (data.fechaFin3 !== undefined) {
    updates.push('FECHA_FIN_3 = ?');
    params.push(data.fechaFin3);
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
    return findOrganica3ById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
  }

  params.push(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE ORGANICA_3 SET ${updates.join(', ')} WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?`,
      params,
      (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        // Return updated record
        findOrganica3ById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3).then(resolve).catch(reject);
      }
    );
  });
}

export async function deleteOrganica3(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string, claveOrganica3: string): Promise<boolean> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    db.query(
      'DELETE FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?',
      [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3],
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

export async function dynamicQueryOrganica3(query: DynamicQuery): Promise<Organica3[]> {
  const db = getFirebirdDb();

  let sql = 'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3';
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
    sql += ' ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3';
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

  return new Promise((resolve, reject) => {
    db.query(sql, params, (err: any, result: any) => {
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
        calleNum: row.CALLE_NUM,
        fraccionamiento: row.FRACCIONAMIENTO,
        codigoPostal: row.CODIGO_POSTAL,
        telefono: row.TELEFONO,
        fax: row.FAX,
        localidad: row.LOCALIDAD,
        municipio: row.MUNICIPIO,
        estado: row.ESTADO,
        fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
        fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
        usuario: row.USUARIO,
        estatus: row.ESTATUS
      }));
      resolve(records);
    });
  });
}