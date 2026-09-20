# ADR: Usuarios Firebird por organica

**Estado**: Aceptado
**Fecha**: 2026-09-03

## Contexto

El backend utilizaba un solo usuario tecnico para todas las operaciones
Firebird. Por ello, las columnas de auditoria basadas en `CURRENT_USER` no
identificaban la dependencia que originaba cada operacion.

La organica se compone de `org0` y `org1`. Firebird no ofrece row-level security
nativo, por lo que esta decision busca trazabilidad y no reemplaza los filtros
de datos ni las reglas de autorizacion del API.

## Decision

Cada llamada Firebird de negocio usa una conexion asociada a su scope
`{ org0, org1 }`. Las credenciales se leen de
`config.FirebirdOrganicaCredential` en el SQL Server del mismo ambiente y el
secreto se descifra con AES-256-GCM mediante una clave maestra externa.

El scope de la conexion representa a la **organica actora**: la dependencia
autorizada que origina la operacion y que debe quedar identificada por
`CURRENT_USER`. No representa necesariamente la ubicacion fisica de los datos.
Cuando una consulta accede a datos concentrados en otra organica, ambos scopes
deben mantenerse separados:

- `credentialScope`: organica actora; selecciona la fila del catalogo y el
  attachment Firebird.
- `dataScope`: organica donde se encuentran los datos; se usa solamente en los
  parametros y filtros SQL.

Ejemplo: pensionados/transitorio solicitado por `04/24` consulta datos bajo
`04/60`, pero abre la conexion con la credencial catalogada para `04/24`. No se
debe crear una fila `04/60` para resolver esa consulta salvo que `04/60` sea por
si misma la dependencia actora de otra operacion.

La fila de una organica debe contener la cuenta Firebird propia asignada por el
DBA a esa dependencia. No es valido poblar `04/24` con el usuario tecnico de
ambiente (`DES` u otro equivalente), porque aunque la llave del catalogo sea
correcta, `CURRENT_USER` seguiria sin identificar a la entidad solicitante. Las
cuentas tecnicas de ambiente quedan limitadas a health y diagnosticos sin scope.

No existe fallback al usuario tecnico. Si falta una credencial activa, la
operacion falla con `FIREBIRD_CREDENCIAL_ORGANICA_NO_CONFIGURADA`. El usuario de
ambiente se conserva exclusivamente para health, arranque y diagnosticos
tecnicos.

El DBA administra usuarios y roles en Firebird y actualiza el catalogo SQL. El
backend solamente consulta el catalogo y mantiene una cache con TTL maximo de
cinco minutos. Un rechazo de credenciales invalida la cache y provoca una sola
relectura.

## Consecuencias

- `CURRENT_USER` identifica la organica efectiva en lecturas y escrituras.
- Los contratos de aplicacion deben propagar `org0` y `org1` hasta la capa
  Firebird.
- Los contratos que consulten datos concentrados en otra organica deben
  distinguir explicitamente el scope actor del scope de datos.
- Una organica no configurada deja de operar hasta que el DBA complete el alta.
- Una fila configurada con el usuario tecnico de ambiente se considera una
configuracion transitoria e invalida para operacion de negocio.
- El backend rechaza esa configuracion con
  `FIREBIRD_CREDENCIAL_ORGANICA_USUARIO_TECNICO`; no abre un attachment que
  produzca auditoria incorrecta.
- Cada ambiente requiere su propio catalogo, clave maestra y usuarios Firebird.
- Esta decision no concede acceso entre organicas ni implementa RLS.

## Alternativas descartadas

- Mantener un usuario unico: no resuelve la auditoria por dependencia.
- Usar el usuario tecnico como fallback: oculta errores de configuracion y
  produce auditoria incorrecta.
- Crear usuarios desde el backend: amplifica privilegios y mezcla operacion del
  DBA con responsabilidades de la aplicacion.
