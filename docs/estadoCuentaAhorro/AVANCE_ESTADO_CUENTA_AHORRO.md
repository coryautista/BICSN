# Avance - Revision del Estado de Cuenta de Ahorro

## Alcance confirmado

El backend generara un estado de cuenta consolidado por quincena, anio y organica.
No se desarrollara frontend hasta que el backend este terminado, probado y validado.

## Filtros de generacion

| Campo | Regla |
| --- | --- |
| Quincena | Se obtiene siempre de Firebird para la organica mediante `AP_G_APLICADO_TIPO`. |
| Anio | Se obtiene siempre de Firebird junto con la quincena vigente. |
| Periodo Firebird | Se deriva como `QQAA` a partir de la QNA vigente obtenida desde Firebird. |
| Org0 y Org1 | Se toman del token; un usuario autorizado puede enviarlos como parametros. |
| Org2 y Org3 | Se toman del token o del parametro; si no se proporcionan, usan `01`. |
| Fecha de corte | Se deriva de la quincena y el anio. No es un filtro manual. |

Para procedimientos que requieren fechas, se derivan desde la QNA:

| QNA | Fecha inicial | Fecha final |
| --- | --- | --- |
| Impar | Dia 1 del mes | Dia 15 del mes |
| Par | Dia 16 del mes | Ultimo dia del mes |

## Columnas del reporte

```text
Concepto | CAIR | FRA | FRE | FH | FV | FAA | FAE | FAT | FAI | Total
```

Normalizacion de fondos:

| Nombre de origen | Fondo del reporte |
| --- | --- |
| `SAR` o `SARE` | `CAIR` |
| `FHE` | `FH` |
| `FVE` | `FV` |
| `FAR` | `FAI` |

Todo fondo no reconocido debe generar una incidencia y no se debe descartar silenciosamente.

## Filas historicas del reporte

Las siguientes filas se guardaran aun cuando todos sus importes sean cero para poder reproducir el reporte historico.

| Orden | Clave | Concepto | Signo |
| ---: | --- | --- | ---: |
| 1 | `SALDO_ANTERIOR` | Saldo anterior | 0 |
| 2 | `APLICACION_QUINCENAL` | Aplicacion quincenal | 1 |
| 3 | `ALTA_REINGRESO` | Alta / reingreso | 1 |
| 4 | `BAJA` | Baja | -1 |
| 5 | `SUSPENSION_BAJA` | Suspension y baja | -1 |
| 6 | `TRASPASO_SALIDA` | Traspaso de salida | -1 |
| 7 | `TRASPASO_ENTRADA` | Traspaso de entrada | 1 |
| 8 | `APORTACION_EXTEMPORANEA` | Aportacion extemporanea | 1 |
| 9 | `DEVOLUCION_INTERESES_ACTIVOS` | Devolucion de intereses a activos | -1 |
| 10 | `DEVOLUCION_INTERESES_LICENCIAS` | Devolucion de intereses a licencias | -1 |
| 11 | `CAPITALIZACION_INTERESES_LICENCIAS` | Capitalizacion de intereses a licencias | 1 |
| 12 | `CAPITALIZACION_INTERESES_ACTIVOS` | Capitalizacion de intereses a activos | 1 |
| 13 | `TOTAL` | Total | 0 |
| 14 | `SALDO_ACTUAL` | Saldo actual | 0 |

Los conceptos `TOTAL` y `SALDO_ACTUAL` son derivados, pero se almacenan como filas para reproducir exactamente el formato del reporte.

## Procedimientos y fuentes verificadas

| Fuente | Parametros verificados | Uso previsto | Estado |
| --- | --- | --- | --- |
| `HISTORIAL_MOVIMIENTOS_QUIN` | `PERIODO` | Saldo inicial, saldo actual y movimientos generales | Verificado |
| `HISTORIAL_MOV_PROMEDIO_SDO` | `PERIODO, ORG0, ORG1, ORG2, ORG3` | Aplicaciones, percepciones y totales por fondo | Verificado |
| `ADEUDO_ORGANICA_LAYOUT` | `ORG0, ORG1, ORG2, ORG3, PERIODO` | Adeudos y concentrado | Verificado |
| `SAR_TOTAL_A_ORG` | `QUINCENA` | Totales CAIR, rendimientos, entregas y recuperados | Verificado |
| `SAR_DEVOLUCION_REPORTE` | `FI, FF, TIPO` | Devoluciones e intereses | Verificado |
| `AP_G_FONDOS_REINGRESO` | `PERIODO` | Reingresos, traspasos, fondos y PCP | Verificado |
| `PENSION_NOMINA_QNAL_TRANSITORIO` | `PERIODO` | Pensionistas transitorios y cobros | Verificado |
| `AP_G_FONDOS_ALTBAJ` | `ORG0, ORG1, PERIODO` | Altas, bajas y fondos por afiliado | Verificado |
| `afi.Formato_Extemporanea` (SQL Server) | QNA y organicas | Aportaciones extemporaneas | Verificado como tabla, no como SP Firebird |

## Backend implementado

Se implemento el modulo:

```text
src/modules/reportes/estadoCuentaAhorro/
```

Incluye contratos de dominio, repositorio Firebird/SQL Server, comando de generacion, consulta de historico, rutas Fastify, registro Awilix y exportadores backend.

### Endpoints

| Metodo | Ruta | Proposito |
| --- | --- | --- |
| `POST` | `/v1/reportes/estado-cuenta-ahorro` | Genera una nueva version historica del reporte. |
| `GET` | `/v1/reportes/estado-cuenta-ahorro/historico/:idHistorico` | Consulta una version historica sin recalcular fuentes. |
| `GET` | `/v1/reportes/estado-cuenta-ahorro/historico/:idHistorico/exportar.xlsx` | Exporta el historico a Excel. |
| `GET` | `/v1/reportes/estado-cuenta-ahorro/historico/:idHistorico/exportar.pdf` | Exporta el historico a PDF. |

Todos los endpoints requieren autenticacion y rol `admin`.

Ejemplo de generacion:

```text
POST /v1/reportes/estado-cuenta-ahorro?org0=04&org1=24
```

`org0` y `org1` se resuelven desde el token si no se envian. `org2` y `org3` se resuelven desde el token y usan `01` si no estan disponibles.

### Consolidacion actual

- `AP_RESUMEN_ORG_QNA_ALL` alimenta la fila `APLICACION_QUINCENAL` mediante los campos `SAR`, `FRA`, `FRE`, `FH`, `FV`, `FAA`, `FAE` y `FAT`.
- `afi.Formato_Extemporanea` alimenta la fila `APORTACION_EXTEMPORANEA` mediante `Cair`, `Fra`, `Fre`, `Fh`, `Fv`, `Faa` y `Fae`.
- Se consultan individualmente las otras fuentes verificadas y cualquier error se registra como incidencia controlada.
- Cada importe ya clasificado conserva procedimiento, campo y registro de origen en `reportes.EstadoCuentaAhorroHistoricoDetalle`.
- Cada generacion crea una nueva version para el mismo periodo y organica.
- Excel y PDF se generan desde el historico guardado, por lo que no vuelven a consultar Firebird ni SQL Server.

### Estado de confiabilidad actual

Mientras no se validen los catalogos de movimientos, el reporte se guarda con:

```text
Estatus: INCOMPLETO
EstadoConciliacion: NO_VERIFICABLE
```

Esto evita presentar como definitivos importes que todavia no tienen una regla de clasificacion validada.

## Pendientes de analisis para completar la consolidacion

1. Identificar los valores de `CVE_MOVIMIENTO` que separan alta, reingreso, baja y suspension/baja en `AP_G_FONDOS_ALTBAJ`.
2. Identificar los valores de `TIPO_T_R_B` que separan traspaso de salida y entrada en `AP_G_FONDOS_REINGRESO`.
3. Identificar los motivos o campos de `SAR_DEVOLUCION_REPORTE` para separar activos, licencias y capitalizaciones.
4. Definir la fuente oficial del saldo reportado por fondo y usar las fuentes restantes para conciliacion.
5. Validar en el ambiente objetivo que las cuatro tablas historicas manuales existan y coincidan con el script SQL.

## Bloqueo actual de permisos Firebird

La inspeccion local de la organica `04-24-01-01`, periodo `1426`, detecto que el rol configurado no puede ejecutar completamente las fuentes requeridas:

| Procedimiento | Error Firebird | Tabla sin permiso |
| --- | --- | --- |
| `AP_G_APLICADO_TIPO` | `no permission for SELECT access` | `FECHAS_APLICACION` |
| `AP_G_FONDOS_REINGRESO` | `no permission for SELECT access` | `FECHAS_APLICACION` |
| `AP_G_FONDOS_ALTBAJ` | `no permission for SELECT access` | `DP_ANTIGUEDAD_INICIAL` |

Mientras estos permisos no se otorguen al rol Firebird configurado por BICSN, no es posible obtener la QNA vigente desde Firebird ni validar los codigos necesarios para clasificar reingresos, altas y bajas. Las fuentes permanecen deshabilitadas en la generacion para evitar errores y tiempos de espera.

## Historico SQL Server

El historico almacenara cuatro niveles:

| Tabla | Proposito |
| --- | --- |
| `reportes.EstadoCuentaAhorroHistorico` | Cabecera, filtros, saldos, conciliacion y version. |
| `reportes.EstadoCuentaAhorroHistoricoConcepto` | Todas las filas y columnas visibles del reporte. |
| `reportes.EstadoCuentaAhorroHistoricoDetalle` | Trazabilidad por movimiento/importes de origen. |
| `reportes.EstadoCuentaAhorroHistoricoIncidencia` | Advertencias, errores controlados y duplicados. |

El script manual se encuentra en:

```text
docs/estadoCuentaAhorro/01_HISTORICO_ESTADO_CUENTA_AHORRO.sql
```

No debe ejecutarse automaticamente por el backend ni por el deploy.

## Validacion tecnica realizada

- `npm run build` finalizo correctamente despues de integrar el modulo.
- Se agregaron las dependencias `exceljs`, `pdfkit` y `@types/pdfkit` para las exportaciones backend.
- No se realizo frontend ni despliegue.

## Siguiente paso backend

Verificar las tablas SQL Server creadas manualmente y validar los codigos/motivos de Firebird pendientes. Con esos catalogos se completaran las filas pendientes, el saldo anterior, el saldo reportado y la conciliacion. No se iniciara frontend hasta recibir la instruccion `CONTINUAR CON EL FRONTEND`.
