/**
 * Script de prueba para el endpoint de aportaciones
 * Verifica que los campos calculados estén presentes en la respuesta
 * 
 * Uso: node test-aportaciones.js
 * 
 * Nota: Requiere que el servidor esté corriendo y que tengas un token de autenticación válido
 */

const http = require('http');

// Configuración - Ajusta estos valores según tu entorno
const HOST = 'localhost';
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.AUTH_TOKEN || ''; // Necesitas un token válido de admin

// Parámetros de prueba - Ajusta según tus datos de prueba
const pOrg0 = '04';
const pOrg1 = '24';
const periodo = '2125';

// Función para hacer la petición
function testAportaciones() {
  return new Promise((resolve, reject) => {
    const path = `/v1/reportes/aplicaciones-qna/aportaciones?pOrg0=${pOrg0}&pOrg1=${pOrg1}&periodo=${periodo}`;
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    console.log(`\n🔍 Probando endpoint: http://${HOST}:${PORT}${path}`);
    console.log(`📋 Parámetros: pOrg0=${pOrg0}, pOrg1=${pOrg1}, periodo=${periodo}\n`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`✅ Status Code: ${res.statusCode}`);
          console.log(`📦 Respuesta recibida\n`);

          if (res.statusCode === 200 && response.success) {
            const registros = response.data || [];
            
            console.log(`📊 Total de registros: ${registros.length}\n`);

            if (registros.length > 0) {
              const primerRegistro = registros[0];
              
              console.log('🔍 Verificando campos calculados en el primer registro:\n');
              
              // Campos requeridos del histórico
              const camposHistoricos = [
                'interno', 'nombre', 'sueldom', 'otrasPrestaciones', 
                'quinquenios', 'org0', 'org1', 'rfc'
              ];
              
              // Campos calculados que deben estar presentes
              const camposCalculados = [
                'sueldoBase',
                'aportacionAhorro',
                'aportacionAhorroPatron',
                'aportacionAhorroEmpleado',
                'aportacionVivienda',
                'aportacionPrestaciones',
                'aportacionPrestacionesPatron',
                'aportacionPrestacionesEmpleado',
                'aportacionCair',
                'totalAportaciones'
              ];

              console.log('📋 Campos del histórico:');
              camposHistoricos.forEach(campo => {
                const valor = primerRegistro[campo];
                const existe = campo in primerRegistro;
                const icono = existe ? '✅' : '❌';
                console.log(`  ${icono} ${campo}: ${valor !== undefined ? JSON.stringify(valor) : 'NO EXISTE'}`);
              });

              console.log('\n💰 Campos calculados:');
              let todosPresentes = true;
              camposCalculados.forEach(campo => {
                const valor = primerRegistro[campo];
                const existe = campo in primerRegistro && valor !== undefined && valor !== null;
                const icono = existe ? '✅' : '❌';
                console.log(`  ${icono} ${campo}: ${existe ? valor.toFixed(2) : 'NO EXISTE'}`);
                if (!existe) todosPresentes = false;
              });

              console.log('\n🧮 Verificación de fórmulas:');
              
              if (primerRegistro.sueldoBase !== undefined) {
                const sueldoBaseEsperado = ((primerRegistro.sueldom + primerRegistro.otrasPrestaciones + primerRegistro.quinquenios) / 30) * 15;
                const sueldoBaseCorrecto = Math.abs(primerRegistro.sueldoBase - sueldoBaseEsperado) < 0.01;
                console.log(`  ${sueldoBaseCorrecto ? '✅' : '❌'} sueldoBase: ${primerRegistro.sueldoBase.toFixed(2)} (esperado: ${sueldoBaseEsperado.toFixed(2)})`);
              }

              if (primerRegistro.aportacionAhorro !== undefined && primerRegistro.aportacionAhorroPatron !== undefined && primerRegistro.aportacionAhorroEmpleado !== undefined) {
                const ahorroTotal = primerRegistro.aportacionAhorroPatron + primerRegistro.aportacionAhorroEmpleado;
                const ahorroCorrecto = Math.abs(primerRegistro.aportacionAhorro - ahorroTotal) < 0.01;
                console.log(`  ${ahorroCorrecto ? '✅' : '❌'} aportacionAhorro: ${primerRegistro.aportacionAhorro.toFixed(2)} (suma: ${ahorroTotal.toFixed(2)})`);
              }

              if (primerRegistro.totalAportaciones !== undefined) {
                const totalEsperado = (primerRegistro.aportacionAhorro || 0) + 
                                     (primerRegistro.aportacionVivienda || 0) + 
                                     (primerRegistro.aportacionPrestaciones || 0) + 
                                     (primerRegistro.aportacionCair || 0);
                const totalCorrecto = Math.abs(primerRegistro.totalAportaciones - totalEsperado) < 0.01;
                console.log(`  ${totalCorrecto ? '✅' : '❌'} totalAportaciones: ${primerRegistro.totalAportaciones.toFixed(2)} (suma: ${totalEsperado.toFixed(2)})`);
              }

              console.log('\n' + '='.repeat(60));
              if (todosPresentes) {
                console.log('✅ PRUEBA EXITOSA: Todos los campos calculados están presentes');
              } else {
                console.log('❌ PRUEBA FALLIDA: Faltan algunos campos calculados');
              }
              console.log('='.repeat(60) + '\n');

              // Mostrar un ejemplo completo del primer registro
              console.log('📄 Ejemplo del primer registro completo:');
              console.log(JSON.stringify(primerRegistro, null, 2));

            } else {
              console.log('⚠️  No se encontraron registros en la respuesta');
            }
          } else {
            console.log('❌ Error en la respuesta:');
            console.log(JSON.stringify(response, null, 2));
          }

          resolve(response);
        } catch (error) {
          console.error('❌ Error al parsear la respuesta:', error.message);
          console.log('Respuesta raw:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error(`\n⚠️  No se pudo conectar al servidor en ${HOST}:${PORT}`);
        console.error('   Asegúrate de que el servidor esté corriendo.\n');
      }
      reject(error);
    });

    req.end();
  });
}

// Ejecutar la prueba
if (require.main === module) {
  if (!TOKEN) {
    console.error('❌ Error: Se requiere un token de autenticación');
    console.error('   Establece la variable de entorno AUTH_TOKEN o modifica el script\n');
    process.exit(1);
  }

  testAportaciones()
    .then(() => {
      console.log('✅ Prueba completada\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Prueba fallida:', error.message);
      process.exit(1);
    });
}

module.exports = { testAportaciones };

