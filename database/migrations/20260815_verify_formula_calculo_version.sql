/* Verificacion anual. No modifica datos. */
SET NOCOUNT ON;

DECLARE @ClaveFormula VARCHAR(50) = 'APORTACIONES-NOMINA';
DECLARE @Anio SMALLINT = 2026;
DECLARE @FormulaId BIGINT;

SELECT @FormulaId = FormulaCalculoVersionId
FROM aportaciones.FormulaCalculoVersion
WHERE ClaveFormula = @ClaveFormula AND AnioVigencia = @Anio
  AND NumeroVersion = 1 AND QuincenaDesde = 1 AND QuincenaHasta = 24 AND Estado = 'ACTIVA';

IF @FormulaId IS NULL THROW 51100, 'No existe la version anual activa esperada.', 1;
IF (SELECT COUNT(*) FROM aportaciones.FormulaCalculoParametro WHERE FormulaCalculoVersionId = @FormulaId) <> 15
  THROW 51101, 'La version no contiene exactamente 15 parametros.', 1;
IF EXISTS (
  SELECT 1 FROM aportaciones.FormulaCalculoVersion a
  JOIN aportaciones.FormulaCalculoVersion b
    ON b.ClaveFormula = a.ClaveFormula AND b.AnioVigencia = a.AnioVigencia
   AND b.FormulaCalculoVersionId > a.FormulaCalculoVersionId
   AND b.QuincenaDesde <= a.QuincenaHasta AND b.QuincenaHasta >= a.QuincenaDesde
  WHERE a.ClaveFormula = @ClaveFormula AND a.AnioVigencia = @Anio
    AND a.Estado = 'ACTIVA' AND b.Estado = 'ACTIVA'
) THROW 51102, 'Existen vigencias activas traslapadas.', 1;

EXEC aportaciones.spObtenerFormulaCalculoPeriodo @ClaveFormula, @Anio, 1;
EXEC aportaciones.spObtenerFormulaCalculoPeriodo @ClaveFormula, @Anio, 24;
