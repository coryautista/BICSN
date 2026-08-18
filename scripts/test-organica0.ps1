# Script de prueba para el endpoint /v1/organica0
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6ImJlMGM5YzFiLTI1MWUtNDU1NS1iZmNiLWNiMjUxMmNhMjkwYiIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2NTkwNzczNywiZXhwIjoxNzY1OTUwOTM3fQ.G-KCEgtd0T0V7dVLvH-Hm8ui0YeZneK9ANdlv3Ys-uU"

$uri = "http://localhost:4000/v1/organica0"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Probando endpoint: $uri" -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers -TimeoutSec 30
    Write-Host "`nRespuesta exitosa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
    Write-Host "`nCódigo de estado:" -ForegroundColor Yellow
    Write-Host $_.Exception.Response.StatusCode.value__ -ForegroundColor Yellow
}

