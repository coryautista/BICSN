# Regla de Quinquenios para Prestaciones Economicas

## Objetivo

Unificar el valor de quinquenios usado en:

- Modal de `/dependencia/aportaciones-proceso`.
- Exportaciones CSV/TXT de prestaciones.
- Calculo de aportacion al fondo de prestaciones economicas.
- Historico guardado al aplicar quincena.

Tambien corregir el calculo de la aportacion del afiliado (`AFPA`) para que use solo sueldo proporcional, sin quinquenios ni otras prestaciones.

## Regla Confirmada

Para prestaciones economicas, el valor de quinquenios aplicado debe resolverse asi:

1. Si existe `dbo.NominaAplicacionQnalDetalle.BaseCotizacionQuinquenios`, usar ese valor.
2. Si no existe, usar `quinquenios / 2`.

No se debe usar `quinquenios / 30 * dias_laborados` como fallback para quinquenios de prestaciones.

## Regla Confirmada Para AFPA

Para prestaciones economicas, `AFPA` debe calcularse solo sobre sueldo proporcional.

No debe incluir:

- Quinquenios.
- Otras prestaciones.

El patron (`AFPE`) si conserva la base completa.

```text
sueldo_proporcional = sueldo / 30 * dias
quinquenios_aplicado = BaseCotizacionQuinquenios ?? quinquenios / 2
sueldo_base = sueldo_proporcional + otras_prestaciones_aplicado + quinquenios_aplicado

AFPE = sueldo_base * porcentaje_patron
AFPA = sueldo_proporcional * porcentaje_afiliado
total = AFPE + AFPA
```

### Presentacion del sueldo en Prestaciones

La columna `Sueldo base de cotizacion` del modal y sus exportaciones CSV/TXT muestra exclusivamente `sueldo_proporcional`, calculado con los dias laborados resueltos:

```text
sueldo_proporcional = sueldo_mensual / 30 * dias_laborados
```

No debe mostrar `sueldo`, porque es mensual, ni `sueldo_base`, porque esa base completa tambien incluye otras prestaciones proporcionales y quinquenios aplicados para AFPE.

## Justificacion

Cuando hay dias laborados reales por nomina, el valor proporcional ya debe venir calculado y guardado en:

```sql
dbo.NominaAplicacionQnalDetalle.BaseCotizacionQuinquenios
```

Por lo tanto:

- Con nomina: se usa lo guardado en nomina.
- Sin nomina: se conserva el comportamiento quincenal fijo actual usando `quinquenios / 2`.

## Fuentes De Datos

### Fuente Principal

```sql
[SII-ISSSSPEA-PROD].[dbo].[NominaAplicacionQnalDetalle].BaseCotizacionQuinquenios
```

Filtrar por:

```sql
Anio
Quincena
Organica0
Organica1
RFC
```

### Fuente Fallback

```sql
Firebird.ORG_PERSONAL.QUINQUENIOS
```

Valor aplicado:

```text
ORG_PERSONAL.QUINQUENIOS / 2
```

## Comportamiento Esperado

### Si Existe Nomina

```text
Modal Quinquenios = BaseCotizacionQuinquenios
Historico Quinquenios = BaseCotizacionQuinquenios
Calculo prestaciones usa BaseCotizacionQuinquenios para sueldo_base y AFPE
AFPA usa solo sueldo proporcional
```

### Si No Existe Nomina

```text
Modal Quinquenios = quinquenios / 2
Historico Quinquenios = quinquenios / 2
Calculo prestaciones usa quinquenios / 2 para sueldo_base y AFPE
AFPA usa solo sueldo proporcional
```

## Fases De Implementacion

## Fase 1: Backend Aportaciones En Vivo

Archivo:

```text
src/modules/aportacionesFondos/infrastructure/persistence/AportacionFondoRepository.ts
```

Cambios:

1. Extender el lookup actual de `dbo.NominaAplicacionQnalDetalle`.
2. Actualmente se consulta `DiasLaborados`.
3. Agregar:

```sql
BaseCotizacionQuinquenios
```

4. Cambiar el mapa actual para incluir:

```ts
{
  dias: number;
  origen: 'nomina' | 'default';
  baseCotizacionQuinquenios: number | null;
}
```

5. En calculo de prestaciones:

```ts
const quinqueniosAplicado =
  nomina?.baseCotizacionQuinquenios ?? quinquenios / 2;
```

6. Usar `quinqueniosAplicado` para:

```text
sueldo_base
afpe
total
```

7. No usar `quinqueniosAplicado` para `afpa`.

8. Para prestaciones, calcular:

```ts
const sueldoBase = sueldoProporcional + otrasPrestacionesProporcional + quinqueniosAplicado;
const afpe = sueldoBase * porcentajes.porcentajePatron;
const afpa = sueldoProporcional * (porcentajes.porcentajeAfiliado ?? 0);
const total = afpe + afpa;
```

9. Exponer en respuesta:

```ts
base_cotizacion_quinquenios
quinquenios_aplicado
```

## Fase 2: Frontend Modal Y Exportaciones

Archivos:

```text
src/services/aportaciones-proceso/aportaciones-proceso.api.ts
src/widgets/aportaciones-proceso/resumen-aportaciones-proceso.tsx
```

Cambios:

1. Mapear los campos nuevos:

```ts
base_cotizacion_quinquenios
quinquenios_aplicado
BaseCotizacionQuinquenios
```

2. Crear helper:

```ts
function getQuinqueniosPrestaciones(item) {
  return (
    item.base_cotizacion_quinquenios ??
    item.quinquenios_aplicado ??
    (item.quinquenios ?? 0) / 2
  );
}
```

3. Usar el helper en:

- Columna `Quinquenios` del modal.
- CSV de prestaciones.
- TXT de prestaciones.

## Fase 3: Backend Historico Al Aplicar Quincena

Archivo:

```text
src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts
```

Cambios:

1. Extender el lookup historico de `dbo.NominaAplicacionQnalDetalle`.
2. Agregar:

```sql
BaseCotizacionQuinquenios
```

3. Para prestaciones:

```ts
const quinqueniosAplicado =
  baseCotizacionQuinquenios ?? quinquenios / 2;
```

4. Usar `quinqueniosAplicado` para recalcular:

```text
sueldo_base
afpe
total
```

5. No usar `quinqueniosAplicado`, `otras_prestaciones` ni `sueldo_base` para calcular `afpa`.

6. Para historico de prestaciones, calcular:

```ts
const sueldoBase = sueldoProporcional + otrasPrestacionesProporcional + quinqueniosAplicado;
const afpe = sueldoBase * porcentajes.porcentajePatron;
const afpa = sueldoProporcional * porcentajes.porcentajeAfiliado;
const total = afpe + afpa;
```

7. Sobrescribir el valor que se guarda en historico:

```ts
quinquenios: quinqueniosAplicado
```

## Fase 4: Schemas Y Tipos

Backend:

```text
src/modules/aportacionesFondos/domain/entities/AportacionFondo.ts
src/modules/aportacionesFondos/aportacionesFondos.schemas.ts
```

Frontend:

```text
src/entities/aportaciones-proceso/aportaciones-proceso.types.ts
src/services/aportaciones-proceso/aportaciones-proceso.api.ts
```

Agregar campos opcionales:

```ts
base_cotizacion_quinquenios?: number | null;
quinquenios_aplicado?: number | null;
```

## Fase 5: Validacion

Casos a probar:

1. Registro con nomina y `BaseCotizacionQuinquenios`.
   - Modal muestra `BaseCotizacionQuinquenios`.
   - CSV/TXT muestran el mismo valor.
   - Calculo de `AFPE` usa sueldo base con `BaseCotizacionQuinquenios`.
   - Calculo de `AFPA` usa solo sueldo proporcional.
   - Historico guarda ese valor.

2. Registro sin nomina.
   - Modal muestra `quinquenios / 2`.
   - CSV/TXT muestran `quinquenios / 2`.
   - Calculo de `AFPE` usa sueldo base con `quinquenios / 2`.
   - Calculo de `AFPA` usa solo sueldo proporcional.
   - Historico guarda `quinquenios / 2`.

3. Validar ejemplo interno `46229` con regla corregida.
   - Sueldo mensual: `18757.85`.
   - Quinquenios mensual actual Firebird: `1209.76`.
   - Sueldo proporcional 15 dias: `9378.925`.
   - Quinquenio fallback 15 dias: `604.88`.
   - Sueldo base fallback: `9983.805`.
   - `AFPE = 9983.805 * 0.2225 = 2221.40`.
   - `AFPA = 9378.925 * 0.045 = 422.05`.
   - `Total = 2643.45`.

4. Build backend:

```bash
npm run build
```

5. Build frontend:

```bash
npm run build
```

## Notas

No modificar DDL automaticamente.

Si el historico no tiene columna separada para `base_cotizacion_quinquenios`, guardar el valor aplicado en la columna existente `quinquenios`.

Esta regla aplica unicamente para prestaciones economicas.
