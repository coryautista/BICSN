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
exports.UpdateProcesoCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var UpdateProcesoCommand = /** @class */ (function () {
    function UpdateProcesoCommand(procesoRepo) {
        this.procesoRepo = procesoRepo;
    }
    UpdateProcesoCommand.prototype.execute = function (input, userId, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, existing, hasFieldsToUpdate, updateData_1, updated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Iniciando actualizaci\u00F3n de proceso"), {
                            procesoId: input.id,
                            camposActualizar: Object.keys(input).filter(function (key) { return key !== 'id' && input[key] !== undefined; })
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // Validar ID del proceso
                        if (!input.id || typeof input.id !== 'number' || input.id <= 0 || !Number.isInteger(input.id)) {
                            throw new errors_js_1.ProcesoInvalidIdError(input.id);
                        }
                        return [4 /*yield*/, this.procesoRepo.findById(input.id)];
                    case 2:
                        existing = _a.sent();
                        if (!existing) {
                            throw new errors_js_1.ProcesoNotFoundError(input.id);
                        }
                        // Validar datos de entrada si se proporcionan
                        return [4 /*yield*/, this.validateUpdateInput(input)];
                    case 3:
                        // Validar datos de entrada si se proporcionan
                        _a.sent();
                        hasFieldsToUpdate = input.nombre !== undefined ||
                            input.componente !== undefined ||
                            input.idModulo !== undefined ||
                            input.orden !== undefined ||
                            input.tipo !== undefined;
                        if (!hasFieldsToUpdate) {
                            console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] No hay campos para actualizar en proceso ").concat(input.id));
                            return [2 /*return*/, existing];
                        }
                        updateData_1 = {
                            nombre: input.nombre,
                            componente: input.componente,
                            idModulo: input.idModulo,
                            orden: input.orden,
                            tipo: input.tipo
                        };
                        return [4 /*yield*/, this.procesoRepo.update(input.id, updateData_1, tx)];
                    case 4:
                        updated = _a.sent();
                        if (!updated) {
                            throw new Error('Error interno al actualizar proceso');
                        }
                        console.log("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Proceso actualizado exitosamente"), {
                            procesoId: updated.id,
                            nombre: updated.nombre,
                            cambiosAplicados: Object.keys(updateData_1).filter(function (key) { return updateData_1[key] !== undefined; })
                        });
                        return [2 /*return*/, updated];
                    case 5:
                        error_1 = _a.sent();
                        console.error("[".concat(timestamp, "] [Usuario: ").concat(userId, "] Error en actualizaci\u00F3n de proceso"), {
                            procesoId: input.id,
                            error: error_1 instanceof Error ? error_1.message : 'Error desconocido'
                        });
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UpdateProcesoCommand.prototype.validateUpdateInput = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Validar nombre si se proporciona
                if (input.nombre !== undefined) {
                    if (typeof input.nombre !== 'string' || input.nombre.trim().length < 2 || input.nombre.length > 100) {
                        throw new errors_js_1.ProcesoInvalidNombreError(input.nombre);
                    }
                }
                // Validar componente si se proporciona
                if (input.componente !== undefined) {
                    if (typeof input.componente !== 'string' || input.componente.trim().length === 0 || input.componente.length > 100) {
                        throw new errors_js_1.ProcesoInvalidComponenteError(input.componente);
                    }
                }
                // Validar idModulo si se proporciona
                if (input.idModulo !== undefined) {
                    if (typeof input.idModulo !== 'number' || input.idModulo <= 0 || !Number.isInteger(input.idModulo)) {
                        throw new errors_js_1.ProcesoInvalidIdModuloError(input.idModulo);
                    }
                }
                // Validar orden si se proporciona
                if (input.orden !== undefined) {
                    if (typeof input.orden !== 'number' || input.orden < 0 || !Number.isInteger(input.orden)) {
                        throw new errors_js_1.ProcesoInvalidOrdenError(input.orden);
                    }
                }
                // Validar tipo si se proporciona
                if (input.tipo !== undefined) {
                    if (typeof input.tipo !== 'string' || input.tipo.trim().length === 0) {
                        throw new errors_js_1.ProcesoInvalidTipoError(input.tipo);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    return UpdateProcesoCommand;
}());
exports.UpdateProcesoCommand = UpdateProcesoCommand;
