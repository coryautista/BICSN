/* Rollback manual protegido. No ejecutar si la formula ya fue usada. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ClaveFormula VARCHAR(50) = 'APORTACIONES-NOMINA';
DECLARE @Anio SMALLINT = 2026;
DECLARE @ConfirmarEliminacionActiva BIT = 0;
DECLARE @EliminarEstructura BIT = 0;

IF @ConfirmarEliminacionActiva <> 1
  THROW 51200, 'Rollback bloqueado. Cambie ConfirmarEliminacionActiva a 1 tras validar que no existen usos.', 1;

IF EXISTS (
  SELECT 1
  FROM aportaciones.FormulaCalculoVersion child
  JOIN aportaciones.FormulaCalculoVersion parent ON parent.FormulaCalculoVersionId = child.FormulaOrigenId
  WHERE parent.ClaveFormula = @ClaveFormula AND parent.AnioVigencia = @Anio
)
  THROW 51203, 'Rollback rechazado: existen versiones descendientes.', 1;

IF COL_LENGTH(N'conciliacion.RevisionAplicacionHistorico', N'FormulaCalculoVersionId') IS NOT NULL
BEGIN
  DECLARE @Usada BIT = 0;
  DECLARE @Sql NVARCHAR(MAX) = N'
    SELECT @Existe = CASE WHEN EXISTS (
      SELECT 1 FROM conciliacion.RevisionAplicacionHistorico h
      JOIN aportaciones.FormulaCalculoVersion v ON v.FormulaCalculoVersionId = h.FormulaCalculoVersionId
      WHERE v.ClaveFormula = @Clave AND v.AnioVigencia = @Anio
    ) THEN 1 ELSE 0 END;';
  EXEC sys.sp_executesql @Sql, N'@Clave VARCHAR(50), @Anio SMALLINT, @Existe BIT OUTPUT',
    @Clave = @ClaveFormula, @Anio = @Anio, @Existe = @Usada OUTPUT;
  IF @Usada = 1 THROW 51201, 'Rollback rechazado: existen snapshots asociados.', 1;
END;

BEGIN TRY
  BEGIN TRANSACTION;
  DELETE p FROM aportaciones.FormulaCalculoParametro p
  JOIN aportaciones.FormulaCalculoVersion v ON v.FormulaCalculoVersionId = p.FormulaCalculoVersionId
  WHERE v.ClaveFormula = @ClaveFormula AND v.AnioVigencia = @Anio;

  DELETE FROM aportaciones.FormulaCalculoVersion
  WHERE ClaveFormula = @ClaveFormula AND AnioVigencia = @Anio;

  IF @EliminarEstructura = 1
  BEGIN
    IF EXISTS (SELECT 1 FROM aportaciones.FormulaCalculoVersion)
      THROW 51202, 'No se puede eliminar la estructura porque existen otras versiones.', 1;
    DROP PROCEDURE aportaciones.spClonarFormulaCalculoVersion;
    DROP PROCEDURE aportaciones.spObtenerFormulaCalculoPeriodo;
    DROP TABLE aportaciones.FormulaCalculoParametro;
    DROP TABLE aportaciones.FormulaCalculoVersion;
  END;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
