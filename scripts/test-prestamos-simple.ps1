# Test simple para endpoint de prestamos mediano plazo
$body = @{usernameOrEmail='capturistaISSSSPEA';password='ISSSSPEA@1234a'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:4000/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
$token = $response.data.accessToken
$headers = @{Authorization="Bearer $token"}
$prestamos = Invoke-RestMethod -Uri 'http://localhost:4000/v1/aportacionesFondos/individuales/prestamos-mediano-plazo' -Method Get -Headers $headers

Write-Host "=== RESULTADO ===" -ForegroundColor Green
Write-Host "OK: $($prestamos.ok)" -ForegroundColor Yellow
Write-Host "Periodo: $($prestamos.data.periodo)" -ForegroundColor Yellow
Write-Host "Org0: $($prestamos.data.clave_organica_0)" -ForegroundColor Yellow
Write-Host "Org1: $($prestamos.data.clave_organica_1)" -ForegroundColor Yellow
Write-Host "Total prestamos: $($prestamos.data.prestamos.Count)" -ForegroundColor Yellow

if ($prestamos.data.prestamos.Count -gt 0) {
    Write-Host "`n=== Primer prestamo ===" -ForegroundColor Cyan
    $prestamos.data.prestamos[0] | Format-List
} else {
    Write-Host "`nNo se encontraron prestamos" -ForegroundColor Red
}

Write-Host "`n=== Respuesta completa (JSON) ===" -ForegroundColor Cyan
$prestamos | ConvertTo-Json -Depth 5




