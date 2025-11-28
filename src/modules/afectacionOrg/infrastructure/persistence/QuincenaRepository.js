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
exports.QuincenaRepository = void 0;
var mssql_1 = require("mssql");
var QuincenaRepository = /** @class */ (function () {
    function QuincenaRepository(mssqlPool) {
        this.mssqlPool = mssqlPool;
    }
    QuincenaRepository.prototype.getQuincenaAltaAfectacion = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var query, request, result, now_1, year, lastAfectacion, lastYear, lastQuincena, now, currentYear, currentMonth, currentDay, currentQuincenaMonth, currentQuincenaYear, isActive, nextYear, nextQuincena;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT TOP 1\n        Anio,\n        QuincenaActual,\n        UltimaFecha\n      FROM afec.EstadoAfectacionOrg\n      WHERE 1=1\n    ";
                        request = this.mssqlPool.request();
                        if (filters === null || filters === void 0 ? void 0 : filters.entidad) {
                            query += ' AND Entidad = @entidad';
                            request.input('entidad', mssql_1.default.NVarChar(128), filters.entidad);
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.org0) {
                            query += ' AND Org0 = @org0';
                            request.input('org0', mssql_1.default.Char(2), filters.org0);
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.org1) {
                            query += ' AND Org1 = @org1';
                            request.input('org1', mssql_1.default.Char(2), filters.org1);
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.org2) {
                            query += ' AND Org2 = @org2';
                            request.input('org2', mssql_1.default.Char(2), filters.org2);
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.org3) {
                            query += ' AND Org3 = @org3';
                            request.input('org3', mssql_1.default.Char(2), filters.org3);
                        }
                        query += ' ORDER BY Anio DESC, QuincenaActual DESC';
                        return [4 /*yield*/, request.query(query)];
                    case 1:
                        result = _a.sent();
                        if (result.recordset.length === 0) {
                            now_1 = new Date();
                            year = now_1.getFullYear();
                            return [2 /*return*/, {
                                    anio: year,
                                    mes: 1,
                                    quincena: 1,
                                    fechaActual: now_1.toISOString(),
                                    descripcion: "Quincena 1 de 01/".concat(year, " (primera afectaci\u00F3n para esta org\u00E1nica)"),
                                    esNueva: true
                                }];
                        }
                        lastAfectacion = result.recordset[0];
                        lastYear = lastAfectacion.Anio;
                        lastQuincena = lastAfectacion.QuincenaActual;
                        now = new Date();
                        currentYear = now.getFullYear();
                        currentMonth = now.getMonth() + 1;
                        currentDay = now.getDate();
                        currentQuincenaMonth = currentDay <= 15 ? 1 : 2;
                        currentQuincenaYear = (currentMonth - 1) * 2 + currentQuincenaMonth;
                        isActive = (lastYear === currentYear && lastQuincena === currentQuincenaYear);
                        if (isActive) {
                            // Return the active quincena
                            return [2 /*return*/, {
                                    anio: lastYear,
                                    mes: currentMonth,
                                    quincena: lastQuincena,
                                    fechaActual: now.toISOString(),
                                    descripcion: "Quincena ".concat(lastQuincena, " de ").concat(currentMonth.toString().padStart(2, '0'), "/").concat(lastYear, " (activa)"),
                                    esNueva: false
                                }];
                        }
                        else {
                            nextYear = lastYear;
                            nextQuincena = lastQuincena + 1;
                            if (nextQuincena > 24) {
                                nextQuincena = 1;
                                nextYear = lastYear + 1;
                            }
                            // If next quincena is still in the past, keep advancing until we reach current or future
                            while (nextYear < currentYear || (nextYear === currentYear && nextQuincena < currentQuincenaYear)) {
                                nextQuincena++;
                                if (nextQuincena > 24) {
                                    nextQuincena = 1;
                                    nextYear++;
                                }
                            }
                            return [2 /*return*/, {
                                    anio: nextYear,
                                    mes: currentMonth,
                                    quincena: nextQuincena,
                                    fechaActual: now.toISOString(),
                                    descripcion: "Quincena ".concat(nextQuincena, " de ").concat(currentMonth.toString().padStart(2, '0'), "/").concat(nextYear, " (siguiente)"),
                                    esNueva: false
                                }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return QuincenaRepository;
}());
exports.QuincenaRepository = QuincenaRepository;
