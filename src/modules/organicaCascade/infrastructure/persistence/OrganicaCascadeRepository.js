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
exports.OrganicaCascadeRepository = void 0;
var firebird_js_1 = require("../../../../db/firebird.js");
var OrganicaCascadeRepository = /** @class */ (function () {
    function OrganicaCascadeRepository() {
    }
    OrganicaCascadeRepository.prototype.findOrganica1ByOrganica0 = function (claveOrganica0) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query("SELECT \n          CLAVE_ORGANICA_0, \n          CLAVE_ORGANICA_1, \n          DESCRIPCION, \n          TITULAR,\n          ESTATUS\n        FROM ORGANICA_1 \n        WHERE CLAVE_ORGANICA_0 = ?\n        ORDER BY CLAVE_ORGANICA_1", [claveOrganica0], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    OrganicaCascadeRepository.prototype.findOrganica2ByOrganica1 = function (claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query("SELECT \n          CLAVE_ORGANICA_0, \n          CLAVE_ORGANICA_1, \n          CLAVE_ORGANICA_2,\n          DESCRIPCION, \n          TITULAR,\n          ESTATUS\n        FROM ORGANICA_2 \n        WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ?\n        ORDER BY CLAVE_ORGANICA_2", [claveOrganica0, claveOrganica1], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    OrganicaCascadeRepository.prototype.findOrganica3ByOrganica2 = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                db = (0, firebird_js_1.getFirebirdDb)();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        db.query("SELECT \n          CLAVE_ORGANICA_0, \n          CLAVE_ORGANICA_1, \n          CLAVE_ORGANICA_2,\n          CLAVE_ORGANICA_3,\n          DESCRIPCION, \n          TITULAR,\n          ESTATUS\n        FROM ORGANICA_3 \n        WHERE CLAVE_ORGANICA_0 = ? AND CLAVE_ORGANICA_1 = ? AND CLAVE_ORGANICA_2 = ?\n        ORDER BY CLAVE_ORGANICA_3", [claveOrganica0, claveOrganica1, claveOrganica2], function (err, result) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            var records = result.map(function (row) { return ({
                                claveOrganica0: row.CLAVE_ORGANICA_0,
                                claveOrganica1: row.CLAVE_ORGANICA_1,
                                claveOrganica2: row.CLAVE_ORGANICA_2,
                                claveOrganica3: row.CLAVE_ORGANICA_3,
                                descripcion: row.DESCRIPCION,
                                titular: row.TITULAR,
                                estatus: row.ESTATUS
                            }); });
                            resolve(records);
                        });
                    })];
            });
        });
    };
    return OrganicaCascadeRepository;
}());
exports.OrganicaCascadeRepository = OrganicaCascadeRepository;
