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
exports.Organica0Repository = void 0;
var firebird_js_1 = require("../../../../db/firebird.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'Organica0Repository',
    level: process.env.LOG_LEVEL || 'info'
});
var Organica0Repository = /** @class */ (function () {
    function Organica0Repository() {
    }
    Organica0Repository.prototype.findById = function (claveOrganica) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0 WHERE CLAVE_ORGANICA = ?', [claveOrganica], function (err, result) {
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
                                claveOrganica: row.CLAVE_ORGANICA,
                                nombreOrganica: row.NOMBRE_ORGANICA,
                                usuario: row.USUARIO,
                                fechaRegistro: new Date(row.FECHA_REGISTRO),
                                fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
                                estatus: row.ESTATUS
                            });
                        });
                    })];
            });
        });
    };
    Organica0Repository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                logger.info('Starting findAll operation in Organica0Repository');
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        logger.debug('Executing Firebird query for ORGANICA_0');
                        db.query('SELECT CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS FROM ORGANICA_0 ORDER BY CLAVE_ORGANICA', [], function (err, result) {
                            if (err) {
                                logger.error({
                                    error: err.message,
                                    stack: err.stack,
                                    operation: 'findAll'
                                }, 'Error executing findAll query');
                                reject(err);
                                return;
                            }
                            logger.debug("Query returned ".concat(result.length, " rows"));
                            var records = result.map(function (row) { return ({
                                claveOrganica: row.CLAVE_ORGANICA,
                                nombreOrganica: row.NOMBRE_ORGANICA,
                                usuario: row.USUARIO,
                                fechaRegistro: new Date(row.FECHA_REGISTRO),
                                fechaFin: row.FECHA_FIN ? new Date(row.FECHA_FIN) : undefined,
                                estatus: row.ESTATUS
                            }); });
                            logger.info("findAll operation completed successfully, returning ".concat(records.length, " records"));
                            resolve(records);
                        });
                    })];
            });
        });
    };
    Organica0Repository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, fechaRegistro;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                fechaRegistro = new Date();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('INSERT INTO ORGANICA_0 (CLAVE_ORGANICA, NOMBRE_ORGANICA, USUARIO, FECHA_REGISTRO, FECHA_FIN, ESTATUS) VALUES (?, ?, ?, ?, ?, ?)', [
                            data.claveOrganica,
                            data.nombreOrganica,
                            data.usuario || null,
                            fechaRegistro,
                            data.fechaFin || null,
                            data.estatus
                        ], function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({
                                claveOrganica: data.claveOrganica,
                                nombreOrganica: data.nombreOrganica,
                                usuario: data.usuario,
                                fechaRegistro: fechaRegistro,
                                fechaFin: data.fechaFin,
                                estatus: data.estatus
                            });
                        });
                    })];
            });
        });
    };
    Organica0Repository.prototype.update = function (claveOrganica, data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, updates, params, existing;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = (0, firebird_js_1.getFirebirdDb)();
                        updates = [];
                        params = [];
                        if (data.nombreOrganica !== undefined) {
                            updates.push('NOMBRE_ORGANICA = ?');
                            params.push(data.nombreOrganica);
                        }
                        if (data.usuario !== undefined) {
                            updates.push('USUARIO = ?');
                            params.push(data.usuario);
                        }
                        if (data.fechaFin !== undefined) {
                            updates.push('FECHA_FIN = ?');
                            params.push(data.fechaFin);
                        }
                        if (data.estatus !== undefined) {
                            updates.push('ESTATUS = ?');
                            params.push(data.estatus);
                        }
                        if (!(updates.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(claveOrganica)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('ORGANICA0_NOT_FOUND');
                        }
                        return [2 /*return*/, existing];
                    case 2:
                        params.push(claveOrganica);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                db.query("UPDATE ORGANICA_0 SET ".concat(updates.join(', '), " WHERE CLAVE_ORGANICA = ?"), params, function (err) { return __awaiter(_this, void 0, void 0, function () {
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
                                                return [4 /*yield*/, this.findById(claveOrganica)];
                                            case 2:
                                                updated = _a.sent();
                                                if (!updated) {
                                                    reject(new Error('ORGANICA0_NOT_FOUND'));
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
    Organica0Repository.prototype.delete = function (claveOrganica) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('DELETE FROM ORGANICA_0 WHERE CLAVE_ORGANICA = ?', [claveOrganica], function (err, result) {
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
    Organica0Repository.prototype.isInUse = function (claveOrganica) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Check if there are any dependent records in related tables
                        var sql = "\n        SELECT\n          (SELECT COUNT(*) FROM ORGANICA_1 WHERE CLAVE_ORGANICA_0 = ?) +\n          (SELECT COUNT(*) FROM ORGANICA_2 WHERE CLAVE_ORGANICA_0 = ?) +\n          (SELECT COUNT(*) FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ?) +\n          (SELECT COUNT(*) FROM ORG_PERSONAL WHERE CLAVE_ORGANICA_0 = ?) as total_dependents\n        FROM RDB$DATABASE\n      ";
                        db.query(sql, [claveOrganica, claveOrganica, claveOrganica, claveOrganica], function (err, result) {
                            var _a;
                            if (err) {
                                logger.error({
                                    error: err.message,
                                    operation: 'isInUse',
                                    claveOrganica: claveOrganica
                                }, 'Error checking if organica0 is in use');
                                reject(err);
                                return;
                            }
                            var totalDependents = ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.TOTAL_DEPENDENTS) || 0;
                            var inUse = totalDependents > 0;
                            logger.debug({
                                operation: 'isInUse',
                                claveOrganica: claveOrganica,
                                totalDependents: totalDependents,
                                inUse: inUse
                            }, 'Checked organica0 usage');
                            resolve(inUse);
                        });
                    })];
            });
        });
    };
    return Organica0Repository;
}());
exports.Organica0Repository = Organica0Repository;
