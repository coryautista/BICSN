import { getPool, sql } from '../../../db/mssql.js';
import { sql as sqlType } from '../../../db/context.js';

export async function findIndicadorById(indicadorId: number) {
  if (!indicadorId || typeof indicadorId !== 'number' || indicadorId <= 0) {
    throw new Error('Invalid indicadorId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('indicadorId', sql.Int, indicadorId)
    .query(`
      SELECT
        i.id,
        i.idPrograma,
        i.nombre,
        i.descripcion,
        i.tipoIndicador,
        i.frecuenciaMedicion,
        i.meta,
        i.sentido,
        i.formula,
        i.unidadMedida,
        i.fuenteDatos,
        i.responsable,
        i.observaciones,
        p.nombre as programaNombre,
        p.descripcion as programaDescripcion,
        p.idLineaEstrategica,
        le.nombre as lineaEstrategicaNombre,
        le.descripcion as lineaEstrategicaDescripcion,
        le.idEje,
        e.nombre as ejeNombre
      FROM tablero.Indicador i
      INNER JOIN tablero.Programa p ON i.idPrograma = p.id
      INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
      INNER JOIN tablero.Eje e ON le.idEje = e.id
      WHERE i.id = @indicadorId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    unidadMedida: row.unidadMedida,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones,
    programa: {
      id: row.idPrograma,
      nombre: row.programaNombre,
      descripcion: row.programaDescripcion
    },
    lineaEstrategica: {
      id: row.idLineaEstrategica,
      nombre: row.lineaEstrategicaNombre,
      descripcion: row.lineaEstrategicaDescripcion
    },
    eje: {
      id: row.idEje,
      nombre: row.ejeNombre
    }
  };
}

export async function listIndicadores() {
  const p = await getPool();
  const r = await p.request().query(`
    SELECT
      i.id,
      i.idPrograma,
      i.nombre,
      i.descripcion,
      i.tipoIndicador,
      i.frecuenciaMedicion,
      i.meta,
      i.sentido,
      i.formula,
      i.unidadMedida,
      i.fuenteDatos,
      i.responsable,
      i.observaciones,
      p.nombre as programaNombre,
      le.nombre as lineaEstrategicaNombre,
      e.nombre as ejeNombre
    FROM tablero.Indicador i
    INNER JOIN tablero.Programa p ON i.idPrograma = p.id
    INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
    INNER JOIN tablero.Eje e ON le.idEje = e.id
    ORDER BY e.nombre ASC, le.nombre ASC, p.nombre ASC, i.nombre ASC
  `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    unidadMedida: row.unidadMedida,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones,
    programa: {
      id: row.idPrograma,
      nombre: row.programaNombre
    },
    lineaEstrategica: {
      id: row.idLineaEstrategica,
      nombre: row.lineaEstrategicaNombre
    },
    eje: {
      id: row.idEje,
      nombre: row.ejeNombre
    }
  }));
}

export async function listIndicadoresByPrograma(programaId: number) {
  if (!programaId || typeof programaId !== 'number' || programaId <= 0) {
    throw new Error('Invalid programaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('programaId', sql.Int, programaId)
    .query(`
      SELECT
        i.id,
        i.idPrograma,
        i.nombre,
        i.descripcion,
        i.tipoIndicador,
        i.frecuenciaMedicion,
        i.meta,
        i.sentido,
        i.formula,
        i.unidadMedida,
        i.fuenteDatos,
        i.responsable,
        i.observaciones,
        p.nombre as programaNombre,
        le.nombre as lineaEstrategicaNombre,
        e.nombre as ejeNombre
      FROM tablero.Indicador i
      INNER JOIN tablero.Programa p ON i.idPrograma = p.id
      INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
      INNER JOIN tablero.Eje e ON le.idEje = e.id
      WHERE i.idPrograma = @programaId
      ORDER BY i.nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    unidadMedida: row.unidadMedida,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones,
    programa: {
      id: row.idPrograma,
      nombre: row.programaNombre
    },
    lineaEstrategica: {
      id: row.idLineaEstrategica,
      nombre: row.lineaEstrategicaNombre
    },
    eje: {
      id: row.idEje,
      nombre: row.ejeNombre
    }
  }));
}

export async function listIndicadoresByLineaEstrategica(lineaEstrategicaId: number) {
  if (!lineaEstrategicaId || typeof lineaEstrategicaId !== 'number' || lineaEstrategicaId <= 0) {
    throw new Error('Invalid lineaEstrategicaId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('lineaEstrategicaId', sql.Int, lineaEstrategicaId)
    .query(`
      SELECT
        i.id,
        i.idPrograma,
        i.nombre,
        i.descripcion,
        i.tipoIndicador,
        i.frecuenciaMedicion,
        i.meta,
        i.sentido,
        i.formula,
        i.unidadMedida,
        i.fuenteDatos,
        i.responsable,
        i.observaciones,
        p.nombre as programaNombre,
        le.nombre as lineaEstrategicaNombre,
        e.nombre as ejeNombre
      FROM tablero.Indicador i
      INNER JOIN tablero.Programa p ON i.idPrograma = p.id
      INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
      INNER JOIN tablero.Eje e ON le.idEje = e.id
      WHERE p.idLineaEstrategica = @lineaEstrategicaId
      ORDER BY p.nombre ASC, i.nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    unidadMedida: row.unidadMedida,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones,
    programa: {
      id: row.idPrograma,
      nombre: row.programaNombre
    },
    lineaEstrategica: {
      id: row.idLineaEstrategica,
      nombre: row.lineaEstrategicaNombre
    },
    eje: {
      id: row.idEje,
      nombre: row.ejeNombre
    }
  }));
}

export async function listIndicadoresByEje(ejeId: number) {
  if (!ejeId || typeof ejeId !== 'number' || ejeId <= 0) {
    throw new Error('Invalid ejeId: must be a positive number');
  }
  const p = await getPool();
  const r = await p.request()
    .input('ejeId', sql.Int, ejeId)
    .query(`
      SELECT
        i.id,
        i.idPrograma,
        i.nombre,
        i.descripcion,
        i.tipoIndicador,
        i.frecuenciaMedicion,
        i.meta,
        i.sentido,
        i.formula,
        i.unidadMedida,
        i.fuenteDatos,
        i.responsable,
        i.observaciones,
        p.nombre as programaNombre,
        le.nombre as lineaEstrategicaNombre,
        e.nombre as ejeNombre
      FROM tablero.Indicador i
      INNER JOIN tablero.Programa p ON i.idPrograma = p.id
      INNER JOIN tablero.LineaEstrategica le ON p.idLineaEstrategica = le.id
      INNER JOIN tablero.Eje e ON le.idEje = e.id
      WHERE le.idEje = @ejeId
      ORDER BY le.nombre ASC, p.nombre ASC, i.nombre ASC
    `);
  return r.recordset.map((row: any) => ({
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    unidadMedida: row.unidadMedida,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones,
    programa: {
      id: row.idPrograma,
      nombre: row.programaNombre
    },
    lineaEstrategica: {
      id: row.idLineaEstrategica,
      nombre: row.lineaEstrategicaNombre
    },
    eje: {
      id: row.idEje,
      nombre: row.ejeNombre
    }
  }));
}

export async function createIndicador(
  idPrograma: number,
  nombre: string,
  descripcion: string,
  tipoIndicador: string,
  frecuenciaMedicion: string,
  meta?: number,
  sentido?: string,
  formula?: string,
  idUnidadMedida?: number,
  idDimension?: number,
  fuenteDatos?: string,
  responsable?: string,
  observaciones?: string,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!idPrograma || typeof idPrograma !== 'number' || idPrograma <= 0) {
    throw new Error('Invalid idPrograma: must be a positive number');
  }
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500) {
    throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 5000) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 5000 characters');
  }
  if (!tipoIndicador || !['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO'].includes(tipoIndicador)) {
    throw new Error('Invalid tipoIndicador: must be PORCENTAJE, NUMERICO, MONETARIO, or BOOLEANO');
  }
  if (!frecuenciaMedicion || !['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'].includes(frecuenciaMedicion)) {
    throw new Error('Invalid frecuenciaMedicion: must be MENSUAL, TRIMESTRAL, SEMESTRAL, or ANUAL');
  }
  if (sentido && !['ASCENDENTE', 'DESCENDENTE'].includes(sentido)) {
    throw new Error('Invalid sentido: must be ASCENDENTE or DESCENDENTE');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('idPrograma', sql.Int, idPrograma)
    .input('nombre', sql.NVarChar(500), nombre)
    .input('descripcion', sql.NVarChar(5000), descripcion)
    .input('tipoIndicador', sql.VarChar(20), tipoIndicador)
    .input('frecuenciaMedicion', sql.VarChar(20), frecuenciaMedicion)
    .input('meta', sql.Decimal(18, 2), meta ?? null)
    .input('sentido', sql.VarChar(20), sentido ?? null)
    .input('formula', sql.NVarChar(1000), formula ?? null)
    .input('idUnidadMedida', sql.Int, idUnidadMedida ?? null)
    .input('idDimension', sql.Int, idDimension ?? null)
    .input('fuenteDatos', sql.NVarChar(500), fuenteDatos ?? null)
    .input('responsable', sql.NVarChar(200), responsable ?? null)
    .input('observaciones', sql.NVarChar(2000), observaciones ?? null)
    .query(`
      INSERT INTO tablero.Indicador (
        idPrograma, nombre, descripcion, tipoIndicador, frecuenciaMedicion,
        meta, sentido, formula, idUnidadMedida, idDimension, fuenteDatos, responsable, observaciones
      )
      OUTPUT
        INSERTED.id,
        INSERTED.idPrograma,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoIndicador,
        INSERTED.frecuenciaMedicion,
        INSERTED.meta,
        INSERTED.sentido,
        INSERTED.formula,
        INSERTED.idUnidadMedida,
        INSERTED.idDimension,
        INSERTED.fuenteDatos,
        INSERTED.responsable,
        INSERTED.observaciones
      VALUES (
        @idPrograma, @nombre, @descripcion, @tipoIndicador, @frecuenciaMedicion,
        @meta, @sentido, @formula, @idUnidadMedida, @idDimension, @fuenteDatos, @responsable, @observaciones
      )
    `);
  const row = r.recordset[0];
  return {
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    idUnidadMedida: row.idUnidadMedida,
    idDimension: row.idDimension,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones
  };
}

export async function updateIndicador(
  indicadorId: number,
  nombre?: string,
  descripcion?: string,
  tipoIndicador?: string,
  frecuenciaMedicion?: string,
  meta?: number,
  sentido?: string,
  formula?: string,
  idUnidadMedida?: number,
  idDimension?: number,
  fuenteDatos?: string,
  responsable?: string,
  observaciones?: string,
  userId?: string,
  tx?: sqlType.Transaction
) {
  if (!indicadorId || typeof indicadorId !== 'number' || indicadorId <= 0) {
    throw new Error('Invalid indicadorId: must be a positive number');
  }
  if (nombre !== undefined && (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0 || nombre.length > 500)) {
    throw new Error('Invalid nombre: must be a non-empty string with max 500 characters');
  }
  if (descripcion !== undefined && (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0 || descripcion.length > 5000)) {
    throw new Error('Invalid descripcion: must be a non-empty string with max 5000 characters');
  }
  if (tipoIndicador !== undefined && !['PORCENTAJE', 'NUMERICO', 'MONETARIO', 'BOOLEANO'].includes(tipoIndicador)) {
    throw new Error('Invalid tipoIndicador: must be PORCENTAJE, NUMERICO, MONETARIO, or BOOLEANO');
  }
  if (frecuenciaMedicion !== undefined && !['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'].includes(frecuenciaMedicion)) {
    throw new Error('Invalid frecuenciaMedicion: must be MENSUAL, TRIMESTRAL, SEMESTRAL, or ANUAL');
  }
  if (sentido !== undefined && !['ASCENDENTE', 'DESCENDENTE'].includes(sentido)) {
    throw new Error('Invalid sentido: must be ASCENDENTE or DESCENDENTE');
  }

  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('indicadorId', sql.Int, indicadorId)
    .input('nombre', sql.NVarChar(500), nombre ?? null)
    .input('descripcion', sql.NVarChar(5000), descripcion ?? null)
    .input('tipoIndicador', sql.VarChar(20), tipoIndicador ?? null)
    .input('frecuenciaMedicion', sql.VarChar(20), frecuenciaMedicion ?? null)
    .input('meta', sql.Decimal(18, 2), meta ?? null)
    .input('sentido', sql.VarChar(20), sentido ?? null)
    .input('formula', sql.NVarChar(1000), formula ?? null)
    .input('idUnidadMedida', sql.Int, idUnidadMedida ?? null)
    .input('idDimension', sql.Int, idDimension ?? null)
    .input('fuenteDatos', sql.NVarChar(500), fuenteDatos ?? null)
    .input('responsable', sql.NVarChar(200), responsable ?? null)
    .input('observaciones', sql.NVarChar(2000), observaciones ?? null)
    .query(`
      UPDATE tablero.Indicador
      SET nombre = @nombre,
           descripcion = @descripcion,
           tipoIndicador = @tipoIndicador,
           frecuenciaMedicion = @frecuenciaMedicion,
           meta = @meta,
           sentido = @sentido,
           formula = @formula,
           idUnidadMedida = @idUnidadMedida,
           idDimension = @idDimension,
           fuenteDatos = @fuenteDatos,
           responsable = @responsable,
           observaciones = @observaciones
      OUTPUT
        INSERTED.id,
        INSERTED.idPrograma,
        INSERTED.nombre,
        INSERTED.descripcion,
        INSERTED.tipoIndicador,
        INSERTED.frecuenciaMedicion,
        INSERTED.meta,
        INSERTED.sentido,
        INSERTED.formula,
        INSERTED.idUnidadMedida,
        INSERTED.idDimension,
        INSERTED.fuenteDatos,
        INSERTED.responsable,
        INSERTED.observaciones
      WHERE id = @indicadorId
    `);
  const row = r.recordset[0];
  if (!row) return undefined;
  return {
    id: row.id,
    idPrograma: row.idPrograma,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoIndicador: row.tipoIndicador,
    frecuenciaMedicion: row.frecuenciaMedicion,
    meta: row.meta,
    sentido: row.sentido,
    formula: row.formula,
    idUnidadMedida: row.idUnidadMedida,
    idDimension: row.idDimension,
    fuenteDatos: row.fuenteDatos,
    responsable: row.responsable,
    observaciones: row.observaciones
  };
}

export async function deleteIndicador(indicadorId: number, tx?: sqlType.Transaction) {
  if (!indicadorId || typeof indicadorId !== 'number' || indicadorId <= 0) {
    throw new Error('Invalid indicadorId: must be a positive number');
  }
  const req = tx ? new sqlType.Request(tx) : (await getPool()).request();
  const r = await req
    .input('indicadorId', sql.Int, indicadorId)
    .query(`
      DELETE FROM tablero.Indicador
      OUTPUT DELETED.id
      WHERE id = @indicadorId
    `);
  return r.recordset[0]?.id;
}