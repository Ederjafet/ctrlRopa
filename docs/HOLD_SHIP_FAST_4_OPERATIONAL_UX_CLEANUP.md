# HOLD-SHIP-FAST-4 - Limpieza UX operativa de apartados

## 1. Resumen ejecutivo

HOLD-SHIP-FAST-4 optimiza `/reservations` para que funcione como tablero operativo mas claro y compacto, alineado al flujo:

```text
Apartado -> Cliente formal / interesado -> Paquete -> Caja -> Pago -> Envio
```

La fase no crea pantalla nueva, no toca backend, no agrega polling y no consulta pagos por cada apartado. El foco fue reducir ruido visual, destacar interesados/alias, dejar una sola accion principal por apartado y limitar la lista inicial para que la pantalla sea mas manejable en PC y celular.

## 2. Problemas corregidos

- Se elimino la sensacion de encabezado duplicado.
- Se redujo la altura visual de la pantalla.
- Se retiro el bloque grande de `Siguiente accion` que repetia el boton principal.
- Se destacaron los apartados con alias/interesado.
- Se agregaron tabs `Interesados` y `Clientes`.
- Se agrego limite inicial de 25 apartados con `Cargar mas`.
- Se movieron acciones secundarias a `Mas acciones`.
- Se renombro la accion conceptual de cierre LIVE a `Venta inmediata LIVE`.

## 3. Encabezado unificado

El encabezado operativo queda concentrado en la barra superior del shell:

```text
PANEL OPERATIVO
Apartados y reservas
Control de apartados, cliente/interesado, paquete, caja, pago y envio
Compania / Sucursal
```

`Actualizar` vive en ese encabezado, junto al control de modo oscuro. La accion conserva busqueda, tab y filtros porque solo recarga datos y no reinicia estado local.

## 4. CLIENTE vs INTERESADO

Cada card prioriza la persona despues del folio:

- Cliente formal: badge `CLIENTE` y nombre/ID.
- Alias: badge `INTERESADO`, nombre del alias y badge `Falta cliente`.

El alias se muestra con tratamiento visual de alerta para recordar que requiere seguimiento operativo antes de paquete/envio.

## 5. Nueva prioridad de accion principal

Cada apartado muestra una sola accion principal:

- Interesado sin cliente formal: `Vincular cliente`.
- Cliente formal: `Crear paquete`.
- Apartado no activo: `Ver detalle`.

`Vincular cliente` queda deshabilitado con mensaje claro porque aun falta el endpoint/pantalla auditada para vincular o convertir alias en cliente formal. No se crean clientes fake.

## 6. Venta inmediata LIVE

El texto visible queda como:

```text
Venta inmediata LIVE
```

No aparece como accion principal. Queda dentro de `Mas acciones`, deshabilitada con ayuda:

```text
Usar solo si la venta se cierra directamente desde LIVE, sin continuar flujo de paquete/envio.
```

## 7. Mas acciones

El modal `Mas acciones` concentra acciones secundarias:

- Ver detalle.
- Vincular alias a cliente existente.
- Convertir alias en cliente formal.
- Editar alias.
- Asignar caja / Cambiar caja.
- Crear paquete.
- Agregar a paquete.
- Ver pagos.
- Registrar abono.
- Venta inmediata LIVE.
- Liberar envio.
- Marcar enviado.
- Cancelar apartado.

Las acciones sin contrato completo permanecen deshabilitadas con motivo claro.

## 8. Limite inicial y Cargar mas

La pantalla muestra inicialmente 25 apartados del resultado filtrado. Al final se muestra:

```text
Mostrando 25 de N apartados
```

Si hay mas registros, aparece `Cargar mas`, que agrega otros 25 sin borrar busqueda ni tab.

## 9. Desktop

En PC cada apartado queda como card/fila compacta:

- Folio.
- Badges `CLIENTE` o `INTERESADO`.
- Badge de caja.
- Estado.
- Persona destacada.
- Prenda, canal, caja y monto.
- Accion principal.
- `Mas acciones`.

No se muestra el bloque repetido `Siguiente accion`.

## 10. Mobile

En celular se mantiene una sola columna:

- Folio.
- Badge de persona.
- Nombre/alias destacado.
- Caja y monto.
- Una accion principal.
- `Mas acciones`.
- `Detalle` para expandir datos secundarios.

No se agrego scroll horizontal.

## 11. No implementado todavia

- Vinculacion real de alias a cliente existente.
- Conversion de alias en cliente formal.
- Edicion auditada de alias.
- Read-model de paquete/saldo/envio por apartado.
- Backend pagination.
- Liberacion real para envio.
- Marcado real como enviado desde `/reservations`.

## 12. Riesgos

- La accion `Crear paquete` puede seguir bloqueada si falta caja, porque el backend actual exige ubicacion fisica antes de crear paquete.
- Sin read-model agregado, la pantalla aun no sabe si un apartado ya esta en paquete.
- Backend pagination puede ser necesaria si el volumen crece mucho.

## 13. Validaciones

Validaciones requeridas:

- `npm run lint`.
- `npx tsc --noEmit`.
- `git --no-pager diff --check`.

No aplica `./mvnw.cmd test` porque no se modifico backend.

## 14. Smoke QA recomendado

1. Abrir `/reservations`.
2. Confirmar un solo encabezado operativo visible.
3. Confirmar que `Actualizar` esta en la barra superior.
4. Confirmar tabs `Interesados` y `Clientes`.
5. Confirmar apartado con cliente: badge `CLIENTE`.
6. Confirmar apartado con alias: badge `INTERESADO` y `Falta cliente`.
7. Confirmar accion principal `Vincular cliente` en alias.
8. Confirmar que `Siguiente accion` ya no se repite como bloque grande.
9. Confirmar que `Venta inmediata LIVE` aparece solo en `Mas acciones`.
10. Confirmar limite inicial de 25 y boton `Cargar mas`.
11. Confirmar busqueda por alias.
12. Confirmar que no hay polling automatico.
13. Validar layout en PC y celular.

## 15. Siguiente fase recomendada

HOLD-SHIP-FAST-5: implementar vinculacion/conversion de alias a cliente formal con auditoria y reglas para habilitar paquete/envio.

## Resultado

GO_TECNICO_FRONTEND si pasan lint, TypeScript y diff check.
