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
exports.UpdateMovimientoCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'updateMovimientoCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var UpdateMovimientoCommand = /** @class */ (function () {
    function UpdateMovimientoCommand(movimientoRepo) {
        this.movimientoRepo = movimientoRepo;
    }
    UpdateMovimientoCommand.prototype.execute = function (data, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingMovimiento, movimientoWithFolio, movimiento, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        logger.info({
                            operation: 'updateMovimiento',
                            movimientoId: data.id,
                            tipoMovimientoId: data.tipoMovimientoId,
                            afiliadoId: data.afiliadoId,
                            folio: data.folio,
                            estatus: data.estatus,
                            fecha: data.fecha,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando actualización de movimiento');
                        return [4 /*yield*/, this.movimientoRepo.findById(data.id)];
                    case 1:
                        existingMovimiento = _a.sent();
                        if (!existingMovimiento) {
                            throw new errors_js_1.MovimientoNotFoundError(data.id);
                        }
                        // Validaciones de entrada
                        this.validateInput(data);
                        if (!(data.folio && data.folio !== existingMovimiento.folio)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.movimientoRepo.findByFolio(data.folio)];
                    case 2:
                        movimientoWithFolio = _a.sent();
                        if (movimientoWithFolio) {
                            throw new errors_js_1.MovimientoAlreadyExistsError(data.folio);
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.movimientoRepo.update(data)];
                    case 4:
                        movimiento = _a.sent();
                        logger.info({
                            operation: 'updateMovimiento',
                            movimientoId: movimiento.id,
                            tipoMovimientoId: movimiento.tipoMovimientoId,
                            afiliadoId: movimiento.afiliadoId,
                            folio: movimiento.folio,
                            estatus: movimiento.estatus,
                            userId: userId,
                            timestamp: new Date().toISOString()
                        }, 'Movimiento actualizado exitosamente');
                        return [2 /*return*/, movimiento];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1 instanceof errors_js_1.MovimientoNotFoundError ||
                            error_1 instanceof errors_js_1.MovimientoAlreadyExistsError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidTipoMovimientoError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidAfiliadoError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidFechaError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidFolioError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidEstatusError ||
                            error_1 instanceof errors_js_1.MovimientoInvalidCreadorError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'updateMovimiento',
                            error: error_1.message,
                            movimientoId: data.id,
                            tipoMovimientoId: data.tipoMovimientoId,
                            afiliadoId: data.afiliadoId,
                            folio: data.folio,
                            userId: userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al actualizar movimiento');
                        throw new errors_js_1.MovimientoError('Error interno al actualizar movimiento', 'MOVIMIENTO_UPDATE_ERROR', 500);
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    UpdateMovimientoCommand.prototype.validateInput = function (data) {
        // Validar tipoMovimientoId si se proporciona
        if (data.tipoMovimientoId !== undefined) {
            if (!Number.isInteger(data.tipoMovimientoId) || data.tipoMovimientoId <= 0) {
                throw new errors_js_1.MovimientoInvalidTipoMovimientoError('debe ser un número entero positivo');
            }
        }
        // Validar afiliadoId si se proporciona
        if (data.afiliadoId !== undefined) {
            if (!Number.isInteger(data.afiliadoId) || data.afiliadoId <= 0) {
                throw new errors_js_1.MovimientoInvalidAfiliadoError('debe ser un número entero positivo');
            }
        }
        // Validar fecha si se proporciona
        if (data.fecha !== undefined) {
            if (typeof data.fecha !== 'string') {
                throw new errors_js_1.MovimientoInvalidFechaError('debe ser una cadena de texto');
            }
            var fechaDate = new Date(data.fecha);
            if (isNaN(fechaDate.getTime())) {
                throw new errors_js_1.MovimientoInvalidFechaError('tiene un formato inválido');
            }
            // Verificar que no sea una fecha futura
            var now = new Date();
            if (fechaDate > now) {
                throw new errors_js_1.MovimientoInvalidFechaError('no puede ser una fecha futura');
            }
        }
        // Validar folio si se proporciona
        if (data.folio !== undefined) {
            if (typeof data.folio !== 'string') {
                throw new errors_js_1.MovimientoInvalidFolioError('debe ser una cadena de texto');
            }
            var folioTrimmed = data.folio.trim();
            if (folioTrimmed.length === 0) {
                throw new errors_js_1.MovimientoInvalidFolioError('no puede estar vacío');
            }
            if (folioTrimmed.length > 50) {
                throw new errors_js_1.MovimientoInvalidFolioError('no puede tener más de 50 caracteres');
            }
            // Solo permitir letras, números y algunos caracteres especiales
            var folioRegex = /^[a-zA-Z0-9\-_\/]+$/;
            if (!folioRegex.test(folioTrimmed)) {
                throw new errors_js_1.MovimientoInvalidFolioError('solo puede contener letras, números, guiones y barras');
            }
        }
        // Validar estatus si se proporciona
        if (data.estatus !== undefined) {
            if (typeof data.estatus !== 'string') {
                throw new errors_js_1.MovimientoInvalidEstatusError('debe ser una cadena de texto');
            }
            var estatusTrimmed = data.estatus.trim();
            if (estatusTrimmed.length > 20) {
                throw new errors_js_1.MovimientoInvalidEstatusError('no puede tener más de 20 caracteres');
            }
            // Estatus permitidos
            var estatusPermitidos = ['activo', 'inactivo', 'pendiente', 'procesado', 'cancelado'];
            if (estatusTrimmed.length > 0 && !estatusPermitidos.includes(estatusTrimmed.toLowerCase())) {
                throw new errors_js_1.MovimientoInvalidEstatusError("debe ser uno de: ".concat(estatusPermitidos.join(', ')));
            }
        }
        // Validar creadoPor si se proporciona
        if (data.creadoPor !== undefined) {
            if (data.creadoPor === null || !Number.isInteger(data.creadoPor) || data.creadoPor <= 0) {
                throw new errors_js_1.MovimientoInvalidCreadorError('debe ser un número entero positivo');
            }
        }
        // Validar creadoPorUid si se proporciona
        if (data.creadoPorUid !== undefined) {
            if (typeof data.creadoPorUid !== 'string') {
                throw new errors_js_1.MovimientoInvalidCreadorError('el UID debe ser una cadena de texto');
            }
            var uidTrimmed = data.creadoPorUid.trim();
            if (uidTrimmed.length > 50) {
                throw new errors_js_1.MovimientoInvalidCreadorError('el UID no puede tener más de 50 caracteres');
            }
        }
        // Validar observaciones si se proporciona
        if (data.observaciones !== undefined) {
            if (typeof data.observaciones !== 'string') {
                throw new errors_js_1.MovimientoInvalidTipoMovimientoError('las observaciones deben ser una cadena de texto');
            }
            if (data.observaciones.length > 500) {
                throw new errors_js_1.MovimientoInvalidTipoMovimientoError('las observaciones no pueden tener más de 500 caracteres');
            }
        }
    };
    return UpdateMovimientoCommand;
}());
exports.UpdateMovimientoCommand = UpdateMovimientoCommand;
