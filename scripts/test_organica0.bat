@echo off
setlocal

echo 🔍 Testing organica0 endpoint timeout fix
echo ==========================================

REM First, get a token by logging in
echo 🔐 Logging in as admin user...

for /f "tokens=*" %%i in ('curl -s -X POST http://127.0.0.1:4000/v1/auth/login -H "Content-Type: application/json" -d "{\"usuario\":\"cory\",\"password\":\"12345678\"}"') do set LOGIN_RESPONSE=%%i

echo Login response: %LOGIN_RESPONSE%

REM Extract token (simple approach)
curl -s -X POST http://127.0.0.1:4000/v1/auth/login -H "Content-Type: application/json" -d "{\"usuario\":\"cory\",\"password\":\"12345678\"}" > temp_token.json
for /f "tokens=3" %%a in (temp_token.json) do set TOKEN=%%a
set TOKEN=%TOKEN:"=% 
set TOKEN=%TOKEN,%
echo Token extracted: %TOKEN%

if "%TOKEN%"=="null" (
    echo ❌ Login failed
    del temp_token.json 2>nul
    pause
    exit /b 1
)

echo ✅ Login successful

REM Test 1: Without pagination (original problematic case)
echo.
echo 📊 Test 1: GET organica0 WITHOUT pagination (admin user)
echo ⏱️  Starting request...

curl -s -w "HTTP_CODE:%{http_code}^|TIME_TOTAL:%{time_total}" -H "Authorization: Bearer %TOKEN%" http://127.0.0.1:4000/v1/organica0 --max-time 15 > temp_response1.txt
echo Request completed

REM Parse and display results
type temp_response1.txt
echo.

REM Test 2: With pagination (should be faster)
echo.
echo 📊 Test 2: GET organica0 WITH pagination (admin user)
echo ⏱️  Starting request...

curl -s -w "HTTP_CODE:%{http_code}^|TIME_TOTAL:%{time_total}" -H "Authorization: Bearer %TOKEN%" "http://127.0.0.1:4000/v1/organica0?limit=50^&offset=0" --max-time 5 > temp_response2.txt
echo Request completed

REM Parse and display results
type temp_response2.txt
echo.

echo 📋 Summary:
echo 1. Check server logs for performance indicators:
echo    - Look for '[DEBUG] [ID] listOrganica0: Total function time: XXXms'
echo    - Look for '[SERVICE] getAllOrganica0: Completed in XXXms'
echo    - Look for '[ROUTE] organica0 GET: Completed in XXXms'
echo.
echo 2. If the admin request without pagination still times out,
echo    consider implementing default pagination for admin users.
echo.
echo ✅ Test completed

REM Cleanup
del temp_token.json temp_response1.txt temp_response2.txt 2>nul

pause