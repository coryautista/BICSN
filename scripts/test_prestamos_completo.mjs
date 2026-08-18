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

async function testAllPrestamosEndpoints() {
  try {
    console.log('🔐 Testing login with capturista1...\n');
    
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

    if (loginResponse.data.ok && loginResponse.data.data?.accessToken) {
      console.log('✅ Authentication successful!\n');
      
      const accessToken = loginResponse.data.data.accessToken;

      // ============================================
      // 1. Préstamos a Corto Plazo
      // ============================================
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('1️⃣  PRÉSTAMOS A CORTO PLAZO');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('GET /v1/aportacionesFondos/individuales/prestamos-corto-plazo\n');
      
      const cortoPlazoResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestamos-corto-plazo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', cortoPlazoResponse.status);
      if (cortoPlazoResponse.data.ok) {
        const data = cortoPlazoResponse.data.data;
        console.log(`✅ Éxito! - Clave Orgánica: ${data.clave_organica_0}/${data.clave_organica_1}, Período: ${data.periodo}`);
        console.log(`   Total de préstamos: ${data.prestamos?.length || 0}`);
        if (data.prestamos && data.prestamos.length > 0) {
          console.log(`   Primer préstamo: ${data.prestamos[0].nombre || 'N/A'} (Interno: ${data.prestamos[0].interno})`);
        }
      } else {
        console.log('❌ Error:', cortoPlazoResponse.data.error);
      }

      // ============================================
      // 2. Préstamos a Mediano Plazo
      // ============================================
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('2️⃣  PRÉSTAMOS A MEDIANO PLAZO');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('GET /v1/aportacionesFondos/individuales/prestamos-mediano-plazo\n');
      
      const medianoPlazoResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestamos-mediano-plazo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', medianoPlazoResponse.status);
      if (medianoPlazoResponse.data.ok) {
        const data = medianoPlazoResponse.data.data;
        console.log(`✅ Éxito! - Clave Orgánica: ${data.clave_organica_0}/${data.clave_organica_1}, Período: ${data.periodo}`);
        console.log(`   Total de préstamos: ${data.prestamos?.length || 0}`);
        if (data.prestamos && data.prestamos.length > 0) {
          console.log(`   Primer préstamo: ${data.prestamos[0].nombre || 'N/A'} (Interno: ${data.prestamos[0].interno})`);
        }
      } else {
        console.log('❌ Error:', medianoPlazoResponse.data.error);
      }

      // ============================================
      // 3. Préstamos Hipotecarios (computadoraAntigua = false)
      // ============================================
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('3️⃣  PRÉSTAMOS HIPOTECARIOS (AP_S_HIP_QNA)');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('GET /v1/aportacionesFondos/individuales/prestamos-hipotecarios?computadora_antigua=false\n');
      
      const hipotecariosResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestamos-hipotecarios?computadora_antigua=false', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', hipotecariosResponse.status);
      if (hipotecariosResponse.data.ok) {
        const data = hipotecariosResponse.data.data;
        console.log(`✅ Éxito! - Clave Orgánica: ${data.clave_organica_0}/${data.clave_organica_1}, Período: ${data.periodo}`);
        console.log(`   Computadora Antigua: ${data.computadora_antigua} (AP_S_HIP_QNA)`);
        console.log(`   Total de préstamos: ${data.prestamos?.length || 0}`);
        if (data.prestamos && data.prestamos.length > 0) {
          console.log(`   Primer préstamo: ${data.prestamos[0].nombre || 'N/A'} (Interno: ${data.prestamos[0].interno})`);
        }
      } else {
        console.log('❌ Error:', hipotecariosResponse.data.error);
      }

      // ============================================
      // 4. Préstamos Hipotecarios (computadoraAntigua = true)
      // ============================================
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('4️⃣  PRÉSTAMOS HIPOTECARIOS (AP_S_COMP_QNA)');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('GET /v1/aportacionesFondos/individuales/prestamos-hipotecarios?computadora_antigua=true\n');
      
      const hipotecariosAntiguaResponse = await makeRequest('http://localhost:4000/v1/aportacionesFondos/individuales/prestamos-hipotecarios?computadora_antigua=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', hipotecariosAntiguaResponse.status);
      if (hipotecariosAntiguaResponse.data.ok) {
        const data = hipotecariosAntiguaResponse.data.data;
        console.log(`✅ Éxito! - Clave Orgánica: ${data.clave_organica_0}/${data.clave_organica_1}, Período: ${data.periodo}`);
        console.log(`   Computadora Antigua: ${data.computadora_antigua} (AP_S_COMP_QNA)`);
        console.log(`   Total de préstamos: ${data.prestamos?.length || 0}`);
        if (data.prestamos && data.prestamos.length > 0) {
          console.log(`   Primer préstamo: ${data.prestamos[0].nombre || 'N/A'} (Interno: ${data.prestamos[0].interno})`);
        }
      } else {
        console.log('❌ Error:', hipotecariosAntiguaResponse.data.error);
      }

      // ============================================
      // Resumen Final
      // ============================================
      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('📊 RESUMEN DE PRUEBAS');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`1. Préstamos Corto Plazo:     ${cortoPlazoResponse.data.ok ? '✅ OK' : '❌ ERROR'} (${cortoPlazoResponse.data.data?.prestamos?.length || 0} registros)`);
      console.log(`2. Préstamos Mediano Plazo:  ${medianoPlazoResponse.data.ok ? '✅ OK' : '❌ ERROR'} (${medianoPlazoResponse.data.data?.prestamos?.length || 0} registros)`);
      console.log(`3. Hipotecarios (HIP_QNA):   ${hipotecariosResponse.data.ok ? '✅ OK' : '❌ ERROR'} (${hipotecariosResponse.data.data?.prestamos?.length || 0} registros)`);
      console.log(`4. Hipotecarios (COMP_QNA):  ${hipotecariosAntiguaResponse.data.ok ? '✅ OK' : '❌ ERROR'} (${hipotecariosAntiguaResponse.data.data?.prestamos?.length || 0} registros)`);
      console.log('═══════════════════════════════════════════════════════════════\n');

    } else {
      console.log('❌ Authentication failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testAllPrestamosEndpoints();

