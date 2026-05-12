# Resultados esperados - Jornada QA

Este documento sirve para cuadrar la ejecucion. Los folios/id pueden variar; lo importante es que los estados, sucursales, importes y enlaces coincidan.

## Estado final esperado

| Area | Resultado esperado |
| --- | --- |
| Clientes | Existen clientes nuevos de prueba en Centro y Veracruz; cada alta aparece en historico con enlace al detalle |
| Inventario | Las prendas vendidas no quedan disponibles; las reservadas quedan apartadas; las transferidas aparecen en Veracruz tras recepcion |
| Ventas | Existen ventas pagadas, una venta parcial liquidada despues y una venta Veracruz |
| Apartados | Existe un apartado liquidado y uno cancelado; la cancelacion queda reflejada en reporte |
| Live | La sesión Live queda cerrada o en estado final definido, con piezas y pagos registrados |
| Consignacion | La remision muestra piezas vendidas/devueltas y saldo correcto |
| Envíos | Hay al menos un envio entregado, uno por paqueteria y uno devuelto o pendiente segun el flujo ejecutado |
| Transferencias | La transferencia Centro a Veracruz queda recibida y las prendas pasan a la sucursal destino |
| Devoluciones | La devolucion pasa por solicitud, aprobacion y proceso; caja/reporte reflejan el movimiento |
| Historico | No aparecen eventos tecnicos duplicados tipo `SYSTEM_CUSTOMERS_CREATE`; los eventos muestran lo creado y permiten navegar al detalle cuando aplique |
| Responsivo | No hay textos cortados, scroll horizontal ni campos tapados por el teclado en pantallas moviles |

## Cuadre de ventas y pagos

Registrar los importes reales generados durante la prueba:

| Concepto | Formula | Importe |
| --- | --- | --- |
| Total venta mostrador Centro | VEN-01 + VEN-02 + VEN-03 |  |
| Total venta Veracruz | VEN-05 + TRA-03 |  |
| Total apartados cobrados | APA-01 + APA-02 + APA-03 |  |
| Total Live cobrado | LIV-03 |  |
| Total devoluciones | DEV-03 |  |
| Neto esperado caja Centro | Cobros Centro - devoluciones Centro |  |
| Neto esperado caja Veracruz | Cobros Veracruz - devoluciones Veracruz |  |

## Cuadre por metodo de pago

| Metodo | Operaciones esperadas | Importe reporte | Coincide |
| --- | --- | --- | --- |
| QA Efectivo | VEN-01, abonos y pagos definidos en checklist |  |  |
| QA Tarjeta | VEN-02 y pagos con referencia |  |  |
| QA Transferencia | Pagos referenciados y depositos |  |  |

## Historico esperado

Ejemplos de texto visible correcto:

| Operacion | Debe verse como | Accion esperada |
| --- | --- | --- |
| Alta de cliente | Alta de cliente / QA Cliente Nuevo Blair | Ver cliente |
| Venta | Venta creada / cliente, folio o total | Ver venta |
| Sucursal | Sucursal creada o actualizada / QA Veracruz | Ver sucursal |
| Transferencia | Transferencia creada / QA Centro a QA Veracruz | Ver transferencia |
| Prenda | Prenda creada o actualizada / código QA | Ver prenda si aplica |

No debe verse como resultado principal:

```text
SYSTEM_CUSTOMERS_CREATE
POST /api/customers/branch/1
SYSTEM_SALES_CREATE
SYSTEM_ITEMS_CREATE
```

Si aparece un evento tecnico de ese tipo como fila visible para el usuario, registrar incidencia.

## Criterio de aceptacion general

La jornada se considera aprobada si:

- Todos los casos criticos de venta, pago, inventario, reporte e historico pasan.
- No hay bloqueo para operar en movil.
- Las diferencias de importes tienen explicacion documentada.
- Las incidencias abiertas no impiden vender, cobrar, entregar, transferir ni consultar reportes.
