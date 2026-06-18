# ERP - Reglas obligatorias de tenant enforcement

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Tipo: reglas tecnicas, sin implementacion

## Objetivo

Definir reglas no negociables para implementar multi-compania sin fuga de datos.

## Reglas absolutas

1. Ninguna query sensible sin `company_id`.
2. Ningun lookup global accidental por id, folio, codigo o QR.
3. Todo `branch_id` debe validarse contra `company_id`.
4. Todo usuario debe pertenecer a la company activa.
5. Todo permiso ERP debe resolverse por company.
6. Toda accion HPSQ-SOFT debe usar permisos SaaS y auditoria.
7. Todo reporte debe filtrar por company en cada join.
8. Todo log/auditoria sensible debe incluir company.
9. Ningun cache compartido sin company en la key.
10. Ninguna exportacion sin filtro tenant y auditoria.

## Query enforcement

Para tablas tenant-scoped:

```text
WHERE company_id = :activeCompanyId
```

Si la tabla no tiene `company_id` directo:

- Debe unirse a cabecera tenant.
- Debe estar documentado.
- Debe tener prueba negativa.

Prohibido:

- `findById(id)` en datos sensibles sin validar company.
- `findByCode(code)` global para prendas, lotes, pagos, clientes.
- Reportes con joins sin company.

## Branch enforcement

Validar:

- Branch existe.
- Branch pertenece a activeCompanyId.
- Usuario puede acceder a branch.
- Branch esta activa.

Aplicar a:

- Clientes.
- Inventario.
- Lotes.
- Ventas.
- Pagos.
- Caja.
- Live.
- Reportes.
- Dashboard.

## User/company enforcement

Validar:

- Usuario esta activo.
- Usuario pertenece a company.
- Company esta activa o en estado permitido.
- Usuario tiene permisos en esa company.
- Usuario no hereda permisos de otra company.

## Entity enforcement

Cada entidad recibida por id debe validarse:

- `customerId`
- `itemId`
- `batchId`
- `saleId`
- `paymentId`
- `reservationId`
- `liveId`
- `orderId`
- `packageId`
- `shipmentId`
- `returnId`
- `refundId`
- `supplierId`

Respuesta recomendada si no pertenece:

- 404 si revelar existencia filtra informacion.
- 403 si es claro que el usuario no tiene acceso.

## Lookup enforcement

Lookups riesgosos:

- codigo de prenda.
- QR de prenda.
- folio de lote.
- folio de paquete.
- folio de envio.
- telefono de cliente.
- folio pedido.

Regla:

- Buscar dentro de company activa.
- Si se decide codigo/QR global, aun asi validar que la entidad pertenece a company antes de devolver datos.

## Report enforcement

Todo reporte debe:

- Recibir o resolver company activa.
- Validar branch si se envia.
- Filtrar company en tablas base.
- Filtrar company en joins.
- Evitar totales globales.
- Auditar exportaciones.

Reportes P0:

- daily-store.
- daily-deposits.
- daily-deliveries.
- daily-cancellations.
- live-control.
- remissions.
- movement-history.
- dashboard metrics.

## Audit enforcement

Auditar:

- Login/logout/cambio password.
- Cambio company activa.
- Intento cross-company bloqueado.
- Venta/pago/cancelacion.
- Lote recibido/conciliado/cancelado.
- Movimiento inventario.
- Reporte exportado.
- Accion HPSQ-SOFT.
- Soporte delegado.

Campos:

- companyId.
- branchId.
- userId.
- supportSessionId.
- action.
- entity.
- result.
- reason.
- requestId.
- correlationId.

## Logs tenant-aware

Logs deben incluir:

- requestId.
- correlationId.
- companyId si aplica.
- userId si aplica.
- endpoint.
- status.
- duracion.

Logs no deben incluir:

- token completo.
- password.
- datos de tarjeta.
- informacion personal innecesaria.
- datos de otra company en un error.

## Cache enforcement

Toda cache debe incluir:

```text
companyId + scope + key
```

Ejemplos:

- `company:{companyId}:branch:{branchId}:catalogs`
- `company:{companyId}:dashboard:{branchId}:{date}`
- `company:{companyId}:permissions:{userId}`

Prohibido:

- Cache global de catalogos configurables.
- Cache global de permisos usuario sin company.
- Cache de reportes sin company.

## SaaS enforcement

- Rutas SaaS solo con `SAAS_*`.
- Roles HPSQ separados.
- `HPSQ_SUPPORT` requiere sesion soporte para company.
- `HPSQ_BILLING` no debe ver detalle operativo sensible.
- `COMPANY_ADMIN` no puede abrir consola SaaS.
- Toda accion SaaS auditable.

## Jobs y procesos batch futuros

Todo job debe:

- Iterar por company.
- Registrar company en logs.
- No mezclar datos entre companies.
- Tener limites por company.
- Ser reentrante/idempotente.

Ejemplos:

- cierres automaticos.
- reportes programados.
- limpieza de sesiones.
- alertas de suscripcion.

## Checklist por nuevo endpoint

Antes de aprobar:

- [ ] Identifica si es tenant-scoped.
- [ ] Usa `CurrentTenantContext`.
- [ ] Valida permiso por company.
- [ ] Valida branch si aplica.
- [ ] Valida entidades relacionadas.
- [ ] Query filtra company.
- [ ] Auditoria si es sensible.
- [ ] Error no filtra existencia cross-company.
- [ ] QA negativo A/B.

## Bloqueadores de release

- Endpoint P0 sin company validation.
- Query P0 sin company filter.
- Reporte sin filtro tenant.
- Soporte HPSQ sin auditoria.
- Cache compartida sin company.
- Accion SaaS sin motivo obligatorio cuando aplica.
