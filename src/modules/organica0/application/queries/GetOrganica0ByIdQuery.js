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
exports.GetOrganica0ByIdQuery = void 0;
var errors_js_1 = require("../../domain/errors.js");
var GetOrganica0ByIdQuery = /** @class */ (function () {
    function GetOrganica0ByIdQuery(organica0Repo) {
        this.organica0Repo = organica0Repo;
    }
    GetOrganica0ByIdQuery.prototype.execute = function (claveOrganica, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var organica0, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('ORGANICA0_QUERY', {
                            operation: 'GET_ORGANICA0_BY_ID',
                            userId: userId || 'SYSTEM',
                            timestamp: new Date().toISOString(),
                            claveOrganica: claveOrganica
                        });
                        // Validar clave organica0
                        this.validateClaveOrganica(claveOrganica);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.organica0Repo.findById(claveOrganica)];
                    case 2:
                        organica0 = _a.sent();
                        if (!organica0) {
                            console.warn('ORGANICA0_QUERY_WARNING', {
                                operation: 'GET_ORGANICA0_BY_ID',
                                userId: userId || 'SYSTEM',
                                claveOrganica: claveOrganica,
                                reason: 'ORGANICA0_NOT_FOUND',
                                timestamp: new Date().toISOString()
                            });
                            throw new errors_js_1.Organica0NotFoundError(claveOrganica);
                        }
                        console.log('ORGANICA0_QUERY_SUCCESS', {
                            operation: 'GET_ORGANICA0_BY_ID',
                            userId: userId || 'SYSTEM',
                            claveOrganica: claveOrganica,
                            found: true,
                            timestamp: new Date().toISOString()
                        });
                        return [2 /*return*/, organica0];
                    case 3:
                        error_1 = _a.sent();
                        console.error('ORGANICA0_QUERY_ERROR', {
                            operation: 'GET_ORGANICA0_BY_ID',
                            userId: userId || 'SYSTEM',
                            claveOrganica: claveOrganica,
                            error: error_1 instanceof Error ? error_1.message : 'UNKNOWN_ERROR',
                            timestamp: new Date().toISOString()
                        });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GetOrganica0ByIdQuery.prototype.validateClaveOrganica = function (clave) {
        if (!clave || typeof clave !== 'string') {
            throw new Error('La clave organica0 es requerida y debe ser una cadena de texto');
        }
        var trimmed = clave.trim();
        if (trimmed.length === 0) {
            throw new Error('La clave organica0 no puede estar vacía');
        }
        if (trimmed.length > 50) {
            throw new Error('La clave organica0 no puede tener más de 50 caracteres');
        }
    };
    return GetOrganica0ByIdQuery;
}());
exports.GetOrganica0ByIdQuery = GetOrganica0ByIdQuery;
