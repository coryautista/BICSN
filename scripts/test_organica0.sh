#!/bin/bash

echo "🔍 Testing organica0 endpoint timeout fix"
echo "=========================================="

# First, get a token by logging in
echo "🔐 Logging in as admin user..."
TOKEN=$(curl -s -X POST http://127.0.0.1:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"cory","password":"12345678"}' | \
  jq -r '.data.token' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Login successful"

# Test 1: Without pagination (original problematic case)
echo ""
echo "📊 Test 1: GET organica0 WITHOUT pagination (admin user)"
echo "⏱️  Starting request at $(date '+%H:%M:%S.%3N')..."

START_TIME=$(date +%s%3N)
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}|TIME_TOTAL:%{time_total}" \
  -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:4000/v1/organica0 \
  --max-time 15)
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

echo "⏱️  Request completed at $(date '+%H:%M:%S.%3N')"

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep -o "TIME_TOTAL:[0-9.]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*|TIME_TOTAL:[0-9.]*$//')

echo "📊 Response Analysis:"
echo "   - HTTP Code: $HTTP_CODE"
echo "   - Total Time: ${TIME_TOTAL}s"
echo "   - Local Duration: ${DURATION}ms"

if [ "$HTTP_CODE" = "200" ]; then
    RECORD_COUNT=$(echo "$BODY" | jq '.data | length' 2>/dev/null || echo "unknown")
    echo "   - Records returned: $RECORD_COUNT"
    echo "   - Has pagination: $(echo "$BODY" | jq '.pagination != null' 2>/dev/null || echo "unknown")"
    
    if (( $(echo "$TIME_TOTAL > 10" | bc -l 2>/dev/null || echo 0) )); then
        echo "❌ TIMEOUT ISSUE: Request took more than 10 seconds"
    else
        echo "✅ Response within acceptable time (< 10s)"
    fi
else
    echo "❌ Request failed with HTTP code: $HTTP_CODE"
    echo "Response: $BODY"
fi

# Test 2: With pagination (should be faster)
echo ""
echo "📊 Test 2: GET organica0 WITH pagination (admin user)"
echo "⏱️  Starting request at $(date '+%H:%M:%S.%3N')..."

START_TIME=$(date +%s%3N)
RESPONSE2=$(curl -s -w "HTTP_CODE:%{http_code}|TIME_TOTAL:%{time_total}" \
  -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:4000/v1/organica0?limit=50&offset=0" \
  --max-time 5)
END_TIME=$(date +%s%3N)
DURATION2=$((END_TIME - START_TIME))

echo "⏱️  Request completed at $(date '+%H:%M:%S.%3N')"

# Parse response
HTTP_CODE2=$(echo "$RESPONSE2" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
TIME_TOTAL2=$(echo "$RESPONSE2" | grep -o "TIME_TOTAL:[0-9.]*" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed 's/HTTP_CODE:[0-9]*|TIME_TOTAL:[0-9.]*$//')

echo "📊 Response Analysis:"
echo "   - HTTP Code: $HTTP_CODE2"
echo "   - Total Time: ${TIME_TOTAL2}s"
echo "   - Local Duration: ${DURATION2}ms"

if [ "$HTTP_CODE2" = "200" ]; then
    RECORD_COUNT2=$(echo "$BODY2" | jq '.data | length' 2>/dev/null || echo "unknown")
    echo "   - Records returned: $RECORD_COUNT2"
    echo "   - Pagination info: $(echo "$BODY2" | jq '.pagination' 2>/dev/null || echo "unknown")"
    
    if (( $(echo "$TIME_TOTAL2 > 3" | bc -l 2>/dev/null || echo 0) )); then
        echo "⚠️  Slow response: More than 3 seconds"
    else
        echo "✅ Fast response (< 3s)"
    fi
else
    echo "❌ Request failed with HTTP code: $HTTP_CODE2"
fi

echo ""
echo "📋 Summary:"
echo "1. Check server logs for performance indicators:"
echo "   - Look for '[DEBUG] [ID] listOrganica0: Total function time: XXXms'"
echo "   - Look for '[SERVICE] getAllOrganica0: Completed in XXXms'"
echo "   - Look for '[ROUTE] organica0 GET: Completed in XXXms'"
echo ""
echo "2. If the admin request without pagination still times out,"
echo "   consider implementing default pagination for admin users."

echo ""
echo "✅ Test completed at $(date '+%H:%M:%S.%3N')"