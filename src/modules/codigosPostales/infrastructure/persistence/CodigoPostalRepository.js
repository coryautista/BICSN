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
exports.CodigoPostalRepository = void 0;
var mssql_js_1 = require("../../../../db/mssql.js");
var CodigoPostalRepository = /** @class */ (function () {
    function CodigoPostalRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    CodigoPostalRepository.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mssqlPool.request().query("\n      SELECT\n        CodigoPostalID,\n        CodigoPostal,\n        EsValido,\n        createdAt,\n        updatedAt,\n        createdBy,\n        updatedBy\n      FROM geo.CodigosPostales\n      ORDER BY CodigoPostal ASC\n    ")];
                    case 1:
                        r = _a.sent();
                        return [2 /*return*/, r.recordset.map(function (row) { return ({
                                codigoPostalId: row.CodigoPostalID,
                                codigoPostal: row.CodigoPostal,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }); })];
                }
            });
        });
    };
    CodigoPostalRepository.prototype.findById = function (codigoPostalId) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
                            throw new Error('Invalid codigoPostalId: must be a positive number');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('codigoPostalId', mssql_js_1.sql.Int, codigoPostalId)
                                .query("\n        SELECT\n          CodigoPostalID,\n          CodigoPostal,\n          EsValido,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM geo.CodigosPostales\n        WHERE CodigoPostalID = @codigoPostalId\n      ")];
                    case 1:
                        r = _a.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                codigoPostalId: row.CodigoPostalID,
                                codigoPostal: row.CodigoPostal,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }];
                }
            });
        });
    };
    CodigoPostalRepository.prototype.findByCode = function (codigoPostal) {
        return __awaiter(this, void 0, void 0, function () {
            var r, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
                            throw new Error('Invalid codigoPostal: must be a 5-character string');
                        }
                        return [4 /*yield*/, this.mssqlPool.request()
                                .input('codigoPostal', mssql_js_1.sql.Char(5), codigoPostal)
                                .query("\n        SELECT\n          CodigoPostalID,\n          CodigoPostal,\n          EsValido,\n          createdAt,\n          updatedAt,\n          createdBy,\n          updatedBy\n        FROM geo.CodigosPostales\n        WHERE CodigoPostal = @codigoPostal\n      ")];
                    case 1:
                        r = _a.sent();
                        row = r.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                codigoPostalId: row.CodigoPostalID,
                                codigoPostal: row.CodigoPostal,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }];
                }
            });
        });
    };
    CodigoPostalRepository.prototype.create = function (codigoPostal, esValido, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, result, row, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostal || typeof codigoPostal !== 'string' || codigoPostal.length !== 5) {
                            throw new Error('Invalid codigoPostal: must be a 5-character string');
                        }
                        if (typeof esValido !== 'boolean') {
                            throw new Error('Invalid esValido: must be a boolean');
                        }
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        req = transaction.request();
                        req.input('codigoPostal', mssql_js_1.sql.Char(5), codigoPostal);
                        req.input('esValido', mssql_js_1.sql.Bit, esValido);
                        if (userId) {
                            req.input('userId', mssql_js_1.sql.UniqueIdentifier, userId);
                        }
                        return [4 /*yield*/, req.query("\n        INSERT INTO geo.CodigosPostales (CodigoPostal, EsValido".concat(userId ? ', createdBy' : '', ")\n        OUTPUT INSERTED.CodigoPostalID, INSERTED.CodigoPostal, INSERTED.EsValido, INSERTED.createdAt, INSERTED.updatedAt, INSERTED.createdBy, INSERTED.updatedBy\n        VALUES (@codigoPostal, @esValido").concat(userId ? ', @userId' : '', ")\n      "))];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        row = result.recordset[0];
                        return [2 /*return*/, {
                                codigoPostalId: row.CodigoPostalID,
                                codigoPostal: row.CodigoPostal,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }];
                    case 5:
                        error_1 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 6:
                        _a.sent();
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CodigoPostalRepository.prototype.update = function (codigoPostalId, esValido, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, result, row, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
                            throw new Error('Invalid codigoPostalId: must be a positive number');
                        }
                        if (esValido === undefined) {
                            throw new Error('At least one field must be provided for update');
                        }
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        req = transaction.request();
                        req.input('codigoPostalId', mssql_js_1.sql.Int, codigoPostalId);
                        req.input('esValido', mssql_js_1.sql.Bit, esValido);
                        if (userId) {
                            req.input('userId', mssql_js_1.sql.UniqueIdentifier, userId);
                        }
                        return [4 /*yield*/, req.query("\n        UPDATE geo.CodigosPostales\n        SET EsValido = @esValido,\n            updatedAt = GETDATE()\n            ".concat(userId ? ', updatedBy = @userId' : '', "\n        OUTPUT INSERTED.CodigoPostalID, INSERTED.CodigoPostal, INSERTED.EsValido, INSERTED.createdAt, INSERTED.updatedAt, INSERTED.createdBy, INSERTED.updatedBy\n        WHERE CodigoPostalID = @codigoPostalId\n      "))];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, {
                                codigoPostalId: row.CodigoPostalID,
                                codigoPostal: row.CodigoPostal,
                                esValido: row.EsValido,
                                createdAt: row.createdAt,
                                updatedAt: row.updatedAt,
                                createdBy: row.createdBy,
                                updatedBy: row.updatedBy
                            }];
                    case 5:
                        error_2 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 6:
                        _a.sent();
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CodigoPostalRepository.prototype.delete = function (codigoPostalId) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, req, result, row, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!codigoPostalId || typeof codigoPostalId !== 'number' || codigoPostalId <= 0) {
                            throw new Error('Invalid codigoPostalId: must be a positive number');
                        }
                        transaction = this.mssqlPool.transaction();
                        return [4 /*yield*/, transaction.begin()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        req = transaction.request();
                        req.input('codigoPostalId', mssql_js_1.sql.Int, codigoPostalId);
                        return [4 /*yield*/, req.query("\n        DELETE FROM geo.CodigosPostales\n        OUTPUT DELETED.CodigoPostalID\n        WHERE CodigoPostalID = @codigoPostalId\n      ")];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, transaction.commit()];
                    case 4:
                        _a.sent();
                        row = result.recordset[0];
                        if (!row)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, row.CodigoPostalID];
                    case 5:
                        error_3 = _a.sent();
                        return [4 /*yield*/, transaction.rollback()];
                    case 6:
                        _a.sent();
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return CodigoPostalRepository;
}());
exports.CodigoPostalRepository = CodigoPostalRepository;
