// Test script to debug eventos-calendario API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MTdFNDMzRS1GMzZCLTE0MTAtODBBNi0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJhZG1pbiJdLCJlbnRpZGFkZXMiOltmYWxzZV0sImp0aSI6IjdiNmJkM2E3LWUyOTUtNDgyOS1hMGE1LWE1ZmZlYzEwNWYyMCIsImlzcyI6ImFwaSIsImF1ZCI6ImFwaS1jbGllbnRzIiwiaWRPcmdhbmljYTAiOiIwNCIsImlkT3JnYW5pY2ExIjoiNDQiLCJpZE9yZ2FuaWNhMiI6bnVsbCwiaWRPcmdhbmljYTMiOm51bGwsImlhdCI6MTc2MzE4NzkwMSwiZXhwIjoxNzYzMjMxMTAxfQ.PWS7UN1c71skOIkbiJMA_kXINIUzYZIxRJEVHlDDu2Q';

async function testEventosCalendario() {
    console.log('🧪 Testing eventos-calendario endpoint...\n');
    
    // Test 1: Create evento with ALTA_BAJA_CAMBIO
    const createData = {
        fecha: "2025-11-15",
        tipo: "ALTA_BAJA_CAMBIO",
        anio: 2025
    };
    
    console.log('📤 POST /eventos-calendario');
    console.log('Data:', JSON.stringify(createData, null, 2));
    
    try {
        const response = await fetch(`${BASE_URL}/eventos-calendario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(createData)
        });
        
        const responseText = await response.text();
        console.log('📥 Status:', response.status);
        console.log('📥 Response:', responseText);
        
        if (!response.ok) {
            console.log('❌ Error details:', responseText);
        } else {
            console.log('✅ Success!');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Create evento with valid tipo (for comparison)
    const validData = {
        fecha: "2025-11-16",
        tipo: "FERIADO",
        anio: 2025
    };
    
    console.log('📤 POST /eventos-calendario (valid tipo)');
    console.log('Data:', JSON.stringify(validData, null, 2));
    
    try {
        const response = await fetch(`${BASE_URL}/eventos-calendario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(validData)
        });
        
        const responseText = await response.text();
        console.log('📥 Status:', response.status);
        console.log('📥 Response:', responseText);
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testEventosCalendario();