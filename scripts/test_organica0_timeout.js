const axios = require('axios');

async function testOrganica0Timeout() {
    const baseURL = 'http://127.0.0.1:4000/v1';
    
    try {
        // First, login to get JWT token
        console.log('🔐 Attempting login with admin user...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            usuario: 'cory',
            password: '12345678'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful, got token');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test 1: Without pagination (original problematic case)
        console.log('\n📊 Test 1: GET organica0 WITHOUT pagination (admin user)');
        const startTime1 = Date.now();
        
        try {
            const response1 = await axios.get(`${baseURL}/organica0`, { 
                headers,
                timeout: 10000 // 10 second timeout
            });
            
            const endTime1 = Date.now();
            const duration1 = endTime1 - startTime1;
            
            console.log(`✅ Response received in ${duration1}ms`);
            console.log(`📦 Records returned: ${response1.data.data?.length || 0}`);
            console.log(`📄 Has pagination: ${response1.data.pagination ? 'Yes' : 'No'}`);
            
        } catch (error1) {
            const endTime1 = Date.now();
            const duration1 = endTime1 - startTime1;
            
            if (error1.code === 'ECONNABORTED' || duration1 > 9000) {
                console.log(`❌ TIMEOUT DETECTED: Request took ${duration1}ms (>10s)`);
            } else {
                console.log(`❌ Error in Test 1: ${error1.message}`);
            }
        }
        
        // Test 2: With pagination (should be faster)
        console.log('\n📊 Test 2: GET organica0 WITH pagination (admin user)');
        const startTime2 = Date.now();
        
        try {
            const response2 = await axios.get(`${baseURL}/organica0?limit=50&offset=0`, { 
                headers,
                timeout: 5000 // 5 second timeout
            });
            
            const endTime2 = Date.now();
            const duration2 = endTime2 - startTime2;
            
            console.log(`✅ Response received in ${duration2}ms`);
            console.log(`📦 Records returned: ${response2.data.data?.length || 0}`);
            console.log(`📄 Pagination info:`, response2.data.pagination);
            
        } catch (error2) {
            const endTime2 = Date.now();
            const duration2 = endTime2 - startTime2;
            
            if (error2.code === 'ECONNABORTED' || duration2 > 4000) {
                console.log(`❌ TIMEOUT DETECTED: Request took ${duration2}ms (>5s)`);
            } else {
                console.log(`❌ Error in Test 2: ${error2.message}`);
            }
        }
        
        // Test 3: Check logs for performance indicators
        console.log('\n📋 Test 3: Performance summary');
        console.log('Check the server console for performance logs:');
        console.log('- Look for "[DEBUG] [ID] listOrganica0: Total function time: XXXms"');
        console.log('- Look for "[SERVICE] getAllOrganica0: Completed in XXXms"');
        console.log('- Look for "[ROUTE] organica0 GET: Completed in XXXms"');
        console.log('\n✅ All tests completed');
        
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        if (error.response?.data) {
            console.error('📄 Response data:', error.response.data);
        }
    }
}

// Run the test
testOrganica0Timeout().catch(console.error);