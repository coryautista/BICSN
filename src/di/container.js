"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
var awilix_1 = require("awilix");
var mssql_js_1 = require("../db/mssql.js");
var firebird_js_1 = require("../db/firebird.js");
// Auth Module - Auth module is fully implemented and ready to use
var AuthRepository_js_1 = require("../modules/auth/infrastructure/persistence/AuthRepository.js");
var LoginCommand_js_1 = require("../modules/auth/application/commands/LoginCommand.js");
var RegisterCommand_js_1 = require("../modules/auth/application/commands/RegisterCommand.js");
var RefreshTokenCommand_js_1 = require("../modules/auth/application/commands/RefreshTokenCommand.js");
var LogoutAllCommand_js_1 = require("../modules/auth/application/commands/LogoutAllCommand.js");
var DenylistJwtCommand_js_1 = require("../modules/auth/application/commands/DenylistJwtCommand.js");
var GetUserByIdQuery_js_1 = require("../modules/auth/application/queries/GetUserByIdQuery.js");
var IsJtiDenylistedQuery_js_1 = require("../modules/auth/application/queries/IsJtiDenylistedQuery.js");
var GetUserRolesQuery_js_1 = require("../modules/auth/application/queries/GetUserRolesQuery.js");
// Usuarios Module
var UsuariosRepository_js_1 = require("../modules/usuarios/infrastructure/persistence/UsuariosRepository.js");
var GetAllUsuariosQuery_js_1 = require("../modules/usuarios/application/queries/GetAllUsuariosQuery.js");
var GetUsuarioByIdQuery_js_1 = require("../modules/usuarios/application/queries/GetUsuarioByIdQuery.js");
var GetUsuarioRolesQuery_js_1 = require("../modules/usuarios/application/queries/GetUsuarioRolesQuery.js");
var CreateUsuarioCommand_js_1 = require("../modules/usuarios/application/commands/CreateUsuarioCommand.js");
var UpdateUsuarioCommand_js_1 = require("../modules/usuarios/application/commands/UpdateUsuarioCommand.js");
var DeleteUsuarioCommand_js_1 = require("../modules/usuarios/application/commands/DeleteUsuarioCommand.js");
var AssignRoleCommand_js_1 = require("../modules/usuarios/application/commands/AssignRoleCommand.js");
var RemoveRoleCommand_js_1 = require("../modules/usuarios/application/commands/RemoveRoleCommand.js");
// Menu Module
var MenuRepository_js_1 = require("../modules/menu/infrastructure/persistence/MenuRepository.js");
var GetAllMenusQuery_js_1 = require("../modules/menu/application/queries/GetAllMenusQuery.js");
var GetMenuByIdQuery_js_1 = require("../modules/menu/application/queries/GetMenuByIdQuery.js");
var GetMenuHierarchyQuery_js_1 = require("../modules/menu/application/queries/GetMenuHierarchyQuery.js");
var CreateMenuCommand_js_1 = require("../modules/menu/application/commands/CreateMenuCommand.js");
var UpdateMenuCommand_js_1 = require("../modules/menu/application/commands/UpdateMenuCommand.js");
var DeleteMenuCommand_js_1 = require("../modules/menu/application/commands/DeleteMenuCommand.js");
// Modulo Module
var ModuloRepository_js_1 = require("../modules/modulo/infrastructure/persistence/ModuloRepository.js");
var GetAllModulosQuery_js_1 = require("../modules/modulo/application/queries/GetAllModulosQuery.js");
var GetModuloByIdQuery_js_1 = require("../modules/modulo/application/queries/GetModuloByIdQuery.js");
var CreateModuloCommand_js_1 = require("../modules/modulo/application/commands/CreateModuloCommand.js");
var UpdateModuloCommand_js_1 = require("../modules/modulo/application/commands/UpdateModuloCommand.js");
var DeleteModuloCommand_js_1 = require("../modules/modulo/application/commands/DeleteModuloCommand.js");
// EventoCalendario Module
var EventoCalendarioRepository_js_1 = require("../modules/eventoCalendario/infrastructure/persistence/EventoCalendarioRepository.js");
var GetAllEventoCalendariosQuery_js_1 = require("../modules/eventoCalendario/application/queries/GetAllEventoCalendariosQuery.js");
var GetEventoCalendarioByIdQuery_js_1 = require("../modules/eventoCalendario/application/queries/GetEventoCalendarioByIdQuery.js");
var GetEventoCalendariosByAnioQuery_js_1 = require("../modules/eventoCalendario/application/queries/GetEventoCalendariosByAnioQuery.js");
var GetEventoCalendariosByDateRangeQuery_js_1 = require("../modules/eventoCalendario/application/queries/GetEventoCalendariosByDateRangeQuery.js");
var CreateEventoCalendarioCommand_js_1 = require("../modules/eventoCalendario/application/commands/CreateEventoCalendarioCommand.js");
var UpdateEventoCalendarioCommand_js_1 = require("../modules/eventoCalendario/application/commands/UpdateEventoCalendarioCommand.js");
var DeleteEventoCalendarioCommand_js_1 = require("../modules/eventoCalendario/application/commands/DeleteEventoCalendarioCommand.js");
// Afiliado Module
var AfiliadoRepository_js_1 = require("../modules/afiliado/infrastructure/persistence/AfiliadoRepository.js");
var GetAllAfiliadosQuery_js_1 = require("../modules/afiliado/application/queries/GetAllAfiliadosQuery.js");
var GetAfiliadoByIdQuery_js_1 = require("../modules/afiliado/application/queries/GetAfiliadoByIdQuery.js");
var ValidateInternoInFirebirdQuery_js_1 = require("../modules/afiliado/application/queries/ValidateInternoInFirebirdQuery.js");
var GetMovimientosQuincenalesQuery_js_1 = require("../modules/afiliado/application/queries/GetMovimientosQuincenalesQuery.js");
var CreateAfiliadoCommand_js_1 = require("../modules/afiliado/application/commands/CreateAfiliadoCommand.js");
var UpdateAfiliadoCommand_js_1 = require("../modules/afiliado/application/commands/UpdateAfiliadoCommand.js");
var DeleteAfiliadoCommand_js_1 = require("../modules/afiliado/application/commands/DeleteAfiliadoCommand.js");
var CreateCompleteAfiliadoCommand_js_1 = require("../modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.js");
// AfiliadoOrg Module
var AfiliadoOrgRepository_js_1 = require("../modules/afiliadoOrg/infrastructure/persistence/AfiliadoOrgRepository.js");
var GetAllAfiliadoOrgQuery_js_1 = require("../modules/afiliadoOrg/application/queries/GetAllAfiliadoOrgQuery.js");
var GetAfiliadoOrgByIdQuery_js_1 = require("../modules/afiliadoOrg/application/queries/GetAfiliadoOrgByIdQuery.js");
var GetAfiliadoOrgByAfiliadoIdQuery_js_1 = require("../modules/afiliadoOrg/application/queries/GetAfiliadoOrgByAfiliadoIdQuery.js");
var CreateAfiliadoOrgCommand_js_1 = require("../modules/afiliadoOrg/application/commands/CreateAfiliadoOrgCommand.js");
var UpdateAfiliadoOrgCommand_js_1 = require("../modules/afiliadoOrg/application/commands/UpdateAfiliadoOrgCommand.js");
var DeleteAfiliadoOrgCommand_js_1 = require("../modules/afiliadoOrg/application/commands/DeleteAfiliadoOrgCommand.js");
// Movimiento Module
var MovimientoRepository_js_1 = require("../modules/movimiento/infrastructure/persistence/MovimientoRepository.js");
var GetAllMovimientosQuery_js_1 = require("../modules/movimiento/application/queries/GetAllMovimientosQuery.js");
var GetMovimientoByIdQuery_js_1 = require("../modules/movimiento/application/queries/GetMovimientoByIdQuery.js");
var GetMovimientosByAfiliadoIdQuery_js_1 = require("../modules/movimiento/application/queries/GetMovimientosByAfiliadoIdQuery.js");
var GetMovimientosByTipoMovimientoIdQuery_js_1 = require("../modules/movimiento/application/queries/GetMovimientosByTipoMovimientoIdQuery.js");
var CreateMovimientoCommand_js_1 = require("../modules/movimiento/application/commands/CreateMovimientoCommand.js");
var UpdateMovimientoCommand_js_1 = require("../modules/movimiento/application/commands/UpdateMovimientoCommand.js");
var DeleteMovimientoCommand_js_1 = require("../modules/movimiento/application/commands/DeleteMovimientoCommand.js");
// AuditLog Module
var AuditLogRepository_js_1 = require("../modules/auditLog/infrastructure/persistence/AuditLogRepository.js");
var GetAuditLogsByDateRangeQuery_js_1 = require("../modules/auditLog/application/queries/GetAuditLogsByDateRangeQuery.js");
// CategoriaPuestoOrg Module
var CategoriaPuestoOrgRepository_js_1 = require("../modules/categoriaPuestoOrg/infrastructure/persistence/CategoriaPuestoOrgRepository.js");
var GetAllCategoriaPuestoOrgQuery_js_1 = require("../modules/categoriaPuestoOrg/application/queries/GetAllCategoriaPuestoOrgQuery.js");
var GetCategoriaPuestoOrgByIdQuery_js_1 = require("../modules/categoriaPuestoOrg/application/queries/GetCategoriaPuestoOrgByIdQuery.js");
var CreateCategoriaPuestoOrgCommand_js_1 = require("../modules/categoriaPuestoOrg/application/commands/CreateCategoriaPuestoOrgCommand.js");
var UpdateCategoriaPuestoOrgCommand_js_1 = require("../modules/categoriaPuestoOrg/application/commands/UpdateCategoriaPuestoOrgCommand.js");
var DeleteCategoriaPuestoOrgCommand_js_1 = require("../modules/categoriaPuestoOrg/application/commands/DeleteCategoriaPuestoOrgCommand.js");
// Calles Module
var CalleRepository_js_1 = require("../modules/calles/infrastructure/persistence/CalleRepository.js");
var GetCalleByIdQuery_js_1 = require("../modules/calles/application/queries/GetCalleByIdQuery.js");
var GetCallesByColoniaQuery_js_1 = require("../modules/calles/application/queries/GetCallesByColoniaQuery.js");
var SearchCallesQuery_js_1 = require("../modules/calles/application/queries/SearchCallesQuery.js");
var CreateCalleCommand_js_1 = require("../modules/calles/application/commands/CreateCalleCommand.js");
var UpdateCalleCommand_js_1 = require("../modules/calles/application/commands/UpdateCalleCommand.js");
var DeleteCalleCommand_js_1 = require("../modules/calles/application/commands/DeleteCalleCommand.js");
// CodigosPostales Module
var CodigoPostalRepository_js_1 = require("../modules/codigosPostales/infrastructure/persistence/CodigoPostalRepository.js");
var GetAllCodigosPostalesQuery_js_1 = require("../modules/codigosPostales/application/queries/GetAllCodigosPostalesQuery.js");
var GetCodigoPostalByIdQuery_js_1 = require("../modules/codigosPostales/application/queries/GetCodigoPostalByIdQuery.js");
var GetCodigoPostalByCodeQuery_js_1 = require("../modules/codigosPostales/application/queries/GetCodigoPostalByCodeQuery.js");
var CreateCodigoPostalCommand_js_1 = require("../modules/codigosPostales/application/commands/CreateCodigoPostalCommand.js");
var UpdateCodigoPostalCommand_js_1 = require("../modules/codigosPostales/application/commands/UpdateCodigoPostalCommand.js");
var DeleteCodigoPostalCommand_js_1 = require("../modules/codigosPostales/application/commands/DeleteCodigoPostalCommand.js");
// Colonias Module
var ColoniaRepository_js_1 = require("../modules/colonias/infrastructure/persistence/ColoniaRepository.js");
var GetColoniaByIdQuery_js_1 = require("../modules/colonias/application/queries/GetColoniaByIdQuery.js");
var GetColoniasByMunicipioQuery_js_1 = require("../modules/colonias/application/queries/GetColoniasByMunicipioQuery.js");
var GetColoniasByCodigoPostalQuery_js_1 = require("../modules/colonias/application/queries/GetColoniasByCodigoPostalQuery.js");
var SearchColoniasQuery_js_1 = require("../modules/colonias/application/queries/SearchColoniasQuery.js");
var CreateColoniaCommand_js_1 = require("../modules/colonias/application/commands/CreateColoniaCommand.js");
// Organica0 Module
var Organica0Repository_js_1 = require("../modules/organica0/infrastructure/persistence/Organica0Repository.js");
var GetAllOrganica0Query_js_1 = require("../modules/organica0/application/queries/GetAllOrganica0Query.js");
var GetOrganica0ByIdQuery_js_1 = require("../modules/organica0/application/queries/GetOrganica0ByIdQuery.js");
var CreateOrganica0Command_js_1 = require("../modules/organica0/application/commands/CreateOrganica0Command.js");
var UpdateOrganica0Command_js_1 = require("../modules/organica0/application/commands/UpdateOrganica0Command.js");
var DeleteOrganica0Command_js_1 = require("../modules/organica0/application/commands/DeleteOrganica0Command.js");
// Organica1 Module
var Organica1Repository_js_1 = require("../modules/organica1/infrastructure/persistence/Organica1Repository.js");
var GetAllOrganica1Query_js_1 = require("../modules/organica1/application/queries/GetAllOrganica1Query.js");
var GetOrganica1ByIdQuery_js_1 = require("../modules/organica1/application/queries/GetOrganica1ByIdQuery.js");
var GetOrganica1ByClaveOrganica0Query_js_1 = require("../modules/organica1/application/queries/GetOrganica1ByClaveOrganica0Query.js");
var CreateOrganica1Command_js_1 = require("../modules/organica1/application/commands/CreateOrganica1Command.js");
var UpdateOrganica1Command_js_1 = require("../modules/organica1/application/commands/UpdateOrganica1Command.js");
var DeleteOrganica1Command_js_1 = require("../modules/organica1/application/commands/DeleteOrganica1Command.js");
// Organica2 Module
var Organica2Repository_js_1 = require("../modules/organica2/infrastructure/persistence/Organica2Repository.js");
var GetAllOrganica2Query_js_1 = require("../modules/organica2/application/queries/GetAllOrganica2Query.js");
var GetOrganica2ByIdQuery_js_1 = require("../modules/organica2/application/queries/GetOrganica2ByIdQuery.js");
var GetOrganica2ByClaveOrganica0And1Query_js_1 = require("../modules/organica2/application/queries/GetOrganica2ByClaveOrganica0And1Query.js");
var CreateOrganica2Command_js_1 = require("../modules/organica2/application/commands/CreateOrganica2Command.js");
var UpdateOrganica2Command_js_1 = require("../modules/organica2/application/commands/UpdateOrganica2Command.js");
var DeleteOrganica2Command_js_1 = require("../modules/organica2/application/commands/DeleteOrganica2Command.js");
// Organica3 Module
var Organica3Repository_js_1 = require("../modules/organica3/infrastructure/persistence/Organica3Repository.js");
var GetAllOrganica3Query_js_1 = require("../modules/organica3/application/queries/GetAllOrganica3Query.js");
var GetOrganica3ByIdQuery_js_1 = require("../modules/organica3/application/queries/GetOrganica3ByIdQuery.js");
var GetOrganica3ByClaveOrganica0And1And2Query_js_1 = require("../modules/organica3/application/queries/GetOrganica3ByClaveOrganica0And1And2Query.js");
var CreateOrganica3Command_js_1 = require("../modules/organica3/application/commands/CreateOrganica3Command.js");
var UpdateOrganica3Command_js_1 = require("../modules/organica3/application/commands/UpdateOrganica3Command.js");
var DeleteOrganica3Command_js_1 = require("../modules/organica3/application/commands/DeleteOrganica3Command.js");
// OrganicaCascade Module
var OrganicaCascadeRepository_js_1 = require("../modules/organicaCascade/infrastructure/persistence/OrganicaCascadeRepository.js");
var GetOrganica1ChildrenQuery_js_1 = require("../modules/organicaCascade/application/queries/GetOrganica1ChildrenQuery.js");
var GetOrganica2ChildrenQuery_js_1 = require("../modules/organicaCascade/application/queries/GetOrganica2ChildrenQuery.js");
var GetOrganica3ChildrenQuery_js_1 = require("../modules/organicaCascade/application/queries/GetOrganica3ChildrenQuery.js");
// Personal Module
var PersonalRepository_js_1 = require("../modules/personal/infrastructure/persistence/PersonalRepository.js");
var GetAllPersonalQuery_js_1 = require("../modules/personal/application/queries/GetAllPersonalQuery.js");
var GetPersonalByIdQuery_js_1 = require("../modules/personal/application/queries/GetPersonalByIdQuery.js");
var CreatePersonalCommand_js_1 = require("../modules/personal/application/commands/CreatePersonalCommand.js");
var UpdatePersonalCommand_js_1 = require("../modules/personal/application/commands/UpdatePersonalCommand.js");
var DeletePersonalCommand_js_1 = require("../modules/personal/application/commands/DeletePersonalCommand.js");
var OrgPersonalRepository_js_1 = require("../modules/orgPersonal/infrastructure/persistence/OrgPersonalRepository.js");
var GetAllOrgPersonalQuery_js_1 = require("../modules/orgPersonal/application/queries/GetAllOrgPersonalQuery.js");
var GetOrgPersonalByIdQuery_js_1 = require("../modules/orgPersonal/application/queries/GetOrgPersonalByIdQuery.js");
var GetOrgPersonalBySearchQuery_js_1 = require("../modules/orgPersonal/application/queries/GetOrgPersonalBySearchQuery.js");
var CreateOrgPersonalCommand_js_1 = require("../modules/orgPersonal/application/commands/CreateOrgPersonalCommand.js");
var UpdateOrgPersonalCommand_js_1 = require("../modules/orgPersonal/application/commands/UpdateOrgPersonalCommand.js");
var DeleteOrgPersonalCommand_js_1 = require("../modules/orgPersonal/application/commands/DeleteOrgPersonalCommand.js");
// AportacionesFondos Module
var AportacionFondoRepository_js_1 = require("../modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.js");
var GetAportacionesIndividualesQuery_js_1 = require("../modules/aportacionesFondos/application/queries/GetAportacionesIndividualesQuery.js");
var GetAportacionesCompletasQuery_js_1 = require("../modules/aportacionesFondos/application/queries/GetAportacionesCompletasQuery.js");
var UpdateColoniaCommand_js_1 = require("../modules/colonias/application/commands/UpdateColoniaCommand.js");
var DeleteColoniaCommand_js_1 = require("../modules/colonias/application/commands/DeleteColoniaCommand.js");
// Estados Module
var EstadoRepository_js_1 = require("../modules/estados/infrastructure/persistence/EstadoRepository.js");
var GetAllEstadosQuery_js_1 = require("../modules/estados/application/queries/GetAllEstadosQuery.js");
var GetEstadoByIdQuery_js_1 = require("../modules/estados/application/queries/GetEstadoByIdQuery.js");
var CreateEstadoCommand_js_1 = require("../modules/estados/application/commands/CreateEstadoCommand.js");
var UpdateEstadoCommand_js_1 = require("../modules/estados/application/commands/UpdateEstadoCommand.js");
var DeleteEstadoCommand_js_1 = require("../modules/estados/application/commands/DeleteEstadoCommand.js");
// Info Module
var InfoRepository_js_1 = require("../modules/info/infrastructure/persistence/InfoRepository.js");
var GetAllInfosQuery_js_1 = require("../modules/info/application/queries/GetAllInfosQuery.js");
var GetInfoByIdQuery_js_1 = require("../modules/info/application/queries/GetInfoByIdQuery.js");
var CreateInfoCommand_js_1 = require("../modules/info/application/commands/CreateInfoCommand.js");
var UpdateInfoCommand_js_1 = require("../modules/info/application/commands/UpdateInfoCommand.js");
var DeleteInfoCommand_js_1 = require("../modules/info/application/commands/DeleteInfoCommand.js");
// Log Module
var LogRepository_js_1 = require("../modules/log/infrastructure/persistence/LogRepository.js");
var GetLogStatsQuery_js_1 = require("../modules/log/application/queries/GetLogStatsQuery.js");
var GetLogContentQuery_js_1 = require("../modules/log/application/queries/GetLogContentQuery.js");
var SearchLogsQuery_js_1 = require("../modules/log/application/queries/SearchLogsQuery.js");
var CleanupLogsCommand_js_1 = require("../modules/log/application/commands/CleanupLogsCommand.js");
var ArchiveLogsCommand_js_1 = require("../modules/log/application/commands/ArchiveLogsCommand.js");
// Municipios Module
var MunicipioRepository_js_1 = require("../modules/municipios/infrastructure/persistence/MunicipioRepository.js");
var GetAllMunicipiosQuery_js_1 = require("../modules/municipios/application/queries/GetAllMunicipiosQuery.js");
var GetMunicipiosByEstadoQuery_js_1 = require("../modules/municipios/application/queries/GetMunicipiosByEstadoQuery.js");
var GetMunicipioByIdQuery_js_1 = require("../modules/municipios/application/queries/GetMunicipioByIdQuery.js");
var CreateMunicipioCommand_js_1 = require("../modules/municipios/application/commands/CreateMunicipioCommand.js");
var UpdateMunicipioCommand_js_1 = require("../modules/municipios/application/commands/UpdateMunicipioCommand.js");
var DeleteMunicipioCommand_js_1 = require("../modules/municipios/application/commands/DeleteMunicipioCommand.js");
// Proceso Module
var ProcesoRepository_js_1 = require("../modules/proceso/infrastructure/persistence/ProcesoRepository.js");
var GetAllProcesosQuery_js_1 = require("../modules/proceso/application/queries/GetAllProcesosQuery.js");
var GetProcesoByIdQuery_js_1 = require("../modules/proceso/application/queries/GetProcesoByIdQuery.js");
var CreateProcesoCommand_js_1 = require("../modules/proceso/application/commands/CreateProcesoCommand.js");
var UpdateProcesoCommand_js_1 = require("../modules/proceso/application/commands/UpdateProcesoCommand.js");
var DeleteProcesoCommand_js_1 = require("../modules/proceso/application/commands/DeleteProcesoCommand.js");
// Role Module
var RoleRepository_js_1 = require("../modules/role/infrastructure/persistence/RoleRepository.js");
var GetAllRolesQuery_js_1 = require("../modules/role/application/queries/GetAllRolesQuery.js");
var GetRoleByNameQuery_js_1 = require("../modules/role/application/queries/GetRoleByNameQuery.js");
var CreateRoleCommand_js_1 = require("../modules/role/application/commands/CreateRoleCommand.js");
var AssignRoleCommand_js_2 = require("../modules/role/application/commands/AssignRoleCommand.js");
var UnassignRoleCommand_js_1 = require("../modules/role/application/commands/UnassignRoleCommand.js");
var auth_repo_js_1 = require("../modules/auth/auth.repo.js");
// UserRole Module
var UserRoleRepository_js_1 = require("../modules/userRole/infrastructure/persistence/UserRoleRepository.js");
var GetAllUserRolesQuery_js_1 = require("../modules/userRole/application/queries/GetAllUserRolesQuery.js");
var GetUserRoleByIdsQuery_js_1 = require("../modules/userRole/application/queries/GetUserRoleByIdsQuery.js");
var GetUserRolesByUsuarioQuery_js_1 = require("../modules/userRole/application/queries/GetUserRolesByUsuarioQuery.js");
var CreateUserRoleCommand_js_1 = require("../modules/userRole/application/commands/CreateUserRoleCommand.js");
var DeleteUserRoleCommand_js_1 = require("../modules/userRole/application/commands/DeleteUserRoleCommand.js");
// RoleMenu Module
var RoleMenuRepository_js_1 = require("../modules/roleMenu/infrastructure/persistence/RoleMenuRepository.js");
var GetAllRoleMenusQuery_js_1 = require("../modules/roleMenu/application/queries/GetAllRoleMenusQuery.js");
var GetRoleMenuByIdQuery_js_1 = require("../modules/roleMenu/application/queries/GetRoleMenuByIdQuery.js");
var GetRoleMenusByRoleIdQuery_js_1 = require("../modules/roleMenu/application/queries/GetRoleMenusByRoleIdQuery.js");
var GetRoleMenusByTokenRolesQuery_js_1 = require("../modules/roleMenu/application/queries/GetRoleMenusByTokenRolesQuery.js");
var CreateRoleMenuCommand_js_1 = require("../modules/roleMenu/application/commands/CreateRoleMenuCommand.js");
var UpdateRoleMenuCommand_js_1 = require("../modules/roleMenu/application/commands/UpdateRoleMenuCommand.js");
var DeleteRoleMenuCommand_js_1 = require("../modules/roleMenu/application/commands/DeleteRoleMenuCommand.js");
var AssignMenuToRoleCommand_js_1 = require("../modules/roleMenu/application/commands/AssignMenuToRoleCommand.js");
var UnassignMenuFromRoleCommand_js_1 = require("../modules/roleMenu/application/commands/UnassignMenuFromRoleCommand.js");
// TipoMovimiento Module
var TipoMovimientoRepository_js_1 = require("../modules/tipoMovimiento/infrastructure/persistence/TipoMovimientoRepository.js");
var GetAllTipoMovimientosQuery_js_1 = require("../modules/tipoMovimiento/application/queries/GetAllTipoMovimientosQuery.js");
var GetTipoMovimientoByIdQuery_js_1 = require("../modules/tipoMovimiento/application/queries/GetTipoMovimientoByIdQuery.js");
var CreateTipoMovimientoCommand_js_1 = require("../modules/tipoMovimiento/application/commands/CreateTipoMovimientoCommand.js");
var UpdateTipoMovimientoCommand_js_1 = require("../modules/tipoMovimiento/application/commands/UpdateTipoMovimientoCommand.js");
var DeleteTipoMovimientoCommand_js_1 = require("../modules/tipoMovimiento/application/commands/DeleteTipoMovimientoCommand.js");
// AfectacionOrg Module
var BitacoraAfectacionRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/BitacoraAfectacionRepository.js");
var EstadoAfectacionRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/EstadoAfectacionRepository.js");
var ProgresoUsuarioRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/ProgresoUsuarioRepository.js");
var TableroAfectacionRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/TableroAfectacionRepository.js");
var UltimaAfectacionRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/UltimaAfectacionRepository.js");
var QuincenaRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/QuincenaRepository.js");
var AfectacionRepository_js_1 = require("../modules/afectacionOrg/infrastructure/persistence/AfectacionRepository.js");
var GetBitacoraAfectacionQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetBitacoraAfectacionQuery.js");
var GetEstadosAfectacionQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetEstadosAfectacionQuery.js");
var GetProgresoUsuarioQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetProgresoUsuarioQuery.js");
var GetTableroAfectacionQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetTableroAfectacionQuery.js");
var GetUltimaAfectacionQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetUltimaAfectacionQuery.js");
var GetQuincenaAltaAfectacionQuery_js_1 = require("../modules/afectacionOrg/application/queries/GetQuincenaAltaAfectacionQuery.js");
var RegistrarAfectacionCommand_js_1 = require("../modules/afectacionOrg/application/commands/RegistrarAfectacionCommand.js");
// Expediente Module
var DocumentTypeRepository_js_1 = require("../modules/expediente/infrastructure/persistence/DocumentTypeRepository.js");
var ExpedienteRepository_js_1 = require("../modules/expediente/infrastructure/persistence/ExpedienteRepository.js");
var ExpedienteArchivoRepository_js_1 = require("../modules/expediente/infrastructure/persistence/ExpedienteArchivoRepository.js");
var GetAllDocumentTypesQuery_js_1 = require("../modules/expediente/application/queries/GetAllDocumentTypesQuery.js");
var GetDocumentTypeByIdQuery_js_1 = require("../modules/expediente/application/queries/GetDocumentTypeByIdQuery.js");
var GetDocumentTypeByCodeQuery_js_1 = require("../modules/expediente/application/queries/GetDocumentTypeByCodeQuery.js");
var GetAllExpedientesQuery_js_1 = require("../modules/expediente/application/queries/GetAllExpedientesQuery.js");
var GetExpedienteByCurpQuery_js_1 = require("../modules/expediente/application/queries/GetExpedienteByCurpQuery.js");
var GetExpedienteArchivoByIdQuery_js_1 = require("../modules/expediente/application/queries/GetExpedienteArchivoByIdQuery.js");
var GetExpedienteArchivosByCurpQuery_js_1 = require("../modules/expediente/application/queries/GetExpedienteArchivosByCurpQuery.js");
var CreateDocumentTypeCommand_js_1 = require("../modules/expediente/application/commands/CreateDocumentTypeCommand.js");
var UpdateDocumentTypeCommand_js_1 = require("../modules/expediente/application/commands/UpdateDocumentTypeCommand.js");
var DeleteDocumentTypeCommand_js_1 = require("../modules/expediente/application/commands/DeleteDocumentTypeCommand.js");
var CreateExpedienteCommand_js_1 = require("../modules/expediente/application/commands/CreateExpedienteCommand.js");
var UpdateExpedienteCommand_js_1 = require("../modules/expediente/application/commands/UpdateExpedienteCommand.js");
var DeleteExpedienteCommand_js_1 = require("../modules/expediente/application/commands/DeleteExpedienteCommand.js");
var CreateExpedienteArchivoCommand_js_1 = require("../modules/expediente/application/commands/CreateExpedienteArchivoCommand.js");
var UpdateExpedienteArchivoCommand_js_1 = require("../modules/expediente/application/commands/UpdateExpedienteArchivoCommand.js");
var DeleteExpedienteArchivoCommand_js_1 = require("../modules/expediente/application/commands/DeleteExpedienteArchivoCommand.js");
// AfiliadosPersonal Module
var AfiliadoPersonalRepository_js_1 = require("../modules/afiliadosPersonal/infrastructure/persistence/AfiliadoPersonalRepository.js");
var GetPlantillaQuery_js_1 = require("../modules/afiliadosPersonal/application/queries/GetPlantillaQuery.js");
var BusquedaHistoricoQuery_js_1 = require("../modules/afiliadosPersonal/application/queries/BusquedaHistoricoQuery.js");
// Tablero Services
var eje_service_js_1 = require("../modules/tablero/eje/eje.service.js");
var programa_service_js_1 = require("../modules/tablero/programa/programa.service.js");
var linea_estrategica_service_js_1 = require("../modules/tablero/linea-estrategica/linea-estrategica.service.js");
var indicador_service_js_1 = require("../modules/tablero/indicador/indicador.service.js");
var indicador_anual_service_js_1 = require("../modules/tablero/indicador-anual/indicador-anual.service.js");
var dimension_service_js_1 = require("../modules/tablero/dimension/dimension.service.js");
var unidad_medida_service_js_1 = require("../modules/tablero/unidad-medida/unidad-medida.service.js");
var dependencia_service_js_1 = require("../modules/tablero/dependencia/dependencia.service.js");
// Organica Services
var organica1_service_js_1 = require("../modules/organica1/organica1.service.js");
var organica2_service_js_1 = require("../modules/organica2/organica2.service.js");
var organica3_service_js_1 = require("../modules/organica3/organica3.service.js");
// Reportes Service
var reportes_service_js_1 = require("../modules/reportes/reportes.service.js");
// AfectacionOrg Service
var afectacionOrg_service_js_1 = require("../modules/afectacionOrg/afectacionOrg.service.js");
/**
 * Application-wide Dependency Injection Container
 * Uses Awilix for automatic dependency injection
 */
exports.container = (0, awilix_1.createContainer)({
    injectionMode: awilix_1.InjectionMode.CLASSIC // CLASSIC mode allows injection by parameter name
});
// Register dependencies
exports.container.register({
    // ============================================================================
    // INFRASTRUCTURE LAYER
    // ============================================================================
    // Database Pools (Singleton - shared across the application)
    mssqlPool: (0, awilix_1.asFunction)(mssql_js_1.getPool).singleton(),
    firebirdDb: (0, awilix_1.asFunction)(firebird_js_1.getFirebirdDb).singleton(),
    // ============================================================================
    // AUTH MODULE
    // ============================================================================
    // Repositories (Scoped - new instance per request)
    authRepo: (0, awilix_1.asClass)(AuthRepository_js_1.AuthRepository).scoped(),
    // Commands (Scoped)
    loginCommand: (0, awilix_1.asClass)(LoginCommand_js_1.LoginCommand).scoped(),
    registerCommand: (0, awilix_1.asClass)(RegisterCommand_js_1.RegisterCommand).scoped(),
    refreshTokenCommand: (0, awilix_1.asClass)(RefreshTokenCommand_js_1.RefreshTokenCommand).scoped(),
    logoutAllCommand: (0, awilix_1.asClass)(LogoutAllCommand_js_1.LogoutAllCommand).scoped(),
    denylistJwtCommand: (0, awilix_1.asClass)(DenylistJwtCommand_js_1.DenylistJwtCommand).scoped(),
    // Queries (Scoped)
    getUserByIdQuery: (0, awilix_1.asClass)(GetUserByIdQuery_js_1.GetUserByIdQuery).scoped(),
    isJtiDenylistedQuery: (0, awilix_1.asClass)(IsJtiDenylistedQuery_js_1.IsJtiDenylistedQuery).scoped(),
    getUserRolesQuery: (0, awilix_1.asClass)(GetUserRolesQuery_js_1.GetUserRolesQuery).scoped(),
    // ============================================================================
    // USUARIOS MODULE
    // ============================================================================
    // Repositories (Scoped)
    usuariosRepo: (0, awilix_1.asClass)(UsuariosRepository_js_1.UsuariosRepository).scoped(),
    // Queries (Scoped)
    getAllUsuariosQuery: (0, awilix_1.asClass)(GetAllUsuariosQuery_js_1.GetAllUsuariosQuery).scoped(),
    getUsuarioByIdQuery: (0, awilix_1.asClass)(GetUsuarioByIdQuery_js_1.GetUsuarioByIdQuery).scoped(),
    getUsuarioRolesQuery: (0, awilix_1.asClass)(GetUsuarioRolesQuery_js_1.GetUsuarioRolesQuery).scoped(),
    // Commands (Scoped)
    createUsuarioCommand: (0, awilix_1.asClass)(CreateUsuarioCommand_js_1.CreateUsuarioCommand).scoped(),
    updateUsuarioCommand: (0, awilix_1.asClass)(UpdateUsuarioCommand_js_1.UpdateUsuarioCommand).scoped(),
    deleteUsuarioCommand: (0, awilix_1.asClass)(DeleteUsuarioCommand_js_1.DeleteUsuarioCommand).scoped(),
    assignRoleCommand: (0, awilix_1.asClass)(AssignRoleCommand_js_1.AssignRoleCommand).scoped(),
    removeRoleCommand: (0, awilix_1.asClass)(RemoveRoleCommand_js_1.RemoveRoleCommand).scoped(),
    // ============================================================================
    // MENU MODULE
    // ============================================================================
    // Repositories (Scoped)
    menuRepo: (0, awilix_1.asClass)(MenuRepository_js_1.MenuRepository).scoped(),
    // Queries (Scoped)
    getAllMenusQuery: (0, awilix_1.asClass)(GetAllMenusQuery_js_1.GetAllMenusQuery).scoped(),
    getMenuByIdQuery: (0, awilix_1.asClass)(GetMenuByIdQuery_js_1.GetMenuByIdQuery).scoped(),
    getMenuHierarchyQuery: (0, awilix_1.asClass)(GetMenuHierarchyQuery_js_1.GetMenuHierarchyQuery).scoped(),
    // Commands (Scoped)
    createMenuCommand: (0, awilix_1.asClass)(CreateMenuCommand_js_1.CreateMenuCommand).scoped(),
    updateMenuCommand: (0, awilix_1.asClass)(UpdateMenuCommand_js_1.UpdateMenuCommand).scoped(),
    deleteMenuCommand: (0, awilix_1.asClass)(DeleteMenuCommand_js_1.DeleteMenuCommand).scoped(),
    // ============================================================================
    // MODULO MODULE
    // ============================================================================
    // Repositories (Scoped)
    moduloRepo: (0, awilix_1.asClass)(ModuloRepository_js_1.ModuloRepository).scoped(),
    // Queries (Scoped)
    getAllModulosQuery: (0, awilix_1.asClass)(GetAllModulosQuery_js_1.GetAllModulosQuery).scoped(),
    getModuloByIdQuery: (0, awilix_1.asClass)(GetModuloByIdQuery_js_1.GetModuloByIdQuery).scoped(),
    // Commands (Scoped)
    createModuloCommand: (0, awilix_1.asClass)(CreateModuloCommand_js_1.CreateModuloCommand).scoped(),
    updateModuloCommand: (0, awilix_1.asClass)(UpdateModuloCommand_js_1.UpdateModuloCommand).scoped(),
    deleteModuloCommand: (0, awilix_1.asClass)(DeleteModuloCommand_js_1.DeleteModuloCommand).scoped(),
    // ============================================================================
    // EVENTO CALENDARIO MODULE
    // ============================================================================
    // Repositories (Scoped)
    eventoCalendarioRepo: (0, awilix_1.asClass)(EventoCalendarioRepository_js_1.EventoCalendarioRepository).scoped(),
    // Queries (Scoped)
    getAllEventoCalendariosQuery: (0, awilix_1.asClass)(GetAllEventoCalendariosQuery_js_1.GetAllEventoCalendariosQuery).scoped(),
    getEventoCalendarioByIdQuery: (0, awilix_1.asClass)(GetEventoCalendarioByIdQuery_js_1.GetEventoCalendarioByIdQuery).scoped(),
    getEventoCalendariosByAnioQuery: (0, awilix_1.asClass)(GetEventoCalendariosByAnioQuery_js_1.GetEventoCalendariosByAnioQuery).scoped(),
    getEventoCalendariosByDateRangeQuery: (0, awilix_1.asClass)(GetEventoCalendariosByDateRangeQuery_js_1.GetEventoCalendariosByDateRangeQuery).scoped(),
    // Commands (Scoped)
    createEventoCalendarioCommand: (0, awilix_1.asClass)(CreateEventoCalendarioCommand_js_1.CreateEventoCalendarioCommand).scoped(),
    updateEventoCalendarioCommand: (0, awilix_1.asClass)(UpdateEventoCalendarioCommand_js_1.UpdateEventoCalendarioCommand).scoped(),
    deleteEventoCalendarioCommand: (0, awilix_1.asClass)(DeleteEventoCalendarioCommand_js_1.DeleteEventoCalendarioCommand).scoped(),
    // ============================================================================
    // AFILIADO MODULE
    // ============================================================================
    // Repositories (Scoped)
    afiliadoRepo: (0, awilix_1.asClass)(AfiliadoRepository_js_1.AfiliadoRepository).scoped(),
    // Queries (Scoped)
    getAllAfiliadosQuery: (0, awilix_1.asClass)(GetAllAfiliadosQuery_js_1.GetAllAfiliadosQuery).scoped(),
    getAfiliadoByIdQuery: (0, awilix_1.asClass)(GetAfiliadoByIdQuery_js_1.GetAfiliadoByIdQuery).scoped(),
    validateInternoInFirebirdQuery: (0, awilix_1.asClass)(ValidateInternoInFirebirdQuery_js_1.ValidateInternoInFirebirdQuery).scoped(),
    getMovimientosQuincenalesQuery: (0, awilix_1.asClass)(GetMovimientosQuincenalesQuery_js_1.GetMovimientosQuincenalesQuery).scoped(),
    // Commands (Scoped)
    createAfiliadoCommand: (0, awilix_1.asClass)(CreateAfiliadoCommand_js_1.CreateAfiliadoCommand).scoped(),
    updateAfiliadoCommand: (0, awilix_1.asClass)(UpdateAfiliadoCommand_js_1.UpdateAfiliadoCommand).scoped(),
    deleteAfiliadoCommand: (0, awilix_1.asClass)(DeleteAfiliadoCommand_js_1.DeleteAfiliadoCommand).scoped(),
    createCompleteAfiliadoCommand: (0, awilix_1.asClass)(CreateCompleteAfiliadoCommand_js_1.CreateCompleteAfiliadoCommand).scoped(),
    // ============================================================================
    // AFILIADO ORG MODULE
    // ============================================================================
    // Repositories (Scoped)
    afiliadoOrgRepo: (0, awilix_1.asClass)(AfiliadoOrgRepository_js_1.AfiliadoOrgRepository).scoped(),
    // Queries (Scoped)
    getAllAfiliadoOrgQuery: (0, awilix_1.asClass)(GetAllAfiliadoOrgQuery_js_1.GetAllAfiliadoOrgQuery).scoped(),
    getAfiliadoOrgByIdQuery: (0, awilix_1.asClass)(GetAfiliadoOrgByIdQuery_js_1.GetAfiliadoOrgByIdQuery).scoped(),
    getAfiliadoOrgByAfiliadoIdQuery: (0, awilix_1.asClass)(GetAfiliadoOrgByAfiliadoIdQuery_js_1.GetAfiliadoOrgByAfiliadoIdQuery).scoped(),
    // Commands (Scoped)
    createAfiliadoOrgCommand: (0, awilix_1.asClass)(CreateAfiliadoOrgCommand_js_1.CreateAfiliadoOrgCommand).scoped(),
    updateAfiliadoOrgCommand: (0, awilix_1.asClass)(UpdateAfiliadoOrgCommand_js_1.UpdateAfiliadoOrgCommand).scoped(),
    deleteAfiliadoOrgCommand: (0, awilix_1.asClass)(DeleteAfiliadoOrgCommand_js_1.DeleteAfiliadoOrgCommand).scoped(),
    // ============================================================================
    // MOVIMIENTO MODULE
    // ============================================================================
    // Repositories (Scoped)
    movimientoRepo: (0, awilix_1.asClass)(MovimientoRepository_js_1.MovimientoRepository).scoped(),
    // Queries (Scoped)
    getAllMovimientosQuery: (0, awilix_1.asClass)(GetAllMovimientosQuery_js_1.GetAllMovimientosQuery).scoped(),
    getMovimientoByIdQuery: (0, awilix_1.asClass)(GetMovimientoByIdQuery_js_1.GetMovimientoByIdQuery).scoped(),
    getMovimientosByAfiliadoIdQuery: (0, awilix_1.asClass)(GetMovimientosByAfiliadoIdQuery_js_1.GetMovimientosByAfiliadoIdQuery).scoped(),
    getMovimientosByTipoMovimientoIdQuery: (0, awilix_1.asClass)(GetMovimientosByTipoMovimientoIdQuery_js_1.GetMovimientosByTipoMovimientoIdQuery).scoped(),
    // Commands (Scoped)
    createMovimientoCommand: (0, awilix_1.asClass)(CreateMovimientoCommand_js_1.CreateMovimientoCommand).scoped(),
    updateMovimientoCommand: (0, awilix_1.asClass)(UpdateMovimientoCommand_js_1.UpdateMovimientoCommand).scoped(),
    deleteMovimientoCommand: (0, awilix_1.asClass)(DeleteMovimientoCommand_js_1.DeleteMovimientoCommand).scoped(),
    // ============================================================================
    // AUDIT LOG MODULE
    // ============================================================================
    // Repositories (Scoped)
    auditLogRepo: (0, awilix_1.asClass)(AuditLogRepository_js_1.AuditLogRepository).scoped(),
    // Queries (Scoped)
    getAuditLogsByDateRangeQuery: (0, awilix_1.asClass)(GetAuditLogsByDateRangeQuery_js_1.GetAuditLogsByDateRangeQuery).scoped(),
    // ============================================================================
    // CATEGORIA PUESTO ORG MODULE
    // ============================================================================
    // Repositories (Scoped)
    categoriaPuestoOrgRepo: (0, awilix_1.asClass)(CategoriaPuestoOrgRepository_js_1.CategoriaPuestoOrgRepository).scoped(),
    // Queries (Scoped)
    getAllCategoriaPuestoOrgQuery: (0, awilix_1.asClass)(GetAllCategoriaPuestoOrgQuery_js_1.GetAllCategoriaPuestoOrgQuery).scoped(),
    getCategoriaPuestoOrgByIdQuery: (0, awilix_1.asClass)(GetCategoriaPuestoOrgByIdQuery_js_1.GetCategoriaPuestoOrgByIdQuery).scoped(),
    // Commands (Scoped)
    createCategoriaPuestoOrgCommand: (0, awilix_1.asClass)(CreateCategoriaPuestoOrgCommand_js_1.CreateCategoriaPuestoOrgCommand).scoped(),
    updateCategoriaPuestoOrgCommand: (0, awilix_1.asClass)(UpdateCategoriaPuestoOrgCommand_js_1.UpdateCategoriaPuestoOrgCommand).scoped(),
    deleteCategoriaPuestoOrgCommand: (0, awilix_1.asClass)(DeleteCategoriaPuestoOrgCommand_js_1.DeleteCategoriaPuestoOrgCommand).scoped(),
    // ============================================================================
    // CALLES MODULE
    // ============================================================================
    // Repositories (Scoped)
    calleRepo: (0, awilix_1.asClass)(CalleRepository_js_1.CalleRepository).scoped(),
    // Queries (Scoped)
    getCalleByIdQuery: (0, awilix_1.asClass)(GetCalleByIdQuery_js_1.GetCalleByIdQuery).scoped(),
    getCallesByColoniaQuery: (0, awilix_1.asClass)(GetCallesByColoniaQuery_js_1.GetCallesByColoniaQuery).scoped(),
    searchCallesQuery: (0, awilix_1.asClass)(SearchCallesQuery_js_1.SearchCallesQuery).scoped(),
    // Commands (Scoped)
    createCalleCommand: (0, awilix_1.asClass)(CreateCalleCommand_js_1.CreateCalleCommand).scoped(),
    updateCalleCommand: (0, awilix_1.asClass)(UpdateCalleCommand_js_1.UpdateCalleCommand).scoped(),
    deleteCalleCommand: (0, awilix_1.asClass)(DeleteCalleCommand_js_1.DeleteCalleCommand).scoped(),
    // ============================================================================
    // CODIGOS POSTALES MODULE
    // ============================================================================
    // Repositories (Scoped)
    codigoPostalRepo: (0, awilix_1.asClass)(CodigoPostalRepository_js_1.CodigoPostalRepository).scoped(),
    // Queries (Scoped)
    getAllCodigosPostalesQuery: (0, awilix_1.asClass)(GetAllCodigosPostalesQuery_js_1.GetAllCodigosPostalesQuery).scoped(),
    getCodigoPostalByIdQuery: (0, awilix_1.asClass)(GetCodigoPostalByIdQuery_js_1.GetCodigoPostalByIdQuery).scoped(),
    getCodigoPostalByCodeQuery: (0, awilix_1.asClass)(GetCodigoPostalByCodeQuery_js_1.GetCodigoPostalByCodeQuery).scoped(),
    // Commands (Scoped)
    createCodigoPostalCommand: (0, awilix_1.asClass)(CreateCodigoPostalCommand_js_1.CreateCodigoPostalCommand).scoped(),
    updateCodigoPostalCommand: (0, awilix_1.asClass)(UpdateCodigoPostalCommand_js_1.UpdateCodigoPostalCommand).scoped(),
    deleteCodigoPostalCommand: (0, awilix_1.asClass)(DeleteCodigoPostalCommand_js_1.DeleteCodigoPostalCommand).scoped(),
    // ============================================================================
    // COLONIAS MODULE
    // ============================================================================
    // Repositories (Scoped)
    coloniaRepo: (0, awilix_1.asClass)(ColoniaRepository_js_1.ColoniaRepository).scoped(),
    // Queries (Scoped)
    getColoniaByIdQuery: (0, awilix_1.asClass)(GetColoniaByIdQuery_js_1.GetColoniaByIdQuery).scoped(),
    getColoniasByMunicipioQuery: (0, awilix_1.asClass)(GetColoniasByMunicipioQuery_js_1.GetColoniasByMunicipioQuery).scoped(),
    getColoniasByCodigoPostalQuery: (0, awilix_1.asClass)(GetColoniasByCodigoPostalQuery_js_1.GetColoniasByCodigoPostalQuery).scoped(),
    searchColoniasQuery: (0, awilix_1.asClass)(SearchColoniasQuery_js_1.SearchColoniasQuery).scoped(),
    // Commands (Scoped)
    createColoniaCommand: (0, awilix_1.asClass)(CreateColoniaCommand_js_1.CreateColoniaCommand).scoped(),
    updateColoniaCommand: (0, awilix_1.asClass)(UpdateColoniaCommand_js_1.UpdateColoniaCommand).scoped(),
    deleteColoniaCommand: (0, awilix_1.asClass)(DeleteColoniaCommand_js_1.DeleteColoniaCommand).scoped(),
    // ============================================================================
    // ESTADOS MODULE
    // ============================================================================
    // Repositories (Scoped)
    estadoRepo: (0, awilix_1.asClass)(EstadoRepository_js_1.EstadoRepository).scoped(),
    // Queries (Scoped)
    getAllEstadosQuery: (0, awilix_1.asClass)(GetAllEstadosQuery_js_1.GetAllEstadosQuery).scoped(),
    getEstadoByIdQuery: (0, awilix_1.asClass)(GetEstadoByIdQuery_js_1.GetEstadoByIdQuery).scoped(),
    // Commands (Scoped)
    createEstadoCommand: (0, awilix_1.asClass)(CreateEstadoCommand_js_1.CreateEstadoCommand).scoped(),
    updateEstadoCommand: (0, awilix_1.asClass)(UpdateEstadoCommand_js_1.UpdateEstadoCommand).scoped(),
    deleteEstadoCommand: (0, awilix_1.asClass)(DeleteEstadoCommand_js_1.DeleteEstadoCommand).scoped(),
    // ============================================================================
    // INFO MODULE
    // ============================================================================
    // Repositories (Scoped)
    infoRepo: (0, awilix_1.asClass)(InfoRepository_js_1.InfoRepository).scoped(),
    // Queries (Scoped)
    getAllInfosQuery: (0, awilix_1.asClass)(GetAllInfosQuery_js_1.GetAllInfosQuery).scoped(),
    getInfoByIdQuery: (0, awilix_1.asClass)(GetInfoByIdQuery_js_1.GetInfoByIdQuery).scoped(),
    // Commands (Scoped)
    createInfoCommand: (0, awilix_1.asClass)(CreateInfoCommand_js_1.CreateInfoCommand).scoped(),
    updateInfoCommand: (0, awilix_1.asClass)(UpdateInfoCommand_js_1.UpdateInfoCommand).scoped(),
    deleteInfoCommand: (0, awilix_1.asClass)(DeleteInfoCommand_js_1.DeleteInfoCommand).scoped(),
    // ============================================================================
    // LOG MODULE
    // ============================================================================
    // Repositories (Scoped)
    logRepo: (0, awilix_1.asClass)(LogRepository_js_1.LogRepository).scoped(),
    // Queries (Scoped)
    getLogStatsQuery: (0, awilix_1.asClass)(GetLogStatsQuery_js_1.GetLogStatsQuery).scoped(),
    getLogContentQuery: (0, awilix_1.asClass)(GetLogContentQuery_js_1.GetLogContentQuery).scoped(),
    searchLogsQuery: (0, awilix_1.asClass)(SearchLogsQuery_js_1.SearchLogsQuery).scoped(),
    // Commands (Scoped)
    cleanupLogsCommand: (0, awilix_1.asClass)(CleanupLogsCommand_js_1.CleanupLogsCommand).scoped(),
    archiveLogsCommand: (0, awilix_1.asClass)(ArchiveLogsCommand_js_1.ArchiveLogsCommand).scoped(),
    // ============================================================================
    // MUNICIPIOS MODULE
    // ============================================================================
    // Repositories (Scoped)
    municipioRepo: (0, awilix_1.asClass)(MunicipioRepository_js_1.MunicipioRepository).scoped(),
    // Queries (Scoped)
    getAllMunicipiosQuery: (0, awilix_1.asClass)(GetAllMunicipiosQuery_js_1.GetAllMunicipiosQuery).scoped(),
    getMunicipiosByEstadoQuery: (0, awilix_1.asClass)(GetMunicipiosByEstadoQuery_js_1.GetMunicipiosByEstadoQuery).scoped(),
    getMunicipioByIdQuery: (0, awilix_1.asClass)(GetMunicipioByIdQuery_js_1.GetMunicipioByIdQuery).scoped(),
    // Commands (Scoped)
    createMunicipioCommand: (0, awilix_1.asClass)(CreateMunicipioCommand_js_1.CreateMunicipioCommand).scoped(),
    updateMunicipioCommand: (0, awilix_1.asClass)(UpdateMunicipioCommand_js_1.UpdateMunicipioCommand).scoped(),
    deleteMunicipioCommand: (0, awilix_1.asClass)(DeleteMunicipioCommand_js_1.DeleteMunicipioCommand).scoped(),
    // ============================================================================
    // PROCESO MODULE
    // ============================================================================
    // Repositories (Scoped)
    procesoRepo: (0, awilix_1.asClass)(ProcesoRepository_js_1.ProcesoRepository).scoped(),
    // Queries (Scoped)
    getAllProcesosQuery: (0, awilix_1.asClass)(GetAllProcesosQuery_js_1.GetAllProcesosQuery).scoped(),
    getProcesoByIdQuery: (0, awilix_1.asClass)(GetProcesoByIdQuery_js_1.GetProcesoByIdQuery).scoped(),
    // Commands (Scoped)
    createProcesoCommand: (0, awilix_1.asClass)(CreateProcesoCommand_js_1.CreateProcesoCommand).scoped(),
    updateProcesoCommand: (0, awilix_1.asClass)(UpdateProcesoCommand_js_1.UpdateProcesoCommand).scoped(),
    deleteProcesoCommand: (0, awilix_1.asClass)(DeleteProcesoCommand_js_1.DeleteProcesoCommand).scoped(),
    // ============================================================================
    // ROLE MODULE
    // ============================================================================
    // Repositories (Scoped)
    roleRepo: (0, awilix_1.asClass)(RoleRepository_js_1.RoleRepository).scoped(),
    // Queries (Scoped)
    getAllRolesQuery: (0, awilix_1.asClass)(GetAllRolesQuery_js_1.GetAllRolesQuery).scoped(),
    getRoleByNameQuery: (0, awilix_1.asClass)(GetRoleByNameQuery_js_1.GetRoleByNameQuery).scoped(),
    // Commands (Scoped)
    createRoleCommand: (0, awilix_1.asClass)(CreateRoleCommand_js_1.CreateRoleCommand).scoped(),
    assignRoleToUserCommand: (0, awilix_1.asClass)(AssignRoleCommand_js_2.AssignRoleCommand).scoped(),
    unassignRoleCommand: (0, awilix_1.asClass)(UnassignRoleCommand_js_1.UnassignRoleCommand).scoped(),
    // Helper functions (Function)
    getUserRoles: (0, awilix_1.asFunction)(function () { return auth_repo_js_1.getUserRoles; }).scoped(),
    // ============================================================================
    // USERROLE MODULE
    // ============================================================================
    // Repositories (Scoped)
    userRoleRepo: (0, awilix_1.asClass)(UserRoleRepository_js_1.UserRoleRepository).scoped(),
    // Queries (Scoped)
    getAllUserRolesQuery: (0, awilix_1.asClass)(GetAllUserRolesQuery_js_1.GetAllUserRolesQuery).scoped(),
    getUserRoleByIdsQuery: (0, awilix_1.asClass)(GetUserRoleByIdsQuery_js_1.GetUserRoleByIdsQuery).scoped(),
    getUserRolesByUsuarioQuery: (0, awilix_1.asClass)(GetUserRolesByUsuarioQuery_js_1.GetUserRolesByUsuarioQuery).scoped(),
    // Commands (Scoped)
    createUserRoleCommand: (0, awilix_1.asClass)(CreateUserRoleCommand_js_1.CreateUserRoleCommand).scoped(),
    deleteUserRoleCommand: (0, awilix_1.asClass)(DeleteUserRoleCommand_js_1.DeleteUserRoleCommand).scoped(),
    // ============================================================================
    // ROLEMENU MODULE
    // ============================================================================
    // Repositories (Scoped)
    roleMenuRepo: (0, awilix_1.asClass)(RoleMenuRepository_js_1.RoleMenuRepository).scoped(),
    tipoMovimientoRepo: (0, awilix_1.asClass)(TipoMovimientoRepository_js_1.TipoMovimientoRepository).scoped(),
    // Queries (Scoped)
    getAllRoleMenusQuery: (0, awilix_1.asClass)(GetAllRoleMenusQuery_js_1.GetAllRoleMenusQuery).scoped(),
    getRoleMenuByIdQuery: (0, awilix_1.asClass)(GetRoleMenuByIdQuery_js_1.GetRoleMenuByIdQuery).scoped(),
    getRoleMenusByRoleIdQuery: (0, awilix_1.asClass)(GetRoleMenusByRoleIdQuery_js_1.GetRoleMenusByRoleIdQuery).scoped(),
    getRoleMenusByTokenRolesQuery: (0, awilix_1.asClass)(GetRoleMenusByTokenRolesQuery_js_1.GetRoleMenusByTokenRolesQuery).scoped(),
    getAllTipoMovimientosQuery: (0, awilix_1.asClass)(GetAllTipoMovimientosQuery_js_1.GetAllTipoMovimientosQuery).scoped(),
    getTipoMovimientoByIdQuery: (0, awilix_1.asClass)(GetTipoMovimientoByIdQuery_js_1.GetTipoMovimientoByIdQuery).scoped(),
    // Commands (Scoped)
    createRoleMenuCommand: (0, awilix_1.asClass)(CreateRoleMenuCommand_js_1.CreateRoleMenuCommand).scoped(),
    updateRoleMenuCommand: (0, awilix_1.asClass)(UpdateRoleMenuCommand_js_1.UpdateRoleMenuCommand).scoped(),
    deleteRoleMenuCommand: (0, awilix_1.asClass)(DeleteRoleMenuCommand_js_1.DeleteRoleMenuCommand).scoped(),
    assignMenuToRoleCommand: (0, awilix_1.asClass)(AssignMenuToRoleCommand_js_1.AssignMenuToRoleCommand).scoped(),
    unassignMenuFromRoleCommand: (0, awilix_1.asClass)(UnassignMenuFromRoleCommand_js_1.UnassignMenuFromRoleCommand).scoped(),
    createTipoMovimientoCommand: (0, awilix_1.asClass)(CreateTipoMovimientoCommand_js_1.CreateTipoMovimientoCommand).scoped(),
    updateTipoMovimientoCommand: (0, awilix_1.asClass)(UpdateTipoMovimientoCommand_js_1.UpdateTipoMovimientoCommand).scoped(),
    deleteTipoMovimientoCommand: (0, awilix_1.asClass)(DeleteTipoMovimientoCommand_js_1.DeleteTipoMovimientoCommand).scoped(),
    // ============================================================================
    // AFECTACIONORG MODULE
    // ============================================================================
    // Repositories (Scoped)
    bitacoraAfectacionRepo: (0, awilix_1.asClass)(BitacoraAfectacionRepository_js_1.BitacoraAfectacionRepository).scoped(),
    estadoAfectacionRepo: (0, awilix_1.asClass)(EstadoAfectacionRepository_js_1.EstadoAfectacionRepository).scoped(),
    progresoUsuarioRepo: (0, awilix_1.asClass)(ProgresoUsuarioRepository_js_1.ProgresoUsuarioRepository).scoped(),
    tableroAfectacionRepo: (0, awilix_1.asClass)(TableroAfectacionRepository_js_1.TableroAfectacionRepository).scoped(),
    ultimaAfectacionRepo: (0, awilix_1.asClass)(UltimaAfectacionRepository_js_1.UltimaAfectacionRepository).scoped(),
    quincenaRepo: (0, awilix_1.asClass)(QuincenaRepository_js_1.QuincenaRepository).scoped(),
    afectacionRepo: (0, awilix_1.asClass)(AfectacionRepository_js_1.AfectacionRepository).scoped(),
    // Queries (Scoped)
    getBitacoraAfectacionQuery: (0, awilix_1.asClass)(GetBitacoraAfectacionQuery_js_1.GetBitacoraAfectacionQuery).scoped(),
    getEstadosAfectacionQuery: (0, awilix_1.asClass)(GetEstadosAfectacionQuery_js_1.GetEstadosAfectacionQuery).scoped(),
    getProgresoUsuarioQuery: (0, awilix_1.asClass)(GetProgresoUsuarioQuery_js_1.GetProgresoUsuarioQuery).scoped(),
    getTableroAfectacionQuery: (0, awilix_1.asClass)(GetTableroAfectacionQuery_js_1.GetTableroAfectacionQuery).scoped(),
    getUltimaAfectacionQuery: (0, awilix_1.asClass)(GetUltimaAfectacionQuery_js_1.GetUltimaAfectacionQuery).scoped(),
    getQuincenaAltaAfectacionQuery: (0, awilix_1.asClass)(GetQuincenaAltaAfectacionQuery_js_1.GetQuincenaAltaAfectacionQuery).scoped(),
    // Commands (Scoped)
    registrarAfectacionCommand: (0, awilix_1.asClass)(RegistrarAfectacionCommand_js_1.RegistrarAfectacionCommand).scoped(),
    // ============================================================================
    // EXPEDIENTE MODULE
    // ============================================================================
    // Repositories (Scoped)
    documentTypeRepo: (0, awilix_1.asClass)(DocumentTypeRepository_js_1.DocumentTypeRepository).scoped(),
    expedienteRepo: (0, awilix_1.asClass)(ExpedienteRepository_js_1.ExpedienteRepository).scoped(),
    expedienteArchivoRepo: (0, awilix_1.asClass)(ExpedienteArchivoRepository_js_1.ExpedienteArchivoRepository).scoped(),
    // Queries (Scoped)
    getAllDocumentTypesQuery: (0, awilix_1.asClass)(GetAllDocumentTypesQuery_js_1.GetAllDocumentTypesQuery).scoped(),
    getDocumentTypeByIdQuery: (0, awilix_1.asClass)(GetDocumentTypeByIdQuery_js_1.GetDocumentTypeByIdQuery).scoped(),
    getDocumentTypeByCodeQuery: (0, awilix_1.asClass)(GetDocumentTypeByCodeQuery_js_1.GetDocumentTypeByCodeQuery).scoped(),
    getAllExpedientesQuery: (0, awilix_1.asClass)(GetAllExpedientesQuery_js_1.GetAllExpedientesQuery).scoped(),
    getExpedienteByCurpQuery: (0, awilix_1.asClass)(GetExpedienteByCurpQuery_js_1.GetExpedienteByCurpQuery).scoped(),
    getExpedienteArchivoByIdQuery: (0, awilix_1.asClass)(GetExpedienteArchivoByIdQuery_js_1.GetExpedienteArchivoByIdQuery).scoped(),
    getExpedienteArchivosByCurpQuery: (0, awilix_1.asClass)(GetExpedienteArchivosByCurpQuery_js_1.GetExpedienteArchivosByCurpQuery).scoped(),
    // Commands (Scoped)
    createDocumentTypeCommand: (0, awilix_1.asClass)(CreateDocumentTypeCommand_js_1.CreateDocumentTypeCommand).scoped(),
    updateDocumentTypeCommand: (0, awilix_1.asClass)(UpdateDocumentTypeCommand_js_1.UpdateDocumentTypeCommand).scoped(),
    deleteDocumentTypeCommand: (0, awilix_1.asClass)(DeleteDocumentTypeCommand_js_1.DeleteDocumentTypeCommand).scoped(),
    createExpedienteCommand: (0, awilix_1.asClass)(CreateExpedienteCommand_js_1.CreateExpedienteCommand).scoped(),
    updateExpedienteCommand: (0, awilix_1.asClass)(UpdateExpedienteCommand_js_1.UpdateExpedienteCommand).scoped(),
    deleteExpedienteCommand: (0, awilix_1.asClass)(DeleteExpedienteCommand_js_1.DeleteExpedienteCommand).scoped(),
    createExpedienteArchivoCommand: (0, awilix_1.asClass)(CreateExpedienteArchivoCommand_js_1.CreateExpedienteArchivoCommand).scoped(),
    updateExpedienteArchivoCommand: (0, awilix_1.asClass)(UpdateExpedienteArchivoCommand_js_1.UpdateExpedienteArchivoCommand).scoped(),
    deleteExpedienteArchivoCommand: (0, awilix_1.asClass)(DeleteExpedienteArchivoCommand_js_1.DeleteExpedienteArchivoCommand).scoped(),
    // ============================================================================
    // AFILIADOS PERSONAL MODULE
    // ============================================================================
    // Repositories (Scoped)
    afiliadoPersonalRepo: (0, awilix_1.asClass)(AfiliadoPersonalRepository_js_1.AfiliadoPersonalRepository).scoped(),
    // Queries (Scoped)
    getPlantillaQuery: (0, awilix_1.asClass)(GetPlantillaQuery_js_1.GetPlantillaQuery).scoped(),
    busquedaHistoricoQuery: (0, awilix_1.asClass)(BusquedaHistoricoQuery_js_1.BusquedaHistoricoQuery).scoped(),
    // ============================================================================
    // ORGANICA0 MODULE
    // ============================================================================
    // Repositories (Scoped)
    organica0Repo: (0, awilix_1.asClass)(Organica0Repository_js_1.Organica0Repository).scoped(),
    // Queries (Scoped)
    getAllOrganica0Query: (0, awilix_1.asClass)(GetAllOrganica0Query_js_1.GetAllOrganica0Query).scoped(),
    getOrganica0ByIdQuery: (0, awilix_1.asClass)(GetOrganica0ByIdQuery_js_1.GetOrganica0ByIdQuery).scoped(),
    // Commands (Scoped)
    createOrganica0Command: (0, awilix_1.asClass)(CreateOrganica0Command_js_1.CreateOrganica0Command).scoped(),
    updateOrganica0Command: (0, awilix_1.asClass)(UpdateOrganica0Command_js_1.UpdateOrganica0Command).scoped(),
    deleteOrganica0Command: (0, awilix_1.asClass)(DeleteOrganica0Command_js_1.DeleteOrganica0Command).scoped(),
    // ============================================================================
    // ORGANICA1 MODULE
    // ============================================================================
    // Repositories (Scoped)
    organica1Repo: (0, awilix_1.asClass)(Organica1Repository_js_1.Organica1Repository).scoped(),
    // Queries (Scoped)
    getAllOrganica1Query: (0, awilix_1.asClass)(GetAllOrganica1Query_js_1.GetAllOrganica1Query).scoped(),
    getOrganica1ByIdQuery: (0, awilix_1.asClass)(GetOrganica1ByIdQuery_js_1.GetOrganica1ByIdQuery).scoped(),
    getOrganica1ByClaveOrganica0Query: (0, awilix_1.asClass)(GetOrganica1ByClaveOrganica0Query_js_1.GetOrganica1ByClaveOrganica0Query).scoped(),
    // Commands (Scoped)
    createOrganica1Command: (0, awilix_1.asClass)(CreateOrganica1Command_js_1.CreateOrganica1Command).scoped(),
    updateOrganica1Command: (0, awilix_1.asClass)(UpdateOrganica1Command_js_1.UpdateOrganica1Command).scoped(),
    deleteOrganica1Command: (0, awilix_1.asClass)(DeleteOrganica1Command_js_1.DeleteOrganica1Command).scoped(),
    // ============================================================================
    // ORGANICA2 MODULE
    // ============================================================================
    // Repositories (Scoped)
    organica2Repo: (0, awilix_1.asClass)(Organica2Repository_js_1.Organica2Repository).scoped(),
    // Queries (Scoped)
    getAllOrganica2Query: (0, awilix_1.asClass)(GetAllOrganica2Query_js_1.GetAllOrganica2Query).scoped(),
    getOrganica2ByIdQuery: (0, awilix_1.asClass)(GetOrganica2ByIdQuery_js_1.GetOrganica2ByIdQuery).scoped(),
    getOrganica2ByClaveOrganica0And1Query: (0, awilix_1.asClass)(GetOrganica2ByClaveOrganica0And1Query_js_1.GetOrganica2ByClaveOrganica0And1Query).scoped(),
    // Commands (Scoped)
    createOrganica2Command: (0, awilix_1.asClass)(CreateOrganica2Command_js_1.CreateOrganica2Command).scoped(),
    updateOrganica2Command: (0, awilix_1.asClass)(UpdateOrganica2Command_js_1.UpdateOrganica2Command).scoped(),
    deleteOrganica2Command: (0, awilix_1.asClass)(DeleteOrganica2Command_js_1.DeleteOrganica2Command).scoped(),
    // ============================================================================
    // ORGANICA3 MODULE
    // ============================================================================
    // Repositories (Scoped)
    organica3Repo: (0, awilix_1.asClass)(Organica3Repository_js_1.Organica3Repository).scoped(),
    // Queries (Scoped)
    getAllOrganica3Query: (0, awilix_1.asClass)(GetAllOrganica3Query_js_1.GetAllOrganica3Query).scoped(),
    getOrganica3ByIdQuery: (0, awilix_1.asClass)(GetOrganica3ByIdQuery_js_1.GetOrganica3ByIdQuery).scoped(),
    getOrganica3ByClaveOrganica0And1And2Query: (0, awilix_1.asClass)(GetOrganica3ByClaveOrganica0And1And2Query_js_1.GetOrganica3ByClaveOrganica0And1And2Query).scoped(),
    // Commands (Scoped)
    createOrganica3Command: (0, awilix_1.asClass)(CreateOrganica3Command_js_1.CreateOrganica3Command).scoped(),
    updateOrganica3Command: (0, awilix_1.asClass)(UpdateOrganica3Command_js_1.UpdateOrganica3Command).scoped(),
    deleteOrganica3Command: (0, awilix_1.asClass)(DeleteOrganica3Command_js_1.DeleteOrganica3Command).scoped(),
    // ============================================================================
    // ORGANICA CASCADE MODULE
    // ============================================================================
    // Repositories (Scoped)
    organicaCascadeRepo: (0, awilix_1.asClass)(OrganicaCascadeRepository_js_1.OrganicaCascadeRepository).scoped(),
    // Services (Scoped)
    ejeService: (0, awilix_1.asClass)(eje_service_js_1.EjeService).scoped(),
    programaService: (0, awilix_1.asClass)(programa_service_js_1.ProgramaService).scoped(),
    lineaEstrategicaService: (0, awilix_1.asClass)(linea_estrategica_service_js_1.LineaEstrategicaService).scoped(),
    indicadorService: (0, awilix_1.asClass)(indicador_service_js_1.IndicadorService).scoped(),
    indicadorAnualService: (0, awilix_1.asClass)(indicador_anual_service_js_1.IndicadorAnualService).scoped(),
    dimensionService: (0, awilix_1.asClass)(dimension_service_js_1.DimensionService).scoped(),
    unidadMedidaService: (0, awilix_1.asClass)(unidad_medida_service_js_1.UnidadMedidaService).scoped(),
    dependenciaService: (0, awilix_1.asClass)(dependencia_service_js_1.DependenciaService).scoped(),
    organica1Service: (0, awilix_1.asClass)(organica1_service_js_1.Organica1Service).scoped(),
    organica2Service: (0, awilix_1.asClass)(organica2_service_js_1.Organica2Service).scoped(),
    organica3Service: (0, awilix_1.asClass)(organica3_service_js_1.Organica3Service).scoped(),
    reportesService: (0, awilix_1.asClass)(reportes_service_js_1.ReportesService).scoped(),
    afectacionOrgService: (0, awilix_1.asClass)(afectacionOrg_service_js_1.AfectacionOrgService).scoped(),
    // Queries (Scoped)
    getOrganica1ChildrenQuery: (0, awilix_1.asClass)(GetOrganica1ChildrenQuery_js_1.GetOrganica1ChildrenQuery).scoped(),
    getOrganica2ChildrenQuery: (0, awilix_1.asClass)(GetOrganica2ChildrenQuery_js_1.GetOrganica2ChildrenQuery).scoped(),
    getOrganica3ChildrenQuery: (0, awilix_1.asClass)(GetOrganica3ChildrenQuery_js_1.GetOrganica3ChildrenQuery).scoped(),
    // ============================================================================
    // PERSONAL MODULE
    // ============================================================================
    // Repositories (Scoped)
    personalRepo: (0, awilix_1.asClass)(PersonalRepository_js_1.PersonalRepository).scoped(),
    // Queries (Scoped)
    getAllPersonalQuery: (0, awilix_1.asClass)(GetAllPersonalQuery_js_1.GetAllPersonalQuery).scoped(),
    getPersonalByIdQuery: (0, awilix_1.asClass)(GetPersonalByIdQuery_js_1.GetPersonalByIdQuery).scoped(),
    // Commands (Scoped)
    createPersonalCommand: (0, awilix_1.asClass)(CreatePersonalCommand_js_1.CreatePersonalCommand).scoped(),
    updatePersonalCommand: (0, awilix_1.asClass)(UpdatePersonalCommand_js_1.UpdatePersonalCommand).scoped(),
    deletePersonalCommand: (0, awilix_1.asClass)(DeletePersonalCommand_js_1.DeletePersonalCommand).scoped(),
    // ============================================================================
    // ORG_PERSONAL MODULE
    // ============================================================================
    // Repositories (Scoped)
    orgPersonalRepo: (0, awilix_1.asClass)(OrgPersonalRepository_js_1.OrgPersonalRepository).scoped(),
    // Queries (Scoped)
    getAllOrgPersonalQuery: (0, awilix_1.asClass)(GetAllOrgPersonalQuery_js_1.GetAllOrgPersonalQuery).scoped(),
    getOrgPersonalByIdQuery: (0, awilix_1.asClass)(GetOrgPersonalByIdQuery_js_1.GetOrgPersonalByIdQuery).scoped(),
    getOrgPersonalBySearchQuery: (0, awilix_1.asClass)(GetOrgPersonalBySearchQuery_js_1.GetOrgPersonalBySearchQuery).scoped(),
    // Commands (Scoped)
    createOrgPersonalCommand: (0, awilix_1.asClass)(CreateOrgPersonalCommand_js_1.CreateOrgPersonalCommand).scoped(),
    updateOrgPersonalCommand: (0, awilix_1.asClass)(UpdateOrgPersonalCommand_js_1.UpdateOrgPersonalCommand).scoped(),
    deleteOrgPersonalCommand: (0, awilix_1.asClass)(DeleteOrgPersonalCommand_js_1.DeleteOrgPersonalCommand).scoped(),
    // ============================================================================
    // APORTACIONES FONDOS MODULE
    // ============================================================================
    // Repositories (Scoped)
    aportacionFondoRepo: (0, awilix_1.asClass)(AportacionFondoRepository_js_1.AportacionFondoRepository).scoped(),
    // Queries (Scoped)
    getAportacionesIndividualesQuery: (0, awilix_1.asClass)(GetAportacionesIndividualesQuery_js_1.GetAportacionesIndividualesQuery).scoped(),
    getAportacionesCompletasQuery: (0, awilix_1.asClass)(GetAportacionesCompletasQuery_js_1.GetAportacionesCompletasQuery).scoped()
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
