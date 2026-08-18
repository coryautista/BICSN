# Inventario de Endpoints Firebird

> Generado: Enero 2026  
> Propósito: Documentar todos los endpoints que consumen Firebird, sus parámetros sensibles y requisitos de normalización/timeout.

## Resumen de Archivos que Usan Firebird

### Repositorios/Servicios Firebird
| Archivo | Funciones Firebird |
|---------|-------------------|
| `src/modules/orgPersonal/orgPersonal.repo.ts` | CRUD ORG_PERSONAL |
| `src/modules/personal/personal.repo.ts` | CRUD PERSONAL |
| `src/modules/organica0/organica0.repo.ts` | CRUD ORGANICA_0 |
| `src/modules/organica1/organica1.repo.ts` | CRUD ORGANICA_1 |
| `src/modules/organica2/organica2.repo.ts` | CRUD ORGANICA_2 |
| `src/modules/organica3/organica3.repo.ts` | CRUD ORGANICA_3 |
| `src/modules/organica0/infrastructure/persistence/Organica0Repository.ts` | Queries ORGANICA_0 |
| `src/modules/organica1/infrastructure/persistence/Organica1Repository.ts` | Queries ORGANICA_1 |
| `src/modules/organica2/infrastructure/persistence/Organica2Repository.ts` | Queries ORGANICA_2 |
| `src/modules/organica3/infrastructure/persistence/Organica3Repository.ts` | Queries ORGANICA_3 |
| `src/modules/organicaCascade/organicaCascade.repo.ts` | Consultas cascada |
| `src/modules/organicaCascade/infrastructure/persistence/OrganicaCascadeRepository.ts` | Consultas cascada |
| `src/modules/afiliadosPersonal/afiliadosPersonal.repo.ts` | Plantilla/Histórico |
| `src/modules/afiliadosPersonal/infrastructure/persistence/AfiliadoPersonalRepository.ts` | Plantilla/Histórico |
| `src/modules/retencionesPorCobrar/infrastructure/persistence/RetencionesPorCobrarRepository.ts` | ORGANICAS_INT_MORATORIO_GEN |
| `src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts` | Resúmenes QNA |
| `src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts` | SPs fondos/préstamos |
| `src/modules/CAIR/infrastructure/persistence/CAIRRepository.ts` | SAR_DEVOLUCION, etc. |
| `src/modules/reportes/infrastructure/persistence/ReportsRepository.ts` | Reportes generales |
| `src/modules/reportes/aplicacionesQNA/infrastructure/persistence/AplicacionesQNARepository.ts` | SPs aplicaciones QNA |
| `src/modules/reportes/afiliados/infrastructure/persistence/AfiliadosReportesRepository.ts` | HISTORIAL_MOVIMIENTOS_* |
| `src/modules/reportes/CAIR/infrastructure/persistence/CAIRRepository.ts` | SAR_TOTAL_A_ORG, etc. |
| `src/modules/afiliado/afiliado.repo.ts` | Validaciones/búsquedas |
| `src/modules/afiliado/afiliado.service.ts` | validateInternoInFirebird |
| `src/modules/afiliado/infrastructure/firebird/FirebirdMovimientoService.ts` | DP_EDITA_PERSONAL, DP_EDITA_ENTIDAD |
| `src/modules/afiliado/application/commands/CreateCompleteAfiliadoCommand.ts` | Creación completa afiliado |
| `src/modules/afiliado/application/queries/ValidateInternoInFirebirdQuery.ts` | Validar INTERNO |
| `src/modules/afectacionOrg/afectacionOrg.service.ts` | Afectación orgánica |

---

## Endpoints por Módulo

### 1. Orgánica 0 (`/v1/organica0`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/organica0` | - | No | No |
| GET | `/organica0/:claveOrganica` | claveOrganica (1-2 chars) | **Sí** | No |
| POST | `/organica0` | body.claveOrganica | **Sí** | No |
| PUT | `/organica0/:claveOrganica` | claveOrganica | **Sí** | No |
| DELETE | `/organica0/:claveOrganica` | claveOrganica | **Sí** | No |

### 2. Orgánica 1 (`/v1/organica1`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/organica1?org0=` | org0 (query) | **Sí** | No |
| GET | `/organica1/:claveOrganica0/:claveOrganica1` | org0, org1 | **Sí** | No |
| POST | `/organica1` | body.claveOrganica0, claveOrganica1 | **Sí** | No |
| PUT | `/organica1/:claveOrganica0/:claveOrganica1` | org0, org1 | **Sí** | No |
| DELETE | `/organica1/:claveOrganica0/:claveOrganica1` | org0, org1 | **Sí** | No |
| POST | `/organica1/query` | body filters | **Sí** | No |

### 3. Orgánica 2 (`/v1/organica2`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/organica2/my` | token.idOrganica0/1 + query.org0/1 | **Sí** | No |
| GET | `/organica2?org0=&org1=` | org0, org1 | **Sí** | No |
| GET | `/organica2/:org0/:org1/:org2` | org0, org1, org2 | **Sí** | No |
| POST | `/organica2` | body.claveOrganica0/1/2 | **Sí** | No |
| PUT | `/organica2/:org0/:org1/:org2` | org0, org1, org2 | **Sí** | No |
| DELETE | `/organica2/:org0/:org1/:org2` | org0, org1, org2 | **Sí** | No |
| POST | `/organica2/query` | body filters | **Sí** | No |

### 4. Orgánica 3 (`/v1/organica3`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/organica3?org0=&org1=&org2=` | org0, org1, org2 | **Sí** | No |
| GET | `/organica3/:org0/:org1/:org2/:org3` | org0-3 | **Sí** | No |
| GET | `/organica3/my/:claveOrganica2` | token + org2 | **Sí** | No |
| POST | `/organica3` | body.claveOrganica0-3 | **Sí** | No |
| PUT | `/organica3/:org0/:org1/:org2/:org3` | org0-3 | **Sí** | No |
| DELETE | `/organica3/:org0/:org1/:org2/:org3` | org0-3 | **Sí** | No |
| POST | `/organica3/query` | body filters | **Sí** | No |

### 5. Orgánica Cascade (`/v1/organica-cascade`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/organica-cascade/org1?claveOrganica0=` | claveOrganica0 | **Sí** | No |
| GET | `/organica-cascade/org2?claveOrganica0=&claveOrganica1=` | org0, org1 | **Sí** | No |
| GET | `/organica-cascade/org3?claveOrganica0=&claveOrganica1=&claveOrganica2=` | org0-2 | **Sí** | No |

### 6. Personal (`/v1/personal`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/personal` | - | No | No |
| GET | `/personal/:interno` | interno (number) | No | No |
| POST | `/personal` | body datos | No | No |
| PUT | `/personal/:interno` | interno | No | No |
| DELETE | `/personal/:interno` | interno | No | No |

### 7. OrgPersonal (`/v1/orgPersonal`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/orgPersonal` | - | No | No |
| GET | `/orgPersonal/search/by-nombre-apellidos-fecha` | nombre, apellidos, fechaNacimiento | No | No |
| GET | `/orgPersonal/search/:searchTerm` | CURP/RFC/nombre | No | No |
| GET | `/orgPersonal/:interno` | interno | No | No |
| POST | `/orgPersonal` | body con clave_organica_0-3 | **Sí** | No |
| PUT | `/orgPersonal/:interno` | interno + body | **Sí** (body) | No |
| DELETE | `/orgPersonal/:interno` | interno | No | No |

### 8. Afiliados Personal (`/v1/`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/obtenerPlantilla` | token.idOrganica0/1 | **Sí** (ya lo hace) | No |
| GET | `/busquedaHistorico?search=` | search term | No | No |

### 9. Retenciones por Cobrar (`/v1/retenciones-por-cobrar`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/Consulta_Int_Moratorio?org0=&org1=&QNA=` | org0, org1, QNA | **Sí** (ya lo hace) | No |
| POST | `/Crear_Int_Moratorio` | body.org0-3, periodo | **Sí** | No |

### 10. Aplicación Quincenal (`/v1/aplicacion-quincenal`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/AportacionQuincenalResumen?org0=&org1=&PERIODO=` | org0, org1, PERIODO | **Sí** (parcial) | Posible |
| GET | `/ResumenOrgQnaAll?org0=&org1=&PERIODO=` | org0, org1, PERIODO | **Sí** (parcial) | Posible |
| POST | `/guardar-historico-aportaciones` | body array | **Sí** | Posible (lote) |
| POST | `/guardar-historico-retenciones` | body array | **Sí** | Posible (lote) |
| POST | `/guardar-historico-aportaciones-desde-bd` | org0, org1, periodo | **Sí** | **Sí** (SP pesado) |
| POST | `/guardar-historico-retenciones-desde-bd` | org0, org1, periodo | **Sí** | **Sí** (SP pesado) |

### 11. Aportaciones Fondos (`/v1/aportacionesFondos`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/individuales/:tipo` | token.idOrganica0/1 + query | **NO APLICA** (falta padding) | No |
| GET | `/completas` | token.idOrganica0/1 + query | **NO APLICA** (falta padding) | No |
| GET | `/individuales/prestamos-corto-plazo` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP) |
| GET | `/individuales/prestamos-mediano-plazo` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP) |
| GET | `/individuales/prestamos-hipotecarios` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP HIP) |
| GET | `/aportacion-guarderias` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP) |
| GET | `/pension-nomina-transitorio` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP) |
| GET | `/individuales/aguinaldo` | token.idOrganica0/1 | **NO APLICA** | **Sí** (SP) |

### 12. CAIR (`/v1/cair`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/tipos-devolucion` | - | No | No |
| GET | `/leyendas-cheques` | - | No | No |
| GET | `/sar-devolucion?interno=&tipo=` | interno, tipo | No | No |

### 13. Afiliado - Firebird (`/v1/afiliado`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| POST | `/preview-dp-edita-entidad-lote` | body afiliados | **Sí** (via AfiliadoOrg) | **Sí** (lote) |
| POST | `/complete` | body completo | **Sí** (org0-3) | **Sí** (DP_EDITA) |
| POST | `/cambio-sueldo` | body movimiento | **Sí** | **Sí** (DP_EDITA) |
| POST | `/baja-permanente` | body movimiento | **Sí** | **Sí** (DP_EDITA) |
| POST | `/baja-suspension` | body movimiento | **Sí** | **Sí** (DP_EDITA) |
| POST | `/baja-termina-suspension` | body movimiento | **Sí** | **Sí** (DP_EDITA) |
| POST | `/baja-termina-suspension-y-baja` | body movimiento | **Sí** | **Sí** (DP_EDITA) |
| GET | `/obtener-movimientos-quincenales` | token org0/1 | **Sí** | No |
| POST | `/aplicar-bdisssspea-lote` | body array | **Sí** | **Sí** (lote DP_EDITA) |
| POST | `/aplicar-bdisssspea-qna` | org0/1, periodo | **Sí** | **Sí** (lote DP_EDITA) |

### 14. Reportes - Aplicaciones QNA (`/v1/reportes/aplicaciones-qna` y `/v1/aplicaciones-qna`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/movimientos?periodo=&pOrg0=&pOrg1=` | pOrg0, pOrg1, periodo | **Sí** | **Sí** (SP) |
| GET | `/aportaciones?pOrg0=&pOrg1=&periodo=` | pOrg0, pOrg1, periodo | **NO APLICA** (falta) | **Sí** (SP) |
| GET | `/pcp?pOrg0=&pOrg1=&periodo=` | pOrg0, pOrg1, periodo | **Sí** | **Sí** (SP) |
| GET | `/pmp?pOrg0=&pOrg1=&periodo=` | pOrg0, pOrg1, periodo | **Sí** | **Sí** (SP) |
| GET | `/hip?pOrg0=&pOrg1=&periodo=` | pOrg0, pOrg1, periodo | **Sí** | **Sí** (SP pesado) |
| GET | `/concentrado?pOrg0=&pOrg1=&periodo=` | pOrg0, pOrg1, periodo | **Sí** | **Sí** (SP pesado) |
| GET | `/periodo-trabajo` | - | No | No |
| POST | `/linea-captura` | body.idOrg0/1 o token | **Sí** (ya lo hace) | No (no usa Firebird) |

### 15. Reportes - CAIR (`/v1/reportes/cair`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/estado-cuenta?quincena=` | quincena | No | **Sí** (SP) |
| GET | `/entregado?fi=&ff=&tipo=` | fi, ff, tipo | No | **Sí** (SP) |

### 16. Reportes - Afiliados (`/v1/reportes/afiliados`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/historial-movimientos-quin?periodo=` | periodo | No | **Sí** (SP) |
| GET | `/historial-mov-promedio-sdo?periodo=&pOrg0=&pOrg1=&pOrg2=&pOrg3=` | pOrg0-3, periodo | **Sí** | **Sí** (SP) |

### 17. Reportes - General (`/v1/reportes`)
| Método | Ruta | Parámetros Org | Requiere Padding | Timeout Especial |
|--------|------|----------------|------------------|------------------|
| GET | `/mensual` | filters query | Variable | **Sí** (reporte) |
| GET | `/movimientos` | filters query | Variable | **Sí** (reporte) |

---

## Configuración de Timeouts

### Timeout configurable (implementado)

El timeout por defecto es configurable via variable de entorno:

```bash
FIREBIRD_TIMEOUT_MS=30000   # Default: 30 segundos
```

### Constantes exportadas en `src/db/firebird.ts`

```typescript
import { FIREBIRD_TIMEOUTS, executeSafeQuery } from '../../db/firebird.js';

// Para operaciones normales (30s default)
await executeSafeQuery(sql, params);

// Para SPs pesados (60s)
await executeSafeQuery(sql, params, FIREBIRD_TIMEOUTS.HEAVY_SP);

// Para operaciones en lote o reportes grandes (120s)
await executeSafeQuery(sql, params, FIREBIRD_TIMEOUTS.BATCH_OPERATION);
```

### Operaciones que requieren timeout extendido

| Operación | Timeout Recomendado | Constante |
|-----------|---------------------|-----------|
| DP_EDITA_PERSONAL | 60s | HEAVY_SP |
| DP_EDITA_ENTIDAD | 60s | HEAVY_SP |
| Préstamos HIP | 120s | BATCH_OPERATION |
| Concentrado | 120s | BATCH_OPERATION |
| aplicar-bdisssspea-lote | 120s | BATCH_OPERATION |
| aplicar-bdisssspea-qna | 120s | BATCH_OPERATION |
| guardar-historico-*-desde-bd | 120s | BATCH_OPERATION |

---

## Resumen de Problemas (Estado Actual)

### ✅ RESUELTO: Endpoints SIN Padding de Claves Orgánicas
Los siguientes archivos ahora usan `normalizeClaveOrganica()`:
- `src/modules/aportacionesFondos/aportacionesFondos.routes.ts`
- `src/modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.ts`
- `src/modules/aplicacionQuincenal/aplicacionQuincenal.routes.ts`
- `src/modules/afectacionOrg/afectacionOrg.routes.ts`
- `src/modules/reportes/aplicacionesQNA/lineaCaptura.routes.ts`
- `src/modules/afiliadosPersonal/afiliadosPersonal.routes.ts`

### ✅ RESUELTO: Timeout configurable
- `FIREBIRD_TIMEOUT_MS` env var para timeout default
- `executeSafeQuery(sql, params, timeoutMs?)` acepta timeout custom
- Constantes `FIREBIRD_TIMEOUTS` exportadas para uso en servicios

### ✅ RESUELTO: `decodeFirebirdObject` Redundante
Eliminadas las llamadas redundantes de:
- `src/modules/orgPersonal/orgPersonal.repo.ts`
- `src/modules/personal/personal.repo.ts`
- `src/modules/afiliado/infrastructure/firebird/FirebirdMovimientoService.ts`

### ✅ RESUELTO: Tags Swagger 'firebird'
Se agregó el tag `firebird` a los siguientes archivos de rutas:
- `src/modules/afectacionOrg/afectacionOrg.routes.ts` (+ body schema completo)
- `src/modules/aportacionesFondos/aportacionesFondos.routes.ts`
- `src/modules/orgPersonal/orgPersonal.routes.ts`
- `src/modules/personal/personal.routes.ts`
- `src/modules/organicaCascade/organicaCascade.routes.ts`
- `src/modules/afiliado/afiliado.routes.ts`
- `src/modules/reportes/aplicacionesQNA/aplicacionesQNA.routes.ts`
- `src/modules/reportes/afiliados/afiliados.routes.ts`

---

## Resumen de Cambios Implementados

1. ✅ **Inventario Firebird**: Documento completo generado en `docs/INVENTARIO_FIREBIRD.md`
2. ✅ **Normalización de claves orgánicas**: `normalizeClaveOrganica()` centralizada en `src/utils/organica.ts`, usada en todas las rutas
3. ✅ **Timeouts configurables**: `FIREBIRD_TIMEOUT_MS` env var + `executeSafeQuery(sql, params, timeoutMs?)` + constantes `FIREBIRD_TIMEOUTS`
4. ✅ **Limpieza de decode**: Eliminadas llamadas redundantes a `decodeFirebirdObject` (ya se decodifica en `executeSafeQuery`)
5. ✅ **Swagger/Tags**: Tag 'firebird' agregado a todas las rutas que usan Firebird + body schema completo en afectacionOrg
