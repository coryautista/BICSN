import { getPool, sql } from '../../../db/mssql.js';
import { sql as sqlType } from '../../../db/context.js';

export async function findDependenciaById(dependenciaId: number) {
  if (!dependenciaId || typeof dependenciaId !== 'number' || dependenciaId <= 0) {
    throw new Error('Invalid dependenciaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('dependenciaId', sql.Int, dependenciaId)
    .query(`
      SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.tipoDependencia,
        d.idDependenciaPadre,
        d.claveDependencia,
        d.responsable,
        d.telefono,
        d.email,
        d.esActiva,
        dp.nombre as dependenciaPadreNombre
      FROM tablero.Dependencia d
      LEFT JOIN tablero.Dependencia dp ON d.idDependenciaPadre = dp.id
      WHERE d.id = @dependenciaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    claveDependencia: row.claveDependencia,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva,
    dependenciaPadre: row.dependenciaPadreNombre ? {
      id: row.idDependenciaPadre,
      nombre: row.dependenciaPadreNombre
    } : null
  };
}

export async function listDependencias() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      d.id,
      d.nombre,
      d.descripcion,
      d.tipoDependencia,
      d.idDependenciaPadre,
      d.claveDependencia,
      d.responsable,
      d.telefono,
      d.email,
      d.esActiva,
      dp.nombre as dependenciaPadreNombre
    FROM tablero.Dependencia d
    LEFT JOIN tablero.Dependencia dp ON d.idDependenciaPadre = dp.id
    ORDER BY d.tipoDependencia ASC, d.nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    claveDependencia: row.claveDependencia,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva,
    dependenciaPadre: row.dependenciaPadreNombre ? {
      id: row.idDependenciaPadre,
      nombre: row.dependenciaPadreNombre
    } : null
  }));
}

export async function listDependenciasByTipo(tipoDependencia: string) {
  if (!tipoDependencia || !['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'].includes(tipoDependencia)) {
    throw new Error('Invalid tipoDependencia: must be SECRETARIA, DIRECCION_GENERAL, DIRECCION, DEPARTAMENTO, UNIDAD, or OFICINA');
  }
  const p = await getPool();
  const r = await p.request()
    .input('tipoDependencia', sql.VarChar(20), tipoDependencia)
    .query(`
      SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.tipoDependencia,
        d.idDependenciaPadre,
        d.claveDependencia,
        d.responsable,
        d.telefono,
        d.email,
        d.esActiva,
        dp.nombre as dependenciaPadreNombre
      FROM tablero.Dependencia d
      LEFT JOIN tablero.Dependencia dp ON d.idDependenciaPadre = dp.id
      WHERE d.tipoDependencia = @tipoDependencia
      ORDER BY d.nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    claveDependencia: row.claveDependencia,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva,
    dependenciaPadre: row.dependenciaPadreNombre ? {
      id: row.idDependenciaPadre,
      nombre: row.dependenciaPadreNombre
    } : null
  }));
}

export async function listDependenciasHijas(dependenciaPadreId: number) {
  if (!dependenciaPadreId || typeof dependenciaPadreId !== 'number' || dependenciaPadreId <= 0) {
    throw new Error('Invalid dependenciaPadreId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('dependenciaPadreId', sql.Int, dependenciaPadreId)
    .query(`
      SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.tipoDependencia,
        d.idDependenciaPadre,
        d.claveDependencia,
        d.responsable,
        d.telefono,
        d.email,
        d.esActiva,
        dp.nombre as dependenciaPadreNombre
      FROM tablero.Dependencia d
      LEFT JOIN tablero.Dependencia dp ON d.idDependenciaPadre = dp.id
      WHERE d.idDependenciaPadre = @dependenciaPadreId
      ORDER BY d.tipoDependencia ASC, d.nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    claveDependencia: row.claveDependencia,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva,
    dependenciaPadre: row.dependenciaPadreNombre ? {
      id: row.idDependenciaPadre,
      nombre: row.dependenciaPadreNombre
    } : null
  }));
}

export async function getDependenciaWithHijas(dependenciaId: number) {
  if (!dependenciaId || typeof dependenciaId !== 'number' || dependenciaId <= 0) {
    throw new Error('Invalid dependenciaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('dependenciaId', sql.Int, dependenciaId)
    .query(`
      SELECT
        d.id,
        d.nombre,
        d.descripcion,
        d.tipoDependencia,
        d.idDependenciaPadre,
        d.claveDependencia,
        d.responsable,
        d.telefono,
        d.email,
        d.esActiva,
        dp.nombre as dependenciaPadreNombre,
        dh.id as hijaId,
        dh.nombre as hijaNombre,
        dh.descripcion as hijaDescripcion,
        dh.tipoDependencia as hijaTipoDependencia,
        dh.claveDependencia as hijaClaveDependencia,
        dh.responsable as hijaResponsable,
        dh.telefono as hijaTelefono,
        dh.email as hijaEmail,
        dh.esActiva as hijaEsActiva
      FROM tablero.Dependencia d
      LEFT JOIN tablero.Dependencia dp ON d.idDependenciaPadre = dp.id
      LEFT JOIN tablero.Dependencia dh ON dh.idDependenciaPadre = d.id
      WHERE d.id = @dependenciaId
      ORDER BY dh.tipoDependencia ASC, dh.nombre ASC
    `);

  if (r.recordset.length === 0) return undefined;

  const dependencia = {
    id: r.recordset[0].id,
    nombre: r.recordset[0].nombre,
    descripcion: r.recordset[0].descripcion,
    tipoDependencia: r.recordset[0].tipoDependencia,
    idDependenciaPadre: r.recordset[0].idDependenciaPadre,
    claveDependencia: r.recordset[0].claveDependencia,
    responsable: r.recordset[0].responsable,
    telefono: r.recordset[0].telefono,
    email: r.recordset[0].email,
    esActiva: r.recordset[0].esActiva,
    dependenciaPadre: r.recordset[0].dependenciaPadreNombre ? {
      id: r.recordset[0].idDependenciaPadre,
      nombre: r.recordset[0].dependenciaPadreNombre
    } : null,
    dependenciasHijas: r.recordset
      .filter((row: any) => row.hijaId)
      .map((row: any) => ({
        id: row.hijaId,
        nombre: row.hijaNombre,
        descripcion: row.hijaDescripcion,
        tipoDependencia: row.hijaTipoDependencia,
        claveDependencia: row.hijaClaveDependencia,
        responsable: row.hijaResponsable,
        telefono: row.hijaTelefono,
        email: row.hijaEmail,
        esActiva: row.hijaEsActiva
      }))
  };

  return dependencia;
}

export async function createDependencia(
  nombre: string,
  descripcion: string,
  tipoDependencia: string,
  claveDependencia: string,
  idDependenciaPadre?: number,
  responsable?: string,
  telefono?: string,
  email?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200) {
    throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
  }
  if (!tipoDependencia || !['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'].includes(tipoDependencia)) {
    throw new Error('Invalid tipoDependencia: must be SECRETARIA, DIRECCION_GENERAL, DIRECCION, DEPARTAMENTO, UNIDAD, or OFICINA');
  }
  if (!claveDependencia || typeof claveDependencia !== 'string' || claveDependencia.trim().length === 0 || claveDependencia.length > 20) {
    throw new Error('Invalid claveDependencia: must be a non-empty string with max 20 characters');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('nombre', sql.NVarChar(200), nombre)
    .input('descripcion', sql.NVarChar(1000), descripcion)
    .input('tipoDependencia', sql.VarChar(20), tipoDependencia)
    .input('claveDependencia', sql.NVarChar(20), claveDependencia)
    .input('idDependenciaPadre', sql.Int, idDependenciaPadre ?? null)
    .input('responsable', sql.NVarChar(200), responsable ?? null)
    .input('telefono', sql.NVarChar(50), telefono ?? null)
    .input('email', sql.NVarChar(255), email ?? null)
    .input('esActiva', sql.Bit, esActiva ?? true)
    .query(`
      INSERT INTO tablero.Dependencia (
        nombre, descripcion, tipoDependencia, claveDependencia,
        idDependenciaPadre, responsable, telefono, email, esActiva
      )
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoDependencia,
        INSERTED.claveDependencia,
        INSERTED.idDependenciaPadre,
        INSERTED.responsable,
        INSERTED.telefono,
        INSERTED.email,
        INSERTED.esActiva
      VALUES (
        @nombre, @descripcion, @tipoDependencia, @claveDependencia,
        @idDependenciaPadre, @responsable, @telefono, @email, @esActiva
      )
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    claveDependencia: row.claveDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva
  };
}

export async function updateDependencia(
  dependenciaId: number,
  nombre?: string,
  descripcion?: string,
  tipoDependencia?: string,
  claveDependencia?: string,
  idDependenciaPadre?: number,
  responsable?: string,
  telefono?: string,
  email?: string,
  esActiva?: boolean,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!dependenciaId || typeof dependenciaId !== 'number' || dependenciaId <= 0) {
    throw new Error('Invalid dependenciaId: must be a positive number');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 200)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 200 characters');
  }
  if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 1000)) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 1000 characters');
  }
  if (tipoDependencia !== undefined && !['SECRETARIA', 'DIRECCION_GENERAL', 'DIRECCION', 'DEPARTAMENTO', 'UNIDAD', 'OFICINA'].includes(tipoDependencia)) {
    throw new Error('Invalid tipoDependencia: must be SECRETARIA, DIRECCION_GENERAL, DIRECCION, DEPARTAMENTO, UNIDAD, or OFICINA');
  }
  if (claveDependencia !== undefined && (!claveDependencia || typeof claveDependencia !== 'string' || claveDependencia.trim().length === 0 || claveDependencia.length > 20)) {
    throw new Error('Invalid claveDependencia: must be a non-empty string with max 20 characters');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('dependenciaId', sql.Int, dependenciaId)
    .input('nombre', sql.NVarChar(200), nombre ?? null)
    .input('descripcion', sql.NVarChar(1000), descripcion ?? null)
    .input('tipoDependencia', sql.VarChar(20), tipoDependencia ?? null)
    .input('claveDependencia', sql.NVarChar(20), claveDependencia ?? null)
    .input('idDependenciaPadre', sql.Int, idDependenciaPadre ?? null)
    .input('responsable', sql.NVarChar(200), responsable ?? null)
    .input('telefono', sql.NVarChar(50), telefono ?? null)
    .input('email', sql.NVarChar(255), email ?? null)
    .input('esActiva', sql.Bit, esActiva ?? null)
    .query(`
      UPDATE tablero.Dependencia
      SET nombre = @nombre,
          descripcion = @descripcion,
          tipoDependencia = @tipoDependencia,
          claveDependencia = @claveDependencia,
          idDependenciaPadre = @idDependenciaPadre,
          responsable = @responsable,
          telefono = @telefono,
          email = @email,
          esActiva = @esActiva
      OUTPUT
        INSERTED.id,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoDependencia,
        INSERTED.claveDependencia,
        INSERTED.idDependenciaPadre,
        INSERTED.responsable,
        INSERTED.telefono,
        INSERTED.email,
        INSERTED.esActiva
      WHERE id = @dependenciaId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoDependencia: row.tipoDependencia,
    claveDependencia: row.claveDependencia,
    idDependenciaPadre: row.idDependenciaPadre,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.email,
    esActiva: row.esActiva
  };
}

export async function deleteDependencia(dependenciaId: number, tx?: sqlType.Transaction) {
  if (!dependenciaId || typeof dependenciaId !== 'number' || dependenciaId <= 0) {
    throw new Error('Invalid dependenciaId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('dependenciaId', sql.Int, dependenciaId)
    .query(`
      DELETE FROM tablero.Dependencia
      OUTPUT DELETED.id
      WHERE id = @dependenciaId
    `);
  return r.recordset[0]?.id;
}