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
exports.sql = exports.ping = exports.getPool = exports.closeDatabaseConnection = exports.connectDatabase = void 0;
var mssql_1 = require("mssql");
exports.sql = mssql_1.default;
var env_js_1 = require("../config/env.js");
var sqlConfig = {
    server: env_js_1.env.sql.server,
    database: env_js_1.env.sql.database,
    user: env_js_1.env.sql.user,
    password: env_js_1.env.sql.password,
    port: env_js_1.env.sql.port,
    options: {
        encrypt: env_js_1.env.sql.options.encrypt,
        trustServerCertificate: env_js_1.env.sql.options.trustServerCertificate,
    },
    pool: env_js_1.env.sql.pool,
};
var pool = null;
var connectDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (pool) {
                    return [2 /*return*/, pool];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, mssql_1.default.connect(sqlConfig)];
            case 2:
                pool = _a.sent();
                console.log('Connected to SQL Server database');
                return [2 /*return*/, pool];
            case 3:
                error_1 = _a.sent();
                console.error('Error connecting to SQL Server:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.connectDatabase = connectDatabase;
var closeDatabaseConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!pool) return [3 /*break*/, 2];
                return [4 /*yield*/, pool.close()];
            case 1:
                _a.sent();
                pool = null;
                console.log('Database connection closed');
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
exports.closeDatabaseConnection = closeDatabaseConnection;
var getPool = function () {
    if (!pool) {
        throw new Error('Database pool not initialized. Call connectDatabase() first.');
    }
    return pool;
};
exports.getPool = getPool;
var ping = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!pool) {
                    throw new Error('Database pool not initialized. Call connectDatabase() first.');
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.request().query('SELECT 1')];
            case 2:
                _a.sent();
                return [2 /*return*/, true];
            case 3:
                error_2 = _a.sent();
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.ping = ping;
