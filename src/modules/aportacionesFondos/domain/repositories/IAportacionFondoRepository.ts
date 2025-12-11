import { AportacionIndividual, AportacionCompleta, TipoFondo } from '../entities/AportacionFondo.js';
import { Prestamo } from '../entities/Prestamo.js';
import { PrestamoMedianoPlazo } from '../entities/PrestamoMedianoPlazo.js';
import { PrestamoHipotecario } from '../entities/PrestamoHipotecario.js';
import { AportacionGuarderia } from '../entities/AportacionGuarderia.js';
import { PensionNominaTransitorio } from '../entities/PensionNominaTransitorio.js';

export interface IAportacionFondoRepository {
  // Obtener aportaciones de un tipo específico
  obtenerAportacionesIndividuales(
    tipo: TipoFondo,
    claveOrganica0: string,
    claveOrganica1: string
  ): Promise<AportacionIndividual>;
  
  // Obtener aportaciones combinadas de todos los tipos
  obtenerAportacionesCompletas(
    claveOrganica0: string,
    claveOrganica1: string
  ): Promise<AportacionCompleta>;
  
  // Obtener préstamos a corto plazo ejecutando procedimiento AP_S_PCP
  obtenerPrestamos(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): Promise<Prestamo[]>;
  
  // Obtener préstamos a mediano plazo ejecutando procedimiento AP_S_VIV
  obtenerPrestamosMedianoPlazo(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string
  ): Promise<PrestamoMedianoPlazo[]>;
  
  // Obtener préstamos hipotecarios ejecutando procedimiento AP_S_HIP_QNA o AP_S_COMP_QNA
  obtenerPrestamosHipotecarios(
    claveOrganica0: string,
    claveOrganica1: string,
    periodo: string,
    computadoraAntigua?: boolean
  ): Promise<PrestamoHipotecario[]>;
  
  // Obtener período de aplicación desde BitacoraAfectacionOrg
  obtenerPeriodoAplicacion(org0: string, org1: string): Promise<{ periodo: string; accion: string }>;
  
  // Obtener quincena y año desde BitacoraAfectacionOrg
  obtenerQuincenaYAnio(org0: string, org1: string): Promise<{ quincena: number; anio: number; accion: string }>;
  
  // Obtener aportación guarderías ejecutando función EBI2_RECIBOS_IMPRIMIR
  obtenerAportacionGuarderias(
    org0: string,
    org1: string,
    periodo: string
  ): Promise<AportacionGuarderia[]>;
  
  // Obtener pensión nómina transitorio ejecutando función PENSION_NOMINA_QNAL_TRANSITORIO
  obtenerPensionNominaTransitorio(
    org0: string,
    org1: string,
    org2: string,
    org3: string,
    periodo: string
  ): Promise<PensionNominaTransitorio[]>;
  
  // Validar si el usuario puede acceder a las claves orgánicas especificadas
  validarAccesoClavesOrganicas(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string
  ): { clave0: string; clave1: string };
}