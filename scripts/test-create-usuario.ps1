# Script de prueba para crear usuario
# Uso: .\test-create-usuario.ps1 -Token "TU_TOKEN_AQUI"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$uri = "http://187.232.203.115:4000/v1/usuarios"

$body = @{
    usuarioId = "94cd411d-da33-4697-962c-302672bc7de5"
    nombre = "capturistaISSSSPEA"
    email = "correo@isssspea.com"
    password = "ISSSSPEA#1234a"
    roleId = "DA7E433E-F36B-1410-80A6-00A5CBF95890"
    esActivo = $true
    phoneNumber = "4491234567"
    idOrganica0 = "04"
    idOrganica1 = "24"
    idOrganica2 = ""
    idOrganica3 = ""
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $Token"
}

try {
    Write-Host "Enviando petición para crear usuario..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    
    Write-Host "`n✅ Usuario creado exitosamente!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "`n❌ Error al crear usuario:" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Código: $($errorObj.error.code)" -ForegroundColor Red
        Write-Host "Mensaje: $($errorObj.error.message)" -ForegroundColor Red
        Write-Host ($errorObj | ConvertTo-Json -Depth 10) -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    exit 1
}

