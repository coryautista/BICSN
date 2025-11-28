"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfiliadoPersonalRepository = void 0;
/**
 * Firebird implementation of AfiliadoPersonalRepository
 */
var AfiliadoPersonalRepository = /** @class */ (function () {
    function AfiliadoPersonalRepository(firebirdDb) {
        this.firebirdDb = firebirdDb;
    }
    /**
     * Get employee roster by organic keys
     * Returns employees with their latest active ORG_PERSONAL record
     */
    /**
     * Get employee roster by organic keys
     * Returns employees with their latest active ORG_PERSONAL record
     */
    AfiliadoPersonalRepository.prototype.obtenerPlantilla = function (claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log('🔍 [DEBUG] Iniciando consulta obtenerPlantilla con parámetros:', { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1 });
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var sql = "\n        SELECT\n          p.INTERNO,\n          p.CURP,\n          p.RFC,\n          p.NOEMPLEADO,\n          p.NOMBRE,\n          p.APELLIDO_PATERNO,\n          p.APELLIDO_MATERNO,\n          p.FECHA_NACIMIENTO,\n          p.SEGURO_SOCIAL,\n          p.CALLE_NUMERO,\n          p.FRACCIONAMIENTO,\n          p.CODIGO_POSTAL,\n          p.TELEFONO,\n          p.SEXO,\n          p.ESTADO_CIVIL,\n          p.LOCALIDAD,\n          p.MUNICIPIO,\n          p.ESTADO,\n          p.PAIS,\n          p.DEPENDIENTES,\n          p.POSEE_INMUEBLES,\n          p.FULLNAME,\n          p.FECHA_CARTA,\n          p.EMAIL,\n          p.NACIONALIDAD,\n          p.FECHA_ALTA,\n          p.CELULAR,\n          p.EXPEDIENTE,\n          p.F_EXPEDIENTE,\n          o.CLAVE_ORGANICA_0,\n          o.CLAVE_ORGANICA_1,\n          o.CLAVE_ORGANICA_2,\n          o.CLAVE_ORGANICA_3,\n          o.SUELDO,\n          o.OTRAS_PRESTACIONES,\n          o.QUINQUENIOS,\n          o.ACTIVO,\n          o.FECHA_MOV_ALT,\n          o.ORGS1,\n          o.ORGS2,\n          o.ORGS3,\n          o.ORGS,\n          o.DSUELDO,\n          o.DOTRAS_PRESTACIONES,\n          o.DQUINQUENIOS,\n          o.APLICAR,\n          o.BC,\n          o.PORCENTAJE\n        FROM PERSONAL p\n        INNER JOIN ORG_PERSONAL o\n          ON o.INTERNO = p.INTERNO\n         AND o.ACTIVO IN ('A', 'L')\n         AND o.CLAVE_ORGANICA_0 = ?\n         AND o.CLAVE_ORGANICA_1 = ?\n         AND o.FECHA_MOV_ALT = (\n               SELECT MAX(x.FECHA_MOV_ALT)\n               FROM ORG_PERSONAL x\n               WHERE x.INTERNO = p.INTERNO\n                 AND x.CLAVE_ORGANICA_0 = ?\n                 AND x.CLAVE_ORGANICA_1 = ?\n             )\n         AND o.ORGS = (\n               SELECT MAX(x2.ORGS)\n               FROM ORG_PERSONAL x2\n               WHERE x2.INTERNO = p.INTERNO\n                 AND x2.CLAVE_ORGANICA_0 = ?\n                 AND x2.CLAVE_ORGANICA_1 = ?\n                 AND x2.FECHA_MOV_ALT = o.FECHA_MOV_ALT\n             )\n      ";
                        console.log('🔍 [DEBUG] SQL Query:', sql);
                        console.log('🔍 [DEBUG] SQL Parameters:', [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1]);
                        _this.firebirdDb.query(sql, [claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1, claveOrganica0, claveOrganica1], function (err, result) {
                            console.log('🔍 [DEBUG] Firebird query callback ejecutado');
                            if (err) {
                                console.error('🔍 [DEBUG] Error en consulta Firebird:', err);
                                reject(err);
                                return;
                            }
                            console.log('🔍 [DEBUG] Resultado de consulta:', result ? result.length : 'undefined', 'registros');
                            var records = result.map(function (row) { return _this.mapRowToEntity(row); });
                            console.log('🔍 [DEBUG] Registros mapeados:', records.length);
                            resolve(records);
                        });
                    })];
            });
        });
    };
    /**
     * Search employees in historical data
     * Searches by RFC, CURP, INTERNO, NOEMPLEADO, or FULLNAME
     * Returns employees with their latest ORG_PERSONAL record regardless of ACTIVO status
     */
    AfiliadoPersonalRepository.prototype.busquedaHistorico = function (searchTerm) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var sql = "\n        SELECT\n          p.INTERNO,\n          p.CURP,\n          p.RFC,\n          p.NOEMPLEADO,\n          p.NOMBRE,\n          p.APELLIDO_PATERNO,\n          p.APELLIDO_MATERNO,\n          p.FECHA_NACIMIENTO,\n          p.SEGURO_SOCIAL,\n          p.CALLE_NUMERO,\n          p.FRACCIONAMIENTO,\n          p.CODIGO_POSTAL,\n          p.TELEFONO,\n          p.SEXO,\n          p.ESTADO_CIVIL,\n          p.LOCALIDAD,\n          p.MUNICIPIO,\n          p.ESTADO,\n          p.PAIS,\n          p.DEPENDIENTES,\n          p.POSEE_INMUEBLES,\n          p.FULLNAME,\n          p.FECHA_CARTA,\n          p.EMAIL,\n          p.NACIONALIDAD,\n          p.FECHA_ALTA,\n          p.CELULAR,\n          p.EXPEDIENTE,\n          p.F_EXPEDIENTE,\n          o.CLAVE_ORGANICA_0,\n          o.CLAVE_ORGANICA_1,\n          o.CLAVE_ORGANICA_2,\n          o.CLAVE_ORGANICA_3,\n          o.SUELDO,\n          o.OTRAS_PRESTACIONES,\n          o.QUINQUENIOS,\n          o.ACTIVO,\n          o.FECHA_MOV_ALT,\n          o.ORGS1,\n          o.ORGS2,\n          o.ORGS3,\n          o.ORGS,\n          o.DSUELDO,\n          o.DOTRAS_PRESTACIONES,\n          o.DQUINQUENIOS,\n          o.APLICAR,\n          o.BC,\n          o.PORCENTAJE\n        FROM PERSONAL p\n        INNER JOIN ORG_PERSONAL o\n          ON o.INTERNO = p.INTERNO\n         AND o.FECHA_MOV_ALT = (\n               SELECT MAX(x.FECHA_MOV_ALT)\n               FROM ORG_PERSONAL x\n               WHERE x.INTERNO = p.INTERNO\n             )\n         AND o.ORGS = (\n               SELECT MAX(x2.ORGS)\n               FROM ORG_PERSONAL x2\n               WHERE x2.INTERNO = p.INTERNO\n                 AND x2.FECHA_MOV_ALT = o.FECHA_MOV_ALT\n             )\n      ";
                        if (searchTerm && searchTerm.trim()) {
                            var searchValue = searchTerm.trim().toUpperCase();
                            var escapedSearch = searchValue.replace(/'/g, "''");
                            sql += "\n          WHERE (UPPER(p.RFC) CONTAINING '".concat(escapedSearch, "'\n              OR UPPER(p.CURP) CONTAINING '").concat(escapedSearch, "'\n              OR UPPER(p.INTERNO) CONTAINING '").concat(escapedSearch, "'\n              OR UPPER(p.NOEMPLEADO) CONTAINING '").concat(escapedSearch, "'\n              OR UPPER(p.FULLNAME) CONTAINING '").concat(escapedSearch, "')\n        ");
                        }
                        _this.firebirdDb.query(sql, [], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return _this.mapRowToEntity(row); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    /**
     * Map database row to AfiliadoPersonal entity
     */
    AfiliadoPersonalRepository.prototype.mapRowToEntity = function (row) {
        return {
            INTERNO: row.INTERNO,
            CURP: row.CURP,
            RFC: row.RFC,
            NOEMPLEADO: row.NOEMPLEADO,
            NOMBRE: row.NOMBRE,
            APELLIDO_PATERNO: row.APELLIDO_PATERNO,
            APELLIDO_MATERNO: row.APELLIDO_MATERNO,
            FECHA_NACIMIENTO: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString() : null,
            SEGURO_SOCIAL: row.SEGURO_SOCIAL,
            CALLE_NUMERO: row.CALLE_NUMERO,
            FRACCIONAMIENTO: row.FRACCIONAMIENTO,
            CODIGO_POSTAL: row.CODIGO_POSTAL,
            TELEFONO: row.TELEFONO,
            SEXO: row.SEXO,
            ESTADO_CIVIL: row.ESTADO_CIVIL,
            LOCALIDAD: row.LOCALIDAD,
            MUNICIPIO: row.MUNICIPIO,
            ESTADO: row.ESTADO,
            PAIS: row.PAIS,
            DEPENDIENTES: row.DEPENDIENTES,
            POSEE_INMUEBLES: row.POSEE_INMUEBLES,
            FULLNAME: row.FULLNAME,
            FECHA_CARTA: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
            EMAIL: row.EMAIL,
            NACIONALIDAD: row.NACIONALIDAD,
            FECHA_ALTA: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
            CELULAR: row.CELULAR,
            EXPEDIENTE: row.EXPEDIENTE,
            F_EXPEDIENTE: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
            CLAVE_ORGANICA_0: row.CLAVE_ORGANICA_0,
            CLAVE_ORGANICA_1: row.CLAVE_ORGANICA_1,
            CLAVE_ORGANICA_2: row.CLAVE_ORGANICA_2,
            CLAVE_ORGANICA_3: row.CLAVE_ORGANICA_3,
            SUELDO: row.SUELDO,
            OTRAS_PRESTACIONES: row.OTRAS_PRESTACIONES,
            QUINQUENIOS: row.QUINQUENIOS,
            ACTIVO: row.ACTIVO,
            FECHA_MOV_ALT: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
            ORGS1: row.ORGS1,
            ORGS2: row.ORGS2,
            ORGS3: row.ORGS3,
            ORGS: row.ORGS,
            DSUELDO: row.DSUELDO,
            DOTRAS_PRESTACIONES: row.DOTRAS_PRESTACIONES,
            DQUINQUENIOS: row.DQUINQUENIOS,
            APLICAR: row.APLICAR,
            BC: row.BC,
            PORCENTAJE: row.PORCENTAJE
        };
    };
    return AfiliadoPersonalRepository;
}());
exports.AfiliadoPersonalRepository = AfiliadoPersonalRepository;
