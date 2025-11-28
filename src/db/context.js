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
exports.sql = void 0;
exports.withDbContext = withDbContext;
exports.logAppEvent = logAppEvent;
var mssql_js_1 = require("./mssql.js");
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return mssql_js_1.sql; } });
function withDbContext(req, fn) {
    return __awaiter(this, void 0, void 0, function () {
        var pool, tx, r, sessionValues, _i, sessionValues_1, _a, key, value, type, paramName, result, error_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    pool = _c.sent();
                    tx = new mssql_js_1.sql.Transaction(pool);
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 10, , 12]);
                    return [4 /*yield*/, tx.begin()];
                case 3:
                    _c.sent();
                    r = new mssql_js_1.sql.Request(tx);
                    sessionValues = [
                        { key: 'userId', value: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.sub) || null, type: mssql_js_1.sql.NVarChar(200) },
                        { key: 'userName', value: req.headers['x-user-name'] || null, type: mssql_js_1.sql.NVarChar(200) },
                        { key: 'appName', value: process.env.APP_NAME || 'api', type: mssql_js_1.sql.NVarChar(200) },
                        { key: 'ip', value: req.ip, type: mssql_js_1.sql.NVarChar(50) },
                        { key: 'userAgent', value: req.headers['user-agent'] || '', type: mssql_js_1.sql.NVarChar(500) },
                        { key: 'requestId', value: req.id, type: mssql_js_1.sql.NVarChar(200) }
                    ];
                    _i = 0, sessionValues_1 = sessionValues;
                    _c.label = 4;
                case 4:
                    if (!(_i < sessionValues_1.length)) return [3 /*break*/, 7];
                    _a = sessionValues_1[_i], key = _a.key, value = _a.value, type = _a.type;
                    paramName = "p_".concat(key);
                    r.input(paramName, type, value);
                    return [4 /*yield*/, r.batch("EXEC sp_set_session_context @key=N'".concat(key, "', @value=@").concat(paramName, ";"))];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [4 /*yield*/, fn(tx)];
                case 8:
                    result = _c.sent();
                    // Commit the transaction
                    return [4 /*yield*/, tx.commit()];
                case 9:
                    // Commit the transaction
                    _c.sent();
                    return [2 /*return*/, result];
                case 10:
                    error_1 = _c.sent();
                    // Rollback on error
                    return [4 /*yield*/, tx.rollback()];
                case 11:
                    // Rollback on error
                    _c.sent();
                    throw error_1;
                case 12: return [2 /*return*/];
            }
        });
    });
}
function logAppEvent(_req, entidad, entidadId, accion, antes, despues, tx) {
    return __awaiter(this, void 0, void 0, function () {
        var datosAntes, datosDespues, pool, request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    datosAntes = antes ? JSON.stringify(antes) : null;
                    datosDespues = despues ? JSON.stringify(despues) : null;
                    return [4 /*yield*/, (0, mssql_js_1.getPool)()];
                case 1:
                    pool = _a.sent();
                    request = tx ? new mssql_js_1.sql.Request(tx) : new mssql_js_1.sql.Request(pool);
                    request.input('entidad', mssql_js_1.sql.NVarChar, entidad);
                    request.input('entidadId', mssql_js_1.sql.NVarChar, entidadId);
                    request.input('accion', mssql_js_1.sql.NVarChar, accion);
                    request.input('datosAntes', mssql_js_1.sql.NVarChar(mssql_js_1.sql.MAX), datosAntes);
                    request.input('datosDespues', mssql_js_1.sql.NVarChar(mssql_js_1.sql.MAX), datosDespues);
                    return [4 /*yield*/, request.execute('dbo.usp_LogMovimiento')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
