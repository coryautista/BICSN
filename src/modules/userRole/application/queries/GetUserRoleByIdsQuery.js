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
exports.GetUserRoleByIdsQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var GetUserRoleByIdsQuery = /** @class */ (function () {
    function GetUserRoleByIdsQuery(userRoleRepo) {
        this.userRoleRepo = userRoleRepo;
    }
    GetUserRoleByIdsQuery.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, userRole, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Consultando asignaci\u00F3n usuario-rol por IDs"), {
                            usuarioId: data.usuarioId,
                            roleId: data.roleId
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Validar datos de entrada
                        return [4 /*yield*/, this.validateQueryInput(data)];
                    case 2:
                        // Validar datos de entrada
                        _a.sent();
                        return [4 /*yield*/, this.userRoleRepo.findByIds(data.usuarioId, data.roleId)];
                    case 3:
                        userRole = _a.sent();
                        if (!userRole) {
                            throw new errors_js_1.UserRoleNotFoundError(data.usuarioId, data.roleId);
                        }
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Asignaci\u00F3n usuario-rol encontrada"), {
                            usuarioId: userRole.usuarioId,
                            roleId: userRole.roleId
                        });
                        return [2 /*return*/, userRole];
                    case 4:
                        error_1 = _a.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en consulta de asignaci\u00F3n usuario-rol por IDs"), {
                            usuarioId: data.usuarioId,
                            roleId: data.roleId,
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido'
                        });
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    GetUserRoleByIdsQuery.prototype.validateQueryInput = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Validar usuarioId (requerido)
                if (!data.usuarioId || typeof data.usuarioId !== 'string' || data.usuarioId.trim().length === 0) {
                    throw new errors_js_1.UserRoleInvalidUsuarioIdError(data.usuarioId);
                }
                // Validar roleId (requerido)
                if (!data.roleId || typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
                    throw new errors_js_1.UserRoleInvalidRoleIdError(data.roleId);
                }
                return [2 /*return*/];
            });
        });
    };
    return GetUserRoleByIdsQuery;
}());
exports.GetUserRoleByIdsQuery = GetUserRoleByIdsQuery;
