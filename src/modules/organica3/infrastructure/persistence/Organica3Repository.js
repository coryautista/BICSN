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
exports.Organica3Repository = void 0;
var firebird_js_1 = require("../../../../db/firebird.js");
var Organica3Repository = /** @class */ (function () {
    function Organica3Repository() {
    }
    Organica3Repository.prototype.findById = function (claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?', [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3], function (err, result) {
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
                                claveOrganica3: row.CLAVE_ORGANICA_3,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                calleNum: row.CALLE_NUM,
                                fraccionamiento: row.FRACCIONAMIENTO,
                                codigoPostal: row.CODIGO_POSTAL,
                                telefono: row.TELEFONO,
                                fax: row.FAX,
                                localidad: row.LOCALIDAD,
                                municipio: row.MUNICIPIO,
                                estado: row.ESTADO,
                                fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
                                fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            });
                        });
                    })];
            });
        });
    };
    Organica3Repository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3 ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3', [], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                claveOrganica3: row.CLAVE_ORGANICA_3,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                calleNum: row.CALLE_NUM,
                                fraccionamiento: row.FRACCIONAMIENTO,
                                codigoPostal: row.CODIGO_POSTAL,
                                telefono: row.TELEFONO,
                                fax: row.FAX,
                                localidad: row.LOCALIDAD,
                                municipio: row.MUNICIPIO,
                                estado: row.ESTADO,
                                fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
                                fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    Organica3Repository.prototype.findByClaveOrganica0And1And2 = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? ORDER BY CLAVE_ORGANICA_3', [claveOrganica0, claveOrganica1, claveOrganica2], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                claveOrganica3: row.CLAVE_ORGANICA_3,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                calleNum: row.CALLE_NUM,
                                fraccionamiento: row.FRACCIONAMIENTO,
                                codigoPostal: row.CODIGO_POSTAL,
                                telefono: row.TELEFONO,
                                fax: row.FAX,
                                localidad: row.LOCALIDAD,
                                municipio: row.MUNICIPIO,
                                estado: row.ESTADO,
                                fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
                                fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    Organica3Repository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, fechaRegistro3;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                fechaRegistro3 = new Date();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('INSERT INTO ORGANICA_3 (CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                            data.claveOrganica0,
                            data.claveOrganica1,
                            data.claveOrganica2,
                            data.claveOrganica3,
                            data.descripcion || null,
                            data.titular || null,
                            data.calleNum || null,
                            data.fraccionamiento || null,
                            data.codigoPostal || null,
                            data.telefono || null,
                            data.fax || null,
                            data.localidad || null,
                            data.municipio || null,
                            data.estado || null,
                            fechaRegistro3,
                            data.fechaFin3 || null,
                            data.usuario || null,
                            data.estatus
                        ], function (err, _result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({
                                claveOrganica0: data.claveOrganica0,
                                claveOrganica1: data.claveOrganica1,
                                claveOrganica2: data.claveOrganica2,
                                claveOrganica3: data.claveOrganica3,
                                descripcion: data.descripcion,
                                titular: data.titular,
                                calleNum: data.calleNum,
                                fraccionamiento: data.fraccionamiento,
                                codigoPostal: data.codigoPostal,
                                telefono: data.telefono,
                                fax: data.fax,
                                localidad: data.localidad,
                                municipio: data.municipio,
                                estado: data.estado,
                                fechaRegistro3: fechaRegistro3,
                                fechaFin3: data.fechaFin3,
                                usuario: data.usuario,
                                estatus: data.estatus
                            });
                        });
                    })];
            });
        });
    };
    Organica3Repository.prototype.update = function (claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3, data) {
        return __awaiter(this, void 0, void 0, function () {
            var db, updates, params;
            var _this = this;
            return __generator(this, function (_a) {
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
                if (data.calleNum !== undefined) {
                    updates.push('CALLE_NUM = ?');
                    params.push(data.calleNum);
                }
                if (data.fraccionamiento !== undefined) {
                    updates.push('FRACCIONAMIENTO = ?');
                    params.push(data.fraccionamiento);
                }
                if (data.codigoPostal !== undefined) {
                    updates.push('CODIGO_POSTAL = ?');
                    params.push(data.codigoPostal);
                }
                if (data.telefono !== undefined) {
                    updates.push('TELEFONO = ?');
                    params.push(data.telefono);
                }
                if (data.fax !== undefined) {
                    updates.push('FAX = ?');
                    params.push(data.fax);
                }
                if (data.localidad !== undefined) {
                    updates.push('LOCALIDAD = ?');
                    params.push(data.localidad);
                }
                if (data.municipio !== undefined) {
                    updates.push('MUNICIPIO = ?');
                    params.push(data.municipio);
                }
                if (data.estado !== undefined) {
                    updates.push('ESTADO = ?');
                    params.push(data.estado);
                }
                if (data.fechaFin3 !== undefined) {
                    updates.push('FECHA_FIN_3 = ?');
                    params.push(data.fechaFin3);
                }
                if (data.usuario !== undefined) {
                    updates.push('USUARIO = ?');
                    params.push(data.usuario);
                }
                if (data.estatus !== undefined) {
                    updates.push('ESTATUS = ?');
                    params.push(data.estatus);
                }
                if (updates.length === 0) {
                    // No updates, just return current record
                    return [2 /*return*/, this.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3).then(function (record) {
                            if (!record) {
                                throw new Error('ORGANICA3_NOT_FOUND');
                            }
                            return record;
                        })];
                }
                params.push(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query("UPDATE ORGANICA_3 SET ".concat(updates.join(', '), " WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?"), params, function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            // Return updated record
                            _this.findById(claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3).then(function (record) {
                                if (!record) {
                                    reject(new Error('ORGANICA3_NOT_FOUND'));
                                    return;
                                }
                                resolve(record);
                            }).catch(reject);
                        });
                    })];
            });
        });
    };
    Organica3Repository.prototype.delete = function (claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query('DELETE FROM ORGANICA_3 WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?', [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3], function (err, result) {
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
    Organica3Repository.prototype.isInUse = function (claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Verificar si hay registros dependientes en ORG_PERSONAL
                        db.query('SELECT COUNT(*) as count FROM ORG_PERSONAL WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ? AND CLAVE_ORGANICA_3 = ?', [claveOrganica0, claveOrganica1, claveOrganica2, claveOrganica3], function (err, result) {
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
    Organica3Repository.prototype.dynamicQuery = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var db, sql, params, conditions, _i, _a, _b, key, value, columnName, sortColumn, sortOrder;
            return __generator(this, function (_c) {
                db = (0, firebird_js_1.getFirebirdDb)();
                sql = 'SELECT CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3, DESCRIPCION, TITULAR, CALLE_NUM, FRACCIONAMIENTO, CODIGO_POSTAL, TELEFONO, FAX, LOCALIDAD, MUNICIPIO, ESTADO, FECHA_REGISTRO_3, FECHA_FIN_3, USUARIO, ESTATUS FROM ORGANICA_3';
                params = [];
                conditions = [];
                // Build WHERE conditions from filters
                if (query.filters) {
                    for (_i = 0, _a = Object.entries(query.filters); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        if (value !== undefined && value !== null) {
                            columnName = key.toUpperCase();
                            conditions.push("".concat(columnName, " = ?"));
                            params.push(value);
                        }
                    }
                }
                if (conditions.length > 0) {
                    sql += ' WHERE ' + conditions.join(' AND ');
                }
                // Add sorting
                if (query.sortBy) {
                    sortColumn = query.sortBy.toUpperCase();
                    sortOrder = query.sortOrder || 'ASC';
                    sql += " ORDER BY ".concat(sortColumn, " ").concat(sortOrder);
                }
                else {
                    sql += ' ORDER BY CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3';
                }
                // Add pagination
                if (query.limit) {
                    sql += ' ROWS ?';
                    params.push(query.limit);
                    if (query.offset) {
                        sql += ' TO ?';
                        params.push(query.offset + query.limit);
                    }
                }
                else if (query.offset) {
                    sql += ' ROWS ? TO ?';
                    params.push(query.offset + 1);
                    params.push(query.offset + 1000); // Default limit if offset specified
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query(sql, params, function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                claveOrganica3: row.CLAVE_ORGANICA_3,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                calleNum: row.CALLE_NUM,
                                fraccionamiento: row.FRACCIONAMIENTO,
                                codigoPostal: row.CODIGO_POSTAL,
                                telefono: row.TELEFONO,
                                fax: row.FAX,
                                localidad: row.LOCALIDAD,
                                municipio: row.MUNICIPIO,
                                estado: row.ESTADO,
                                fechaRegistro3: new Date(row.FECHA_REGISTRO_3),
                                fechaFin3: row.FECHA_FIN_3 ? new Date(row.FECHA_FIN_3) : undefined,
                                usuario: row.USUARIO,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    return Organica3Repository;
}());
exports.Organica3Repository = Organica3Repository;
