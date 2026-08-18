# Script de prueba para el endpoint /reportes/aplicaciones-qna/periodo-trabajo
# Uso: .\test-periodo-trabajo.ps1

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjAxNDMzRS1GMzZCLTE0MTAtODBBNy0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJDYXB0dXJpc3RhIl0sImVudGlkYWRlcyI6W3RydWVdLCJqdGkiOiI1YjhhM2ZiYy05ZmZmLTQ5MjktYTRlZi0wYjQ1NmMwYjFlNGMiLCJpc3MiOiJhcGkiLCJhdWQiOiJhcGktY2xpZW50cyIsImlkT3JnYW5pY2EwIjoiMDQiLCJpZE9yZ2FuaWNhMSI6IjI0IiwiaWRPcmdhbmljYTIiOiIwMSIsImlkT3JnYW5pY2EzIjoiMDEiLCJpYXQiOjE3NjY1MjIxODUsImV4cCI6MTc2NjU2NTM4NX0.NAI3M0fgCJx1W9959sZ42V1CtdF487tLEoa_-fj7mlU"

$baseUrl = "http://localhost:4000"
# El endpoint está disponible en dos rutas:
# 1. /v1/aplicaciones-qna/periodo-trabajo (ruta directa)
# 2. /v1/reportes/aplicaciones-qna/periodo-trabajo (ruta a través de reportes)
$endpoint = "/v1/reportes/aplicaciones-qna/periodo-trabajo"

# Los parámetros org0 y org1 son opcionales, se usarán del token si no se proporcionan
$uri = "${baseUrl}${endpoint}"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Probando endpoint: $uri" -ForegroundColor Cyan
Write-Host "Token contiene:" -ForegroundColor Yellow
Write-Host "  - idOrganica0: 04" -ForegroundColor Gray
Write-Host "  - idOrganica1: 24" -ForegroundColor Gray
Write-Host "  - idOrganica2: 01" -ForegroundColor Gray
Write-Host "  - idOrganica3: 01" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    
    Write-Host "Respuesta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.success) {
        Write-Host "`nDatos del período:" -ForegroundColor Yellow
        Write-Host "  - Período: $($response.data.periodo)" -ForegroundColor Cyan
        Write-Host "  - Quincena: $($response.data.quincena)" -ForegroundColor Cyan
        Write-Host "  - Año: $($response.data.anio)" -ForegroundColor Cyan
        Write-Host "  - Acción: $($response.data.accion)" -ForegroundColor Cyan
        Write-Host "  - Org0: $($response.data.org0)" -ForegroundColor Cyan
        Write-Host "  - Org1: $($response.data.org1)" -ForegroundColor Cyan
        Write-Host "  - Fecha Inicio: $($response.data.fechaInicio)" -ForegroundColor Cyan
        Write-Host "  - Fecha Fin: $($response.data.fechaFin)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Error al realizar la petición:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetalles del error:" -ForegroundColor Yellow
        try {
            $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorJson | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
}


