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
exports.getAllOrgPersonal = getAllOrgPersonal;
exports.getOrgPersonalBySearch = getOrgPersonalBySearch;
exports.getOrgPersonalById = getOrgPersonalById;
exports.createOrgPersonal = createOrgPersonal;
exports.updateOrgPersonal = updateOrgPersonal;
exports.getOrgPersonalByClavesOrganicas = getOrgPersonalByClavesOrganicas;
exports.deleteOrgPersonal = deleteOrgPersonal;
var firebird_js_1 = require("../../db/firebird.js");
function getAllOrgPersonal() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      SELECT\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,\n        APLICAR, BC, PORCENTAJE\n      FROM ORG_PERSONAL\n      ORDER BY INTERNO\n    ";
                    db.query(sql, [], function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var records = result.map(function (row) { return ({
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        }); });
                        resolve(records);
                    });
                })];
        });
    });
}
function getOrgPersonalBySearch(searchTerm) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var trimmedTerm = searchTerm.trim();
                    // Detect search type based on format
                    var searchType = detectSearchType(trimmedTerm);
                    var sql;
                    var params = [];
                    if (searchType === 'CURP' && trimmedTerm.length === 18) {
                        // Search only by CURP
                        sql = "\n        SELECT FIRST 1\n          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,\n          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,\n          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,\n          OP.APLICAR, OP.BC, OP.PORCENTAJE\n        FROM ORG_PERSONAL OP\n        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO\n        WHERE UPPER(P.CURP) = UPPER(?)\n        ORDER BY OP.FECHA_MOV_ALT DESC\n      ";
                        params = [trimmedTerm];
                    }
                    else if (searchType === 'RFC' && (trimmedTerm.length === 12 || trimmedTerm.length === 13)) {
                        // Search only by RFC
                        sql = "\n        SELECT FIRST 1\n          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,\n          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,\n          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,\n          OP.APLICAR, OP.BC, OP.PORCENTAJE\n        FROM ORG_PERSONAL OP\n        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO\n        WHERE UPPER(P.RFC) = UPPER(?)\n        ORDER BY OP.FECHA_MOV_ALT DESC\n      ";
                        params = [trimmedTerm.substring(0, 13)];
                    }
                    else {
                        // Search by name (FULLNAME)
                        sql = "\n        SELECT FIRST 1\n          OP.INTERNO, OP.CLAVE_ORGANICA_0, OP.CLAVE_ORGANICA_1, OP.CLAVE_ORGANICA_2, OP.CLAVE_ORGANICA_3,\n          OP.SUELDO, OP.OTRAS_PRESTACIONES, OP.QUINQUENIOS, OP.ACTIVO, OP.FECHA_MOV_ALT,\n          OP.ORGS1, OP.ORGS2, OP.ORGS3, OP.ORGS, OP.DSUELDO, OP.DOTRAS_PRESTACIONES, OP.DQUINQUENIOS,\n          OP.APLICAR, OP.BC, OP.PORCENTAJE\n        FROM ORG_PERSONAL OP\n        INNER JOIN PERSONAL P ON OP.INTERNO = P.INTERNO\n        WHERE UPPER(P.FULLNAME) LIKE UPPER(?)\n        ORDER BY OP.FECHA_MOV_ALT DESC\n      ";
                        params = ["%".concat(trimmedTerm, "%")];
                    }
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result.length === 0) {
                            resolve(undefined);
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
/**
 * Detects the search type based on the format of the search term
 */
function detectSearchType(searchTerm) {
    var trimmed = searchTerm.trim();
    // CURP: 18 characters, format standard Mexican CURP
    if (trimmed.length === 18 && /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(trimmed)) {
        return 'CURP';
    }
    // RFC: 12 characters (moral person) or 13 characters (physical person)
    if ((trimmed.length === 13 || trimmed.length === 12) && /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(trimmed)) {
        return 'RFC';
    }
    // Default to name search
    return 'NAME';
}
function getOrgPersonalById(interno) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      SELECT\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,\n        APLICAR, BC, PORCENTAJE\n      FROM ORG_PERSONAL\n      WHERE INTERNO = ?\n    ";
                    db.query(sql, [interno], function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result.length === 0) {
                            resolve(undefined);
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function createOrgPersonal(data) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      INSERT INTO ORG_PERSONAL (\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS, APLICAR, BC, PORCENTAJE\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n      RETURNING\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,\n        APLICAR, BC, PORCENTAJE\n    ";
                    var params = [
                        data.interno,
                        data.clave_organica_0,
                        data.clave_organica_1,
                        data.clave_organica_2,
                        data.clave_organica_3,
                        data.sueldo,
                        data.otras_prestaciones,
                        data.quinquenios,
                        data.activo,
                        data.fecha_mov_alt ? new Date(data.fecha_mov_alt) : null,
                        data.dsueldo,
                        data.dotras_prestaciones,
                        data.dquinquenios,
                        data.aplicar,
                        data.bc,
                        data.porcentaje
                    ];
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function updateOrgPersonal(interno, data) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var updates = [];
                    var params = [];
                    if (data.clave_organica_0 !== undefined) {
                        updates.push('CLAVE_ORGANICA_0 = ?');
                        params.push(data.clave_organica_0);
                    }
                    if (data.clave_organica_1 !== undefined) {
                        updates.push('CLAVE_ORGANICA_1 = ?');
                        params.push(data.clave_organica_1);
                    }
                    if (data.clave_organica_2 !== undefined) {
                        updates.push('CLAVE_ORGANICA_2 = ?');
                        params.push(data.clave_organica_2);
                    }
                    if (data.clave_organica_3 !== undefined) {
                        updates.push('CLAVE_ORGANICA_3 = ?');
                        params.push(data.clave_organica_3);
                    }
                    if (data.sueldo !== undefined) {
                        updates.push('SUELDO = ?');
                        params.push(data.sueldo);
                    }
                    if (data.otras_prestaciones !== undefined) {
                        updates.push('OTRAS_PRESTACIONES = ?');
                        params.push(data.otras_prestaciones);
                    }
                    if (data.quinquenios !== undefined) {
                        updates.push('QUINQUENIOS = ?');
                        params.push(data.quinquenios);
                    }
                    if (data.activo !== undefined) {
                        updates.push('ACTIVO = ?');
                        params.push(data.activo);
                    }
                    if (data.fecha_mov_alt !== undefined) {
                        updates.push('FECHA_MOV_ALT = ?');
                        params.push(data.fecha_mov_alt ? new Date(data.fecha_mov_alt) : null);
                    }
                    if (data.dsueldo !== undefined) {
                        updates.push('DSUELDO = ?');
                        params.push(data.dsueldo);
                    }
                    if (data.dotras_prestaciones !== undefined) {
                        updates.push('DOTRAS_PRESTACIONES = ?');
                        params.push(data.dotras_prestaciones);
                    }
                    if (data.dquinquenios !== undefined) {
                        updates.push('DQUINQUENIOS = ?');
                        params.push(data.dquinquenios);
                    }
                    if (data.aplicar !== undefined) {
                        updates.push('APLICAR = ?');
                        params.push(data.aplicar);
                    }
                    if (data.bc !== undefined) {
                        updates.push('BC = ?');
                        params.push(data.bc);
                    }
                    if (data.porcentaje !== undefined) {
                        updates.push('PORCENTAJE = ?');
                        params.push(data.porcentaje);
                    }
                    params.push(interno);
                    var sql = "\n      UPDATE ORG_PERSONAL\n      SET ".concat(updates.join(', '), "\n      WHERE INTERNO = ?\n      RETURNING\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,\n        APLICAR, BC, PORCENTAJE\n    ");
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result.length === 0) {
                            reject(new Error('ORG_PERSONAL_NOT_FOUND'));
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function getOrgPersonalByClavesOrganicas(claveOrganica0, claveOrganica1) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      SELECT\n        INTERNO, CLAVE_ORGANICA_0, CLAVE_ORGANICA_1, CLAVE_ORGANICA_2, CLAVE_ORGANICA_3,\n        SUELDO, OTRAS_PRESTACIONES, QUINQUENIOS, ACTIVO, FECHA_MOV_ALT,\n        ORGS1, ORGS2, ORGS3, ORGS, DSUELDO, DOTRAS_PRESTACIONES, DQUINQUENIOS,\n        APLICAR, BC, PORCENTAJE\n      FROM ORG_PERSONAL\n      WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND ACTIVO = 'A'\n      ORDER BY INTERNO\n    ";
                    db.query(sql, [claveOrganica0, claveOrganica1], function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var records = result.map(function (row) { return ({
                            interno: row.INTERNO,
                            clave_organica_0: row.CLAVE_ORGANICA_0 || null,
                            clave_organica_1: row.CLAVE_ORGANICA_1 || null,
                            clave_organica_2: row.CLAVE_ORGANICA_2 || null,
                            clave_organica_3: row.CLAVE_ORGANICA_3 || null,
                            sueldo: row.SUELDO || null,
                            otras_prestaciones: row.OTRAS_PRESTACIONES || null,
                            quinquenios: row.QUINQUENIOS || null,
                            activo: row.ACTIVO || null,
                            fecha_mov_alt: row.FECHA_MOV_ALT ? row.FECHA_MOV_ALT.toISOString() : null,
                            orgs1: row.ORGS1 || null,
                            orgs2: row.ORGS2 || null,
                            orgs3: row.ORGS3 || null,
                            orgs: row.ORGS || null,
                            dsueldo: row.DSUELDO || null,
                            dotras_prestaciones: row.DOTRAS_PRESTACIONES || null,
                            dquinquenios: row.DQUINQUENIOS || null,
                            aplicar: row.APLICAR || null,
                            bc: row.BC || null,
                            porcentaje: row.PORCENTAJE || null
                        }); });
                        resolve(records);
                    });
                })];
        });
    });
}
function deleteOrgPersonal(interno) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = 'DELETE FROM ORG_PERSONAL WHERE INTERNO = ?';
                    db.query(sql, [interno], function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result === 0) {
                            reject(new Error('ORG_PERSONAL_NOT_FOUND'));
                            return;
                        }
                        resolve();
                    });
                })];
        });
    });
}
