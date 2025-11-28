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
exports.getAllPersonal = getAllPersonal;
exports.getPersonalById = getPersonalById;
exports.createPersonal = createPersonal;
exports.updatePersonal = updatePersonal;
exports.deletePersonal = deletePersonal;
var firebird_js_1 = require("../../db/firebird.js");
function getAllPersonal(claveOrganica0, claveOrganica1) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      SELECT\n        P.INTERNO, P.CURP, P.RFC, P.NOEMPLEADO, P.NOMBRE,\n        P.APELLIDO_PATERNO, P.APELLIDO_MATERNO, P.FECHA_NACIMIENTO,\n        P.SEGURO_SOCIAL, P.CALLE_NUMERO, P.FRACCIONAMIENTO, P.CODIGO_POSTAL,\n        P.TELEFONO, P.SEXO, P.ESTADO_CIVIL, P.LOCALIDAD, P.MUNICIPIO, P.ESTADO, P.PAIS,\n        P.DEPENDIENTES, P.POSEE_INMUEBLES, P.FECHA_CARTA, P.EMAIL, P.NACIONALIDAD,\n        P.FECHA_ALTA, P.CELULAR, P.EXPEDIENTE, P.F_EXPEDIENTE, P.FULLNAME\n      FROM PERSONAL P\n    ";
                    var params = [];
                    var conditions = [];
                    if (claveOrganica0) {
                        sql += "\n        INNER JOIN ORG_PERSONAL OP ON P.INTERNO = OP.INTERNO\n      ";
                        conditions.push('OP.CLAVE_ORGANICA_0 = ?');
                        params.push(claveOrganica0);
                    }
                    if (claveOrganica1) {
                        if (!claveOrganica0) {
                            sql += "\n          INNER JOIN ORG_PERSONAL OP ON P.INTERNO = OP.INTERNO\n        ";
                        }
                        conditions.push('OP.CLAVE_ORGANICA_1 = ?');
                        params.push(claveOrganica1);
                    }
                    if (conditions.length > 0) {
                        sql += " WHERE ".concat(conditions.join(' AND '));
                    }
                    sql += " ORDER BY P.INTERNO";
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var records = result.map(function (row) { return ({
                            interno: row.INTERNO,
                            curp: row.CURP || null,
                            rfc: row.RFC || null,
                            noempleado: row.NOEMPLEADO || null,
                            nombre: row.NOMBRE || null,
                            apellido_paterno: row.APELLIDO_PATERNO || null,
                            apellido_materno: row.APELLIDO_MATERNO || null,
                            fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
                            seguro_social: row.SEGURO_SOCIAL || null,
                            calle_numero: row.CALLE_NUMERO || null,
                            fraccionamiento: row.FRACCIONAMIENTO || null,
                            codigo_postal: row.CODIGO_POSTAL || null,
                            telefono: row.TELEFONO || null,
                            sexo: row.SEXO || null,
                            estado_civil: row.ESTADO_CIVIL || null,
                            localidad: row.LOCALIDAD || null,
                            municipio: row.MUNICIPIO || null,
                            estado: row.ESTADO || null,
                            pais: row.PAIS || null,
                            dependientes: row.DEPENDIENTES || null,
                            posee_inmuebles: row.POSEE_INMUEBLES || null,
                            fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
                            email: row.EMAIL || null,
                            nacionalidad: row.NACIONALIDAD || null,
                            fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
                            celular: row.CELULAR || null,
                            expediente: row.EXPEDIENTE || null,
                            f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
                            fullname: row.FULLNAME || null
                        }); });
                        resolve(records);
                    });
                })];
        });
    });
}
function getPersonalById(interno) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      SELECT\n        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,\n        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,\n        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,\n        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,\n        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,\n        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME\n      FROM PERSONAL\n      WHERE INTERNO = ?\n    ";
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
                            curp: row.CURP || null,
                            rfc: row.RFC || null,
                            noempleado: row.NOEMPLEADO || null,
                            nombre: row.NOMBRE || null,
                            apellido_paterno: row.APELLIDO_PATERNO || null,
                            apellido_materno: row.APELLIDO_MATERNO || null,
                            fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
                            seguro_social: row.SEGURO_SOCIAL || null,
                            calle_numero: row.CALLE_NUMERO || null,
                            fraccionamiento: row.FRACCIONAMIENTO || null,
                            codigo_postal: row.CODIGO_POSTAL || null,
                            telefono: row.TELEFONO || null,
                            sexo: row.SEXO || null,
                            estado_civil: row.ESTADO_CIVIL || null,
                            localidad: row.LOCALIDAD || null,
                            municipio: row.MUNICIPIO || null,
                            estado: row.ESTADO || null,
                            pais: row.PAIS || null,
                            dependientes: row.DEPENDIENTES || null,
                            posee_inmuebles: row.POSEE_INMUEBLES || null,
                            fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
                            email: row.EMAIL || null,
                            nacionalidad: row.NACIONALIDAD || null,
                            fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
                            celular: row.CELULAR || null,
                            expediente: row.EXPEDIENTE || null,
                            f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
                            fullname: row.FULLNAME || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function createPersonal(data) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = "\n      INSERT INTO PERSONAL (\n        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,\n        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,\n        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,\n        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,\n        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,\n        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n      RETURNING\n        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,\n        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,\n        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,\n        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,\n        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,\n        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME\n    ";
                    var params = [
                        data.interno,
                        data.curp,
                        data.rfc,
                        data.noempleado,
                        data.nombre,
                        data.apellido_paterno,
                        data.apellido_materno,
                        data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
                        data.seguro_social,
                        data.calle_numero,
                        data.fraccionamiento,
                        data.codigo_postal,
                        data.telefono,
                        data.sexo,
                        data.estado_civil,
                        data.localidad,
                        data.municipio,
                        data.estado,
                        data.pais,
                        data.dependientes,
                        data.posee_inmuebles,
                        data.fecha_carta ? new Date(data.fecha_carta) : null,
                        data.email,
                        data.nacionalidad,
                        data.fecha_alta ? new Date(data.fecha_alta) : null,
                        data.celular,
                        data.expediente,
                        data.f_expediente ? new Date(data.f_expediente) : null
                    ];
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            curp: row.CURP || null,
                            rfc: row.RFC || null,
                            noempleado: row.NOEMPLEADO || null,
                            nombre: row.NOMBRE || null,
                            apellido_paterno: row.APELLIDO_PATERNO || null,
                            apellido_materno: row.APELLIDO_MATERNO || null,
                            fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
                            seguro_social: row.SEGURO_SOCIAL || null,
                            calle_numero: row.CALLE_NUMERO || null,
                            fraccionamiento: row.FRACCIONAMIENTO || null,
                            codigo_postal: row.CODIGO_POSTAL || null,
                            telefono: row.TELEFONO || null,
                            sexo: row.SEXO || null,
                            estado_civil: row.ESTADO_CIVIL || null,
                            localidad: row.LOCALIDAD || null,
                            municipio: row.MUNICIPIO || null,
                            estado: row.ESTADO || null,
                            pais: row.PAIS || null,
                            dependientes: row.DEPENDIENTES || null,
                            posee_inmuebles: row.POSEE_INMUEBLES || null,
                            fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
                            email: row.EMAIL || null,
                            nacionalidad: row.NACIONALIDAD || null,
                            fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
                            celular: row.CELULAR || null,
                            expediente: row.EXPEDIENTE || null,
                            f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
                            fullname: row.FULLNAME || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function updatePersonal(interno, data) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var updates = [];
                    var params = [];
                    if (data.curp !== undefined) {
                        updates.push('CURP = ?');
                        params.push(data.curp);
                    }
                    if (data.rfc !== undefined) {
                        updates.push('RFC = ?');
                        params.push(data.rfc);
                    }
                    if (data.noempleado !== undefined) {
                        updates.push('NOEMPLEADO = ?');
                        params.push(data.noempleado);
                    }
                    if (data.nombre !== undefined) {
                        updates.push('NOMBRE = ?');
                        params.push(data.nombre);
                    }
                    if (data.apellido_paterno !== undefined) {
                        updates.push('APELLIDO_PATERNO = ?');
                        params.push(data.apellido_paterno);
                    }
                    if (data.apellido_materno !== undefined) {
                        updates.push('APELLIDO_MATERNO = ?');
                        params.push(data.apellido_materno);
                    }
                    if (data.fecha_nacimiento !== undefined) {
                        updates.push('FECHA_NACIMIENTO = ?');
                        params.push(data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null);
                    }
                    if (data.seguro_social !== undefined) {
                        updates.push('SEGURO_SOCIAL = ?');
                        params.push(data.seguro_social);
                    }
                    if (data.calle_numero !== undefined) {
                        updates.push('CALLE_NUMERO = ?');
                        params.push(data.calle_numero);
                    }
                    if (data.fraccionamiento !== undefined) {
                        updates.push('FRACCIONAMIENTO = ?');
                        params.push(data.fraccionamiento);
                    }
                    if (data.codigo_postal !== undefined) {
                        updates.push('CODIGO_POSTAL = ?');
                        params.push(data.codigo_postal);
                    }
                    if (data.telefono !== undefined) {
                        updates.push('TELEFONO = ?');
                        params.push(data.telefono);
                    }
                    if (data.sexo !== undefined) {
                        updates.push('SEXO = ?');
                        params.push(data.sexo);
                    }
                    if (data.estado_civil !== undefined) {
                        updates.push('ESTADO_CIVIL = ?');
                        params.push(data.estado_civil);
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
                    if (data.pais !== undefined) {
                        updates.push('PAIS = ?');
                        params.push(data.pais);
                    }
                    if (data.dependientes !== undefined) {
                        updates.push('DEPENDIENTES = ?');
                        params.push(data.dependientes);
                    }
                    if (data.posee_inmuebles !== undefined) {
                        updates.push('POSEE_INMUEBLES = ?');
                        params.push(data.posee_inmuebles);
                    }
                    if (data.fecha_carta !== undefined) {
                        updates.push('FECHA_CARTA = ?');
                        params.push(data.fecha_carta ? new Date(data.fecha_carta) : null);
                    }
                    if (data.email !== undefined) {
                        updates.push('EMAIL = ?');
                        params.push(data.email);
                    }
                    if (data.nacionalidad !== undefined) {
                        updates.push('NACIONALIDAD = ?');
                        params.push(data.nacionalidad);
                    }
                    if (data.fecha_alta !== undefined) {
                        updates.push('FECHA_ALTA = ?');
                        params.push(data.fecha_alta ? new Date(data.fecha_alta) : null);
                    }
                    if (data.celular !== undefined) {
                        updates.push('CELULAR = ?');
                        params.push(data.celular);
                    }
                    if (data.expediente !== undefined) {
                        updates.push('EXPEDIENTE = ?');
                        params.push(data.expediente);
                    }
                    if (data.f_expediente !== undefined) {
                        updates.push('F_EXPEDIENTE = ?');
                        params.push(data.f_expediente ? new Date(data.f_expediente) : null);
                    }
                    params.push(interno);
                    var sql = "\n      UPDATE PERSONAL\n      SET ".concat(updates.join(', '), "\n      WHERE INTERNO = ?\n      RETURNING\n        INTERNO, CURP, RFC, NOEMPLEADO, NOMBRE,\n        APELLIDO_PATERNO, APELLIDO_MATERNO, FECHA_NACIMIENTO,\n        SEGURO_SOCIAL, CALLE_NUMERO, FRACCIONAMIENTO, CODIGO_POSTAL,\n        TELEFONO, SEXO, ESTADO_CIVIL, LOCALIDAD, MUNICIPIO, ESTADO, PAIS,\n        DEPENDIENTES, POSEE_INMUEBLES, FECHA_CARTA, EMAIL, NACIONALIDAD,\n        FECHA_ALTA, CELULAR, EXPEDIENTE, F_EXPEDIENTE, FULLNAME\n    ");
                    db.query(sql, params, function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result.length === 0) {
                            reject(new Error('PERSONAL_NOT_FOUND'));
                            return;
                        }
                        var row = result[0];
                        var record = {
                            interno: row.INTERNO,
                            curp: row.CURP || null,
                            rfc: row.RFC || null,
                            noempleado: row.NOEMPLEADO || null,
                            nombre: row.NOMBRE || null,
                            apellido_paterno: row.APELLIDO_PATERNO || null,
                            apellido_materno: row.APELLIDO_MATERNO || null,
                            fecha_nacimiento: row.FECHA_NACIMIENTO ? row.FECHA_NACIMIENTO.toISOString().split('T')[0] : null,
                            seguro_social: row.SEGURO_SOCIAL || null,
                            calle_numero: row.CALLE_NUMERO || null,
                            fraccionamiento: row.FRACCIONAMIENTO || null,
                            codigo_postal: row.CODIGO_POSTAL || null,
                            telefono: row.TELEFONO || null,
                            sexo: row.SEXO || null,
                            estado_civil: row.ESTADO_CIVIL || null,
                            localidad: row.LOCALIDAD || null,
                            municipio: row.MUNICIPIO || null,
                            estado: row.ESTADO || null,
                            pais: row.PAIS || null,
                            dependientes: row.DEPENDIENTES || null,
                            posee_inmuebles: row.POSEE_INMUEBLES || null,
                            fecha_carta: row.FECHA_CARTA ? row.FECHA_CARTA.toISOString() : null,
                            email: row.EMAIL || null,
                            nacionalidad: row.NACIONALIDAD || null,
                            fecha_alta: row.FECHA_ALTA ? row.FECHA_ALTA.toISOString() : null,
                            celular: row.CELULAR || null,
                            expediente: row.EXPEDIENTE || null,
                            f_expediente: row.F_EXPEDIENTE ? row.F_EXPEDIENTE.toISOString() : null,
                            fullname: row.FULLNAME || null
                        };
                        resolve(record);
                    });
                })];
        });
    });
}
function deletePersonal(interno) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            db = (0, firebird_js_1.getFirebirdDb)();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var sql = 'DELETE FROM PERSONAL WHERE INTERNO = ?';
                    db.query(sql, [interno], function (err, result) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (result === 0) {
                            reject(new Error('PERSONAL_NOT_FOUND'));
                            return;
                        }
                        resolve();
                    });
                })];
        });
    });
}
