"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.GetMovimientosQuincenalesQuery = void 0;
var mssql_1 = require("mssql");
var pino_1 = require("pino");
var errors_js_1 = require("../../domain/errors.js");
var logger = (0, pino_1.default)({
    name: 'getMovimientosQuincenalesQuery',
    level: process.env.LOG_LEVEL || 'info'
});
var GetMovimientosQuincenalesQuery = /** @class */ (function () {
    function GetMovimientosQuincenalesQuery(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    GetMovimientosQuincenalesQuery.prototype.execute = function (userOrg0, userOrg1) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, result, movimientos, sample, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logContext = {
                            operation: 'getMovimientosQuincenales',
                            userOrg0: userOrg0,
                            userOrg1: userOrg1
                        };
                        logger.info(logContext, 'Consultando movimientos quincenales');
                        // Validar parámetros de entrada
                        if (!userOrg0 || !userOrg1) {
                            logger.warn(logContext, 'Parámetros de organización inválidos');
                            throw new errors_js_1.InvalidAfiliadoDataError('userOrg0/userOrg1', 'Parámetros de organización requeridos');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('userOrg0', mssql_1.default.Char(2), userOrg0)
                                .input('userOrg1', mssql_1.default.Char(2), userOrg1)
                                .query("\n      SELECT\n        -- Afiliado fields\n        a.id as afiliado_id,\n        a.folio,\n        a.apellidoPaterno,\n        a.apellidoMaterno,\n        a.nombre,\n        a.curp,\n        a.rfc,\n        a.numeroSeguroSocial,\n        a.fechaNacimiento,\n        a.entidadFederativaNacId,\n        a.domicilioCalle,\n        a.domicilioNumeroExterior,\n        a.domicilioNumeroInterior,\n        a.domicilioEntreCalle1,\n        a.domicilioEntreCalle2,\n        a.domicilioColonia,\n        a.domicilioCodigoPostal,\n        a.telefono,\n        a.estadoCivilId,\n        a.sexo,\n        a.correoElectronico,\n        a.estatus,\n        a.interno,\n        a.noEmpleado,\n        a.localidad,\n        a.municipio,\n        a.estado,\n        a.pais,\n        a.dependientes,\n        a.poseeInmuebles,\n        a.fechaCarta,\n        a.nacionalidad,\n        a.fechaAlta,\n        a.celular,\n        a.expediente,\n        a.quincenaAplicacion,\n        a.anioAplicacion,\n        a.numValidacion,\n\n        -- AfiliadoOrg fields\n        ao.id as afiliadoOrg_id,\n        ao.afiliadoId,\n        ao.nivel0Id,\n        ao.nivel1Id,\n        ao.nivel2Id,\n        ao.nivel3Id,\n        ao.claveOrganica0,\n        ao.claveOrganica1,\n        ao.claveOrganica2,\n        ao.claveOrganica3,\n        ao.interno as internoOrg,\n        ao.sueldo,\n        ao.otrasPrestaciones,\n        ao.quinquenios,\n        ao.activo,\n        ao.fechaMovAlt,\n        ao.orgs1,\n        ao.orgs2,\n        ao.orgs3,\n        ao.orgs4,\n        ao.dSueldo,\n        ao.dOtrasPrestaciones,\n        ao.dQuinquenios,\n        ao.aplicar,\n        ao.bc,\n        ao.porcentaje,\n\n        -- Movimiento fields\n        m.id as movimiento_id,\n        m.quincenaId,\n        m.tipoMovimientoId,\n        m.afiliadoId as movimiento_afiliadoId,\n        m.fecha,\n        m.observaciones,\n        m.folio as movimiento_folio,\n        m.estatus as movimiento_estatus,\n        m.creadoPor,\n        m.creadoPorUid,\n\n        -- TipoMovimiento fields\n        tm.nombre as tipoMovimientoDescripcion,\n\n        -- AfiliadoStatusControl fields\n        statusCtrl.nombreStatus as numValidacionDescripcion\n\n      FROM afi.Afiliado a\n      INNER JOIN afi.AfiliadoOrg ao ON a.id = ao.afiliadoId\n      INNER JOIN afi.Movimiento m ON a.id = m.afiliadoId\n      LEFT JOIN afi.TipoMovimiento tm ON m.tipoMovimientoId = tm.id\n      LEFT JOIN afi.AfiliadoStatusControl statusCtrl ON a.numValidacion = statusCtrl.numValidacion\n      WHERE ao.claveOrganica0 = @userOrg0\n        AND ao.claveOrganica1 = @userOrg1\n        AND a.estatus = 1\n        AND m.estatus IN ('A', 'L')\n      ORDER BY a.id, m.id\n    ")];
                    case 2:
                        result = _a.sent();
                        movimientos = result.recordset.map(function (row) {
                            var _a, _b, _c, _d, _e, _f, _g;
                            var afiliadoObj = {
                                id: parseInt(row.afiliado_id) || 0,
                                folio: row.folio ? parseInt(row.folio) : null,
                                apellidoPaterno: row.apellidoPaterno,
                                apellidoMaterno: row.apellidoMaterno,
                                nombre: row.nombre,
                                curp: row.curp,
                                rfc: row.rfc,
                                numeroSeguroSocial: row.numeroSeguroSocial,
                                fechaNacimiento: ((_a = row.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                entidadFederativaNacId: row.entidadFederativaNacId ? parseInt(row.entidadFederativaNacId) : null,
                                domicilioCalle: row.domicilioCalle,
                                domicilioNumeroExterior: row.domicilioNumeroExterior,
                                domicilioNumeroInterior: row.domicilioNumeroInterior,
                                domicilioEntreCalle1: row.domicilioEntreCalle1,
                                domicilioEntreCalle2: row.domicilioEntreCalle2,
                                domicilioColonia: row.domicilioColonia,
                                domicilioCodigoPostal: row.domicilioCodigoPostal ? parseInt(row.domicilioCodigoPostal) : null,
                                telefono: row.telefono,
                                estadoCivilId: row.estadoCivilId ? parseInt(row.estadoCivilId) : null,
                                sexo: row.sexo,
                                correoElectronico: row.correoElectronico,
                                estatus: row.estatus === 1 || row.estatus === true,
                                interno: row.interno ? parseInt(row.interno) : null,
                                noEmpleado: row.noEmpleado,
                                localidad: row.localidad,
                                municipio: row.municipio,
                                estado: row.estado,
                                pais: row.pais,
                                dependientes: row.dependientes ? parseInt(row.dependientes) : null,
                                poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
                                fechaCarta: ((_b = row.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                nacionalidad: row.nacionalidad,
                                fechaAlta: ((_c = row.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                celular: row.celular,
                                expediente: row.expediente,
                                quincenaAplicacion: row.quincenaAplicacion ? parseInt(row.quincenaAplicacion) : null,
                                anioAplicacion: row.anioAplicacion ? parseInt(row.anioAplicacion) : null,
                                numValidacion: row.numValidacion || 1,
                                numValidacionDescripcion: row.numValidacionDescripcion,
                                createdAt: ((_d = row.afiliado_createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_e = row.afiliado_updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                            };
                            console.log('DEBUG: Raw numValidacion:', row.numValidacion);
                            console.log('DEBUG: Raw numValidacionDescripcion:', row.numValidacionDescripcion);
                            console.log('DEBUG: Raw tipoMovimientoDescripcion:', row.tipoMovimientoDescripcion);
                            console.log('DEBUG: Final afiliado object:', JSON.stringify(afiliadoObj, null, 2));
                            return {
                                afiliado: afiliadoObj,
                                afiliadoOrg: {
                                    id: parseInt(row.afiliadoOrg_id) || 0,
                                    afiliadoId: parseInt(row.afiliadoId) || 0,
                                    nivel0Id: row.nivel0Id ? parseInt(row.nivel0Id) : null,
                                    nivel1Id: row.nivel1Id ? parseInt(row.nivel1Id) : null,
                                    nivel2Id: row.nivel2Id ? parseInt(row.nivel2Id) : null,
                                    nivel3Id: row.nivel3Id ? parseInt(row.nivel3Id) : null,
                                    claveOrganica0: row.claveOrganica0,
                                    claveOrganica1: row.claveOrganica1,
                                    claveOrganica2: row.claveOrganica2,
                                    claveOrganica3: row.claveOrganica3,
                                    interno: row.internoOrg ? parseInt(row.internoOrg) : null,
                                    sueldo: row.sueldo ? parseFloat(row.sueldo) : null,
                                    otrasPrestaciones: row.otrasPrestaciones ? parseFloat(row.otrasPrestaciones) : null,
                                    quinquenios: row.quinquenios ? parseFloat(row.quinquenios) : null,
                                    activo: row.activo === 1 || row.activo === true,
                                    fechaMovAlt: ((_f = row.fechaMovAlt) === null || _f === void 0 ? void 0 : _f.toISOString().split('T')[0]) || null,
                                    orgs1: row.orgs1,
                                    orgs2: row.orgs2,
                                    orgs3: row.orgs3,
                                    orgs4: row.orgs4,
                                    dSueldo: row.dSueldo,
                                    dOtrasPrestaciones: row.dOtrasPrestaciones,
                                    dQuinquenios: row.dQuinquenios,
                                    aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                    bc: row.bc,
                                    porcentaje: row.porcentaje ? parseFloat(row.porcentaje) : null
                                },
                                movimiento: {
                                    id: parseInt(row.movimiento_id) || 0,
                                    quincenaId: row.quincenaId,
                                    tipoMovimientoId: row.tipoMovimientoId ? parseInt(row.tipoMovimientoId) : 0,
                                    tipoMovimientoDescripcion: row.tipoMovimientoDescripcion,
                                    afiliadoId: parseInt(row.movimiento_afiliadoId) || 0,
                                    fecha: ((_g = row.fecha) === null || _g === void 0 ? void 0 : _g.toISOString().split('T')[0]) || null,
                                    observaciones: row.observaciones,
                                    folio: row.movimiento_folio,
                                    estatus: row.movimiento_estatus,
                                    creadoPor: row.creadoPor ? parseInt(row.creadoPor) : null,
                                    creadoPorUid: row.creadoPorUid
                                }
                            };
                        });
                        console.log('DEBUG: Final movimientos array:', JSON.stringify(movimientos, null, 2));
                        // Debug minimal fields to verify presence in runtime without exposing sensitive data
                        if (movimientos.length > 0) {
                            sample = movimientos[0];
                            logger.info(__assign(__assign({}, logContext), { sample: {
                                    afiliadoId: sample.afiliado.id,
                                    numValidacion: sample.afiliado.numValidacion,
                                    numValidacionDescripcion: sample.afiliado.numValidacionDescripcion,
                                    tipoMovimientoDescripcion: sample.movimiento.tipoMovimientoDescripcion
                                } }), 'Verificación de campos de validación en respuesta');
                        }
                        logger.info(__assign(__assign({}, logContext), { count: movimientos.length }), 'Consulta de movimientos quincenales completada exitosamente');
                        return [2 /*return*/, movimientos];
                    case 3:
                        error_1 = _a.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Error desconocido';
                        logger.error(__assign(__assign({}, logContext), { error: errorMessage, stack: error_1 instanceof Error ? error_1.stack : undefined }), 'Error al consultar movimientos quincenales');
                        throw new errors_js_1.AfiliadoQueryError('Error al obtener movimientos quincenales', {
                            originalError: errorMessage,
                            userOrg0: userOrg0,
                            userOrg1: userOrg1
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GetMovimientosQuincenalesQuery;
}());
exports.GetMovimientosQuincenalesQuery = GetMovimientosQuincenalesQuery;
