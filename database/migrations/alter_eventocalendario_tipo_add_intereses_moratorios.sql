/*
  Extiende el CHECK constraint dbo.EventoCalendario.tipo para permitir INTERESES_MORATORIOS.

  Constraint actual (según sys.check_constraints):
    ([tipo]=N'HIPOTECARIO' OR [tipo]=N'PAGO' OR [tipo]=N'ALTA_BAJA_CAMBIO' OR [tipo]=N'ASUETO' OR [tipo]=N'ARCHIVO_APLICACION')
*/

IF EXISTS (
  SELECT 1
  FROM sys.check_constraints cc
  WHERE cc.name = 'CK_EventoCalendario_tipo'
    AND cc.parent_object_id = OBJECT_ID('dbo.EventoCalendario')
)
BEGIN
  ALTER TABLE dbo.EventoCalendario DROP CONSTRAINT CK_EventoCalendario_tipo;
END

ALTER TABLE dbo.EventoCalendario WITH CHECK
ADD CONSTRAINT CK_EventoCalendario_tipo
CHECK (
  [tipo] IN (
    N'ARCHIVO_APLICACION',
    N'ASUETO',
    N'ALTA_BAJA_CAMBIO',
    N'PAGO',
    N'HIPOTECARIO',
    N'INTERESES_MORATORIOS'
  )
);

