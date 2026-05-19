import { AfiliadoPersonal } from '../entities/AfiliadoPersonal.js';

/**
 * Repository interface for AfiliadoPersonal operations
 */
export interface IAfiliadoPersonalRepository {
  /**
   * Get employee roster (plantilla) by organic keys
   * @param claveOrganica0 - First level organic key
   * @param claveOrganica1 - Second level organic key
   * @returns List of employees matching the organic keys with their latest active org_personal record
   */
  obtenerPlantilla(claveOrganica0: string, claveOrganica1: string): Promise<AfiliadoPersonal[]>;

  /**
   * Search employees in historical data
   * @param searchTerm - Optional search term (searches in RFC, CURP, INTERNO, NOEMPLEADO, FULLNAME)
   * @returns List of employees matching the search criteria with their latest org_personal record
   */
  busquedaHistorico(searchTerm?: string): Promise<AfiliadoPersonal[]>;
}
