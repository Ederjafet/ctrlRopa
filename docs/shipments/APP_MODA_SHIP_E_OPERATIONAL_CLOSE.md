# APP MODA SHIP-E - Cierre operativo de envios

## Resumen ejecutivo

SHIP-E implementa el cierre operativo del modulo Envios. La fase endurece las transiciones de estado para que un envio no pueda avanzar a enviado o recibido si todavia falta completar el checklist logistico o existe saldo de envio pendiente asignado a clientes.

La fase mantiene separados los pagos de envio y los pagos de mercancia. No agrega reportes, no cambia Centro del negocio y no recalcula saldos de paquetes desde Envios.

## Objetivo

Permitir operar el cierre del envio con reglas claras:

- Marcar enviado solo cuando el envio esta en preparacion, tiene paquetes, destino, guia si aplica, costo real definido y saldo de envio cubierto o absorbido.
- Confirmar recibido solo cuando el envio esta enviado y no existe saldo de envio pendiente.
- Bloquear cambios logisticos, reparto y pagos en estados donde ya no deben modificarse.
- Mostrar bloqueos claros en UI antes de que el usuario llegue a errores tecnicos.

## Reglas implementadas

### Marcar enviado

`PATCH /api/shipments/{id}/dispatch` ahora mantiene las reglas existentes y agrega:

- costo real de envio obligatorio (`0.00` es valido);
- si el costo real es mayor a cero, debe existir reparto para todos los paquetes;
- si el reparto deja saldo de envio pendiente, se bloquea el despacho;
- tienda absorbe queda permitido cuando el reparto asigna `0.00` y el saldo asignado queda en cero.

Mensajes principales:

- `Define el costo real del envio antes de marcar como enviado.`
- `Reparte el costo de envio antes de marcar como enviado.`
- `Reparte el costo de envio para todos los paquetes antes de marcar como enviado.`
- `No se puede marcar como enviado porque existe saldo de envio pendiente.`

### Confirmar recibido

`PATCH /api/shipments/{id}/confirm-received` ahora bloquea si existe saldo de envio pendiente. Tambien conserva validaciones previas de estado, paquetes pendientes y cobro contra entrega.

`PATCH /api/shipments/{id}/packages/{shipmentPackageId}/resolve` aplica el mismo bloqueo cuando se intenta resolver una linea como `DELIVERED`.

### Logistica

`PATCH /api/shipments/{id}/logistics` solo permite editar datos logisticos cuando el envio esta en `OPEN`.

Estados bloqueados para edicion logistica:

- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CLOSED_WITH_INCIDENTS`
- `CANCELLED`

### Reparto del costo

`PUT /api/shipments/{id}/cost-shares` solo permite cambios en `OPEN` y mantiene el bloqueo si ya existe cualquier historial de pagos de envio, registrados o cancelados.

### Pagos de envio

`POST /api/shipments/{id}/shipping-payments` y `PATCH /api/shipments/{id}/shipping-payments/{paymentId}/cancel` bloquean estados finales:

- `DELIVERED`
- `CLOSED_WITH_INCIDENTS`
- `CANCELLED`

SHIP-E mantiene:

- sobrepago bloqueado;
- doble cancelacion bloqueada;
- pagos cancelados fuera de `paidAmount` y `paidTotal`;
- independencia total contra pagos/saldo de mercancia.

## Estados editables y no editables

| Accion | Permitido | Bloqueado |
| --- | --- | --- |
| Editar logistica | `OPEN` | `OUT_FOR_DELIVERY`, `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED` |
| Modificar reparto | `OPEN` sin historial de pagos | `OUT_FOR_DELIVERY`, finales, o con historial de pagos |
| Registrar pago envio | `OPEN`, `OUT_FOR_DELIVERY` | `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED` |
| Cancelar pago envio | `OPEN`, `OUT_FOR_DELIVERY` | `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED` |
| Marcar enviado | `OPEN` con checklist completo | cualquier bloqueo logistico/financiero |
| Confirmar recibido | `OUT_FOR_DELIVERY` sin saldo envio | saldo envio pendiente o estado no permitido |

## Endpoints afectados

- `PATCH /api/shipments/{id}/dispatch`
- `PATCH /api/shipments/{id}/confirm-received`
- `PATCH /api/shipments/{id}/packages/{shipmentPackageId}/resolve`
- `PATCH /api/shipments/{id}/logistics`
- `PUT /api/shipments/{id}/cost-shares`
- `POST /api/shipments/{id}/shipping-payments`
- `PATCH /api/shipments/{id}/shipping-payments/{paymentId}/cancel`
- respuestas `ShipmentResponse` para `canDispatch`, `canConfirmReceived`, `attentionReason` y `blockedReason`.

## UI actualizada

Pantalla:

- `app/shipment-detail.tsx`

Cambios:

- `Marcar enviado` reemplaza visualmente a `Despachar`.
- Se muestra `Bloqueo operativo` cuando backend devuelve `blockedReason`.
- `Editar datos de envio` se bloquea fuera de `OPEN`.
- `Repartir costo` se bloquea fuera de `OPEN` y cuando ya hay historial de pagos.
- `Registrar pago` y `Cancelar pago` se bloquean en estados finales.
- Las acciones muestran `disabledReason` amigable para evitar 403/400 feos.

`app/shipments.tsx` no requirio cambios funcionales: consume `attentionReason`, `nextStep` y `blockedReason` que ahora llegan endurecidos desde backend.

## Pruebas agregadas o ajustadas

`ShipmentServiceTests` cubre ahora:

- dispatch bloqueado sin costo real;
- dispatch bloqueado sin reparto cuando costo real es positivo;
- dispatch bloqueado con saldo de envio pendiente;
- dispatch permitido con saldo de envio en cero;
- dispatch permitido cuando tienda absorbe costo;
- confirmReceived bloqueado con saldo de envio pendiente;
- logistica bloqueada en `OUT_FOR_DELIVERY`;
- reparto bloqueado en `OUT_FOR_DELIVERY`;
- pago de envio bloqueado en `DELIVERED`;
- cancelacion de pago de envio bloqueada en `CLOSED_WITH_INCIDENTS`;
- pagos de envio siguen sin tocar `PaymentService` de mercancia.

## Smoke esperado

Dataset recomendado:

1. Envio `OPEN`, costo real faltante: no permite marcar enviado.
2. Capturar costo real positivo sin reparto: no permite marcar enviado.
3. Crear reparto con saldo pendiente: no permite marcar enviado.
4. Registrar pago parcial: sigue bloqueado.
5. Completar pago de envio: permite marcar enviado.
6. En estado enviado: bloquea edicion de logistica y reparto.
7. Cancelar un pago estando enviado: saldo vuelve a quedar pendiente y bloquea confirmar recibido.
8. Completar pago nuevamente: permite confirmar recibido.
9. En estado recibido/final: bloquea registrar y cancelar pagos de envio.
10. Paquetes sigue mostrando mercancia y resumen minimo de envio.

## Fuera de alcance

No se implemento:

- reportes de saldos/pagos de envio;
- cambios en Centro del negocio;
- SHIP-F;
- conciliacion, corte de caja o contabilidad;
- cambios en pagos de mercancia;
- nuevas migraciones.

Los reportes de saldos/pagos de envio quedan para SHIP-F o REPORT-B-SHIPPING.

## Resultado de validaciones

Fecha de validacion: 2026-06-30.

Validaciones ejecutadas:

- `pwd`: worktree limpio `E:\CtrlPan\2026\control-ropa-app-ship-e`.
- `git status --short`: cambios limitados a SHIP-E y doc nueva.
- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, 0 errores, 72 warnings preexistentes. No se reportan warnings en `app/shipment-detail.tsx`.
- `npx.cmd expo export --platform web`: OK.
- `cd backend/control-ropa && .\mvnw.cmd -Dtest=ShipmentServiceTests test`: OK, 49 tests, 0 failures, 0 errors.
- `git --no-pager diff --check`: OK, solo warnings CRLF.
- `rg -n "Ã|Â|Ãƒ|Ã‚" app components services locales backend/control-ropa/src`: NO OK por mojibake preexistente en `app/report-*` y `app/users-form.tsx`; no aparece en archivos SHIP-E modificados.
- `cd backend/control-ropa && .\mvnw.cmd test`: NO OK por ambiente local MySQL sin credenciales cargadas.

Error exacto de backend completo:

```text
Unable to obtain connection from database: Access denied for user 'root'@'localhost' (using password: NO)
SQL State  : 28000
Error Code : 1045
Message    : Access denied for user 'root'@'localhost' (using password: NO)
```

Se reviso `.env` en `backend/control-ropa`, `backend` y root del worktree; no existe archivo local para cargar credenciales solo en proceso. No se modifico configuracion productiva ni `.env`.

## Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: backend focalizado, TypeScript, lint, export y diff check pasan. La suite backend completa queda bloqueada por credenciales MySQL locales ausentes, no por falla de codigo detectada. `GO_CLIENTE` requiere suite completa en ambiente con MySQL valido y smoke visual/API con usuarios QA.
## SHIP-E-STAGING-SMOKE

Fecha de ejecucion: 2026-07-01.

Worktree validado:

- `E:\CtrlPan\2026\control-ropa-app-ship-e`
- rama `feature/ship-e-desde-ship-d-go-cliente`
- HEAD base: `ec3d4a0 Documenta alcance operativo SHIP-E`

### Ambiente de base de datos

No se encontro `.env` local en `backend/control-ropa`, `backend` ni en la raiz del worktree. La suite completa intento usar la configuracion por defecto de Spring Boot:

- URL default: `jdbc:mysql://localhost:3306/control_ropa`
- usuario default: `root`
- password default: vacio

No se modifico `.env`, no se imprimieron credenciales y no se cambio configuracion productiva. Por este motivo no fue posible validar Flyway ni smoke API contra una base MySQL valida en esta ejecucion.

Error exacto de backend completo:

```text
Unable to obtain connection from database: Access denied for user 'root'@'localhost' (using password: NO)
SQL State  : 28000
Error Code : 1045
Message    : Access denied for user 'root'@'localhost' (using password: NO)
```

### Validaciones ejecutadas

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, 0 errores, 72 warnings preexistentes; no se reportaron warnings en `app/shipment-detail.tsx`.
- `npx.cmd expo export --platform web`: OK.
- `cd backend/control-ropa && .\mvnw.cmd -Dtest=ShipmentServiceTests test`: OK, 49 tests, 0 failures, 0 errors.
- `cd backend/control-ropa && .\mvnw.cmd test`: NO OK por bloqueo ambiental MySQL local sin credenciales cargadas.

### Reglas SHIP-E cubiertas por pruebas focalizadas

- El despacho se bloquea cuando existe saldo de envio pendiente.
- El despacho se permite cuando el saldo de envio queda en cero.
- Costo real `0.00` sigue siendo valido.
- El reparto con tienda absorbe costo queda permitido cuando no deja saldo asignado pendiente.
- Confirmar recibido se bloquea con saldo de envio pendiente.
- La edicion logistica se bloquea en `OUT_FOR_DELIVERY`.
- El reparto se bloquea en estados no editables.
- Registrar y cancelar pagos de envio se bloquea en estados finales.
- Los pagos de envio no invocan ni modifican pagos de mercancia.

### Smoke API y visual

No ejecutado en esta corrida porque no hubo conexion a una base MySQL valida ni dataset QA disponible en proceso.

Queda pendiente para subir a `GO_CLIENTE`:

- cargar credenciales MySQL validas solo en proceso o ambiente staging;
- validar Flyway/schema alineado con esta rama;
- aplicar o restaurar dataset QA si hace falta;
- ejecutar smoke API con `qa.admin`, `qa.vendedor.centro` y `qa.sinpermisos`;
- ejecutar smoke visual en navegador/tablet;
- confirmar que Paquetes mantiene solo resumen minimo de envio y que Envio conserva logistica/reparto/pagos/saldo.

### Decision staging

Decision actualizada: `GO_CONTROLADO_INTERNO`.

No se detecto falla funcional en los tests focalizados ni en build frontend. No se marca `GO_CLIENTE` porque faltan suite completa en ambiente MySQL valido y smoke API/visual con usuarios QA.

## SHIP-E-QA-DATASET-FIX

Fecha de preparacion: 2026-07-01.

### Problema detectado

El dataset anterior de SHIP-D no era compatible con el schema limpio V75 usado para validar SHIP-E en `control_ropa_ship_e_smoke`. Al aplicarlo se observaron fallas de columnas inexistentes, variables de contexto nulas y restricciones foraneas.

Errores representativos reportados:

```text
Unknown column `company_id`
company_id null
branch_id null
Cannot add or update a child row: a foreign key constraint fails
QA users absent after apply
```

### Causa raiz

El SQL heredado asumia columnas y datos que no existen igual en esta rama limpia:

- `product_types`, `payment_methods` y `sales_channels` son catalogos globales en V75 y no tienen `company_id`.
- El tenant `MARLA_BOUTIQUE` y la sucursal `TUXTLAN` no existian necesariamente en un schema recien migrado.
- Algunos inserts dependian de `@company_id`, `@branch_id` o usuarios QA ya existentes.
- Varias relaciones (`customer_addresses`, `customer_package_items`, `payment_allocations`, `shipment_packages`, `shipment_cost_shares`) quedaban sin padres validos.
- El dataset no garantizaba usuarios QA con contexto tenant/sucursal ni permisos diferenciados para SHIP-E.

### Nuevo dataset

Se agrego:

- `docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql`

El nuevo dataset es especifico para SHIP-E y schema limpio V75. Crea o reutiliza:

- company `MARLA_BOUTIQUE`;
- branch `TUXTLAN`;
- usuario admin QA con `MANAGE_SHIPMENTS`;
- usuario vendedor QA sin `MANAGE_SHIPMENTS`;
- usuario sin permisos con rol `NO_ACCESS`;
- cliente QA activo;
- direccion QA;
- prenda/venta/paquete con mercancia total `300.00`, pagado `100.00` y saldo mercancia `200.00`;
- envio `SHIPE-QA-ENV-001` en `OPEN`;
- paquete `SHIPE-QA-PKG-001` asociado al envio;
- reparto de costo de envio por `120.00` sin pagos registrados, dejando saldo envio `120.00`.

El SQL no guarda passwords ni credenciales. Requiere definir `@qa_password_hash` en la sesion MySQL antes de ejecutar `SOURCE`.

El SQL incluye SELECTs finales para validar:

- tenant y sucursal;
- usuarios, roles y presencia/ausencia de `MANAGE_SHIPMENTS`;
- envio, reparto, pagado de envio y saldo de envio;
- total/pagado/saldo de mercancia.

### Instrucciones para aplicar en schema limpio

Usar solo ambiente local/staging QA. No ejecutar en produccion.

1. Levantar MySQL con un schema limpio alineado a la rama, por ejemplo `control_ropa_ship_e_smoke`.
2. Ejecutar backend desde un proceso que tenga variables MySQL cargadas solo en memoria.
3. Confirmar Flyway en V75.
4. En el cliente MySQL, definir `@qa_password_hash` solo en la sesion actual con el hash QA local seguro.
5. Aplicar el dataset manualmente:

```sql
USE control_ropa_ship_e_smoke;
SET @qa_password_hash = '<hash QA local no documentado>';
SOURCE E:/CtrlPan/2026/control-ropa-app-ship-e/docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql;
```

6. Revisar los SELECTs finales. El resultado esperado minimo es:

```text
qa.admin@local.test -> has_manage_shipments = 1
qa.vendedor.centro@local.test -> has_manage_shipments = 0
qa.sinpermisos@local.test -> rol NO_ACCESS y has_manage_shipments = 0
SHIPE-QA-ENV-001 -> status OPEN, assigned_amount 120.00, shipping_paid 0.00, shipping_balance 120.00
SHIPE-QA-PKG-001 -> merchandise_total 300.00, merchandise_paid 100.00, merchandise_balance 200.00
```

No documentar ni imprimir contrasenas en resultados de smoke.

### Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: se corrigio el dataset QA para V75, pero falta aplicarlo manualmente contra `control_ropa_ship_e_smoke` y ejecutar smoke API/visual. `GO_CLIENTE` queda condicionado a que el nuevo dataset aplique sin errores y pasen las validaciones de SHIP-E con usuarios QA.

## SHIP-E-QA-DATASET-FIX-2

Fecha de preparacion: 2026-07-01.

### Errores reales detectados al aplicar el dataset anterior

Al aplicar `APP_MODA_SHIP_E_QA_DATASET.sql` sobre `control_ropa_ship_e_smoke` con MySQL 5.7 y Flyway en V75, el dataset todavia fallaba. No se continuo con smoke API/visual.

Errores reportados:

```text
ERROR 1267: Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_general_ci,IMPLICIT) for operation '='
ERROR 1271: Illegal mix of collations for operation 'IN'
ERROR 1048: Column 'company_id' cannot be null
ERROR 1048: Column 'branch_id' cannot be null
ERROR 1048: Column 'user_id' cannot be null
ERROR 1048: Column 'created_by_user_id' cannot be null
ERROR 1452: FK fails en customer_addresses
ERROR 1452: FK fails en customer_package_items
ERROR 1452: FK fails en payment_allocations
ERROR 1452: FK fails en shipment_packages
SELECT users QA regreso Empty set
SELECT id, code, status FROM shipments fallo porque shipments no tiene columna code
```

### Causa probable

- La sesion MySQL estaba comparando literales/variables con `utf8mb4_general_ci` contra columnas `utf8mb4_unicode_ci`.
- Las variables criticas (`@company_id`, `@branch_id`, usuarios y catalogos) quedaban nulas cuando fallaban comparaciones por collation.
- Los inserts dependientes continuaban con IDs nulos y terminaban rompiendo columnas `NOT NULL` o FKs.
- El dataset usaba SELECTs de validacion heredados con nombres incorrectos; `shipments` usa `folio`, no `code`.

### Correccion aplicada

Se actualizo `docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql` con estas defensas:

- `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci`.
- `SET collation_connection = 'utf8mb4_unicode_ci'`.
- Literales y variables de texto con `_utf8mb4 ... COLLATE utf8mb4_unicode_ci`.
- Comparaciones de texto con `COLLATE utf8mb4_unicode_ci`.
- Tablas temporales de guardia con columnas `NOT NULL` para detener la ejecucion si falta un ID critico.
- SELECTs `OK_...` / `MISSING_...` despues de resolver IDs criticos.
- Catalogos QA con codigos unicos y compatibles con schema limpio V75.
- Validaciones finales usando `shipments.folio`, no `shipments.code`.

El dataset sigue sin guardar passwords ni credenciales. Requiere `@qa_password_hash` definido solo en la sesion MySQL antes de ejecutar `SOURCE`.

### Instrucciones de reset y aplicacion

Usar solo ambiente local/staging QA. No ejecutar en produccion.

1. Resetear schema QA si se quiere una corrida limpia:

```sql
DROP DATABASE IF EXISTS control_ropa_ship_e_smoke;
CREATE DATABASE control_ropa_ship_e_smoke
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

2. Levantar backend externamente contra `control_ropa_ship_e_smoke` para que Flyway aplique hasta V75.
3. En el cliente MySQL, definir el hash QA local solo en la sesion actual.
4. Aplicar el dataset:

```sql
USE control_ropa_ship_e_smoke;
SET @qa_password_hash = '<hash QA local no documentado>';
SOURCE E:/CtrlPan/2026/control-ropa-app-ship-e/docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql;
```

Si aparece cualquier `MISSING_...` o falla una tabla temporal de guardia, detener la corrida y no continuar con smoke. Si el script se detiene dentro de la transaccion, ejecutar `ROLLBACK;` antes de reintentar.

Resultado esperado de SELECTs finales:

```text
qa.admin@local.test -> has_manage_shipments = 1
qa.vendedor.centro@local.test -> has_manage_shipments = 0
qa.sinpermisos@local.test -> rol NO_ACCESS y has_manage_shipments = 0
SHIPE-QA-ENV-001 -> status OPEN, assigned_amount 120.00, shipping_paid 0.00, shipping_balance 120.00
SHIPE-QA-PKG-001 -> merchandise_total 300.00, merchandise_paid 100.00, merchandise_balance 200.00
```

### Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: se corrigio el dataset con los errores reales de MySQL 5.7, pero falta aplicarlo manualmente en `control_ropa_ship_e_smoke` y ejecutar smoke API/visual. No se marca `GO_CLIENTE` hasta que dataset y smoke pasen.

## SHIP-E-ENV-QA-SMOKE dataset aplicado

Fecha de preparacion: 2026-07-01.

### Estado confirmado por ambiente

El dataset `docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql` fue aplicado manualmente sobre `control_ropa_ship_e_smoke`.

Folios vigentes para SHIP-E:

- Envio: `SHIPE-QA-ENV-001`
- Paquete: `SHIPE-QA-PKG-001`

No usar los folios anteriores `SHIPD-QA-ENV-001` ni `SHIPD-QA-PKG-001` para esta fase.

Datos confirmados despues de aplicar dataset:

- `qa.admin@local.test`: existe, `ACTIVE`, con `MANAGE_SHIPMENTS`.
- `qa.vendedor.centro@local.test`: existe, `ACTIVE`, sin `MANAGE_SHIPMENTS`.
- `qa.sinpermisos@local.test`: existe, `ACTIVE`, con rol `NO_ACCESS`.
- `SHIPE-QA-ENV-001`: existe en `OPEN`.
- Costo real de envio: `120.00`.
- Reparto asignado: `120.00`.
- Pagado en envio: `0.00`.
- Saldo de envio: `120.00`.
- `SHIPE-QA-PKG-001`: existe.
- Mercancia total: `300.00`.
- Mercancia pagada: `100.00`.
- Saldo mercancia: `200.00`.

Backend y frontend estaban levantados externamente:

- Backend: `http://localhost:8090`, `/api/health` OK.
- Frontend: `http://localhost:8081`, HTTP 200.

### Validaciones locales ejecutadas desde Codex

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, 0 errores, 72 warnings preexistentes.
- `npx.cmd expo export --platform web`: OK.
- `git --no-pager diff --check`: OK, solo warnings CRLF.
- `rg` de mojibake en archivos SHIP-E/docs: detecta patrones historicos documentados en docs SHIP-D/SHIP-E; no se detecto nuevo mojibake en el dataset.

### Smoke API y visual

No ejecutado desde Codex en esta corrida.

Motivo: el proceso de Codex no hereda credenciales ni contiene una variable de password/token QA disponible. Para evitar exponer credenciales o reutilizar sesiones de navegador sin autorizacion explicita, no se intento login por API ni extraccion de token desde browser/CDP.

Para completar smoke y subir a `GO_CLIENTE`, hace falta ejecutar con un mecanismo seguro de autenticacion QA disponible para el proceso de smoke, o ejecutar manualmente los casos con evidencia:

- Login `qa.admin@local.test`.
- `SHIPE-QA-ENV-001` en `OPEN` con saldo envio `120.00`: dispatch bloqueado con mensaje claro.
- Registrar pago de envio hasta saldo `0.00`.
- Dispatch permitido con saldo `0.00`.
- En `OUT_FOR_DELIVERY`: logistica y reparto bloqueados.
- Confirmar recibido permitido con saldo `0.00`.
- En estado final: registrar/cancelar pagos de envio bloqueado.
- `qa.vendedor.centro@local.test`: sin acciones indebidas de envio.
- `qa.sinpermisos@local.test`: acceso operativo bloqueado.
- Paquetes mantiene mercancia limpia y resumen breve de envio.

### Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: backend completo ya fue validado manualmente, dataset QA ya aplica, frontend compila/exporta, y los servicios locales responden. Falta smoke API/visual autenticado con usuarios QA para recomendar `GO_CLIENTE`.

## SHIP-E-QA-DATASET-FIX-3

Fecha de preparacion: 2026-07-01.

### Error detectado

El smoke visual admin quedo bloqueado porque el backend respondia 500 al consultar envios y paquetes QA.

Error real del backend:

```text
No enum constant com.hpsqsoft.ctrlropa.customerpackage.CustomerPackageAddressSource.CUSTOMER_ADDRESS
```

Endpoints afectados:

```text
GET /api/shipments/branch/3
GET /api/customer-packages/branch/3/ready-for-shipment
GET /api/shipments/folio/SHIPE-QA-ENV-001
```

### Causa

El dataset insertaba `CUSTOMER_ADDRESS` en `customer_packages.shipping_address_source`, pero ese valor no existe en el enum Java `CustomerPackageAddressSource`.

Valores reales del enum:

```text
CUSTOMER_PRIMARY_ADDRESS
CUSTOMER_SAVED_ADDRESS
CUSTOM_PACKAGE_ADDRESS
PICKUP_NO_ADDRESS
CUSTOMER_PROVIDED_LABEL
LOCAL_DELIVERY
```

Como el dataset crea una direccion guardada en `customer_addresses` y guarda su id en `source_customer_address_id`, el valor correcto para representar esa direccion es:

```text
CUSTOMER_SAVED_ADDRESS
```

### Correccion aplicada

Se actualizo `docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql`:

- `shipping_address_source` cambio de `CUSTOMER_ADDRESS` a `CUSTOMER_SAVED_ADDRESS`.
- Se agrego un SELECT final para validar `shipping_address_source`, `source_customer_address_id` y `shipping_address_confirmed` del paquete `SHIPE-QA-PKG-001`.

No se modifico codigo Java, migraciones ni configuracion.

### Instrucciones para repetir

1. Resetear `control_ropa_ship_e_smoke` si se quiere corrida limpia.
2. Levantar backend externo para que Flyway deje el schema en V75.
3. Definir `@qa_password_hash` solo en la sesion MySQL.
4. Ejecutar:

```sql
USE control_ropa_ship_e_smoke;
SET @qa_password_hash = '<hash QA local no documentado>';
SOURCE E:/CtrlPan/2026/control-ropa-app-ship-e/docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql;
```

5. Confirmar en SELECT final:

```text
SHIPE-QA-PKG-001 -> shipping_address_source = CUSTOMER_SAVED_ADDRESS
source_customer_address_id no nulo
shipping_address_confirmed = 1
```

Despues de aplicar este fix, repetir smoke visual/API de SHIP-E con los folios `SHIPE-QA-ENV-001` y `SHIPE-QA-PKG-001`.

### Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: el dataset fue corregido contra el enum real, pero falta resetear/aplicar de nuevo y repetir smoke. No marcar `GO_CLIENTE` hasta que el detalle de envio cargue sin 500 y el flujo visual completo pase.

## SHIP-E-QA-DATASET-FIX-4

Fecha de preparacion: 2026-07-01.

### Bloqueo encontrado

Durante el smoke visual admin, el flujo avanzo hasta registrar pago real de envio por `$120.00` desde UI y el saldo de envio quedo en `$0.00`. Sin embargo, `Marcar enviado` siguio bloqueado con el mensaje:

```text
Todos los paquetes deben estar en READY para despachar
```

Tambien se detecto una inconsistencia visual en el paquete `SHIPE-QA-PKG-001`:

```text
Resumen del paquete: Abonado mercancia $200.00 / Saldo mercancia $100.00
Linea de prenda: Pagado $100.00 / Pendiente $200.00
```

### Causa

El dataset dejaba el paquete asociado al envio en `customer_packages.status = 'OPEN'`, pero `ShipmentService.dispatch` exige que todos los `CustomerPackage` asociados esten en `READY` antes de marcar el envio como enviado.

La regla real de `CustomerPackageService.markReady` confirma que `READY` representa un paquete cerrado/listo para envio y no puede convivir con saldo de mercancia pendiente. Por eso no era correcto forzar `READY` manteniendo saldo pendiente.

La inconsistencia de abonos venia de `payment_allocations`: el dataset asignaba el mismo pago de mercancia con `sale_id` y `customer_package_id` al mismo tiempo. El detalle del paquete suma pagos de linea por `sale_id` y pagos a nivel paquete por `customer_package_id`, provocando doble conteo.

### Correccion aplicada

Se actualizo `docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql`:

- El paquete `SHIPE-QA-PKG-001` queda en `READY`.
- La mercancia del paquete queda completamente pagada: total `$300.00`, pagado `$300.00`, saldo `$0.00`.
- `sales.payment_status` queda en `PAID`.
- El pago de mercancia queda por `$300.00`.
- `payment_allocations` aplica el pago solo a la venta: `sale_id = @sale_id`, `customer_package_id = NULL`.
- El paquete registra `closed_at` y `closed_by_user_id` para representar el cierre operativo coherente con `READY`.
- Los SELECTs finales validan `package_status`, mercancia pagada y saldo de envio.

### Decision sobre READY

Decision: usar paquete asociado completamente pagado y `READY`.

Motivo: SHIP-E prueba cierre operativo de envio. Para que el envio avance a `OUT_FOR_DELIVERY`, la barrera de mercancia debe estar cumplida antes de validar los bloqueos propios de envio. Mantener saldo de mercancia pendiente en el mismo paquete haria incoherente el dataset con reglas productivas.

La validacion de independencia cambia de "saldo mercancia pendiente $200.00" a "pago de envio no modifica una mercancia ya cerrada y pagada": el paquete debe permanecer con total `$300.00`, pagado `$300.00`, saldo `$0.00` antes y despues de registrar/cancelar pagos de envio.

### Instrucciones para repetir

1. Detener backend si esta apuntando a `control_ropa_ship_e_smoke`.
2. Resetear el schema limpio:

```sql
DROP DATABASE IF EXISTS control_ropa_ship_e_smoke;
CREATE DATABASE control_ropa_ship_e_smoke CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Levantar backend externamente con variables MySQL cargadas solo en el proceso para que Flyway reconstruya hasta V75.
4. En MySQL, cargar `@qa_password_hash` solo en la sesion local.
5. Aplicar dataset:

```sql
USE control_ropa_ship_e_smoke;
SET @qa_password_hash = '<hash QA local no documentado>';
SOURCE E:/CtrlPan/2026/control-ropa-app-ship-e/docs/shipments/APP_MODA_SHIP_E_QA_DATASET.sql;
```

6. Confirmar SELECTs finales:

```text
SHIPE-QA-ENV-001 -> OPEN
SHIPE-QA-PKG-001 -> READY
real_shipping_cost -> 120.00
assigned_amount -> 120.00
shipping_paid -> 0.00
shipping_balance -> 120.00
merchandise_total -> 300.00
merchandise_paid -> 300.00
merchandise_balance -> 0.00
shipping_address_source -> CUSTOMER_SAVED_ADDRESS
```

7. Repetir smoke admin:

```text
OPEN + saldo envio 120.00 bloquea dispatch.
Registrar pago de envio 120.00.
Saldo envio 0.00.
Marcar enviado permitido.
Logistica y reparto bloqueados despues de enviado.
Confirmar recibido permitido.
Pagos/cancelaciones bloqueados en estado final.
Paquetes sigue mostrando mercancia y resumen breve de envio.
```

### Decision

Decision actual: `GO_CONTROLADO_INTERNO`.

Motivo: dataset corregido para reglas reales de `READY` y conteo de mercancia. Falta resetear, aplicar dataset y repetir smoke visual/API completo antes de recomendar `GO_CLIENTE`.
## SHIP-E-CIERRE-SMOKE

Fecha de cierre visual/controlado: 2026-07-01.

### Resultado admin

Usuario: `qa.admin@local.test`.

Resultado: OK funcional.

Evidencia validada:

- `/shipments` carga sin 500.
- `SHIPE-QA-ENV-001` aparece en `OPEN`.
- El detalle del envio carga sin 500.
- Con saldo de envio pendiente `$120.00`, la pantalla muestra bloqueo operativo.
- `Marcar enviado` queda bloqueado con mensaje controlado por saldo de envio pendiente.
- Se registro pago de envio por `$120.00` desde UI.
- El saldo de envio quedo en `$0.00`.
- `Marcar enviado` quedo permitido y avanzo a `OUT_FOR_DELIVERY` / enviado.
- Despues de enviado, logistica y reparto quedan bloqueados.
- `Confirmar recibido` avanzo el envio a `DELIVERED` / entregado.
- En estado final, registrar pagos de envio y cancelar pagos de envio quedan bloqueados con mensaje controlado.

### Paquetes limpio

Resultado: OK.

Evidencia validada:

- `/customer-packages` conserva el enfoque de mercancia y solo muestra resumen breve de envio.
- `/customer-package-detail` muestra abonos solo de mercancia.
- El resumen de envio es breve y la accion `Ver envio` navega al modulo Envíos.
- No se vuelve a mostrar costo, pago, cobro o saldo de envio como flujo principal de Paquetes.

### Fase vendedor sin MANAGE_SHIPMENTS

Usuario: `qa.vendedor.centro@local.test`.

Resultado: OK.

Logs backend de permisos negativos esperados:

```text
GET /api/customer-packages/branch/3/ready-for-shipment -> 403
GET /api/shipments/branch/3 -> 403
GET /api/shipments/folio/SHIPE-QA-ENV-001 -> 403
Motivo: Permiso requerido: MANAGE_SHIPMENTS
```

Evidencia UI:

- El usuario no ve acciones operativas indebidas de envio.
- No puede registrar pagos de envio.
- No puede cancelar pagos de envio.
- No puede marcar enviado.
- La UI no muestra error crudo ni pantalla rota.
- Los bloqueos se presentan como mensajes controlados o estados sin acciones disponibles.

### Fase usuario sin permisos

Usuario: `qa.sinpermisos@local.test`.

Resultado: OK.

Log backend esperado:

```text
POST /api/auth/login -> 403
Motivo: No tienes permisos asignados para acceder al sistema
```

Evidencia UI:

- El login/acceso operativo queda bloqueado de forma controlada.
- El usuario `NO_ACCESS` no llega a operacion de envios ni paquetes.
- No hay pantalla rota.

### Bug visual del modal de pago de envio

Hallazgo: despues de registrar un pago de envio, el modal `Registrar pago de envio` podia quedar superpuesto con datos anteriores hasta recargar la pagina, aunque el pago se registraba correctamente y el saldo de envio se actualizaba.

Decision: corregido ahora de forma minima antes de `GO_CLIENTE`.

Correccion aplicada en `app/shipment-detail.tsx`:

- Se agrego `closeShippingPaymentModal` para centralizar el cierre del modal.
- Al cerrar o cancelar, se limpia la linea seleccionada y los campos del formulario.
- Al registrar pago exitosamente, se actualiza `shippingPayments`, se cierra el modal y se limpian datos stale.
- No se tocaron pagos de mercancia, backend, migraciones ni reportes.

### Validaciones de cierre

Validaciones ejecutadas despues de la correccion del modal:

```text
npx.cmd tsc --noEmit -> OK
npm.cmd run lint -> OK, 0 errores, 72 warnings preexistentes
npx.cmd expo export --platform web -> OK
backend/control-ropa/.\mvnw.cmd test -> OK manual externo, 236 tests, 0 failures, 0 errors, schema control_ropa_ship_e_smoke V75
```

Revision final adicional:

```text
git --no-pager diff --check -> OK, solo warnings CRLF de Git.
rg mojibake -> observacion conocida: aparecen falsos positivos en docs por mencionar el patron de busqueda y mojibake preexistente en app/report-* y app/users-form.tsx. No aparece mojibake nuevo en app/shipment-detail.tsx.
```

### Decision final

Decision: `GO_CLIENTE`.

Motivo: SHIP-E paso backend completo en ambiente MySQL valido, smoke admin funcional, permisos negativos de vendedor y usuario sin permisos, validacion de Paquetes limpio, bloqueo por saldo de envio pendiente, pago de envio hasta saldo cero, despacho, confirmacion de recibido, bloqueo de operaciones en estado final y correccion del bug visual menor del modal.
