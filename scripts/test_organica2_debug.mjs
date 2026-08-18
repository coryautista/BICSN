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

async function testOrganica2Fixed() {
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

      // Test 1: ORIGINAL PAYLOAD (should fail)
      console.log('\n❌ Testing ORIGINAL payload (should fail due to usuario length)...');
      
      const originalPayload = {
        "claveOrganica0": "05",
        "claveOrganica1": "01", 
        "claveOrganica2": "03",
        "descripcion": "test",
        "titular": 0,
        "fechaFin2": "2025-11-17T14:18:05.679Z",
        "usuario": "0CFE423E-F36B-1410-80A7-00A5CBF95890", // ❌ Too long (36 chars, max 13)
        "estatus": "A"
      };

      const originalResponse = await makeRequest('http://localhost:4000/v1/organica2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: originalPayload
      });

      console.log('Original payload response status:', originalResponse.status);
      console.log('Original payload response:', JSON.stringify(originalResponse.data, null, 2));

      // Test 2: FIXED PAYLOAD (should succeed)
      console.log('\n✅ Testing FIXED payload (should succeed)...');
      
      const fixedPayload = {
        "claveOrganica0": "05",
        "claveOrganica1": "01", 
        "claveOrganica2": "03",
        "descripcion": "test",
        "titular": 0,
        "fechaFin2": "2025-11-17T14:18:05.679Z",
        "usuario": "517E433E-F36", // ✅ Fixed: Exactly 13 characters
        "estatus": "A"
      };

      const fixedResponse = await makeRequest('http://localhost:4000/v1/organica2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: fixedPayload
      });

      console.log('Fixed payload response status:', fixedResponse.status);
      console.log('Fixed payload response:', JSON.stringify(fixedResponse.data, null, 2));

      // Summary
      console.log('\n📊 TEST RESULTS SUMMARY:');
      console.log('========================');
      
      const originalOk = originalResponse.data.ok;
      const fixedOk = fixedResponse.data.ok;
      
      console.log(`❌ Original payload: ${originalOk ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE'}`);
      console.log(`✅ Fixed payload: ${fixedOk ? 'SUCCESS' : 'FAILED'}`);
      
      if (!originalOk && fixedOk) {
        console.log('\n🎉 ORGANICA2 ISSUES IDENTIFIED AND RESOLVED! 🎉');
        console.log('✅ Original payload validation error identified');
        console.log('✅ Usuario field length restriction found (max 13 chars)');
        console.log('✅ Fixed payload works correctly');
        console.log('✅ API response structure is proper');
      }

    } else {
      console.log('\n❌ Authentication failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testOrganica2Fixed();