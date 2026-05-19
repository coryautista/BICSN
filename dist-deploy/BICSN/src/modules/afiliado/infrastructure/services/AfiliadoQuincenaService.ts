import { executeSelectableProcedure } from '../../../../db/firebird.js';
import { getPool, sql } from '../../../../db/mssql.js';

export async function getQuincenaAplicacion(
  org0: string,
  org1?: string | null,
  org2?: string | null,
  org3?: string | null,
  userId?: number
): Promise<{ quincena: number; anio: number }> {
  const p = await getPool();

  const whereConditions = ['Org0 = @Org0'];
  const request = p.request().input('Org0', sql.Char(2), org0);

  let orgNivel = 0;
  if (org1) {
    whereConditions.push('Org1 = @Org1');
    request.input('Org1', sql.Char(2), org1);
    orgNivel = 1;
  }
  if (org2) {
    whereConditions.push('Org2 = @Org2');
    request.input('Org2', sql.Char(2), org2);
    orgNivel = 2;
  }
  if (org3) {
    whereConditions.push('Org3 = @Org3');
    request.input('Org3', sql.Char(2), org3);
    orgNivel = 3;
  }

  const result = await request.query(`
    SELECT TOP 1 Quincena, Anio, Accion
    FROM afec.BitacoraAfectacionOrg
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
  `);

  const currentYear = new Date().getFullYear();
  let quincena: number;
  let anio: number;
  let needsRegistration = false;

  if (result.recordset.length === 0) {
    try {
      if (!org0 || !org1) {
        throw new Error('org0 y org1 son requeridos para consultar Firebird');
      }

      console.log(`No existe quincena para orgánica ${org0}/${org1}/${org2}/${org3}. Consultando Firebird AP_G_APLICADO_TIPO...`);

      const firebirdRows = await executeSelectableProcedure('AP_G_APLICADO_TIPO', [org0, org1, '01', '01'], {
        alias: 'p',
        columns: ['p.QUINCENA', 'p.FECHA']
      });

      if (!firebirdRows || firebirdRows.length === 0) {
        throw new Error('AP_G_APLICADO_TIPO no retornó resultados');
      }

      const firebirdResult = {
        QUINCENA: firebirdRows[0].QUINCENA,
        FECHA: firebirdRows[0].FECHA
      };

      const quincenaStr = String(firebirdResult.QUINCENA).padStart(4, '0');
      const quincenaParsed = parseInt(quincenaStr.substring(0, 2));
      const anioSuffix = parseInt(quincenaStr.substring(2, 4));
      const anioFromQuincena = 2000 + anioSuffix;

      let anioFromFecha: number | null = null;
      if (firebirdResult.FECHA) {
        const fechaParts = firebirdResult.FECHA.split('.');
        if (fechaParts.length === 3) {
          const anioFecha = parseInt(fechaParts[2]);
          if (!isNaN(anioFecha) && anioFecha >= 2000 && anioFecha <= 2100) {
            anioFromFecha = anioFecha;
          }
        }
      }

      if (quincenaParsed >= 1 && quincenaParsed <= 24 && anioFromQuincena >= 2000 && anioFromQuincena <= 2100) {
        quincena = quincenaParsed;
        anio = anioFromFecha && anioFromFecha >= 2000 && anioFromFecha <= 2100 ? anioFromFecha : anioFromQuincena;
        needsRegistration = true;
        console.log(`Quincena obtenida de Firebird: ${quincena}/${anio} (QUINCENA: ${firebirdResult.QUINCENA}, FECHA: ${firebirdResult.FECHA})`);
      } else {
        throw new Error(`Valores parseados inválidos: quincena=${quincenaParsed}, año=${anioFromQuincena}`);
      }
    } catch (error: any) {
      console.warn(`Error al consultar Firebird para obtener quincena (${error.message}), usando fallback: quincena 1, año ${currentYear}`);
      quincena = 1;
      anio = currentYear;
      needsRegistration = true;
    }
  } else {
    const lastRecord = result.recordset[0];
    const lastQuincena = lastRecord.Quincena;
    const lastAnio = lastRecord.Anio;
    const accion = lastRecord.Accion;

    if (accion === 'Completa') {
      quincena = lastQuincena === 24 ? 1 : lastQuincena + 1;
      anio = lastQuincena === 24 ? lastAnio + 1 : lastAnio;
      needsRegistration = true;
      console.log(`Última acción fue 'Completa'. Nueva quincena: ${quincena}, Año: ${anio}`);
    } else {
      quincena = lastQuincena;
      anio = lastAnio;
      console.log(`Última acción fue '${accion}'. Usando quincena existente: ${quincena}, Año: ${anio}`);
    }
  }

  if (needsRegistration) {
    try {
      const checkDuplicateRequest = p.request()
        .input('Org0', sql.Char(2), org0)
        .input('Org1', sql.Char(2), org1 || null);

      const duplicateCheck = await checkDuplicateRequest.query(`
        SELECT TOP 1 Quincena, Anio, Accion, CreatedAt
        FROM afec.BitacoraAfectacionOrg
        WHERE Org0 = @Org0
          AND Org1 = @Org1
          AND Accion = 'Aplicar'
          AND Entidad = 'AFILIADOS'
        ORDER BY CreatedAt DESC
      `);

      if (duplicateCheck.recordset.length > 0) {
        const existingRecord = duplicateCheck.recordset[0];
        console.log(`Ya existe un registro con Accion = 'Aplicar' para orgánica ${org0}/${org1 || 'NULL'}. Usando quincena existente: ${existingRecord.Quincena}/${existingRecord.Anio}. Registro creado: ${existingRecord.CreatedAt}`);
        quincena = existingRecord.Quincena;
        anio = existingRecord.Anio;
      } else {
        const registerRequest = p.request()
          .input('Entidad', sql.NVarChar(128), 'AFILIADOS')
          .input('Anio', sql.SmallInt, anio)
          .input('Quincena', sql.TinyInt, quincena)
          .input('OrgNivel', sql.TinyInt, orgNivel)
          .input('Org0', sql.Char(2), org0)
          .input('Org1', sql.Char(2), org1 || null)
          .input('Org2', sql.Char(2), org2 || null)
          .input('Org3', sql.Char(2), org3 || null)
          .input('Accion', sql.VarChar(20), 'Aplicar')
          .input('Resultado', sql.VarChar(10), 'OK')
          .input('Mensaje', sql.NVarChar(4000), `Quincena ${quincena}/${anio} creada automáticamente para afiliación`)
          .input('Usuario', sql.NVarChar(100), userId ? `Usuario_${userId}` : 'Sistema')
          .input('AppName', sql.NVarChar(100), 'BICSN_Afiliados')
          .input('Ip', sql.NVarChar(64), 'localhost');

        await registerRequest.execute('afec.usp_RegistrarAfectacionOrg');
        console.log(`Quincena ${quincena}/${anio} registrada exitosamente en BitacoraAfectacionOrg, EstadoAfectacionOrg y ProgresoUsuarioOrg`);
      }
    } catch (error: any) {
      console.error(`Error al registrar quincena en afec: ${error.message}`);
    }
  }

  return { quincena, anio };
}
