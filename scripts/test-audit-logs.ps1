# Script de prueba para el endpoint /v1/audit-logs
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6IjA3YTgxMDlhLTc5MjktNGI3ZS05ZTg0LTQ0ODljYmQ0ZWQ5MiIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2Njc4NTUzMywiZXhwIjoxNzY2ODI4NzMzfQ.pdMaN87L1QciGFO2dP_bMwKkUqpqUDOLfe2mBvEnNgQ"

$baseUrl = "http://localhost:4000"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== PRUEBA POST-FIX: Formato YYYY-MM-DD ===" -ForegroundColor Cyan
$uri1 = "${baseUrl}/v1/audit-logs?fechaInicio=2025-12-01&fechaFin=2025-12-23"
Write-Host "URI: $uri1" -ForegroundColor Gray
try {
    $response1 = Invoke-RestMethod -Uri $uri1 -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✓ Éxito con formato YYYY-MM-DD" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Yellow
    $response1 | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "✗ Error con formato YYYY-MM-DD" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles:" -ForegroundColor Yellow
        try {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
}

Write-Host "`n=== PRUEBA 2: Formato ISO 8601 (date-time) ===" -ForegroundColor Cyan
$fechaInicio2 = "2025-12-01T00:00:00Z"
$fechaFin2 = "2025-12-23T23:59:59Z"
$ampersand = '&'
$uri2 = "$baseUrl/v1/audit-logs" + "?fechaInicio=" + [System.Web.HttpUtility]::UrlEncode($fechaInicio2) + $ampersand + "fechaFin=" + [System.Web.HttpUtility]::UrlEncode($fechaFin2)
Write-Host "URI: $uri2" -ForegroundColor Gray
try {
    $response2 = Invoke-RestMethod -Uri $uri2 -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✓ Éxito con formato ISO 8601" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Yellow
    $response2 | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "✗ Error con formato ISO 8601" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles:" -ForegroundColor Yellow
        try {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5 | Write-Host
        } catch {
            Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Pruebas completadas ===" -ForegroundColor Cyan

