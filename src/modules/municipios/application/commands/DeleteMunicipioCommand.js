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
exports.DeleteMunicipioCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'deleteMunicipioCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var DeleteMunicipioCommand = /** @class */ (function () {
    function DeleteMunicipioCommand(municipioRepo) {
        this.municipioRepo = municipioRepo;
    }
    DeleteMunicipioCommand.prototype.execute = function (input, tx) {
        return __awaiter(this, void 0, void 0, function () {
            var municipio, deleted, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger.info({
                            operation: 'deleteMunicipio',
                            municipioId: input.municipioId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando eliminación de municipio');
                        // Validar ID
                        this.validateId(input.municipioId);
                        return [4 /*yield*/, this.municipioRepo.findById(input.municipioId)];
                    case 1:
                        municipio = _a.sent();
                        if (!municipio) {
                            throw new errors_js_1.MunicipioNotFoundError(input.municipioId);
                        }
                        // Validar que se puede eliminar (verificar si está en uso)
                        return [4 /*yield*/, this.validateCanDelete()];
                    case 2:
                        // Validar que se puede eliminar (verificar si está en uso)
                        _a.sent();
                        return [4 /*yield*/, this.municipioRepo.delete(input.municipioId, tx)];
                    case 3:
                        deleted = _a.sent();
                        if (!deleted) {
                            throw new errors_js_1.MunicipioError('Error al eliminar municipio en la base de datos', 'MUNICIPIO_DELETE_FAILED', 500);
                        }
                        logger.info({
                            operation: 'deleteMunicipio',
                            municipioId: input.municipioId,
                            estadoId: municipio.estadoId,
                            claveMunicipio: municipio.claveMunicipio,
                            nombreMunicipio: municipio.nombreMunicipio,
                            timestamp: new Date().toISOString()
                        }, 'Municipio eliminado exitosamente');
                        return [2 /*return*/, deleted];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.MunicipioNotFoundError ||
                            error_1 instanceof errors_js_1.MunicipioInvalidIdError ||
                            error_1 instanceof errors_js_1.MunicipioInUseError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'deleteMunicipio',
                            error: error_1.message,
                            municipioId: input.municipioId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al eliminar municipio');
                        throw new errors_js_1.MunicipioError('Error interno al eliminar municipio', 'MUNICIPIO_DELETE_ERROR', 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DeleteMunicipioCommand.prototype.validateId = function (municipioId) {
        if (!Number.isInteger(municipioId) || municipioId <= 0) {
            throw new errors_js_1.MunicipioInvalidIdError('debe ser un número entero positivo');
        }
    };
    DeleteMunicipioCommand.prototype.validateCanDelete = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return DeleteMunicipioCommand;
}());
exports.DeleteMunicipioCommand = DeleteMunicipioCommand;
