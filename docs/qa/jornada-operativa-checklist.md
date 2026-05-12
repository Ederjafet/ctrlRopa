# Checklist QA - Jornada operativa completa

Fecha de ejecucion: `____ / ____ / ______`

Ambiente: `____________________________`

Tecnico: `____________________________`

Version/build: `____________________________`

## 1. Preparación

| ID | Caso | Usuario | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| PRE-01 | Confirmar respaldo de base | DBA/QA | Existe respaldo antes de iniciar |  |  |
| PRE-02 | Ejecutar limpieza QA | DBA/QA | No quedan datos anteriores con prefijo QA |  |  |
| PRE-03 | Ejecutar preparación QA | DBA/QA | Usuarios, sucursales, catálogos e inventario QA creados |  |  |
| PRE-04 | Abrir app en movil | qa.admin@local.test | Carga menu principal sin errores |  |  |
| PRE-05 | Abrir app en escritorio/tablet | qa.admin@local.test | Carga menu principal sin errores |  |  |

## 2. Login, roles y permisos

| ID | Caso | Usuario | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| ROL-01 | Iniciar sesión como administrador | qa.admin@local.test | Acceso total a catálogos, ventas, reportes, apariencia e historico |  |  |
| ROL-02 | Iniciar sesión como supervisor | qa.supervisor.centro@local.test | Acceso operativo amplio, reportes e historico |  |  |
| ROL-03 | Iniciar sesión como vendedor Centro | qa.vendedor.centro@local.test | Puede crear clientes, ventas, apartados y consultar inventario permitido |  |  |
| ROL-04 | Iniciar sesión como caja Centro | qa.caja.centro@local.test | Puede registrar pagos, cortes y consultar ventas |  |  |
| ROL-05 | Iniciar sesión como inventario Centro | qa.inventario.centro@local.test | Puede administrar prendas, ubicaciones y transferencias |  |  |
| ROL-06 | Iniciar sesión como empaque Centro | qa.empaque.centro@local.test | Puede preparar paquetes y consultar pendientes |  |  |
| ROL-07 | Iniciar sesión como logistica Centro | qa.logistica.centro@local.test | Puede administrar envíos y entregas |  |  |
| ROL-08 | Iniciar sesión como mensajero Centro | qa.mensajero.centro@local.test | Puede actualizar entregas asignadas |  |  |
| ROL-09 | Iniciar sesión como vendedor Veracruz | qa.vendedor.veracruz@local.test | Opera sobre QA Veracruz sin mezclar datos de Centro |  |  |
| ROL-10 | Intentar abrir modulo no permitido | Rol limitado | La app bloquea acceso sin romper navegacion |  |  |

## 3. Apariencia y responsivo

| ID | Caso | Usuario | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Cambiar colores principales desde Apariencia | qa.admin@local.test | Menu, botones y acentos cambian de forma consistente |  |  |
| UI-02 | Cambiar apariencia de tarjetas informativas | qa.admin@local.test | "Reportes operativos" se ve distinto a botones/reporte accionable |  |  |
| UI-03 | Revisar Reportes en movil vertical | qa.admin@local.test | Tarjeta informativa no parece boton; botones muestran accion clara |  |  |
| UI-04 | Revisar Reportes en tablet/escritorio | qa.admin@local.test | Distribucion usa columnas y no deja textos cortados |  |  |
| UI-05 | Crear/editar prenda en movil con teclado abierto | qa.inventario.centro@local.test | Al enfocar Precio sugerido, el campo queda visible sobre el teclado |  |  |
| UI-06 | Validar campos largos | qa.inventario.centro@local.test | Campos inferiores tambien suben y permiten ver lo que se escribe |  |  |
| UI-07 | Revisar Historico en movil | qa.supervisor.centro@local.test | Entradas se leen sin duplicar datos inutiles y con accion visible |  |  |
| UI-08 | Revisar listados principales en movil | Cada rol | Sucursales, clientes, prendas, ventas y reportes son usables sin scroll horizontal |  |  |

## 4. Clientes

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| CLI-01 | Buscar cliente existente Centro | qa.vendedor.centro@local.test | QA Cliente Existente Centro Ana | Cliente aparece con teléfono/referencia correcta |  |  |
| CLI-02 | Crear cliente nuevo Centro | qa.vendedor.centro@local.test | QA Cliente Nuevo Blair | Cliente queda activo y visible en QA Centro |  |  |
| CLI-03 | Crear cliente nuevo Veracruz | qa.vendedor.veracruz@local.test | QA Cliente Nuevo Serena | Cliente queda activo y visible en QA Veracruz |  |  |
| CLI-04 | Editar cliente | qa.vendedor.centro@local.test | Agregar direccion QA | Cambios se guardan y se reflejan en detalle |  |  |
| CLI-05 | Validar historico cliente | qa.supervisor.centro@local.test | Cliente nuevo creado | Historico muestra "Alta de cliente", nombre y boton "Ver cliente" |  |  |

## 5. Inventario y prendas

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| INV-01 | Buscar prenda disponible Centro | qa.inventario.centro@local.test | QA-CTR-001 | Prenda aparece disponible en QA Centro |  |  |
| INV-02 | Buscar prenda disponible Veracruz | qa.vendedor.veracruz@local.test | QA-VER-001 | Prenda aparece disponible en QA Veracruz |  |  |
| INV-03 | Crear prenda nueva Centro | qa.inventario.centro@local.test | QA-CTR-NUEVA-001 | Prenda queda disponible y con precio visible |  |  |
| INV-04 | Editar precio sugerido | qa.inventario.centro@local.test | Cambiar precio | Precio se guarda; campo nunca queda tapado por teclado |  |  |
| INV-05 | Validar catálogos | qa.inventario.centro@local.test | Tipo, marca, talla, ubicacion QA | Selectores muestran datos QA correctos |  |  |
| INV-06 | Validar historico prenda | qa.supervisor.centro@local.test | Prenda nueva/editada | Historico muestra lo creado/editado con enlace cuando aplique |  |  |

## 6. Venta de mostrador

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| VEN-01 | Venta a cliente existente Centro con efectivo | qa.vendedor.centro@local.test | Ana + QA-CTR-001 | Venta queda pagada; prenda deja de estar disponible |  |  |
| VEN-02 | Venta a cliente nuevo Centro con tarjeta | qa.vendedor.centro@local.test | Blair + QA-CTR-002 | Venta queda pagada con referencia de tarjeta |  |  |
| VEN-03 | Venta con pago parcial | qa.vendedor.centro@local.test | Bruno + QA-CTR-003 | Venta queda con saldo pendiente o estado equivalente |  |  |
| VEN-04 | Abono posterior de venta parcial | qa.caja.centro@local.test | Venta VEN-03 | Saldo baja y pago aparece en reportes/depositos |  |  |
| VEN-05 | Venta Veracruz | qa.vendedor.veracruz@local.test | Serena + QA-VER-001 | Venta queda en QA Veracruz; no aparece como Centro |  |  |
| VEN-06 | Validar historico de ventas | qa.supervisor.centro@local.test | Ventas VEN-01 a VEN-05 | Historico muestra accion "Ver venta" y abre detalle correcto |  |  |

## 7. Apartados

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| APA-01 | Crear apartado Centro | qa.vendedor.centro@local.test | Ana + QA-CTR-004 + anticipo | Apartado queda activo y prenda reservada |  |  |
| APA-02 | Agregar abono a apartado | qa.caja.centro@local.test | Apartado APA-01 | Saldo se actualiza y pago queda registrado |  |  |
| APA-03 | Liquidar apartado | qa.caja.centro@local.test | Apartado APA-01 | Apartado queda liquidado/vendido segun flujo |  |  |
| APA-04 | Crear apartado y cancelar | qa.vendedor.centro@local.test | Bruno + QA-CTR-005 | Cancelacion libera prenda o genera devolucion segun regla |  |  |
| APA-05 | Reporte de cancelaciones | qa.supervisor.centro@local.test | Cancelacion APA-04 | Aparece en reporte diario de cancelaciones |  |  |

## 8. Operacion Live

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| LIV-01 | Abrir sesión Live | qa.supervisor.centro@local.test | QA Live Centro | Live queda activo para QA Centro |  |  |
| LIV-02 | Reservar prenda en Live | qa.vendedor.centro@local.test | Blair + QA-CTR-006 | Reserva Live queda ligada a cliente y prenda |  |  |
| LIV-03 | Registrar pago de Live | qa.caja.centro@local.test | Reserva LIV-02 | Pago queda registrado y saldo correcto |  |  |
| LIV-04 | Empacar paquete Live | qa.empaque.centro@local.test | Reserva LIV-02 | Paquete queda listo para entrega/envio |  |  |
| LIV-05 | Cerrar sesión Live | qa.supervisor.centro@local.test | QA Live Centro | Reporte Live muestra piezas, saldos y liquidacion |  |  |

## 9. Consignaciones y remisiones

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Crear consignacion | qa.supervisor.centro@local.test | QA Consignatario Centro + QA-CTR-007 | Remision queda abierta con prenda asignada |  |  |
| CON-02 | Marcar prenda consignada como vendida | qa.supervisor.centro@local.test | Remision CON-01 | Saldo/venta de consignacion queda registrado |  |  |
| CON-03 | Registrar devolucion de consignacion | qa.supervisor.centro@local.test | Otra prenda si aplica | Prenda vuelve disponible o queda en estado definido |  |  |
| CON-04 | Validar reporte de remisiones | qa.supervisor.centro@local.test | CON-01 a CON-03 | Reporte muestra piezas, pagos y pendientes correctos |  |  |

## 10. Paquetes, envíos y entregas

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| ENV-01 | Crear paquete de cliente | qa.empaque.centro@local.test | Ana + ventas pagadas | Paquete queda creado con piezas correctas |  |  |
| ENV-02 | Crear entrega local | qa.logistica.centro@local.test | Paquete ENV-01 | Envio queda asignado para entrega local |  |  |
| ENV-03 | Marcar entrega como entregada | qa.mensajero.centro@local.test | Envio ENV-02 | Estado pasa a entregado y fecha queda registrada |  |  |
| ENV-04 | Crear envio paqueteria | qa.logistica.centro@local.test | Blair + paquete Live | Guia/referencia queda registrada |  |  |
| ENV-05 | Registrar devolucion de envio | qa.logistica.centro@local.test | Envio de prueba | Estado pasa a devuelto y se refleja en reporte |  |  |
| ENV-06 | Validar reporte entregas diarias | qa.supervisor.centro@local.test | ENV-01 a ENV-05 | Conteos de enviados, entregados, devueltos y pendientes cuadran |  |  |

## 11. Transferencias entre sucursales

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| TRA-01 | Crear transferencia Centro a Veracruz | qa.inventario.centro@local.test | QA-CTR-010, QA-CTR-011 | Transferencia queda pendiente/en transito |  |  |
| TRA-02 | Recibir transferencia en Veracruz | qa.vendedor.veracruz@local.test | Transferencia TRA-01 | Prendas quedan disponibles en QA Veracruz |  |  |
| TRA-03 | Vender prenda transferida | qa.vendedor.veracruz@local.test | QA-CTR-010 transferida | Venta queda en Veracruz y prenda vendida |  |  |
| TRA-04 | Validar historico transferencia | qa.supervisor.centro@local.test | TRA-01 a TRA-03 | Historico muestra origen, destino y detalle navegable |  |  |

## 12. Devoluciones y cancelaciones

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| DEV-01 | Solicitar devolucion de venta | qa.vendedor.centro@local.test | Venta VEN-02 | Solicitud queda pendiente/aprobable |  |  |
| DEV-02 | Aprobar devolucion | qa.supervisor.centro@local.test | DEV-01 | Devolucion cambia a aprobada |  |  |
| DEV-03 | Procesar devolucion | qa.caja.centro@local.test | DEV-01 | Pago se revierte o queda salida de caja segun regla |  |  |
| DEV-04 | Validar prenda devuelta | qa.inventario.centro@local.test | Prenda de DEV-01 | Estado final coincide con politica: disponible, revision o devuelta |  |  |
| DEV-05 | Validar reporte de cancelaciones/devoluciones | qa.supervisor.centro@local.test | DEV-01 a DEV-04 | Reporte refleja importes y referencias |  |  |

## 13. Caja y reportes

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| REP-01 | Consultar diario tienda Centro | qa.supervisor.centro@local.test | Fecha actual + QA Centro | Ventas, apartados, pagos y cancelaciones cuadran con la jornada |  |  |
| REP-02 | Consultar diario tienda Veracruz | qa.supervisor.centro@local.test | Fecha actual + QA Veracruz | Solo muestra operaciones de QA Veracruz |  |  |
| REP-03 | Consultar depositos diarios | qa.caja.centro@local.test | Fecha actual | Metodos QA Efectivo/Tarjeta/Transferencia aparecen con totales correctos |  |  |
| REP-04 | Consultar entregas diarias | qa.logistica.centro@local.test | Fecha actual | Estados de envíos coinciden con ENV |  |  |
| REP-05 | Consultar Control Live | qa.supervisor.centro@local.test | Fecha actual | Saldos, piezas y liquidacion coinciden con LIV |  |  |
| REP-06 | Consultar remisiones | qa.supervisor.centro@local.test | Fecha actual | Remisiones coinciden con CON |  |  |
| REP-07 | Cierre de caja | qa.caja.centro@local.test | Pagos del dia | Total cobrado por metodo coincide con reportes |  |  |

## 14. Historico

| ID | Caso | Usuario | Datos | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| HIS-01 | Revisar altas de cliente | qa.supervisor.centro@local.test | Blair, Serena | Se ve nombre creado y boton "Ver cliente" |  |  |
| HIS-02 | Revisar sucursal creada/actualizada si aplica | qa.admin@local.test | QA Veracruz | Se ve el nombre real de la sucursal, no solo POST/PUT |  |  |
| HIS-03 | Revisar ventas | qa.supervisor.centro@local.test | VEN-01 a VEN-05 | Se ve cliente/folio/total y accion "Ver venta" |  |  |
| HIS-04 | Revisar transferencias | qa.supervisor.centro@local.test | TRA-01 | Se ve origen/destino y se puede abrir detalle |  |  |
| HIS-05 | Validar que no aparezcan eventos tecnicos duplicados | qa.supervisor.centro@local.test | Clientes, ventas, prendas | No aparecen filas tipo `SYSTEM_CUSTOMERS_CREATE` como evento visible |  |  |
| HIS-06 | Validar sucursal del usuario | qa.supervisor.centro@local.test | Operaciones Centro/Veracruz | La sucursal mostrada corresponde a la operacion o usuario correcto |  |  |

## 15. Cierre QA

| ID | Caso | Usuario | Resultado esperado | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| CIE-01 | Comparar contra resultados esperados | QA | No hay diferencias sin explicar |  |  |
| CIE-02 | Registrar incidencias | QA | Cada fallo tiene severidad, pasos y evidencia |  |  |
| CIE-03 | Confirmar datos finales | DBA/QA | Datos QA quedan disponibles para revision o se limpian con script |  |  |
| CIE-04 | Reporte final | QA | Documento final indica version, resultado general y riesgos |  |  |
