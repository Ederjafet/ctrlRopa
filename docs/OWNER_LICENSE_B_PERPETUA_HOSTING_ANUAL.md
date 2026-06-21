# OWNER-LICENSE-B Licencia perpetua y hosting anual

Fecha: 2026-06-21

Rama:

- `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Problema de negocio

AppModa necesitaba separar el derecho de uso del sistema de los servicios anuales de infraestructura. Marla Boutique puede tener una licencia perpetua pagada una sola vez, pero el hosting, base de datos, respaldos o monitoreo solo aplican si AppModa hospeda la infraestructura.

Esta fase no implementa facturacion real, pasarela de pago, recibos, factura fiscal ni pagos operativos.

## Modelo implementado

Se eligieron tablas separadas para no sobrecargar `company_subscriptions`:

- `company_licenses`: registra licencia perpetua, monto cobrado, moneda, fecha, metodo, referencia, notas, vigencia y banderas de sin vencimiento/sin restricciones.
- `company_service_agreements`: registra servicio anual de infraestructura, tipo de hospedaje, estado, monto anual, inicio, vencimiento, renovacion y notas.

Esto separa:

- Licencia de uso del sistema.
- Servicio anual de hosting/infraestructura.
- Pagos operativos de apartados, paquetes y clientas finales.

## Migracion

Se agrego:

- `V63__owner_license_service_agreements.sql`

La migracion:

- crea `company_licenses`;
- crea `company_service_agreements`;
- agrega permisos especificos;
- asigna permisos al rol `PLATFORM_OWNER`;
- no inserta datos de Marla Boutique ni datos fake.

## Endpoints

Se agrego endpoint combinado:

- `GET /api/platform/companies/{companyId}/commercial-agreement`
- `PUT /api/platform/companies/{companyId}/commercial-agreement`

El payload contiene:

- `license`
- `serviceAgreement`

Reglas:

- Solo empresa cliente puede modificarse.
- `CLIENT_HOSTED` fuerza servicio anual `NOT_APPLICABLE`.
- `APPMODA_HOSTED` o `HYBRID` permiten registrar servicio anual.
- No se escribe en tablas de pagos operativos.

## Permisos

Permisos nuevos:

- `VIEW_PLATFORM_LICENSES`
- `MANAGE_PLATFORM_LICENSES`
- `VIEW_PLATFORM_SERVICE_AGREEMENTS`
- `MANAGE_PLATFORM_SERVICE_AGREEMENTS`

El Platform Owner los recibe por migracion.

Tenant admin no puede crear ni modificar licencias o servicios anuales.

## Panel Owner

La seccion se renombro visualmente a:

- `Planes / Licencias`

Se agregaron bloques:

- Catalogo global de planes.
- Precios del plan.
- Licencia del cliente.
- Infraestructura / servicio anual.
- Suscripcion del cliente.

La licencia del cliente permite registrar:

- estado;
- monto cobrado;
- moneda;
- fecha;
- metodo;
- referencia;
- notas;
- sin vencimiento;
- sin restricciones comerciales.

Infraestructura permite registrar:

- cliente hospedado;
- AppModa hospedado;
- mixto;
- otro;
- servicio anual activo/no aplica/vencido/suspendido/cancelado;
- monto anual;
- inicio y vencimiento.

## Dashboard SaaS

El dashboard global ahora puede reflejar:

- clientes con licencia perpetua;
- cobros unicos registrados;
- clientes AppModa hospedados;
- servicios anuales vencidos;
- servicios anuales proximos a vencer.

El ingreso mensual estimado sigue usando solo suscripciones activas con precios por periodo. La licencia perpetua no se suma al MRR.

## Clientes / Companias

Un cliente con licencia perpetua activa:

- no aparece como `sin plan`;
- muestra `Licencia perpetua`;
- muestra `Pago unico`;
- muestra `Sin restricciones` si aplica;
- muestra hosting `Cliente hospedado` o `AppModa hospedado`;
- muestra servicio anual `No aplica`, `Activo`, `Vencido`, etc.

Si la licencia es perpetua y sin restricciones, los limites comerciales se muestran como `sin limite` en resumen SaaS.

## Caso Marla Boutique

No se hardcodeo Marla Boutique.

Para registrar el caso:

1. Entrar como Platform Owner.
2. Seleccionar Marla Boutique como cliente en administracion.
3. Ir a `Planes / Licencias`.
4. En `Licencia del cliente`, guardar licencia perpetua activa con monto, moneda, metodo y referencia.
5. Si el servidor/base son del cliente:
   - Tipo de hospedaje: `Cliente hospedado`.
   - Servicio anual: `No aplica`.
6. Si AppModa hospeda:
   - Tipo de hospedaje: `AppModa hospedado`.
   - Servicio anual: `Activo`.
   - Capturar monto anual, inicio y vencimiento.

## Auditoria

El endpoint nuevo queda cubierto por `system_movement_audit_log` al usar ruta `/api/platform`.

La auditoria global traduce el cambio como:

- `COMPANY_COMMERCIAL_AGREEMENT_UPDATED`

Limitacion actual:

- No hay diff before/after de campos; queda para hardening de auditoria SaaS.

## Validaciones realizadas

- `./mvnw.cmd test` con `.env` cargado: OK.
- `npm run lint`: OK con warnings historicos.
- `npx tsc --noEmit`: OK.
- `git diff --check`: OK.

## Backlog

- Recibo PDF.
- Factura fiscal.
- Adjuntar comprobante.
- Recordatorios de vencimiento.
- Suspension automatica de hosting por impago.
- Auditoria before/after por entidad.
- Dashboard de servicios anuales por periodo.
