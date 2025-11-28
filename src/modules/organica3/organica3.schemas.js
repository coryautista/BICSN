"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicQuerySchema = exports.UpdateOrganica3Schema = exports.CreateOrganica3Schema = exports.Organica3Schema = void 0;
var zod_1 = require("zod");
// Schema for ORGANICA_3 table (Firebird)
exports.Organica3Schema = zod_1.z.object({
    claveOrganica0: zod_1.z.string().min(1).max(2),
    claveOrganica1: zod_1.z.string().min(1).max(2),
    claveOrganica2: zod_1.z.string().min(1).max(2),
    claveOrganica3: zod_1.z.string().min(1).max(2),
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    calleNum: zod_1.z.string().max(40).optional(),
    fraccionamiento: zod_1.z.string().max(40).optional(),
    codigoPostal: zod_1.z.string().max(5).optional(),
    telefono: zod_1.z.string().max(15).optional(),
    fax: zod_1.z.string().max(15).optional(),
    localidad: zod_1.z.string().max(25).optional(),
    municipio: zod_1.z.number().int().optional(),
    estado: zod_1.z.number().int().optional(),
    fechaRegistro3: zod_1.z.date(),
    fechaFin3: zod_1.z.date().optional(),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1)
});
exports.CreateOrganica3Schema = zod_1.z.object({
    claveOrganica0: zod_1.z.string().min(1).max(2),
    claveOrganica1: zod_1.z.string().min(1).max(2),
    claveOrganica2: zod_1.z.string().min(1).max(2),
    claveOrganica3: zod_1.z.string().min(1).max(2),
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    calleNum: zod_1.z.string().max(40).optional(),
    fraccionamiento: zod_1.z.string().max(40).optional(),
    codigoPostal: zod_1.z.string().max(5).optional(),
    telefono: zod_1.z.string().max(15).optional(),
    fax: zod_1.z.string().max(15).optional(),
    localidad: zod_1.z.string().max(25).optional(),
    municipio: zod_1.z.number().int().optional(),
    estado: zod_1.z.number().int().optional(),
    fechaFin3: zod_1.z.string().datetime().optional().transform(function (val) { return val ? new Date(val) : undefined; }),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1).default('A')
});
exports.UpdateOrganica3Schema = zod_1.z.object({
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    calleNum: zod_1.z.string().max(40).optional(),
    fraccionamiento: zod_1.z.string().max(40).optional(),
    codigoPostal: zod_1.z.string().max(5).optional(),
    telefono: zod_1.z.string().max(15).optional(),
    fax: zod_1.z.string().max(15).optional(),
    localidad: zod_1.z.string().max(25).optional(),
    municipio: zod_1.z.number().int().optional(),
    estado: zod_1.z.number().int().optional(),
    fechaFin3: zod_1.z.string().datetime().optional().transform(function (val) { return val ? new Date(val) : undefined; }),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1).optional()
});
exports.DynamicQuerySchema = zod_1.z.object({
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['ASC', 'DESC']).optional(),
    limit: zod_1.z.number().int().min(1).max(1000).optional(),
    offset: zod_1.z.number().int().min(0).optional()
});
