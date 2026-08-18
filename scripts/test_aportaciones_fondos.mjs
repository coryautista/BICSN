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

async function testAportacionesFondos() {
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

    if (loginResponse.data.ok && loginResponse.data.data?.accessToken) {
      console.log('\n✅ Authentication successful!');
      
      const accessToken = loginResponse.data.data.accessToken;

      // Test individual contributions - Vivienda
      console.log('\nTesting aportaciones individuales - vivienda...');
      
      const viviendaResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/vivienda', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Vivienda response status:', viviendaResponse.status);
      console.log('Vivienda response:', JSON.stringify(viviendaResponse.data, null, 2));

      if (viviendaResponse.data.ok) {
        console.log('\n✅ Vivienda test successful! Found data.');
      } else {
        console.log('\n❌ Vivienda test failed:', viviendaResponse.data.error);
      }

      // Test individual contributions - Prestaciones
      console.log('\nTesting aportaciones individuales - prestaciones...');
      
      const prestacionesResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestaciones', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Prestaciones response status:', prestacionesResponse.status);
      console.log('Prestaciones response:', JSON.stringify(prestacionesResponse.data, null, 2));

      if (prestacionesResponse.data.ok) {
        console.log('\n✅ Prestaciones test successful! Found data.');
      } else {
        console.log('\n❌ Prestaciones test failed:', prestacionesResponse.data.error);
      }

    } else {
      console.log('\n❌ Authentication failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAportacionesFondos();