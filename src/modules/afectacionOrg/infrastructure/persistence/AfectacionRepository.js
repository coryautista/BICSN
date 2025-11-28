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
exports.AfectacionRepository = void 0;
var mssql_1 = require("mssql");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'afectacionRepository',
    level: process.env.LOG_LEVEL || 'info'
});
var AfectacionRepository = /** @class */ (function () {
    function AfectacionRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    AfectacionRepository.prototype.registrar = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var request, verifyRequest, verifyResult, logEntry, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        request = this.mssqlPool.request()
                            .input('Entidad', mssql_1.default.NVarChar(128), data.entidad)
                            .input('Anio', mssql_1.default.SmallInt, data.anio)
                            .input('Quincena', mssql_1.default.TinyInt, data.quincena)
                            .input('OrgNivel', mssql_1.default.TinyInt, data.orgNivel)
                            .input('Org0', mssql_1.default.Char(2), data.org0)
                            .input('Org1', mssql_1.default.Char(2), data.org1 || null)
                            .input('Org2', mssql_1.default.Char(2), data.org2 || null)
                            .input('Org3', mssql_1.default.Char(2), data.org3 || null)
                            .input('Accion', mssql_1.default.VarChar(20), data.accion)
                            .input('Resultado', mssql_1.default.VarChar(10), data.resultado)
                            .input('Mensaje', mssql_1.default.NVarChar(4000), data.mensaje || null)
                            .input('Usuario', mssql_1.default.NVarChar(100), data.usuario)
                            .input('AppName', mssql_1.default.NVarChar(100), data.appName)
                            .input('Ip', mssql_1.default.NVarChar(64), data.ip);
                        return [4 /*yield*/, request.execute('afec.usp_RegistrarAfectacionOrg')];
                    case 1:
                        _a.sent();
                        verifyRequest = this.mssqlPool.request()
                            .input('Entidad', mssql_1.default.NVarChar(128), data.entidad)
                            .input('Anio', mssql_1.default.SmallInt, data.anio)
                            .input('Quincena', mssql_1.default.TinyInt, data.quincena)
                            .input('Usuario', mssql_1.default.NVarChar(100), data.usuario)
                            .input('Accion', mssql_1.default.VarChar(20), data.accion);
                        return [4 /*yield*/, verifyRequest.query("\n        SELECT TOP 1 AfectacionId, Resultado, Mensaje\n        FROM afec.BitacoraAfectacionOrg\n        WHERE Entidad = @Entidad\n          AND Anio = @Anio\n          AND Quincena = @Quincena\n          AND Usuario = @Usuario\n          AND Accion = @Accion\n        ORDER BY CreatedAt DESC\n      ")];
                    case 2:
                        verifyResult = _a.sent();
                        if (verifyResult.recordset.length === 0) {
                            throw new Error('Afectacion registration failed: No record found in audit log');
                        }
                        logEntry = verifyResult.recordset[0];
                        if (logEntry.Resultado !== 'OK') {
                            throw new Error("Afectacion registration failed: ".concat(logEntry.Mensaje || 'Unknown error'));
                        }
                        return [2 /*return*/, {
                                success: true,
                                afectacionId: logEntry.AfectacionId,
                                message: logEntry.Mensaje || 'Afectacion registered successfully'
                            }];
                    case 3:
                        error_1 = _a.sent();
                        logger.error({
                            operation: 'registrar',
                            entidad: data.entidad,
                            anio: data.anio,
                            quincena: data.quincena,
                            error: error_1.message,
                            stack: error_1.stack
                        }, 'Error al registrar afectación en repository');
                        if (error_1.message.includes('Afectacion registration failed')) {
                            throw error_1;
                        }
                        if (error_1.code) {
                            throw new Error("Database error during affectation registration: ".concat(error_1.message));
                        }
                        throw new Error("Failed to register affectation: ".concat(error_1.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AfectacionRepository;
}());
exports.AfectacionRepository = AfectacionRepository;
