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
exports.AfiliadoOrgRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var AfiliadoOrgRepository = /** @class */ (function () {
    function AfiliadoOrgRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    AfiliadoOrgRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,\n        claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,\n        interno, sueldo, otrasPrestaciones, quinquenios, activo,\n        fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,\n        dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,\n        createdAt, updatedAt\n      FROM afi.AfiliadoOrg\n      ORDER BY id\n    ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) {
                                var _a, _b, _c;
                                return ({
                                    id: row.id,
                                    afiliadoId: row.afiliadoId,
                                    nivel0Id: row.nivel0Id,
                                    nivel1Id: row.nivel1Id,
                                    nivel2Id: row.nivel2Id,
                                    nivel3Id: row.nivel3Id,
                                    claveOrganica0: row.claveOrganica0,
                                    claveOrganica1: row.claveOrganica1,
                                    claveOrganica2: row.claveOrganica2,
                                    claveOrganica3: row.claveOrganica3,
                                    interno: row.interno,
                                    sueldo: row.sueldo,
                                    otrasPrestaciones: row.otrasPrestaciones,
                                    quinquenios: row.quinquenios,
                                    activo: row.activo === 1 || row.activo === true,
                                    fechaMovAlt: ((_a = row.fechaMovAlt) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    orgs1: row.orgs1,
                                    orgs2: row.orgs2,
                                    orgs3: row.orgs3,
                                    orgs4: row.orgs4,
                                    dSueldo: row.dSueldo,
                                    dOtrasPrestaciones: row.dOtrasPrestaciones,
                                    dQuinquenios: row.dQuinquenios,
                                    aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                    bc: row.bc,
                                    porcentaje: row.porcentaje,
                                    createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(),
                                    updatedAt: ((_c = row.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    AfiliadoOrgRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.BigInt, id)
                            .query("\n        SELECT\n          id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,\n          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,\n          interno, sueldo, otrasPrestaciones, quinquenios, activo,\n          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,\n          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,\n          createdAt, updatedAt\n        FROM afi.AfiliadoOrg\n        WHERE id = @id\n      ")];
                    case 1:
                        r = _d.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                id: row.id,
                                afiliadoId: row.afiliadoId,
                                nivel0Id: row.nivel0Id,
                                nivel1Id: row.nivel1Id,
                                nivel2Id: row.nivel2Id,
                                nivel3Id: row.nivel3Id,
                                claveOrganica0: row.claveOrganica0,
                                claveOrganica1: row.claveOrganica1,
                                claveOrganica2: row.claveOrganica2,
                                claveOrganica3: row.claveOrganica3,
                                interno: row.interno,
                                sueldo: row.sueldo,
                                otrasPrestaciones: row.otrasPrestaciones,
                                quinquenios: row.quinquenios,
                                activo: row.activo === 1 || row.activo === true,
                                fechaMovAlt: ((_a = row.fechaMovAlt) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                orgs1: row.orgs1,
                                orgs2: row.orgs2,
                                orgs3: row.orgs3,
                                orgs4: row.orgs4,
                                dSueldo: row.dSueldo,
                                dOtrasPrestaciones: row.dOtrasPrestaciones,
                                dQuinquenios: row.dQuinquenios,
                                aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                bc: row.bc,
                                porcentaje: row.porcentaje,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_c = row.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoOrgRepository.prototype.findByAfiliadoId = function (afiliadoId) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('afiliadoId', mssql_js_1.sql.Int, afiliadoId)
                            .query("\n        SELECT\n          id, afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,\n          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,\n          interno, sueldo, otrasPrestaciones, quinquenios, activo,\n          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,\n          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje,\n          createdAt, updatedAt\n        FROM afi.AfiliadoOrg\n        WHERE afiliadoId = @afiliadoId\n        ORDER BY id\n      ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) {
                                var _a, _b, _c;
                                return ({
                                    id: row.id,
                                    afiliadoId: row.afiliadoId,
                                    nivel0Id: row.nivel0Id,
                                    nivel1Id: row.nivel1Id,
                                    nivel2Id: row.nivel2Id,
                                    nivel3Id: row.nivel3Id,
                                    claveOrganica0: row.claveOrganica0,
                                    claveOrganica1: row.claveOrganica1,
                                    claveOrganica2: row.claveOrganica2,
                                    claveOrganica3: row.claveOrganica3,
                                    interno: row.interno,
                                    sueldo: row.sueldo,
                                    otrasPrestaciones: row.otrasPrestaciones,
                                    quinquenios: row.quinquenios,
                                    activo: row.activo === 1 || row.activo === true,
                                    fechaMovAlt: ((_a = row.fechaMovAlt) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                    orgs1: row.orgs1,
                                    orgs2: row.orgs2,
                                    orgs3: row.orgs3,
                                    orgs4: row.orgs4,
                                    dSueldo: row.dSueldo,
                                    dOtrasPrestaciones: row.dOtrasPrestaciones,
                                    dQuinquenios: row.dQuinquenios,
                                    aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                    bc: row.bc,
                                    porcentaje: row.porcentaje,
                                    createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(),
                                    updatedAt: ((_c = row.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString()
                                });
                            })];
                }
            });
        });
    };
    AfiliadoOrgRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('afiliadoId', mssql_js_1.sql.Int, data.afiliadoId)
                            .input('nivel0Id', mssql_js_1.sql.BigInt, data.nivel0Id)
                            .input('nivel1Id', mssql_js_1.sql.BigInt, data.nivel1Id)
                            .input('nivel2Id', mssql_js_1.sql.BigInt, data.nivel2Id)
                            .input('nivel3Id', mssql_js_1.sql.BigInt, data.nivel3Id)
                            .input('claveOrganica0', mssql_js_1.sql.VarChar(30), data.claveOrganica0)
                            .input('claveOrganica1', mssql_js_1.sql.VarChar(30), data.claveOrganica1)
                            .input('claveOrganica2', mssql_js_1.sql.VarChar(30), data.claveOrganica2)
                            .input('claveOrganica3', mssql_js_1.sql.VarChar(30), data.claveOrganica3)
                            .input('interno', mssql_js_1.sql.Int, data.interno)
                            .input('sueldo', mssql_js_1.sql.Decimal(12, 2), data.sueldo)
                            .input('otrasPrestaciones', mssql_js_1.sql.Decimal(12, 2), data.otrasPrestaciones)
                            .input('quinquenios', mssql_js_1.sql.Decimal(12, 2), data.quinquenios)
                            .input('activo', mssql_js_1.sql.Bit, data.activo)
                            .input('fechaMovAlt', mssql_js_1.sql.Date, data.fechaMovAlt ? new Date(data.fechaMovAlt) : null)
                            .input('orgs1', mssql_js_1.sql.VarChar(200), data.orgs1)
                            .input('orgs2', mssql_js_1.sql.VarChar(200), data.orgs2)
                            .input('orgs3', mssql_js_1.sql.VarChar(200), data.orgs3)
                            .input('orgs4', mssql_js_1.sql.VarChar(200), data.orgs4)
                            .input('dSueldo', mssql_js_1.sql.VarChar(200), data.dSueldo)
                            .input('dOtrasPrestaciones', mssql_js_1.sql.VarChar(200), data.dOtrasPrestaciones)
                            .input('dQuinquenios', mssql_js_1.sql.VarChar(200), data.dQuinquenios)
                            .input('aplicar', mssql_js_1.sql.Bit, data.aplicar)
                            .input('bc', mssql_js_1.sql.VarChar(30), data.bc)
                            .input('porcentaje', mssql_js_1.sql.Decimal(9, 4), data.porcentaje)
                            .query("\n        INSERT INTO afi.AfiliadoOrg (\n          afiliadoId, nivel0Id, nivel1Id, nivel2Id, nivel3Id,\n          claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3,\n          interno, sueldo, otrasPrestaciones, quinquenios, activo,\n          fechaMovAlt, orgs1, orgs2, orgs3, orgs4, dSueldo,\n          dOtrasPrestaciones, dQuinquenios, aplicar, bc, porcentaje\n        )\n        OUTPUT INSERTED.*\n        VALUES (\n          @afiliadoId, @nivel0Id, @nivel1Id, @nivel2Id, @nivel3Id,\n          @claveOrganica0, @claveOrganica1, @claveOrganica2, @claveOrganica3,\n          @interno, @sueldo, @otrasPrestaciones, @quinquenios, @activo,\n          @fechaMovAlt, @orgs1, @orgs2, @orgs3, @orgs4, @dSueldo,\n          @dOtrasPrestaciones, @dQuinquenios, @aplicar, @bc, @porcentaje\n        )\n      ")];
                    case 1:
                        r = _d.sent();
                        row = r.recordset[0];
                        return [2 /*return*/, {
                                id: row.id,
                                afiliadoId: row.afiliadoId,
                                nivel0Id: row.nivel0Id,
                                nivel1Id: row.nivel1Id,
                                nivel2Id: row.nivel2Id,
                                nivel3Id: row.nivel3Id,
                                claveOrganica0: row.claveOrganica0,
                                claveOrganica1: row.claveOrganica1,
                                claveOrganica2: row.claveOrganica2,
                                claveOrganica3: row.claveOrganica3,
                                interno: row.interno,
                                sueldo: row.sueldo,
                                otrasPrestaciones: row.otrasPrestaciones,
                                quinquenios: row.quinquenios,
                                activo: row.activo === 1 || row.activo === true,
                                fechaMovAlt: ((_a = row.fechaMovAlt) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                orgs1: row.orgs1,
                                orgs2: row.orgs2,
                                orgs3: row.orgs3,
                                orgs4: row.orgs4,
                                dSueldo: row.dSueldo,
                                dOtrasPrestaciones: row.dOtrasPrestaciones,
                                dQuinquenios: row.dQuinquenios,
                                aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                bc: row.bc,
                                porcentaje: row.porcentaje,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_c = row.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoOrgRepository.prototype.update = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, request, r, row;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        updates = [];
                        request = this.mssqlPool.request().input('id', mssql_js_1.sql.BigInt, data.id);
                        if (data.afiliadoId !== undefined) {
                            updates.push('afiliadoId = @afiliadoId');
                            request.input('afiliadoId', mssql_js_1.sql.Int, data.afiliadoId);
                        }
                        if (data.nivel0Id !== undefined) {
                            updates.push('nivel0Id = @nivel0Id');
                            request.input('nivel0Id', mssql_js_1.sql.BigInt, data.nivel0Id);
                        }
                        if (data.nivel1Id !== undefined) {
                            updates.push('nivel1Id = @nivel1Id');
                            request.input('nivel1Id', mssql_js_1.sql.BigInt, data.nivel1Id);
                        }
                        if (data.nivel2Id !== undefined) {
                            updates.push('nivel2Id = @nivel2Id');
                            request.input('nivel2Id', mssql_js_1.sql.BigInt, data.nivel2Id);
                        }
                        if (data.nivel3Id !== undefined) {
                            updates.push('nivel3Id = @nivel3Id');
                            request.input('nivel3Id', mssql_js_1.sql.BigInt, data.nivel3Id);
                        }
                        if (data.claveOrganica0 !== undefined) {
                            updates.push('claveOrganica0 = @claveOrganica0');
                            request.input('claveOrganica0', mssql_js_1.sql.VarChar(30), data.claveOrganica0);
                        }
                        if (data.claveOrganica1 !== undefined) {
                            updates.push('claveOrganica1 = @claveOrganica1');
                            request.input('claveOrganica1', mssql_js_1.sql.VarChar(30), data.claveOrganica1);
                        }
                        if (data.claveOrganica2 !== undefined) {
                            updates.push('claveOrganica2 = @claveOrganica2');
                            request.input('claveOrganica2', mssql_js_1.sql.VarChar(30), data.claveOrganica2);
                        }
                        if (data.claveOrganica3 !== undefined) {
                            updates.push('claveOrganica3 = @claveOrganica3');
                            request.input('claveOrganica3', mssql_js_1.sql.VarChar(30), data.claveOrganica3);
                        }
                        if (data.interno !== undefined) {
                            updates.push('interno = @interno');
                            request.input('interno', mssql_js_1.sql.Int, data.interno);
                        }
                        if (data.sueldo !== undefined) {
                            updates.push('sueldo = @sueldo');
                            request.input('sueldo', mssql_js_1.sql.Decimal(12, 2), data.sueldo);
                        }
                        if (data.otrasPrestaciones !== undefined) {
                            updates.push('otrasPrestaciones = @otrasPrestaciones');
                            request.input('otrasPrestaciones', mssql_js_1.sql.Decimal(12, 2), data.otrasPrestaciones);
                        }
                        if (data.quinquenios !== undefined) {
                            updates.push('quinquenios = @quinquenios');
                            request.input('quinquenios', mssql_js_1.sql.Decimal(12, 2), data.quinquenios);
                        }
                        if (data.activo !== undefined) {
                            updates.push('activo = @activo');
                            request.input('activo', mssql_js_1.sql.Bit, data.activo);
                        }
                        if (data.fechaMovAlt !== undefined) {
                            updates.push('fechaMovAlt = @fechaMovAlt');
                            request.input('fechaMovAlt', mssql_js_1.sql.Date, data.fechaMovAlt ? new Date(data.fechaMovAlt) : null);
                        }
                        if (data.orgs1 !== undefined) {
                            updates.push('orgs1 = @orgs1');
                            request.input('orgs1', mssql_js_1.sql.VarChar(200), data.orgs1);
                        }
                        if (data.orgs2 !== undefined) {
                            updates.push('orgs2 = @orgs2');
                            request.input('orgs2', mssql_js_1.sql.VarChar(200), data.orgs2);
                        }
                        if (data.orgs3 !== undefined) {
                            updates.push('orgs3 = @orgs3');
                            request.input('orgs3', mssql_js_1.sql.VarChar(200), data.orgs3);
                        }
                        if (data.orgs4 !== undefined) {
                            updates.push('orgs4 = @orgs4');
                            request.input('orgs4', mssql_js_1.sql.VarChar(200), data.orgs4);
                        }
                        if (data.dSueldo !== undefined) {
                            updates.push('dSueldo = @dSueldo');
                            request.input('dSueldo', mssql_js_1.sql.VarChar(200), data.dSueldo);
                        }
                        if (data.dOtrasPrestaciones !== undefined) {
                            updates.push('dOtrasPrestaciones = @dOtrasPrestaciones');
                            request.input('dOtrasPrestaciones', mssql_js_1.sql.VarChar(200), data.dOtrasPrestaciones);
                        }
                        if (data.dQuinquenios !== undefined) {
                            updates.push('dQuinquenios = @dQuinquenios');
                            request.input('dQuinquenios', mssql_js_1.sql.VarChar(200), data.dQuinquenios);
                        }
                        if (data.aplicar !== undefined) {
                            updates.push('aplicar = @aplicar');
                            request.input('aplicar', mssql_js_1.sql.Bit, data.aplicar);
                        }
                        if (data.bc !== undefined) {
                            updates.push('bc = @bc');
                            request.input('bc', mssql_js_1.sql.VarChar(30), data.bc);
                        }
                        if (data.porcentaje !== undefined) {
                            updates.push('porcentaje = @porcentaje');
                            request.input('porcentaje', mssql_js_1.sql.Decimal(9, 4), data.porcentaje);
                        }
                        updates.push('updatedAt = SYSUTCDATETIME()');
                        return [4 /*yield*/, request.query("\n      UPDATE afi.AfiliadoOrg\n      SET ".concat(updates.join(', '), "\n      OUTPUT INSERTED.*\n      WHERE id = @id\n    "))];
                    case 1:
                        r = _d.sent();
                        row = r.recordset[0];
                        if (!row)
                            throw new Error('AFILIADO_ORG_NOT_FOUND');
                        return [2 /*return*/, {
                                id: row.id,
                                afiliadoId: row.afiliadoId,
                                nivel0Id: row.nivel0Id,
                                nivel1Id: row.nivel1Id,
                                nivel2Id: row.nivel2Id,
                                nivel3Id: row.nivel3Id,
                                claveOrganica0: row.claveOrganica0,
                                claveOrganica1: row.claveOrganica1,
                                claveOrganica2: row.claveOrganica2,
                                claveOrganica3: row.claveOrganica3,
                                interno: row.interno,
                                sueldo: row.sueldo,
                                otrasPrestaciones: row.otrasPrestaciones,
                                quinquenios: row.quinquenios,
                                activo: row.activo === 1 || row.activo === true,
                                fechaMovAlt: ((_a = row.fechaMovAlt) === null || _a === void 0 ? void 0 : _a.toISOString().split('T')[0]) || null,
                                orgs1: row.orgs1,
                                orgs2: row.orgs2,
                                orgs3: row.orgs3,
                                orgs4: row.orgs4,
                                dSueldo: row.dSueldo,
                                dOtrasPrestaciones: row.dOtrasPrestaciones,
                                dQuinquenios: row.dQuinquenios,
                                aplicar: row.aplicar === 1 || row.aplicar === true ? true : row.aplicar === 0 || row.aplicar === false ? false : null,
                                bc: row.bc,
                                porcentaje: row.porcentaje,
                                createdAt: ((_b = row.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(),
                                updatedAt: ((_c = row.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString()
                            }];
                }
            });
        });
    };
    AfiliadoOrgRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request()
                            .input('id', mssql_js_1.sql.BigInt, id)
                            .query("\n        DELETE FROM afi.AfiliadoOrg\n        WHERE id = @id\n        SELECT @@ROWCOUNT as deletedCount\n      ")];
                    case 1:
                        r = _a.sent();
                        if (r.recordset[0].deletedCount === 0) {
                            throw new Error('AFILIADO_ORG_NOT_FOUND');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return AfiliadoOrgRepository;
}());
exports.AfiliadoOrgRepository = AfiliadoOrgRepository;
