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
exports.CreateCompleteAfiliadoCommand = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var mssql_js_2 = require("../../../../db/mssql.js");
var pino_1 = require("pino");
var errors_js_1 = require("../../domain/errors.js");
var logger = (0, pino_1.default)({
    name: 'createCompleteAfiliadoCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateCompleteAfiliadoCommand = /** @class */ (function () {
    function CreateCompleteAfiliadoCommand(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    CreateCompleteAfiliadoCommand.prototype.execute = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var logContext, duplicateQuery, duplicate, duplicateField, p, transaction, folio, folioResult, quincenaAplicacion, anioAplicacion, quincenaData, afiliadoRequest, afiliadoResult, afiliadoRow, afiliadoId, afiliadoOrgRequest, afiliadoOrgResult, afiliadoOrgRow, quincenaId, movimientoRequest, movimientoResult, movimientoRow, error_1, errorMessage, errorStack;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        logContext = {
                            operation: 'createCompleteAfiliado',
                            curp: data.afiliado.curp,
                            rfc: data.afiliado.rfc,
                            numeroSeguroSocial: data.afiliado.numeroSeguroSocial,
                            usuario: data.movimiento.creadoPor
                        };
                        logger.info(logContext, 'Iniciando creación completa de afiliado');
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('curp', mssql_js_1.sql.VarChar(18), data.afiliado.curp)
                                .input('rfc', mssql_js_1.sql.VarChar(13), data.afiliado.rfc)
                                .input('numeroSeguroSocial', mssql_js_1.sql.VarChar(50), data.afiliado.numeroSeguroSocial)
                                .query("\n        SELECT id, curp, rfc, numeroSeguroSocial\n        FROM afi.Afiliado\n        WHERE (curp = @curp AND curp IS NOT NULL)\n           OR (rfc = @rfc AND rfc IS NOT NULL)\n           OR (numeroSeguroSocial = @numeroSeguroSocial AND numeroSeguroSocial IS NOT NULL)\n      ")];
                    case 1:
                        duplicateQuery = _l.sent();
                        if (duplicateQuery.recordset.length > 0) {
                            duplicate = duplicateQuery.recordset[0];
                            duplicateField = duplicate.curp === data.afiliado.curp ? 'CURP'
                                : duplicate.rfc === data.afiliado.rfc ? 'RFC'
                                    : 'NSS';
                            logger.warn(__assign(__assign({}, logContext), { duplicateField: duplicateField, duplicateId: duplicate.id }), "Afiliado ya existe con ".concat(duplicateField));
                            throw new errors_js_1.AfiliadoAlreadyExistsError({
                                field: duplicateField,
                                value: duplicate[duplicateField.toLowerCase()],
                                existingId: duplicate.id
                            });
                        }
                        return [4 /*yield*/, (0, mssql_js_2.getPool)()];
                    case 2:
                        p = _l.sent();
                        transaction = p.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 3:
                        _l.sent();
                        _l.label = 4;
                    case 4:
                        _l.trys.push([4, 13, , 15]);
                        folio = data.afiliado.folio;
                        if (!(!folio || folio === 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, transaction.request().query("\n          SELECT ISNULL(MAX(folio), 0) + 1 AS nextFolio\n          FROM afi.Afiliado\n        ")];
                    case 5:
                        folioResult = _l.sent();
                        folio = folioResult.recordset[0].nextFolio;
                        logger.info(__assign(__assign({}, logContext), { folio: folio }), 'Folio auto-generado para afiliado');
                        _l.label = 6;
                    case 6:
                        quincenaAplicacion = data.afiliado.quincenaAplicacion;
                        anioAplicacion = data.afiliado.anioAplicacion;
                        if (!(!quincenaAplicacion || !anioAplicacion)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getQuincenaAplicacion(data.afiliadoOrg.claveOrganica0 || '', data.afiliadoOrg.claveOrganica1, data.afiliadoOrg.claveOrganica2, data.afiliadoOrg.claveOrganica3, data.movimiento.creadoPor || undefined)];
                    case 7:
                        quincenaData = _l.sent();
                        quincenaAplicacion = quincenaData.quincena;
                        anioAplicacion = quincenaData.anio;
                        logger.info(__assign(__assign({}, logContext), { quincenaAplicacion: quincenaAplicacion, anioAplicacion: anioAplicacion, claveOrganica0: data.afiliadoOrg.claveOrganica0, claveOrganica1: data.afiliadoOrg.claveOrganica1, claveOrganica2: data.afiliadoOrg.claveOrganica2, claveOrganica3: data.afiliadoOrg.claveOrganica3 }), 'Quincena calculada para orgánica');
                        _l.label = 8;
                    case 8:
                        afiliadoRequest = transaction.request()
                            .input('folio', mssql_js_1.sql.Int, folio)
                            .input('apellidoPaterno', mssql_js_1.sql.NVarChar(255), data.afiliado.apellidoPaterno)
                            .input('apellidoMaterno', mssql_js_1.sql.NVarChar(255), data.afiliado.apellidoMaterno)
                            .input('nombre', mssql_js_1.sql.NVarChar(200), data.afiliado.nombre)
                            .input('curp', mssql_js_1.sql.VarChar(18), data.afiliado.curp)
                            .input('rfc', mssql_js_1.sql.VarChar(13), data.afiliado.rfc)
                            .input('numeroSeguroSocial', mssql_js_1.sql.VarChar(50), data.afiliado.numeroSeguroSocial)
                            .input('fechaNacimiento', mssql_js_1.sql.Date, data.afiliado.fechaNacimiento ? new Date(data.afiliado.fechaNacimiento) : null)
                            .input('entidadFederativaNacId', mssql_js_1.sql.Int, data.afiliado.entidadFederativaNacId)
                            .input('domicilioCalle', mssql_js_1.sql.NVarChar(255), data.afiliado.domicilioCalle)
                            .input('domicilioNumeroExterior', mssql_js_1.sql.VarChar(50), data.afiliado.domicilioNumeroExterior)
                            .input('domicilioNumeroInterior', mssql_js_1.sql.VarChar(50), data.afiliado.domicilioNumeroInterior)
                            .input('domicilioEntreCalle1', mssql_js_1.sql.NVarChar(120), data.afiliado.domicilioEntreCalle1)
                            .input('domicilioEntreCalle2', mssql_js_1.sql.NVarChar(120), data.afiliado.domicilioEntreCalle2)
                            .input('domicilioColonia', mssql_js_1.sql.NVarChar(255), data.afiliado.domicilioColonia)
                            .input('domicilioCodigoPostal', mssql_js_1.sql.Int, data.afiliado.domicilioCodigoPostal)
                            .input('telefono', mssql_js_1.sql.VarChar(10), data.afiliado.telefono)
                            .input('estadoCivilId', mssql_js_1.sql.Int, data.afiliado.estadoCivilId)
                            .input('sexo', mssql_js_1.sql.Char(1), data.afiliado.sexo)
                            .input('correoElectronico', mssql_js_1.sql.NVarChar(255), data.afiliado.correoElectronico)
                            .input('estatus', mssql_js_1.sql.Bit, data.afiliado.estatus)
                            .input('interno', mssql_js_1.sql.Int, data.afiliado.interno)
                            .input('noEmpleado', mssql_js_1.sql.VarChar(20), data.afiliado.noEmpleado)
                            .input('localidad', mssql_js_1.sql.NVarChar(150), data.afiliado.localidad)
                            .input('municipio', mssql_js_1.sql.NVarChar(150), data.afiliado.municipio)
                            .input('estado', mssql_js_1.sql.NVarChar(150), data.afiliado.estado)
                            .input('pais', mssql_js_1.sql.NVarChar(100), data.afiliado.pais)
                            .input('dependientes', mssql_js_1.sql.SmallInt, data.afiliado.dependientes)
                            .input('poseeInmuebles', mssql_js_1.sql.Bit, data.afiliado.poseeInmuebles)
                            .input('fechaCarta', mssql_js_1.sql.Date, data.afiliado.fechaCarta ? new Date(data.afiliado.fechaCarta) : null)
                            .input('nacionalidad', mssql_js_1.sql.NVarChar(80), data.afiliado.nacionalidad)
                            .input('fechaAlta', mssql_js_1.sql.Date, data.afiliado.fechaAlta ? new Date(data.afiliado.fechaAlta) : null)
                            .input('celular', mssql_js_1.sql.VarChar(15), data.afiliado.celular)
                            .input('expediente', mssql_js_1.sql.VarChar(50), data.afiliado.expediente)
                            .input('quincenaAplicacion', mssql_js_1.sql.TinyInt, quincenaAplicacion)
                            .input('anioAplicacion', mssql_js_1.sql.SmallInt, anioAplicacion);
                        return [4 /*yield*/, afiliadoRequest.query("\n        INSERT INTO afi.Afiliado (\n          folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc,\n          numeroSeguroSocial, fechaNacimiento, entidadFederativaNacId,\n          domicilioCalle, domicilioNumeroExterior, domicilioNumeroInterior,\n          domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,\n          domicilioCodigoPostal, telefono, estadoCivilId, sexo,\n          correoElectronico, estatus, interno, noEmpleado, localidad,\n          municipio, estado, pais, dependientes, poseeInmuebles,\n          fechaCarta, nacionalidad, fechaAlta, celular, expediente,\n          quincenaAplicacion, anioAplicacion\n        )\n        OUTPUT INSERTED.*\n        VALUES (\n          @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc,\n          @numeroSeguroSocial, @fechaNacimiento, @entidadFederativaNacId,\n          @domicilioCalle, @domicilioNumeroExterior, @domicilioNumeroInterior,\n          @domicilioEntreCalle1, @domicilioEntreCalle2, @domicilioColonia,\n          @domicilioCodigoPostal, @telefono, @estadoCivilId, @sexo,\n          @correoElectronico, @estatus, @interno, @noEmpleado, @localidad,\n          @municipio, @estado, @pais, @dependientes, @poseeInmuebles,\n          @fechaCarta, @nacionalidad, @fechaAlta, @celular, @expediente,\n          @quincenaAplicacion, @anioAplicacion\n        )\n      ")];
                    case 9:
                        afiliadoResult = _l.sent();
                        afiliadoRow = afiliadoResult.recordset[0];
                        afiliadoId = afiliadoRow.id;
                        logger.info(__assign(__assign({}, logContext), { afiliadoId: afiliadoId, folio: folio, quincenaAplicacion: quincenaAplicacion, anioAplicacion: anioAplicacion }), 'Afiliado creado exitosamente');
                        afiliadoOrgRequest = transaction.request()
                            .input('afiliadoId', mssql_js_1.sql.Int, afiliadoId)
                            .input('nivel0Id', mssql_js_1.sql.BigInt, data.afiliadoOrg.nivel0Id)
                            .input('nivel1Id', mssql_js_1.sql.BigInt, data.afiliadoOrg.nivel1Id)
                            .input('nivel2Id', mssql_js_1.sql.BigInt, data.afiliadoOrg.nivel2Id)
                            .input('nivel3Id', mssql_js_1.sql.BigInt, data.afiliadoOrg.nivel3Id)
                            .input('claveOrganica0', mssql_js_1.sql.VarChar(30), data.afiliadoOrg.claveOrganica0)
                            .input('claveOrganica1', mssql_js_1.sql.VarChar(30), data.afiliadoOrg.claveOrganica1)
                            .input('claveOrganica2', mssql_js_1.sql.VarChar(30), data.afiliadoOrg.claveOrganica2)
                            .input('claveOrganica3', mssql_js_1.sql.VarChar(30), data.afiliadoOrg.claveOrganica3)
                            .input('interno', mssql_js_1.sql.Int, data.afiliadoOrg.interno)
                            .input('sueldo', mssql_js_1.sql.Decimal(12, 2), data.afiliadoOrg.sueldo)
                            .input('otrasPrestaciones', mssql_js_1.sql.Decimal(12, 2), data.afiliadoOrg.otrasPrestaciones)
                            .input('quinquenios', mssql_js_1.sql.Decimal(12, 2), data.afiliadoOrg.quinquenios)
                            .input('activo', mssql_js_1.sql.Bit, data.afiliadoOrg.activo)
                            .input('fechaMovAlt', mssql_js_1.sql.Date, data.afiliadoOrg.fechaMovAlt ? new Date(data.afiliadoOrg.fechaMovAlt) : null)
                            .input('orgs1', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.orgs1)
                            .input('orgs2', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.orgs2)
                            .input('orgs3', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.orgs3)
                            .input('orgs4', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.orgs4)
                            .input('dSueldo', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.dSueldo)
                            .input('dOtrasPrestaciones', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.dOtrasPrestaciones)
                            .input('dQuinquenios', mssql_js_1.sql.VarChar(200), data.afiliadoOrg.dQuinquenios)
                            .input('aplicar', mssql_js_1.sql.Bit, data.afiliadoOrg.aplicar)
                            .input('bc', mssql_js_1.sql.VarChar(30), data.afiliadoOrg.bc)
                            .input('porcentaje', mssql_js_1.sql.Decimal(9, 4), data.afiliadoOrg.porcentaje);
                        return [4 /*yield*/, afiliadoOrgRequest.query("\n        INSERT INTO afi.AfiliadoOrg (\n          afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,\n          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,\n          interno, sueldo, otrasPrestaciones, quinquenios, activo,\n          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,\n          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje\n        )\n        OUTPUT INSERTED.*\n        VALUES (\n          @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,\n          @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,\n          @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,\n          @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,\n          @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje\n        )\n      ")];
                    case 10:
                        afiliadoOrgResult = _l.sent();
                        afiliadoOrgRow = afiliadoOrgResult.recordset[0];
                        quincenaId = data.movimiento.quincenaId;
                        if (!quincenaId) {
                            quincenaId = "".concat(anioAplicacion, "-").concat(String(quincenaAplicacion).padStart(2, '0'));
                        }
                        movimientoRequest = transaction.request()
                            .input('quincenaId', mssql_js_1.sql.VarChar(30), quincenaId)
                            .input('tipoMovimientoId', mssql_js_1.sql.Int, data.movimiento.tipoMovimientoId)
                            .input('afiliadoId', mssql_js_1.sql.Int, afiliadoId)
                            .input('fecha', mssql_js_1.sql.Date, data.movimiento.fecha ? new Date(data.movimiento.fecha) : null)
                            .input('observaciones', mssql_js_1.sql.NVarChar(1024), data.movimiento.observaciones)
                            .input('folio', mssql_js_1.sql.VarChar(100), data.movimiento.folio)
                            .input('estatus', mssql_js_1.sql.VarChar(30), data.movimiento.estatus)
                            .input('creadoPor', mssql_js_1.sql.Int, data.movimiento.creadoPor)
                            .input('creadoPorUid', mssql_js_1.sql.UniqueIdentifier, data.movimiento.creadoPorUid);
                        return [4 /*yield*/, movimientoRequest.query("\n        INSERT INTO afi.Movimiento (\n          quincenaId, tipoMovimientoId, afiliadoId, fecha,\n          observaciones, folio, estatus, creadoPor, creadoPorUid\n        )\n        OUTPUT INSERTED.*\n        VALUES (\n          @quincenaId, @tipoMovimientoId, @afiliadoId, @fecha,\n          @observaciones, @folio, @estatus, @creadoPor, @creadoPorUid\n        )\n      ")];
                    case 11:
                        movimientoResult = _l.sent();
                        movimientoRow = movimientoResult.recordset[0];
                        // Commit transacción
                        return [4 /*yield*/, transaction.commit()];
                    case 12:
                        // Commit transacción
                        _l.sent();
                        logger.info(__assign(__assign({}, logContext), { afiliadoId: afiliadoRow.id, afiliadoOrgId: afiliadoOrgRow.id, movimientoId: movimientoRow.id }), 'Creación completa de afiliado finalizada exitosamente');
                        // Mapear resultados
                        return [2 /*return*/, {
                                afiliado: {
                                    id: afiliadoRow.id,
                                    folio: afiliadoRow.folio,
                                    apellidoPaterno: afiliadoRow.apellidoPaterno,
                                    apellidoMaterno: afiliadoRow.apellidoMaterno,
                                    nombre: afiliadoRow.nombre,
                                    curp: afiliadoRow.curp,
                                    rfc: afiliadoRow.rfc,
                                    numeroSeguroSocial: afiliadoRow.numeroSeguroSocial,
                                    fechaNacimiento: ((_a = afiliadoRow.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    entidadFederativaNacId: afiliadoRow.entidadFederativaNacId,
                                    domicilioCalle: afiliadoRow.domicilioCalle,
                                    domicilioNumeroExterior: afiliadoRow.domicilioNumeroExterior,
                                    domicilioNumeroInterior: afiliadoRow.domicilioNumeroInterior,
                                    domicilioEntreCalle1: afiliadoRow.domicilioEntreCalle1,
                                    domicilioEntreCalle2: afiliadoRow.domicilioEntreCalle2,
                                    domicilioColonia: afiliadoRow.domicilioColonia,
                                    domicilioCodigoPostal: afiliadoRow.domicilioCodigoPostal,
                                    telefono: afiliadoRow.telefono,
                                    estadoCivilId: afiliadoRow.estadoCivilId,
                                    sexo: afiliadoRow.sexo,
                                    correoElectronico: afiliadoRow.correoElectronico,
                                    estatus: afiliadoRow.estatus === 1 || afiliadoRow.estatus === true,
                                    interno: afiliadoRow.interno,
                                    noEmpleado: afiliadoRow.noEmpleado,
                                    localidad: afiliadoRow.localidad,
                                    municipio: afiliadoRow.municipio,
                                    estado: afiliadoRow.estado,
                                    pais: afiliadoRow.pais,
                                    dependientes: afiliadoRow.dependientes,
                                    poseeInmuebles: afiliadoRow.poseeInmuebles === 1 || afiliadoRow.poseeInmuebles === true ? true : afiliadoRow.poseeInmuebles === 0 || afiliadoRow.poseeInmuebles === false ? false : null,
                                    fechaCarta: ((_b = afiliadoRow.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                    nacionalidad: afiliadoRow.nacionalidad,
                                    fechaAlta: ((_c = afiliadoRow.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                    celular: afiliadoRow.celular,
                                    expediente: afiliadoRow.expediente,
                                    quincenaAplicacion: afiliadoRow.quincenaAplicacion,
                                    anioAplicacion: afiliadoRow.anioAplicacion,
                                    createdAt: ((_d = afiliadoRow.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                    updatedAt: ((_e = afiliadoRow.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                                },
                                afiliadoOrg: {
                                    id: afiliadoOrgRow.id,
                                    afiliadoId: afiliadoOrgRow.afiliadoId,
                                    nivel0Id: afiliadoOrgRow.nivel0Id,
                                    nivel1Id: afiliadoOrgRow.nivel1Id,
                                    nivel2Id: afiliadoOrgRow.nivel2Id,
                                    nivel3Id: afiliadoOrgRow.nivel3Id,
                                    claveOrganica0: afiliadoOrgRow.claveOrganica0,
                                    claveOrganica1: afiliadoOrgRow.claveOrganica1,
                                    claveOrganica2: afiliadoOrgRow.claveOrganica2,
                                    claveOrganica3: afiliadoOrgRow.claveOrganica3,
                                    interno: afiliadoOrgRow.interno,
                                    sueldo: afiliadoOrgRow.sueldo,
                                    otrasPrestaciones: afiliadoOrgRow.otrasPrestaciones,
                                    quinquenios: afiliadoOrgRow.quinquenios,
                                    activo: afiliadoOrgRow.activo === 1 || afiliadoOrgRow.activo === true,
                                    fechaMovAlt: ((_f = afiliadoOrgRow.fechaMovAlt) === null || _f === void 0 ? void 0 : _f.toISOString().split('T')[0]) || null,
                                    orgs1: afiliadoOrgRow.orgs1,
                                    orgs2: afiliadoOrgRow.orgs2,
                                    orgs3: afiliadoOrgRow.orgs3,
                                    orgs4: afiliadoOrgRow.orgs4,
                                    dSueldo: afiliadoOrgRow.dSueldo,
                                    dOtrasPrestaciones: afiliadoOrgRow.dOtrasPrestaciones,
                                    dQuinquenios: afiliadoOrgRow.dQuinquenios,
                                    aplicar: afiliadoOrgRow.aplicar === 1 || afiliadoOrgRow.aplicar === true ? true : afiliadoOrgRow.aplicar === 0 || afiliadoOrgRow.aplicar === false ? false : null,
                                    bc: afiliadoOrgRow.bc,
                                    porcentaje: afiliadoOrgRow.porcentaje,
                                    createdAt: ((_g = afiliadoOrgRow.createdAt) === null || _g === void 0 ? void 0 : _g.toISOString()) || new Date().toISOString(),
                                    updatedAt: ((_h = afiliadoOrgRow.updatedAt) === null || _h === void 0 ? void 0 : _h.toISOString()) || new Date().toISOString()
                                },
                                movimiento: {
                                    id: movimientoRow.id,
                                    quincenaId: movimientoRow.quincenaId,
                                    tipoMovimientoId: movimientoRow.tipoMovimientoId,
                                    afiliadoId: movimientoRow.afiliadoId,
                                    fecha: ((_j = movimientoRow.fecha) === null || _j === void 0 ? void 0 : _j.toISOString().split('T')[0]) || null,
                                    observaciones: movimientoRow.observaciones,
                                    folio: movimientoRow.folio,
                                    estatus: movimientoRow.estatus,
                                    creadoPor: movimientoRow.creadoPor,
                                    creadoPorUid: movimientoRow.creadoPorUid,
                                    createdAt: ((_k = movimientoRow.createdAt) === null || _k === void 0 ? void 0 : _k.toISOString()) || new Date().toISOString()
                                }
                            }];
                    case 13:
                        error_1 = _l.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 14:
                        _l.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Error desconocido';
                        errorStack = error_1 instanceof Error ? error_1.stack : undefined;
                        logger.error(__assign(__assign({}, logContext), { error: errorMessage, stack: errorStack }), 'Error al crear afiliado completo, transacción revertida');
                        if (error_1 instanceof errors_js_1.AfiliadoAlreadyExistsError) {
                            throw error_1;
                        }
                        throw new errors_js_1.AfiliadoRegistrationError('Error al crear afiliado completo', {
                            originalError: errorMessage,
                            curp: data.afiliado.curp
                        });
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    CreateCompleteAfiliadoCommand.prototype.getQuincenaAplicacion = function (org0, org1, org2, org3, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var p, whereConditions, request, orgNivel, result, currentYear, quincena, anio, needsRegistration, lastRecord, lastQuincena, lastAnio, accion, registerRequest, error_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, mssql_js_2.getPool)()];
                    case 1:
                        p = _a.sent();
                        whereConditions = ['Org0 = @Org0'];
                        request = p.request().input('Org0', mssql_js_1.sql.Char(2), org0);
                        orgNivel = 0;
                        if (org1) {
                            whereConditions.push('Org1 = @Org1');
                            request.input('Org1', mssql_js_1.sql.Char(2), org1);
                            orgNivel = 1;
                        }
                        if (org2) {
                            whereConditions.push('Org2 = @Org2');
                            request.input('Org2', mssql_js_1.sql.Char(2), org2);
                            orgNivel = 2;
                        }
                        if (org3) {
                            whereConditions.push('Org3 = @Org3');
                            request.input('Org3', mssql_js_1.sql.Char(2), org3);
                            orgNivel = 3;
                        }
                        return [4 /*yield*/, request.query("\n      SELECT TOP 1 Quincena, Anio, Accion\n      FROM afec.BitacoraAfectacionOrg\n      WHERE ".concat(whereConditions.join(' AND '), "\n      ORDER BY Anio DESC, Quincena DESC, CreatedAt DESC\n    "))];
                    case 2:
                        result = _a.sent();
                        currentYear = new Date().getFullYear();
                        needsRegistration = false;
                        if (result.recordset.length === 0) {
                            quincena = 1;
                            anio = currentYear;
                            needsRegistration = true;
                            logger.info({
                                org0: org0,
                                org1: org1,
                                org2: org2,
                                org3: org3,
                                quincena: quincena,
                                anio: anio
                            }, 'No existe quincena para orgánica, creando quincena inicial');
                        }
                        else {
                            lastRecord = result.recordset[0];
                            lastQuincena = lastRecord.Quincena;
                            lastAnio = lastRecord.Anio;
                            accion = lastRecord.Accion;
                            if (accion === 'Completa') {
                                quincena = lastQuincena === 24 ? 1 : lastQuincena + 1;
                                anio = lastQuincena === 24 ? lastAnio + 1 : lastAnio;
                                needsRegistration = true;
                                logger.info({
                                    org0: org0,
                                    org1: org1,
                                    org2: org2,
                                    org3: org3,
                                    quincena: quincena,
                                    anio: anio,
                                    lastQuincena: lastQuincena,
                                    lastAnio: lastAnio,
                                    accion: accion
                                }, 'Última acción fue Completa, calculando nueva quincena');
                            }
                            else {
                                quincena = lastQuincena;
                                anio = lastAnio;
                                logger.info({
                                    org0: org0,
                                    org1: org1,
                                    org2: org2,
                                    org3: org3,
                                    quincena: quincena,
                                    anio: anio,
                                    accion: accion
                                }, 'Usando quincena existente');
                            }
                        }
                        if (!needsRegistration) return [3 /*break*/, 6];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        registerRequest = p.request()
                            .input('Entidad', mssql_js_1.sql.NVarChar(128), 'AFILIADOS')
                            .input('Anio', mssql_js_1.sql.SmallInt, anio)
                            .input('Quincena', mssql_js_1.sql.TinyInt, quincena)
                            .input('OrgNivel', mssql_js_1.sql.TinyInt, orgNivel)
                            .input('Org0', mssql_js_1.sql.Char(2), org0)
                            .input('Org1', mssql_js_1.sql.Char(2), org1 || null)
                            .input('Org2', mssql_js_1.sql.Char(2), org2 || null)
                            .input('Org3', mssql_js_1.sql.Char(2), org3 || null)
                            .input('Accion', mssql_js_1.sql.VarChar(20), 'Aplicar')
                            .input('Resultado', mssql_js_1.sql.VarChar(10), 'OK')
                            .input('Mensaje', mssql_js_1.sql.NVarChar(4000), "Quincena ".concat(quincena, "/").concat(anio, " creada autom\u00E1ticamente para afiliaci\u00F3n"))
                            .input('Usuario', mssql_js_1.sql.NVarChar(100), userId ? "Usuario_".concat(userId) : 'Sistema')
                            .input('AppName', mssql_js_1.sql.NVarChar(100), 'BICSN_Afiliados')
                            .input('Ip', mssql_js_1.sql.NVarChar(64), 'localhost');
                        return [4 /*yield*/, registerRequest.execute('afec.usp_RegistrarAfectacionOrg')];
                    case 4:
                        _a.sent();
                        logger.info({
                            org0: org0,
                            org1: org1,
                            org2: org2,
                            org3: org3,
                            quincena: quincena,
                            anio: anio,
                            userId: userId
                        }, 'Quincena registrada exitosamente en BitacoraAfectacionOrg');
                        return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : 'Error desconocido';
                        logger.warn({
                            org0: org0,
                            org1: org1,
                            org2: org2,
                            org3: org3,
                            quincena: quincena,
                            anio: anio,
                            userId: userId,
                            error: errorMessage
                        }, 'Error al registrar quincena en afectación, continuando con creación de afiliado');
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, { quincena: quincena, anio: anio }];
                }
            });
        });
    };
    return CreateCompleteAfiliadoCommand;
}());
exports.CreateCompleteAfiliadoCommand = CreateCompleteAfiliadoCommand;
