"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseSchema = exports.PersonnelMovementsResponseSchema = exports.MonthlyReportResponseSchema = exports.PersonnelMovementSchema = exports.MonthlyPersonnelReportSchema = exports.ReportFiltersSchema = void 0;
var zod_1 = require("zod");
// Schema for report filters
exports.ReportFiltersSchema = zod_1.z.object({
    month: zod_1.z.number().int().min(1).max(12),
    year: zod_1.z.number().int().min(2000).max(new Date().getFullYear() + 1),
    organica0: zod_1.z.string().max(2).optional(),
    organica1: zod_1.z.string().max(2).optional()
});
// Schema for monthly personnel report response
exports.MonthlyPersonnelReportSchema = zod_1.z.object({
    month: zod_1.z.number(),
    year: zod_1.z.number(),
    organica0: zod_1.z.string(),
    organica1: zod_1.z.string(),
    descripcionOrganica1: zod_1.z.string(),
    sueldoMensual: zod_1.z.number(),
    afiliados: zod_1.z.number(),
    primeraQuincena: zod_1.z.object({
        altas: zod_1.z.number(),
        bajas: zod_1.z.number()
    }),
    segundaQuincena: zod_1.z.object({
        altas: zod_1.z.number(),
        bajas: zod_1.z.number()
    })
});
// Schema for personnel movement response
exports.PersonnelMovementSchema = zod_1.z.object({
    interno: zod_1.z.number(),
    nombreCompleto: zod_1.z.string(),
    organica0: zod_1.z.string(),
    organica1: zod_1.z.string(),
    tipoMovimiento: zod_1.z.enum(['ALTA', 'BAJA']),
    fechaMovimiento: zod_1.z.string(),
    quincena: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2)]),
    sueldo: zod_1.z.number()
});
// Schema for API responses
exports.MonthlyReportResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(exports.MonthlyPersonnelReportSchema),
    timestamp: zod_1.z.string().optional()
});
exports.PersonnelMovementsResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(exports.PersonnelMovementSchema),
    timestamp: zod_1.z.string().optional()
});
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        timestamp: zod_1.z.string().optional()
    })
});
