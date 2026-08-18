# Flujo transaccional de aplicacion QNA

## Objetivo

Evitar aplicaciones parciales en Firebird cuando falla alguno de los procedimientos de la QNA, conservar en SQL Server la carga reemplazable y mantener trazabilidad en SFTP.

## Orden del proceso

1. La carga validada se guarda en los historicos de SQL Server.
2. Una carga posterior de la misma organica y QNA reemplaza esos datos mediante el flujo existente.
3. `POST /v1/afiliado/aplicar-bdisssspea-qna` resuelve la QNA y valida que la aplicacion de movimientos este finalizada.
4. El backend inicia una unica transaccion Firebird.
5. Dentro de esa transaccion ejecuta, en orden:
   - `AP_P_APLICAR(..., 'C')`.
   - `AP_P_APLICAR(..., 'F')`.
   - `EBI2_RECIBOS_AP(..., 'APLICAR')` cuando la QNA es par.
6. Firebird confirma la transaccion solo cuando todos los procedimientos aplicables terminan correctamente.
7. Despues del `COMMIT` Firebird, el backend genera o reutiliza la Linea de Pago con el importe calculado desde los historicos SQL.
8. Solo cuando existe la Linea de Pago actualiza exactamente el `AfectacionId` validado a `TERMINADO`.
9. Consulta la QNA vigente de Firebird y registra la siguiente QNA de forma idempotente.
10. El resultado se guarda en SFTP.

Los eventos `BA_MOVIMIENTO` no forman parte de este proceso. Aplicar QNA no los crea, recupera ni modifica.

## Comportamiento ante error Firebird

Si falla C, F o EBI:

- Firebird ejecuta `ROLLBACK` de la transaccion completa.
- Los historicos previamente guardados en SQL Server permanecen disponibles y son reemplazables en la siguiente carga.
- `afec.BitacoraAfectacionOrg` permanece en `APLICAR`.
- No se genera la Linea de Pago.
- Se guarda un JSON SFTP con resultado `ERROR`, transaccion `ROLLBACK`, paso fallido, error, organica, QNA y usuario.

## Comportamiento exitoso

Si todos los procedimientos Firebird terminan correctamente:

- Firebird ejecuta `COMMIT`.
- El backend genera o reutiliza la Linea de Pago.
- La bitacora exacta de la QNA cambia de `APLICAR` a `TERMINADO` solamente despues de crear la linea.
- Se registra la siguiente QNA cuando Firebird ya la expone.
- Se guarda un JSON SFTP con la transaccion `COMMIT` y el resultado del proceso.

## Respuesta y trazabilidad

La respuesta del endpoint y el archivo SFTP incluyen:

```json
{
  "firebirdTransaction": "COMMIT | ROLLBACK | NO_INICIADA",
  "pasoFallido": "AP_P_APLICAR_C | AP_P_APLICAR_F | EBI2_RECIBOS_AP | null"
}
```

Los archivos se almacenan en:

```text
{FTP_BASE_PATH}/APLIQNA/{QQAA}/APLIQNA_{ORG0}{ORG1}_{QQAA}_{FECHA}_{RESULTADO}.json
```

## Limites transaccionales

- La atomicidad cubre los tres procedimientos ejecutados en la misma base Firebird.
- SQL Server y SFTP no participan en la transaccion Firebird.
- Los historicos SQL se conservan deliberadamente cuando Firebird falla.
- La bitacora se actualiza solo despues del `COMMIT` Firebird y de generar o reutilizar la Linea de Pago.
- `BA_MOVIMIENTO` queda fuera de la transaccion y no depende del resultado de Aplicar QNA.
- Si falla la Linea de Pago o la actualizacion de bitacora despues del `COMMIT`, no se reejecutan C, F ni EBI; se usa la recuperacion manual de Linea de Pago correspondiente.

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

La Linea de Pago se genera automaticamente despues del `COMMIT` Firebird y requiere:

- Historicos SQL Server con registros e importe mayor que cero.
- Evento calendario `PAGO` disponible para determinar la vigencia.

Una QNA con `ROLLBACK` Firebird no debe generar Linea de Pago.

Si Firebird confirma pero falla la Linea de Pago:

- La bitacora conserva `Accion = 'APLICAR'`.
- `Resultado` cambia a `PENDIENTE`; el mensaje especifica que falta la Linea de Pago.
- No se ejecutan nuevamente C, F ni EBI.
- SFTP registra resultado `PARCIAL` y el error de la linea.
- El frontend oculta `Aplicar Quincena` y muestra `Generar Linea de Pago pendiente`.
- El boton manual calcula el importe desde historicos, crea o reutiliza la linea y despues cambia la bitacora a `TERMINADO`.

Si la Linea de Pago se crea pero falla el cambio de bitacora, tambien se registra `Resultado = PENDIENTE`. En ese caso el boton manual reutiliza la linea existente y completa unicamente la transicion a `TERMINADO`.

Cuando la linea ya existe, el frontend muestra solamente `Ver Linea de Pago`.

## Creacion de la siguiente QNA

- El inicio de sesion no crea ni sincroniza QNAs.
- Una nueva QNA se registra solo despues de que la anterior tenga Linea de Pago y este `TERMINADO`.
- `/afectacion-org/register` y `/aplicaciones-qna/sincronizar-periodo-trabajo` rechazan la creacion si la QNA anterior sigue abierta o no tiene linea.
- La aplicacion exitosa y la recuperacion manual consultan `AP_G_APLICADO_TIPO` despues de finalizar la QNA y crean el siguiente periodo si Firebird ya lo expone.

## Comportamiento del frontend Entidad

- Una aplicacion exitosa abre directamente el modal de Linea de Pago.
- No recarga la pagina ni muestra un modal intermedio de resultado.
- El modal permite consultar, copiar y descargar la linea.
- Al cerrar el modal se redirige a `/dependencia`.

## Seleccion del periodo visible

`obtenerPeriodoTrabajo` prioriza una QNA cuya aplicacion de movimientos este finalizada y que aun no tenga registro en `pagos.LineaCapturaPeriodo`. Esto evita mostrar la siguiente QNA antes de completar la aplicacion Firebird y generar la Linea de Pago pendiente.

La existencia de cualquier Linea de Pago del periodo libera el avance, incluso si posteriormente vence. Si no hay una QNA pendiente de linea, se usa la QNA operativa mas reciente en `APLICAR` o `TERMINADO`.
