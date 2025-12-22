import { getPool, sql } from '../../db/mssql.js';
import pino from 'pino';

const logger = pino({
  name: 'afectacionOrg-repo',
  level: process.env.LOG_LEVEL || 'info'
});

// Register affectation using stored procedure
export async function registerAfectacionOrg(data: {
  entidad: string;
  anio: number;
  quincena: number;
  orgNivel: number;
  org0: string;
  org1?: string;
  org2?: string;
  org3?: string;
  accion: string;
  resultado: string;
  mensaje?: string;
  usuario: string;
  appName: string;
  ip: string;
}) {
  const p = await getPool();

  try {
    // Normalizar org2 y org3: si son null, undefined o vacío, usar "01" por defecto
    const org2Final = (!data.org2 || (typeof data.org2 === 'string' && data.org2.trim() === '')) ? '01' : String(data.org2).padStart(2, '0').substring(0, 2);
    const org3Final = (!data.org3 || (typeof data.org3 === 'string' && data.org3.trim() === '')) ? '01' : String(data.org3).padStart(2, '0').substring(0, 2);
    
    // Normalizar org0 y org1 también
    const org0Final = data.org0.padStart(2, '0').substring(0, 2);
    const org1Final = data.org1 ? data.org1.padStart(2, '0').substring(0, 2) : null;
    
    // Validar que no exista un registro duplicado antes de insertar
    // Solo validar por: Org0, Org1, Org2, Org3, Anio, Quincena
    const checkDuplicateRequest = p.request()
      .input('Anio', sql.SmallInt, data.anio)
      .input('Quincena', sql.TinyInt, data.quincena)
      .input('Org0', sql.Char(2), org0Final)
      .input('Org1', sql.Char(2), org1Final)
      .input('Org2', sql.Char(2), org2Final)
      .input('Org3', sql.Char(2), org3Final);

    const duplicateCheck = await checkDuplicateRequest.query(`
      SELECT TOP 1 AfectacionId, Resultado, Mensaje, CreatedAt, Anio, Quincena, Accion
      FROM afec.BitacoraAfectacionOrg
      WHERE Anio = @Anio
        AND Quincena = @Quincena
        AND Org0 = @Org0
        AND (Org1 = @Org1 OR (@Org1 IS NULL AND Org1 IS NULL))
        AND Org2 = @Org2
        AND Org3 = @Org3
      ORDER BY CreatedAt DESC
    `);

    if (duplicateCheck.recordset.length > 0) {
      const existingRecord = duplicateCheck.recordset[0];
      logger.info({
        operation: 'registerAfectacionOrg',
        entidad: data.entidad,
        anio: data.anio,
        quincena: data.quincena,
        org0: org0Final,
        org1: org1Final,
        org2: org2Final,
        org3: org3Final,
        afectacionId: existingRecord.AfectacionId,
        createdAt: existingRecord.CreatedAt
      }, 'Registro existente encontrado, retornando registro duplicado');
      
      // Obtener quincena y año del registro existente desde la base de datos
      const existingQuincena = existingRecord.Quincena || data.quincena;
      const existingAnio = existingRecord.Anio || data.anio;
      
      // Calcular período de trabajo (formato QQAA: quincena 2 dígitos + año 2 últimos dígitos)
      const quincenaStr = String(existingQuincena).padStart(2, '0');
      const anioStr = String(existingAnio).slice(-2);
      const periodo = quincenaStr + anioStr;
      
      // Retornar el registro existente en lugar de lanzar error
      return {
        success: true,
        afectacionId: existingRecord.AfectacionId,
        message: existingRecord.Mensaje || 'Registro existente encontrado',
        quincena: existingQuincena,
        anio: existingAnio,
        periodo: periodo,
        accion: existingRecord.Accion || data.accion
      };
    }

    const request = p.request()
      .input('Entidad', sql.NVarChar(128), data.entidad)
      .input('Anio', sql.SmallInt, data.anio)
      .input('Quincena', sql.TinyInt, data.quincena)
      .input('OrgNivel', sql.TinyInt, data.orgNivel)
      .input('Org0', sql.Char(2), org0Final)
      .input('Org1', sql.Char(2), org1Final)
      .input('Org2', sql.Char(2), org2Final)
      .input('Org3', sql.Char(2), org3Final)
      .input('Accion', sql.VarChar(20), data.accion)
      .input('Resultado', sql.VarChar(10), data.resultado)
      .input('Mensaje', sql.NVarChar(4000), data.mensaje || null)
      .input('Usuario', sql.NVarChar(100), data.usuario)
      .input('AppName', sql.NVarChar(100), data.appName)
      .input('Ip', sql.NVarChar(64), data.ip);

    const result = await request.execute('afec.usp_RegistrarAfectacionOrg');

    logger.debug({
      operation: 'registerAfectacionOrg',
      entidad: data.entidad,
      anio: data.anio,
      quincena: data.quincena,
      result: result
    }, 'Resultado del procedimiento almacenado');
    // Check if the stored procedure executed successfully
    // Since stored procedures don't return values directly, we verify by checking
    // if a record was actually inserted into the BitacoraAfectacionOrg table
    const verifyRequest = p.request()
      .input('Entidad', sql.NVarChar(128), data.entidad)
      .input('Anio', sql.SmallInt, data.anio)
      .input('Quincena', sql.TinyInt, data.quincena)
      .input('Org0', sql.Char(2), org0Final)
      .input('Org1', sql.Char(2), org1Final)
      .input('Org2', sql.Char(2), org2Final)
      .input('Org3', sql.Char(2), org3Final)
      .input('Usuario', sql.NVarChar(100), data.usuario)
      .input('Accion', sql.VarChar(20), data.accion);

    const verifyResult = await verifyRequest.query(`
      SELECT TOP 1 AfectacionId, Resultado, Mensaje, Accion
      FROM afec.BitacoraAfectacionOrg
      WHERE Entidad = @Entidad
        AND Anio = @Anio
        AND Quincena = @Quincena
        AND Org0 = @Org0
        AND (Org1 = @Org1 OR (@Org1 IS NULL AND Org1 IS NULL))
        AND Org2 = @Org2
        AND Org3 = @Org3
        AND Usuario = @Usuario
        AND Accion = @Accion
      ORDER BY CreatedAt DESC
    `);

    if (verifyResult.recordset.length === 0) {
      throw new Error('Afectacion registration failed: No record found in audit log');
    }

    const logEntry = verifyResult.recordset[0];
    if (logEntry.Resultado !== 'OK') {
      throw new Error(`Afectacion registration failed: ${logEntry.Mensaje || 'Unknown error'}`);
    }

    // Calcular período de trabajo (formato QQAA: quincena 2 dígitos + año 2 últimos dígitos)
    const quincenaStr = String(data.quincena).padStart(2, '0');
    const anioStr = String(data.anio).slice(-2);
    const periodo = quincenaStr + anioStr;

    return {
      success: true,
      afectacionId: logEntry.AfectacionId,
      message: logEntry.Mensaje || 'Afectacion registered successfully',
      quincena: data.quincena,
      anio: data.anio,
      periodo: periodo,
      accion: logEntry.Accion || data.accion
    };

  } catch (error: any) {
    // Log the error for debugging
    logger.error({
      operation: 'registerAfectacionOrg',
      entidad: data.entidad,
      anio: data.anio,
      quincena: data.quincena,
      error: error.message,
      stack: error.stack
    }, 'Error al registrar afectación');

    // Re-throw with more context
    if (error.message.includes('Afectacion registration failed')) {
      throw error;
    }

    // Handle SQL Server specific errors
    if (error.code) {
      throw new Error(`Database error during affectation registration: ${error.message}`);
    }

    throw new Error(`Failed to register affectation: ${error.message}`);
  }
}

// Get affectation states
export async function getEstadosAfectacion(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const p = await getPool();
  let query = `
    SELECT
      Entidad,
      Anio,
      OrgNivel,
      Org0,
      Org1,
      Org2,
      Org3,
      QuincenaActual,
      UltimaFecha,
      UltimoUsuario
    FROM afec.EstadoAfectacionOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters.anio) {
    query += ' AND Anio = @anio';
    params.push({ name: 'anio', type: sql.SmallInt, value: filters.anio });
  }
  if (filters.orgNivel !== undefined) {
    query += ' AND OrgNivel = @orgNivel';
    params.push({ name: 'orgNivel', type: sql.TinyInt, value: filters.orgNivel });
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }

  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const r = await req.query(query);

  return r.recordset.map((row: any) => ({
    entidad: row.Entidad,
    anio: row.Anio,
    orgNivel: row.OrgNivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    quincenaActual: row.QuincenaActual,
    ultimaFecha: row.UltimaFecha,
    ultimoUsuario: row.UltimoUsuario
  }));
}

// Get user progress
export async function getProgresoUsuario(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}) {
  const p = await getPool();
  let query = `
    SELECT
      Entidad,
      Anio,
      OrgNivel,
      Org0,
      Org1,
      Org2,
      Org3,
      Usuario,
      QuincenaUltima,
      FechaUltima
    FROM afec.ProgresoUsuarioOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters.anio) {
    query += ' AND Anio = @anio';
    params.push({ name: 'anio', type: sql.SmallInt, value: filters.anio });
  }
  if (filters.orgNivel !== undefined) {
    query += ' AND OrgNivel = @orgNivel';
    params.push({ name: 'orgNivel', type: sql.TinyInt, value: filters.orgNivel });
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }
  if (filters.usuario) {
    query += ' AND Usuario = @usuario';
    params.push({ name: 'usuario', type: sql.NVarChar(100), value: filters.usuario });
  }

  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const r = await req.query(query);

  return r.recordset.map((row: any) => ({
    entidad: row.Entidad,
    anio: row.Anio,
    orgNivel: row.OrgNivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    usuario: row.Usuario,
    quincenaUltima: row.QuincenaUltima,
    fechaUltima: row.FechaUltima
  }));
}

// Get affectation logs
export async function getBitacoraAfectacion(filters: {
  entidad?: string;
  anio?: number;
  quincena?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
  accion?: string;
  resultado?: string;
  limit?: number;
  offset?: number;
}) {
  const p = await getPool();
  let query = `
    SELECT
      AfectacionId,
      OrgNivel,
      Org0,
      Org1,
      Org2,
      Org3,
      Entidad,
      EntidadId,
      Anio,
      Quincena,
      Accion,
      Resultado,
      Mensaje,
      Usuario,
      UserId,
      AppName,
      Ip,
      UserAgent,
      RequestId,
      CreatedAt
    FROM afec.BitacoraAfectacionOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters.anio) {
    query += ' AND Anio = @anio';
    params.push({ name: 'anio', type: sql.SmallInt, value: filters.anio });
  }
  if (filters.quincena) {
    query += ' AND Quincena = @quincena';
    params.push({ name: 'quincena', type: sql.TinyInt, value: filters.quincena });
  }
  if (filters.orgNivel !== undefined) {
    query += ' AND OrgNivel = @orgNivel';
    params.push({ name: 'orgNivel', type: sql.TinyInt, value: filters.orgNivel });
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }
  if (filters.usuario) {
    query += ' AND Usuario = @usuario';
    params.push({ name: 'usuario', type: sql.NVarChar(100), value: filters.usuario });
  }
  if (filters.accion) {
    query += ' AND Accion = @accion';
    params.push({ name: 'accion', type: sql.VarChar(20), value: filters.accion });
  }
  if (filters.resultado) {
    query += ' AND Resultado = @resultado';
    params.push({ name: 'resultado', type: sql.VarChar(10), value: filters.resultado });
  }

  query += ' ORDER BY CreatedAt DESC';

  if (filters.limit) {
    query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    params.push({ name: 'offset', type: sql.Int, value: filters.offset || 0 });
    params.push({ name: 'limit', type: sql.Int, value: filters.limit });
  }

  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const r = await req.query(query);

  return r.recordset.map((row: any) => ({
    afectacionId: row.AfectacionId,
    orgNivel: row.OrgNivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    entidad: row.Entidad,
    entidadId: row.EntidadId,
    anio: row.Anio,
    quincena: row.Quincena,
    accion: row.Accion,
    resultado: row.Resultado,
    mensaje: row.Mensaje,
    usuario: row.Usuario,
    userId: row.UserId,
    appName: row.AppName,
    ip: row.Ip,
    userAgent: row.UserAgent,
    requestId: row.RequestId,
    createdAt: row.CreatedAt
  }));
}

// Get dashboard data from view
export async function getTableroAfectaciones(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const p = await getPool();
  let query = `
    SELECT
      Entidad,
      Anio,
      OrgNivel,
      Org0,
      Org1,
      Org2,
      Org3,
      QuincenaActual,
      UltimaFecha,
      UltimoUsuario,
      Accion,
      Resultado,
      Mensaje
    FROM afec.v_TableroAfectacionesOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters.anio) {
    query += ' AND Anio = @anio';
    params.push({ name: 'anio', type: sql.SmallInt, value: filters.anio });
  }
  if (filters.orgNivel !== undefined) {
    query += ' AND OrgNivel = @orgNivel';
    params.push({ name: 'orgNivel', type: sql.TinyInt, value: filters.orgNivel });
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }

  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const r = await req.query(query);

  return r.recordset.map((row: any) => ({
    entidad: row.Entidad,
    anio: row.Anio,
    orgNivel: row.OrgNivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    quincenaActual: row.QuincenaActual,
    ultimaFecha: row.UltimaFecha,
    ultimoUsuario: row.UltimoUsuario,
    accion: row.Accion,
    resultado: row.Resultado,
    mensaje: row.Mensaje
  }));
}

// Get last affectations from view
export async function getUltimaAfectacion(filters: {
  entidad?: string;
  anio?: number;
  orgNivel?: number;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
  usuario?: string;
}) {
  const p = await getPool();
  let query = `
    SELECT
      Entidad,
      Anio,
      OrgNivel,
      Org0,
      Org1,
      Org2,
      Org3,
      Quincena,
      Accion,
      Resultado,
      Usuario,
      CreatedAt,
      Mensaje
    FROM afec.v_UltimaAfectacionOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters.anio) {
    query += ' AND Anio = @anio';
    params.push({ name: 'anio', type: sql.SmallInt, value: filters.anio });
  }
  if (filters.orgNivel !== undefined) {
    query += ' AND OrgNivel = @orgNivel';
    params.push({ name: 'orgNivel', type: sql.TinyInt, value: filters.orgNivel });
  }
  if (filters.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }
  if (filters.usuario) {
    query += ' AND Usuario = @usuario';
    params.push({ name: 'usuario', type: sql.NVarChar(100), value: filters.usuario });
  }

  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const r = await req.query(query);

  return r.recordset.map((row: any) => ({
    entidad: row.Entidad,
    anio: row.Anio,
    orgNivel: row.OrgNivel,
    org0: row.Org0,
    org1: row.Org1,
    org2: row.Org2,
    org3: row.Org3,
    quincena: row.Quincena,
    accion: row.Accion,
    resultado: row.Resultado,
    usuario: row.Usuario,
    createdAt: row.CreatedAt,
    mensaje: row.Mensaje
  }));
}

// Get current pay period following alta afectacion rule
export async function getQuincenaAltaAfectacion(filters?: {
  entidad?: string;
  org0?: string;
  org1?: string;
  org2?: string;
  org3?: string;
}) {
  const p = await getPool();
  
  // Build query to get the last affected quincena for the specific organica
  let query = `
    SELECT TOP 1
      Anio,
      QuincenaActual,
      UltimaFecha
    FROM afec.EstadoAfectacionOrg
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.entidad) {
    query += ' AND Entidad = @entidad';
    params.push({ name: 'entidad', type: sql.NVarChar(128), value: filters.entidad });
  }
  if (filters?.org0) {
    query += ' AND Org0 = @org0';
    params.push({ name: 'org0', type: sql.Char(2), value: filters.org0 });
  }
  if (filters?.org1) {
    query += ' AND Org1 = @org1';
    params.push({ name: 'org1', type: sql.Char(2), value: filters.org1 });
  }
  if (filters?.org2) {
    query += ' AND Org2 = @org2';
    params.push({ name: 'org2', type: sql.Char(2), value: filters.org2 });
  }
  if (filters?.org3) {
    query += ' AND Org3 = @org3';
    params.push({ name: 'org3', type: sql.Char(2), value: filters.org3 });
  }

  query += ' ORDER BY Anio DESC, QuincenaActual DESC';
  
  const req = p.request();
  params.forEach(param => req.input(param.name, param.type, param.value));
  const result = await req.query(query);
  
  if (result.recordset.length === 0) {
    // No previous affectations for this organica, start from quincena 1 of current year
    const now = new Date();
    const year = now.getFullYear();
    
    return {
      anio: year,
      mes: 1, // January
      quincena: 1, // First quincena of the year
      fechaActual: now.toISOString(),
      descripcion: `Quincena 1 de 01/${year} (primera afectación para esta orgánica)`,
      esNueva: true
    };
  }
  
  const lastAfectacion = result.recordset[0];
  const lastYear = lastAfectacion.Anio;
  const lastQuincena = lastAfectacion.QuincenaActual;
  
  // Calculate current quincena based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentQuincenaMonth = currentDay <= 15 ? 1 : 2;
  const currentQuincenaYear = (currentMonth - 1) * 2 + currentQuincenaMonth;
  
  // Check if the last affected quincena is still active
  // A quincena is considered active if it's the current quincena of the current year
  const isActive = (lastYear === currentYear && lastQuincena === currentQuincenaYear);
  
  if (isActive) {
    // Return the active quincena
    return {
      anio: lastYear,
      mes: currentMonth,
      quincena: lastQuincena,
      fechaActual: now.toISOString(),
      descripcion: `Quincena ${lastQuincena} de ${currentMonth.toString().padStart(2, '0')}/${lastYear} (activa)`,
      esNueva: false
    };
  } else {
    // Calculate next quincena
    let nextYear = lastYear;
    let nextQuincena = lastQuincena + 1;
    
    if (nextQuincena > 24) {
      nextQuincena = 1;
      nextYear = lastYear + 1;
    }
    
    // If next quincena is still in the past, keep advancing until we reach current or future
    while (nextYear < currentYear || (nextYear === currentYear && nextQuincena < currentQuincenaYear)) {
      nextQuincena++;
      if (nextQuincena > 24) {
        nextQuincena = 1;
        nextYear++;
      }
    }
    
    return {
      anio: nextYear,
      mes: currentMonth,
      quincena: nextQuincena,
      fechaActual: now.toISOString(),
      descripcion: `Quincena ${nextQuincena} de ${currentMonth.toString().padStart(2, '0')}/${nextYear} (siguiente)`,
      esNueva: false
    };
  }
}