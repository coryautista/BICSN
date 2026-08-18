-- Update CategoriaPuestoOrg table schema
-- Change Categoria and NombreCategoria to nvarchar(200) NOT NULL

USE [SII-ISSSSPEA];
GO

-- Update Categoria column
ALTER TABLE afi.CategoriaPuestoOrg
ALTER COLUMN Categoria NVARCHAR(200) NOT NULL;
GO

-- Update NombreCategoria column
ALTER TABLE afi.CategoriaPuestoOrg
ALTER COLUMN NombreCategoria NVARCHAR(200) NOT NULL;
GO

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'afi'
    AND TABLE_NAME = 'CategoriaPuestoOrg'
    AND COLUMN_NAME IN ('Categoria', 'NombreCategoria');
GO
