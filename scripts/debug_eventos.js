// Debug test to identify the exact issue using built-in fetch
const BASE_URL = 'http://localhost:4000/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6IjdiNmJkM2E3LWUyOTUtNDgyOS1hMGE1LWE1ZmZlYzEwNWYyMCIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2MzE4NzkwMSwiZXhwIjoxNzYzMjMxMTAxfQ.PWS7UN1c71skOIkbiJMA_kXINIUzYZIxRJEVHlDDu2Q';

async function debugEventosIssue() {
    console.log('🔍 Debugging eventos-calendario issue...\n');
    
    // Test 1: Try a simple GET first (no auth required ideally)
    console.log('📤 Testing GET /eventos-calendario');
    try {
        const response = await fetch(`${BASE_URL}/eventos-calendario`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        console.log('📥 GET Status:', response.status);
        const responseText = await response.text();
        console.log('📥 GET Response:', responseText);
    } catch (error) {
        console.error('❌ GET Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Try different authentication methods
    console.log('📤 Testing POST with different headers');
    
    const testCases = [
        {
            name: 'Bearer Token',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        },
        {
            name: 'Cookie Token',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${TOKEN}`
            }
        },
        {
            name: 'Simple JSON',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    ];
    
    const createData = {
        fecha: "2025-11-15",
        tipo: "ALTA_BAJA_CAMBIO",
        anio: 2025
    };
    
    for (const testCase of testCases) {
        console.log(`\n🧪 Test: ${testCase.name}`);
        try {
            const response = await fetch(`${BASE_URL}/eventos-calendario`, {
                method: 'POST',
                headers: testCase.headers,
                body: JSON.stringify(createData)
            });
            
            console.log('📥 Status:', response.status);
            const responseText = await response.text();
            console.log('📥 Response:', responseText);
            
            // Check if it's a Fastify validation error
            if (responseText.includes('body must be object')) {
                console.log('⚠️  This looks like a Fastify schema validation issue');
            }
            
            // Try to parse and show full error
            try {
                const jsonData = JSON.parse(responseText);
                console.log('📊 Full Error JSON:', JSON.stringify(jsonData, null, 2));
                if (jsonData.error && jsonData.error.details) {
                    console.log('📋 Error Details:', JSON.stringify(jsonData.error.details, null, 2));
                }
            } catch (e) {
                console.log('📊 Response is not JSON');
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

debugEventosIssue();