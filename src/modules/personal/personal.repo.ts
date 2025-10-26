import { getFirebirdDb } from '../../db/firebird.js';

export type Personal = {
  interno: number;
  curp: string | null;
  rfc: string | null;
  noempleado: string | null;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  seguro_social: string | null;
  calle_numero: string | null;
  fraccionamiento: string | null;
  codigo_postal: string | null;
  telefono: string | null;
  sexo: string | null;
  estado_civil: string | null;
  localidad: string | null;
  municipio: number | null;
  estado: number | null;
  pais: number | null;
  dependientes: number | null;
  posee_inmuebles: string | null;
  fecha_carta: string | null;
  email: string | null;
  nacionalidad: string | null;
  fecha_alta: string | null;
  celular: string | null;
  expediente: string | null;
  f_expediente: string | null;
  fullname: string | null;
};

export async function getAllPersonal(claveOrganica0?: string, claveOrganica1?: string): Promise<Personal[]> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT
        P.INTERNO, P.CURP, P.RFC, P.NOEMPLEADO, P.NOMBRE,
        P.APELLIDO_PATERNO, P.APELLIDO_MATERNO, P.FECHA_NACIMIENTO,
        P.SEGURO_SOCIAL, P.CALLE_NUMERO, P.FRACCIONAMIENTO, P.CODIGO_POSTAL,
        P.TELEFONO, P.SEXO, P.ESTADO_CIVIL, P.LOCALIDAD, P.MUNICIPIO, P.ESTADO, P.PAIS,
        P.DEPENDIENTES, P.POSEE_INMUEBLES, P.FECHA_CARTA, P.EMAIL, P.NACIONALIDAD,
        P.FECHA_ALTA, P.CELULAR, P.EXPEDIENTE, P.F_EXPEDIENTE, P.FULLNAME
      FROM PERSONAL P
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (claveOrganica0) {
      sql += `
        INNER JOIN ORG_PERSONAL OP ON P.INTERNO = OP.INTERNO
      `;
      conditions.push('OP.CLAVE_ORGANICA_0 = ?');
      params.push(claveOrganica0);
    }

    if (claveOrganica1) {
      if (!claveOrganica0) {
        sql += `
          INNER JOIN ORG_PERSONAL OP ON P.INTERNO = OP.INTERNO
        `;
      }
      conditions.push('OP.CLAVE_ORGANICA_1 = ?');
      params.push(claveOrganica1);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY P.INTERNO`;

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const records = result.map((row: any) => ({
        interno: row.INTERNO,
        curp: row.CURP || null,
        rfc: row.RFC || null,
        noempleado: row.NOEMPLEADO || null,
        nombre: row.NOMBRE || null,
        apellido_paterno: row.APELLIDO_PATERNO || null,
        apellido_materno: row.APELLIDO_MATERNO || null,
        fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
        seguro_social: row.SEGURO_SOCIAL || null,
        calle_numero: row.CALLE_NUMERO || null,
        fraccionamiento: row.FRACCIONAMIENTO || null,
        codigo_postal: row.CODIGO_POSTAL || null,
        telefono: row.TELEFONO || null,
        sexo: row.SEXO || null,
        estado_civil: row.ESTADO_CIVIL || null,
        localidad: row.LOCALIDAD || null,
        municipio: row.MUNICIPIO || null,
        estado: row.ESTADO || null,
        pais: row.PAIS || null,
        dependientes: row.DEPENDIENTES || null,
        posee_inmuebles: row.POSEE_INMUEBLES || null,
        fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        email: row.EMAIL || null,
        nacionalidad: row.NACIONALIDAD || null,
        fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        celular: row.CELULAR || null,
        expediente: row.EXPEDIENTE || null,
        f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
        fullname: row.FULLNAME || null
      }));

      resolve(records);
    });
  });
}

export async function getPersonalById(interno: number): Promise<Personal | undefined> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,
        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,
        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,
        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,
        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,
        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME
      FROM PERSONAL
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
        curp: row.CURP || null,
        rfc: row.RFC || null,
        noempleado: row.NOEMPLEADO || null,
        nombre: row.NOMBRE || null,
        apellido_paterno: row.APELLIDO_PATERNO || null,
        apellido_materno: row.APELLIDO_MATERNO || null,
        fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
        seguro_social: row.SEGURO_SOCIAL || null,
        calle_numero: row.CALLE_NUMERO || null,
        fraccionamiento: row.FRACCIONAMIENTO || null,
        codigo_postal: row.CODIGO_POSTAL || null,
        telefono: row.TELEFONO || null,
        sexo: row.SEXO || null,
        estado_civil: row.ESTADO_CIVIL || null,
        localidad: row.LOCALIDAD || null,
        municipio: row.MUNICIPIO || null,
        estado: row.ESTADO || null,
        pais: row.PAIS || null,
        dependientes: row.DEPENDIENTES || null,
        posee_inmuebles: row.POSEE_INMUEBLES || null,
        fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        email: row.EMAIL || null,
        nacionalidad: row.NACIONALIDAD || null,
        fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        celular: row.CELULAR || null,
        expediente: row.EXPEDIENTE || null,
        f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
        fullname: row.FULLNAME || null
      };

      resolve(record);
    });
  });
}

export async function createPersonal(data: Omit<Personal, 'fullname'>): Promise<Personal> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO PERSONAL (
        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,
        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,
        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,
        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,
        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,
        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING
        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,
        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,
        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,
        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,
        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,
        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME
    `;

    const params = [
      data.interno,
      data.curp,
      data.rfc,
      data.noempleado,
      data.nombre,
      data.apellido_paterno,
      data.apellido_materno,
      data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
      data.seguro_social,
      data.calle_numero,
      data.fraccionamiento,
      data.codigo_postal,
      data.telefono,
      data.sexo,
      data.estado_civil,
      data.localidad,
      data.municipio,
      data.estado,
      data.pais,
      data.dependientes,
      data.posee_inmuebles,
      data.fecha_carta ? new Date(data.fecha_carta) : null,
      data.email,
      data.nacionalidad,
      data.fecha_alta ? new Date(data.fecha_alta) : null,
      data.celular,
      data.expediente,
      data.f_expediente ? new Date(data.f_expediente) : null
    ];

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      const row = result[0];
      const record = {
        interno: row.INTERNO,
        curp: row.CURP || null,
        rfc: row.RFC || null,
        noempleado: row.NOEMPLEADO || null,
        nombre: row.NOMBRE || null,
        apellido_paterno: row.APELLIDO_PATERNO || null,
        apellido_materno: row.APELLIDO_MATERNO || null,
        fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
        seguro_social: row.SEGURO_SOCIAL || null,
        calle_numero: row.CALLE_NUMERO || null,
        fraccionamiento: row.FRACCIONAMIENTO || null,
        codigo_postal: row.CODIGO_POSTAL || null,
        telefono: row.TELEFONO || null,
        sexo: row.SEXO || null,
        estado_civil: row.ESTADO_CIVIL || null,
        localidad: row.LOCALIDAD || null,
        municipio: row.MUNICIPIO || null,
        estado: row.ESTADO || null,
        pais: row.PAIS || null,
        dependientes: row.DEPENDIENTES || null,
        posee_inmuebles: row.POSEE_INMUEBLES || null,
        fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        email: row.EMAIL || null,
        nacionalidad: row.NACIONALIDAD || null,
        fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        celular: row.CELULAR || null,
        expediente: row.EXPEDIENTE || null,
        f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
        fullname: row.FULLNAME || null
      };

      resolve(record);
    });
  });
}

export async function updatePersonal(interno: number, data: Partial<Omit<Personal, 'interno' | 'fullname'>>): Promise<Personal> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.curp !== undefined) {
      updates.push('CURP = ?');
      params.push(data.curp);
    }
    if (data.rfc !== undefined) {
      updates.push('RFC = ?');
      params.push(data.rfc);
    }
    if (data.noempleado !== undefined) {
      updates.push('NOEMPLEADO = ?');
      params.push(data.noempleado);
    }
    if (data.nombre !== undefined) {
      updates.push('NOMBRE = ?');
      params.push(data.nombre);
    }
    if (data.apellido_paterno !== undefined) {
      updates.push('APELLIDO_PATERNO = ?');
      params.push(data.apellido_paterno);
    }
    if (data.apellido_materno !== undefined) {
      updates.push('APELLIDO_MATERNO = ?');
      params.push(data.apellido_materno);
    }
    if (data.fecha_nacimiento !== undefined) {
      updates.push('FECHA_NACIMIENTO = ?');
      params.push(data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null);
    }
    if (data.seguro_social !== undefined) {
      updates.push('SEGURO_SOCIAL = ?');
      params.push(data.seguro_social);
    }
    if (data.calle_numero !== undefined) {
      updates.push('CALLE_NUMERO = ?');
      params.push(data.calle_numero);
    }
    if (data.fraccionamiento !== undefined) {
      updates.push('FRACCIONAMIENTO = ?');
      params.push(data.fraccionamiento);
    }
    if (data.codigo_postal !== undefined) {
      updates.push('CODIGO_POSTAL = ?');
      params.push(data.codigo_postal);
    }
    if (data.telefono !== undefined) {
      updates.push('TELEFONO = ?');
      params.push(data.telefono);
    }
    if (data.sexo !== undefined) {
      updates.push('SEXO = ?');
      params.push(data.sexo);
    }
    if (data.estado_civil !== undefined) {
      updates.push('ESTADO_CIVIL = ?');
      params.push(data.estado_civil);
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
    if (data.pais !== undefined) {
      updates.push('PAIS = ?');
      params.push(data.pais);
    }
    if (data.dependientes !== undefined) {
      updates.push('DEPENDIENTES = ?');
      params.push(data.dependientes);
    }
    if (data.posee_inmuebles !== undefined) {
      updates.push('POSEE_INMUEBLES = ?');
      params.push(data.posee_inmuebles);
    }
    if (data.fecha_carta !== undefined) {
      updates.push('FECHA_CARTA = ?');
      params.push(data.fecha_carta ? new Date(data.fecha_carta) : null);
    }
    if (data.email !== undefined) {
      updates.push('EMAIL = ?');
      params.push(data.email);
    }
    if (data.nacionalidad !== undefined) {
      updates.push('NACIONALIDAD = ?');
      params.push(data.nacionalidad);
    }
    if (data.fecha_alta !== undefined) {
      updates.push('FECHA_ALTA = ?');
      params.push(data.fecha_alta ? new Date(data.fecha_alta) : null);
    }
    if (data.celular !== undefined) {
      updates.push('CELULAR = ?');
      params.push(data.celular);
    }
    if (data.expediente !== undefined) {
      updates.push('EXPEDIENTE = ?');
      params.push(data.expediente);
    }
    if (data.f_expediente !== undefined) {
      updates.push('F_EXPEDIENTE = ?');
      params.push(data.f_expediente ? new Date(data.f_expediente) : null);
    }

    params.push(interno);

    const sql = `
      UPDATE PERSONAL
      SET ${updates.join(', ')}
      WHERE INTERNO = ?
      RETURNING
        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,
        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,
        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,
        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,
        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,
        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME
    `;

    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (result.length === 0) {
        reject(new Error('PERSONAL_NOT_FOUND'));
        return;
      }

      const row = result[0];
      const record = {
        interno: row.INTERNO,
        curp: row.CURP || null,
        rfc: row.RFC || null,
        noempleado: row.NOEMPLEADO || null,
        nombre: row.NOMBRE || null,
        apellido_paterno: row.APELLIDO_PATERNO || null,
        apellido_materno: row.APELLIDO_MATERNO || null,
        fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
        seguro_social: row.SEGURO_SOCIAL || null,
        calle_numero: row.CALLE_NUMERO || null,
        fraccionamiento: row.FRACCIONAMIENTO || null,
        codigo_postal: row.CODIGO_POSTAL || null,
        telefono: row.TELEFONO || null,
        sexo: row.SEXO || null,
        estado_civil: row.ESTADO_CIVIL || null,
        localidad: row.LOCALIDAD || null,
        municipio: row.MUNICIPIO || null,
        estado: row.ESTADO || null,
        pais: row.PAIS || null,
        dependientes: row.DEPENDIENTES || null,
        posee_inmuebles: row.POSEE_INMUEBLES || null,
        fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
        email: row.EMAIL || null,
        nacionalidad: row.NACIONALIDAD || null,
        fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
        celular: row.CELULAR || null,
        expediente: row.EXPEDIENTE || null,
        f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
        fullname: row.FULLNAME || null
      };

      resolve(record);
    });
  });
}

export async function deletePersonal(interno: number): Promise<void> {
  const db = getFirebirdDb();
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM PERSONAL WHERE INTERNO = ?';

    db.query(sql, [interno], (err: any, result: any) => {
      if (err) {
        reject(err);
        return;
      }

      if (result === 0) {
        reject(new Error('PERSONAL_NOT_FOUND'));
        return;
      }

      resolve();
    });
  });
}