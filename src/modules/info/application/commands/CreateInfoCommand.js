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
exports.CreateInfoCommand = void 0;
var errors_js_1 = require("../../domain/errors.js");
var pino_1 = require("pino");
var logger = (0, pino_1.default)({
    name: 'createInfoCommand',
    level: process.env.LOG_LEVEL || 'info'
});
var CreateInfoCommand = /** @class */ (function () {
    function CreateInfoCommand(infoRepo) {
        this.infoRepo = infoRepo;
    }
    CreateInfoCommand.prototype.execute = function (input, _userId) {
        return __awaiter(this, void 0, void 0, function () {
            var createData, result, error_1;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        logger.info({
                            operation: 'createInfo',
                            nombre: input.nombre,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Iniciando creación de información');
                        // Validaciones de entrada
                        this.validateInput(input);
                        createData = {
                            nombre: input.nombre.trim(),
                            icono: (_a = input.icono) === null || _a === void 0 ? void 0 : _a.trim(),
                            color: (_b = input.color) === null || _b === void 0 ? void 0 : _b.trim(),
                            colorBotones: (_c = input.colorBotones) === null || _c === void 0 ? void 0 : _c.trim(),
                            colorEncabezados: (_d = input.colorEncabezados) === null || _d === void 0 ? void 0 : _d.trim(),
                            colorLetra: (_e = input.colorLetra) === null || _e === void 0 ? void 0 : _e.trim(),
                            createdAt: input.createdAt,
                            updatedAt: input.updatedAt,
                            createdBy: input.createdBy,
                            updatedBy: input.updatedBy
                        };
                        return [4 /*yield*/, this.infoRepo.create(createData)];
                    case 1:
                        result = _f.sent();
                        logger.info({
                            operation: 'createInfo',
                            infoId: result.id,
                            nombre: result.nombre,
                            userId: _userId,
                            timestamp: new Date().toISOString()
                        }, 'Información creada exitosamente');
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _f.sent();
                        if (error_1 instanceof errors_js_1.InfoAlreadyExistsError ||
                            error_1 instanceof errors_js_1.InvalidInfoNameError ||
                            error_1 instanceof errors_js_1.InvalidInfoColorError ||
                            error_1 instanceof errors_js_1.InfoCreationDataMissingError) {
                            throw error_1;
                        }
                        logger.error({
                            operation: 'createInfo',
                            error: error_1.message,
                            nombre: input.nombre,
                            userId: _userId,
                            stack: error_1.stack,
                            timestamp: new Date().toISOString()
                        }, 'Error al crear información');
                        throw new errors_js_1.InfoRepositoryError('create', error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CreateInfoCommand.prototype.validateInput = function (input) {
        // Validar nombre requerido
        if (!input.nombre || typeof input.nombre !== 'string') {
            throw new errors_js_1.InfoCreationDataMissingError(['nombre']);
        }
        var nombre = input.nombre.trim();
        // Validar longitud del nombre
        if (nombre.length === 0) {
            throw new errors_js_1.InvalidInfoNameError(nombre, 'el nombre no puede estar vacío');
        }
        if (nombre.length > 100) {
            throw new errors_js_1.InvalidInfoNameError(nombre, 'el nombre no puede tener más de 100 caracteres');
        }
        // Validar formato del nombre (solo letras, números, espacios y algunos caracteres especiales)
        var nombreRegex = /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/;
        if (!nombreRegex.test(nombre)) {
            throw new errors_js_1.InvalidInfoNameError(nombre, 'el nombre contiene caracteres no válidos');
        }
        // Validar colores si están presentes
        var colorFields = ['color', 'colorBotones', 'colorEncabezados', 'colorLetra'];
        for (var _i = 0, colorFields_1 = colorFields; _i < colorFields_1.length; _i++) {
            var field = colorFields_1[_i];
            var colorValue = input[field];
            if (colorValue) {
                this.validateColor(field, colorValue);
            }
        }
    };
    CreateInfoCommand.prototype.validateColor = function (colorType, colorValue) {
        // Validar formato de color hexadecimal
        var hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        // Validar nombres de colores comunes
        var namedColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey'];
        if (!hexColorRegex.test(colorValue) && !namedColors.includes(colorValue.toLowerCase())) {
            throw new errors_js_1.InvalidInfoColorError(colorType, colorValue);
        }
    };
    return CreateInfoCommand;
}());
exports.CreateInfoCommand = CreateInfoCommand;
