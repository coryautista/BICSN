import {
  IAportacionFondoRepository,
  NumerosEmpleadoLookup
} from '../../domain/repositories/IAportacionFondoRepository.js';
import { AportacionIndividual, AportacionCompleta, TipoFondo, AportacionFondo } from '../../domain/entities/AportacionFondo.js';
import { Prestamo } from '../../domain/entities/Prestamo.js';
import { PrestamoMedianoPlazo } from '../../domain/entities/PrestamoMedianoPlazo.js';
import { PrestamoHipotecario } from '../../domain/entities/PrestamoHipotecario.js';
import { d2ToD6, d6ToLegacyNumber } from '../../domain/entities/PrestamoMoney.js';
import { AportacionGuarderia } from '../../domain/entities/AportacionGuarderia.js';
import { PensionNominaTransitorio } from '../../domain/entities/PensionNominaTransitorio.js';
import { Aguinaldo } from '../../domain/entities/Aguinaldo.js';
import { AportacionFondoDomainError, AportacionFondoError, AportacionFondoErrorMessages } from '../../domain/errors.js';
import { getOrgPersonalByClavesOrganicas } from '../../../orgPersonal/infrastructure/persistence/OrgPersonalRepository.js';
import { getPool, sql } from '../../../../db/mssql.js';
import { executeSerializedQuery, decodeFirebirdObject, executeSelectableProcedure, FIREBIRD_TIMEOUTS } from '../../../../db/firebird.js';
import { normalizeTextDeep } from '../../../../utils/encoding.js';
import {
  NominaDiasContext,
  NominaDiasLaboradosResolver,
  NominaDiasResultado
} from '../../domain/services/NominaDiasLaboradosResolver.js';
import { AportacionesMonetaryKernel } from '../../domain/services/AportacionesMonetaryKernel.js';
import type { FormulaCalculo } from '../../domain/entities/FormulaCalculo.js';
import type { IFormulaCalculoRepository } from '../../domain/repositories/IFormulaCalculoRepository.js';
import { AportacionFondoCalculator } from '../../domain/services/AportacionFondoCalculator.js';
import { decimalSourceToD6 } from '../../domain/entities/Money.js';
import { createHash } from 'node:crypto';

export class AportacionFondoRepository implements IAportacionFondoRepository {
  private readonly DIAS_LABORADOS_DEFAULT = 15;
  private readonly nominaDiasResolver = new NominaDiasLaboradosResolver(this.DIAS_LABORADOS_DEFAULT);
  private readonly monetaryKernel = new AportacionesMonetaryKernel();
  private readonly aportacionCalculator = new AportacionFondoCalculator(this.monetaryKernel);

  constructor(private readonly formulaCalculoRepo: IFormulaCalculoRepository) {}

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

      const periodoInfo = !periodo ? await this.obtenerPeriodoAplicacion(claveOrganica0, claveOrganica1) : null;
      const periodoCalculo = periodo || periodoInfo?.periodo;
      if (periodo) {
        const historico = await this.obtenerAportacionesHistoricasCerradas(
          tipo,
          claveOrganica0,
          claveOrganica1,
          periodo
        );
        if (historico) return historico;
      }
      const formula = await this.obtenerFormulaPeriodo(periodoCalculo);

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
      const datos = await this.calcularAportaciones(
        registros,
        tipo,
        usarDiasLaboradosNomina,
        periodoCalculo,
        claveOrganica0,
        claveOrganica1,
        formula
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
      const totalContribucionA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.total_d6));
      const totalSueldoBaseA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.sueldo_base_d6));
      const componentesA2 = this.calcularComponentesA2(tipo, datos);
      const resumen = {
        total_empleados: datos.length,
        total_contribucion: Number(totalContribucionA2),
        total_sueldo_base: Number(totalSueldoBaseA2),
        total_contribucion_a2: totalContribucionA2,
        total_sueldo_base_a2: totalSueldoBaseA2,
        componentes_a2: componentesA2
      };

      return {
        tipo,
        clave_organica_0: claveOrganica0,
        clave_organica_1: claveOrganica1,
        datos,
        resumen,
        precision_policy: formula.precisionPolicy,
        formula_version_id: formula.formulaCalculoVersionId,
        fuente_datos: 'CALCULO_VIVO'
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

      const periodoInfo = await this.obtenerPeriodoAplicacion(claveOrganica0, claveOrganica1);
      const formula = await this.obtenerFormulaPeriodo(periodoInfo.periodo);
      let totalContribucionGeneralA2 = this.monetaryKernel.truncarA2('0');
      let totalSueldoBaseGeneralA2 = this.monetaryKernel.truncarA2('0');

      // Construir resultado completo
      const resultado: AportacionCompleta = {
        clave_organica_0: claveOrganica0,
        clave_organica_1: claveOrganica1,
        resumen_general: {
          total_empleados: registros.length,
          total_contribucion_general: 0,
          total_sueldo_base_general: 0,
          total_contribucion_general_a2: totalContribucionGeneralA2,
          total_sueldo_base_general_a2: totalSueldoBaseGeneralA2,
          fondos_incluidos: []
        },
        precision_policy: formula.precisionPolicy,
        formula_version_id: formula.formulaCalculoVersionId,
        fuente_datos: 'CALCULO_VIVO'
      };

      // Calcular aportaciones para todos los tipos desde los mismos datos
      const tiposFondo: TipoFondo[] = ['ahorro', 'vivienda', 'prestaciones', 'cair'];
      
      for (const tipo of tiposFondo) {
          const datos = await this.calcularAportaciones(
            registros,
            tipo,
            true,
            periodoInfo.periodo,
            claveOrganica0,
            claveOrganica1,
            formula
          );
          
          // Calcular resumen para este tipo
          const totalContribucionA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.total_d6));
          const totalSueldoBaseA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.sueldo_base_d6));
          const componentesA2 = this.calcularComponentesA2(tipo, datos);
          const resumen = {
            total_empleados: datos.length,
            total_contribucion: Number(totalContribucionA2),
            total_sueldo_base: Number(totalSueldoBaseA2),
            total_contribucion_a2: totalContribucionA2,
            total_sueldo_base_a2: totalSueldoBaseA2,
            componentes_a2: componentesA2
          };

          // Agregar al resultado
          const resultadoTipo: AportacionIndividual = {
            tipo,
            clave_organica_0: claveOrganica0,
            clave_organica_1: claveOrganica1,
            datos,
            resumen,
            precision_policy: formula.precisionPolicy,
            formula_version_id: formula.formulaCalculoVersionId,
            fuente_datos: 'CALCULO_VIVO'
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
          totalContribucionGeneralA2 = this.monetaryKernel.sumarA2([
            totalContribucionGeneralA2,
            resumen.total_contribucion_a2
          ]);
          totalSueldoBaseGeneralA2 = this.monetaryKernel.sumarA2([
            totalSueldoBaseGeneralA2,
            resumen.total_sueldo_base_a2
          ]);
          resultado.resumen_general.total_contribucion_general_a2 = totalContribucionGeneralA2;
          resultado.resumen_general.total_sueldo_base_general_a2 = totalSueldoBaseGeneralA2;
          resultado.resumen_general.total_contribucion_general = Number(totalContribucionGeneralA2);
          resultado.resumen_general.total_sueldo_base_general = Number(totalSueldoBaseGeneralA2);
          resultado.resumen_general.fondos_incluidos.push(tipo);
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
        CAST(p.CAPITAL AS VARCHAR(40)) AS CAPITAL_D2,
        CAST(p.INTERES AS VARCHAR(40)) AS INTERES_D2,
        CAST(p.MONTO AS VARCHAR(40)) AS MONTO_D2,
        CAST(p.MORATORIOS AS VARCHAR(40)) AS MORATORIOS_D2,
        CAST(p.TOTAL AS VARCHAR(40)) AS TOTAL_D2,
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
              reject(new AportacionFondoDomainError(
                'AP_S_PCP devolvió un resultado nulo',
                AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
              ));
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
                const capitalD6 = d2ToD6(row.CAPITAL_D2);
                const interesD6 = d2ToD6(row.INTERES_D2);
                const montoD6 = d2ToD6(row.MONTO_D2);
                const moratoriosD6 = d2ToD6(row.MORATORIOS_D2);
                const totalD6 = d2ToD6(row.TOTAL_D2);
                return {
                  interno: row.INTERNO || 0,
                  rfc: row.RFC || null,
                  nombre: row.NOMBRE || null,
                  prestamo: row.PRESTAMO || null,
                  letra: row.LETRA || null,
                  plazo: row.PLAZO || null,
                  periodo_c: row.PERIODO_C || null,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  capital: d6ToLegacyNumber(capitalD6),
                  capital_d6: capitalD6,
                  interes: d6ToLegacyNumber(interesD6),
                  interes_d6: interesD6,
                  monto: d6ToLegacyNumber(montoD6),
                  monto_d6: montoD6,
                  moratorios: d6ToLegacyNumber(moratoriosD6),
                  moratorios_d6: moratoriosD6,
                  total: d6ToLegacyNumber(totalD6),
                  total_d6: totalD6,
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
                console.error('[APORTACIONES_FONDOS] [AP_S_PCP] Error mapeando registro', {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                throw mapError;
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
        CAST(p.CAPITAL AS VARCHAR(40)) AS CAPITAL_D2,
        CAST(p.MORATORIOS AS VARCHAR(40)) AS MORATORIOS_D2,
        CAST(p.INTERES AS VARCHAR(40)) AS INTERES_D2,
        CAST(p.SEGURO AS VARCHAR(40)) AS SEGURO_D2,
        CAST(p.TOTAL AS VARCHAR(40)) AS TOTAL_D2,
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
              reject(new AportacionFondoDomainError(
                'AP_S_VIV devolvió un resultado nulo',
                AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
              ));
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
                const capitalD6 = d2ToD6(row.CAPITAL_D2);
                const moratoriosD6 = d2ToD6(row.MORATORIOS_D2);
                const interesD6 = d2ToD6(row.INTERES_D2);
                const seguroD6 = d2ToD6(row.SEGURO_D2);
                const totalD6 = d2ToD6(row.TOTAL_D2);
                return {
                  interno: row.INTERNO || 0,
                  rfc: row.RFC || null,
                  nombre: row.NOMBRE || null,
                  prestamo: row.PRESTAMO || null,
                  letra: row.LETRA || null,
                  plazo: row.PLAZO || null,
                  periodo_c: row.PERIODO_C || null,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  capital: d6ToLegacyNumber(capitalD6),
                  capital_d6: capitalD6,
                  moratorios: d6ToLegacyNumber(moratoriosD6),
                  moratorios_d6: moratoriosD6,
                  interes: d6ToLegacyNumber(interesD6),
                  interes_d6: interesD6,
                  seguro: d6ToLegacyNumber(seguroD6),
                  seguro_d6: seguroD6,
                  total: d6ToLegacyNumber(totalD6),
                  total_d6: totalD6,
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
                console.error('[APORTACIONES_FONDOS] [AP_S_VIV] Error mapeando registro', {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                throw mapError;
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
        CAST(p.CANTIDAD AS VARCHAR(40)) AS CANTIDAD_D2,
        p.STATUS, 
        p.REFERENCIA_1, 
        p.REFERENCIA_2, 
        CAST(p.CAPITAL_PAGAR AS VARCHAR(40)) AS CAPITAL_PAGAR_D2,
        CAST(p.INTERES_PAGAR AS VARCHAR(40)) AS INTERES_PAGAR_D2,
        CAST(p.INTERES_DIFERIDO_PAGAR AS VARCHAR(40)) AS INTERES_DIFERIDO_PAGAR_D2,
        CAST(p.SEGURO_PAGAR AS VARCHAR(40)) AS SEGURO_PAGAR_D2,
        CAST(p.MORATORIO_PAGAR AS VARCHAR(40)) AS MORATORIO_PAGAR_D2,
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
        CAST(p.DESCTO AS VARCHAR(40)) AS DESCTO_D2,
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
              reject(new AportacionFondoDomainError(
                `${procedimiento} devolvió un resultado nulo`,
                AportacionFondoError.ERROR_FIREBIRD_PROCEDIMIENTO
              ));
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
                const cantidadD6 = d2ToD6(row.CANTIDAD_D2);
                const capitalPagarD6 = d2ToD6(row.CAPITAL_PAGAR_D2);
                const interesPagarD6 = d2ToD6(row.INTERES_PAGAR_D2);
                const interesDiferidoPagarD6 = d2ToD6(row.INTERES_DIFERIDO_PAGAR_D2);
                const seguroPagarD6 = d2ToD6(row.SEGURO_PAGAR_D2);
                const moratorioPagarD6 = d2ToD6(row.MORATORIO_PAGAR_D2);
                const desctoD6 = d2ToD6(row.DESCTO_D2);
                return {
                  interno: row.INTERNO || 0,
                  nombre: row.NOMBRE || null,
                  noempleado: row.NOEMPLEADO || null,
                  cantidad: d6ToLegacyNumber(cantidadD6),
                  cantidad_d6: cantidadD6,
                  status: row.STATUS || null,
                  referencia_1: row.REFERENCIA_1 || null,
                  referencia_2: row.REFERENCIA_2 || null,
                  capital_pagar: d6ToLegacyNumber(capitalPagarD6),
                  capital_pagar_d6: capitalPagarD6,
                  interes_pagar: d6ToLegacyNumber(interesPagarD6),
                  interes_pagar_d6: interesPagarD6,
                  interes_diferido_pagar: d6ToLegacyNumber(interesDiferidoPagarD6),
                  interes_diferido_pagar_d6: interesDiferidoPagarD6,
                  seguro_pagar: d6ToLegacyNumber(seguroPagarD6),
                  seguro_pagar_d6: seguroPagarD6,
                  moratorio_pagar: d6ToLegacyNumber(moratorioPagarD6),
                  moratorio_pagar_d6: moratorioPagarD6,
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
                  descto: d6ToLegacyNumber(desctoD6),
                  descto_d6: desctoD6,
                  fecha_c: row.FECHA_C ? new Date(row.FECHA_C) : null,
                  resultado: row.RESULTADO || null,
                  po: row.PO || null,
                  fecha_origen: row.FECHA_ORIGEN ? new Date(row.FECHA_ORIGEN) : null,
                  plazo: row.PLAZO || null
                };
              } catch (mapError) {
                console.error(`[APORTACIONES_FONDOS] [HIPOTECARIOS] Error mapeando registro`, {
                  ...logContext,
                  index,
                  error: mapError instanceof Error ? mapError.message : String(mapError)
                });
                throw mapError;
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
   * Los periodos terminados son evidencia financiera: se devuelven tal como
   * fueron persistidos y nunca se mezclan con ORG_PERSONAL vigente.
   */
  private async obtenerAportacionesHistoricasCerradas(
    tipo: TipoFondo,
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): Promise<AportacionIndividual | null> {
    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));
    const config = {
      ahorro: {
        table: 'IndividualesAhorroHistorico',
        contributions: 'afae, afaa, NULL AS afe, NULL AS afpe, NULL AS afpa'
      },
      vivienda: {
        table: 'IndividualesViviendaHistorico',
        contributions: 'NULL AS afae, NULL AS afaa, afe, NULL AS afpe, NULL AS afpa'
      },
      prestaciones: {
        table: 'IndividualesPrestacionesHistorico',
        contributions: 'NULL AS afae, NULL AS afaa, NULL AS afe, afpe, afpa'
      },
      cair: {
        table: 'IndividualesCairHistorico',
        contributions: 'NULL AS afae, NULL AS afaa, afe, NULL AS afpe, NULL AS afpa'
      }
    }[tipo];

    const pool = await getPool();
    const cierreResult = await pool.request()
      .input('org0', sql.Char(2), claveOrganica0)
      .input('org1', sql.Char(2), claveOrganica1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT CASE WHEN EXISTS (
          SELECT 1
          FROM afec.BitacoraAfectacionOrg
          WHERE Entidad = 'AFILIADOS'
            AND Org0 = @org0
            AND Org1 = @org1
            AND Quincena = @quincena
            AND Anio = @anio
            AND Accion = 'TERMINADO'
        ) THEN 1 ELSE 0 END AS Cerrado;
      `);
    if (Number(cierreResult.recordset[0]?.Cerrado ?? 0) !== 1) return null;

    const result = await pool.request()
      .input('org0', sql.Char(2), claveOrganica0)
      .input('org1', sql.Char(2), claveOrganica1)
      .input('quincena', sql.Int, quincena)
      .input('anio', sql.Int, anio)
      .query(`
        SELECT interno, nombre, sueldo, quinquenios, otras_prestaciones,
          sueldo_base, ${config.contributions}, total
        FROM aportaciones.${config.table}
        WHERE clave_organica_0 = @org0
          AND clave_organica_1 = @org1
          AND quincena = @quincena
          AND anio = @anio
        ORDER BY id;

        SELECT s.Organica2, s.Organica3, s.FormulaCalculoVersionId,
          s.PrecisionPolicy, d.EmpleadoClaveHash, d.DiasLaborados, d.DiasOrigen
        FROM aportaciones.SnapshotCalculoV2 s
        INNER JOIN aportaciones.SnapshotCalculoV2Detalle d ON d.SnapshotId = s.SnapshotId
        WHERE s.Organica0 = @org0
          AND s.Organica1 = @org1
          AND s.Quincena = @quincena
          AND s.Anio = @anio
          AND s.Estado = 'COMPLETO'
          AND s.EsCerrado = 1;
      `);
    const recordsets = result.recordsets as any[];
    const rows = recordsets[0] ?? [];
    if (rows.length === 0) {
      throw new AportacionFondoDomainError(
        `El periodo cerrado ${periodo} no tiene histórico persistido para ${tipo}`,
        AportacionFondoError.DATOS_NO_ENCONTRADOS
      );
    }
    if (new Set(rows.map((row: any) => Number(row.interno))).size !== rows.length) {
      throw new AportacionFondoDomainError(
        `El histórico ${tipo} del periodo ${periodo} contiene internos duplicados`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }

    const snapshotRows = recordsets[1] ?? [];
    const diasSnapshot = new Map<string, { dias: number; origen: string }>();
    for (const row of snapshotRows) {
      const hash = String(row.EmpleadoClaveHash ?? '').trim().toUpperCase();
      const dias = Number(row.DiasLaborados);
      if (!hash || !Number.isFinite(dias)) continue;
      const existente = diasSnapshot.get(hash);
      if (existente && existente.dias !== dias) {
        throw new AportacionFondoDomainError(
          `Snapshots históricos contradictorios para el periodo ${periodo}`,
          AportacionFondoError.ERROR_CALCULO_APORTACION
        );
      }
      diasSnapshot.set(hash, { dias, origen: String(row.DiasOrigen ?? '') });
    }
    const scopes: string[] = [...new Set<string>(snapshotRows.map((row: any): string =>
      `${String(row.Organica2).trim()}|${String(row.Organica3).trim()}`
    ))];
    const formulaVersionIds: string[] = [...new Set<string>(snapshotRows.flatMap((row: any): string[] =>
      row.FormulaCalculoVersionId == null ? [] : [String(row.FormulaCalculoVersionId)]
    ))];
    const precisionPolicies: string[] = [...new Set<string>(snapshotRows.flatMap((row: any): string[] => {
      const policy = String(row.PrecisionPolicy ?? '').trim();
      return policy ? [policy] : [];
    }))];
    if (formulaVersionIds.length > 1 || precisionPolicies.length > 1) {
      throw new AportacionFondoDomainError(
        `Snapshots históricos con metadatos contradictorios para el periodo ${periodo}`,
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }

    const datos: AportacionFondo[] = rows.map((row: any): AportacionFondo => {
      const sueldoD6 = decimalSourceToD6(row.sueldo ?? 0);
      const quinqueniosD6 = decimalSourceToD6(row.quinquenios ?? 0);
      const otrasPrestacionesD6 = decimalSourceToD6(row.otras_prestaciones ?? 0);
      const sueldoBaseD6 = decimalSourceToD6(row.sueldo_base ?? 0);
      const totalD6 = decimalSourceToD6(row.total ?? 0);
      const coincidenciasDias = scopes
        .map((scope) => {
          const [org2, org3] = scope.split('|');
          const hash = createHash('sha256')
            .update(`${periodo}|${claveOrganica0}|${claveOrganica1}|${org2}|${org3}|${Number(row.interno)}`)
            .digest('hex')
            .toUpperCase();
          return diasSnapshot.get(hash);
        })
        .filter((value): value is { dias: number; origen: string } => value !== undefined);
      if (coincidenciasDias.length > 1) {
        throw new AportacionFondoDomainError(
          `El interno ${Number(row.interno)} coincide con múltiples snapshots del periodo ${periodo}`,
          AportacionFondoError.ERROR_CALCULO_APORTACION
        );
      }
      const diasHistoricos = coincidenciasDias[0];
      const diasAplicados = diasHistoricos?.dias ?? 15;
      const sueldoProporcionalD6 = this.monetaryKernel.proporcionarBaseA2D6(
        sueldoD6,
        String(diasAplicados),
        '30'
      );
      const dato: AportacionFondo = {
        interno: Number(row.interno),
        nombre: row.nombre == null ? null : String(row.nombre),
        sueldo: row.sueldo == null ? null : Number(sueldoD6),
        quinquenios: row.quinquenios == null ? null : Number(quinqueniosD6),
        otras_prestaciones: row.otras_prestaciones == null ? null : Number(otrasPrestacionesD6),
        sueldo_proporcional: Number(sueldoProporcionalD6),
        sueldo_base: Number(sueldoBaseD6),
        total: Number(totalD6),
        tipo,
        dias_laborados: diasAplicados,
        dias_laborados_origen: diasHistoricos ? 'historico_snapshot' : 'historico_sin_dias',
        base_cotizacion_quinquenios: null,
        quinquenios_aplicado: null,
        base_cotizacion_quinquenios_d6: null,
        quinquenios_aplicado_d6: null,
        sueldo_d6: sueldoD6,
        quinquenios_d6: quinqueniosD6,
        otras_prestaciones_d6: otrasPrestacionesD6,
        sueldo_proporcional_d6: sueldoProporcionalD6,
        sueldo_base_d6: sueldoBaseD6,
        total_d6: totalD6
      };
      for (const field of ['afae', 'afaa', 'afe', 'afpe', 'afpa'] as const) {
        if (row[field] == null) continue;
        const valueD6 = decimalSourceToD6(row[field]);
        dato[field] = Number(valueD6);
        dato[`${field}_d6`] = valueD6;
      }
      return dato;
    });
    const totalContribucionA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.total_d6));
    const totalSueldoBaseA2 = this.monetaryKernel.agregarA2(datos.map((item) => item.sueldo_base_d6));

    return {
      tipo,
      clave_organica_0: claveOrganica0,
      clave_organica_1: claveOrganica1,
      datos,
      resumen: {
        total_empleados: datos.length,
        total_contribucion: Number(totalContribucionA2),
        total_sueldo_base: Number(totalSueldoBaseA2),
        total_contribucion_a2: totalContribucionA2,
        total_sueldo_base_a2: totalSueldoBaseA2,
        componentes_a2: this.calcularComponentesA2(tipo, datos)
      },
      precision_policy: precisionPolicies[0] ?? 'HISTORICO_SQL_SIN_POLITICA_REGISTRADA',
      formula_version_id: formulaVersionIds[0] ?? '0',
      fuente_datos: 'HISTORICO_SQL'
    };
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
        CAST(o.SUELDO AS VARCHAR(40)) AS SUELDO_DECIMAL,
        CAST(o.OTRAS_PRESTACIONES AS VARCHAR(40)) AS OTRAS_PRESTACIONES_DECIMAL,
        CAST(o.QUINQUENIOS AS VARCHAR(40)) AS QUINQUENIOS_DECIMAL,
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
              sueldo: row.SUELDO ?? row.sueldo ?? null,
              otras_prestaciones: row.OTRAS_PRESTACIONES ?? row.otras_prestaciones ?? null,
              quinquenios: row.QUINQUENIOS ?? row.quinquenios ?? null,
              sueldo_decimal: row.SUELDO_DECIMAL ?? row.sueldo_decimal ?? row.SUELDO ?? row.sueldo ?? null,
              otras_prestaciones_decimal: row.OTRAS_PRESTACIONES_DECIMAL ?? row.otras_prestaciones_decimal ?? row.OTRAS_PRESTACIONES ?? row.otras_prestaciones ?? null,
              quinquenios_decimal: row.QUINQUENIOS_DECIMAL ?? row.quinquenios_decimal ?? row.QUINQUENIOS ?? row.quinquenios ?? null,
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
    org1?: string,
    formula?: FormulaCalculo
  ): Promise<AportacionFondo[]> {
    const formulaCalculo = formula ?? await this.obtenerFormulaPeriodo(periodo);
    const diasResolver = new NominaDiasLaboradosResolver(
      Number(formulaCalculo.parametros.DIAS_DEFAULT_SIN_TXT),
      Number(formulaCalculo.parametros.DIAS_MIN),
      Number(formulaCalculo.parametros.DIAS_MAX)
    );
    const diasContext = usarDiasLaboradosNomina && periodo && org0 && org1
      ? await this.obtenerDiasLaboradosNominaMap(
          registros.map((registro) => registro.rfc).filter(Boolean),
          periodo,
          org0,
          org1
        )
      : { tieneArchivo: false, registros: new Map() };

    return registros.map(registro => {
      const sueldoFuente = this.decimalFuente(registro.sueldo_decimal ?? registro.sueldo);
      const otrasPrestacionesFuente = this.decimalFuente(registro.otras_prestaciones_decimal ?? registro.otras_prestaciones);
      const quinqueniosFuente = this.decimalFuente(registro.quinquenios_decimal ?? registro.quinquenios);
      const diasInfo = diasResolver.resolve(registro.rfc, diasContext, usarDiasLaboradosNomina);
      const rfc = this.nominaDiasResolver.normalizeRfc(registro.rfc) ?? 'SIN_RFC';
      if (diasInfo.origen === 'nomina_sin_coincidencia') {
        throw new AportacionFondoDomainError(
          `El RFC ${rfc} no existe en el TXT vigente del período ${periodo}`,
          AportacionFondoError.NOMINA_RFC_SIN_COINCIDENCIA
        );
      }
      if (diasInfo.origen === 'nomina'
          && (diasInfo.baseCotizacionSueldo == null || diasInfo.baseCotizacionQuinquenios == null)) {
        throw new AportacionFondoDomainError(
          `El RFC ${rfc} no tiene BaseCotizacionSueldo y BaseCotizacionQuinquenios válidas en el período ${periodo}`,
          AportacionFondoError.NOMINA_BASE_COTIZACION_INVALIDA
        );
      }
      return this.aportacionCalculator.calcular(tipo, {
        interno: Number(registro.interno),
        nombre: registro.nombre || null,
        sueldoMensual: sueldoFuente,
        otrasPrestacionesMensuales: otrasPrestacionesFuente,
        quinqueniosMensual: quinqueniosFuente,
        diasLaborados: diasInfo.dias,
        diasOrigen: diasInfo.origen,
        baseCotizacionSueldo: diasInfo.baseCotizacionSueldo == null
          ? null
          : this.decimalFuente(diasInfo.baseCotizacionSueldo),
        baseCotizacionQuinquenios: diasInfo.baseCotizacionQuinquenios == null
          ? null
          : this.decimalFuente(diasInfo.baseCotizacionQuinquenios)
      }, formulaCalculo);
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

  private async obtenerFormulaPeriodo(periodo?: string): Promise<FormulaCalculo> {
    if (!periodo || !/^\d{4}$/.test(periodo)) {
      throw new AportacionFondoDomainError(
        `Periodo inválido para resolver fórmula: ${String(periodo)}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }
    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));
    return this.formulaCalculoRepo.obtenerPorPeriodo(anio, quincena);
  }

  private decimalFuente(value: unknown): string {
    if (value === null || value === undefined || value === '') return '0';
    const decimal = String(value).trim();
    if (!/^[+-]?\d+(?:\.\d{1,9})?$/.test(decimal)) {
      throw new AportacionFondoDomainError(
        `Valor decimal de fuente inválido: ${decimal}`,
        AportacionFondoError.PARAMETRO_INVALIDO
      );
    }
    return decimal;
  }

  private calcularComponentesA2(
    tipo: TipoFondo,
    datos: AportacionFondo[]
  ): Partial<Record<'afae' | 'afaa' | 'afe' | 'afpe' | 'afpa', ReturnType<AportacionesMonetaryKernel['agregarComponenteA2']>>> {
    const agregar = (campo: 'afae_d6' | 'afaa_d6' | 'afe_d6' | 'afpe_d6' | 'afpa_d6') =>
      this.monetaryKernel.agregarComponenteA2(datos.map((item) => String(item[campo] ?? '0')));
    if (tipo === 'ahorro') return { afae: agregar('afae_d6'), afaa: agregar('afaa_d6') };
    if (tipo === 'prestaciones') return { afpe: agregar('afpe_d6'), afpa: agregar('afpa_d6') };
    return { afe: agregar('afe_d6') };
  }

  private async obtenerDiasLaboradosNominaMap(
    rfcs: Array<string | null | undefined>,
    periodo: string,
    org0: string,
    org1: string,
    scope?: { organica2: string; organica3: string }
  ): Promise<NominaDiasContext> {
    const registros = new Map<string, {
      dias: number | null;
      baseCotizacionSueldo: string | null;
      baseCotizacionQuinquenios: string | null;
    }>();
    if (!/^\d{4}$/.test(periodo)) {
      return { tieneArchivo: false, fuente: 'default', registros };
    }

    const quincena = Number(periodo.slice(0, 2));
    const anio = 2000 + Number(periodo.slice(2, 4));
    if (!Number.isInteger(quincena) || quincena < 1 || quincena > 24) {
      return { tieneArchivo: false, fuente: 'default', registros };
    }

    const pool = await getPool();
    const cargaRequest = pool.request()
      .input('entidadId', sql.Int, 1)
      .input('anio', sql.SmallInt, anio)
      .input('quincena', sql.TinyInt, quincena)
      .input('org0', sql.Char(2), org0)
      .input('org1', sql.Char(2), org1);
    const scopeFilter = scope
      ? 'AND Organica2 = @org2 AND Organica3 = @org3'
      : '';
    if (scope) {
      cargaRequest
        .input('org2', sql.Char(2), scope.organica2)
        .input('org3', sql.Char(2), scope.organica3);
    }
    const cargaResult = await cargaRequest.query(`
        SELECT Id AS CargaId
        FROM dbo.NominaAplicacionQnalCarga
        WHERE EntidadId = @entidadId
          AND Anio = @anio
          AND Quincena = @quincena
          AND Organica0 = @org0
          AND Organica1 = @org1
          ${scopeFilter}
          AND TipoCarga = 'TXT'
          AND Estatus = 'APLICADA'
          AND EsVigente = 1
      `);
    if (cargaResult.recordset.length > 1) {
      throw new AportacionFondoDomainError(
        'Existen multiples cargas TXT vigentes para el ambito',
        AportacionFondoError.ERROR_CALCULO_APORTACION
      );
    }

    const uniqueRfcs = [
      ...new Set(
        rfcs
          .map((rfc) => this.nominaDiasResolver.normalizeRfc(rfc))
          .filter((rfc): rfc is string => !!rfc)
      )
    ];
    if (uniqueRfcs.length === 0) {
      return {
        tieneArchivo: cargaResult.recordset.length === 1,
        fuente: cargaResult.recordset.length === 1 ? 'txt' : 'default',
        registros
      };
    }

    let fuente: 'txt' | 'movimiento' | 'default' = cargaResult.recordset.length === 1 ? 'txt' : 'default';
    let cargaIds = cargaResult.recordset.map((row) => String(row.CargaId));
    if (cargaIds.length === 0) {
      const movimientosRequest = pool.request()
        .input('entidadId', sql.Int, 1)
        .input('anio', sql.SmallInt, anio)
        .input('quincena', sql.TinyInt, quincena)
        .input('org0', sql.Char(2), org0)
        .input('org1', sql.Char(2), org1);
      if (scope) {
        movimientosRequest
          .input('org2', sql.Char(2), scope.organica2)
          .input('org3', sql.Char(2), scope.organica3);
      }
      const movimientosResult = await movimientosRequest.query(`
        SELECT Id AS CargaId
        FROM dbo.NominaAplicacionQnalCarga
        WHERE EntidadId=@entidadId AND Anio=@anio AND Quincena=@quincena
          AND Organica0=@org0 AND Organica1=@org1
          ${scopeFilter}
          AND TipoCarga='MOVIMIENTO' AND Estatus='APLICADA'
        ORDER BY Id DESC
      `);
      cargaIds = movimientosResult.recordset.map((row) => String(row.CargaId));
      fuente = cargaIds.length > 0 ? 'movimiento' : 'default';
    }
    if (fuente === 'default') return { tieneArchivo: false, fuente, registros };

    for (let i = 0; i < uniqueRfcs.length; i += 500) {
      const batch = uniqueRfcs.slice(i, i + 500);
      const request = pool.request();
      const cargaPlaceholders = cargaIds.map((cargaId, index) => {
        const name = `cargaId${index}`;
        request.input(name, sql.BigInt, cargaId);
        return `@${name}`;
      }).join(', ');
      const placeholders = batch.map((rfc, index) => {
        const name = `rfc${index}`;
        request.input(name, sql.VarChar(13), rfc);
        return `@${name}`;
      }).join(', ');

      const result = await request.query(`
        SELECT Id,UPPER(LTRIM(RTRIM(RFC))) AS RFC,DiasLaborados,
          CONVERT(VARCHAR(40), BaseCotizacionSueldo) AS BaseCotizacionSueldo,
          CONVERT(VARCHAR(40), BaseCotizacionQuinquenios) AS BaseCotizacionQuinquenios
        FROM dbo.NominaAplicacionQnalDetalle
        WHERE CargaId IN (${cargaPlaceholders})
          AND UPPER(LTRIM(RTRIM(RFC))) IN (${placeholders})
        ORDER BY Id DESC
      `);

      for (const row of result.recordset) {
        const key = this.nominaDiasResolver.normalizeRfc(row.RFC);
        const dias = this.safeNumber(row.DiasLaborados);
        const baseCotizacionSueldo = row.BaseCotizacionSueldo == null ? null : String(row.BaseCotizacionSueldo);
        const baseCotizacionQuinquenios = row.BaseCotizacionQuinquenios == null ? null : String(row.BaseCotizacionQuinquenios);
        if (key) {
          if (registros.has(key) && fuente === 'txt') {
            throw new AportacionFondoDomainError(
              `RFC repetido entre cargas TXT vigentes del ámbito: ${key}`,
              AportacionFondoError.ERROR_CALCULO_APORTACION
            );
          }
          if (!registros.has(key)) registros.set(key, {
            dias,
            baseCotizacionSueldo,
            baseCotizacionQuinquenios
          });
        }
      }
    }

    return { tieneArchivo: fuente === 'txt', fuente, registros };
  }

  private async enriquecerConDiasLaborados<T>(
    registros: T[],
    periodo: string,
    org0: string,
    org1: string,
    usarDiasLaboradosNomina: boolean,
    getRfc: (registro: T) => string | null | undefined,
    nominaScope?: { organica2: string; organica3: string }
  ): Promise<Array<T & { dias_laborados: number; dias_laborados_origen: NominaDiasResultado['origen'] }>> {
    const diasContext = usarDiasLaboradosNomina
      ? await this.obtenerDiasLaboradosNominaMap(registros.map(getRfc), periodo, org0, org1, nominaScope)
      : { tieneArchivo: false, registros: new Map() };

    return registros.map((registro) => {
      const dias = this.nominaDiasResolver.resolve(getRfc(registro), diasContext, usarDiasLaboradosNomina);
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
        CAST(p.RECIBO_TOTAL AS VARCHAR(40)) AS RECIBO_TOTAL_D6,
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
                recibo_total_d6: decimalSourceToD6(row.RECIBO_TOTAL_D6),
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
        CAST(p.TOTAL AS VARCHAR(40)) AS TOTAL_D6,
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
                total_d6: decimalSourceToD6(row.TOTAL_D6),
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
                (registro) => registro.rfc,
                { organica2: org2, organica3: org3 }
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
        CAST(p.GENERAL AS VARCHAR(40)) AS GENERAL_D6,
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
                general_d6: decimalSourceToD6(row.GENERAL_D6),
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
