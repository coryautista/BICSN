const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
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

async function testAuthentication() {
  try {
    console.log('Testing login...');
    
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

    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.ok && loginResponse.data.data?.accessToken) {
      console.log('\n✅ Authentication successful!');
      console.log('Access token:', loginResponse.data.data.accessToken.substring(0, 50) + '...');

      // Test the afiliados aprobados endpoint
      console.log('\nTesting afiliados aprobados endpoint...');
      
      const afiliadosResponse = await makeRequest('http://localhost:4000/v1/afiliado/aprobados', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Afiliados response status:', afiliadosResponse.status);
      console.log('Afiliados response:', JSON.stringify(afiliadosResponse.data, null, 2));

      if (afiliadosResponse.data.ok) {
        console.log('\n✅ Test successful! The endpoint is working.');
        console.log('Found', afiliadosResponse.data.data?.length || 0, 'approved affiliates');
      } else {
        console.log('\n❌ Test failed:', afiliadosResponse.data.error);
      }
    } else {
      console.log('\n❌ Authentication failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuthentication();