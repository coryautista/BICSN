# Script de prueba para el endpoint /reportes/aplicaciones-qna/hip
# Uso: .\test-hip-endpoint.ps1

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6IjNkOTk1NGIwLWVlOTgtNDk0NS1iOGFjLTc5MjY2OTdhNDEwYSIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2NjUyMTIxNSwiZXhwIjoxNzY2NTY0NDE1fQ.Fh7EvRid0KulZSQ4PHOcvVV8oRXyECsyxB_ykxW6nBw"

$baseUrl = "http://localhost:4000"
# El endpoint está disponible en dos rutas:
# 1. /v1/aplicaciones-qna/hip (ruta directa)
# 2. /v1/reportes/aplicaciones-qna/hip (ruta a través de reportes)
$endpoint = "/v1/reportes/aplicaciones-qna/hip"
$org0 = "04"
$org1 = "24"
$quincena = "2125"  # Formato QQAA (quincena 21 del año 2025)

$uri = "${baseUrl}${endpoint}?org0=${org0}&org1=${org1}&quincena=${quincena}"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Probando endpoint: $uri" -ForegroundColor Cyan
Write-Host "Parámetros:" -ForegroundColor Yellow
Write-Host "  - org0: $org0" -ForegroundColor Gray
Write-Host "  - org1: $org1" -ForegroundColor Gray
Write-Host "  - quincena: $quincena" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    
    Write-Host "Respuesta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.success) {
        Write-Host "`nTotal de registros: $($response.data.Count)" -ForegroundColor Green
        if ($response.data.Count -gt 0) {
            Write-Host "`nPrimer registro:" -ForegroundColor Yellow
            $response.data[0] | ConvertTo-Json -Depth 10 | Write-Host
        }
    }
} catch {
    Write-Host "Error al realizar la petición:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetalles del error:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    }
}

