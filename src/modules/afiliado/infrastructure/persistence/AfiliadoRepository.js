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
exports.AfiliadoRepository = void 0;
var mssql_1 = require("mssql");
var AfiliadoRepository = /** @class */ (function () {
    function AfiliadoRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    AfiliadoRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,\n        fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,\n        domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,\n        domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,\n        interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,\n        fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,\n        anioAplicacion, codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt\n      FROM afi.Afiliado\n      ORDER BY id\n    ")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.recordset.map(function (row) {
                                var _a, _b, _c, _d, _e;
                                return ({
                                    id: row.id,
                                    folio: row.folio,
                                    apellidoPaterno: row.apellidoPaterno,
                                    apellidoMaterno: row.apellidoMaterno,
                                    nombre: row.nombre,
                                    curp: row.curp,
                                    rfc: row.rfc,
                                    numeroSeguroSocial: row.numeroSeguroSocial,
                                    fechaNacimiento: ((_a = row.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    entidadFederativaNacId: row.entidadFederativaNacId,
                                    domicilioCalle: row.domicilioCalle,
                                    domicilioNumeroExterior: row.domicilioNumeroExterior,
                                    domicilioNumeroInterior: row.domicilioNumeroInterior,
                                    domicilioEntreCalle1: row.domicilioEntreCalle1,
                                    domicilioEntreCalle2: row.domicilioEntreCalle2,
                                    domicilioColonia: row.domicilioColonia,
                                    domicilioCodigoPostal: row.domicilioCodigoPostal,
                                    telefono: row.telefono,
                                    estadoCivilId: row.estadoCivilId,
                                    sexo: row.sexo,
                                    correoElectronico: row.correoElectronico,
                                    estatus: row.estatus === 1 || row.estatus === true,
                                    interno: row.interno,
                                    noEmpleado: row.noEmpleado,
                                    localidad: row.localidad,
                                    municipio: row.municipio,
                                    estado: row.estado,
                                    pais: row.pais,
                                    dependientes: row.dependientes,
                                    poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
                                    fechaCarta: ((_b = row.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                    nacionalidad: row.nacionalidad,
                                    fechaAlta: ((_c = row.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                    celular: row.celular,
                                    expediente: row.expediente,
                                    quincenaAplicacion: row.quincenaAplicacion,
                                    anioAplicacion: row.anioAplicacion,
                                    codigoPostal: row.codigoPostal,
                                    numValidacion: row.numValidacion || 1,
                                    afiliadosComplete: row.afiliadosComplete || 0,
                                    createdAt: ((_d = row.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                    updatedAt: ((_e = row.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    AfiliadoRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, row;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        SELECT\n          id, folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,\n          fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,\n          domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,\n          domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,\n          interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,\n          fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,\n          anioAplicacion, codigoPostal, numValidacion, afiliadosComplete, createdAt, updatedAt\n        FROM afi.Afiliado\n        WHERE id = @id\n      ")];
                    case 1:
                        result = _f.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                folio: row.folio,
                                apellidoPaterno: row.apellidoPaterno,
                                apellidoMaterno: row.apellidoMaterno,
                                nombre: row.nombre,
                                curp: row.curp,
                                rfc: row.rfc,
                                numeroSeguroSocial: row.numeroSeguroSocial,
                                fechaNacimiento: ((_a = row.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                entidadFederativaNacId: row.entidadFederativaNacId,
                                domicilioCalle: row.domicilioCalle,
                                domicilioNumeroExterior: row.domicilioNumeroExterior,
                                domicilioNumeroInterior: row.domicilioNumeroInterior,
                                domicilioEntreCalle1: row.domicilioEntreCalle1,
                                domicilioEntreCalle2: row.domicilioEntreCalle2,
                                domicilioColonia: row.domicilioColonia,
                                domicilioCodigoPostal: row.domicilioCodigoPostal,
                                telefono: row.telefono,
                                estadoCivilId: row.estadoCivilId,
                                sexo: row.sexo,
                                correoElectronico: row.correoElectronico,
                                estatus: row.estatus === 1 || row.estatus === true,
                                interno: row.interno,
                                noEmpleado: row.noEmpleado,
                                localidad: row.localidad,
                                municipio: row.municipio,
                                estado: row.estado,
                                pais: row.pais,
                                dependientes: row.dependientes,
                                poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
                                fechaCarta: ((_b = row.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                nacionalidad: row.nacionalidad,
                                fechaAlta: ((_c = row.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                celular: row.celular,
                                expediente: row.expediente,
                                quincenaAplicacion: row.quincenaAplicacion,
                                anioAplicacion: row.anioAplicacion,
                                codigoPostal: row.codigoPostal,
                                numValidacion: row.numValidacion || 1,
                                afiliadosComplete: row.afiliadosComplete || 0,
                                createdAt: ((_d = row.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_e = row.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var request, result, row;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        request = this.mssqlPool.request()
                            .input('folio', mssql_1.default.Int, data.folio)
                            .input('apellidoPaterno', mssql_1.default.NVarChar(255), data.apellidoPaterno)
                            .input('apellidoMaterno', mssql_1.default.NVarChar(255), data.apellidoMaterno)
                            .input('nombre', mssql_1.default.NVarChar(200), data.nombre)
                            .input('curp', mssql_1.default.VarChar(18), data.curp)
                            .input('rfc', mssql_1.default.VarChar(13), data.rfc)
                            .input('numeroSeguroSocial', mssql_1.default.VarChar(50), data.numeroSeguroSocial)
                            .input('fechaNacimiento', mssql_1.default.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null)
                            .input('entidadFederativaNacId', mssql_1.default.Int, data.entidadFederativaNacId)
                            .input('domicilioCalle', mssql_1.default.NVarChar(255), data.domicilioCalle)
                            .input('domicilioNumeroExterior', mssql_1.default.VarChar(50), data.domicilioNumeroExterior)
                            .input('domicilioNumeroInterior', mssql_1.default.VarChar(50), data.domicilioNumeroInterior)
                            .input('domicilioEntreCalle1', mssql_1.default.NVarChar(120), data.domicilioEntreCalle1)
                            .input('domicilioEntreCalle2', mssql_1.default.NVarChar(120), data.domicilioEntreCalle2)
                            .input('domicilioColonia', mssql_1.default.NVarChar(255), data.domicilioColonia)
                            .input('domicilioCodigoPostal', mssql_1.default.Int, data.domicilioCodigoPostal)
                            .input('telefono', mssql_1.default.VarChar(10), data.telefono)
                            .input('estadoCivilId', mssql_1.default.Int, data.estadoCivilId)
                            .input('sexo', mssql_1.default.Char(1), data.sexo)
                            .input('correoElectronico', mssql_1.default.NVarChar(255), data.correoElectronico)
                            .input('estatus', mssql_1.default.Bit, data.estatus)
                            .input('interno', mssql_1.default.Int, data.interno)
                            .input('noEmpleado', mssql_1.default.VarChar(20), data.noEmpleado)
                            .input('localidad', mssql_1.default.NVarChar(150), data.localidad)
                            .input('municipio', mssql_1.default.NVarChar(150), data.municipio)
                            .input('estado', mssql_1.default.NVarChar(150), data.estado)
                            .input('pais', mssql_1.default.NVarChar(100), data.pais)
                            .input('dependientes', mssql_1.default.SmallInt, data.dependientes)
                            .input('poseeInmuebles', mssql_1.default.Bit, data.poseeInmuebles)
                            .input('fechaCarta', mssql_1.default.Date, data.fechaCarta ? new Date(data.fechaCarta) : null)
                            .input('nacionalidad', mssql_1.default.NVarChar(80), data.nacionalidad)
                            .input('fechaAlta', mssql_1.default.Date, data.fechaAlta ? new Date(data.fechaAlta) : null)
                            .input('celular', mssql_1.default.VarChar(15), data.celular)
                            .input('expediente', mssql_1.default.VarChar(50), data.expediente)
                            .input('quincenaAplicacion', mssql_1.default.TinyInt, data.quincenaAplicacion)
                            .input('anioAplicacion', mssql_1.default.SmallInt, data.anioAplicacion);
                        return [4 /*yield*/, request.query("\n      INSERT INTO afi.Afiliado (\n        folio, apellidoPaterno, apellidoMaterno, nombre, curp, rfc, numeroSeguroSocial,\n        fechaNacimiento, entidadFederativaNacId, domicilioCalle, domicilioNumeroExterior,\n        domicilioNumeroInterior, domicilioEntreCalle1, domicilioEntreCalle2, domicilioColonia,\n        domicilioCodigoPostal, telefono, estadoCivilId, sexo, correoElectronico, estatus,\n        interno, noEmpleado, localidad, municipio, estado, pais, dependientes, poseeInmuebles,\n        fechaCarta, nacionalidad, fechaAlta, celular, expediente, quincenaAplicacion,\n        anioAplicacion\n      )\n      OUTPUT INSERTED.*\n      VALUES (\n        @folio, @apellidoPaterno, @apellidoMaterno, @nombre, @curp, @rfc, @numeroSeguroSocial,\n        @fechaNacimiento, @entidadFederativaNacId, @domicilioCalle, @domicilioNumeroExterior,\n        @domicilioNumeroInterior, @domicilioEntreCalle1, @domicilioEntreCalle2, @domicilioColonia,\n        @domicilioCodigoPostal, @telefono, @estadoCivilId, @sexo, @correoElectronico, @estatus,\n        @interno, @noEmpleado, @localidad, @municipio, @estado, @pais, @dependientes, @poseeInmuebles,\n        @fechaCarta, @nacionalidad, @fechaAlta, @celular, @expediente, @quincenaAplicacion,\n        @anioAplicacion\n      )\n    ")];
                    case 1:
                        result = _f.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                folio: row.folio,
                                apellidoPaterno: row.apellidoPaterno,
                                apellidoMaterno: row.apellidoMaterno,
                                nombre: row.nombre,
                                curp: row.curp,
                                rfc: row.rfc,
                                numeroSeguroSocial: row.numeroSeguroSocial,
                                fechaNacimiento: ((_a = row.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                entidadFederativaNacId: row.entidadFederativaNacId,
                                domicilioCalle: row.domicilioCalle,
                                domicilioNumeroExterior: row.domicilioNumeroExterior,
                                domicilioNumeroInterior: row.domicilioNumeroInterior,
                                domicilioEntreCalle1: row.domicilioEntreCalle1,
                                domicilioEntreCalle2: row.domicilioEntreCalle2,
                                domicilioColonia: row.domicilioColonia,
                                domicilioCodigoPostal: row.domicilioCodigoPostal,
                                telefono: row.telefono,
                                estadoCivilId: row.estadoCivilId,
                                sexo: row.sexo,
                                correoElectronico: row.correoElectronico,
                                estatus: row.estatus === 1 || row.estatus === true,
                                interno: row.interno,
                                noEmpleado: row.noEmpleado,
                                localidad: row.localidad,
                                municipio: row.municipio,
                                estado: row.estado,
                                pais: row.pais,
                                dependientes: row.dependientes,
                                poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
                                fechaCarta: ((_b = row.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                nacionalidad: row.nacionalidad,
                                fechaAlta: ((_c = row.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                celular: row.celular,
                                expediente: row.expediente,
                                quincenaAplicacion: row.quincenaAplicacion,
                                anioAplicacion: row.anioAplicacion,
                                codigoPostal: row.codigoPostal,
                                numValidacion: row.numValidacion || 1,
                                afiliadosComplete: row.afiliadosComplete || 0,
                                createdAt: ((_d = row.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_e = row.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request, result, row;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_1.default.Int, data.id);
                        if (data.folio !== undefined) {
                            updates.push('folio = @folio');
                            request.input('folio', mssql_1.default.Int, data.folio);
                        }
                        if (data.apellidoPaterno !== undefined) {
                            updates.push('apellidoPaterno = @apellidoPaterno');
                            request.input('apellidoPaterno', mssql_1.default.NVarChar(255), data.apellidoPaterno);
                        }
                        if (data.apellidoMaterno !== undefined) {
                            updates.push('apellidoMaterno = @apellidoMaterno');
                            request.input('apellidoMaterno', mssql_1.default.NVarChar(255), data.apellidoMaterno);
                        }
                        if (data.nombre !== undefined) {
                            updates.push('nombre = @nombre');
                            request.input('nombre', mssql_1.default.NVarChar(200), data.nombre);
                        }
                        if (data.curp !== undefined) {
                            updates.push('curp = @curp');
                            request.input('curp', mssql_1.default.VarChar(18), data.curp);
                        }
                        if (data.rfc !== undefined) {
                            updates.push('rfc = @rfc');
                            request.input('rfc', mssql_1.default.VarChar(13), data.rfc);
                        }
                        if (data.numeroSeguroSocial !== undefined) {
                            updates.push('numeroSeguroSocial = @numeroSeguroSocial');
                            request.input('numeroSeguroSocial', mssql_1.default.VarChar(50), data.numeroSeguroSocial);
                        }
                        if (data.fechaNacimiento !== undefined) {
                            updates.push('fechaNacimiento = @fechaNacimiento');
                            request.input('fechaNacimiento', mssql_1.default.Date, data.fechaNacimiento ? new Date(data.fechaNacimiento) : null);
                        }
                        if (data.entidadFederativaNacId !== undefined) {
                            updates.push('entidadFederativaNacId = @entidadFederativaNacId');
                            request.input('entidadFederativaNacId', mssql_1.default.Int, data.entidadFederativaNacId);
                        }
                        if (data.domicilioCalle !== undefined) {
                            updates.push('domicilioCalle = @domicilioCalle');
                            request.input('domicilioCalle', mssql_1.default.NVarChar(255), data.domicilioCalle);
                        }
                        if (data.domicilioNumeroExterior !== undefined) {
                            updates.push('domicilioNumeroExterior = @domicilioNumeroExterior');
                            request.input('domicilioNumeroExterior', mssql_1.default.VarChar(50), data.domicilioNumeroExterior);
                        }
                        if (data.domicilioNumeroInterior !== undefined) {
                            updates.push('domicilioNumeroInterior = @domicilioNumeroInterior');
                            request.input('domicilioNumeroInterior', mssql_1.default.VarChar(50), data.domicilioNumeroInterior);
                        }
                        if (data.domicilioEntreCalle1 !== undefined) {
                            updates.push('domicilioEntreCalle1 = @domicilioEntreCalle1');
                            request.input('domicilioEntreCalle1', mssql_1.default.NVarChar(120), data.domicilioEntreCalle1);
                        }
                        if (data.domicilioEntreCalle2 !== undefined) {
                            updates.push('domicilioEntreCalle2 = @domicilioEntreCalle2');
                            request.input('domicilioEntreCalle2', mssql_1.default.NVarChar(120), data.domicilioEntreCalle2);
                        }
                        if (data.domicilioColonia !== undefined) {
                            updates.push('domicilioColonia = @domicilioColonia');
                            request.input('domicilioColonia', mssql_1.default.NVarChar(255), data.domicilioColonia);
                        }
                        if (data.domicilioCodigoPostal !== undefined) {
                            updates.push('domicilioCodigoPostal = @domicilioCodigoPostal');
                            request.input('domicilioCodigoPostal', mssql_1.default.Int, data.domicilioCodigoPostal);
                        }
                        if (data.telefono !== undefined) {
                            updates.push('telefono = @telefono');
                            request.input('telefono', mssql_1.default.VarChar(10), data.telefono);
                        }
                        if (data.estadoCivilId !== undefined) {
                            updates.push('estadoCivilId = @estadoCivilId');
                            request.input('estadoCivilId', mssql_1.default.Int, data.estadoCivilId);
                        }
                        if (data.sexo !== undefined) {
                            updates.push('sexo = @sexo');
                            request.input('sexo', mssql_1.default.Char(1), data.sexo);
                        }
                        if (data.correoElectronico !== undefined) {
                            updates.push('correoElectronico = @correoElectronico');
                            request.input('correoElectronico', mssql_1.default.NVarChar(255), data.correoElectronico);
                        }
                        if (data.estatus !== undefined) {
                            updates.push('estatus = @estatus');
                            request.input('estatus', mssql_1.default.Bit, data.estatus);
                        }
                        if (data.interno !== undefined) {
                            updates.push('interno = @interno');
                            request.input('interno', mssql_1.default.Int, data.interno);
                        }
                        if (data.noEmpleado !== undefined) {
                            updates.push('noEmpleado = @noEmpleado');
                            request.input('noEmpleado', mssql_1.default.VarChar(20), data.noEmpleado);
                        }
                        if (data.localidad !== undefined) {
                            updates.push('localidad = @localidad');
                            request.input('localidad', mssql_1.default.NVarChar(150), data.localidad);
                        }
                        if (data.municipio !== undefined) {
                            updates.push('municipio = @municipio');
                            request.input('municipio', mssql_1.default.NVarChar(150), data.municipio);
                        }
                        if (data.estado !== undefined) {
                            updates.push('estado = @estado');
                            request.input('estado', mssql_1.default.NVarChar(150), data.estado);
                        }
                        if (data.pais !== undefined) {
                            updates.push('pais = @pais');
                            request.input('pais', mssql_1.default.NVarChar(100), data.pais);
                        }
                        if (data.dependientes !== undefined) {
                            updates.push('dependientes = @dependientes');
                            request.input('dependientes', mssql_1.default.SmallInt, data.dependientes);
                        }
                        if (data.poseeInmuebles !== undefined) {
                            updates.push('poseeInmuebles = @poseeInmuebles');
                            request.input('poseeInmuebles', mssql_1.default.Bit, data.poseeInmuebles);
                        }
                        if (data.fechaCarta !== undefined) {
                            updates.push('fechaCarta = @fechaCarta');
                            request.input('fechaCarta', mssql_1.default.Date, data.fechaCarta ? new Date(data.fechaCarta) : null);
                        }
                        if (data.nacionalidad !== undefined) {
                            updates.push('nacionalidad = @nacionalidad');
                            request.input('nacionalidad', mssql_1.default.NVarChar(80), data.nacionalidad);
                        }
                        if (data.fechaAlta !== undefined) {
                            updates.push('fechaAlta = @fechaAlta');
                            request.input('fechaAlta', mssql_1.default.Date, data.fechaAlta ? new Date(data.fechaAlta) : null);
                        }
                        if (data.celular !== undefined) {
                            updates.push('celular = @celular');
                            request.input('celular', mssql_1.default.VarChar(15), data.celular);
                        }
                        if (data.expediente !== undefined) {
                            updates.push('expediente = @expediente');
                            request.input('expediente', mssql_1.default.VarChar(50), data.expediente);
                        }
                        if (data.quincenaAplicacion !== undefined) {
                            updates.push('quincenaAplicacion = @quincenaAplicacion');
                            request.input('quincenaAplicacion', mssql_1.default.TinyInt, data.quincenaAplicacion);
                        }
                        if (data.anioAplicacion !== undefined) {
                            updates.push('anioAplicacion = @anioAplicacion');
                            request.input('anioAplicacion', mssql_1.default.SmallInt, data.anioAplicacion);
                        }
                        updates.push('updatedAt = SYSUTCDATETIME()');
                        return [4 /*yield*/, request.query("\n      UPDATE afi.Afiliado\n      SET ".concat(updates.join(', '), "\n      OUTPUT INSERTED.*\n      WHERE id = @id\n    "))];
                    case 1:
                        result = _f.sent();
                        row = result.recordset[0];
                        if (!row)
                            throw new Error('AFILIADO_NOT_FOUND');
                        return [2 /*return*/, {
                                id: row.id,
                                folio: row.folio,
                                apellidoPaterno: row.apellidoPaterno,
                                apellidoMaterno: row.apellidoMaterno,
                                nombre: row.nombre,
                                curp: row.curp,
                                rfc: row.rfc,
                                numeroSeguroSocial: row.numeroSeguroSocial,
                                fechaNacimiento: ((_a = row.fechaNacimiento) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                entidadFederativaNacId: row.entidadFederativaNacId,
                                domicilioCalle: row.domicilioCalle,
                                domicilioNumeroExterior: row.domicilioNumeroExterior,
                                domicilioNumeroInterior: row.domicilioNumeroInterior,
                                domicilioEntreCalle1: row.domicilioEntreCalle1,
                                domicilioEntreCalle2: row.domicilioEntreCalle2,
                                domicilioColonia: row.domicilioColonia,
                                domicilioCodigoPostal: row.domicilioCodigoPostal,
                                telefono: row.telefono,
                                estadoCivilId: row.estadoCivilId,
                                sexo: row.sexo,
                                correoElectronico: row.correoElectronico,
                                estatus: row.estatus === 1 || row.estatus === true,
                                interno: row.interno,
                                noEmpleado: row.noEmpleado,
                                localidad: row.localidad,
                                municipio: row.municipio,
                                estado: row.estado,
                                pais: row.pais,
                                dependientes: row.dependientes,
                                poseeInmuebles: row.poseeInmuebles === 1 || row.poseeInmuebles === true ? true : row.poseeInmuebles === 0 || row.poseeInmuebles === false ? false : null,
                                fechaCarta: ((_b = row.fechaCarta) === null || _b === void 0 ? void 0 : _b.toISOString().split('T')[0]) || null,
                                nacionalidad: row.nacionalidad,
                                fechaAlta: ((_c = row.fechaAlta) === null || _c === void 0 ? void 0 : _c.toISOString().split('T')[0]) || null,
                                celular: row.celular,
                                expediente: row.expediente,
                                quincenaAplicacion: row.quincenaAplicacion,
                                anioAplicacion: row.anioAplicacion,
                                createdAt: ((_d = row.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_e = row.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_1.default.Int, id)
                            .query("\n        DELETE FROM afi.Afiliado\n        WHERE id = @id\n        SELECT @@ROWCOUNT as deletedCount\n      ")];
                    case 1:
                        result = _a.sent();
                        if (result.recordset[0].deletedCount === 0) {
                            throw new Error('AFILIADO_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return AfiliadoRepository;
}());
exports.AfiliadoRepository = AfiliadoRepository;
