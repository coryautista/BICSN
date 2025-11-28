import { IAportacionFondoRepository } from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionIndividual, AportacionCompleta, TipoFondo, AportacionFondo } from '../../domain/entities/AportacionFondo.js';
import { Prestamo } from '../../domain/entities/Prestamo.js';
import { PrestamoMedianoPlazo } from '../../domain/entities/PrestamoMedianoPlazo.js';
import { PrestamoHipotecario } from '../../domain/entities/PrestamoHipotecario.js';
import { AportacionGuarderia } from '../../domain/entities/AportacionGuarderia.js';
import { PensionNominaTransitorio } from '../../domain/entities/PensionNominaTransitorio.js';
import { AportacionFondoDomainError, AportacionFondoError, AportacionFondoErrorMessages } from '../../domain/errors.js';
import { getOrgPersonalByClavesOrganicas } from '../../../orgPersonal/orgPersonal.repo.js';
import { getPool, sql } from '../../../../db/mssql.js';
import { executeSerializedQuery } from '../../../../db/firebird.js';

export class AportacionFondoRepository implements IAportacionFondoRepository {
  async obtenerAportacionesIndividuales(
    tipo: TipoFondo,
    claveOrganica0: string,
    claveOrganica1: string
  ): Promise<AportacionIndividual> {
    try {
      // Validar tipo de fondo
      const tiposValidos: TipoFondo[] = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
      if (!tiposValidos.includes(tipo)) {
        throw new AportacionFondoDomainError(
          AportacionFondoErrorMessages[AportacionFondoError.TIPO_FONDO_INVALIDO],
          AportacionFondoError.TIPO_FONDO_INVALIDO
        );
      }

      // Obtener registros filtrados por claves orgánicas con nombre de PERSONAL
      const registros = await this.obtenerOrgPersonalConNombre(claveOrganica0, claveOrganica1);

      if (registros.length === 0) {
        throw new AportacionFondoDomainError(
          AportacionFondoErrorMessages[AportacionFondoError.DATOS_NO_ENCONTRADOS],
          AportacionFondoError.DATOS_NO_ENCONTRADOS
        );
      }

      // Debug: verificar que los registros tengan nombre
      if (registros.length > 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Primer registro antes de calcularAportaciones:', {
          interno: registros[0].interno,
          nombre: registros[0].nombre,
          tieneNombre: !!registros[0].nombre,
          todasLasPropiedades: Object.keys(registros[0])
        });
      }

      // Calcular aportaciones según el tipo
      const datos = await this.calcularAportaciones(registros, tipo);

      // Debug: verificar que los datos tengan nombre después del cálculo
      if (datos.length > 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Primer dato después de calcularAportaciones:', {
          interno: datos[0].interno,
          nombre: datos[0].nombre,
          tieneNombre: !!datos[0].nombre,
          todasLasPropiedades: Object.keys(datos[0])
        });
      }

      // Calcular resumen
      const resumen = {
        total_empleados: datos.length,
        total_contribucion: datos.reduce((sum, item) => sum + item.total, 0),
        total_sueldo_base: datos.reduce((sum, item) => sum + item.sueldo_base, 0)
      };

      return {
        tipo,
        clave_organica_0: claveOrganica0,
        clave_organica_1: claveOrganica1,
        datos,
        resumen
      };
    } catch (error) {
      if (error instanceof AportacionFondoDomainError) {
        throw error;
      }
      console.error('[APORTACIONES_FONDOS] Error en obtenerAportacionesIndividuales:', error);
      throw new AportacionFondoDomainError(
        AportacionFondoErrorMessages[AportacionFondoError.ERROR_CALCULO_APORTACION],
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  async obtenerAportacionesCompletas(
    claveOrganica0: string,
    claveOrganica1: string
  ): Promise<AportacionCompleta> {
    try {
      // OPTIMIZED: Get records once and calculate all fund types (with nombre)
      const registros = await this.obtenerOrgPersonalConNombre(claveOrganica0, claveOrganica1);

      if (registros.length === 0) {
        throw new AportacionFondoDomainError(
          AportacionFondoErrorMessages[AportacionFondoError.DATOS_NO_ENCONTRADOS],
          AportacionFondoError.DATOS_NO_ENCONTRADOS
        );
      }

      // Construir resultado completo
      const resultado: AportacionCompleta = {
        clave_organica_0: claveOrganica0,
        clave_organica_1: claveOrganica1,
        resumen_general: {
          total_empleados: registros.length,
          total_contribucion_general: 0,
          total_sueldo_base_general: 0,
          fondos_incluidos: []
        }
      };

      // Calcular aportaciones para todos los tipos desde los mismos datos
      const tiposFondo: TipoFondo[] = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
      
      for (const tipo of tiposFondo) {
        try {
          const datos = await this.calcularAportaciones(registros, tipo);
          
          // Calcular resumen para este tipo
          const resumen = {
            total_empleados: datos.length,
            total_contribucion: datos.reduce((sum, item) => sum + item.total, 0),
            total_sueldo_base: datos.reduce((sum, item) => sum + item.sueldo_base, 0)
          };

          // Agregar al resultado
          const resultadoTipo = {
            tipo,
            clave_organica_0: claveOrganica0,
            clave_organica_1: claveOrganica1,
            datos,
            resumen
          };

          // Asignar al resultado según el tipo
          switch (tipo) {
            case 'ahorro':
              resultado.ahorro = resultadoTipo;
              break;
            case 'vivienda':
              resultado.vivienda = resultadoTipo;
              break;
            case 'prestaciones':
              resultado.prestaciones = resultadoTipo;
              break;
            case 'cair':
              resultado.cair = resultadoTipo;
              break;
          }

          // Actualizar resumen general
          resultado.resumen_general.total_contribucion_general += resumen.total_contribucion;
          resultado.resumen_general.total_sueldo_base_general += resumen.total_sueldo_base;
          resultado.resumen_general.fondos_incluidos.push(tipo);

        } catch (error) {
          console.warn(`[APORTACIONES_FONDOS] Error calculando tipo ${tipo}:`, error instanceof Error ? error.message : String(error));
          // Continue with other types even if one fails
        }
      }

      return resultado;
    } catch (error) {
      if (error instanceof AportacionFondoDomainError) {
        throw error;
      }
      console.error('[APORTACIONES_FONDOS] Error en obtenerAportacionesCompletas:', error);
      throw new AportacionFondoDomainError(
        AportacionFondoErrorMessages[AportacionFondoError.ERROR_CALCULO_APORTACION],
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  validarAccesoClavesOrganicas(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string
  ): { clave0: string; clave1: string } {
    // Si es entidad (isEntidad = 1), usar solo las claves del token del usuario
    if (isEntidad) {
      return {
        clave0: userClave0,
        clave1: userClave1
      };
    }

    // Si no es entidad (isEntidad = 0), validar que se proporcionen las claves
    if (!claveOrganica0 || !claveOrganica1) {
      throw new AportacionFondoDomainError(
        AportacionFondoErrorMessages[AportacionFondoError.CLAVE_ORGANICA_REQUERIDA],
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    return {
      clave0: claveOrganica0,
      clave1: claveOrganica1
    };
  }

  /**
   * Obtiene el período de aplicación desde BitacoraAfectacionOrg
   * Formato: Quincena (2 dígitos) + Año (2 últimos dígitos)
   * Ejemplo: '0125' (quincena 01, año 2025)
   */
  async obtenerPeriodoAplicacion(org0: string, org1: string): Promise<string> {
    const logContext = { org0, org1 };
    
    try {
      // Validar parámetros de entrada
      if (!org0 || org0.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 0 es requerida para obtener el período',
          AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
        );
      }

      if (!org1 || org1.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 1 es requerida para obtener el período',
          AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
        );
      }

      if (org0.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 0 inválida: "${org0}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }

      if (org1.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 1 inválida: "${org1}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }

      console.log('[APORTACIONES_FONDOS] [PERIODO] Consultando BitacoraAfectacionOrg', logContext);
      const p = await getPool();
      
      const result = await p.request()
        .input('Org0', sql.Char(2), org0)
        .input('Org1', sql.Char(2), org1)
        .query(`
          SELECT TOP 1 Quincena, Anio, CreatedAt
          FROM afec.BitacoraAfectacionOrg
          WHERE Org0 = @Org0
            AND Org1 = @Org1
            AND Accion = 'APLICAR'
          ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        console.warn('[APORTACIONES_FONDOS] [PERIODO] No se encontró período de aplicación', logContext);
        throw new AportacionFondoDomainError(
          `No se encontró período de aplicación para las claves orgánicas ${org0}/${org1}. Verifique que exista un registro con Accion='APLICAR' en BitacoraAfectacionOrg`,
          AportacionFondoError.PERIODO_NO_ENCONTRADO
        );
      }

      const registro = result.recordset[0];
      const quincena = registro.Quincena;
      const anio = registro.Anio;
      const createdAt = registro.CreatedAt;

      // Validar que quincena y año sean válidos
      if (!quincena || quincena < 1 || quincena > 24) {
        throw new AportacionFondoDomainError(
          `Quincena inválida: ${quincena}. Debe estar entre 1 y 24`,
          AportacionFondoError.PARAMETRO_INVALIDO
        );
      }

      if (!anio || anio < 2000 || anio > 2100) {
        throw new AportacionFondoDomainError(
          `Año inválido: ${anio}. Debe estar entre 2000 y 2100`,
          AportacionFondoError.PARAMETRO_INVALIDO
        );
      }

      // Formatear: quincena (2 dígitos) + año (2 últimos dígitos)
      const quincenaStr = String(quincena).padStart(2, '0');
      const anioStr = String(anio).slice(-2);
      const periodo = quincenaStr + anioStr;

      console.log('[APORTACIONES_FONDOS] [PERIODO] Período obtenido exitosamente', {
        ...logContext,
        periodo,
        quincena,
        anio,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null
      });
      
      return periodo;
    } catch (error) {
      if (error instanceof AportacionFondoDomainError) {
        throw error;
      }
      console.error('[APORTACIONES_FONDOS] [PERIODO] Error al obtener período de aplicación', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new AportacionFondoDomainError(
        `Error al obtener el período de aplicación para ${org0}/${org1}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  /**
   * Obtiene préstamos ejecutando el procedimiento almacenado AP_S_PCP en Firebird
   */
  async obtenerPrestamos(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): Promise<Prestamo[]> {
    const logContext = {
      claveOrganica0,
      claveOrganica1,
      periodo,
      procedimiento: 'AP_S_PCP'
    };

    // Validar parámetros de entrada
    this.validarParametrosPrestamos(claveOrganica0, claveOrganica1, periodo);

    const startTime = Date.now();
    
    console.log('[APORTACIONES_FONDOS] [AP_S_PCP] Iniciando consulta serializada', logContext);
    
    // Ejecutar procedimiento almacenado AP_S_PCP de forma serializada
    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C, 
        p.FECHA_C, 
        p.CAPITAL, 
        p.INTERES, 
        p.MONTO, 
        p.MORATORIOS, 
        p.TOTAL, 
        p.RESULTADO, 
        p.TD, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3
      FROM AP_S_PCP(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<Prestamo[]>((resolve, reject) => {
        console.log('[APORTACIONES_FONDOS] [AP_S_PCP] Ejecutando procedimiento almacenado', logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [AP_S_PCP] Conexión Firebird inválida', logContext);
          reject(new AportacionFondoDomainError(
            'Conexión a Firebird no disponible o inválida',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        try {
          db.query(
            sql,
            [claveOrganica0, claveOrganica1, periodo],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                console.error('[APORTACIONES_FONDOS] [AP_S_PCP] Error ejecutando procedimiento', {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar procedimiento AP_S_PCP con parámetros PORG0=${claveOrganica0}, PORG1=${claveOrganica1}, PPERIODO=${periodo}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

            if (!result) {
              console.warn('[APORTACIONES_FONDOS] [AP_S_PCP] Resultado nulo recibido', { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            if (result.length === 0) {
              console.log('[APORTACIONES_FONDOS] [AP_S_PCP] No se encontraron préstamos', { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            // Mapear resultados a entidad Prestamo
            console.log('[APORTACIONES_FONDOS] [AP_S_PCP] Mapeando resultados', { ...logContext, totalRegistros: result.length });
            const prestamos: Prestamo[] = result.map((row: any, index: number) => {
              try {
                return {
                  interno: row.INTERNO || 0,
                  rfc: row.RFC || null,
                  nombre: row.NOMBRE || null,
                  prestamo: row.PRESTAMO || null,
                  letra: row.LETRA || null,
                  plazo: row.PLAZO || null,
                  periodo_c: row.PERIODO_C || null,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  capital: row.CAPITAL || null,
                  interes: row.INTERES || null,
                  monto: row.MONTO || null,
                  moratorios: row.MORATORIOS || null,
                  total: row.TOTAL || null,
                  resultado: row.RESULTADO || null,
                  td: row.TD || null,
                  org0: row.ORG0 || null,
                  org1: row.ORG1 || null,
                  org2: row.ORG2 || null,
                  org3: row.ORG3 || null,
                  norg0: row.NORG0 || null,
                  norg1: row.NORG1 || null,
                  norg2: row.NORG2 || null,
                  norg3: row.NORG3 || null
                };
              } catch (mapError) {
                console.warn('[APORTACIONES_FONDOS] [AP_S_PCP] Error mapeando registro', {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                return null;
              }
            }).filter((p: Prestamo | null): p is Prestamo => p !== null);

            console.log('[APORTACIONES_FONDOS] [AP_S_PCP] Consulta completada exitosamente', {
              ...logContext,
              totalPrestamos: prestamos.length,
              duracionMs: duration
            });
            
            resolve(prestamos);
          }
        );
        } catch (syncError: any) {
          const duration = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [AP_S_PCP] Error síncrono ejecutando procedimiento', {
            ...logContext,
            error: syncError.message || String(syncError),
            errorName: syncError.name,
            stack: syncError.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error síncrono al ejecutar procedimiento AP_S_PCP: ${syncError.message || String(syncError)}`,
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
        }
      });
    }).catch((error) => {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [AP_S_PCP] Error en obtenerPrestamos', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duracionMs: duration
      });
      throw new AportacionFondoDomainError(
        `Error al obtener préstamos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AportacionFondoError.ERROR_FIREBIRD_CONEXION
      );
    });
  }

  private validarParametrosPrestamos(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): void {
    if (!claveOrganica0 || claveOrganica0.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 0 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!claveOrganica1 || claveOrganica1.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 1 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (claveOrganica0.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 0 inválida: "${claveOrganica0}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (claveOrganica1.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 1 inválida: "${claveOrganica1}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (!periodo || periodo.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Período es requerido',
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    if (periodo.length !== 4) {
      throw new AportacionFondoDomainError(
        `Período inválido: "${periodo}". Debe tener 4 caracteres (quincena 2 dígitos + año 2 dígitos)`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    // Validar que período sea numérico
    if (!/^\d{4}$/.test(periodo)) {
      throw new AportacionFondoDomainError(
        `Período inválido: "${periodo}". Debe contener solo dígitos`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }
  }

  /**
   * Obtiene préstamos a mediano plazo ejecutando el procedimiento almacenado AP_S_VIV en Firebird
   */
  async obtenerPrestamosMedianoPlazo(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): Promise<PrestamoMedianoPlazo[]> {
    const logContext = {
      claveOrganica0,
      claveOrganica1,
      periodo,
      procedimiento: 'AP_S_VIV'
    };

    // Validar parámetros de entrada
    this.validarParametrosPrestamos(claveOrganica0, claveOrganica1, periodo);

    const startTime = Date.now();
    
    console.log('[APORTACIONES_FONDOS] [AP_S_VIV] Iniciando consulta serializada', logContext);
    
    // Ejecutar procedimiento almacenado AP_S_VIV de forma serializada
    const sql = `
      SELECT 
        p.INTERNO, 
        p.RFC, 
        p.NOMBRE, 
        p.PRESTAMO, 
        p.LETRA, 
        p.PLAZO, 
        p.PERIODO_C, 
        p.FECHA_C, 
        p.CAPITAL, 
        p.MORATORIOS, 
        p.INTERES, 
        p.SEGURO, 
        p.TOTAL, 
        p.RESULTADO, 
        p.CLASE, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.DESC_CLASE, 
        p.DESC_PRESTAMO, 
        p.CLAVE_P, 
        p.NOEMPLE, 
        p.FOLIO, 
        p.ANIO, 
        p.PO, 
        p.FECHA_ORIGEN
      FROM AP_S_VIV(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<PrestamoMedianoPlazo[]>((resolve, reject) => {
        console.log('[APORTACIONES_FONDOS] [AP_S_VIV] Ejecutando procedimiento almacenado', logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [AP_S_VIV] Conexión Firebird inválida', logContext);
          reject(new AportacionFondoDomainError(
            'Conexión a Firebird no disponible o inválida',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        try {
          db.query(
            sql,
            [claveOrganica0, claveOrganica1, periodo],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                console.error('[APORTACIONES_FONDOS] [AP_S_VIV] Error ejecutando procedimiento', {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar procedimiento AP_S_VIV con parámetros PORG0=${claveOrganica0}, PORG1=${claveOrganica1}, PPERIODO=${periodo}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

            if (!result) {
              console.warn('[APORTACIONES_FONDOS] [AP_S_VIV] Resultado nulo recibido', { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            if (result.length === 0) {
              console.log('[APORTACIONES_FONDOS] [AP_S_VIV] No se encontraron préstamos', { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            // Mapear resultados a entidad PrestamoMedianoPlazo
            console.log('[APORTACIONES_FONDOS] [AP_S_VIV] Mapeando resultados', { ...logContext, totalRegistros: result.length });
            const prestamos: PrestamoMedianoPlazo[] = result.map((row: any, index: number) => {
              try {
                return {
                  interno: row.INTERNO || 0,
                  rfc: row.RFC || null,
                  nombre: row.NOMBRE || null,
                  prestamo: row.PRESTAMO || null,
                  letra: row.LETRA || null,
                  plazo: row.PLAZO || null,
                  periodo_c: row.PERIODO_C || null,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  capital: row.CAPITAL || null,
                  moratorios: row.MORATORIOS || null,
                  interes: row.INTERES || null,
                  seguro: row.SEGURO || null,
                  total: row.TOTAL || null,
                  resultado: row.RESULTADO || null,
                  clase: row.CLASE || null,
                  org0: row.ORG0 || null,
                  org1: row.ORG1 || null,
                  org2: row.ORG2 || null,
                  org3: row.ORG3 || null,
                  norg0: row.NORG0 || null,
                  norg1: row.NORG1 || null,
                  norg2: row.NORG2 || null,
                  norg3: row.NORG3 || null,
                  desc_clase: row.DESC_CLASE || null,
                  desc_prestamo: row.DESC_PRESTAMO || null,
                  clave_p: row.CLAVE_P || null,
                  noemple: row.NOEMPLE || null,
                  folio: row.FOLIO || null,
                  anio: row.ANIO || null,
                  po: row.PO || null,
                  fecha_origen: row.FECHA_ORIGEN ? new Date(row.FECHA_ORIGEN) : null
                };
              } catch (mapError) {
                console.warn('[APORTACIONES_FONDOS] [AP_S_VIV] Error mapeando registro', {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                return null;
              }
            }).filter((p: PrestamoMedianoPlazo | null): p is PrestamoMedianoPlazo => p !== null);

            console.log('[APORTACIONES_FONDOS] [AP_S_VIV] Consulta completada exitosamente', {
              ...logContext,
              totalPrestamos: prestamos.length,
              duracionMs: duration
            });
            
            resolve(prestamos);
          }
        );
        } catch (syncError: any) {
          const duration = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [AP_S_VIV] Error síncrono ejecutando procedimiento', {
            ...logContext,
            error: syncError.message || String(syncError),
            errorName: syncError.name,
            stack: syncError.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error síncrono al ejecutar procedimiento AP_S_VIV: ${syncError.message || String(syncError)}`,
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
        }
      });
    }).catch((error) => {
      const duration = Date.now() - startTime;
      console.error('[APORTACIONES_FONDOS] [AP_S_VIV] Error en obtenerPrestamosMedianoPlazo', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duracionMs: duration
      });
      throw new AportacionFondoDomainError(
        `Error al obtener préstamos a mediano plazo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AportacionFondoError.ERROR_FIREBIRD_CONEXION
      );
    });
  }

  /**
   * Obtiene préstamos hipotecarios ejecutando el procedimiento almacenado AP_S_HIP_QNA o AP_S_COMP_QNA en Firebird
   * @param computadoraAntigua Si es true, ejecuta AP_S_COMP_QNA, si es false ejecuta AP_S_HIP_QNA
   */
  async obtenerPrestamosHipotecarios(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string,
    computadoraAntigua: boolean = false
  ): Promise<PrestamoHipotecario[]> {
    const procedimiento = computadoraAntigua ? 'AP_S_COMP_QNA' : 'AP_S_HIP_QNA';
    const logContext = {
      claveOrganica0,
      claveOrganica1,
      periodo,
      computadoraAntigua,
      procedimiento
    };

    // Validar parámetros de entrada
    this.validarParametrosPrestamos(claveOrganica0, claveOrganica1, periodo);
    
    if (typeof computadoraAntigua !== 'boolean') {
      throw new AportacionFondoDomainError(
        `Parámetro computadoraAntigua debe ser un valor booleano, recibido: ${typeof computadoraAntigua}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    const startTime = Date.now();
    
    console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Iniciando consulta serializada`, logContext);
    
    // Ejecutar procedimiento almacenado de forma serializada
    const sql = `
      SELECT 
        p.INTERNO, 
        p.NOMBRE, 
        p.NOEMPLEADO, 
        p.CANTIDAD, 
        p.STATUS, 
        p.REFERENCIA_1, 
        p.REFERENCIA_2, 
        p.CAPITAL_PAGAR, 
        p.INTERES_PAGAR, 
        p.INTERES_DIFERIDO_PAGAR, 
        p.SEGURO_PAGAR, 
        p.MORATORIO_PAGAR, 
        p.PNO_SOLICITUD, 
        p.PANO, 
        p.PCLAVE_CLASE_PRESTAMO, 
        p.PDESCRIPCION, 
        p.RFC, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3, 
        p.PCLAVE_PRESTAMO, 
        p.PRESTAMO_DESC, 
        p.TIPO, 
        p.PERIODO_C, 
        p.DESCTO, 
        p.FECHA_C, 
        p.RESULTADO, 
        p.PO, 
        p.FECHA_ORIGEN, 
        p.PLAZO
      FROM ${procedimiento}(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<PrestamoHipotecario[]>((resolve, reject) => {
        console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Ejecutando procedimiento ${procedimiento}`, logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Conexión Firebird inválida`, logContext);
          reject(new AportacionFondoDomainError(
            'Conexión a Firebird no disponible o inválida',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        try {
          db.query(
            sql,
            [claveOrganica0, claveOrganica1, periodo],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                console.error(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Error ejecutando ${procedimiento}`, {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar procedimiento ${procedimiento} con parámetros ORG_0=${claveOrganica0}, ORG_1=${claveOrganica1}, QUINCENA=${periodo}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

            if (!result) {
              console.warn(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Resultado nulo recibido`, { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            if (result.length === 0) {
              console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] No se encontraron préstamos`, { ...logContext, duracionMs: duration });
              resolve([]);
              return;
            }

            // Mapear resultados a entidad PrestamoHipotecario
            console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Mapeando resultados`, { ...logContext, totalRegistros: result.length });
            const prestamos: PrestamoHipotecario[] = result.map((row: any, index: number) => {
              try {
                return {
                  interno: row.INTERNO || 0,
                  nombre: row.NOMBRE || null,
                  noempleado: row.NOEMPLEADO || null,
                  cantidad: row.CANTIDAD || null,
                  status: row.STATUS || null,
                  referencia_1: row.REFERENCIA_1 || null,
                  referencia_2: row.REFERENCIA_2 || null,
                  capital_pagar: row.CAPITAL_PAGAR || null,
                  interes_pagar: row.INTERES_PAGAR || null,
                  interes_diferido_pagar: row.INTERES_DIFERIDO_PAGAR || null,
                  seguro_pagar: row.SEGURO_PAGAR || null,
                  moratorio_pagar: row.MORATORIO_PAGAR || null,
                  pno_solicitud: row.PNO_SOLICITUD || null,
                  pano: row.PANO || null,
                  pclave_clase_prestamo: row.PCLAVE_CLASE_PRESTAMO || null,
                  pdescripcion: row.PDESCRIPCION || null,
                  rfc: row.RFC || null,
                  org0: row.ORG0 || null,
                  org1: row.ORG1 || null,
                  org2: row.ORG2 || null,
                  org3: row.ORG3 || null,
                  norg0: row.NORG0 || null,
                  norg1: row.NORG1 || null,
                  norg2: row.NORG2 || null,
                  norg3: row.NORG3 || null,
                  pclave_prestamo: row.PCLAVE_PRESTAMO || null,
                  prestamo_desc: row.PRESTAMO_DESC || null,
                  tipo: row.TIPO || null,
                  periodo_c: row.PERIODO_C || null,
                  descto: row.DESCTO || null,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  resultado: row.RESULTADO || null,
                  po: row.PO || null,
                  fecha_origen: row.FECHA_ORIGEN ? new Date(row.FECHA_ORIGEN) : null,
                  plazo: row.PLAZO || null
                };
              } catch (mapError) {
                console.warn(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Error mapeando registro`, {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                return null;
              }
            }).filter((p: PrestamoHipotecario | null): p is PrestamoHipotecario => p !== null);

            console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Consulta completada exitosamente`, {
              ...logContext,
              totalPrestamos: prestamos.length,
              duracionMs: duration
            });
            
            resolve(prestamos);
          }
        );
        } catch (syncError: any) {
          const duration = Date.now() - startTime;
          console.error(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Error síncrono ejecutando procedimiento`, {
            ...logContext,
            error: syncError.message || String(syncError),
            errorName: syncError.name,
            stack: syncError.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error síncrono al ejecutar procedimiento ${procedimiento}: ${syncError.message || String(syncError)}`,
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
        }
      });
    }).catch((error) => {
      const duration = Date.now() - startTime;
      console.error(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Error en obtenerPrestamosHipotecarios`, {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duracionMs: duration
      });
      throw new AportacionFondoDomainError(
        `Error al obtener préstamos hipotecarios: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AportacionFondoError.ERROR_FIREBIRD_CONEXION
      );
    });
  }

  /**
   * Obtiene registros de ORG_PERSONAL con nombre de PERSONAL
   */
  private async obtenerOrgPersonalConNombre(
    claveOrganica0: string,
    claveOrganica1: string
  ): Promise<any[]> {
    const sql = `
      SELECT
        o.INTERNO,
        o.CLAVE_ORGANICA_0,
        o.CLAVE_ORGANICA_1,
        o.CLAVE_ORGANICA_2,
        o.CLAVE_ORGANICA_3,
        o.SUELDO,
        o.OTRAS_PRESTACIONES,
        o.QUINQUENIOS,
        o.ACTIVO,
        o.FECHA_MOV_ALT,
        o.ORGS1,
        o.ORGS2,
        o.ORGS3,
        o.ORGS,
        o.DSUELDO,
        o.DOTRAS_PRESTACIONES,
        o.DQUINQUENIOS,
        o.APLICAR,
        o.BC,
        o.PORCENTAJE,
        COALESCE(p.FULLNAME, p.NOMBRE) AS NOMBRE_EMPLEADO
      FROM ORG_PERSONAL o
      INNER JOIN PERSONAL p ON p.INTERNO = o.INTERNO
      WHERE o.CLAVE_ORGANICA_0 = ? 
        AND o.CLAVE_ORGANICA_1 = ? 
        AND o.ACTIVO = 'A'
      ORDER BY o.INTERNO
    `;

    return executeSerializedQuery((db) => {
      return new Promise<any[]>((resolve, reject) => {
        if (!db || typeof db.query !== 'function') {
          reject(new Error('Firebird connection not available'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Firebird query timeout'));
        }, 30000);

        db.query(sql, [claveOrganica0, claveOrganica1], (err: any, result: any) => {
          clearTimeout(timeoutId);

          if (err) {
            reject(err);
            return;
          }

          if (!result) {
            resolve([]);
            return;
          }

          const records = Array.isArray(result) ? result : [];
          
          // Debug: verificar estructura del primer resultado
          if (records.length > 0) {
            console.log('[APORTACIONES_FONDOS] [DEBUG] Primer row keys:', Object.keys(records[0]));
            console.log('[APORTACIONES_FONDOS] [DEBUG] Primer row completo:', JSON.stringify(records[0], null, 2));
          }
          
          const mappedRecords = records.map((row: any, index: number) => {
            // Firebird retorna columnas en mayúsculas
            // Usar el alias NOMBRE_EMPLEADO que creamos en la consulta SQL
            let nombreValue = null;
            
            // Intentar NOMBRE_EMPLEADO (el alias que creamos)
            if (row.NOMBRE_EMPLEADO !== undefined && row.NOMBRE_EMPLEADO !== null && String(row.NOMBRE_EMPLEADO).trim() !== '') {
              nombreValue = String(row.NOMBRE_EMPLEADO).trim();
            }
            // Fallback a otras variantes
            else if (row.nombre_empleado !== undefined && row.nombre_empleado !== null && String(row.nombre_empleado).trim() !== '') {
              nombreValue = String(row.nombre_empleado).trim();
            }
            // Intentar FULLNAME como fallback
            else if (row.FULLNAME !== undefined && row.FULLNAME !== null && String(row.FULLNAME).trim() !== '') {
              nombreValue = String(row.FULLNAME).trim();
            }
            // Intentar NOMBRE como último fallback
            else if (row.NOMBRE !== undefined && row.NOMBRE !== null && String(row.NOMBRE).trim() !== '') {
              nombreValue = String(row.NOMBRE).trim();
            }
            
            // Debug para el primer registro
            if (index === 0) {
              console.log('[APORTACIONES_FONDOS] [DEBUG] Row keys:', Object.keys(row));
              console.log('[APORTACIONES_FONDOS] [DEBUG] Row.NOMBRE_EMPLEADO:', row.NOMBRE_EMPLEADO, 'type:', typeof row.NOMBRE_EMPLEADO);
              console.log('[APORTACIONES_FONDOS] [DEBUG] Row.FULLNAME:', row.FULLNAME, 'type:', typeof row.FULLNAME);
              console.log('[APORTACIONES_FONDOS] [DEBUG] Row.NOMBRE:', row.NOMBRE, 'type:', typeof row.NOMBRE);
              console.log('[APORTACIONES_FONDOS] [DEBUG] Nombre final seleccionado:', nombreValue);
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
              porcentaje: row.PORCENTAJE || row.porcentaje || null,
              nombre: nombreValue || null
            };
          });
          
          // Debug log final
          if (mappedRecords.length > 0) {
            console.log('[APORTACIONES_FONDOS] [DEBUG] Primer registro mapeado:', {
              interno: mappedRecords[0].interno,
              nombre: mappedRecords[0].nombre,
              tieneNombre: !!mappedRecords[0].nombre
            });
          }

          resolve(mappedRecords);
        });
      });
    });
  }

  private async calcularAportaciones(registros: any[], tipo: TipoFondo): Promise<AportacionFondo[]> {
    return registros.map(registro => {
      const sueldo = registro.sueldo || 0;
      const otrasPrestaciones = registro.otras_prestaciones || 0;
      const quinquenios = registro.quinquenios || 0;
      
      // Calcular sueldo base (misma para todos los tipos)
      const sueldoBase = ((sueldo + otrasPrestaciones + quinquenios) / 30) * 15;

      // Debug: verificar que el nombre esté presente
      const nombre = registro.nombre || null;
      
      // Debug detallado para el primer registro
      if (registros.indexOf(registro) === 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] calcularAportaciones - Primer registro:', {
          interno: registro.interno,
          nombre: registro.nombre,
          tieneNombre: !!registro.nombre,
          tipoNombre: typeof registro.nombre,
          todasLasPropiedades: Object.keys(registro)
        });
      }
      
      if (!nombre && registro.interno) {
        console.warn(`[APORTACIONES_FONDOS] [DEBUG] Registro sin nombre para interno: ${registro.interno}`);
      }

      // Calcular aportaciones según el tipo
      const aportacion: AportacionFondo = {
        interno: registro.interno,
        nombre: nombre,
        sueldo: registro.sueldo,
        quinquenios: registro.quinquenios,
        otras_prestaciones: registro.otras_prestaciones,
        sueldo_base: sueldoBase,
        total: 0, // Initialize total
        tipo
      };
      
      // Debug: verificar que el nombre se asignó correctamente
      if (registros.indexOf(registro) === 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Aportacion creada:', {
          interno: aportacion.interno,
          nombre: aportacion.nombre,
          tieneNombre: !!aportacion.nombre,
          objetoCompleto: aportacion
        });
      }

      switch (tipo) {
        case 'ahorro':
          aportacion.afae = ((sueldo / 30) * 15) * 0.0250; // Patron contribution
          aportacion.afaa = ((sueldo / 30) * 15) * 0.050;  // Employee contribution
          aportacion.total = (aportacion.afae || 0) + (aportacion.afaa || 0);
          break;
        
        case 'vivienda':
          aportacion.afe = ((sueldo / 30) * 15) * 0.0175; // Patron contribution
          aportacion.total = aportacion.afe || 0;
          break;
        
        case 'prestaciones':
          aportacion.afpe = ((sueldoBase) * 0.2225); // Patron contribution
          aportacion.afpa = ((sueldoBase) * 0.0450); // Employee contribution
          aportacion.total = (aportacion.afpe || 0) + (aportacion.afpa || 0);
          break;
        
        case 'cair':
          aportacion.afe = ((sueldo / 30) * 15) * 0.020; // Patron contribution
          aportacion.total = aportacion.afe || 0;
          break;
      }

      return aportacion;
    });
  }

  /**
   * Obtiene quincena y año desde BitacoraAfectacionOrg
   */
  async obtenerQuincenaYAnio(org0: string, org1: string): Promise<{ quincena: number; anio: number }> {
    const logContext = { org0, org1 };
    
    try {
      // Validar parámetros de entrada
      if (!org0 || org0.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 0 es requerida para obtener quincena y año',
          AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
        );
      }

      if (!org1 || org1.trim().length === 0) {
        throw new AportacionFondoDomainError(
          'Clave orgánica 1 es requerida para obtener quincena y año',
          AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
        );
      }

      if (org0.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 0 inválida: "${org0}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }

      if (org1.length > 2) {
        throw new AportacionFondoDomainError(
          `Clave orgánica 1 inválida: "${org1}". Debe tener máximo 2 caracteres`,
          AportacionFondoError.CLAVE_ORGANICA_INVALIDA
        );
      }

      console.log('[APORTACIONES_FONDOS] [QUINCENA_ANIO] Consultando BitacoraAfectacionOrg', logContext);
      const p = await getPool();
      
      const result = await p.request()
        .input('Org0', sql.Char(2), org0)
        .input('Org1', sql.Char(2), org1)
        .query(`
          SELECT TOP 1 Quincena, Anio, CreatedAt
          FROM afec.BitacoraAfectacionOrg
          WHERE Org0 = @Org0
            AND Org1 = @Org1
            AND Accion = 'APLICAR'
          ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        console.warn('[APORTACIONES_FONDOS] [QUINCENA_ANIO] No se encontró registro en BitacoraAfectacionOrg', logContext);
        throw new AportacionFondoDomainError(
          `No se encontró registro con Accion='APLICAR' para las claves orgánicas ${org0}/${org1} en BitacoraAfectacionOrg`,
          AportacionFondoError.PERIODO_NO_ENCONTRADO
        );
      }

      const registro = result.recordset[0];
      const quincena = registro.Quincena;
      const anio = registro.Anio;

      // Validar que quincena y año sean válidos
      if (!quincena || quincena < 1 || quincena > 24) {
        throw new AportacionFondoDomainError(
          `Quincena inválida: ${quincena}. Debe estar entre 1 y 24`,
          AportacionFondoError.PARAMETRO_INVALIDO
        );
      }

      if (!anio || anio < 2000 || anio > 2100) {
        throw new AportacionFondoDomainError(
          `Año inválido: ${anio}. Debe estar entre 2000 y 2100`,
          AportacionFondoError.PARAMETRO_INVALIDO
        );
      }

      console.log('[APORTACIONES_FONDOS] [QUINCENA_ANIO] Quincena y año obtenidos exitosamente', {
        ...logContext,
        quincena,
        anio
      });
      
      return { quincena, anio };
    } catch (error) {
      if (error instanceof AportacionFondoDomainError) {
        throw error;
      }
      console.error('[APORTACIONES_FONDOS] [QUINCENA_ANIO] Error al obtener quincena y año', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new AportacionFondoDomainError(
        `Error al obtener quincena y año para ${org0}/${org1}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }
  }

  /**
   * Obtiene aportación guarderías ejecutando la función EBI2_RECIBOS_IMPRIMIR en Firebird
   */
  async obtenerAportacionGuarderias(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<AportacionGuarderia[]> {
    const logContext = {
      org0,
      org1,
      periodo,
      funcion: 'EBI2_RECIBOS_IMPRIMIR'
    };

    // Validar parámetros de entrada
    if (!org0 || org0.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 0 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!org1 || org1.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 1 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!periodo || periodo.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Período es requerido',
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    if (org0.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 0 inválida: "${org0}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (org1.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 1 inválida: "${org1}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    const startTime = Date.now();
    
    console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Iniciando consulta serializada', logContext);
    
    // Ejecutar función EBI2_RECIBOS_IMPRIMIR de forma serializada
    const sql = `
      SELECT 
        p.TITULAR_NOMBRE, 
        p.TITULAR_NO_EMPLEADO, 
        p.TITULAR_MONTO, 
        p.TITULAR_RFC,
        p.TITULAR_MONTO_TEXTO, 
        p.TITULAR_ORG0, 
        p.TITULAR_ORG0_NOMBRE,
        p.TITULAR_ORG1, 
        p.TITULAR_ORG1_NOMBRE, 
        p.TITULAR_ORG2,
        p.TITULAR_ORG2_NOMBRE, 
        p.TITULAR_ORG3, 
        p.TITULAR_ORG3_NOMBRE,
        p.ENTIDAD_MONTO, 
        p.RECIBO_AJUSTE, 
        p.RECIBO_TOTAL, 
        p.RECIBO_MES_ANO,
        p.RECIBO_FECHA_VENC, 
        p.RECIBO_FOLIO, 
        p.MENOR_ID, 
        p.MENOR_NOMBRE,
        p.MENOR_RFC, 
        p.MENOR_NIVEL, 
        p.MENOR_SALA, 
        p.ESTATUS
      FROM EBI2_RECIBOS_IMPRIMIR(?) p
      WHERE p.TITULAR_ORG0 = ? AND p.TITULAR_ORG1 = ?
    `;

    return executeSerializedQuery((db) => {
      return new Promise<AportacionGuarderia[]>((resolve, reject) => {
        console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Ejecutando función', logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Conexión Firebird inválida', logContext);
          reject(new AportacionFondoDomainError(
            'Conexión a Firebird no disponible o inválida',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodo, org0, org1],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                console.error('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Error ejecutando función', {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar función EBI2_RECIBOS_IMPRIMIR con parámetros PERIODO=${periodo}, ORG0=${org0}, ORG1=${org1}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

              if (!result) {
                console.warn('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Resultado nulo recibido', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Normalizar resultado a array
              const resultArray = Array.isArray(result) ? result : (result ? [result] : []);

              if (resultArray.length === 0) {
                console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] No se encontraron aportaciones', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Mapear resultados a entidad AportacionGuarderia
              const aportaciones: AportacionGuarderia[] = resultArray.map((row: any) => ({
                titular_nombre: row.TITULAR_NOMBRE || null,
                titular_no_empleado: row.TITULAR_NO_EMPLEADO || null,
                titular_monto: row.TITULAR_MONTO !== null && row.TITULAR_MONTO !== undefined ? Number(row.TITULAR_MONTO) : null,
                titular_rfc: row.TITULAR_RFC || null,
                titular_monto_texto: row.TITULAR_MONTO_TEXTO || null,
                titular_org0: row.TITULAR_ORG0 || null,
                titular_org0_nombre: row.TITULAR_ORG0_NOMBRE || null,
                titular_org1: row.TITULAR_ORG1 || null,
                titular_org1_nombre: row.TITULAR_ORG1_NOMBRE || null,
                titular_org2: row.TITULAR_ORG2 || null,
                titular_org2_nombre: row.TITULAR_ORG2_NOMBRE || null,
                titular_org3: row.TITULAR_ORG3 || null,
                titular_org3_nombre: row.TITULAR_ORG3_NOMBRE || null,
                entidad_monto: row.ENTIDAD_MONTO !== null && row.ENTIDAD_MONTO !== undefined ? Number(row.ENTIDAD_MONTO) : null,
                recibo_ajuste: row.RECIBO_AJUSTE !== null && row.RECIBO_AJUSTE !== undefined ? Number(row.RECIBO_AJUSTE) : null,
                recibo_total: row.RECIBO_TOTAL !== null && row.RECIBO_TOTAL !== undefined ? Number(row.RECIBO_TOTAL) : null,
                recibo_mes_ano: row.RECIBO_MES_ANO || null,
                recibo_fecha_venc: row.RECIBO_FECHA_VENC ? new Date(row.RECIBO_FECHA_VENC) : null,
                recibo_folio: row.RECIBO_FOLIO || null,
                menor_id: row.MENOR_ID !== null && row.MENOR_ID !== undefined ? Number(row.MENOR_ID) : null,
                menor_nombre: row.MENOR_NOMBRE || null,
                menor_rfc: row.MENOR_RFC || null,
                menor_nivel: row.MENOR_NIVEL || null,
                menor_sala: row.MENOR_SALA || null,
                estatus: row.ESTATUS || null
              }));

              console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Consulta completada exitosamente', {
                ...logContext,
                totalAportaciones: aportaciones.length,
                duracionMs: duration
              });

              resolve(aportaciones);
            }
          );
        } catch (error: any) {
          const duration = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Error inesperado', {
            ...logContext,
            error: error.message || String(error),
            stack: error.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error inesperado al ejecutar función EBI2_RECIBOS_IMPRIMIR: ${error.message || 'Error desconocido'}`,
            AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
          ));
        }
      });
    });
  }

  /**
   * Obtiene pensión nómina transitorio ejecutando la función PENSION_NOMINA_QNAL_TRANSITORIO en Firebird
   */
  async obtenerPensionNominaTransitorio(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<PensionNominaTransitorio[]> {
    const logContext = {
      org0,
      org1,
      periodo,
      funcion: 'PENSION_NOMINA_QNAL_TRANSITORIO'
    };

    // Validar parámetros de entrada
    if (!org0 || org0.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 0 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!org1 || org1.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 1 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!periodo || periodo.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Período es requerido',
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    if (org0.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 0 inválida: "${org0}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (org1.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 1 inválida: "${org1}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    const startTime = Date.now();
    
    console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Iniciando consulta serializada', logContext);
    
    // Ejecutar función PENSION_NOMINA_QNAL_TRANSITORIO de forma serializada
    const sql = `
      SELECT 
        p.FPENSION, 
        p.INTERNO, 
        p.NOMBRES, 
        p.NONOMBRE, 
        p.RFC, 
        p.NORFC, 
        p.ORG0,
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.SUELDO, 
        p.OPRESTACIONES, 
        p.QUINQUENIOS, 
        p.SDO,
        p.OPREST, 
        p.QUINQ, 
        p.TPENSION, 
        p.TRANSITORIO, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2,
        p.NORG3, 
        p.CCONCEPTO, 
        p.DESCRIPCION, 
        p.IMPORTE, 
        p.DEFUNCION, 
        p.PCP,
        p.PALIMENTICIA, 
        p.RETROACTIVO, 
        p.PAYUDAECON, 
        p.OTROSP1, 
        p.OTROSP2,
        p.OTROSP3, 
        p.OTROSP4, 
        p.OTROSP5, 
        p.TERRENO, 
        p.HIPVIV, 
        p.PRODENTAL, 
        p.OTROD1,
        p.OTROD2, 
        p.OTROD3, 
        p.OTROD4, 
        p.OTROD5, 
        p.OTROD6, 
        p.TPERCEP, 
        p.TDEDUC,
        p.TOTAL, 
        p.FIN, 
        p.INICIO, 
        p.ANIO, 
        p.SIHAY, 
        p.PORCENTAJE, 
        p.SDOPORC,
        p.AYUDPORC, 
        p.QUINQPORC, 
        p.TRANSORG0, 
        p.TRANSORG1, 
        p.TRANSNORG0,
        p.TRANSNORG1
      FROM PENSION_NOMINA_QNAL_TRANSITORIO(?) p
      WHERE p.ORG0 = ? AND p.ORG1 = ?
    `;

    return executeSerializedQuery((db) => {
      return new Promise<PensionNominaTransitorio[]>((resolve, reject) => {
        console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Ejecutando función', logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Conexión Firebird inválida', logContext);
          reject(new AportacionFondoDomainError(
            'Conexión a Firebird no disponible o inválida',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        try {
          db.query(
            sql,
            [periodo, org0, org1],
            (err: any, result: any) => {
              const duration = Date.now() - startTime;
              
              if (err) {
                console.error('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Error ejecutando función', {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar función PENSION_NOMINA_QNAL_TRANSITORIO con parámetros PERIODO=${periodo}, ORG0=${org0}, ORG1=${org1}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

              if (!result) {
                console.warn('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Resultado nulo recibido', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Normalizar resultado a array
              const resultArray = Array.isArray(result) ? result : (result ? [result] : []);

              if (resultArray.length === 0) {
                console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] No se encontraron registros', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Mapear resultados a entidad PensionNominaTransitorio
              const registros: PensionNominaTransitorio[] = resultArray.map((row: any) => ({
                fpension: row.FPENSION !== null && row.FPENSION !== undefined ? Number(row.FPENSION) : null,
                interno: row.INTERNO !== null && row.INTERNO !== undefined ? Number(row.INTERNO) : null,
                nombres: row.NOMBRES || null,
                nonombre: row.NONOMBRE || null,
                rfc: row.RFC || null,
                norfc: row.NORFC || null,
                org0: row.ORG0 || null,
                org1: row.ORG1 || null,
                org2: row.ORG2 || null,
                org3: row.ORG3 || null,
                sueldo: row.SUELDO !== null && row.SUELDO !== undefined ? Number(row.SUELDO) : null,
                oprestaciones: row.OPRESTACIONES !== null && row.OPRESTACIONES !== undefined ? Number(row.OPRESTACIONES) : null,
                quinquenios: row.QUINQUENIOS !== null && row.QUINQUENIOS !== undefined ? Number(row.QUINQUENIOS) : null,
                sdo: row.SDO !== null && row.SDO !== undefined ? Number(row.SDO) : null,
                oprest: row.OPREST !== null && row.OPREST !== undefined ? Number(row.OPREST) : null,
                quinq: row.QUINQ !== null && row.QUINQ !== undefined ? Number(row.QUINQ) : null,
                tpension: row.TPENSION !== null && row.TPENSION !== undefined ? Number(row.TPENSION) : null,
                transitorio: row.TRANSITORIO !== null && row.TRANSITORIO !== undefined ? Number(row.TRANSITORIO) : null,
                norg0: row.NORG0 || null,
                norg1: row.NORG1 || null,
                norg2: row.NORG2 || null,
                norg3: row.NORG3 || null,
                cconcepto: row.CCONCEPTO || null,
                descripcion: row.DESCRIPCION || null,
                importe: row.IMPORTE !== null && row.IMPORTE !== undefined ? Number(row.IMPORTE) : null,
                defuncion: row.DEFUNCION ? new Date(row.DEFUNCION) : null,
                pcp: row.PCP !== null && row.PCP !== undefined ? Number(row.PCP) : null,
                palimenticia: row.PALIMENTICIA !== null && row.PALIMENTICIA !== undefined ? Number(row.PALIMENTICIA) : null,
                retroactivo: row.RETROACTIVO !== null && row.RETROACTIVO !== undefined ? Number(row.RETROACTIVO) : null,
                payudaecon: row.PAYUDAECON !== null && row.PAYUDAECON !== undefined ? Number(row.PAYUDAECON) : null,
                otrosp1: row.OTROSP1 !== null && row.OTROSP1 !== undefined ? Number(row.OTROSP1) : null,
                otrosp2: row.OTROSP2 !== null && row.OTROSP2 !== undefined ? Number(row.OTROSP2) : null,
                otrosp3: row.OTROSP3 !== null && row.OTROSP3 !== undefined ? Number(row.OTROSP3) : null,
                otrosp4: row.OTROSP4 !== null && row.OTROSP4 !== undefined ? Number(row.OTROSP4) : null,
                otrosp5: row.OTROSP5 !== null && row.OTROSP5 !== undefined ? Number(row.OTROSP5) : null,
                terreno: row.TERRENO !== null && row.TERRENO !== undefined ? Number(row.TERRENO) : null,
                hipviv: row.HIPVIV !== null && row.HIPVIV !== undefined ? Number(row.HIPVIV) : null,
                prodental: row.PRODENTAL !== null && row.PRODENTAL !== undefined ? Number(row.PRODENTAL) : null,
                otrod1: row.OTROD1 !== null && row.OTROD1 !== undefined ? Number(row.OTROD1) : null,
                otrod2: row.OTROD2 !== null && row.OTROD2 !== undefined ? Number(row.OTROD2) : null,
                otrod3: row.OTROD3 !== null && row.OTROD3 !== undefined ? Number(row.OTROD3) : null,
                otrod4: row.OTROD4 !== null && row.OTROD4 !== undefined ? Number(row.OTROD4) : null,
                otrod5: row.OTROD5 !== null && row.OTROD5 !== undefined ? Number(row.OTROD5) : null,
                otrod6: row.OTROD6 !== null && row.OTROD6 !== undefined ? Number(row.OTROD6) : null,
                tpercep: row.TPERCEP !== null && row.TPERCEP !== undefined ? Number(row.TPERCEP) : null,
                tdeduc: row.TDEDUC !== null && row.TDEDUC !== undefined ? Number(row.TDEDUC) : null,
                total: row.TOTAL !== null && row.TOTAL !== undefined ? Number(row.TOTAL) : null,
                fin: row.FIN ? new Date(row.FIN) : null,
                inicio: row.INICIO ? new Date(row.INICIO) : null,
                anio: row.ANIO !== null && row.ANIO !== undefined ? Number(row.ANIO) : null,
                sihay: row.SIHAY || null,
                porcentaje: row.PORCENTAJE !== null && row.PORCENTAJE !== undefined ? Number(row.PORCENTAJE) : null,
                sdoporc: row.SDOPORC !== null && row.SDOPORC !== undefined ? Number(row.SDOPORC) : null,
                ayudporc: row.AYUDPORC !== null && row.AYUDPORC !== undefined ? Number(row.AYUDPORC) : null,
                quinqporc: row.QUINQPORC !== null && row.QUINQPORC !== undefined ? Number(row.QUINQPORC) : null,
                transorg0: row.TRANSORG0 || null,
                transorg1: row.TRANSORG1 || null,
                transnorg0: row.TRANSNORG0 || null,
                transnorg1: row.TRANSNORG1 || null
              }));

              console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Consulta completada exitosamente', {
                ...logContext,
                totalRegistros: registros.length,
                duracionMs: duration
              });

              resolve(registros);
            }
          );
        } catch (error: any) {
          const duration = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Error inesperado', {
            ...logContext,
            error: error.message || String(error),
            stack: error.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error inesperado al ejecutar función PENSION_NOMINA_QNAL_TRANSITORIO: ${error.message || 'Error desconocido'}`,
            AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
          ));
        }
      });
    });
  }
}