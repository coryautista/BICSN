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
- Una organica no configurada deja de operar hasta que el DBA complete el alta.
- Cada ambiente requiere su propio catalogo, clave maestra y usuarios Firebird.
- Esta decision no concede acceso entre organicas ni implementa RLS.

## Alternativas descartadas

- Mantener un usuario unico: no resuelve la auditoria por dependencia.
- Usar el usuario tecnico como fallback: oculta errores de configuracion y
  produce auditoria incorrecta.
- Crear usuarios desde el backend: amplifica privilegios y mezcla operacion del
  DBA con responsabilidades de la aplicacion.
