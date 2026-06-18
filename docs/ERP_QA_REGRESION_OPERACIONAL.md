# ERP - QA regresion operacional

Fecha: 2026-05-12  
Alcance: regresion manual/operacional preliminar. No reemplaza pruebas automatizadas.

## Criterio general

Cada flujo debe probarse con usuario permitido y, cuando aplique, con usuario sin permiso. Si falla un flujo CRITICO, el release se bloquea.

Las severidades se clasifican segun `docs/ERP_DEFECT_SEVERITY.md`. Los flujos que bloquean release se gobiernan por `docs/ERP_CRITICAL_FLOWS.md`.

## Prerrequisitos de ejecucion

- Preparar datos segun `docs/ERP_QA_DATASET.md`.
- Usar perfiles definidos en `docs/ERP_QA_USERS_ROLES.md`.
- Capturar evidencia con `docs/ERP_QA_EVIDENCE_TEMPLATE.md`.
- Guardar evidencia segun `docs/ERP_EVIDENCE_STANDARD.md`.
- Registrar la corrida en `docs/ERP_QA_EXECUTION_LOG.md`.
- Si faltan datos QA para un flujo, marcarlo como `BLOQUEADO POR DATASET`, no como aprobado.

## Login

Prioridad: CRITICA  
Impacto si falla: nadie puede operar.  
Riesgo operacional: bloqueo total o acceso indebido.  
Smoke asociado: `SMK-LOGIN-01`.

Pasos:

1. Abrir `/login`.
2. Iniciar sesion con usuario QA valido.
3. Verificar redireccion al menu/dashboard.
4. Cerrar sesion.
5. Intentar login con credenciales invalidas.

Resultado esperado:

- Login valido entra.
- Logout regresa a login.
- Login invalido muestra mensaje amigable.

## Dashboard

Prioridad: ALTA  
Impacto si falla: el usuario pierde visibilidad operativa.  
Riesgo operacional: decisiones con indicadores incorrectos.  
Smoke asociado: `SMK-DASH-01`.

Pasos:

1. Entrar como usuario operativo.
2. Abrir `app/dashboard.tsx`.
3. Verificar sucursal/fecha.
4. Abrir detalle de un indicador.
5. Cerrar detalle y regresar.

Resultado esperado:

- Indicadores cargan sin error tecnico.
- Detalles abren listas relacionadas o estado vacio claro.

## Clientes

Prioridad: ALTA  
Impacto si falla: no se puede vender/reservar correctamente.  
Riesgo operacional: venta asociada a cliente equivocado.  
Smoke asociado: `SMK-CUS-01`.

Pasos:

1. Abrir clientes.
2. Buscar cliente existente.
3. Abrir detalle.
4. Crear cliente de prueba si aplica.

Resultado esperado:

- Busqueda responde.
- Detalle muestra datos.
- Alta valida nombre/telefono.

## Inventario

Prioridad: ALTA  
Impacto si falla: prendas no disponibles o mal ubicadas.  
Riesgo operacional: venta/reserva de prenda incorrecta.  
Smoke asociado: `SMK-INV-01`.

Pasos:

1. Abrir inventario.
2. Buscar por codigo/QR si hay dato QA.
3. Abrir detalle de prenda.
4. Validar estado y sucursal.

Resultado esperado:

- Prenda encontrada.
- Estado visible y consistente.
- Sin errores tecnicos.

## Lotes

Prioridad: ALTA  
Impacto si falla: inventario se origina mal.  
Riesgo operacional: recepcion/calidad/clasificacion incorrecta.  
Smoke asociado: `SMK-BAT-01`.

Pasos:

1. Abrir lotes.
2. Filtrar o abrir lote existente.
3. Ver proveedor, cantidad esperada, recibida, calidad y estado.
4. Validar que acciones no disponibles expliquen por que.

Resultado esperado:

- Lote abre detalle.
- No hay botones mudos.
- Estados son comprensibles.

## Live

Prioridad: ALTA  
Impacto si falla: reservas se pierden o quedan mal asociadas.  
Riesgo operacional: captura en vivo inconsistente.  
Smoke asociado: `SMK-LIVE-01`.

Pasos:

1. Abrir Live.
2. Ver lives abiertos.
3. Seleccionar live.
4. Validar mensaje si falta cliente/prenda/precio.
5. Validar historial sin saturacion visual.

Resultado esperado:

- Se puede seleccionar live.
- Faltantes se muestran de forma amigable.
- Historial no bloquea captura.

## Ventas

Prioridad: CRITICA  
Impacto si falla: dinero e inventario incorrectos.  
Riesgo operacional: diferencia de caja, prenda mal vendida.  
Smoke asociado: `SMK-SALE-01`.

Pasos:

1. Abrir venta puerta.
2. Seleccionar cliente o generico.
3. Agregar prenda por codigo/QR/busqueda si hay dato QA.
4. Capturar precio.
5. Seleccionar metodo de pago.
6. Registrar venta.

Resultado esperado:

- Si falta dato, modal accionable.
- Venta correcta registra pago/venta.
- No se pierde captura ante validacion.

## Pagos

Prioridad: CRITICA  
Impacto si falla: saldos/caja incorrectos.  
Riesgo operacional: diferencias financieras.  
Smoke asociado: `SMK-PAY-01`.

Pasos:

1. Abrir pagos.
2. Buscar deuda por reserva/pedido/item/paquete.
3. Seleccionar metodo.
4. Registrar pago de prueba controlado.
5. Validar mensaje de exito/error.

Resultado esperado:

- Pago solo procede con datos completos.
- Errores son amigables.
- No se duplica pago.

## Paquetes

Prioridad: ALTA  
Impacto si falla: prendas no se preparan/envian.  
Riesgo operacional: paquete incompleto o asociado a cliente equivocado.  
Smoke asociado: `SMK-PKG-01`.

Pasos:

1. Abrir paquetes de cliente.
2. Crear/abrir paquete existente.
3. Agregar prenda por codigo/QR/busqueda.
4. Marcar preparacion lista si aplica.

Resultado esperado:

- Paquete muestra cliente correcto.
- Agregar prenda actualiza lista.
- Cierre explica siguiente paso.

## Envios

Prioridad: ALTA  
Impacto si falla: entrega sin control.  
Riesgo operacional: paquete despachado/cobrado incorrectamente.  
Smoke asociado: `SMK-SHP-01`.

Pasos:

1. Abrir envios.
2. Crear o abrir envio existente.
3. Agregar paquete.
4. Despachar o validar bloqueo si faltan datos.

Resultado esperado:

- Envio muestra paquetes.
- Acciones destructivas confirman.
- Errores de direccion/cobro son claros.

## Reportes

Prioridad: MEDIA/ALTA  
Impacto si falla: decisiones con datos incorrectos.  
Riesgo operacional: cierre o seguimiento equivocado.  
Smoke asociado: `SMK-REP-01`.

Pasos:

1. Abrir reportes.
2. Ejecutar reporte diario por sucursal/fecha.
3. Ejecutar historico de movimientos.
4. Validar estado sin datos.

Resultado esperado:

- Reportes cargan o muestran estado vacio.
- Filtros validan sucursal/fecha.
- No exponen errores tecnicos.

## Usuarios/permisos

Prioridad: CRITICA  
Impacto si falla: acceso indebido o bloqueo operativo.  
Riesgo operacional: usuario ve/ejecuta lo que no debe.  
Smoke asociado: `SMK-SEC-01`.

Pasos:

1. Entrar como admin.
2. Abrir usuarios y roles.
3. Revisar permisos efectivos de usuario QA.
4. Entrar con usuario sin permiso a ruta protegida.

Resultado esperado:

- Admin ve usuarios/roles.
- Usuario sin permiso ve acceso denegado amigable.
- Backend responde 403 controlado.

