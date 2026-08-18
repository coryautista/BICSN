/**
 * Prueba unitaria de las fórmulas de cálculo de aportaciones
 * No requiere servidor ni autenticación
 * 
 * Uso: node test-calculo-aportaciones.js
 */

// Simular la función de cálculo (copiada del repositorio)
function calcularAportacionesDesdeHistorico(registro) {
  const sueldom = registro.sueldom || 0;
  const otrasPrestaciones = registro.otrasPrestaciones || 0;
  const quinquenios = registro.quinquenios || 0;

  // Calcular sueldo base (común para todos los tipos)
  const sueldoBase = ((sueldom + otrasPrestaciones + quinquenios) / 30) * 15;

  // Calcular aportación Ahorro
  const aportacionAhorroPatron = ((sueldom / 30) * 15) * 0.0250; // AFAE - Patrón 2.5%
  const aportacionAhorroEmpleado = ((sueldom / 30) * 15) * 0.050; // AFAA - Empleado 5.0%
  const aportacionAhorro = aportacionAhorroPatron + aportacionAhorroEmpleado;

  // Calcular aportación Vivienda
  const aportacionVivienda = ((sueldom / 30) * 15) * 0.0175; // AFE - Patrón 1.75%

  // Calcular aportación Prestaciones (usa sueldoBase)
  const aportacionPrestacionesPatron = sueldoBase * 0.2225; // AFPE - Patrón 22.25%
  const aportacionPrestacionesEmpleado = sueldoBase * 0.0450; // AFPA - Empleado 4.5%
  const aportacionPrestaciones = aportacionPrestacionesPatron + aportacionPrestacionesEmpleado;

  // Calcular aportación CAIR
  const aportacionCair = ((sueldom / 30) * 15) * 0.020; // AFE - Patrón 2.0%

  // Calcular total de todas las aportaciones
  const totalAportaciones = aportacionAhorro + aportacionVivienda + aportacionPrestaciones + aportacionCair;

  // Retornar registro con campos calculados agregados
  return {
    ...registro,
    sueldoBase,
    aportacionAhorro,
    aportacionAhorroPatron,
    aportacionAhorroEmpleado,
    aportacionVivienda,
    aportacionPrestaciones,
    aportacionPrestacionesPatron,
    aportacionPrestacionesEmpleado,
    aportacionCair,
    totalAportaciones
  };
}

// Casos de prueba
const casosPrueba = [
  {
    nombre: 'Caso 1: Empleado con sueldo base',
    registro: {
      interno: 12345,
      nombre: 'Juan Pérez',
      sueldom: 10000,
      otrasPrestaciones: 1000,
      quinquenios: 500,
      org0: '04',
      org1: '24',
      rfc: 'PEPJ800101ABC'
    }
  },
  {
    nombre: 'Caso 2: Empleado sin prestaciones adicionales',
    registro: {
      interno: 67890,
      nombre: 'María García',
      sueldom: 15000,
      otrasPrestaciones: 0,
      quinquenios: 0,
      org0: '04',
      org1: '24',
      rfc: 'GARM900202DEF'
    }
  },
  {
    nombre: 'Caso 3: Empleado con valores altos',
    registro: {
      interno: 11111,
      nombre: 'Pedro López',
      sueldom: 25000,
      otrasPrestaciones: 2000,
      quinquenios: 1500,
      org0: '04',
      org1: '24',
      rfc: 'LOPP700303GHI'
    }
  }
];

console.log('🧪 PRUEBAS UNITARIAS DE CÁLCULO DE APORTACIONES\n');
console.log('='.repeat(70));

let pruebasExitosas = 0;
let pruebasFallidas = 0;

casosPrueba.forEach((caso, index) => {
  console.log(`\n📋 ${caso.nombre}`);
  console.log('-'.repeat(70));
  
  const resultado = calcularAportacionesDesdeHistorico(caso.registro);
  
  // Verificar que todos los campos calculados existan
  const camposRequeridos = [
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
  
  let casoExitoso = true;
  
  camposRequeridos.forEach(campo => {
    if (resultado[campo] === undefined || resultado[campo] === null) {
      console.log(`  ❌ ${campo}: NO EXISTE`);
      casoExitoso = false;
    } else {
      console.log(`  ✅ ${campo}: ${resultado[campo].toFixed(2)}`);
    }
  });
  
  // Verificar fórmulas
  console.log('\n  🔍 Verificación de fórmulas:');
  
  // Verificar sueldo base
  const sueldoBaseEsperado = ((resultado.sueldom + resultado.otrasPrestaciones + resultado.quinquenios) / 30) * 15;
  const sueldoBaseCorrecto = Math.abs(resultado.sueldoBase - sueldoBaseEsperado) < 0.01;
  console.log(`    ${sueldoBaseCorrecto ? '✅' : '❌'} Sueldo base: ${resultado.sueldoBase.toFixed(2)} (esperado: ${sueldoBaseEsperado.toFixed(2)})`);
  if (!sueldoBaseCorrecto) casoExitoso = false;
  
  // Verificar aportación ahorro
  const ahorroTotal = resultado.aportacionAhorroPatron + resultado.aportacionAhorroEmpleado;
  const ahorroCorrecto = Math.abs(resultado.aportacionAhorro - ahorroTotal) < 0.01;
  console.log(`    ${ahorroCorrecto ? '✅' : '❌'} Aportación ahorro: ${resultado.aportacionAhorro.toFixed(2)} (suma: ${ahorroTotal.toFixed(2)})`);
  if (!ahorroCorrecto) casoExitoso = false;
  
  // Verificar aportación prestaciones
  const prestacionesTotal = resultado.aportacionPrestacionesPatron + resultado.aportacionPrestacionesEmpleado;
  const prestacionesCorrecto = Math.abs(resultado.aportacionPrestaciones - prestacionesTotal) < 0.01;
  console.log(`    ${prestacionesCorrecto ? '✅' : '❌'} Aportación prestaciones: ${resultado.aportacionPrestaciones.toFixed(2)} (suma: ${prestacionesTotal.toFixed(2)})`);
  if (!prestacionesCorrecto) casoExitoso = false;
  
  // Verificar total
  const totalEsperado = resultado.aportacionAhorro + resultado.aportacionVivienda + resultado.aportacionPrestaciones + resultado.aportacionCair;
  const totalCorrecto = Math.abs(resultado.totalAportaciones - totalEsperado) < 0.01;
  console.log(`    ${totalCorrecto ? '✅' : '❌'} Total aportaciones: ${resultado.totalAportaciones.toFixed(2)} (suma: ${totalEsperado.toFixed(2)})`);
  if (!totalCorrecto) casoExitoso = false;
  
  // Verificar porcentajes
  console.log('\n  📊 Verificación de porcentajes:');
  const sueldoQuincenal = (resultado.sueldom / 30) * 15;
  
  const porcentajeAhorroPatron = (resultado.aportacionAhorroPatron / sueldoQuincenal) * 100;
  const porcentajeAhorroPatronCorrecto = Math.abs(porcentajeAhorroPatron - 2.5) < 0.1;
  console.log(`    ${porcentajeAhorroPatronCorrecto ? '✅' : '❌'} Ahorro Patrón: ${porcentajeAhorroPatron.toFixed(2)}% (esperado: 2.5%)`);
  
  const porcentajeAhorroEmpleado = (resultado.aportacionAhorroEmpleado / sueldoQuincenal) * 100;
  const porcentajeAhorroEmpleadoCorrecto = Math.abs(porcentajeAhorroEmpleado - 5.0) < 0.1;
  console.log(`    ${porcentajeAhorroEmpleadoCorrecto ? '✅' : '❌'} Ahorro Empleado: ${porcentajeAhorroEmpleado.toFixed(2)}% (esperado: 5.0%)`);
  
  const porcentajeVivienda = (resultado.aportacionVivienda / sueldoQuincenal) * 100;
  const porcentajeViviendaCorrecto = Math.abs(porcentajeVivienda - 1.75) < 0.1;
  console.log(`    ${porcentajeViviendaCorrecto ? '✅' : '❌'} Vivienda: ${porcentajeVivienda.toFixed(2)}% (esperado: 1.75%)`);
  
  const porcentajeCair = (resultado.aportacionCair / sueldoQuincenal) * 100;
  const porcentajeCairCorrecto = Math.abs(porcentajeCair - 2.0) < 0.1;
  console.log(`    ${porcentajeCairCorrecto ? '✅' : '❌'} CAIR: ${porcentajeCair.toFixed(2)}% (esperado: 2.0%)`);
  
  const porcentajePrestacionesPatron = (resultado.aportacionPrestacionesPatron / resultado.sueldoBase) * 100;
  const porcentajePrestacionesPatronCorrecto = Math.abs(porcentajePrestacionesPatron - 22.25) < 0.1;
  console.log(`    ${porcentajePrestacionesPatronCorrecto ? '✅' : '❌'} Prestaciones Patrón: ${porcentajePrestacionesPatron.toFixed(2)}% (esperado: 22.25%)`);
  
  const porcentajePrestacionesEmpleado = (resultado.aportacionPrestacionesEmpleado / resultado.sueldoBase) * 100;
  const porcentajePrestacionesEmpleadoCorrecto = Math.abs(porcentajePrestacionesEmpleado - 4.5) < 0.1;
  console.log(`    ${porcentajePrestacionesEmpleadoCorrecto ? '✅' : '❌'} Prestaciones Empleado: ${porcentajePrestacionesEmpleado.toFixed(2)}% (esperado: 4.5%)`);
  
  if (casoExitoso && porcentajeAhorroPatronCorrecto && porcentajeAhorroEmpleadoCorrecto && 
      porcentajeViviendaCorrecto && porcentajeCairCorrecto && porcentajePrestacionesPatronCorrecto && 
      porcentajePrestacionesEmpleadoCorrecto) {
    console.log(`\n  ✅ CASO ${index + 1} EXITOSO`);
    pruebasExitosas++;
  } else {
    console.log(`\n  ❌ CASO ${index + 1} FALLIDO`);
    pruebasFallidas++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\n📊 RESUMEN DE PRUEBAS:`);
console.log(`   ✅ Exitosas: ${pruebasExitosas}/${casosPrueba.length}`);
console.log(`   ❌ Fallidas: ${pruebasFallidas}/${casosPrueba.length}`);

if (pruebasFallidas === 0) {
  console.log(`\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!\n`);
  process.exit(0);
} else {
  console.log(`\n⚠️  ALGUNAS PRUEBAS FALLARON\n`);
  process.exit(1);
}

