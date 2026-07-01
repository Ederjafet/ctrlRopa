# APP_MODA SHIP-D - Pagos reales de envio separados de mercancia

## Resumen ejecutivo

SHIP-D implementa pagos reales de envio separados de los pagos de mercancia. SHIP-C ya permitia repartir o asignar cuanto corresponde pagar a cada paquete/cliente; SHIP-D registra cuanto se pago realmente de esa parte y calcula saldo de envio.

La fase mantiene separados:

- Costo real del envio: vive en `Shipment`.
- Reparto del costo: vive en `ShipmentCostShare`.
- Pago real de envio: vive en `ShipmentPayment`.
- Pago de mercancia: sigue usando el modelo existente de `Payment` y no se modifica.

## Problema que resuelve

Antes de SHIP-D se podia tener costo real y reparto, por ejemplo `$180` dividido en tres clientes. Faltaba registrar que Ana pago `$60`, Rosa pago `$30` y Carmen no pago, y calcular el saldo de envio restante.

## Que implementa

- Tabla `shipment_payments`.
- Entidad `ShipmentPayment`.
- Estado de pago de envio: `REGISTERED` y `CANCELLED`.
- Registro de pago real de envio.
- Cancelacion logica de pago sin borrado fisico.
- Calculo de pagado y saldo por share.
- Calculo de pagado y saldo total de envio.
- UI en detalle de envio para ver y registrar pagos de envio.
- Tests focalizados en `ShipmentServiceTests`.

## Que no implementa

- Corte de caja formal.
- Conciliacion bancaria.
- Rentabilidad.
- Cuentas entre clientes.
- Centro del negocio con saldos de envio.
- REPORT-B.
- Cambios a pagos de mercancia.

## Modelo de datos

Entidad nueva: `ShipmentPayment`.

| Campo | Descripcion |
| --- | --- |
| `id` | Identificador interno. |
| `shipmentId` | Envio al que pertenece el pago. |
| `costShareId` | Share/asignacion al que se aplica. |
| `packageId` | Paquete relacionado. |
| `customerId` | Cliente al que corresponde la parte. |
| `paidByCustomerId` | Cliente que pago realmente, opcional. |
| `amount` | Monto pagado de envio. |
| `paymentMethod` | Metodo capturado como texto operativo. |
| `reference` | Referencia de pago. |
| `notes` | Notas. |
| `status` | `REGISTERED` o `CANCELLED`. |
| `registeredAt`, `registeredBy` | Auditoria de registro. |
| `cancelledAt`, `cancelledBy`, `cancelReason` | Auditoria de cancelacion. |
| `createdAt`, `updatedAt` | Auditoria tecnica. |

## Migracion

Migracion creada:

`backend/control-ropa/src/main/resources/db/migration/V73__shipment_payments.sql`

La migracion es no destructiva. No modifica `payments`, no borra campos legacy y agrega indices por envio, share, paquete, cliente, cliente pagador, `shipment_id/status` y `cost_share_id/status`.

## Decision sobre tabla de pagos existente

Se reviso el modelo actual `Payment`. No tiene un `paymentType`, `concept` o `shipmentId` claro para separar mercancia contra envio. Para evitar contaminar pagos de mercancia, SHIP-D usa tabla separada `shipment_payments`.

## Endpoints

### `GET /api/shipments/{id}/shipping-payments`

Devuelve resumen de pagos de envio:

- costo real,
- total asignado,
- pagado de envio,
- saldo de envio,
- absorbido por tienda,
- sobreasignado,
- shares con asignado/pagado/saldo,
- pagos registrados y cancelados.

### `POST /api/shipments/{id}/shipping-payments`

Registra pago de envio contra un share.

Valida que el envio exista, que el share pertenezca al envio, que paquete/cliente del request coincidan con el share cuando vienen informados, que el monto sea mayor a cero, que no exceda el saldo asignado y que no sea un envio cancelado. El sobrepago queda bloqueado por defecto.

### `PATCH /api/shipments/{id}/shipping-payments/{paymentId}/cancel`

Cancela logicamente un pago de envio. No borra el registro y recalcula saldos.

## UI

Pantalla modificada:

`app/shipment-detail.tsx`

Se agrega seccion `Pagos de envio` bajo el reparto:

- costo real,
- asignado a clientes,
- pagado de envio,
- saldo de envio,
- absorbido por tienda,
- tarjetas por cliente/paquete con asignado/pagado/saldo,
- modal `Registrar pago de envio`,
- modal `Cancelar pago de envio`.

Texto de alcance:

`Estos pagos corresponden unicamente al envio. No modifican el saldo de mercancia del paquete.`

## Calculos

Por share:

`paidAmount = suma de pagos REGISTERED del share`

`balanceAmount = assignedAmount - paidAmount`

Por envio:

`paidTotal = suma de pagos REGISTERED del envio`

`shippingBalance = assignedTotal - paidTotal`

Los pagos cancelados se muestran para trazabilidad, pero no suman.

## Permisos

Se reutiliza `MANAGE_SHIPMENTS`, consistente con los endpoints actuales de detalle/reparto de envios.

No se crean permisos nuevos.

## Casos de pago parcial

Si una parte asignada es `$60` y se registra un pago de `$30`, la linea queda:

- asignado: `$60`,
- pagado: `$30`,
- saldo envio: `$30`.

## Casos de cancelacion

Al cancelar un pago:

- cambia estado a `CANCELLED`,
- se guarda motivo,
- se conserva el registro,
- el saldo se recalcula sin ese pago.

## Riesgos pendientes

- El sobrepago queda bloqueado por defecto; si negocio requiere saldo a favor de envio, debe definirse en una fase posterior.
- Falta reporte de pagos de envio en Centro del negocio.
- Falta separacion visible de dinero cobrado de mercancia y dinero cobrado de envio en SHIP-E.
- Falta auditoria mas amplia si se requiere trazabilidad de cambios avanzados.

## Que queda para SHIP-E

- Actualizar Centro del negocio para mostrar saldos y pagos de envio.
- Separar dinero cobrado de mercancia contra dinero cobrado de envio.
- Mostrar envios por cobrar, envios cubiertos y envios listos para salir.
- Mantener advertencias para no llamar corte de caja a estos reportes.

## GO / NO-GO

GO_CONTROLADO_INTERNO si pagos de envio se registran, cancelan y calculan saldos sin tocar pagos de mercancia, tests focalizados pasan y frontend compila.

NO_GO si pagos de envio afectan saldo de mercancia, usuarios sin permiso pueden registrar pagos, se duplican pagos sin trazabilidad, o fallan tests por codigo.

## Cierre controlado SHIP-D-CLOSE

Fecha de cierre tecnico: 2026-06-30.

### Reglas verificadas

- Los pagos de envio usan `ShipmentPayment` y no reutilizan `Payment` de mercancia.
- `paidAmount` suma solo pagos `REGISTERED` del share.
- `balanceAmount` descuenta solo pagos `REGISTERED`.
- `paidTotal` suma solo pagos `REGISTERED` del shipment.
- `shippingBalance` se calcula como `assignedTotal - paidTotal`.
- Cancelar pago cambia estado a `CANCELLED`; no borra fisicamente.
- Los pagos cancelados permanecen visibles para trazabilidad, pero no suman.
- No se permite cancelar dos veces el mismo pago.
- No se permite monto cero o negativo.
- No se permite pago contra share que no pertenece al envio.
- No se permite manipular `packageId` o `customerId` para que contradigan el share.
- No se permite sobrepago; el pago no puede exceder el saldo asignado.
- No se modifica saldo de mercancia ni se invoca `PaymentService` en pagos de envio.
- Si ya existe historial de pagos de envio, registrado o cancelado, el reparto queda bloqueado para preservar FK y trazabilidad.

### Tenant / branch safety

Los endpoints pasan por `findShipment`, que valida el shipment con `tenantAccessGuard.requireBranch(...)`. Los shares se consultan por `shipmentId`; los pagos se consultan por `shipmentId`; y el registro de pago solo acepta un share obtenido de ese mismo shipment. El cliente pagador opcional debe pertenecer a los clientes incluidos en el envio.

### Migracion V73

`V73__shipment_payments.sql` depende funcionalmente de `V72__shipment_cost_shares.sql` porque referencia `shipment_cost_shares(id)`. La migracion es no destructiva, permite cancelacion logica mediante `status`, `cancelled_at`, `cancelled_by`, `cancel_reason`, y agrega FK/indices para shipment, share, paquete, cliente, cliente pagador, usuario registrador y usuario cancelador.

### Casos cubiertos por tests

`ShipmentServiceTests` cubre:

- registrar pago de envio parcial;
- listar pagos de envio;
- calcular saldo por share;
- calcular saldo total del envio;
- ignorar pagos `CANCELLED` en saldos;
- cancelar pago sin borrado fisico;
- bloquear doble cancelacion;
- bloquear monto cero o negativo;
- bloquear sobrepago;
- bloquear share de otro shipment;
- bloquear request con cliente que no coincide con el share;
- bloquear pagos en shipment cancelado;
- preservar validacion tenant/branch;
- bloquear modificacion de reparto cuando ya existe historial de pagos de envio;
- confirmar independencia contra pagos de mercancia con `verifyNoInteractions(paymentService)`.

### Validaciones de cierre

- `git --no-pager diff --check`: OK, solo warnings CRLF del worktree.
- `rg -n "Ã|Â" app components services locales backend/control-ropa/src`: OK.
- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK con warnings preexistentes, 0 errores.
- `npx.cmd expo export --platform web`: OK.
- `cd backend/control-ropa && .\mvnw.cmd -Dtest=ShipmentServiceTests test`: OK, 39 tests, 0 failures, 0 errors.
- `cd backend/control-ropa && .\mvnw.cmd test`: NO OK por ambiente local MySQL. Error exacto: `Access denied for user 'root'@'localhost' (using password: NO)`.

### Decision final

`GO_CONTROLADO_INTERNO`.

No se marca `GO_CLIENTE` porque falta suite backend completa en ambiente con MySQL valido y smoke visual con usuarios QA. Se puede continuar a SHIP-E cuando se valide V73 en una base real y se ejecute smoke de pagos de envio sin regresiones.
## SHIP-D-STAGING-SMOKE

Fecha de validacion: 2026-06-30.

### Objetivo

Validar SHIP-D contra una base MySQL valida antes de iniciar SHIP-E, cubriendo migraciones, suite backend completa, frontend, smoke de usuarios QA y flujo visual/funcional de pagos de envio.

### Configuracion de base

Se encontro `.env` local con `CONTROL_ROPA_DB_URL`, `CONTROL_ROPA_DB_USERNAME` y `CONTROL_ROPA_DB_PASSWORD` configurados. La corrida backend se ejecuto cargando esas variables en el proceso, sin exponer credenciales.

### Resultado de migraciones

Primer intento con base MySQL valida: `NO OK`.

Flyway conecto correctamente a MySQL, pero rechazo la rama por:

`Migration checksum mismatch for migration version 73`

Causa: `V73__shipment_payments.sql` ya habia sido aplicada en la base y posteriormente se habia modificado para agregar indices compuestos. No se ejecuto `flyway repair` ni se altero historial.

Correccion aplicada:

- Se restauro `V73__shipment_payments.sql` para mantener estable la migracion ya aplicada.
- Se creo migracion correctiva no destructiva `V74__shipment_payments_status_indexes.sql`.
- `V74` agrega:
  - `idx_shipment_payments_shipment_status (shipment_id, status)`
  - `idx_shipment_payments_cost_share_status (cost_share_id, status)`

Segundo intento con base MySQL valida: `OK`.

Evidencia Flyway:

- `Successfully validated 74 migrations`.
- `Current version of schema control_ropa: 74`.
- `Schema control_ropa is up to date. No migration necessary`.

Verificacion de `flyway_schema_history`:

- `V67__brands_tenant_company.sql`: success=1
- `V68__seed_brands_per_company.sql`: success=1
- `V69__create_customer_package_permission.sql`: success=1
- `V70__product_types_tenant_company.sql`: success=1
- `V71__shipment_logistics_source.sql`: success=1
- `V72__shipment_cost_shares.sql`: success=1
- `V73__shipment_payments.sql`: success=1
- `V74__shipment_payments_status_indexes.sql`: success=1

Verificacion de `shipment_payments`:

- Columnas de pago y cancelacion logica presentes: `status`, `registered_at`, `registered_by`, `cancelled_at`, `cancelled_by`, `cancel_reason`.
- FKs presentes hacia `shipments`, `shipment_cost_shares`, `customer_packages`, `customers`, `users` registrador y `users` cancelador.
- Indices presentes para shipment, share, paquete, cliente, cliente pagador, status, shipment/status y share/status.

### Suite backend completa

Resultado final con `.env` cargado: `OK`.

- Comando: `cd backend/control-ropa && .\mvnw.cmd test`
- Resultado: `Tests run: 209, Failures: 0, Errors: 0, Skipped: 0`
- Build: `BUILD SUCCESS`
- `ShipmentServiceTests`: `39 tests, 0 failures, 0 errors`.

### Validaciones frontend

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, 0 errores, 47 warnings preexistentes.
- `npx.cmd expo export --platform web`: OK.
- `git --no-pager diff --check`: OK, solo warnings CRLF del worktree.
- `rg -n "�|�" app components services locales backend/control-ropa/src`: OK, sin resultados.

### Smoke visual y funcional QA

Resultado: `NO EJECUTADO / BLOQUEADO POR DATASET QA`.

El backend local arranco correctamente con `.env` y `GET /api/health` respondio `200 OK`.

Se intento login con:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.sinpermisos@local.test`

El endpoint `POST /api/auth/login` respondio `403` para los usuarios QA. Al revisar la base, la consulta a `users` no devolvio registros para esos correos. Por lo tanto, no fue posible validar permisos ni flujo visual con los usuarios solicitados sin sembrar datos QA.

No se aplicaron scripts amplios de preparacion QA ni se modificaron usuarios manualmente, porque esta fase era de validacion de staging y no de preparacion de dataset.

### Smoke SHIP-D pendiente

Queda pendiente ejecutar con dataset QA disponible:

- abrir detalle de envio existente;
- confirmar seccion `Pagos de envio`;
- registrar pago parcial de envio;
- confirmar decremento de saldo de envio;
- confirmar que saldo de mercancia no cambia;
- registrar pago completo;
- confirmar saldo de envio en cero;
- intentar sobrepago y confirmar bloqueo;
- cancelar pago de envio;
- confirmar estado `CANCELLED`;
- confirmar que pago cancelado no suma en `paidAmount` ni `paidTotal`;
- confirmar que no se puede cancelar dos veces;
- confirmar que usuario sin permiso no puede registrar/cancelar pagos.

### Decision SHIP-D-STAGING-SMOKE

`GO_CONTROLADO_INTERNO` se mantiene.

No se marca `GO_CLIENTE` porque, aunque migraciones y suite backend completa ya pasan en MySQL valido, el smoke visual/funcional y la validacion de permisos con usuarios QA no pudieron ejecutarse por ausencia de dataset QA en la base.

No es `NO_GO` funcional de SHIP-D: no hubo fallas de codigo en migraciones, backend, frontend ni tests despues de la correccion V74. El bloqueo restante es de ambiente/datos QA.

### Requisitos para GO_CLIENTE

- Cargar o restaurar dataset QA con `qa.admin@local.test`, `qa.vendedor.centro@local.test` y `qa.sinpermisos@local.test`.
- Confirmar que existe al menos un envio con paquetes y reparto de costo, o crear un caso QA controlado.
- Ejecutar smoke funcional completo de pagos de envio.
- Validar permisos negativos de usuario sin acceso.
- Confirmar visualmente que UI muestra `Pagos de envio`, saldos y cancelacion de forma clara.

## SHIP-D-QA-DATASET-SMOKE

Fecha de validacion: 2026-06-30.

### Objetivo

Completar el bloqueo restante de SHIP-D creando/restaurando un dataset QA minimo, validando endpoints reales de pagos de envio, permisos negativos e independencia contra saldo de mercancia.

### Dataset QA creado/restaurado

Se creo el script controlado:

- `docs/shipments/APP_MODA_SHIP_D_QA_DATASET.sql`

El script no es migracion Flyway y no debe ejecutarse en produccion. Es idempotente sobre folios/correos prefijados `SHIPD-QA-*` y restaura solo el caso QA de esta fase.

Datos sembrados/restaurados:

- Tenant: `MARLA_BUTIQUE`.
- Sucursal: `TUXTLAN`.
- Usuario admin: `qa.admin@local.test`, rol `ADMIN`, con `MANAGE_SHIPMENTS`.
- Usuario vendedor: `qa.vendedor.centro@local.test`, rol `SELLER`, sin `MANAGE_SHIPMENTS`.
- Usuario negativo: `qa.sinpermisos@local.test`, rol `NO_ACCESS`, sin permisos directos.
- Cliente QA: `QA Cliente SHIP-D`.
- Paquete: `SHIPD-QA-PKG-001`.
- Envio: `SHIPD-QA-ENV-001`.
- Reparto de costo de envio: `assignedAmount = 120.00`.
- Costo real de envio: `realShippingCost = 120.00`.
- Saldo inicial de envio: `120.00`.
- Saldo de mercancia independiente: prenda de `300.00`, abono de mercancia `100.00`, saldo de mercancia `200.00`.

Nota de dataset: el codigo real del tenant en la base local es `MARLA_BUTIQUE` y el nombre visible existente es `Marla Butique`; el script usa el codigo real para no crear otro tenant.

### Smoke funcional/API con usuarios QA

Backend levantado temporalmente con `scripts/dev-backend.cmd`; `GET /api/health` respondio `200 OK`. Despues del smoke se detuvo el proceso que escuchaba en `8090`.

Usuarios:

- `qa.admin@local.test`: login `200`, contiene `MANAGE_SHIPMENTS`.
- `qa.vendedor.centro@local.test`: login `200`, no contiene `MANAGE_SHIPMENTS`.
- `qa.sinpermisos@local.test`: login bloqueado con `403`, esperado por `NO_ACCESS`.

Flujo validado con `qa.admin@local.test`:

- `GET /api/shipments/{id}/shipping-payments`: saldo inicial de envio `120.00`.
- `POST /api/shipments/{id}/shipping-payments` pago parcial `50.00`: `paidTotal = 50.00`, `shippingBalance = 70.00`.
- Saldo de mercancia despues del pago parcial: `paidAmount = 100.00`, `pendingAmount = 200.00`, sin cambio.
- Pago de complemento por `70.00`: `paidTotal = 120.00`, `shippingBalance = 0.00`.
- Saldo de mercancia despues de completar envio: `paidAmount = 100.00`, `pendingAmount = 200.00`, sin cambio.
- Intento de sobrepago por `1.00`: bloqueado con `400` y mensaje `El pago de envio no puede exceder el saldo asignado.`
- Cancelacion logica del pago parcial: el pago queda `CANCELLED`; `paidTotal = 70.00`; `shippingBalance = 50.00`; el pago cancelado no cuenta en `paidAmount` ni `paidTotal`.
- Saldo de mercancia despues de cancelar pago de envio: `paidAmount = 100.00`, `pendingAmount = 200.00`, sin cambio.
- Doble cancelacion del mismo pago: bloqueada con `400`.

Permisos negativos:

- `qa.vendedor.centro@local.test`:
  - `GET /api/shipments/{id}/shipping-payments`: `403`.
  - `POST /api/shipments/{id}/shipping-payments`: `403`.
  - `PATCH /api/shipments/{id}/shipping-payments/{paymentId}/cancel`: `403`.
- Sin sesion:
  - `POST /api/shipments/{id}/shipping-payments`: `401`.

Resultado del smoke funcional/API: `OK`.

### Validaciones finales

- `cd backend/control-ropa && .\mvnw.cmd test` con `.env` cargado: OK, `Tests run: 209, Failures: 0, Errors: 0, Skipped: 0`.
- `ShipmentServiceTests`: OK, `39 tests, 0 failures, 0 errors` dentro de la suite completa.
- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, `0 errors`, `47 warnings` preexistentes.
- `npx.cmd expo export --platform web`: OK.
- `git --no-pager diff --check`: OK, solo warnings CRLF del worktree.
- `rg -n "Ã|Â" app components services locales backend/control-ropa/src`: OK, sin resultados.

### Resultado visual

No se ejecuto smoke visual interactivo en navegador con usuarios humanos ni Playwright/Puppeteer, porque el proyecto no tiene Playwright/Puppeteer instalado y esta corrida se realizo por API/backend real mas build/export frontend.

Se valido que la ruta web `/shipment-detail` compila y exporta correctamente en `npx.cmd expo export --platform web`, y que los textos/componentes de `app/shipment-detail.tsx` ya contienen la seccion `Pagos de envio`, resumen de costo/asignado/pagado/saldo y texto aclaratorio de que estos pagos no modifican el saldo de mercancia.

### Decision SHIP-D-QA-DATASET-SMOKE

`GO_CONTROLADO_INTERNO` se mantiene.

La razon no es funcional: dataset QA, endpoints, permisos negativos, suite backend completa y frontend quedaron validados. No se sube a `GO_CLIENTE` porque falta smoke visual interactivo real en navegador/tablet con usuarios QA, condicion explicitamente requerida para ese nivel de cierre.

### Requisito restante para GO_CLIENTE

- Ejecutar smoke visual interactivo en navegador/tablet con `qa.admin@local.test`, `qa.vendedor.centro@local.test` y `qa.sinpermisos@local.test`.
- Confirmar visualmente que la seccion `Pagos de envio` muestra costo asignado, pagado, saldo, registrar pago, cancelacion y mensajes de bloqueo segun permisos.

Con esa evidencia visual, SHIP-D puede subir a `GO_CLIENTE` sin cambios funcionales adicionales si no aparece regresion.

## SHIP-D-UX-SEPARAR-PAQUETES-ENVIOS

### Objetivo

Alinear la experiencia visual posterior a SHIP-D con la separacion funcional ya implementada:

- Paquetes = mercancia, prendas, abonos y saldo de mercancia.
- Envios = logistica, costo real de envio, reparto, pagos de envio, saldo de envio, guia, paqueteria y estado logistico.

No se inicio SHIP-E, no se agrego funcionalidad nueva, no se modificaron entidades, migraciones, pagos de mercancia, shares ni reglas backend.

### Que se quito o simplifico en Paquetes

En `app/customer-packages.tsx` se simplifico la bandeja para que no presente cobro/costo de envio como parte del paquete:

- Se quitaron filtros visibles de costo/cobro de envio como `Con envio cobrado`, `Sin envio cobrado`, `Envio pendiente`, `Sin tipo` y equivalentes.
- Se reemplazaron por filtros operativos de vinculo/estado: `Sin envio`, `Pendiente configurar`, `En preparacion`, `Enviado`, `Entregado`.
- Las tarjetas de paquete ya no muestran importes de envio, `Envio cobrado`, `Sin cobro`, `Por cobrar`, direccion completa ni paqueteria como dato principal.
- La bandeja muestra solo resumen minimo: `Envio: Sin envio`, `Envio: Pendiente de configurar`, `Envio: En preparacion`, `Envio: Enviado` o `Envio: Entregado`, con folio cuando existe.
- La accion operativa queda como `Ver envio` o `Crear envio`, condicionada a `MANAGE_SHIPMENTS`.

En `app/customer-package-detail.tsx` se limpio el detalle para centrarlo en mercancia:

- Las metricas principales ahora son `Total mercancia`, `Abonado mercancia`, `Saldo mercancia`, `Estado pago`, `Saldo a favor` y prendas.
- Los abonos de paquete dicen explicitamente que aplican solo a mercancia.
- Se reemplazo la seccion/formulario principal de `Entrega y envio` por una tarjeta breve de `Resumen de envio`.
- La tarjeta no muestra costo real, costo asignado, cobrado, saldo de envio, guia, paqueteria detallada ni direccion completa.
- Los envios asociados se muestran como vinculo/estado, con nota de que direccion, guia, costo, reparto y pagos se consultan en `Envios`.
- Se elimino la accion visible de `Liberar envio` desde Paquetes; Paquetes dirige a `Ver envio` o `Crear envio`.

En `app/customer-addresses-create.tsx` se corrigio el texto heredado que indicaba que destinatario/telefono final se capturan en paquete. Ahora indica que se completan en `Envios` cuando se prepara la logistica.

### Que queda como resumen minimo en Paquetes

- Estado del paquete.
- Estado de pago de mercancia.
- Resumen de mercancia: prendas, total, abonado y saldo.
- Estado del envio asociado cuando existe.
- Folio del envio asociado cuando existe.
- Accion `Ver envio` para usuarios con `MANAGE_SHIPMENTS`.
- Accion `Crear envio` para usuarios con `MANAGE_SHIPMENTS` si no hay envio asociado.
- Mensaje no tecnico para usuarios sin permiso: las acciones operativas de envio se realizan desde `Envios` con permiso correspondiente.

No se muestra informacion financiera de envio dentro de abonos de mercancia.

### Que se mantiene en Envios

El modulo `Envios` y `app/shipment-detail.tsx` se mantienen como lugar operativo para:

- destino y direccion;
- tipo de entrega;
- paqueteria y guia;
- costo real de envio;
- reparto del costo de envio;
- pagos reales de envio;
- saldo de envio;
- estado logistico;
- preparacion, despacho, entrega y confirmacion.

No se movieron pagos de envio hacia Paquetes.

### Confirmacion de independencia mercancia/envio

Esta fase fue de UI/texto/mapeo visual. No se tocaron pagos de mercancia, `ShipmentPayment`, migraciones V73/V74, endpoints de SHIP-D ni calculos backend. La separacion tecnica validada en SHIP-D se conserva:

- pagos de mercancia siguen en su flujo existente;
- pagos de envio siguen en `ShipmentPayment`;
- saldo de mercancia no se recalcula por pagos de envio;
- saldo de envio no se mezcla con abonos de paquete.

### Resultado de validaciones

Validaciones ejecutadas en esta fase:

- `git --no-pager diff --check`: OK; solo warnings CRLF del worktree.
- `rg -n "Ã|Â" app components services locales backend/control-ropa/src`: OK, sin resultados.
- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, 0 errores. Quedan warnings del repositorio; en `customer-package-detail.tsx` hay warnings nuevos de helpers legacy de envio que quedaron no renderizados para no reescribir el flujo ni tocar reglas en esta fase.
- `npx.cmd expo export --platform web`: OK.
- `cd backend/control-ropa && .\mvnw.cmd test`: OK despues de sanear comillas simples del `.env` solo en el proceso de prueba; `Tests run: 209, Failures: 0, Errors: 0, Skipped: 0`. Flyway valido 74 migraciones y el schema esta en version 74.

Nota ambiental: el primer intento de backend fallo porque `CONTROL_ROPA_DB_URL` estaba entre comillas simples en `.env` y el cargador temporal no las retiro. No se modifico `.env`; se corrigio solo la carga de variables del proceso de prueba.

### Resultado de smoke visual

No se ejecuto smoke visual interactivo real con `qa.admin@local.test`, `qa.vendedor.centro@local.test` ni `qa.sinpermisos@local.test` en navegador/tablet durante esta corrida.

Se valido por build/export que las rutas `/customer-packages`, `/customer-package-detail`, `/shipments` y `/shipment-detail` compilan para web. Queda pendiente la confirmacion visual con dataset QA:

- `qa.admin@local.test`: Paquetes limpio, boton `Ver envio`/`Crear envio`, y Envios conserva costo/direccion/logistica/pagos.
- `qa.vendedor.centro@local.test`: no ve acciones indebidas de envio desde Paquetes.
- `qa.sinpermisos@local.test`: bloqueo operativo esperado.

### Decision

`GO_CONTROLADO_INTERNO` se mantiene.

La razon no es funcional: compilacion frontend, export web y suite backend completa pasan. No se sube a `GO_CLIENTE` porque falta smoke visual interactivo real con usuarios QA, condicion requerida por la fase para confirmar que la separacion se entiende en navegador/tablet.

### Pendiente antes de SHIP-E

Ejecutar smoke visual con dataset QA y confirmar:

- Paquetes no muestra costo, direccion, guia, pago ni saldo de envio como operacion principal.
- Paquetes muestra solo resumen minimo y navega a Envios.
- Envios conserva costo, reparto, pagos, saldo, guia, paqueteria y direccion.
- Usuarios sin `MANAGE_SHIPMENTS` no ven acciones operativas desde Paquetes ni reciben errores 403 visuales por botones indebidos.

## SHIP-D-VISUAL-SMOKE-FINAL

### Fecha y entorno

- Fecha: 2026-06-30.
- Rama: `feature/flow-fast-1-prenda-paquete-pagos-saldo`.
- Backend temporal: `http://localhost:8090`.
- Frontend temporal: `http://localhost:8081`.
- Navegador usado: Google Chrome con Chrome DevTools Protocol.
- Viewports cubiertos: escritorio `1440x1000` y tablet `900x1100`.
- Evidencia local no versionada: `_local-private/shipd-visual-smoke/screenshots/` y `_local-private/shipd-visual-smoke/visual-smoke-results.json`.

### Servicios y puertos

- `/api/health`: OK `200`.
- Frontend web: OK `200` durante el smoke.
- Al terminar, se detuvo el backend de prueba con `taskkill /PID 56308 /F` porque PowerShell normal devolvio `Acceso denegado`.
- Puertos confirmados libres al cierre: `8090/8081 libres`.

### Usuarios QA

- `qa.admin@local.test`: login OK, con `MANAGE_SHIPMENTS`.
- `qa.vendedor.centro@local.test`: login OK, sin `MANAGE_SHIPMENTS`.
- `qa.sinpermisos@local.test`: bloqueado antes de operar, login/operacion devuelve `403/401` segun contexto.

### Resultado visual

`qa.admin@local.test`:

- `/customer-packages` carga y muestra `Total mercancia`, `Abonado mercancia` y `Saldo mercancia`.
- Paquetes no muestra como dato principal costo, pago, saldo, guia ni paqueteria detallada de envio.
- `/customer-package-detail?id=11` carga con metricas principales de mercancia, abonos solo de mercancia y `Resumen de envio` breve.
- El detalle de paquete no muestra costo de envio, pagado de envio, saldo de envio, guia ni paqueteria como operacion principal.
- `/shipment-detail?id=2` carga para `SHIPD-QA-ENV-001` y muestra `Reparto del costo de envio`, `Pagos de envio`, `Costo real del envio`, `Pagado de envio`, `Saldo de envio` y accion `Registrar pago`.
- En viewport tablet se mantiene visible `Pagos de envio` y `Registrar pago`.

`qa.vendedor.centro@local.test`:

- No aparecen acciones indebidas para registrar o cancelar pagos de envio.
- Endpoints sensibles devuelven `403` y la UI no queda rota.

`qa.sinpermisos@local.test`:

- No llega a operacion de paquetes/envios.
- No se observo pantalla rota en el flujo bloqueado.

### Smoke funcional/API complementario

- Pago parcial de envio `10.00`: `paidTotal` sube de `70.00` a `80.00`; `shippingBalance` baja de `50.00` a `40.00`.
- Cancelacion del pago parcial: `paidTotal` vuelve a `70.00`; `shippingBalance` vuelve a `50.00`.
- Pago completo por saldo restante `50.00`: `paidTotal = 120.00`; `shippingBalance = 0.00`.
- Sobrepago posterior: bloqueado con `POST 400`.
- Cancelacion por vendedor sin permiso: bloqueada con `PATCH 403`.
- Cancelacion por admin: OK; saldos recalculados.
- Doble cancelacion: bloqueada con `PATCH 400`.
- Saldo de mercancia se mantiene independiente: `paidAmount = 100.00` y `pendingAmount = 200.00` antes/despues de pagos de envio.

### Warnings observados

- `npm.cmd run lint`: OK con `0 errors` y `71 warnings`.
- Se corrigio el warning simple de `app/customer-packages.tsx` (`no-unused-expressions`).
- Quedan warnings de helpers legacy de envio no renderizados en `customer-package-detail.tsx` y un hook dependency preexistente en `customer-addresses-create.tsx`; no se refactorizaron para evitar tocar reglas fuera de esta fase.
- Durante el smoke con Expo dev server aparecieron warnings `shadow* style props are deprecated` y `Cannot pipe to a closed or destroyed stream` al cerrar sesiones CDP; no bloquearon el smoke y `expo export` paso correctamente.

### Validaciones finales

- `git status --short`: ejecutado; worktree sigue sucio por fases previas y `_local-private/` queda no versionado.
- `git diff --stat`: ejecutado.
- `git diff --name-only`: ejecutado.
- `git --no-pager diff --check`: OK; solo warnings CRLF del worktree.
- `rg -n "Ã|Â|Ãƒ|Ã‚" app components services locales backend/control-ropa/src`: OK, sin resultados.
- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK, `0 errors`, `71 warnings`.
- `npx.cmd expo export --platform web`: OK.
- `backend/control-ropa/.\mvnw.cmd test`: primer intento sin cargar `.env` fallo por ambiente (`Access denied for user 'root'@'localhost' (using password: NO)`). Repetido con `.env` cargado y comillas sanitizadas solo en proceso: OK, Surefire `242 tests`, `0 failures`, `0 errors`, `0 skipped`; Flyway valido `74` migraciones y schema `74`.

### Decision final

`GO_CLIENTE`.

SHIP-D queda cerrado para demo cliente: pagos de envio siguen separados de mercancia, Paquetes queda enfocado visualmente en mercancia, Envios concentra logistica/costo/reparto/pagos/saldo de envio, permisos negativos estan controlados, smoke visual en Chrome/CDP paso con `failedCount = 0`, frontend compila/exporta y backend completo pasa en ambiente MySQL valido.

No se inicio SHIP-E, no se agrego funcionalidad nueva, no se modificaron migraciones V73/V74, no se hizo `git add`, commit, push ni merge.

### Siguiente paso

Se puede preparar commit selectivo de SHIP-D/SHIP-D-UX y despues continuar con SHIP-E en una fase separada.