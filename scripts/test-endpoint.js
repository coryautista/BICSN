/**
 * Script para probar el endpoint de aportaciones con token real
 */

import http from 'http';

const HOST = 'localhost';
const PORT = 4000;
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNjAxNDMzRS1GMzZCLTE0MTAtODBBNy0wMEE1Q0JGOTU4OTAiLCJyb2xlcyI6WyJDYXB0dXJpc3RhIl0sImVudGlkYWRlcyI6W3RydWVdLCJqdGkiOiI4MjgxN2EwZC00ZjAzLTRkMDAtOGUyMS04OGRlMmVkMWEwNzciLCJpc3MiOiJhcGkiLCJhdWQiOiJhcGktY2xpZW50cyIsImlkT3JnYW5pY2EwIjoiMDQiLCJpZE9yZ2FuaWNhMSI6IjI0IiwiaWRPcmdhbmljYTIiOiIwMSIsImlkT3JnYW5pY2EzIjoiMDEiLCJpYXQiOjE3NjU0ODc3ODYsImV4cCI6MTc2NTUzMDk4Nn0.3D7obvOl7WvXiqyssf0bjU5Pl-JEOvMA6oph5FhoDkQ';
const periodo = '2125';

// Para usuarios no admin, no necesitamos pasar pOrg0 y pOrg1 (se toman del token)
// El token tiene idOrganica0='04' e idOrganica1='24'
const path = `/v1/reportes/aplicaciones-qna/aportaciones?periodo=${periodo}`;

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
console.log(`📋 Parámetros: periodo=${periodo} (pOrg0 y pOrg1 se tomarán del token)\n`);

const req = http.request(options, (res) => {
  let data = '';

  console.log(`📡 Status Code: ${res.statusCode}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.success) {
        const registros = response.data || [];
        
        console.log(`✅ Respuesta exitosa`);
        console.log(`📊 Total de registros: ${registros.length}\n`);

        if (registros.length > 0) {
          const primerRegistro = registros[0];
          
          console.log('🔍 Verificando campos calculados en el primer registro:\n');
          
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

          console.log('💰 Campos calculados:');
          let todosPresentes = true;
          camposCalculados.forEach(campo => {
            const valor = primerRegistro[campo];
            const existe = campo in primerRegistro && valor !== undefined && valor !== null;
            const icono = existe ? '✅' : '❌';
            if (existe) {
              console.log(`  ${icono} ${campo}: ${typeof valor === 'number' ? valor.toFixed(2) : valor}`);
            } else {
              console.log(`  ${icono} ${campo}: NO EXISTE`);
              todosPresentes = false;
            }
          });

          console.log('\n🧮 Verificación de fórmulas:');
          
          if (primerRegistro.sueldoBase !== undefined) {
            const sueldoBaseEsperado = ((primerRegistro.sueldom + primerRegistro.otrasPrestaciones + primerRegistro.quinquenios) / 30) * 15;
            const sueldoBaseCorrecto = Math.abs(primerRegistro.sueldoBase - sueldoBaseEsperado) < 0.01;
            console.log(`  ${sueldoBaseCorrecto ? '✅' : '❌'} sueldoBase: ${primerRegistro.sueldoBase.toFixed(2)} (esperado: ${sueldoBaseEsperado.toFixed(2)})`);
          }

          if (primerRegistro.aportacionAhorro !== undefined) {
            const ahorroTotal = (primerRegistro.aportacionAhorroPatron || 0) + (primerRegistro.aportacionAhorroEmpleado || 0);
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

          console.log('\n' + '='.repeat(70));
          if (todosPresentes) {
            console.log('✅ PRUEBA EXITOSA: Todos los campos calculados están presentes');
          } else {
            console.log('❌ PRUEBA FALLIDA: Faltan algunos campos calculados');
          }
          console.log('='.repeat(70) + '\n');

          // Mostrar un ejemplo del primer registro (solo campos relevantes)
          console.log('📄 Ejemplo del primer registro (campos principales):');
          console.log(JSON.stringify({
            interno: primerRegistro.interno,
            nombre: primerRegistro.nombre,
            sueldom: primerRegistro.sueldom,
            otrasPrestaciones: primerRegistro.otrasPrestaciones,
            quinquenios: primerRegistro.quinquenios,
            sueldoBase: primerRegistro.sueldoBase,
            aportacionAhorro: primerRegistro.aportacionAhorro,
            aportacionVivienda: primerRegistro.aportacionVivienda,
            aportacionPrestaciones: primerRegistro.aportacionPrestaciones,
            aportacionCair: primerRegistro.aportacionCair,
            totalAportaciones: primerRegistro.totalAportaciones
          }, null, 2));

        } else {
          console.log('⚠️  No se encontraron registros en la respuesta');
        }
      } else {
        console.log('❌ Error en la respuesta:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Error al parsear la respuesta:', error.message);
      console.log('Respuesta raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error(`\n⚠️  No se pudo conectar al servidor en ${HOST}:${PORT}`);
    console.error('   Asegúrate de que el servidor esté corriendo.\n');
  }
});

req.end();

