// Test to check the exact parsing issue
const BASE_URL = 'http://localhost:4000/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6IjdiNmJkM2E3LWUyOTUtNDgyOS1hMGE1LWE1ZmZlYzEwNWYyMCIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2MzE4NzkwMSwiZXhwIjoxNzYzMjMxMTAxfQ.PWS7UN1c71skOIkbiJMA_kXINIUzYZIxRJEVHlDDu2Q';

async function testRequestParsing() {
    console.log('🔍 Testing request body parsing...\n');
    
    // Test different body formats to identify the issue
    const testCases = [
        {
            name: 'Valid data - ALTA_BAJA_CAMBIO',
            data: { fecha: "2025-11-15", tipo: "ALTA_BAJA_CAMBIO", anio: 2025 }
        },
        {
            name: 'Valid data - FERIADO (for comparison)',
            data: { fecha: "2025-11-15", tipo: "FERIADO", anio: 2025 }
        },
        {
            name: 'Minimal data',
            data: { fecha: "2025-11-15", tipo: "ALTA_BAJA_CAMBIO", anio: 2025 }
        },
        {
            name: 'String anio (should fail)',
            data: { fecha: "2025-11-15", tipo: "ALTA_BAJA_CAMBIO", anio: "2025" }
        },
        {
            name: 'Invalid tipo',
            data: { fecha: "2025-11-15", tipo: "INVALID", anio: 2025 }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🧪 ${testCase.name}`);
        console.log('Data:', JSON.stringify(testCase.data, null, 2));
        
        try {
            const response = await fetch(`${BASE_URL}/eventos-calendario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(testCase.data)
            });
            
            console.log('📥 Status:', response.status);
            const responseText = await response.text();
            console.log('📥 Response:', responseText);
            
            // Check if it's the Fastify "body must be object" error
            if (responseText.includes('body must be object') || responseText.includes('body')) {
                console.log('⚠️  Fastify body parsing error detected');
            }
            
            // Try to parse the response
            try {
                const jsonData = JSON.parse(responseText);
                if (jsonData.error && jsonData.error.message) {
                    console.log('📋 Error Message:', jsonData.error.message);
                }
                if (jsonData.error && jsonData.error.details) {
                    console.log('📋 Error Details:', JSON.stringify(jsonData.error.details, null, 2));
                }
            } catch (e) {
                console.log('📊 Response is not valid JSON');
            }
            
        } catch (error) {
            console.error('❌ Network error:', error.message);
        }
    }
}

testRequestParsing();