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

async function testPrestamos() {
  try {
    console.log('🔐 Testing login with capturista1...');
    
    const loginResponse = await makeRequest('http://localhost:4000/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        usernameOrEmail: 'capturista1',
        password: '12345678'
      }
    });

    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.ok && loginResponse.data.data?.accessToken) {
      console.log('\n✅ Authentication successful!');
      console.log('Access token:', loginResponse.data.data.accessToken.substring(0, 50) + '...');
      
      const accessToken = loginResponse.data.data.accessToken;

      // Test préstamos endpoint
      console.log('\n💰 Testing préstamos endpoint...');
      console.log('GET /v1/aportacionesFondos/individuales/prestamos');
      
      const prestamosResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestamos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('\n📊 Préstamos response status:', prestamosResponse.status);
      console.log('Préstamos response:', JSON.stringify(prestamosResponse.data, null, 2));

      if (prestamosResponse.data.ok) {
        console.log('\n✅ Préstamos test successful!');
        const data = prestamosResponse.data.data;
        console.log(`\n📋 Resumen:`);
        console.log(`   - Clave Orgánica 0: ${data.clave_organica_0}`);
        console.log(`   - Clave Orgánica 1: ${data.clave_organica_1}`);
        console.log(`   - Período: ${data.periodo}`);
        console.log(`   - Total de préstamos: ${data.prestamos?.length || 0}`);
        
        if (data.prestamos && data.prestamos.length > 0) {
          console.log(`\n📝 Primeros 3 préstamos:`);
          data.prestamos.slice(0, 3).forEach((prestamo, index) => {
            console.log(`\n   Préstamo ${index + 1}:`);
            console.log(`     - Interno: ${prestamo.interno}`);
            console.log(`     - Nombre: ${prestamo.nombre || 'N/A'}`);
            console.log(`     - RFC: ${prestamo.rfc || 'N/A'}`);
            console.log(`     - Préstamo: ${prestamo.prestamo || 'N/A'}`);
            console.log(`     - Letra: ${prestamo.letra || 'N/A'}`);
            console.log(`     - Capital: ${prestamo.capital || 'N/A'}`);
            console.log(`     - Interés: ${prestamo.interes || 'N/A'}`);
            console.log(`     - Total: ${prestamo.total || 'N/A'}`);
          });
        } else {
          console.log('\n⚠️  No se encontraron préstamos para este período y orgánica.');
        }
      } else {
        console.log('\n❌ Préstamos test failed:', prestamosResponse.data.error);
      }
    } else {
      console.log('\n❌ Authentication failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testPrestamos();

