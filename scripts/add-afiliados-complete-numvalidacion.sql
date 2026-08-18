-- Script SQL para agregar columnas afiliadosComplete y numValidacion a la tabla afi.Afiliado
-- Fecha: 2025-11-12
-- Propósito: Agregar dos nuevas columnas para registro completo de afiliados y validación

-- Verificar si las columnas ya existen
IF COL_LENGTH('afi.Afiliado', 'afiliadosComplete') IS NULL
BEGIN
    PRINT 'Agregando columna afiliadosComplete...'
    ALTER TABLE afi.Afiliado 
    ADD afiliadosComplete INT NULL
    
    -- Agregar comentario a la columna
    EXEC sys.sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Indica si el afiliado tiene información completa (1) o incompleta (0)', 
        @level0name = N'afi', 
        @level1name = N'Afiliado', 
        @level2name = N'afiliadosComplete'
END
ELSE
BEGIN
    PRINT 'La columna afiliadosComplete ya existe.'
END

IF COL_LENGTH('afi.Afiliado', 'numValidacion') IS NULL
BEGIN
    PRINT 'Agregando columna numValidacion...'
    ALTER TABLE afi.Afiliado 
    ADD numValidacion INT NOT NULL DEFAULT 1
    
    -- Agregar comentario a la columna
    EXEC sys.sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Número de validación del afiliado (valor por defecto: 1)', 
        @level0name = N'afi', 
        @level1name = N'Afiliado', 
        @level2name = N'numValidacion'
END
ELSE
BEGIN
    PRINT 'La columna numValidacion ya existe.'
END

-- Actualizar registros existentes (opcional)
-- Los registros existentes tendrán NULL para afiliadosComplete y 1 para numValidacion por defecto

-- Verificar que las columnas se crearon correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Afiliado' 
AND TABLE_SCHEMA = 'afi'
AND COLUMN_NAME IN ('afiliadosComplete', 'numValidacion')

PRINT 'Script completado exitosamente.'
PRINT 'Las nuevas columnas han sido agregadas a la tabla afi.Afiliado:'
PRINT '- afiliadosComplete: INT NULL (0=incompleto, 1=completo)'
PRINT '- numValidacion: INT NOT NULL DEFAULT 1 (número de validación)'