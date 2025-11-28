"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicQuerySchema = exports.UpdateOrganica1Schema = exports.CreateOrganica1Schema = exports.Organica1Schema = void 0;
var zod_1 = require("zod");
// Schema for ORGANICA_1 table (Firebird)
exports.Organica1Schema = zod_1.z.object({
    claveOrganica0: zod_1.z.string().min(1).max(2),
    claveOrganica1: zod_1.z.string().min(1).max(2),
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    rfc: zod_1.z.string().max(13).optional(),
    imss: zod_1.z.string().max(11).optional(),
    infonavit: zod_1.z.string().max(10).optional(),
    bancoSar: zod_1.z.string().max(4).optional(),
    cuentaSar: zod_1.z.string().max(13).optional(),
    tipoEmpresaSar: zod_1.z.string().max(8).optional(),
    pcp: zod_1.z.string().max(8).optional(),
    ph: zod_1.z.string().max(8).optional(),
    fv: zod_1.z.string().max(8).optional(),
    fg: zod_1.z.string().max(8).optional(),
    di: zod_1.z.string().max(8).optional(),
    fechaRegistro1: zod_1.z.date(),
    fechaFin1: zod_1.z.date().optional(),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1),
    sar: zod_1.z.string().max(12).optional()
});
exports.CreateOrganica1Schema = zod_1.z.object({
    claveOrganica0: zod_1.z.string().min(1).max(2),
    claveOrganica1: zod_1.z.string().min(1).max(2),
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    rfc: zod_1.z.string().max(13).optional(),
    imss: zod_1.z.string().max(11).optional(),
    infonavit: zod_1.z.string().max(10).optional(),
    bancoSar: zod_1.z.string().max(4).optional(),
    cuentaSar: zod_1.z.string().max(13).optional(),
    tipoEmpresaSar: zod_1.z.string().max(8).optional(),
    pcp: zod_1.z.string().max(8).optional(),
    ph: zod_1.z.string().max(8).optional(),
    fv: zod_1.z.string().max(8).optional(),
    fg: zod_1.z.string().max(8).optional(),
    di: zod_1.z.string().max(8).optional(),
    fechaFin1: zod_1.z.date().optional(),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1).default('A'),
    sar: zod_1.z.string().max(12).optional()
});
exports.UpdateOrganica1Schema = zod_1.z.object({
    descripcion: zod_1.z.string().max(40).optional(),
    titular: zod_1.z.number().int().optional(),
    rfc: zod_1.z.string().max(13).optional(),
    imss: zod_1.z.string().max(11).optional(),
    infonavit: zod_1.z.string().max(10).optional(),
    bancoSar: zod_1.z.string().max(4).optional(),
    cuentaSar: zod_1.z.string().max(13).optional(),
    tipoEmpresaSar: zod_1.z.string().max(8).optional(),
    pcp: zod_1.z.string().max(8).optional(),
    ph: zod_1.z.string().max(8).optional(),
    fv: zod_1.z.string().max(8).optional(),
    fg: zod_1.z.string().max(8).optional(),
    di: zod_1.z.string().max(8).optional(),
    fechaFin1: zod_1.z.date().optional(),
    usuario: zod_1.z.string().max(13).optional(),
    estatus: zod_1.z.string().min(1).max(1).optional(),
    sar: zod_1.z.string().max(12).optional()
});
exports.DynamicQuerySchema = zod_1.z.object({
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['ASC', 'DESC']).optional(),
    limit: zod_1.z.number().int().min(1).max(1000).optional(),
    offset: zod_1.z.number().int().min(0).optional()
});
