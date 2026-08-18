/*
  Configuracion anual activa de aportaciones.
  Seleccionar explicitamente la base destino antes de ejecutar.
  No contiene USE y no modifica tablas historicas existentes.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ClaveFormula VARCHAR(50) = 'APORTACIONES-NOMINA';
DECLARE @AnioVigencia SMALLINT = 2026;
DECLARE @Usuario NVARCHAR(100) = COALESCE(CONVERT(NVARCHAR(100), SESSION_CONTEXT(N'userId')), SUSER_SNAME());

IF SCHEMA_ID(N'aportaciones') IS NULL
  THROW 51001, 'No existe el esquema aportaciones en la base seleccionada.', 1;

DECLARE @Parametros TABLE (
  ClaveParametro VARCHAR(50) NOT NULL PRIMARY KEY,
  Valor DECIMAL(19,9) NOT NULL,
  Unidad VARCHAR(20) NOT NULL,
  Fuente NVARCHAR(100) NOT NULL,
  Observaciones NVARCHAR(300) NULL
);

INSERT INTO @Parametros (ClaveParametro, Valor, Unidad, Fuente, Observaciones)
VALUES
  ('DIAS_MES',                30.000000000, 'DIVISOR', N'Regla de calculo', N'Divisor para obtener la base diaria'),
  ('DIAS_DEFAULT_SIN_TXT',    15.000000000, 'DIAS',    N'Regla aprobada',   N'Aplica solo cuando la QNA no tiene TXT'),
  ('DIAS_MIN',                 0.000000000, 'DIAS',    N'Regla aprobada',   N'Limite inferior de nomina'),
  ('DIAS_MAX',                15.000000000, 'DIAS',    N'Regla aprobada',   N'Limite superior de nomina'),
  ('CAIR_SUELDO',              0.020000000, 'TASA',    N'SARE Firebird',    NULL),
  ('FRA_SUELDO',               0.045000000, 'TASA',    N'FPESA Firebird',   NULL),
  ('FRA_OTRAS',                0.000000000, 'TASA',    N'FPEAA Firebird',   N'Cero explicito'),
  ('FRA_QUINQUENIOS',          0.000000000, 'TASA',    N'FPEQA Firebird',   N'Cero explicito'),
  ('FRE_SUELDO',               0.222500000, 'TASA',    N'FPESE Firebird',   NULL),
  ('FRE_OTRAS',                0.267500000, 'TASA',    N'FPEAE Firebird',   NULL),
  ('FRE_QUINQUENIOS',          0.267500000, 'TASA',    N'FPEQE Firebird',   NULL),
  ('FH_SUELDO',                0.003500000, 'TASA',    N'FHE Firebird',     NULL),
  ('FV_SUELDO',                0.014000000, 'TASA',    N'FVE Firebird',     NULL),
  ('FAA_SUELDO',               0.050000000, 'TASA',    N'FAA Firebird',     NULL),
  ('FAE_SUELDO',               0.025000000, 'TASA',    N'FAE Firebird',     NULL);

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'aportaciones.FormulaCalculoVersion', N'U') IS NULL
  BEGIN
    CREATE TABLE aportaciones.FormulaCalculoVersion (
      FormulaCalculoVersionId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FormulaCalculoVersion PRIMARY KEY,
      ClaveFormula VARCHAR(50) NOT NULL,
      AnioVigencia SMALLINT NOT NULL,
      NumeroVersion SMALLINT NOT NULL,
      QuincenaDesde TINYINT NOT NULL,
      QuincenaHasta TINYINT NOT NULL,
      Descripcion NVARCHAR(300) NOT NULL,
      PrecisionPolicy VARCHAR(50) NOT NULL,
      Estado VARCHAR(15) NOT NULL,
      FormulaOrigenId BIGINT NULL,
      FechaAlta DATETIME2(3) NOT NULL CONSTRAINT DF_FormulaCalculoVersion_FechaAlta DEFAULT (SYSDATETIME()),
      UsuarioAlta NVARCHAR(100) NOT NULL,
      RowVersion ROWVERSION NOT NULL,
      CONSTRAINT FK_FormulaCalculoVersion_Origen FOREIGN KEY (FormulaOrigenId)
        REFERENCES aportaciones.FormulaCalculoVersion (FormulaCalculoVersionId),
      CONSTRAINT UQ_FormulaCalculoVersion_AnioVersion UNIQUE (ClaveFormula, AnioVigencia, NumeroVersion),
      CONSTRAINT UQ_FormulaCalculoVersion_AnioInicio UNIQUE (ClaveFormula, AnioVigencia, QuincenaDesde),
      CONSTRAINT CK_FormulaCalculoVersion_Anio CHECK (AnioVigencia BETWEEN 2000 AND 2100),
      CONSTRAINT CK_FormulaCalculoVersion_Numero CHECK (NumeroVersion > 0),
      CONSTRAINT CK_FormulaCalculoVersion_Quincenas CHECK (
        QuincenaDesde BETWEEN 1 AND 24
        AND QuincenaHasta BETWEEN QuincenaDesde AND 24
      ),
      CONSTRAINT CK_FormulaCalculoVersion_Estado CHECK (Estado IN ('ACTIVA', 'INACTIVA'))
    );

    CREATE INDEX IX_FormulaCalculoVersion_Resolver
      ON aportaciones.FormulaCalculoVersion (ClaveFormula, AnioVigencia, Estado, QuincenaDesde, QuincenaHasta);
  END;

  IF OBJECT_ID(N'aportaciones.FormulaCalculoParametro', N'U') IS NULL
  BEGIN
    CREATE TABLE aportaciones.FormulaCalculoParametro (
      FormulaCalculoParametroId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FormulaCalculoParametro PRIMARY KEY,
      FormulaCalculoVersionId BIGINT NOT NULL,
      ClaveParametro VARCHAR(50) NOT NULL,
      Valor DECIMAL(19,9) NOT NULL,
      Unidad VARCHAR(20) NOT NULL,
      Fuente NVARCHAR(100) NOT NULL,
      Observaciones NVARCHAR(300) NULL,
      FechaAlta DATETIME2(3) NOT NULL CONSTRAINT DF_FormulaCalculoParametro_FechaAlta DEFAULT (SYSDATETIME()),
      UsuarioAlta NVARCHAR(100) NOT NULL,
      CONSTRAINT FK_FormulaCalculoParametro_Version FOREIGN KEY (FormulaCalculoVersionId)
        REFERENCES aportaciones.FormulaCalculoVersion (FormulaCalculoVersionId),
      CONSTRAINT UQ_FormulaCalculoParametro_VersionClave UNIQUE (FormulaCalculoVersionId, ClaveParametro),
      CONSTRAINT CK_FormulaCalculoParametro_Valor CHECK (Valor >= 0),
      CONSTRAINT CK_FormulaCalculoParametro_Unidad CHECK (Unidad IN ('TASA', 'DIAS', 'DIVISOR')),
      CONSTRAINT CK_FormulaCalculoParametro_Tasa CHECK (Unidad <> 'TASA' OR Valor <= 1),
      CONSTRAINT CK_FormulaCalculoParametro_Divisor CHECK (Unidad <> 'DIVISOR' OR Valor > 0)
    );
  END;

  IF COL_LENGTH(N'aportaciones.FormulaCalculoVersion', N'AnioVigencia') IS NULL
     OR COL_LENGTH(N'aportaciones.FormulaCalculoVersion', N'NumeroVersion') IS NULL
     OR COL_LENGTH(N'aportaciones.FormulaCalculoParametro', N'Valor') IS NULL
    THROW 51002, 'Las tablas ya existen con una estructura incompatible.', 1;

  DECLARE @FormulaId BIGINT;

  SELECT @FormulaId = FormulaCalculoVersionId
  FROM aportaciones.FormulaCalculoVersion WITH (UPDLOCK, HOLDLOCK)
  WHERE ClaveFormula = @ClaveFormula
    AND AnioVigencia = @AnioVigencia
    AND NumeroVersion = 1;

  IF @FormulaId IS NULL
  BEGIN
    INSERT INTO aportaciones.FormulaCalculoVersion (
      ClaveFormula, AnioVigencia, NumeroVersion, QuincenaDesde, QuincenaHasta,
      Descripcion, PrecisionPolicy, Estado, FormulaOrigenId, UsuarioAlta
    )
    VALUES (
      @ClaveFormula, @AnioVigencia, 1, 1, 24,
      N'Calculo anual de aportaciones con dias de nomina y componentes REVISA separados',
      'MXN-DETAIL6-AGG2-TRUNC-v1', 'ACTIVA', NULL, @Usuario
    );
    SET @FormulaId = SCOPE_IDENTITY();
  END
  ELSE IF NOT EXISTS (
    SELECT 1
    FROM aportaciones.FormulaCalculoVersion
    WHERE FormulaCalculoVersionId = @FormulaId
      AND QuincenaDesde = 1
      AND QuincenaHasta = 24
      AND PrecisionPolicy = 'MXN-DETAIL6-AGG2-TRUNC-v1'
      AND Estado = 'ACTIVA'
  )
    THROW 51003, 'La version 2026 V1 existente no coincide con la configuracion esperada.', 1;

  IF EXISTS (
    SELECT 1
    FROM aportaciones.FormulaCalculoParametro p
    JOIN @Parametros e ON e.ClaveParametro = p.ClaveParametro
    WHERE p.FormulaCalculoVersionId = @FormulaId
      AND (p.Valor <> e.Valor OR p.Unidad <> e.Unidad OR p.Fuente <> e.Fuente)
  )
    THROW 51004, 'La version 2026 V1 contiene parametros diferentes.', 1;

  IF EXISTS (
    SELECT 1 FROM aportaciones.FormulaCalculoParametro p
    WHERE p.FormulaCalculoVersionId = @FormulaId
      AND NOT EXISTS (SELECT 1 FROM @Parametros e WHERE e.ClaveParametro = p.ClaveParametro)
  )
    THROW 51005, 'La version 2026 V1 contiene parametros no esperados.', 1;

  INSERT INTO aportaciones.FormulaCalculoParametro (
    FormulaCalculoVersionId, ClaveParametro, Valor, Unidad, Fuente, Observaciones, UsuarioAlta
  )
  SELECT @FormulaId, e.ClaveParametro, e.Valor, e.Unidad, e.Fuente, e.Observaciones, @Usuario
  FROM @Parametros e
  WHERE NOT EXISTS (
    SELECT 1 FROM aportaciones.FormulaCalculoParametro p WITH (UPDLOCK, HOLDLOCK)
    WHERE p.FormulaCalculoVersionId = @FormulaId
      AND p.ClaveParametro = e.ClaveParametro
  );

  IF (SELECT COUNT(*) FROM aportaciones.FormulaCalculoParametro WHERE FormulaCalculoVersionId = @FormulaId) <> 15
    THROW 51006, 'La version activa no contiene exactamente 15 parametros.', 1;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

CREATE OR ALTER PROCEDURE aportaciones.spObtenerFormulaCalculoPeriodo
  @ClaveFormula VARCHAR(50),
  @Anio SMALLINT,
  @Quincena TINYINT
AS
BEGIN
  SET NOCOUNT ON;

  IF @Quincena NOT BETWEEN 1 AND 24
    THROW 51010, 'La quincena debe estar entre 1 y 24.', 1;

  DECLARE @FormulaId BIGINT;
  DECLARE @Total INT;

  SELECT @Total = COUNT(*), @FormulaId = MAX(FormulaCalculoVersionId)
  FROM aportaciones.FormulaCalculoVersion
  WHERE ClaveFormula = @ClaveFormula
    AND AnioVigencia = @Anio
    AND Estado = 'ACTIVA'
    AND @Quincena BETWEEN QuincenaDesde AND QuincenaHasta;

  IF @Total = 0 THROW 51011, 'No existe formula activa para el periodo.', 1;
  IF @Total > 1 THROW 51012, 'Existen formulas activas traslapadas para el periodo.', 1;

  SELECT * FROM aportaciones.FormulaCalculoVersion WHERE FormulaCalculoVersionId = @FormulaId;
  SELECT ClaveParametro, CONVERT(VARCHAR(40), Valor) AS Valor, Unidad, Fuente, Observaciones
  FROM aportaciones.FormulaCalculoParametro
  WHERE FormulaCalculoVersionId = @FormulaId
  ORDER BY ClaveParametro;
END;
GO

CREATE OR ALTER PROCEDURE aportaciones.spClonarFormulaCalculoVersion
  @FormulaOrigenId BIGINT,
  @AnioDestino SMALLINT,
  @QuincenaDesde TINYINT,
  @CambiosJson NVARCHAR(MAX) = NULL,
  @Usuario NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @AnioDestino NOT BETWEEN 2000 AND 2100 OR @QuincenaDesde NOT BETWEEN 1 AND 24
    THROW 51020, 'Anio o quincena destino fuera de rango.', 1;
  IF @CambiosJson IS NOT NULL AND ISJSON(@CambiosJson) <> 1
    THROW 51021, 'CambiosJson no contiene JSON valido.', 1;

  SET @Usuario = COALESCE(@Usuario, CONVERT(NVARCHAR(100), SESSION_CONTEXT(N'userId')), SUSER_SNAME());

  DECLARE @ClaveFormula VARCHAR(50), @PrecisionPolicy VARCHAR(50), @AnioOrigen SMALLINT;
  SELECT @ClaveFormula = ClaveFormula, @PrecisionPolicy = PrecisionPolicy, @AnioOrigen = AnioVigencia
  FROM aportaciones.FormulaCalculoVersion
  WHERE FormulaCalculoVersionId = @FormulaOrigenId AND Estado = 'ACTIVA';
  IF @ClaveFormula IS NULL THROW 51022, 'La formula origen no existe o no esta activa.', 1;

  DECLARE @Cambios TABLE (ClaveParametro VARCHAR(50) PRIMARY KEY, Valor DECIMAL(19,9));
  IF @CambiosJson IS NOT NULL
    INSERT INTO @Cambios (ClaveParametro, Valor)
    SELECT ClaveParametro, Valor
    FROM OPENJSON(@CambiosJson)
    WITH (ClaveParametro VARCHAR(50) '$.clave', Valor DECIMAL(19,9) '$.valor');

  IF EXISTS (SELECT 1 FROM @Cambios WHERE Valor IS NULL OR Valor < 0)
    THROW 51023, 'Los cambios contienen valores invalidos.', 1;
  IF EXISTS (
    SELECT 1 FROM @Cambios c
    WHERE NOT EXISTS (
      SELECT 1 FROM aportaciones.FormulaCalculoParametro p
      WHERE p.FormulaCalculoVersionId = @FormulaOrigenId AND p.ClaveParametro = c.ClaveParametro
    )
  )
    THROW 51024, 'Los cambios contienen claves no reconocidas.', 1;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
      SELECT 1 FROM aportaciones.FormulaCalculoVersion WITH (UPDLOCK, HOLDLOCK)
      WHERE ClaveFormula = @ClaveFormula AND AnioVigencia = @AnioDestino
        AND Estado = 'ACTIVA'
        AND QuincenaDesde <= 24 AND QuincenaHasta >= @QuincenaDesde
        AND FormulaCalculoVersionId <> @FormulaOrigenId
    )
      THROW 51025, 'Ya existe otra formula activa que se traslapa con la vigencia solicitada.', 1;

    IF @AnioDestino = @AnioOrigen
    BEGIN
      IF @QuincenaDesde <= 1
        THROW 51026, 'Una nueva version del mismo anio debe iniciar despues de la QNA 01.', 1;
      UPDATE aportaciones.FormulaCalculoVersion
      SET QuincenaHasta = @QuincenaDesde - 1
      WHERE FormulaCalculoVersionId = @FormulaOrigenId
        AND QuincenaDesde < @QuincenaDesde
        AND QuincenaHasta >= @QuincenaDesde;
      IF @@ROWCOUNT <> 1 THROW 51027, 'La formula origen no puede cerrarse en la quincena indicada.', 1;
    END
    ELSE IF @QuincenaDesde <> 1
      THROW 51028, 'La primera version de un nuevo anio debe iniciar en la QNA 01.', 1;

    DECLARE @NumeroVersion SMALLINT;
    SELECT @NumeroVersion = ISNULL(MAX(NumeroVersion), 0) + 1
    FROM aportaciones.FormulaCalculoVersion WITH (UPDLOCK, HOLDLOCK)
    WHERE ClaveFormula = @ClaveFormula AND AnioVigencia = @AnioDestino;

    INSERT INTO aportaciones.FormulaCalculoVersion (
      ClaveFormula, AnioVigencia, NumeroVersion, QuincenaDesde, QuincenaHasta,
      Descripcion, PrecisionPolicy, Estado, FormulaOrigenId, UsuarioAlta
    )
    VALUES (
      @ClaveFormula, @AnioDestino, @NumeroVersion, @QuincenaDesde, 24,
      CONCAT(N'Calculo anual de aportaciones ', @AnioDestino, N' V', @NumeroVersion),
      @PrecisionPolicy, 'ACTIVA', @FormulaOrigenId, @Usuario
    );

    DECLARE @NuevaFormulaId BIGINT = SCOPE_IDENTITY();
    INSERT INTO aportaciones.FormulaCalculoParametro (
      FormulaCalculoVersionId, ClaveParametro, Valor, Unidad, Fuente, Observaciones, UsuarioAlta
    )
    SELECT @NuevaFormulaId, p.ClaveParametro, COALESCE(c.Valor, p.Valor), p.Unidad,
           CASE WHEN c.ClaveParametro IS NULL THEN p.Fuente ELSE N'Ajuste versionado' END,
           p.Observaciones, @Usuario
    FROM aportaciones.FormulaCalculoParametro p
    LEFT JOIN @Cambios c ON c.ClaveParametro = p.ClaveParametro
    WHERE p.FormulaCalculoVersionId = @FormulaOrigenId;

    IF (SELECT COUNT(*) FROM aportaciones.FormulaCalculoParametro WHERE FormulaCalculoVersionId = @NuevaFormulaId) <> 15
      THROW 51029, 'La nueva version no contiene exactamente 15 parametros.', 1;

    COMMIT TRANSACTION;
    SELECT @NuevaFormulaId AS FormulaCalculoVersionId, @AnioDestino AS AnioVigencia,
           @NumeroVersion AS NumeroVersion, @QuincenaDesde AS QuincenaDesde, CAST(24 AS TINYINT) AS QuincenaHasta,
           'ACTIVA' AS Estado;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH;
END;
GO

EXEC aportaciones.spObtenerFormulaCalculoPeriodo
  @ClaveFormula = 'APORTACIONES-NOMINA', @Anio = 2026, @Quincena = 1;
