# Seguimiento: despliegue Calidad y continuidad del plan en Desarrollo

## Estado al 02/09/2026

| Ambiente | Estado |
|---|---|
| Producción SQL `SII-ISSSSPEA-PROD` | Migraciones 09–17 aplicadas (fase 14). Q16 legible. Sin paquete de aplicación nuevo. |
| Calidad SQL `SII-ISSSSPEA` | Migraciones 09–23 aplicadas. Respaldo previo: `script-calidad-02-09-26.sql` (SHA-256 `1A0CA4E4...C7AC`). |
| Calidad API `bicsn-des-api` | Desplegada con `subir.bat calidad`, artefacto `BICSN-calidad-20260903T042915Z.tar.gz`, `sourceCommit=3d171dc`, `/health` 200. |
| Firebird | Calidad `dbQna1426.fdb` y Producción `dbQna1326.fdb` sin modificaciones estructurales. |
| Desarrollo | Código local en HEAD `mtwo`; servidor local aún en versión anterior al commit `3d171dc`. |

## Pendientes en Calidad (validación funcional)

1. **E2E con TXT**: subir un TXT Layout 20 (nueva quincena u orgánica de prueba) y verificar:
   - `NominaAplicacionQnalSincronizacion` termina en `TERMINADO/COMMIT_CONFIRMADO` con `ConteoFirebirdP` y `ConteoResumen=1`.
   - `AP_D_ORIGEN_TODOS` con todas las filas `STATUS='P'`, `AP_D_ORIGEN_RESUMEN` con un resumen `AN` y `FMOV_ALT` correcto.
   - La aplicación QNA posterior ejecuta `AP_DN_APLICAR` (paso `aplicarDn` en respuesta y bitácora).
2. **E2E sin TXT**: aplicar una QNA sin carga nominal enlazada y verificar ruta `AP_P_APLICAR C/F` (pasos `aplicarC`/`aplicarF`).
3. **Recarga de TXT**: confirmar que el borrado+recarga funciona; si falla con permiso, aplicar el pendiente de Firebird (abajo).
4. **Revisa-movimientos**: al finalizar aplicación de movimientos en lote, verificar generación de conceptos 1/3/4/5 en SQL y que el catálogo 13 consolida LFA/LFM/LFP.

## Pendientes operativos de Firebird

- **Permiso `DELETE`** sobre `AP_D_ORIGEN_TODOS` y `AP_D_ORIGEN_RESUMEN` para el usuario de Calidad y Producción (`DES`): sin él, la recarga de TXT falla atómicamente con `NOMINA_FIREBIRD_RECARGA_FALLIDA`. Plan de referencia: `docs/firebird/PLAN_USUARIO_FIREBIRD_POR_ORGANICA.md`.

## Pendientes para retomar el plan en Desarrollo

1. Actualizar el servidor local de Desarrollo al commit `3d171dc` (paquete actual o `git pull` + `npm run dev`).
2. Re-ejecutar batería de integración en Desarrollo:
   - `npm run test:nomina:txt-sync-migration:desarrollo`
   - `npm run test:nomina:sql-sync:desarrollo`
   - `npm run test:nomina:firebird-sync:desarrollo`
   - `npm run test:qna:phase11:desarrollo` y `npm run test:qna:phase13:desarrollo`
   - `npm run verify:revision:movimientos:desarrollo` (migraciones 18/19 ya aplicadas vía rollback-test)
3. Cargar un TXT sintético en Desarrollo para validar el flujo completo staging→Firebird con las columnas nuevas (`AyudasMensuales`, `QuinqueniosMensual`).
4. Cerrar el pendiente D5 de `SEGUIMIENTO_SINCRONIZACION_TXT_FIREBIRD.md` (selección DN/C-F) con la evidencia del E2E de Calidad.

## Producción (después de Calidad validada)

- Respaldo lógico nuevo previo.
- Ejecutor de 18–23 para Producción (equivalente a `migrate-calidad-18-23.ts` con confirmación `--confirm-production=SII-ISSSSPEA-PROD`).
- Despliegue con `subir.bat produccion CONFIRMAR-SII-ISSSSPEA-PROD` (incluye preflight y paquete propio).
- E2E reducido: lectura históricos Q16 y un ciclo QNA.
