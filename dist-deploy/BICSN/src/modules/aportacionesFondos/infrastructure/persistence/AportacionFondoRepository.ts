import {
  IAportacionFondoRepository,
  NumerosEmpleadoLookup
} from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionIndividual, AportacionCompleta, TipoFondo, AportacionFondo } from '../../domain/entities/AportacionFondo.js';
import { Prestamo } from '../../domain/entities/Prestamo.js';
import { PrestamoMedianoPlazo } from '../../domain/entities/PrestamoMedianoPlazo.js';
import { PrestamoHipotecario } from '../../domain/entities/PrestamoHipotecario.js';
import { AportacionGuarderia } from '../../domain/entities/AportacionGuarderia.js';
import { PensionNominaTransitorio } from '../../domain/entities/PensionNominaTransitorio.js';
import { Aguinaldo } from '../../domain/entities/Aguinaldo.js';
import { AportacionFondoDomainError, AportacionFondoError, AportacionFondoErrorMessages } from '../../domain/errors.js';
import { getOrgPersonalByClavesOrganicas } from '../../../orgPersonal/infrastructure/persistence/OrgPersonalRepository.js';
import { getPool, sql } from '../../../../db/mssql.js';
import { executeSerializedQuery, decodeFirebirdObject, executeSelectableProcedure, FIREBIRD_TIMEOUTS } from '../../../../db/firebird.js';
import { normalizeTextDeep } from '../../../../utils/encoding.js';

type NominaAportacionInfo = {
  dias: number;
  origen: 'nomina' | 'default';
  baseCotizacionQuinquenios: number | null;
};

const MONEY_SCALE = 1_000_000;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

function sumMoney(values: number[]): number {
  return values.reduce((sum, value) => sum + Math.round(value * MONEY_SCALE), 0) / MONEY_SCALE;
}

export class AportacionFondoRepository implements IAportacionFondoRepository {
  private readonly DIAS_LABORADOS_DEFAULT = 15;

  /**
   * Convierte un valor a número de forma segura, evitando NaN.
   * Si el valor no es convertible a número válido, retorna null.
   */
  private safeNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    // Si ya es un número válido, retornarlo directamente
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    // Si es string, verificar que no sea "NaN" o vacío
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'nan') {
        return null;
      }
    }
    // Intentar convertir
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  async obtenerAportacionesIndividuales(
    tipo: TipoFondo,
    claveOrganica0: string,
    claveOrganica1: string,
    usarDiasLaboradosNomina = false,
    periodo?: string
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

      // Debug (solo LOG_LEVEL=debug): verificar que los registros tengan nombre
      if (process.env.LOG_LEVEL === 'debug' && registros.length > 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Primer registro antes de calcularAportaciones:', {
          interno: registros[0].interno,
          nombre: registros[0].nombre,
          tieneNombre: !!registros[0].nombre
        });
      }

      // Calcular aportaciones según el tipo
      const periodoInfo = usarDiasLaboradosNomina && !periodo ? await this.obtenerPeriodoAplicacion(claveOrganica0, claveOrganica1) : null;
      const datos = await this.calcularAportaciones(
        registros,
        tipo,
        usarDiasLaboradosNomina,
        periodo || periodoInfo?.periodo,
        claveOrganica0,
        claveOrganica1
      );

      // Debug (solo LOG_LEVEL=debug): verificar que los datos tengan nombre después del cálculo
      if (process.env.LOG_LEVEL === 'debug' && datos.length > 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Primer dato después de calcularAportaciones:', {
          interno: datos[0].interno,
          nombre: datos[0].nombre,
          tieneNombre: !!datos[0].nombre
        });
      }

      // Calcular resumen
      const resumen = {
        total_empleados: datos.length,
        total_contribucion: sumMoney(datos.map((item) => item.total)),
        total_sueldo_base: sumMoney(datos.map((item) => item.sueldo_base))
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
            total_contribucion: sumMoney(datos.map((item) => item.total)),
            total_sueldo_base: sumMoney(datos.map((item) => item.sueldo_base))
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
  async obtenerPeriodoAplicacion(org0: string, org1: string): Promise<{ periodo: string; accion: string }> {
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
          SELECT TOP 1 Quincena, Anio, CreatedAt, Accion
          FROM afec.BitacoraAfectacionOrg
          WHERE Org0 = @Org0
            AND Org1 = @Org1
            AND (Accion = 'APLICAR' OR Accion = 'TERMINADO')
          ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        console.warn('[APORTACIONES_FONDOS] [PERIODO] No se encontró período de aplicación', logContext);
        throw new AportacionFondoDomainError(
          `No se encontró período de aplicación para las claves orgánicas ${org0}/${org1}. Verifique que exista un registro con Accion='APLICAR' o Accion='TERMINADO' en BitacoraAfectacionOrg`,
          AportacionFondoError.PERIODO_NO_ENCONTRADO
        );
      }

      const registro = result.recordset[0];
      const quincena = registro.Quincena;
      const anio = registro.Anio;
      const createdAt = registro.CreatedAt;
      const accion = registro.Accion;

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
        accion,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null
      });
      
      return { periodo, accion };
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

            // Decodificar resultados de Firebird y normalizar strings (mojibake/UTF-8 mal decodificado)
            const decodedResult = result.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
            
            // Mapear resultados a entidad Prestamo
            console.log('[APORTACIONES_FONDOS] [AP_S_PCP] Mapeando resultados', { ...logContext, totalRegistros: decodedResult.length });
            const prestamos: Prestamo[] = decodedResult.map((row: any, index: number) => {
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

            // Decodificar resultados de Firebird antes de mapear
            const decodedResult = result.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
            
            // Mapear resultados a entidad PrestamoMedianoPlazo
            console.log('[APORTACIONES_FONDOS] [AP_S_VIV] Mapeando resultados', { ...logContext, totalRegistros: decodedResult.length });
            const prestamos: PrestamoMedianoPlazo[] = decodedResult.map((row: any, index: number) => {
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

            // Decodificar resultados de Firebird antes de mapear
            const decodedResult = result.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
            
            // Mapear resultados a entidad PrestamoHipotecario
            console.log(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Mapeando resultados`, { ...logContext, totalRegistros: decodedResult.length });
            const prestamos: PrestamoHipotecario[] = decodedResult.map((row: any, index: number) => {
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
    const startTime = Date.now();
    const logContext = { claveOrganica0, claveOrganica1 };
    
    console.log('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Iniciando consulta', logContext);
    
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
        p.RFC,
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
        console.log('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Dentro de executeSerializedQuery', logContext);
        
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Conexión Firebird no disponible', logContext);
          reject(new Error('Firebird connection not available'));
          return;
        }

        let timeoutTriggered = false;
        const timeoutId = setTimeout(() => {
          timeoutTriggered = true;
          const elapsed = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] TIMEOUT después de 30 segundos', {
            ...logContext,
            elapsedMs: elapsed
          });
          reject(new Error(`Firebird query timeout después de ${elapsed}ms`));
        }, 30000);

        console.log('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Ejecutando query SQL', {
          ...logContext,
          sql: sql.substring(0, 200) + '...'
        });

        db.query(sql, [claveOrganica0, claveOrganica1], (err: any, result: any) => {
          const elapsed = Date.now() - startTime;
          
          if (timeoutTriggered) {
            console.warn('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Callback recibido después del timeout', {
              ...logContext,
              elapsedMs: elapsed
            });
            return; // Ya se rechazó la promesa, no hacer nada más
          }
          
          clearTimeout(timeoutId);

          if (err) {
            console.error('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Error en query', {
              ...logContext,
              error: err.message || String(err),
              errorCode: err.code,
              elapsedMs: elapsed
            });
            reject(err);
            return;
          }

          console.log('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Query completada exitosamente', {
            ...logContext,
            resultLength: result ? (Array.isArray(result) ? result.length : 1) : 0,
            elapsedMs: elapsed
          });

          if (!result) {
            console.warn('[APORTACIONES_FONDOS] [obtenerOrgPersonalConNombre] Resultado nulo', logContext);
            resolve([]);
            return;
          }

          const records = Array.isArray(result) ? result : [];
          
          // Decodificar resultados de Firebird y normalizar strings (mojibake/UTF-8 mal decodificado)
          const decodedRecords = records.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
          
          // Debug (solo LOG_LEVEL=debug): verificar estructura del primer resultado
          if (process.env.LOG_LEVEL === 'debug' && decodedRecords.length > 0) {
            console.log('[APORTACIONES_FONDOS] [DEBUG] Primer row keys:', Object.keys(decodedRecords[0]));
          }
          
          // Helper para convertir fechas de ODBC (pueden venir como Date o string)
          const toIsoString = (v: any): string | null => {
            if (!v) return null;
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'string') return v;
            // Algunos drivers devuelven objetos tipo Timestamp con valueOf/toString
            try {
              const s = String(v);
              return s || null;
            } catch {
              return null;
            }
          };

          const mappedRecords = decodedRecords.map((row: any, index: number) => {
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
            
            // Debug (solo LOG_LEVEL=debug) para el primer registro
            if (process.env.LOG_LEVEL === 'debug' && index === 0) {
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
              fecha_mov_alt: toIsoString(row.FECHA_MOV_ALT || row.fecha_mov_alt),
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
              rfc: row.RFC || row.rfc || null,
              nombre: nombreValue || null
            };
          });
          
          // Debug (solo LOG_LEVEL=debug) log final
          if (process.env.LOG_LEVEL === 'debug' && mappedRecords.length > 0) {
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

  private async calcularAportaciones(
    registros: any[],
    tipo: TipoFondo,
    usarDiasLaboradosNomina = false,
    periodo?: string,
    org0?: string,
    org1?: string
  ): Promise<AportacionFondo[]> {
    const porcentajes = await this.obtenerPorcentajeFondoVigente(tipo);
    const diasMap = usarDiasLaboradosNomina && periodo && org0 && org1
      ? await this.obtenerDiasLaboradosNominaMap(
          registros.map((registro) => registro.rfc).filter(Boolean),
          periodo,
          org0,
          org1
        )
      : new Map<string, NominaAportacionInfo>();

    return registros.map(registro => {
      const sueldo = registro.sueldo || 0;
      const otrasPrestaciones = registro.otras_prestaciones || 0;
      const quinquenios = registro.quinquenios || 0;
      const diasInfo = this.resolveDiasLaborados(registro.rfc, diasMap, usarDiasLaboradosNomina);

      const sueldoProporcional = roundMoney((sueldo / 30) * diasInfo.dias);
      const otrasPrestacionesProporcional = roundMoney((otrasPrestaciones / 30) * diasInfo.dias);
      const quinqueniosAplicado = tipo === 'prestaciones'
        ? roundMoney(diasInfo.baseCotizacionQuinquenios ?? (quinquenios / 2))
        : roundMoney((quinquenios / 30) * diasInfo.dias);
      const sueldoBase = sumMoney([
        sueldoProporcional,
        otrasPrestacionesProporcional,
        quinqueniosAplicado,
      ]);

      // Debug: verificar que el nombre esté presente
      const nombre = registro.nombre || null;
      
      // Debug (solo LOG_LEVEL=debug) para el primer registro
      if (process.env.LOG_LEVEL === 'debug' && registros.indexOf(registro) === 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] calcularAportaciones - Primer registro:', {
          interno: registro.interno,
          nombre: registro.nombre,
          tieneNombre: !!registro.nombre
        });
      }
      
      if (process.env.LOG_LEVEL === 'debug' && !nombre && registro.interno) {
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
        tipo,
        dias_laborados: diasInfo.dias,
        dias_laborados_origen: diasInfo.origen,
        base_cotizacion_quinquenios: diasInfo.baseCotizacionQuinquenios,
        quinquenios_aplicado: tipo === 'prestaciones' ? quinqueniosAplicado : null
      };
      
      // Debug (solo LOG_LEVEL=debug): verificar que el nombre se asignó correctamente
      if (process.env.LOG_LEVEL === 'debug' && registros.indexOf(registro) === 0) {
        console.log('[APORTACIONES_FONDOS] [DEBUG] Aportacion creada:', {
          interno: aportacion.interno,
          nombre: aportacion.nombre,
          tieneNombre: !!aportacion.nombre
        });
      }

      switch (tipo) {
        case 'ahorro':
          aportacion.afae = roundMoney(sueldoProporcional * porcentajes.porcentajePatron);
          aportacion.afaa = roundMoney(
            sueldoProporcional * (porcentajes.porcentajeAfiliado ?? 0),
          );
          aportacion.total = sumMoney([aportacion.afae, aportacion.afaa]);
          break;
        
        case 'vivienda':
          aportacion.afe = roundMoney(sueldoProporcional * porcentajes.porcentajePatron);
          aportacion.total = aportacion.afe;
          break;
        
        case 'prestaciones':
          {
            const porcentajeAfiliado = porcentajes.porcentajeAfiliado ?? 0;
            const basePatron = sumMoney([sueldoProporcional, otrasPrestacionesProporcional]);
            aportacion.afpe = roundMoney(
              (basePatron * porcentajes.porcentajePatron)
                + (quinqueniosAplicado * (porcentajes.porcentajePatron + porcentajeAfiliado)),
            );
            aportacion.afpa = roundMoney(sueldoProporcional * porcentajeAfiliado);
          }
          aportacion.total = sumMoney([aportacion.afpe || 0, aportacion.afpa || 0]);
          break;
        
        case 'cair':
          aportacion.afe = roundMoney(sueldoProporcional * porcentajes.porcentajePatron);
          aportacion.total = aportacion.afe;
          break;
      }

      return aportacion;
    });
  }

  async obtenerNumerosEmpleado(internos: number[], rfcs: string[]): Promise<NumerosEmpleadoLookup> {
    const internosUnicos = [...new Set(internos.filter(Number.isInteger).filter((interno) => interno > 0))];
    const rfcsUnicos = [
      ...new Set(
        rfcs
          .map((rfc) => rfc.trim().toUpperCase())
          .filter(Boolean)
      )
    ];

    if (internosUnicos.length === 0 && rfcsUnicos.length === 0) {
      return { porInterno: {}, porRfc: {} };
    }

    const condiciones: string[] = [];
    const parametros: Array<number | string> = [];

    if (internosUnicos.length > 0) {
      condiciones.push(`p.INTERNO IN (${internosUnicos.map(() => '?').join(', ')})`);
      parametros.push(...internosUnicos);
    }

    if (rfcsUnicos.length > 0) {
      condiciones.push(`UPPER(TRIM(p.RFC)) IN (${rfcsUnicos.map(() => '?').join(', ')})`);
      parametros.push(...rfcsUnicos);
    }

    const query = `
      SELECT p.INTERNO, p.RFC, p.NOEMPLEADO
      FROM PERSONAL p
      WHERE ${condiciones.join(' OR ')}
    `;

    return executeSerializedQuery((db) => new Promise<NumerosEmpleadoLookup>((resolve, reject) => {
      if (!db || typeof db.query !== 'function') {
        reject(new AportacionFondoDomainError(
          'Conexión a Firebird no disponible o inválida',
          AportacionFondoError.ERROR_FIREBIRD_CONEXION
        ));
        return;
      }

      db.query(query, parametros, (error: any, result: any) => {
        if (error) {
          reject(new AportacionFondoDomainError(
            'Error al consultar números de empleado en Firebird',
            AportacionFondoError.ERROR_FIREBIRD_CONEXION
          ));
          return;
        }

        const porInterno: Record<string, string> = {};
        const numerosPorRfc = new Map<string, Set<string>>();
        const rows = Array.isArray(result) ? result : [];

        rows.map((row: any) => decodeFirebirdObject(row)).forEach((row: any) => {
          const noempleado = String(row.NOEMPLEADO ?? '').trim();
          if (!noempleado) return;

          const interno = Number(row.INTERNO);
          if (Number.isInteger(interno) && interno > 0) {
            porInterno[String(interno)] = noempleado;
          }

          const rfc = String(row.RFC ?? '').trim().toUpperCase();
          if (!rfc) return;

          const numeros = numerosPorRfc.get(rfc) ?? new Set<string>();
          numeros.add(noempleado);
          numerosPorRfc.set(rfc, numeros);
        });

        const porRfc: Record<string, string> = {};
        numerosPorRfc.forEach((numeros, rfc) => {
          if (numeros.size === 1) {
            porRfc[rfc] = [...numeros][0];
          }
        });

        resolve({ porInterno, porRfc });
      });
    }));
  }

  private async obtenerPorcentajeFondoVigente(tipo: TipoFondo): Promise<{ porcentajePatron: number; porcentajeAfiliado: number | null }> {
    const pool = await getPool();
    const result = await pool.request()
      .input('tipoFondo', sql.VarChar(30), tipo)
      .query(`
        SELECT TOP 1 PorcentajePatron, PorcentajeAfiliado
        FROM aportaciones.CatalogoPorcentajeFondo
        WHERE TipoFondo = @tipoFondo AND Vigente = 1
        ORDER BY AnioVigencia DESC, CatalogoPorcentajeFondoId DESC
      `);

    const row = result.recordset[0];
    if (!row) {
      throw new Error(`No existe porcentaje vigente para el fondo ${tipo}`);
    }

    return {
      porcentajePatron: Number(row.PorcentajePatron),
      porcentajeAfiliado: row.PorcentajeAfiliado == null ? null : Number(row.PorcentajeAfiliado)
    };
  }

  private resolveDiasLaborados(
    rfc: string | null | undefined,
    diasMap: Map<string, NominaAportacionInfo>,
    usarDiasLaboradosNomina: boolean
  ): NominaAportacionInfo {
    if (!usarDiasLaboradosNomina) {
      return { dias: this.DIAS_LABORADOS_DEFAULT, origen: 'default', baseCotizacionQuinquenios: null };
    }

    const key = this.normalizeRfc(rfc);
    const found = key ? diasMap.get(key) : undefined;
    if (!found || found.dias == null || !Number.isFinite(found.dias) || found.dias <= 0) {
      return { dias: this.DIAS_LABORADOS_DEFAULT, origen: 'default', baseCotizacionQuinquenios: found?.baseCotizacionQuinquenios ?? null };
    }

    return found;
  }

  private async obtenerDiasLaboradosNominaMap(
    rfcs: Array<string | null | undefined>,
    periodo: string,
    org0: string,
    org1: string
  ): Promise<Map<string, NominaAportacionInfo>> {
    const map = new Map<string, NominaAportacionInfo>();
    const uniqueRfcs = [...new Set(rfcs.map((rfc) => this.normalizeRfc(rfc)).filter((rfc): rfc is string => !!rfc))];
    if (uniqueRfcs.length === 0 || !/^\d{4}$/.test(periodo)) {
      return map;
    }

    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));
    if (!Number.isInteger(quincena) || quincena < 1 || quincena > 24) {
      return map;
    }

    const pool = await getPool();
    for (let i = 0; i < uniqueRfcs.length; i += 500) {
      const batch = uniqueRfcs.slice(i, i + 500);
      const request = pool.request()
        .input('anio', sql.SmallInt, anio)
        .input('quincena', sql.TinyInt, quincena)
        .input('org0', sql.VarChar(2), org0)
        .input('org1', sql.VarChar(2), org1);
      const placeholders = batch.map((rfc, index) => {
        const name = `rfc${index}`;
        request.input(name, sql.VarChar(13), rfc);
        return `@${name}`;
      }).join(', ');

      const result = await request.query(`
        SELECT UPPER(LTRIM(RTRIM(RFC))) AS RFC, DiasLaborados, BaseCotizacionQuinquenios
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE Anio = @anio
          AND Quincena = @quincena
          AND Organica0 = @org0
          AND Organica1 = @org1
          AND UPPER(LTRIM(RTRIM(RFC))) IN (${placeholders})
          AND (DiasLaborados IS NOT NULL OR BaseCotizacionQuinquenios IS NOT NULL)
      `);

      for (const row of result.recordset) {
        const key = this.normalizeRfc(row.RFC);
        const dias = this.safeNumber(row.DiasLaborados);
        const baseCotizacionQuinquenios = this.safeNumber(row.BaseCotizacionQuinquenios);
        if (key) {
          map.set(key, {
            dias: dias != null && dias > 0 ? dias : this.DIAS_LABORADOS_DEFAULT,
            origen: dias != null && dias > 0 ? 'nomina' : 'default',
            baseCotizacionQuinquenios
          });
        }
      }
    }

    return map;
  }

  private normalizeRfc(rfc: string | null | undefined): string | null {
    const normalized = String(rfc || '').trim().toUpperCase();
    return normalized || null;
  }

  private async enriquecerConDiasLaborados<T>(
    registros: T[],
    periodo: string,
    org0: string,
    org1: string,
    usarDiasLaboradosNomina: boolean,
    getRfc: (registro: T) => string | null | undefined
  ): Promise<Array<T & { dias_laborados: number; dias_laborados_origen: 'nomina' | 'default' }>> {
    const diasMap = usarDiasLaboradosNomina
      ? await this.obtenerDiasLaboradosNominaMap(registros.map(getRfc), periodo, org0, org1)
      : new Map<string, NominaAportacionInfo>();

    return registros.map((registro) => {
      const dias = this.resolveDiasLaborados(getRfc(registro), diasMap, usarDiasLaboradosNomina);
      return {
        ...registro,
        dias_laborados: dias.dias,
        dias_laborados_origen: dias.origen
      };
    });
  }

  /**
   * Obtiene quincena y año desde BitacoraAfectacionOrg
   */
  async obtenerQuincenaYAnio(org0: string, org1: string): Promise<{ quincena: number; anio: number; accion: string }> {
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
          SELECT TOP 1 Quincena, Anio, CreatedAt, Accion
          FROM afec.BitacoraAfectacionOrg
          WHERE Org0 = @Org0
            AND Org1 = @Org1
            AND (Accion = 'APLICAR' OR Accion = 'TERMINADO')
          ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC
        `);

      if (result.recordset.length === 0) {
        console.warn('[APORTACIONES_FONDOS] [QUINCENA_ANIO] No se encontró registro en BitacoraAfectacionOrg', logContext);
        throw new AportacionFondoDomainError(
          `No se encontró registro con Accion='APLICAR' o Accion='TERMINADO' para las claves orgánicas ${org0}/${org1} en BitacoraAfectacionOrg`,
          AportacionFondoError.PERIODO_NO_ENCONTRADO
        );
      }

      const registro = result.recordset[0];
      const quincena = registro.Quincena;
      const anio = registro.Anio;
      const accion = registro.Accion;

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
        anio,
        accion
      });

      return { quincena, anio, accion };
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
    periodo: string,
    usarDiasLaboradosNomina = false
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

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = resultArray.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
              
              // Mapear resultados a entidad AportacionGuarderia
              const aportaciones: AportacionGuarderia[] = decodedResult.map((row: any) => ({
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
                recibo_folio: row.RECIBO_FOLIO !== null && row.RECIBO_FOLIO !== undefined ? String(row.RECIBO_FOLIO) : null,
                menor_id: row.MENOR_ID !== null && row.MENOR_ID !== undefined ? Number(row.MENOR_ID) : null,
                menor_nombre: row.MENOR_NOMBRE || null,
                menor_rfc: row.MENOR_RFC || null,
                menor_nivel: row.MENOR_NIVEL || null,
                menor_sala: row.MENOR_SALA || null,
                estatus: row.ESTATUS || null
              }));

              this.enriquecerConDiasLaborados(
                aportaciones,
                periodo,
                org0,
                org1,
                usarDiasLaboradosNomina,
                (registro) => registro.titular_rfc
              ).then((aportacionesEnriquecidas) => {
                console.log('[APORTACIONES_FONDOS] [APORTACION_GUARDERIAS] Consulta completada exitosamente', {
                ...logContext,
                totalAportaciones: aportaciones.length,
                duracionMs: duration
                });
                resolve(aportacionesEnriquecidas);
              }).catch(reject);
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
   * Para pensionados: org0='04' y org1='60' son hardcodeados, org2 y org3 vienen del token del usuario
   */
  async obtenerPensionNominaTransitorio(
    org0: string,
    org1: string,
    org2: string,
    org3: string,
    periodo: string,
    usarDiasLaboradosNomina = false
  ): Promise<PensionNominaTransitorio[]> {
    const logContext = {
      org0,
      org1,
      org2,
      org3,
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

    if (!org2 || org2.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 2 es requerida',
        AportacionFondoError.CLAVE_ORGANICA_REQUERIDA
      );
    }

    if (!org3 || org3.trim().length === 0) {
      throw new AportacionFondoDomainError(
        'Clave orgánica 3 es requerida',
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

    if (org2.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 2 inválida: "${org2}". Debe tener máximo 2 caracteres`,
        AportacionFondoError.CLAVE_ORGANICA_INVALIDA
      );
    }

    if (org3.length > 2) {
      throw new AportacionFondoDomainError(
        `Clave orgánica 3 inválida: "${org3}". Debe tener máximo 2 caracteres`,
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
      WHERE p.ORG0 = ? AND p.ORG1 = ? AND p.ORG2 = ? AND p.ORG3 = ?
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
            [periodo, org0, org1, org2, org3],
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
                  `Error al ejecutar función PENSION_NOMINA_QNAL_TRANSITORIO con parámetros PERIODO=${periodo}, ORG0=${org0}, ORG1=${org1}, ORG2=${org2}, ORG3=${org3}: ${err.message || String(err)}`,
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

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = resultArray.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
              
              // Mapear resultados a entidad PensionNominaTransitorio
              const registros: PensionNominaTransitorio[] = decodedResult.map((row: any) => ({
                fpension: this.safeNumber(row.FPENSION),
                interno: this.safeNumber(row.INTERNO),
                nombres: row.NOMBRES || null,
                nonombre: row.NONOMBRE || null,
                rfc: row.RFC || null,
                norfc: row.NORFC || null,
                org0: row.ORG0 || null,
                org1: row.ORG1 || null,
                org2: row.ORG2 || null,
                org3: row.ORG3 || null,
                sueldo: this.safeNumber(row.SUELDO),
                oprestaciones: this.safeNumber(row.OPRESTACIONES),
                quinquenios: this.safeNumber(row.QUINQUENIOS),
                sdo: this.safeNumber(row.SDO),
                oprest: this.safeNumber(row.OPREST),
                quinq: this.safeNumber(row.QUINQ),
                tpension: this.safeNumber(row.TPENSION),
                transitorio: this.safeNumber(row.TRANSITORIO),
                norg0: row.NORG0 || null,
                norg1: row.NORG1 || null,
                norg2: row.NORG2 || null,
                norg3: row.NORG3 || null,
                cconcepto: row.CCONCEPTO || null,
                descripcion: row.DESCRIPCION || null,
                importe: this.safeNumber(row.IMPORTE),
                defuncion: row.DEFUNCION ? new Date(row.DEFUNCION) : null,
                pcp: this.safeNumber(row.PCP),
                palimenticia: this.safeNumber(row.PALIMENTICIA),
                retroactivo: this.safeNumber(row.RETROACTIVO),
                payudaecon: this.safeNumber(row.PAYUDAECON),
                otrosp1: this.safeNumber(row.OTROSP1),
                otrosp2: this.safeNumber(row.OTROSP2),
                otrosp3: this.safeNumber(row.OTROSP3),
                otrosp4: this.safeNumber(row.OTROSP4),
                otrosp5: this.safeNumber(row.OTROSP5),
                terreno: this.safeNumber(row.TERRENO),
                hipviv: this.safeNumber(row.HIPVIV),
                prodental: this.safeNumber(row.PRODENTAL),
                otrod1: this.safeNumber(row.OTROD1),
                otrod2: this.safeNumber(row.OTROD2),
                otrod3: this.safeNumber(row.OTROD3),
                otrod4: this.safeNumber(row.OTROD4),
                otrod5: this.safeNumber(row.OTROD5),
                otrod6: this.safeNumber(row.OTROD6),
                tpercep: this.safeNumber(row.TPERCEP),
                tdeduc: this.safeNumber(row.TDEDUC),
                total: this.safeNumber(row.TOTAL),
                fin: row.FIN ? new Date(row.FIN) : null,
                inicio: row.INICIO ? new Date(row.INICIO) : null,
                anio: this.safeNumber(row.ANIO),
                sihay: row.SIHAY || null,
                porcentaje: this.safeNumber(row.PORCENTAJE),
                sdoporc: this.safeNumber(row.SDOPORC),
                ayudporc: this.safeNumber(row.AYUDPORC),
                quinqporc: this.safeNumber(row.QUINQPORC),
                transorg0: row.TRANSORG0 || null,
                transorg1: row.TRANSORG1 || null,
                transnorg0: row.TRANSNORG0 || null,
                transnorg1: row.TRANSNORG1 || null
              }));

              this.enriquecerConDiasLaborados(
                registros,
                periodo,
                org0,
                org1,
                usarDiasLaboradosNomina,
                (registro) => registro.rfc
              ).then((registrosEnriquecidos) => {
                console.log('[APORTACIONES_FONDOS] [PENSION_NOMINA_TRANSITORIO] Consulta completada exitosamente', {
                  ...logContext,
                  totalRegistros: registros.length,
                  duracionMs: duration
                });
                resolve(registrosEnriquecidos);
              }).catch(reject);
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

  /**
   * Obtiene aguinaldo ejecutando la función AGUINALDO_ORGANICAS en Firebird
   */
  async obtenerAguinaldo(
    org0: string,
    org1: string,
    periodo: string,
    usarDiasLaboradosNomina = false
  ): Promise<Aguinaldo[]> {
    const logContext = {
      org0,
      org1,
      periodo,
      funcion: 'AGUINALDO_ORGANICAS'
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

    if (periodo.length !== 4) {
      throw new AportacionFondoDomainError(
        `Período inválido: "${periodo}". Debe tener 4 caracteres (quincena + año)`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }

    const startTime = Date.now();
    
    console.log('[APORTACIONES_FONDOS] [AGUINALDO] Iniciando consulta serializada', logContext);
    
    // Ejecutar función AGUINALDO_ORGANICAS de forma serializada
    const sql = `
      SELECT 
        p.INTERNO, 
        p.ORG0, 
        p.ORG1, 
        p.ORG2, 
        p.ORG3, 
        p.MOVIMIENTO, 
        p.NOEMPLEADO,
        p.TIPOMOVIMIENTO, 
        p.NOMBRES, 
        p.RFC, 
        p.CURP, 
        p.FECHA, 
        p.DIAS_AGUINALDO,
        p.CUANTOS, 
        p.CUANTOS_ORI, 
        p.NOCONTAR, 
        p.SDO, 
        p.OP, 
        p.Q, 
        p.ACTIVO,
        p.NOM_ACTIVO, 
        p.QNA_A, 
        p.PORCENTAJE_A, 
        p.DIARIO, 
        p.GENERAL, 
        p.PORCENTAJE,
        p.PROPORCION, 
        p.MENSAJE, 
        p.DIAS_GRAL_AGUI, 
        p.FECHA_LF, 
        p.FECHA_LI,
        p.F_INICIO, 
        p.F_FIN, 
        p.NORG0, 
        p.NORG1, 
        p.NORG2, 
        p.NORG3
      FROM AGUINALDO_ORGANICAS(?, ?, ?) p
    `;

    return executeSerializedQuery((db) => {
      return new Promise<Aguinaldo[]>((resolve, reject) => {
        console.log('[APORTACIONES_FONDOS] [AGUINALDO] Ejecutando función', logContext);

        // Validar que la conexión esté disponible
        if (!db || typeof db.query !== 'function') {
          console.error('[APORTACIONES_FONDOS] [AGUINALDO] Conexión Firebird inválida', logContext);
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
                console.error('[APORTACIONES_FONDOS] [AGUINALDO] Error ejecutando función', {
                  ...logContext,
                  error: err.message || String(err),
                  errorCode: err.code,
                  errorName: err.name,
                  stack: err.stack,
                  duracionMs: duration
                });
                reject(new AportacionFondoDomainError(
                  `Error al ejecutar función AGUINALDO_ORGANICAS con parámetros PERIODO=${periodo}, ORG0=${org0}, ORG1=${org1}: ${err.message || String(err)}`,
                  AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
                ));
                return;
              }

              if (!result) {
                console.warn('[APORTACIONES_FONDOS] [AGUINALDO] Resultado nulo recibido', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Normalizar resultado a array
              const resultArray = Array.isArray(result) ? result : (result ? [result] : []);

              if (resultArray.length === 0) {
                console.log('[APORTACIONES_FONDOS] [AGUINALDO] No se encontraron registros de aguinaldo', { ...logContext, duracionMs: duration });
                resolve([]);
                return;
              }

              // Decodificar resultados de Firebird antes de mapear
              const decodedResult = resultArray.map((row: any) => normalizeTextDeep(decodeFirebirdObject(row)));
              
              // Mapear resultados a entidad Aguinaldo
              const aguinaldos: Aguinaldo[] = decodedResult.map((row: any) => ({
                interno: row.INTERNO !== null && row.INTERNO !== undefined ? Number(row.INTERNO) : null,
                org0: row.ORG0 || null,
                org1: row.ORG1 || null,
                org2: row.ORG2 || null,
                org3: row.ORG3 || null,
                movimiento: row.MOVIMIENTO || null,
                noempleado: row.NOEMPLEADO || null,
                tipomovimiento: row.TIPOMOVIMIENTO || null,
                nombres: row.NOMBRES || null,
                rfc: row.RFC || null,
                curp: row.CURP || null,
                fecha: row.FECHA ? new Date(row.FECHA) : null,
                dias_aguinaldo: row.DIAS_AGUINALDO !== null && row.DIAS_AGUINALDO !== undefined ? Number(row.DIAS_AGUINALDO) : null,
                cuantos: row.CUANTOS !== null && row.CUANTOS !== undefined ? Number(row.CUANTOS) : null,
                cuantos_ori: row.CUANTOS_ORI !== null && row.CUANTOS_ORI !== undefined ? Number(row.CUANTOS_ORI) : null,
                nocontar: row.NOCONTAR || null,
                sdo: row.SDO !== null && row.SDO !== undefined ? Number(row.SDO) : null,
                op: row.OP !== null && row.OP !== undefined ? Number(row.OP) : null,
                q: row.Q !== null && row.Q !== undefined ? Number(row.Q) : null,
                activo: row.ACTIVO || null,
                nom_activo: row.NOM_ACTIVO || null,
                qna_a: row.QNA_A !== null && row.QNA_A !== undefined ? Number(row.QNA_A) : null,
                porcentaje_a: row.PORCENTAJE_A !== null && row.PORCENTAJE_A !== undefined ? Number(row.PORCENTAJE_A) : null,
                diario: row.DIARIO !== null && row.DIARIO !== undefined ? Number(row.DIARIO) : null,
                general: row.GENERAL !== null && row.GENERAL !== undefined ? Number(row.GENERAL) : null,
                porcentaje: row.PORCENTAJE !== null && row.PORCENTAJE !== undefined ? Number(row.PORCENTAJE) : null,
                proporcion: row.PROPORCION !== null && row.PROPORCION !== undefined ? Number(row.PROPORCION) : null,
                mensaje: row.MENSAJE || null,
                dias_gral_agui: row.DIAS_GRAL_AGUI !== null && row.DIAS_GRAL_AGUI !== undefined ? Number(row.DIAS_GRAL_AGUI) : null,
                fecha_lf: row.FECHA_LF ? new Date(row.FECHA_LF) : null,
                fecha_li: row.FECHA_LI ? new Date(row.FECHA_LI) : null,
                f_inicio: row.F_INICIO ? new Date(row.F_INICIO) : null,
                f_fin: row.F_FIN ? new Date(row.F_FIN) : null,
                norg0: row.NORG0 || null,
                norg1: row.NORG1 || null,
                norg2: row.NORG2 || null,
                norg3: row.NORG3 || null
              }));

              this.enriquecerConDiasLaborados(
                aguinaldos,
                periodo,
                org0,
                org1,
                usarDiasLaboradosNomina,
                (registro) => registro.rfc
              ).then((aguinaldosEnriquecidos) => {
                console.log('[APORTACIONES_FONDOS] [AGUINALDO] Consulta completada exitosamente', {
                  ...logContext,
                  totalRegistros: aguinaldos.length,
                  duracionMs: duration
                });
                resolve(aguinaldosEnriquecidos);
              }).catch(reject);
            }
          );
        } catch (error: any) {
          const duration = Date.now() - startTime;
          console.error('[APORTACIONES_FONDOS] [AGUINALDO] Error inesperado', {
            ...logContext,
            error: error.message || String(error),
            stack: error.stack,
            duracionMs: duration
          });
          reject(new AportacionFondoDomainError(
            `Error inesperado al ejecutar función AGUINALDO_ORGANICAS: ${error.message || 'Error desconocido'}`,
            AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
          ));
        }
      });
    });
  }
}
