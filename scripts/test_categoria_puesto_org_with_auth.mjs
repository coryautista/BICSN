import http from 'http';

// Step 1: Get authentication token
function getAuthToken() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      usernameOrEmail: "cory",
      password: "12345678"
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    console.log('Step 1: Authenticating...');
    const req = http.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (parsed.data && parsed.data.accessToken) {
            console.log('✓ Authentication successful');
            resolve(parsed.data.accessToken);
          } else {
            console.log('Authentication response:', JSON.stringify(parsed, null, 2));
            reject(new Error('No access token in response'));
          }
        } catch (e) {
          reject(new Error('Failed to parse auth response: ' + responseBody));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(loginData);
    req.end();
  });
}

// Step 2: Test categoria-puesto-org endpoint
function testCategoriaPuestoOrg(token) {
  return new Promise((resolve, reject) => {
    const payload = {
      "nivel": 3,
      "org0": "04",
      "org1": "44",
      "org2": "",
      "org3": "",
      "categoria": "INSTITUTO AGUASCALENTENSE DE LAS MES",
      "nombreCategoria": "ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL ",
      "ingresoBrutoMensual": 14462,
      "vigenciaInicio": "2025-11-17T04:40:29.534Z",
      "vigenciaFin": "2025-11-17T04:40:29.534Z"
    };

    const data = JSON.stringify(payload);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/v1/categoria-puesto-org',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('\nStep 2: Testing POST /v1/categoria-puesto-org');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('---');

    const req = http.request(options, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      console.log('---');

      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        console.log('Response Body:');
        try {
          const parsed = JSON.parse(responseBody);
          console.log(JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log(responseBody);
          resolve(responseBody);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Run the test
(async () => {
  try {
    const token = await getAuthToken();
    await testCategoriaPuestoOrg(token);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
})();
