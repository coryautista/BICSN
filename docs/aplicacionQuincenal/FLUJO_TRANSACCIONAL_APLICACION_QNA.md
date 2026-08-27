# Flujo transaccional de aplicacion QNA

## Objetivo

Evitar aplicaciones parciales en Firebird cuando falla alguno de los procedimientos de la QNA, conservar en SQL Server la carga reemplazable y mantener trazabilidad en SFTP.

## Orden del proceso

1. `POST /v1/liquidaciones-qna/orquestar` captura una vez los diez dominios y persiste Snapshot V2 y Snapshot QNA V5.
2. La promocion selecciona el Snapshot oficial, proyecta Retenciones V3 y ejecuta dual-write legacy dentro de la transaccion SQL Server.
3. La conciliacion exacta devuelve `COMPLETE`, `WARNING` o `ERROR`; un `WARNING` legacy no bloquea que V5 sea oficial.
4. `POST /v1/afiliado/aplicar-bdisssspea-qna` resuelve el scope completo desde el token, revalida el Snapshot oficial y selecciona una unica bitacora exacta dentro de la transaccion SQL Server serializable.
5. SQL Server crea un intento durable, vincula el `AfectacionId` y adquiere un claim Firebird con lease renovable.
6. El backend inicia una unica transaccion Firebird.
7. Dentro de esa transaccion ejecuta, en orden:
   - `AP_P_APLICAR(..., 'C')`.
   - `AP_P_APLICAR(..., 'F')`.
   - `EBI2_RECIBOS_AP(..., 'APLICAR')` cuando la QNA es par.
8. El resultado se clasifica como commit confirmado, rollback confirmado, incierto o no iniciado y se persiste antes de continuar.
9. Despues del `COMMIT` Firebird, el backend genera o reutiliza la Linea de Pago con el importe oficial de `QnaSnapshotTotal` y registra `LINEA_CONFIRMADA`.
10. Programa o reutiliza REVISA y registra `REVISA_PROGRAMADA`.
11. Actualiza exclusivamente el `AfectacionId` ligado al intento y registra `TERMINADO`.
12. El resultado se intenta guardar en SFTP sin alterar el resultado financiero si SFTP falla.

Los eventos `BA_MOVIMIENTO` no forman parte de este proceso. Aplicar QNA no los crea, recupera ni modifica.

## Comportamiento ante error Firebird

Si falla C, F o EBI y el rollback puede confirmarse:

- Firebird ejecuta `ROLLBACK` de la transaccion completa.
- Los historicos previamente guardados en SQL Server permanecen disponibles.
- `afec.BitacoraAfectacionOrg` permanece en `APLICAR`.
- No se genera la Linea de Pago.
- El intento queda `FIREBIRD_REVERTIDO` y puede crear un nuevo intento idempotente.

Si el handle deja de ser valido o el rollback no puede confirmarse, el resultado es `APLICACION_INCIERTA` y aplica la resolucion administrativa descrita abajo.

## Comportamiento exitoso

Si todos los procedimientos Firebird terminan correctamente:

- Firebird ejecuta `COMMIT`.
- El backend genera o reutiliza la Linea de Pago.
- La bitacora exacta de la QNA cambia de `APLICAR` a `TERMINADO` solamente despues de crear la linea.
- Linea, REVISA y bitacora avanzan por estados separados y recuperables.
- El JSON SFTP es best effort y no constituye evidencia autoritativa.

## Resultado incierto

Un error de commit o rollback que no permita confirmar el resultado registra `APLICACION_INCIERTA`. El backend no consulta marcadores ni administra Firebird para resolverlo y nunca reejecuta automaticamente C, F o EBI.

La resolucion requiere un administrador y el endpoint:

```http
POST /v1/liquidaciones-qna/:id/resolver-aplicacion-incierta
```

La solicitud identifica el `intentoUuid`, scope completo, resolucion, motivo y evidencia. `CONFIRMADA` reanuda la recuperacion SQL; `REVERTIDA` habilita un nuevo intento Firebird. Un claim activo impide resolver mientras una ejecucion sigue viva.

## Respuesta y trazabilidad

La respuesta exitosa del endpoint y el archivo SFTP terminal incluyen:

```json
{
  "firebirdTransaction": "COMMIT | ROLLBACK | INCIERTA | NO_INICIADA",
  "pasoFallido": "AP_P_APLICAR_C | AP_P_APLICAR_F | EBI2_RECIBOS_AP | null"
}
```

Los archivos se almacenan en:

```text
{FTP_BASE_PATH}/APLIQNA/{QQAA}/APLIQNA_{ORG0}{ORG1}_{QQAA}_{FECHA}_{RESULTADO}.json
```

Un rollback, resultado incierto o conflicto se devuelve mediante el envelope HTTP de error con codigo estable. El ledger SQL Server es la evidencia autoritativa del intento; SFTP es best effort y no se exige para registrar fallos.

## Limites transaccionales

- La atomicidad cubre los tres procedimientos ejecutados en la misma base Firebird.
- SQL Server y SFTP no participan en la transaccion Firebird.
- SQL Server conserva ledger, eventos y resoluciones; no intenta una transaccion distribuida.
- Los historicos SQL se conservan deliberadamente cuando Firebird falla.
- El dual-write y su conciliacion se conservan cuando Firebird falla; la aplicacion no se expone como terminada.
- La bitacora se actualiza solo despues del `COMMIT` Firebird y de generar o reutilizar la Linea de Pago.
- `BA_MOVIMIENTO` queda fuera de la transaccion y no depende del resultado de Aplicar QNA.
- Si falla Linea, REVISA o bitacora despues del `COMMIT`, no se reejecutan C, F ni EBI; la misma aplicacion reanuda desde el estado persistido.

## Creacion manual de BA_MOVIMIENTO

El frontend es responsable de solicitar cada evento `BA_MOVIMIENTO` mediante:

```http
POST /v1/eventos-calendario
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "fecha": "2026-08-12",
  "tipo": "BA_MOVIMIENTO",
  "anio": 2026
}
```

La creacion requiere autenticacion y uno de los roles autorizados por el endpoint. El backend valida fecha, coincidencia del anio, tipo y duplicados. No requiere organica ni una Aplicacion QNA finalizada.

El endpoint `POST /v1/afiliado/recuperar-ba-movimiento` esta deshabilitado y no debe utilizarse como mecanismo alternativo. Los eventos automaticos existentes se conservan como datos historicos y mantienen sus relaciones con eventos `HIPOTECARIO`.

## Regla para Linea de Pago

La Linea de Pago se genera o reutiliza automaticamente despues del `COMMIT` Firebird y requiere:

- `QnaSnapshotTotal.TotalGeneralA2` valido en el snapshot oficial.
- Evento calendario `PAGO` disponible para determinar la vigencia.

Una QNA con `ROLLBACK` Firebird no debe generar Linea de Pago.

Si Firebird confirma pero falla la Linea de Pago:

- La bitacora conserva `Accion = 'APLICAR'`.
- No se ejecutan nuevamente C, F ni EBI.
- El proceso conserva `FIREBIRD_CONFIRMADO` y un nuevo llamado reintenta Linea desde el snapshot.

Si la Linea se crea pero falla REVISA o la bitacora, se conserva `LINEA_CONFIRMADA` o `REVISA_PROGRAMADA`. Un reintento reutiliza los efectos existentes y completa solo los pasos pendientes.

`POST /v1/linea-captura-periodo` delega las solicitudes con snapshot al mismo comando de saga y exige scope completo. No inserta transiciones por fuera del ledger ni consulta Firebird. Si el proceso ya esta `TERMINADO`, solo recupera la Linea existente; su ausencia es un error de integridad.

Cuando la linea ya existe, el frontend muestra solamente `Ver Linea de Pago`.

## Creacion de la siguiente QNA

- El inicio de sesion no crea ni sincroniza QNAs.
- Una nueva QNA se registra solo despues de que la anterior tenga Linea de Pago y este `TERMINADO`.
- `/afectacion-org/register` y `/aplicaciones-qna/sincronizar-periodo-trabajo` rechazan la creacion si la QNA anterior sigue abierta o no tiene linea.
- La saga de aplicacion no consulta `AP_G_APLICADO_TIPO` despues de `TERMINADO` ni crea el siguiente periodo. Esa operacion queda fuera de este flujo.

## Comportamiento del frontend Entidad

- Una aplicacion exitosa abre directamente el modal de Linea de Pago.
- No recarga la pagina ni muestra un modal intermedio de resultado.
- El modal permite consultar, copiar y descargar la linea.
- Al cerrar el modal se redirige a `/dependencia`.

## Seleccion del periodo visible

`obtenerPeriodoTrabajo` prioriza una QNA cuya aplicacion de movimientos este finalizada y que aun no tenga registro en `pagos.LineaCapturaPeriodo`. Esto evita mostrar la siguiente QNA antes de completar la aplicacion Firebird y generar la Linea de Pago pendiente.

La existencia de cualquier Linea de Pago del periodo libera el avance, incluso si posteriormente vence. Si no hay una QNA pendiente de linea, se usa la QNA operativa mas reciente en `APLICAR` o `TERMINADO`.
