# Inventario de Stored Procedures Firebird

> Generado: Enero 2026
> Actualizado: Enero 2026 (migración a helpers completada)
> Propósito: Lista completa de SPs usados en el backend, clasificados por tipo y timeout recomendado.

## Estado de Migración

Los helpers `executeSelectableProcedure` y `executeExecutableProcedure` están disponibles en `src/db/firebird.ts`.

### Migrados a helpers ✅
- `AP_G_APLICADO_TIPO` (afiliado.repo, afectacionOrg.service, CreateCompleteAfiliadoCommand)
- `AP_P_APLICAR` (afiliado.repo)
- `AP_D_ENVIO_LAYOUT` (afiliado.repo)

### Imports actualizados (listos para usar helpers)
- `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts`
- `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`
- `src/modules/CAIR/infrastructure/persistence/CAIRRepository.ts`
- `src/modules/reportes/CAIR/infrastructure/persistence/CAIRRepository.ts`
- `src/modules/reportes/afiliados/infrastructure/persistence/AfiliadosReportesRepository.ts`
- `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts`

### Pendientes de migración (usan legacy executeSerializedQuery)
- `FirebirdMovimientoService.ts` - DP_EDITA_PERSONAL, DP_EDITA_ENTIDAD (código muy complejo, requiere refactor cuidadoso)
- Varios repositorios de reportes (el legacy pattern funciona, pero se recomienda usar helpers para nuevo código)

---

## Clasificación de SPs

### Tipo "Selectable" (SELECT ... FROM SP(...))
Se ejecutan como query y retornan filas.

### Tipo "Executable" (EXECUTE PROCEDURE SP(...))
Se ejecutan como acción, retornan un singleton o nada.

---

## Lista Completa de SPs

### SPs Operacionales (HEAVY_SP = 60s)

| SP | Tipo | Archivo | Timeout |
|----|------|---------|---------|
| `DP_EDITA_PERSONAL` | selectable | `src/modules/afiliado/infrastructure/firebird/FirebirdMovimientoService.ts` | HEAVY_SP |
| `DP_EDITA_ENTIDAD` | selectable | `src/modules/afiliado/infrastructure/firebird/FirebirdMovimientoService.ts` | HEAVY_SP |
| `AP_P_APLICAR` | executable | `src/modules/afiliado/afiliado.repo.ts` | HEAVY_SP |
| `AP_D_ENVIO_LAYOUT` | executable | `src/modules/afiliado/afiliado.repo.ts` | HEAVY_SP |

### SPs de Reportes/Lotes (BATCH_OPERATION = 120s)

| SP | Tipo | Archivo | Timeout |
|----|------|---------|---------|
| `AP_S_HIP_QNA` | selectable | `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | BATCH_OPERATION |
| `ADEUDO_ORGANICA_LAYOUT` | selectable | `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | BATCH_OPERATION |
| `AP_RESUMEN_ORG_QNA_ALL` | selectable | `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts` | BATCH_OPERATION |
| `HISTORIAL_MOVIMIENTOS_QUIN` | selectable | `src/modules/reportes/afiliados/infrastructure/persistence/AfiliadosReportesRepository.ts` | BATCH_OPERATION |
| `HISTORIAL_MOV_PROMEDIO_SDO` | selectable | `src/modules/reportes/afiliados/infrastructure/persistence/AfiliadosReportesRepository.ts` | BATCH_OPERATION |

### SPs Rápidos (DEFAULT = 30s)

| SP | Tipo | Archivo | Timeout |
|----|------|---------|---------|
| `AP_G_APLICADO_TIPO` | selectable | `src/modules/afectacionOrg/afectacionOrg.service.ts`, `src/modules/afiliado/afiliado.repo.ts`, `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts` | DEFAULT |
| `AP_S_PCP` | selectable | `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`, `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | DEFAULT |
| `AP_S_VIV` | selectable | `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`, `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | DEFAULT |
| `AP_P_FONDOS` | selectable | `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | DEFAULT |
| `DP_ANTIGUEDAD_IND` | selectable | `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | DEFAULT |
| `HISTORIAL_MOVIMIENTOS_QUIN_IND` | selectable | `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | DEFAULT |
| `EBI2_RECIBOS_IMPRIMIR` | selectable | `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts` | DEFAULT |
| `PENSION_NOMINA_QNAL_TRANSITORIO` | selectable | `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts` | DEFAULT |
| `AGUINALDO_ORGANICAS` | selectable | `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts` | DEFAULT |
| `SAR_DEVOLUCION` | selectable | `src/modules/CAIR/infrastructure/persistence/CAIRRepository.ts` | DEFAULT |
| `SAR_TOTAL_A_ORG` | selectable | `src/modules/reportes/CAIR/infrastructure/persistence/CAIRRepository.ts` | DEFAULT |
| `SAR_DEVOLUCION_REPORTE` | selectable | `src/modules/reportes/CAIR/infrastructure/persistence/CAIRRepository.ts` | DEFAULT |

---

## Archivos a Migrar

### Alta prioridad (usan setTimeout manual)
1. `src/modules/afiliado/infrastructure/firebird/FirebirdMovimientoService.ts`
   - DP_EDITA_PERSONAL
   - DP_EDITA_ENTIDAD
   - Tiene timeouts manuales de 30s y 60s

### Media prioridad (usan db.query vía executeSerializedQuery)
2. `src/modules/afiliado/afiliado.repo.ts`
   - AP_P_APLICAR (executable)
   - AP_D_ENVIO_LAYOUT (executable, actualmente usa CALL)
   - AP_G_APLICADO_TIPO (selectable)

3. `src/modules/afectacionOrg/afectacionOrg.service.ts`
   - AP_G_APLICADO_TIPO (selectable)

4. `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts`
   - AP_G_APLICADO_TIPO (selectable)

### Baja prioridad (ya usan executeSafeQuery correctamente)
5. Repositorios de reportes y fondos:
   - `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts`
   - `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts`
   - `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts`
   - `src/modules/reportes/afiliados/infrastructure/persistence/AfiliadosReportesRepository.ts`
   - `src/modules/CAIR/infrastructure/persistence/CAIRRepository.ts`
   - `src/modules/reportes/CAIR/infrastructure/persistence/CAIRRepository.ts`

---

## Helpers a Crear en `src/db/firebird.ts`

```typescript
// Para SPs que retornan filas (SELECT ... FROM SP(...))
executeSelectableProcedure(name, params?, options?: { timeoutMs?, alias?, columns? })

// Para SPs que ejecutan acción (EXECUTE PROCEDURE SP(...))
executeExecutableProcedure(name, params?, options?: { timeoutMs? })
```

## Constantes de Timeout (ya existentes)
```typescript
FIREBIRD_TIMEOUTS = {
  DEFAULT: 30000,      // 30s
  HEAVY_SP: 60000,     // 60s
  BATCH_OPERATION: 120000  // 120s
}
```
