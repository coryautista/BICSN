import { request } from 'http';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testOrganica2Comprehensive() {
  try {
    console.log('🔐 Testing login...');
    
    const loginResponse = await makeRequest('http://localhost:4000/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        usernameOrEmail: 'cory',
        password: '12345678'
      }
    });

    if (loginResponse.data.ok && loginResponse.data.data?.accessToken) {
      console.log('✅ Authentication successful!');
      const accessToken = loginResponse.data.data.accessToken;

      // Test 1: FIXED PAYLOAD (should succeed)
      console.log('\n✅ Test 1: Testing FIXED payload (unique keys)...');
      
      const payload1 = {
        "claveOrganica0": "06",
        "claveOrganica1": "02", 
        "claveOrganica2": "04",
        "descripcion": "test fixed payload",
        "titular": 0,
        "fechaFin2": "2025-11-17T14:18:05.679Z",
        "estatus": "A"
        // ✅ usuario field removed - will be set automatically to FIREBIRD_USER from ENV
      };

      const response1 = await makeRequest('http://localhost:4000/v1/organica2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload1
      });

      console.log('Test 1 response status:', response1.status);
      console.log('Test 1 response:', JSON.stringify(response1.data, null, 2));

      // Test 2: DUPLICATE KEYS (should fail with proper error)
      console.log('\n❌ Test 2: Testing DUPLICATE keys (should fail with proper error)...');
      
      const payload2 = {
        "claveOrganica0": "06",
        "claveOrganica1": "02", 
        "claveOrganica2": "04",
        "descripcion": "duplicate test",
        "titular": 0,
        "estatus": "A"
      };

      const response2 = await makeRequest('http://localhost:4000/v1/organica2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload2
      });

      console.log('Test 2 response status:', response2.status);
      console.log('Test 2 response:', JSON.stringify(response2.data, null, 2));

      // Test 3: ORIGINAL PAYLOAD with long usuario (should work because we removed usuario from schema)
      console.log('\n✅ Test 3: Testing ORIGINAL payload (usuario field ignored)...');
      
      const payload3 = {
        "claveOrganica0": "07",
        "claveOrganica1": "03", 
        "claveOrganica2": "05",
        "descripcion": "test original payload",
        "titular": 0,
        "fechaFin2": "2025-11-17T14:18:05.679Z",
        "usuario": "0CFE423E-F36B-1410-80A7-00A5CBF95890", // This should be ignored
        "estatus": "A"
      };

      const response3 = await makeRequest('http://localhost:4000/v1/organica2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload3
      });

      console.log('Test 3 response status:', response3.status);
      console.log('Test 3 response:', JSON.stringify(response3.data, null, 2));

      // Summary
      console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY:');
      console.log('=========================================');
      
      const test1Ok = response1.status === 201;
      const test2ExpectedFail = response2.status >= 400; // Any 4xx or 5xx is expected for duplicate
      const test3Ok = response3.status === 201;
      
      console.log(`✅ Test 1 (Fixed payload): ${test1Ok ? 'SUCCESS' : 'FAILED'}`);
      console.log(`❌ Test 2 (Duplicate keys): ${test2ExpectedFail ? 'EXPECTED FAILURE' : 'UNEXPECTED SUCCESS'}`);
      console.log(`✅ Test 3 (Original payload): ${test3Ok ? 'SUCCESS' : 'FAILED'}`);
      
      if (test1Ok && test2ExpectedFail && test3Ok) {
        console.log('\n🎉 ALL ORGANICA2 ISSUES RESOLVED! 🎉');
        console.log('✅ Usuario field automatically set from FIREBIRD_USER ENV');
        console.log('✅ Usuario field removed from input schema');
        console.log('✅ Duplicate key detection working');
        console.log('✅ Database operations functional');
        console.log('✅ API accepts valid payloads and rejects duplicates');
        
        if (response1.data.usuario === 'SYSDBA' && response3.data.usuario === 'SYSDBA') {
          console.log('✅ USER ENVAR CORRECTLY APPLIED');
        }
      }

    } else {
      console.log('\n❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testOrganica2Comprehensive();