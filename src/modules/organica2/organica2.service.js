"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Organica2Service = void 0;
var audit_js_1 = require("../../utils/audit.js");
var Organica2Service = /** @class */ (function () {
    function Organica2Service(organica2Repo) {
        this.organica2Repo = organica2Repo;
    }
    Organica2Service.prototype.getOrganica2ById = function (claveOrganica0, claveOrganica1, claveOrganica2) {
        return __awaiter(this, void 0, void 0, function () {
            var record;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2)];
                    case 1:
                        record = _a.sent();
                        if (!record) {
                            throw new Error('ORGANICA2_NOT_FOUND');
                        }
                        return [2 /*return*/, record];
                }
            });
        });
    };
    Organica2Service.prototype.getAllOrganica2 = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findAll()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Organica2Service.prototype.createOrganica2Record = function (data, req) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, record, userInfo, requestInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findById(data.claveOrganica0, data.claveOrganica1, data.claveOrganica2)];
                    case 1:
                        existing = _a.sent();
                        if (existing) {
                            throw new Error('ORGANICA2_EXISTS');
                        }
                        return [4 /*yield*/, this.organica2Repo.create(data)];
                    case 2:
                        record = _a.sent();
                        if (!req) return [3 /*break*/, 4];
                        userInfo = (0, audit_js_1.extractUserInfo)(req);
                        requestInfo = (0, audit_js_1.extractRequestInfo)(req);
                        return [4 /*yield*/, (0, audit_js_1.logAudit)(__assign(__assign({ entidad: 'ORGANICA_2', entidadId: "".concat(data.claveOrganica0, "-").concat(data.claveOrganica1, "-").concat(data.claveOrganica2), accion: 'CREATE', datosDespues: record }, userInfo), requestInfo))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, record];
                }
            });
        });
    };
    Organica2Service.prototype.updateOrganica2Record = function (claveOrganica0, claveOrganica1, claveOrganica2, data, req) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, record, userInfo, requestInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('ORGANICA2_NOT_FOUND');
                        }
                        return [4 /*yield*/, this.organica2Repo.update(claveOrganica0, claveOrganica1, claveOrganica2, data)];
                    case 2:
                        record = _a.sent();
                        if (!req) return [3 /*break*/, 4];
                        userInfo = (0, audit_js_1.extractUserInfo)(req);
                        requestInfo = (0, audit_js_1.extractRequestInfo)(req);
                        return [4 /*yield*/, (0, audit_js_1.logAudit)(__assign(__assign({ entidad: 'ORGANICA_2', entidadId: "".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2), accion: 'UPDATE', datosAntes: existing, datosDespues: record }, userInfo), requestInfo))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, record];
                }
            });
        });
    };
    Organica2Service.prototype.deleteOrganica2Record = function (claveOrganica0, claveOrganica1, claveOrganica2, req) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, deleted, userInfo, requestInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findById(claveOrganica0, claveOrganica1, claveOrganica2)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) {
                            throw new Error('ORGANICA2_NOT_FOUND');
                        }
                        return [4 /*yield*/, this.organica2Repo.delete(claveOrganica0, claveOrganica1, claveOrganica2)];
                    case 2:
                        deleted = _a.sent();
                        if (!deleted) {
                            throw new Error('ORGANICA2_DELETE_FAILED');
                        }
                        if (!req) return [3 /*break*/, 4];
                        userInfo = (0, audit_js_1.extractUserInfo)(req);
                        requestInfo = (0, audit_js_1.extractRequestInfo)(req);
                        return [4 /*yield*/, (0, audit_js_1.logAudit)(__assign(__assign({ entidad: 'ORGANICA_2', entidadId: "".concat(claveOrganica0, "-").concat(claveOrganica1, "-").concat(claveOrganica2), accion: 'DELETE', datosAntes: existing }, userInfo), requestInfo))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, { claveOrganica0: claveOrganica0, claveOrganica1: claveOrganica1, claveOrganica2: claveOrganica2, deleted: true }];
                }
            });
        });
    };
    Organica2Service.prototype.queryOrganica2Dynamic = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.dynamicQuery(query)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Organica2Service.prototype.getOrganica2ByUserToken = function (claveOrganica0, claveOrganica1) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.organica2Repo.findByClaveOrganica0And1(claveOrganica0, claveOrganica1)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Organica2Service;
}());
exports.Organica2Service = Organica2Service;
