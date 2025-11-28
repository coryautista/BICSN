import { AportacionIndividual, AportacionCompleta, TipoFondo } from '../entities/AportacionFondo.js';
import { Prestamo } from '../entities/Prestamo.js';
import { PrestamoMedianoPlazo } from '../entities/PrestamoMedianoPlazo.js';
import { PrestamoHipotecario } from '../entities/PrestamoHipotecario.js';

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
  obtenerPeriodoAplicacion(org0: string, org1: string): Promise<string>;
  
  // Validar si el usuario puede acceder a las claves orgánicas especificadas
  validarAccesoClavesOrganicas(
    userClave0: string,
    userClave1: string,
    isEntidad: boolean,
    claveOrganica0?: string,
    claveOrganica1?: string
  ): { clave0: string; clave1: string };
}