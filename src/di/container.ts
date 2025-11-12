import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';
import { getPool as getMssqlPool } from '../db/mssql.js';
import { getFirebirdDb } from '../db/firebird.js';

// Auth Module
import { AuthRepository } from '../modules/auth/infrastructure/persistence/AuthRepository.js';
import { LoginCommand } from '../modules/auth/application/commands/LoginCommand.js';
import { RegisterCommand } from '../modules/auth/application/commands/RegisterCommand.js';
import { RefreshTokenCommand } from '../modules/auth/application/commands/RefreshTokenCommand.js';
import { LogoutAllCommand } from '../modules/auth/application/commands/LogoutAllCommand.js';
import { DenylistJwtCommand } from '../modules/auth/application/commands/DenylistJwtCommand.js';
import { GetUserByIdQuery } from '../modules/auth/application/queries/GetUserByIdQuery.js';
import { IsJtiDenylistedQuery } from '../modules/auth/application/queries/IsJtiDenylistedQuery.js';
import { GetUserRolesQuery } from '../modules/auth/application/queries/GetUserRolesQuery.js';

// Usuarios Module
import { UsuariosRepository } from '../modules/usuarios/infrastructure/persistence/UsuariosRepository.js';
import { GetAllUsuariosQuery } from '../modules/usuarios/application/queries/GetAllUsuariosQuery.js';
import { GetUsuarioByIdQuery } from '../modules/usuarios/application/queries/GetUsuarioByIdQuery.js';
import { GetUsuarioRolesQuery } from '../modules/usuarios/application/queries/GetUsuarioRolesQuery.js';
import { CreateUsuarioCommand } from '../modules/usuarios/application/commands/CreateUsuarioCommand.js';
import { UpdateUsuarioCommand } from '../modules/usuarios/application/commands/UpdateUsuarioCommand.js';
import { DeleteUsuarioCommand } from '../modules/usuarios/application/commands/DeleteUsuarioCommand.js';
import { AssignRoleCommand } from '../modules/usuarios/application/commands/AssignRoleCommand.js';
import { RemoveRoleCommand } from '../modules/usuarios/application/commands/RemoveRoleCommand.js';

// Menu Module
import { MenuRepository } from '../modules/menu/infrastructure/persistence/MenuRepository.js';
import { GetAllMenusQuery } from '../modules/menu/application/queries/GetAllMenusQuery.js';
import { GetMenuByIdQuery } from '../modules/menu/application/queries/GetMenuByIdQuery.js';
import { GetMenuHierarchyQuery } from '../modules/menu/application/queries/GetMenuHierarchyQuery.js';
import { CreateMenuCommand } from '../modules/menu/application/commands/CreateMenuCommand.js';
import { UpdateMenuCommand } from '../modules/menu/application/commands/UpdateMenuCommand.js';
import { DeleteMenuCommand } from '../modules/menu/application/commands/DeleteMenuCommand.js';

// Modulo Module
import { ModuloRepository } from '../modules/modulo/infrastructure/persistence/ModuloRepository.js';
import { GetAllModulosQuery } from '../modules/modulo/application/queries/GetAllModulosQuery.js';
import { GetModuloByIdQuery } from '../modules/modulo/application/queries/GetModuloByIdQuery.js';
import { CreateModuloCommand } from '../modules/modulo/application/commands/CreateModuloCommand.js';
import { UpdateModuloCommand } from '../modules/modulo/application/commands/UpdateModuloCommand.js';
import { DeleteModuloCommand } from '../modules/modulo/application/commands/DeleteModuloCommand.js';

// EventoCalendario Module
import { EventoCalendarioRepository } from '../modules/eventoCalendario/infrastructure/persistence/EventoCalendarioRepository.js';
import { GetAllEventoCalendariosQuery } from '../modules/eventoCalendario/application/queries/GetAllEventoCalendariosQuery.js';
import { GetEventoCalendarioByIdQuery } from '../modules/eventoCalendario/application/queries/GetEventoCalendarioByIdQuery.js';
import { GetEventoCalendariosByAnioQuery } from '../modules/eventoCalendario/application/queries/GetEventoCalendariosByAnioQuery.js';
import { GetEventoCalendariosByDateRangeQuery } from '../modules/eventoCalendario/application/queries/GetEventoCalendariosByDateRangeQuery.js';
import { CreateEventoCalendarioCommand } from '../modules/eventoCalendario/application/commands/CreateEventoCalendarioCommand.js';
import { UpdateEventoCalendarioCommand } from '../modules/eventoCalendario/application/commands/UpdateEventoCalendarioCommand.js';
import { DeleteEventoCalendarioCommand } from '../modules/eventoCalendario/application/commands/DeleteEventoCalendarioCommand.js';

// Afiliado Module
import { AfiliadoRepository } from '../modules/afiliado/infrastructure/persistence/AfiliadoRepository.js';
import { GetAllAfiliadosQuery } from '../modules/afiliado/application/queries/GetAllAfiliadosQuery.js';
import { GetAfiliadoByIdQuery } from '../modules/afiliado/application/queries/GetAfiliadoByIdQuery.js';
import { ValidateInternoInFirebirdQuery } from '../modules/afiliado/application/queries/ValidateInternoInFirebirdQuery.js';
import { GetMovimientosQuincenalesQuery } from '../modules/afiliado/application/queries/GetMovimientosQuincenalesQuery.js';
import { CreateAfiliadoCommand } from '../modules/afiliado/application/commands/CreateAfiliadoCommand.js';
import { UpdateAfiliadoCommand } from '../modules/afiliado/application/commands/UpdateAfiliadoCommand.js';
import { DeleteAfiliadoCommand } from '../modules/afiliado/application/commands/DeleteAfiliadoCommand.js';
import { CreateCompleteAfiliadoCommand } from '../modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.js';

// AfiliadoOrg Module
import { AfiliadoOrgRepository } from '../modules/afiliadoOrg/infrastructure/persistence/AfiliadoOrgRepository.js';
import { GetAllAfiliadoOrgQuery } from '../modules/afiliadoOrg/application/queries/GetAllAfiliadoOrgQuery.js';
import { GetAfiliadoOrgByIdQuery } from '../modules/afiliadoOrg/application/queries/GetAfiliadoOrgByIdQuery.js';
import { GetAfiliadoOrgByAfiliadoIdQuery } from '../modules/afiliadoOrg/application/queries/GetAfiliadoOrgByAfiliadoIdQuery.js';
import { CreateAfiliadoOrgCommand } from '../modules/afiliadoOrg/application/commands/CreateAfiliadoOrgCommand.js';
import { UpdateAfiliadoOrgCommand } from '../modules/afiliadoOrg/application/commands/UpdateAfiliadoOrgCommand.js';
import { DeleteAfiliadoOrgCommand } from '../modules/afiliadoOrg/application/commands/DeleteAfiliadoOrgCommand.js';

// Movimiento Module
import { MovimientoRepository } from '../modules/movimiento/infrastructure/persistence/MovimientoRepository.js';
import { GetAllMovimientosQuery } from '../modules/movimiento/application/queries/GetAllMovimientosQuery.js';
import { GetMovimientoByIdQuery } from '../modules/movimiento/application/queries/GetMovimientoByIdQuery.js';
import { GetMovimientosByAfiliadoIdQuery } from '../modules/movimiento/application/queries/GetMovimientosByAfiliadoIdQuery.js';
import { GetMovimientosByTipoMovimientoIdQuery } from '../modules/movimiento/application/queries/GetMovimientosByTipoMovimientoIdQuery.js';
import { CreateMovimientoCommand } from '../modules/movimiento/application/commands/CreateMovimientoCommand.js';
import { UpdateMovimientoCommand } from '../modules/movimiento/application/commands/UpdateMovimientoCommand.js';
import { DeleteMovimientoCommand } from '../modules/movimiento/application/commands/DeleteMovimientoCommand.js';

// AuditLog Module
import { AuditLogRepository } from '../modules/auditLog/infrastructure/persistence/AuditLogRepository.js';
import { GetAuditLogsByDateRangeQuery } from '../modules/auditLog/application/queries/GetAuditLogsByDateRangeQuery.js';

// CategoriaPuestoOrg Module
import { CategoriaPuestoOrgRepository } from '../modules/categoriaPuestoOrg/infrastructure/persistence/CategoriaPuestoOrgRepository.js';
import { GetAllCategoriaPuestoOrgQuery } from '../modules/categoriaPuestoOrg/application/queries/GetAllCategoriaPuestoOrgQuery.js';
import { GetCategoriaPuestoOrgByIdQuery } from '../modules/categoriaPuestoOrg/application/queries/GetCategoriaPuestoOrgByIdQuery.js';
import { CreateCategoriaPuestoOrgCommand } from '../modules/categoriaPuestoOrg/application/commands/CreateCategoriaPuestoOrgCommand.js';
import { UpdateCategoriaPuestoOrgCommand } from '../modules/categoriaPuestoOrg/application/commands/UpdateCategoriaPuestoOrgCommand.js';
import { DeleteCategoriaPuestoOrgCommand } from '../modules/categoriaPuestoOrg/application/commands/DeleteCategoriaPuestoOrgCommand.js';

// Calles Module
import { CalleRepository } from '../modules/calles/infrastructure/persistence/CalleRepository.js';
import { GetCalleByIdQuery } from '../modules/calles/application/queries/GetCalleByIdQuery.js';
import { GetCallesByColoniaQuery } from '../modules/calles/application/queries/GetCallesByColoniaQuery.js';
import { SearchCallesQuery } from '../modules/calles/application/queries/SearchCallesQuery.js';
import { CreateCalleCommand } from '../modules/calles/application/commands/CreateCalleCommand.js';
import { UpdateCalleCommand } from '../modules/calles/application/commands/UpdateCalleCommand.js';
import { DeleteCalleCommand } from '../modules/calles/application/commands/DeleteCalleCommand.js';

// CodigosPostales Module
import { CodigoPostalRepository } from '../modules/codigosPostales/infrastructure/persistence/CodigoPostalRepository.js';
import { GetAllCodigosPostalesQuery } from '../modules/codigosPostales/application/queries/GetAllCodigosPostalesQuery.js';
import { GetCodigoPostalByIdQuery } from '../modules/codigosPostales/application/queries/GetCodigoPostalByIdQuery.js';
import { GetCodigoPostalByCodeQuery } from '../modules/codigosPostales/application/queries/GetCodigoPostalByCodeQuery.js';
import { CreateCodigoPostalCommand } from '../modules/codigosPostales/application/commands/CreateCodigoPostalCommand.js';
import { UpdateCodigoPostalCommand } from '../modules/codigosPostales/application/commands/UpdateCodigoPostalCommand.js';
import { DeleteCodigoPostalCommand } from '../modules/codigosPostales/application/commands/DeleteCodigoPostalCommand.js';

// Colonias Module
import { ColoniaRepository } from '../modules/colonias/infrastructure/persistence/ColoniaRepository.js';
import { GetColoniaByIdQuery } from '../modules/colonias/application/queries/GetColoniaByIdQuery.js';
import { GetColoniasByMunicipioQuery } from '../modules/colonias/application/queries/GetColoniasByMunicipioQuery.js';
import { GetColoniasByCodigoPostalQuery } from '../modules/colonias/application/queries/GetColoniasByCodigoPostalQuery.js';
import { SearchColoniasQuery } from '../modules/colonias/application/queries/SearchColoniasQuery.js';
import { CreateColoniaCommand } from '../modules/colonias/application/commands/CreateColoniaCommand.js';

// Organica0 Module
import { Organica0Repository } from '../modules/organica0/infrastructure/persistence/Organica0Repository.js';
import { GetAllOrganica0Query } from '../modules/organica0/application/queries/GetAllOrganica0Query.js';
import { GetOrganica0ByIdQuery } from '../modules/organica0/application/queries/GetOrganica0ByIdQuery.js';
import { CreateOrganica0Command } from '../modules/organica0/application/commands/CreateOrganica0Command.js';
import { UpdateOrganica0Command } from '../modules/organica0/application/commands/UpdateOrganica0Command.js';
import { DeleteOrganica0Command } from '../modules/organica0/application/commands/DeleteOrganica0Command.js';

// Organica1 Module
import { Organica1Repository } from '../modules/organica1/infrastructure/persistence/Organica1Repository.js';
import { GetAllOrganica1Query } from '../modules/organica1/application/queries/GetAllOrganica1Query.js';
import { GetOrganica1ByIdQuery } from '../modules/organica1/application/queries/GetOrganica1ByIdQuery.js';
import { GetOrganica1ByClaveOrganica0Query } from '../modules/organica1/application/queries/GetOrganica1ByClaveOrganica0Query.js';
import { CreateOrganica1Command } from '../modules/organica1/application/commands/CreateOrganica1Command.js';
import { UpdateOrganica1Command } from '../modules/organica1/application/commands/UpdateOrganica1Command.js';
import { DeleteOrganica1Command } from '../modules/organica1/application/commands/DeleteOrganica1Command.js';

// Organica2 Module
import { Organica2Repository } from '../modules/organica2/infrastructure/persistence/Organica2Repository.js';
import { GetAllOrganica2Query } from '../modules/organica2/application/queries/GetAllOrganica2Query.js';
import { GetOrganica2ByIdQuery } from '../modules/organica2/application/queries/GetOrganica2ByIdQuery.js';
import { GetOrganica2ByClaveOrganica0And1Query } from '../modules/organica2/application/queries/GetOrganica2ByClaveOrganica0And1Query.js';
import { CreateOrganica2Command } from '../modules/organica2/application/commands/CreateOrganica2Command.js';
import { UpdateOrganica2Command } from '../modules/organica2/application/commands/UpdateOrganica2Command.js';
import { DeleteOrganica2Command } from '../modules/organica2/application/commands/DeleteOrganica2Command.js';

// Organica3 Module
import { Organica3Repository } from '../modules/organica3/infrastructure/persistence/Organica3Repository.js';
import { GetAllOrganica3Query } from '../modules/organica3/application/queries/GetAllOrganica3Query.js';
import { GetOrganica3ByIdQuery } from '../modules/organica3/application/queries/GetOrganica3ByIdQuery.js';
import { GetOrganica3ByClaveOrganica0And1And2Query } from '../modules/organica3/application/queries/GetOrganica3ByClaveOrganica0And1And2Query.js';
import { CreateOrganica3Command } from '../modules/organica3/application/commands/CreateOrganica3Command.js';
import { UpdateOrganica3Command } from '../modules/organica3/application/commands/UpdateOrganica3Command.js';
import { DeleteOrganica3Command } from '../modules/organica3/application/commands/DeleteOrganica3Command.js';

// OrganicaCascade Module
import { OrganicaCascadeRepository } from '../modules/organicaCascade/infrastructure/persistence/OrganicaCascadeRepository.js';
import { GetOrganica1ChildrenQuery } from '../modules/organicaCascade/application/queries/GetOrganica1ChildrenQuery.js';
import { GetOrganica2ChildrenQuery } from '../modules/organicaCascade/application/queries/GetOrganica2ChildrenQuery.js';
import { GetOrganica3ChildrenQuery } from '../modules/organicaCascade/application/queries/GetOrganica3ChildrenQuery.js';

// Personal Module
import { PersonalRepository } from '../modules/personal/infrastructure/persistence/PersonalRepository.js';
import { GetAllPersonalQuery } from '../modules/personal/application/queries/GetAllPersonalQuery.js';
import { GetPersonalByIdQuery } from '../modules/personal/application/queries/GetPersonalByIdQuery.js';
import { CreatePersonalCommand } from '../modules/personal/application/commands/CreatePersonalCommand.js';
import { UpdatePersonalCommand } from '../modules/personal/application/commands/UpdatePersonalCommand.js';
import { DeletePersonalCommand } from '../modules/personal/application/commands/DeletePersonalCommand.js';

// OrgPersonal Module
import { OrgPersonalRepository } from '../modules/orgPersonal/infrastructure/persistence/OrgPersonalRepository.js';
import { GetAllOrgPersonalQuery } from '../modules/orgPersonal/application/queries/GetAllOrgPersonalQuery.js';
import { GetOrgPersonalByIdQuery } from '../modules/orgPersonal/application/queries/GetOrgPersonalByIdQuery.js';
import { GetOrgPersonalBySearchQuery } from '../modules/orgPersonal/application/queries/GetOrgPersonalBySearchQuery.js';
import { CreateOrgPersonalCommand } from '../modules/orgPersonal/application/commands/CreateOrgPersonalCommand.js';
import { UpdateOrgPersonalCommand } from '../modules/orgPersonal/application/commands/UpdateOrgPersonalCommand.js';
import { DeleteOrgPersonalCommand } from '../modules/orgPersonal/application/commands/DeleteOrgPersonalCommand.js';
import { UpdateColoniaCommand } from '../modules/colonias/application/commands/UpdateColoniaCommand.js';
import { DeleteColoniaCommand } from '../modules/colonias/application/commands/DeleteColoniaCommand.js';

// Estados Module
import { EstadoRepository } from '../modules/estados/infrastructure/persistence/EstadoRepository.js';
import { GetAllEstadosQuery } from '../modules/estados/application/queries/GetAllEstadosQuery.js';
import { GetEstadoByIdQuery } from '../modules/estados/application/queries/GetEstadoByIdQuery.js';
import { CreateEstadoCommand } from '../modules/estados/application/commands/CreateEstadoCommand.js';
import { UpdateEstadoCommand } from '../modules/estados/application/commands/UpdateEstadoCommand.js';
import { DeleteEstadoCommand } from '../modules/estados/application/commands/DeleteEstadoCommand.js';

// Info Module
import { InfoRepository } from '../modules/info/infrastructure/persistence/InfoRepository.js';
import { GetAllInfosQuery } from '../modules/info/application/queries/GetAllInfosQuery.js';
import { GetInfoByIdQuery } from '../modules/info/application/queries/GetInfoByIdQuery.js';
import { CreateInfoCommand } from '../modules/info/application/commands/CreateInfoCommand.js';
import { UpdateInfoCommand } from '../modules/info/application/commands/UpdateInfoCommand.js';
import { DeleteInfoCommand } from '../modules/info/application/commands/DeleteInfoCommand.js';

// Log Module
import { LogRepository } from '../modules/log/infrastructure/persistence/LogRepository.js';
import { GetLogStatsQuery } from '../modules/log/application/queries/GetLogStatsQuery.js';
import { GetLogContentQuery } from '../modules/log/application/queries/GetLogContentQuery.js';
import { SearchLogsQuery } from '../modules/log/application/queries/SearchLogsQuery.js';
import { CleanupLogsCommand } from '../modules/log/application/commands/CleanupLogsCommand.js';
import { ArchiveLogsCommand } from '../modules/log/application/commands/ArchiveLogsCommand.js';

// Municipios Module
import { MunicipioRepository } from '../modules/municipios/infrastructure/persistence/MunicipioRepository.js';
import { GetAllMunicipiosQuery } from '../modules/municipios/application/queries/GetAllMunicipiosQuery.js';
import { GetMunicipiosByEstadoQuery } from '../modules/municipios/application/queries/GetMunicipiosByEstadoQuery.js';
import { GetMunicipioByIdQuery } from '../modules/municipios/application/queries/GetMunicipioByIdQuery.js';
import { CreateMunicipioCommand } from '../modules/municipios/application/commands/CreateMunicipioCommand.js';
import { UpdateMunicipioCommand } from '../modules/municipios/application/commands/UpdateMunicipioCommand.js';
import { DeleteMunicipioCommand } from '../modules/municipios/application/commands/DeleteMunicipioCommand.js';

// Proceso Module
import { ProcesoRepository } from '../modules/proceso/infrastructure/persistence/ProcesoRepository.js';
import { GetAllProcesosQuery } from '../modules/proceso/application/queries/GetAllProcesosQuery.js';
import { GetProcesoByIdQuery } from '../modules/proceso/application/queries/GetProcesoByIdQuery.js';
import { CreateProcesoCommand } from '../modules/proceso/application/commands/CreateProcesoCommand.js';
import { UpdateProcesoCommand } from '../modules/proceso/application/commands/UpdateProcesoCommand.js';
import { DeleteProcesoCommand } from '../modules/proceso/application/commands/DeleteProcesoCommand.js';

// Role Module
import { RoleRepository } from '../modules/role/infrastructure/persistence/RoleRepository.js';
import { GetAllRolesQuery } from '../modules/role/application/queries/GetAllRolesQuery.js';
import { GetRoleByNameQuery } from '../modules/role/application/queries/GetRoleByNameQuery.js';
import { CreateRoleCommand } from '../modules/role/application/commands/CreateRoleCommand.js';
import { AssignRoleCommand as AssignRoleToUserCommand } from '../modules/role/application/commands/AssignRoleCommand.js';
import { UnassignRoleCommand } from '../modules/role/application/commands/UnassignRoleCommand.js';
import { getUserRoles } from '../modules/auth/auth.repo.js';

// UserRole Module
import { UserRoleRepository } from '../modules/userRole/infrastructure/persistence/UserRoleRepository.js';
import { GetAllUserRolesQuery } from '../modules/userRole/application/queries/GetAllUserRolesQuery.js';
import { GetUserRoleByIdsQuery } from '../modules/userRole/application/queries/GetUserRoleByIdsQuery.js';
import { GetUserRolesByUsuarioQuery } from '../modules/userRole/application/queries/GetUserRolesByUsuarioQuery.js';
import { CreateUserRoleCommand } from '../modules/userRole/application/commands/CreateUserRoleCommand.js';
import { DeleteUserRoleCommand } from '../modules/userRole/application/commands/DeleteUserRoleCommand.js';

// RoleMenu Module
import { RoleMenuRepository } from '../modules/roleMenu/infrastructure/persistence/RoleMenuRepository.js';
import { GetAllRoleMenusQuery } from '../modules/roleMenu/application/queries/GetAllRoleMenusQuery.js';
import { GetRoleMenuByIdQuery } from '../modules/roleMenu/application/queries/GetRoleMenuByIdQuery.js';
import { GetRoleMenusByRoleIdQuery } from '../modules/roleMenu/application/queries/GetRoleMenusByRoleIdQuery.js';
import { GetRoleMenusByTokenRolesQuery } from '../modules/roleMenu/application/queries/GetRoleMenusByTokenRolesQuery.js';
import { CreateRoleMenuCommand } from '../modules/roleMenu/application/commands/CreateRoleMenuCommand.js';
import { UpdateRoleMenuCommand } from '../modules/roleMenu/application/commands/UpdateRoleMenuCommand.js';
import { DeleteRoleMenuCommand } from '../modules/roleMenu/application/commands/DeleteRoleMenuCommand.js';
import { AssignMenuToRoleCommand } from '../modules/roleMenu/application/commands/AssignMenuToRoleCommand.js';
import { UnassignMenuFromRoleCommand } from '../modules/roleMenu/application/commands/UnassignMenuFromRoleCommand.js';

// TipoMovimiento Module
import { TipoMovimientoRepository } from '../modules/tipoMovimiento/infrastructure/persistence/TipoMovimientoRepository.js';
import { GetAllTipoMovimientosQuery } from '../modules/tipoMovimiento/application/queries/GetAllTipoMovimientosQuery.js';
import { GetTipoMovimientoByIdQuery } from '../modules/tipoMovimiento/application/queries/GetTipoMovimientoByIdQuery.js';
import { CreateTipoMovimientoCommand } from '../modules/tipoMovimiento/application/commands/CreateTipoMovimientoCommand.js';
import { UpdateTipoMovimientoCommand } from '../modules/tipoMovimiento/application/commands/UpdateTipoMovimientoCommand.js';
import { DeleteTipoMovimientoCommand } from '../modules/tipoMovimiento/application/commands/DeleteTipoMovimientoCommand.js';

// AfectacionOrg Module
import { BitacoraAfectacionRepository } from '../modules/afectacionOrg/infrastructure/persistence/BitacoraAfectacionRepository.js';
import { EstadoAfectacionRepository } from '../modules/afectacionOrg/infrastructure/persistence/EstadoAfectacionRepository.js';
import { ProgresoUsuarioRepository } from '../modules/afectacionOrg/infrastructure/persistence/ProgresoUsuarioRepository.js';
import { TableroAfectacionRepository } from '../modules/afectacionOrg/infrastructure/persistence/TableroAfectacionRepository.js';
import { UltimaAfectacionRepository } from '../modules/afectacionOrg/infrastructure/persistence/UltimaAfectacionRepository.js';
import { QuincenaRepository } from '../modules/afectacionOrg/infrastructure/persistence/QuincenaRepository.js';
import { AfectacionRepository } from '../modules/afectacionOrg/infrastructure/persistence/AfectacionRepository.js';
import { GetBitacoraAfectacionQuery } from '../modules/afectacionOrg/application/queries/GetBitacoraAfectacionQuery.js';
import { GetEstadosAfectacionQuery } from '../modules/afectacionOrg/application/queries/GetEstadosAfectacionQuery.js';
import { GetProgresoUsuarioQuery } from '../modules/afectacionOrg/application/queries/GetProgresoUsuarioQuery.js';
import { GetTableroAfectacionQuery } from '../modules/afectacionOrg/application/queries/GetTableroAfectacionQuery.js';
import { GetUltimaAfectacionQuery } from '../modules/afectacionOrg/application/queries/GetUltimaAfectacionQuery.js';
import { GetQuincenaAltaAfectacionQuery } from '../modules/afectacionOrg/application/queries/GetQuincenaAltaAfectacionQuery.js';
import { RegistrarAfectacionCommand } from '../modules/afectacionOrg/application/commands/RegistrarAfectacionCommand.js';

// Expediente Module
import { DocumentTypeRepository } from '../modules/expediente/infrastructure/persistence/DocumentTypeRepository.js';
import { ExpedienteRepository } from '../modules/expediente/infrastructure/persistence/ExpedienteRepository.js';
import { ExpedienteArchivoRepository } from '../modules/expediente/infrastructure/persistence/ExpedienteArchivoRepository.js';
import { GetAllDocumentTypesQuery } from '../modules/expediente/application/queries/GetAllDocumentTypesQuery.js';
import { GetDocumentTypeByIdQuery } from '../modules/expediente/application/queries/GetDocumentTypeByIdQuery.js';
import { GetDocumentTypeByCodeQuery } from '../modules/expediente/application/queries/GetDocumentTypeByCodeQuery.js';
import { GetAllExpedientesQuery } from '../modules/expediente/application/queries/GetAllExpedientesQuery.js';
import { GetExpedienteByCurpQuery } from '../modules/expediente/application/queries/GetExpedienteByCurpQuery.js';
import { GetExpedienteArchivoByIdQuery } from '../modules/expediente/application/queries/GetExpedienteArchivoByIdQuery.js';
import { GetExpedienteArchivosByCurpQuery } from '../modules/expediente/application/queries/GetExpedienteArchivosByCurpQuery.js';
import { CreateDocumentTypeCommand } from '../modules/expediente/application/commands/CreateDocumentTypeCommand.js';
import { UpdateDocumentTypeCommand } from '../modules/expediente/application/commands/UpdateDocumentTypeCommand.js';
import { DeleteDocumentTypeCommand } from '../modules/expediente/application/commands/DeleteDocumentTypeCommand.js';
import { CreateExpedienteCommand } from '../modules/expediente/application/commands/CreateExpedienteCommand.js';
import { UpdateExpedienteCommand } from '../modules/expediente/application/commands/UpdateExpedienteCommand.js';
import { DeleteExpedienteCommand } from '../modules/expediente/application/commands/DeleteExpedienteCommand.js';
import { CreateExpedienteArchivoCommand } from '../modules/expediente/application/commands/CreateExpedienteArchivoCommand.js';
import { UpdateExpedienteArchivoCommand } from '../modules/expediente/application/commands/UpdateExpedienteArchivoCommand.js';
import { DeleteExpedienteArchivoCommand } from '../modules/expediente/application/commands/DeleteExpedienteArchivoCommand.js';

// AfiliadosPersonal Module
import { AfiliadoPersonalRepository } from '../modules/afiliadosPersonal/infrastructure/persistence/AfiliadoPersonalRepository.js';
import { GetPlantillaQuery } from '../modules/afiliadosPersonal/application/queries/GetPlantillaQuery.js';
import { BusquedaHistoricoQuery } from '../modules/afiliadosPersonal/application/queries/BusquedaHistoricoQuery.js';

/**
 * Application-wide Dependency Injection Container
 * Uses Awilix for automatic dependency injection
 */
export const container = createContainer({ 
  injectionMode: InjectionMode.CLASSIC // CLASSIC mode allows injection by parameter name
});

// Register dependencies
container.register({
  // ============================================================================
  // INFRASTRUCTURE LAYER
  // ============================================================================
  
  // Database Pools (Singleton - shared across the application)
  mssqlPool: asFunction(getMssqlPool).singleton(),
  firebirdDb: asFunction(getFirebirdDb).singleton(),
  
  // ============================================================================
  // AUTH MODULE
  // ============================================================================
  
  // Repositories (Scoped - new instance per request)
  authRepo: asClass(AuthRepository).scoped(),
  
  // Commands (Scoped)
  loginCommand: asClass(LoginCommand).scoped(),
  registerCommand: asClass(RegisterCommand).scoped(),
  refreshTokenCommand: asClass(RefreshTokenCommand).scoped(),
  logoutAllCommand: asClass(LogoutAllCommand).scoped(),
  denylistJwtCommand: asClass(DenylistJwtCommand).scoped(),
  
  // Queries (Scoped)
  getUserByIdQuery: asClass(GetUserByIdQuery).scoped(),
  isJtiDenylistedQuery: asClass(IsJtiDenylistedQuery).scoped(),
  getUserRolesQuery: asClass(GetUserRolesQuery).scoped(),
  
  // ============================================================================
  // USUARIOS MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  usuariosRepo: asClass(UsuariosRepository).scoped(),
  
  // Queries (Scoped)
  getAllUsuariosQuery: asClass(GetAllUsuariosQuery).scoped(),
  getUsuarioByIdQuery: asClass(GetUsuarioByIdQuery).scoped(),
  getUsuarioRolesQuery: asClass(GetUsuarioRolesQuery).scoped(),
  
  // Commands (Scoped)
  createUsuarioCommand: asClass(CreateUsuarioCommand).scoped(),
  updateUsuarioCommand: asClass(UpdateUsuarioCommand).scoped(),
  deleteUsuarioCommand: asClass(DeleteUsuarioCommand).scoped(),
  assignRoleCommand: asClass(AssignRoleCommand).scoped(),
  removeRoleCommand: asClass(RemoveRoleCommand).scoped(),
  
  // ============================================================================
  // MENU MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  menuRepo: asClass(MenuRepository).scoped(),
  
  // Queries (Scoped)
  getAllMenusQuery: asClass(GetAllMenusQuery).scoped(),
  getMenuByIdQuery: asClass(GetMenuByIdQuery).scoped(),
  getMenuHierarchyQuery: asClass(GetMenuHierarchyQuery).scoped(),
  
  // Commands (Scoped)
  createMenuCommand: asClass(CreateMenuCommand).scoped(),
  updateMenuCommand: asClass(UpdateMenuCommand).scoped(),
  deleteMenuCommand: asClass(DeleteMenuCommand).scoped(),
  
  // ============================================================================
  // MODULO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  moduloRepo: asClass(ModuloRepository).scoped(),
  
  // Queries (Scoped)
  getAllModulosQuery: asClass(GetAllModulosQuery).scoped(),
  getModuloByIdQuery: asClass(GetModuloByIdQuery).scoped(),
  
  // Commands (Scoped)
  createModuloCommand: asClass(CreateModuloCommand).scoped(),
  updateModuloCommand: asClass(UpdateModuloCommand).scoped(),
  deleteModuloCommand: asClass(DeleteModuloCommand).scoped(),
  
  // ============================================================================
  // EVENTO CALENDARIO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  eventoCalendarioRepo: asClass(EventoCalendarioRepository).scoped(),
  
  // Queries (Scoped)
  getAllEventoCalendariosQuery: asClass(GetAllEventoCalendariosQuery).scoped(),
  getEventoCalendarioByIdQuery: asClass(GetEventoCalendarioByIdQuery).scoped(),
  getEventoCalendariosByAnioQuery: asClass(GetEventoCalendariosByAnioQuery).scoped(),
  getEventoCalendariosByDateRangeQuery: asClass(GetEventoCalendariosByDateRangeQuery).scoped(),
  
  // Commands (Scoped)
  createEventoCalendarioCommand: asClass(CreateEventoCalendarioCommand).scoped(),
  updateEventoCalendarioCommand: asClass(UpdateEventoCalendarioCommand).scoped(),
  deleteEventoCalendarioCommand: asClass(DeleteEventoCalendarioCommand).scoped(),
  
  // ============================================================================
  // AFILIADO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  afiliadoRepo: asClass(AfiliadoRepository).scoped(),
  
  // Queries (Scoped)
  getAllAfiliadosQuery: asClass(GetAllAfiliadosQuery).scoped(),
  getAfiliadoByIdQuery: asClass(GetAfiliadoByIdQuery).scoped(),
  validateInternoInFirebirdQuery: asClass(ValidateInternoInFirebirdQuery).scoped(),
  getMovimientosQuincenalesQuery: asClass(GetMovimientosQuincenalesQuery).scoped(),
  
  // Commands (Scoped)
  createAfiliadoCommand: asClass(CreateAfiliadoCommand).scoped(),
  updateAfiliadoCommand: asClass(UpdateAfiliadoCommand).scoped(),
  deleteAfiliadoCommand: asClass(DeleteAfiliadoCommand).scoped(),
  createCompleteAfiliadoCommand: asClass(CreateCompleteAfiliadoCommand).scoped(),
  
  // ============================================================================
  // AFILIADO ORG MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  afiliadoOrgRepo: asClass(AfiliadoOrgRepository).scoped(),
  
  // Queries (Scoped)
  getAllAfiliadoOrgQuery: asClass(GetAllAfiliadoOrgQuery).scoped(),
  getAfiliadoOrgByIdQuery: asClass(GetAfiliadoOrgByIdQuery).scoped(),
  getAfiliadoOrgByAfiliadoIdQuery: asClass(GetAfiliadoOrgByAfiliadoIdQuery).scoped(),
  
  // Commands (Scoped)
  createAfiliadoOrgCommand: asClass(CreateAfiliadoOrgCommand).scoped(),
  updateAfiliadoOrgCommand: asClass(UpdateAfiliadoOrgCommand).scoped(),
  deleteAfiliadoOrgCommand: asClass(DeleteAfiliadoOrgCommand).scoped(),
  
  // ============================================================================
  // MOVIMIENTO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  movimientoRepo: asClass(MovimientoRepository).scoped(),
  
  // Queries (Scoped)
  getAllMovimientosQuery: asClass(GetAllMovimientosQuery).scoped(),
  getMovimientoByIdQuery: asClass(GetMovimientoByIdQuery).scoped(),
  getMovimientosByAfiliadoIdQuery: asClass(GetMovimientosByAfiliadoIdQuery).scoped(),
  getMovimientosByTipoMovimientoIdQuery: asClass(GetMovimientosByTipoMovimientoIdQuery).scoped(),
  
  // Commands (Scoped)
  createMovimientoCommand: asClass(CreateMovimientoCommand).scoped(),
  updateMovimientoCommand: asClass(UpdateMovimientoCommand).scoped(),
  deleteMovimientoCommand: asClass(DeleteMovimientoCommand).scoped(),
  
  // ============================================================================
  // AUDIT LOG MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  auditLogRepo: asClass(AuditLogRepository).scoped(),
  
  // Queries (Scoped)
  getAuditLogsByDateRangeQuery: asClass(GetAuditLogsByDateRangeQuery).scoped(),
  
  // ============================================================================
  // CATEGORIA PUESTO ORG MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  categoriaPuestoOrgRepo: asClass(CategoriaPuestoOrgRepository).scoped(),
  
  // Queries (Scoped)
  getAllCategoriaPuestoOrgQuery: asClass(GetAllCategoriaPuestoOrgQuery).scoped(),
  getCategoriaPuestoOrgByIdQuery: asClass(GetCategoriaPuestoOrgByIdQuery).scoped(),
  
  // Commands (Scoped)
  createCategoriaPuestoOrgCommand: asClass(CreateCategoriaPuestoOrgCommand).scoped(),
  updateCategoriaPuestoOrgCommand: asClass(UpdateCategoriaPuestoOrgCommand).scoped(),
  deleteCategoriaPuestoOrgCommand: asClass(DeleteCategoriaPuestoOrgCommand).scoped(),
  
  // ============================================================================
  // CALLES MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  calleRepo: asClass(CalleRepository).scoped(),
  
  // Queries (Scoped)
  getCalleByIdQuery: asClass(GetCalleByIdQuery).scoped(),
  getCallesByColoniaQuery: asClass(GetCallesByColoniaQuery).scoped(),
  searchCallesQuery: asClass(SearchCallesQuery).scoped(),
  
  // Commands (Scoped)
  createCalleCommand: asClass(CreateCalleCommand).scoped(),
  updateCalleCommand: asClass(UpdateCalleCommand).scoped(),
  deleteCalleCommand: asClass(DeleteCalleCommand).scoped(),
  
  // ============================================================================
  // CODIGOS POSTALES MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  codigoPostalRepo: asClass(CodigoPostalRepository).scoped(),
  
  // Queries (Scoped)
  getAllCodigosPostalesQuery: asClass(GetAllCodigosPostalesQuery).scoped(),
  getCodigoPostalByIdQuery: asClass(GetCodigoPostalByIdQuery).scoped(),
  getCodigoPostalByCodeQuery: asClass(GetCodigoPostalByCodeQuery).scoped(),
  
  // Commands (Scoped)
  createCodigoPostalCommand: asClass(CreateCodigoPostalCommand).scoped(),
  updateCodigoPostalCommand: asClass(UpdateCodigoPostalCommand).scoped(),
  deleteCodigoPostalCommand: asClass(DeleteCodigoPostalCommand).scoped(),
  
  // ============================================================================
  // COLONIAS MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  coloniaRepo: asClass(ColoniaRepository).scoped(),
  
  // Queries (Scoped)
  getColoniaByIdQuery: asClass(GetColoniaByIdQuery).scoped(),
  getColoniasByMunicipioQuery: asClass(GetColoniasByMunicipioQuery).scoped(),
  getColoniasByCodigoPostalQuery: asClass(GetColoniasByCodigoPostalQuery).scoped(),
  searchColoniasQuery: asClass(SearchColoniasQuery).scoped(),
  
  // Commands (Scoped)
  createColoniaCommand: asClass(CreateColoniaCommand).scoped(),
  updateColoniaCommand: asClass(UpdateColoniaCommand).scoped(),
  deleteColoniaCommand: asClass(DeleteColoniaCommand).scoped(),
  
  // ============================================================================
  // ESTADOS MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  estadoRepo: asClass(EstadoRepository).scoped(),
  
  // Queries (Scoped)
  getAllEstadosQuery: asClass(GetAllEstadosQuery).scoped(),
  getEstadoByIdQuery: asClass(GetEstadoByIdQuery).scoped(),
  
  // Commands (Scoped)
  createEstadoCommand: asClass(CreateEstadoCommand).scoped(),
  updateEstadoCommand: asClass(UpdateEstadoCommand).scoped(),
  deleteEstadoCommand: asClass(DeleteEstadoCommand).scoped(),
  
  // ============================================================================
  // INFO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  infoRepo: asClass(InfoRepository).scoped(),
  
  // Queries (Scoped)
  getAllInfosQuery: asClass(GetAllInfosQuery).scoped(),
  getInfoByIdQuery: asClass(GetInfoByIdQuery).scoped(),
  
  // Commands (Scoped)
  createInfoCommand: asClass(CreateInfoCommand).scoped(),
  updateInfoCommand: asClass(UpdateInfoCommand).scoped(),
  deleteInfoCommand: asClass(DeleteInfoCommand).scoped(),
  
  // ============================================================================
  // LOG MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  logRepo: asClass(LogRepository).scoped(),
  
  // Queries (Scoped)
  getLogStatsQuery: asClass(GetLogStatsQuery).scoped(),
  getLogContentQuery: asClass(GetLogContentQuery).scoped(),
  searchLogsQuery: asClass(SearchLogsQuery).scoped(),
  
  // Commands (Scoped)
  cleanupLogsCommand: asClass(CleanupLogsCommand).scoped(),
  archiveLogsCommand: asClass(ArchiveLogsCommand).scoped(),
  
  // ============================================================================
  // MUNICIPIOS MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  municipioRepo: asClass(MunicipioRepository).scoped(),
  
  // Queries (Scoped)
  getAllMunicipiosQuery: asClass(GetAllMunicipiosQuery).scoped(),
  getMunicipiosByEstadoQuery: asClass(GetMunicipiosByEstadoQuery).scoped(),
  getMunicipioByIdQuery: asClass(GetMunicipioByIdQuery).scoped(),
  
  // Commands (Scoped)
  createMunicipioCommand: asClass(CreateMunicipioCommand).scoped(),
  updateMunicipioCommand: asClass(UpdateMunicipioCommand).scoped(),
  deleteMunicipioCommand: asClass(DeleteMunicipioCommand).scoped(),
  
  // ============================================================================
  // PROCESO MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  procesoRepo: asClass(ProcesoRepository).scoped(),
  
  // Queries (Scoped)
  getAllProcesosQuery: asClass(GetAllProcesosQuery).scoped(),
  getProcesoByIdQuery: asClass(GetProcesoByIdQuery).scoped(),
  
  // Commands (Scoped)
  createProcesoCommand: asClass(CreateProcesoCommand).scoped(),
  updateProcesoCommand: asClass(UpdateProcesoCommand).scoped(),
  deleteProcesoCommand: asClass(DeleteProcesoCommand).scoped(),
  
  // ============================================================================
  // ROLE MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  roleRepo: asClass(RoleRepository).scoped(),
  
  // Queries (Scoped)
  getAllRolesQuery: asClass(GetAllRolesQuery).scoped(),
  getRoleByNameQuery: asClass(GetRoleByNameQuery).scoped(),
  
  // Commands (Scoped)
  createRoleCommand: asClass(CreateRoleCommand).scoped(),
  assignRoleToUserCommand: asClass(AssignRoleToUserCommand).scoped(),
  unassignRoleCommand: asClass(UnassignRoleCommand).scoped(),
  
  // Helper functions (Function)
  getUserRoles: asFunction(() => getUserRoles).scoped(),
  
  // ============================================================================
  // USERROLE MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  userRoleRepo: asClass(UserRoleRepository).scoped(),
  
  // Queries (Scoped)
  getAllUserRolesQuery: asClass(GetAllUserRolesQuery).scoped(),
  getUserRoleByIdsQuery: asClass(GetUserRoleByIdsQuery).scoped(),
  getUserRolesByUsuarioQuery: asClass(GetUserRolesByUsuarioQuery).scoped(),
  
  // Commands (Scoped)
  createUserRoleCommand: asClass(CreateUserRoleCommand).scoped(),
  deleteUserRoleCommand: asClass(DeleteUserRoleCommand).scoped(),
  
  // ============================================================================
  // ROLEMENU MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  roleMenuRepo: asClass(RoleMenuRepository).scoped(),
  tipoMovimientoRepo: asClass(TipoMovimientoRepository).scoped(),
  
  // Queries (Scoped)
  getAllRoleMenusQuery: asClass(GetAllRoleMenusQuery).scoped(),
  getRoleMenuByIdQuery: asClass(GetRoleMenuByIdQuery).scoped(),
  getRoleMenusByRoleIdQuery: asClass(GetRoleMenusByRoleIdQuery).scoped(),
  getRoleMenusByTokenRolesQuery: asClass(GetRoleMenusByTokenRolesQuery).scoped(),
  getAllTipoMovimientosQuery: asClass(GetAllTipoMovimientosQuery).scoped(),
  getTipoMovimientoByIdQuery: asClass(GetTipoMovimientoByIdQuery).scoped(),
  
  // Commands (Scoped)
  createRoleMenuCommand: asClass(CreateRoleMenuCommand).scoped(),
  updateRoleMenuCommand: asClass(UpdateRoleMenuCommand).scoped(),
  deleteRoleMenuCommand: asClass(DeleteRoleMenuCommand).scoped(),
  assignMenuToRoleCommand: asClass(AssignMenuToRoleCommand).scoped(),
  unassignMenuFromRoleCommand: asClass(UnassignMenuFromRoleCommand).scoped(),
  createTipoMovimientoCommand: asClass(CreateTipoMovimientoCommand).scoped(),
  updateTipoMovimientoCommand: asClass(UpdateTipoMovimientoCommand).scoped(),
  deleteTipoMovimientoCommand: asClass(DeleteTipoMovimientoCommand).scoped(),
  
  // ============================================================================
  // AFECTACIONORG MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  bitacoraAfectacionRepo: asClass(BitacoraAfectacionRepository).scoped(),
  estadoAfectacionRepo: asClass(EstadoAfectacionRepository).scoped(),
  progresoUsuarioRepo: asClass(ProgresoUsuarioRepository).scoped(),
  tableroAfectacionRepo: asClass(TableroAfectacionRepository).scoped(),
  ultimaAfectacionRepo: asClass(UltimaAfectacionRepository).scoped(),
  quincenaRepo: asClass(QuincenaRepository).scoped(),
  afectacionRepo: asClass(AfectacionRepository).scoped(),
  
  // Queries (Scoped)
  getBitacoraAfectacionQuery: asClass(GetBitacoraAfectacionQuery).scoped(),
  getEstadosAfectacionQuery: asClass(GetEstadosAfectacionQuery).scoped(),
  getProgresoUsuarioQuery: asClass(GetProgresoUsuarioQuery).scoped(),
  getTableroAfectacionQuery: asClass(GetTableroAfectacionQuery).scoped(),
  getUltimaAfectacionQuery: asClass(GetUltimaAfectacionQuery).scoped(),
  getQuincenaAltaAfectacionQuery: asClass(GetQuincenaAltaAfectacionQuery).scoped(),
  
  // Commands (Scoped)
  registrarAfectacionCommand: asClass(RegistrarAfectacionCommand).scoped(),
  
  // ============================================================================
  // EXPEDIENTE MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  documentTypeRepo: asClass(DocumentTypeRepository).scoped(),
  expedienteRepo: asClass(ExpedienteRepository).scoped(),
  expedienteArchivoRepo: asClass(ExpedienteArchivoRepository).scoped(),
  
  // Queries (Scoped)
  getAllDocumentTypesQuery: asClass(GetAllDocumentTypesQuery).scoped(),
  getDocumentTypeByIdQuery: asClass(GetDocumentTypeByIdQuery).scoped(),
  getDocumentTypeByCodeQuery: asClass(GetDocumentTypeByCodeQuery).scoped(),
  getAllExpedientesQuery: asClass(GetAllExpedientesQuery).scoped(),
  getExpedienteByCurpQuery: asClass(GetExpedienteByCurpQuery).scoped(),
  getExpedienteArchivoByIdQuery: asClass(GetExpedienteArchivoByIdQuery).scoped(),
  getExpedienteArchivosByCurpQuery: asClass(GetExpedienteArchivosByCurpQuery).scoped(),
  
  // Commands (Scoped)
  createDocumentTypeCommand: asClass(CreateDocumentTypeCommand).scoped(),
  updateDocumentTypeCommand: asClass(UpdateDocumentTypeCommand).scoped(),
  deleteDocumentTypeCommand: asClass(DeleteDocumentTypeCommand).scoped(),
  createExpedienteCommand: asClass(CreateExpedienteCommand).scoped(),
  updateExpedienteCommand: asClass(UpdateExpedienteCommand).scoped(),
  deleteExpedienteCommand: asClass(DeleteExpedienteCommand).scoped(),
  createExpedienteArchivoCommand: asClass(CreateExpedienteArchivoCommand).scoped(),
  updateExpedienteArchivoCommand: asClass(UpdateExpedienteArchivoCommand).scoped(),
  deleteExpedienteArchivoCommand: asClass(DeleteExpedienteArchivoCommand).scoped(),

  // ============================================================================
  // AFILIADOS PERSONAL MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  afiliadoPersonalRepo: asClass(AfiliadoPersonalRepository).scoped(),
  
  // Queries (Scoped)
  getPlantillaQuery: asClass(GetPlantillaQuery).scoped(),
  busquedaHistoricoQuery: asClass(BusquedaHistoricoQuery).scoped(),

  // ============================================================================
  // ORGANICA0 MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  organica0Repo: asClass(Organica0Repository).scoped(),
  
  // Queries (Scoped)
  getAllOrganica0Query: asClass(GetAllOrganica0Query).scoped(),
  getOrganica0ByIdQuery: asClass(GetOrganica0ByIdQuery).scoped(),
  
  // Commands (Scoped)
  createOrganica0Command: asClass(CreateOrganica0Command).scoped(),
  updateOrganica0Command: asClass(UpdateOrganica0Command).scoped(),
  deleteOrganica0Command: asClass(DeleteOrganica0Command).scoped(),

  // ============================================================================
  // ORGANICA1 MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  organica1Repo: asClass(Organica1Repository).scoped(),
  
  // Queries (Scoped)
  getAllOrganica1Query: asClass(GetAllOrganica1Query).scoped(),
  getOrganica1ByIdQuery: asClass(GetOrganica1ByIdQuery).scoped(),
  getOrganica1ByClaveOrganica0Query: asClass(GetOrganica1ByClaveOrganica0Query).scoped(),
  
  // Commands (Scoped)
  createOrganica1Command: asClass(CreateOrganica1Command).scoped(),
  updateOrganica1Command: asClass(UpdateOrganica1Command).scoped(),
  deleteOrganica1Command: asClass(DeleteOrganica1Command).scoped(),

  // ============================================================================
  // ORGANICA2 MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  organica2Repo: asClass(Organica2Repository).scoped(),
  
  // Queries (Scoped)
  getAllOrganica2Query: asClass(GetAllOrganica2Query).scoped(),
  getOrganica2ByIdQuery: asClass(GetOrganica2ByIdQuery).scoped(),
  getOrganica2ByClaveOrganica0And1Query: asClass(GetOrganica2ByClaveOrganica0And1Query).scoped(),
  
  // Commands (Scoped)
  createOrganica2Command: asClass(CreateOrganica2Command).scoped(),
  updateOrganica2Command: asClass(UpdateOrganica2Command).scoped(),
  deleteOrganica2Command: asClass(DeleteOrganica2Command).scoped(),

  // ============================================================================
  // ORGANICA3 MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  organica3Repo: asClass(Organica3Repository).scoped(),
  
  // Queries (Scoped)
  getAllOrganica3Query: asClass(GetAllOrganica3Query).scoped(),
  getOrganica3ByIdQuery: asClass(GetOrganica3ByIdQuery).scoped(),
  getOrganica3ByClaveOrganica0And1And2Query: asClass(GetOrganica3ByClaveOrganica0And1And2Query).scoped(),
  
  // Commands (Scoped)
  createOrganica3Command: asClass(CreateOrganica3Command).scoped(),
  updateOrganica3Command: asClass(UpdateOrganica3Command).scoped(),
  deleteOrganica3Command: asClass(DeleteOrganica3Command).scoped(),

  // ============================================================================
  // ORGANICA CASCADE MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  organicaCascadeRepo: asClass(OrganicaCascadeRepository).scoped(),
  
  // Queries (Scoped)
  getOrganica1ChildrenQuery: asClass(GetOrganica1ChildrenQuery).scoped(),
  getOrganica2ChildrenQuery: asClass(GetOrganica2ChildrenQuery).scoped(),
  getOrganica3ChildrenQuery: asClass(GetOrganica3ChildrenQuery).scoped(),

  // ============================================================================
  // PERSONAL MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  personalRepo: asClass(PersonalRepository).scoped(),
  
  // Queries (Scoped)
  getAllPersonalQuery: asClass(GetAllPersonalQuery).scoped(),
  getPersonalByIdQuery: asClass(GetPersonalByIdQuery).scoped(),
  
  // Commands (Scoped)
  createPersonalCommand: asClass(CreatePersonalCommand).scoped(),
  updatePersonalCommand: asClass(UpdatePersonalCommand).scoped(),
  deletePersonalCommand: asClass(DeletePersonalCommand).scoped(),

  // ============================================================================
  // ORG_PERSONAL MODULE
  // ============================================================================
  
  // Repositories (Scoped)
  orgPersonalRepo: asClass(OrgPersonalRepository).scoped(),
  
  // Queries (Scoped)
  getAllOrgPersonalQuery: asClass(GetAllOrgPersonalQuery).scoped(),
  getOrgPersonalByIdQuery: asClass(GetOrgPersonalByIdQuery).scoped(),
  getOrgPersonalBySearchQuery: asClass(GetOrgPersonalBySearchQuery).scoped(),
  
  // Commands (Scoped)
  createOrgPersonalCommand: asClass(CreateOrgPersonalCommand).scoped(),
  updateOrgPersonalCommand: asClass(UpdateOrgPersonalCommand).scoped(),
  deleteOrgPersonalCommand: asClass(DeleteOrgPersonalCommand).scoped()
});

/**
 * Lifetime explanation:
 * 
 * - SINGLETON: One instance shared across the entire application
 *   - Database pools (expensive to create, should be reused)
 * 
 * - SCOPED: New instance per request (per HTTP request in Fastify)
 *   - Repositories (stateless, but request-specific)
 *   - Commands & Queries (encapsulate single operations)
 *   - Services (orchestrate commands/queries)
 * 
 * - TRANSIENT: New instance every time (not used here)
 *   - Would be used for lightweight, stateful objects
 */
