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
exports.Organica2Repository = void 0;
var firebird_js_1 = require("../../../../db/firebird.js");
var Organica2Repository = /** @class */ (function () {
    function Organica2Repository() {
    }
    Organica2Repository.prototype.findById = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?', [claveOrganica0, claveOrganica1, claveOrganica2], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!result || result.length === 0) {
                                resolve(undefined);
                                return;
                            }
                            var row = result[0];
                            resolve({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
                                fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            });
                        });
                    })];
            });
        });
    };
    Organica2Repository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2', [], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
                                fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    Organica2Repository.prototype.findByClaveOrganica0And1 = function (claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? ORDER BY CLAVE_ORGANICA_2', [claveOrganica0, claveOrganica1], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                fechaRegistro2: new Date(row.FECHA_REGISTRO_2),
                                fechaFin2: row.FECHA_FIN_2 ? new Date(row.FECHA_FIN_2) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    Organica2Repository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, fechaRegistro2;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                fechaRegistro2 = new Date();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('INSERT INTO ORGANICA_2 (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, DESCRIPCION, TITULAR, FECHA_REGISTRO_2, FECHA_FIN_2, USUARIO, ESTATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                            data.claveOrganica0,
                            data.claveOrganica1,
                            data.claveOrganica2,
                            data.descripcion || null,
                            data.titular || null,
                            fechaRegistro2,
                            data.fechaFin2 || null,
                            data.usuario || null,
                            data.estatus
                        ], function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({
                                claveOrganica0: data.claveOrganica0,
                                claveOrganica1: data.claveOrganica1,
                                claveOrganica2: data.claveOrganica2,
                                descripcion: data.descripcion,
                                titular: data.titular,
                                fechaRegistro2: fechaRegistro2,
                                fechaFin2: data.fechaFin2,
                                usuario: data.usuario,
                                estatus: data.estatus
                            });
                        });
                    })];
            });
        });
    };
    Organica2Repository.prototype.update = function (claveOrganica0, claveOrganica1, claveOrganica2, data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, updates, params, existing;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = (0, firebird_js_1.getFirebirdDb)();
                        updates = [];
                        params = [];
                        if (data.descripcion !== undefined) {
                            updates.push('DESCRIPCION = ?');
                            params.push(data.descripcion);
                        }
                        if (data.titular !== undefined) {
                            updates.push('TITULAR = ?');
                            params.push(data.titular);
                        }
                        if (data.fechaFin2 !== undefined) {
                            updates.push('FECHA_FIN_2 = ?');
                            params.push(data.fechaFin2);
                        }
                        if (data.usuario !== undefined) {
                            updates.push('USUARIO = ?');
                            params.push(data.usuario);
                        }
                        if (data.estatus !== undefined) {
                            updates.push('ESTATUS = ?');
                            params.push(data.estatus);
                        }
                        if (!(updates.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(claveOrganica0, claveOrganica1, claveOrganica2)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('ORGANICA2_NOT_FOUND');
                        }
                        return [2 /*return*/, existing];
                    case 2:
                        params.push(claveOrganica0, claveOrganica1, claveOrganica2);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                db.query("UPDATE ORGANICA_2 SET ".concat(updates.join(', '), " WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?"), params, function (err) { return __awaiter(_this, void 0, void 0, function () {
                                    var updated, error_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (err) {
                                                    reject(err);
                                                    return [2 /*return*/];
                                                }
                                                _a.label = 1;
                                            case 1:
                                                _a.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, this.findById(claveOrganica0, claveOrganica1, claveOrganica2)];
                                            case 2:
                                                updated = _a.sent();
                                                if (!updated) {
                                                    reject(new Error('ORGANICA2_NOT_FOUND'));
                                                    return [2 /*return*/];
                                                }
                                                resolve(updated);
                                                return [3 /*break*/, 4];
                                            case 3:
                                                error_1 = _a.sent();
                                                reject(error_1);
                                                return [3 /*break*/, 4];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); });
                            })];
                }
            });
        });
    };
    Organica2Repository.prototype.delete = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('DELETE FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?', [claveOrganica0, claveOrganica1, claveOrganica2], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(result > 0);
                        });
                    })];
            });
        });
    };
    Organica2Repository.prototype.isInUse = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Verificar si hay registros dependientes en ORGANICA_3
                        db.query('SELECT COUNT(*) as count FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?', [claveOrganica0, claveOrganica1, claveOrganica2], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var count = result[0].COUNT;
                            resolve(count > 0);
                        });
                    })];
            });
        });
    };
    return Organica2Repository;
}());
exports.Organica2Repository = Organica2Repository;
