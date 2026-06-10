# ERP - Bitacora de cambios

## 2026-06-10 - LIVE-PRICE-C autorizacion cambio de precio LIVE

Tipo: backend, frontend minimo, permisos, migracion, autorizaciones LIVE, documentacion.

Objetivo:

- Implementar un MVP seguro para solicitar, aprobar y aplicar cambio de precio LIVE sin tocar pagos, caja, devoluciones ni venta financiera.

Cambios realizados:

- Se reutiliza `operational_authorization_requests` con `LIVE_PRICE_CHANGE`.
- Se agrega migracion `V57__live_price_authorization_permissions.sql`.
- Se agregan permisos `REQUEST_LIVE_PRICE_CHANGE`, `APPROVE_LIVE_PRICE_CHANGE`, `APPLY_APPROVED_LIVE_PRICE_CHANGE`, `VIEW_LIVE_PRICE_AUTHORIZATIONS` y `CHANGE_LIVE_PRICE`.
- La aplicacion cambia solo `reservations.price` de apartado LIVE activo sin pago y con prenda `RESERVED`.
- Se agrega evento `LIVE_PRICE_CHANGE_APPLIED`.
- La UI minima de `/operational-authorizations` permite crear solicitud de precio con ID de apartado y precio solicitado.

Restricciones respetadas:

- No se tocaron pagos, caja, devoluciones, venta financiera ni precio historico de ventas cerradas.
- No se invento precio LIVE temporal; queda pendiente hasta que exista modelo.

Pendientes:

- Smoke API real con dataset desechable.
- QA visual con screenshots por rol.
- UI contextual desde LIVE/reservas.

## 2026-06-10 - LIVE-AUTH-B2 UI autorizaciones operativas LIVE

Tipo: frontend, autorizaciones operativas LIVE, documentacion, evidencia.

Objetivo:

- Exponer una pantalla minima para listar, solicitar, aprobar/rechazar y aplicar autorizaciones operativas LIVE usando el backend MVP de B1.

Cambios realizados:

- Se agrego `/operational-authorizations` con listado, detalle y acciones segun permisos.
- Se agrego servicio frontend para `/api/operational-authorizations`.
- Se agrego entrada de navegacion en Operacion solo para usuarios con permisos de autorizacion LIVE.
- Se agregaron textos i18n ES/EN.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, venta financiera, RBAC, permisos, endpoints ni migraciones.
- La aplicacion real queda limitada a `UNDO_LIVE_OPERATIONAL_SALE`, que ya soporta backend B1.

Pendientes:

- QA visual con navegador/screenshots.
- Smoke API mutante con dataset desechable.

## 2026-06-10 - LIVE-PERM-FIX-A1 enforcement retirar prenda al aire

Tipo: backend autorizacion, LIVE permisos, pruebas, evidencia.

Objetivo:

- Corregir el NO_GO de LIVE-QA-C donde vendedor podia retirar la prenda al aire por API sin `REMOVE_LIVE_ACTIVE_ITEM`.

Cambios realizados:

- `LiveService.assertCanRemoveLiveActiveItem` exige estrictamente `REMOVE_LIVE_ACTIVE_ITEM`.
- Se elimina `DO_LIVE_RESERVATION` como fallback solo para retirar prenda al aire.
- Se agregan pruebas de permiso dedicado, rechazo con permiso de apartado y continuidad de cambio/puesta de prenda.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints ni migraciones.
- No se cambio venta financiera.
- `DO_LIVE_RESERVATION` conserva su uso para apartados LIVE.

Pendientes:

- Smoke API autenticado con dataset desechable y vendedor real: esperar `403` al retirar active item.
- QA visual si se requiere evidencia de UI.

## 2026-06-10 - HOME-LIVE-A card de LIVE activo en inicio

Tipo: frontend read-only, UX operativa, documentacion, evidencia.

Objetivo:

- Mostrar en inicio un resumen corto del LIVE activo para usuarios con acceso LIVE, sin reemplazar el contenido actual del dashboard.

Cambios realizados:

- Se agrego un card superior en `app/index.tsx` antes de metricas, pendientes y accesos rapidos.
- Se reutilizaron servicios existentes de LIVE, reservas y eventos en modo lectura.
- Se agregaron textos i18n ES/EN para el card.
- No se agrego backend ni endpoints.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se cambio venta financiera ni logica de inventario/reservas.
- No se ejecutaron mutaciones reales.

Pendientes:

- QA visual real por rol con navegador/screenshot.

## 2026-06-10 - ITEM-Z8 consistencia final LIVE, inventario y reservas

Tipo: auditoria tecnica, consistencia operativa, documentacion, evidencia.

Objetivo:

- Cerrar la consistencia entre prenda al aire, inventario, reservas, estado operativo LIVE y eventos antes de avanzar a venta financiera/pagos/caja.

Cambios realizados:

- Se documento la matriz final de consistencia LIVE/inventario/reservas.
- Se confirmo que `active_item_id` no cambia `items.status`.
- Se confirmo que la reserva cambia `AVAILABLE -> RESERVED` con update atomico y constraint de reserva `ACTIVE` por item.
- Se confirmo que la cancelacion segura libera solo `RESERVED -> AVAILABLE` para reserva `ACTIVE` sin pago activo.
- Se confirmo que `OPERATIONAL_SOLD` exige reserva LIVE `ACTIVE` + item `RESERVED`, registra evento LIVE y no toca venta financiera.
- No se aplicaron cambios funcionales porque no se detecto inconsistencia nueva dentro del alcance.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se crearon endpoints ni migraciones.
- No se implemento venta financiera.

Pendientes:

- QA API/visual real con dataset LIVE desechable.
- Conversion financiera real y reversas quedan para fase futura con aprobacion explicita.

## 2026-06-10 - ITEM-Z7 vendido operativo LIVE seguro

Tipo: backend defensivo, LIVE operativo, pruebas, evidencia.

Objetivo:

- Asegurar que `OPERATIONAL_SOLD` sea solo un cierre operativo LIVE seguro, sin convertirlo en venta financiera ni tocar inventario fuera del apartado.

Cambios realizados:

- `ReservationService.updateLiveOperationalStatus` valida que el cierre `OPERATIONAL_SOLD` solo aplique sobre reserva LIVE `ACTIVE`.
- Se bloquea `CANCELLED`, `CONVERTED_TO_SALE` y apartado LIVE operativamente `CANCELLED`.
- Se exige que el item asociado siga `RESERVED`.
- Se conserva `item.status` sin cambiar a `SOLD` ni liberar a `AVAILABLE`.
- Se conserva trazabilidad existente en `live_events` con `LIVE_OPERATIONAL_SOLD`.
- Se agregaron pruebas de exito y rechazo para estados historicos y items no reservados.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se crearon endpoints ni migraciones.
- No se implemento venta financiera.

Pendientes:

- QA API/visual real con dataset LIVE desechable.
- Flujo futuro de conversion financiera y reversas con autorizacion formal.

## 2026-06-09 - ITEM-Z6B cancelacion y liberacion segura de apartados

Tipo: backend defensivo, inventario transaccional, pruebas, evidencia operativa.

Objetivo:

- Cancelar solo reservas `ACTIVE` sin pago activo y liberar inventario de forma condicional.

Cambios realizados:

- `ReservationService.cancel` rechaza `CANCELLED` y `CONVERTED_TO_SALE` con mensajes claros.
- Se bloquea cancelacion normal si la reserva tiene allocation de pago `ACTIVE`.
- Se agrego `ItemRepository.releaseIfReserved(...)` para liberar `RESERVED -> AVAILABLE` con update condicional.
- Se evita forzar `AVAILABLE` si el item esta `SOLD`, `DISABLED`, `ON_CONSIGNMENT`, `AVAILABLE` o si el update condicional afecta 0 filas.
- Se conserva trazabilidad de rechazo con `VALIDATION_REJECTED`.
- Se agregaron pruebas focalizadas de cancelacion normal, pagos activos/anulados, estados historicos, item no reservado y reserva LIVE.

Restricciones respetadas:

- No se tocaron caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se crearon endpoints ni migraciones.
- No se implemento reversa financiera.

Pendientes:

- QA API/visual real con ambiente MySQL configurado.
- Flujo formal de reversa/autorizacion para apartados con pago activo.

## 2026-06-09 - ITEM-Z5D trazabilidad de reservas rechazadas

Tipo: backend defensivo, migracion aditiva, retencion operativa, pruebas, evidencia.

Objetivo:

- Registrar intentos de reserva rechazados para diagnostico operativo sin guardar payload completo ni secretos.
- Limpiar llaves de idempotencia expiradas para evitar crecimiento indefinido.

Cambios realizados:

- Se creo `V54__reservation_rejection_events.sql`.
- Se agrego tabla `reservation_rejection_events` separada de auditoria de seguridad y de `live_events`.
- `ReservationService.create` registra rechazos por item no disponible, reserva activa, mismatch de idempotencia, llave en progreso y validaciones de negocio relevantes.
- La llave `X-Idempotency-Key` se registra solo como hash SHA-256.
- Se agrego limpieza programada configurable para `reservation_idempotency_keys` vencidas.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se crearon endpoints nuevos.
- No se cambio venta financiera.
- No se guarda payload completo.

Pendientes:

- QA API/visual real con usuarios operativos.
- Consola o reporte operativo futuro para consultar rechazos si soporte lo requiere.
- Definir retencion historica de `reservation_rejection_events` si el volumen crece.

## 2026-06-09 - ITEM-Z5C constraint de reserva activa por item

Tipo: migracion de consistencia, backend defensivo, pruebas, evidencia operativa.

Objetivo:

- Impedir multiples reservas `ACTIVE` para el mismo item sin bloquear historicos cancelados o convertidos.

Cambios realizados:

- Se creo `V53__active_reservation_item_constraint.sql`.
- Se agrego columna generada `active_reservation_item_id` en `reservations`.
- Se agrego unique `uq_reservations_active_item`.
- `ReservationService.create` detecta la violacion del unique y devuelve error de negocio claro.
- Se ajustaron pruebas para usar `saveAndFlush` en la creacion de reserva.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se crearon endpoints nuevos.
- No se cambio venta financiera.
- No se modifico idempotencia ITEM-Z5B.

Pendientes:

- Resolver duplicados activos legacy si existen antes de aplicar en ambientes compartidos.
- QA API/visual real con usuarios operativos.
- ITEM-Z5D para trazabilidad de intentos rechazados.

## 2026-06-09 - ITEM-Z5B idempotencia backend de reservas

Tipo: backend transaccional, migracion minima, frontend tecnico, evidencia operativa.

Objetivo:

- Evitar doble submit exacto y reintentos de red en creacion de reservas sin tocar pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.

Cambios realizados:

- Se agrego soporte opcional de `X-Idempotency-Key` en `POST /api/reservations`.
- Se creo la tabla `reservation_idempotency_keys` mediante `V52__reservation_idempotency_keys.sql`.
- Se guarda hash SHA-256 del payload relevante, no payload completo.
- Reintentos con la misma llave y mismo payload devuelven la reserva existente.
- Reutilizar la llave con payload distinto se rechaza como conflicto.
- El frontend genera una llave por intento de reserva y mantiene `isSavingReservation` como proteccion visual.

Restricciones respetadas:

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se cambiaron endpoints fuera de reservas.
- No se cambio la venta financiera.

Pendientes:

- QA API/visual real con usuarios operativos.
- Constraint de reserva activa por item.
- Limpieza de llaves expiradas y auditoria de intentos rechazados.

## 2026-05-28 - Documentacion integral de cierre AUTH y entrega QA

Tipo: documentacion de cierre, release handoff, continuidad operativa.

Cambios realizados:

- Se creo `docs/AUTH_RESUMEN_FINAL.md`.
- Se creo `docs/RELEASE_AUTH_QA_HANDOFF.md`.
- Se consolido el cierre documental del bloque AUTH desde AUTH-A hasta AUTH-Z.

## 2026-05-28 - AUTH-Z cierre integral de seguridad AUTH

Tipo: QA automatizado, cierre documental, evidencia operativa.

Objetivo:

- Consolidar la validacion final de seguridad AUTH con un smoke maestro.

Cambios realizados:

- Se creo `docs/AUTH_Z_SECURITY_FINAL_VALIDATION.md`.
- Se creo `docs/qa/99-auth-z-final-security-smoke.sh`.
- El smoke maestro encadena AUTH-F6, AUTH-H, AUTH-I2, AUTH-J2, AUTH-J4 y AUTH-J5.
- El smoke maestro genera reporte Markdown y CSV bajo `qa-reports/`.
- El checklist cubre bloqueo `NO_ACCESS`, sesion unica, aislamiento QA_A/QA_B/DEFAULT, auditoria, summary, alertas y exports.

Restricciones respetadas:

- No se tocaron pagos, ventas ni reportes funcionales.
- No se crearon migraciones.
- No se modificaron roles productivos.
- No se cambio la seguridad existente.

Validacion ejecutada:

- OK: `docs/qa/99-auth-z-final-security-smoke.sh` con Git Bash.
- Resultado consolidado: `PASS=6`, `FAIL=0`, `SKIP=0`.
- Reporte Markdown: `qa-reports/AUTH-Z-final-security-report-20260528-093110.md`.
- Reporte CSV: `qa-reports/AUTH-Z-final-security-report-20260528-093110.csv`.

## 2026-05-27 - AUTH-J5 export operativo de auditoria y alertas

Tipo: backend protegido, frontend minimo, evidencia operativa.

Objetivo:

- Permitir a soporte descargar evidencia CSV de eventos de auditoria y alertas.

Cambios realizados:

- Se creo `GET /api/security/audit-events/export.csv`.
- Se creo `GET /api/security/audit-events/alerts/export.csv`.
- Ambos endpoints exigen `VIEW_SECURITY_AUDIT`.
- El export de eventos respeta filtros de auditoria y omite `metadata_json` por default.
- El export de alertas respeta ventana, umbral, email, company y branch.
- Se agregaron botones `Exportar eventos CSV` y `Exportar alertas CSV` en `/system-security-audit`.
- Se creo `docs/qa/15-auth-j5-security-audit-export-smoke.sh`.
- Se creo `docs/AUTH_J5_SECURITY_AUDIT_EXPORTS.md`.
- Se ampliaron pruebas backend de `SecurityAuditEventQueryServiceTests`.

Restricciones respetadas:

- No se creo migracion.
- No se expusieron tokens, passwords, cuerpos de request ni metadata sensible.
- No se tocaron pagos, ventas ni reportes funcionales.

Validaciones ejecutadas:

- OK: `.\mvnw.cmd test`, 67 tests, 0 failures, 0 errors.
- OK: `npm.cmd run lint`, 0 errores, warnings historicos preexistentes.
- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`.
- OK: `docs/qa/15-auth-j5-security-audit-export-smoke.sh` con Git Bash, `PASS=13`, `FAIL=0`, `SKIP=0`.

## 2026-05-27 - AUTH-J4 alertas por patrones criticos de auditoria

Tipo: backend protegido, frontend minimo, seguridad operativa.

Objetivo:

- Detectar patrones criticos recientes sobre `security_audit_events`.

Cambios realizados:

- Se creo `GET /api/security/audit-events/alerts`.
- El endpoint exige `VIEW_SECURITY_AUDIT`.
- Se agrego `SecurityAuditAlertsResponse`.
- Se agregaron alertas por muchos 401, muchos 403, permiso denegado por email, token revocado por email, bloqueos tenant/branch/company, bloqueos por path y bloqueos `NO_ACCESS`.
- Se agrego la seccion compacta `Alertas recientes` en `/system-security-audit`.
- Se creo `docs/qa/14-auth-j4-security-alerts-smoke.sh`.
- Se creo `docs/AUTH_J4_SECURITY_AUDIT_ALERTS.md`.
- Se ampliaron pruebas backend de `SecurityAuditEventQueryServiceTests`.

Restricciones respetadas:

- No se creo migracion.
- No se enviaron correos ni notificaciones.
- No se expusieron tokens, passwords, cuerpos de request ni metadata sensible.
- No se tocaron pagos, ventas ni reportes funcionales.

Validaciones ejecutadas:

- OK: `.\mvnw.cmd test`, 65 tests, 0 failures, 0 errors.
- OK: `npm.cmd run lint`, 0 errors, warnings historicos preexistentes.
- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`.
- OK: `docs/qa/14-auth-j4-security-alerts-smoke.sh` con Git Bash, `PASS=13`, `FAIL=0`, `SKIP=0`.
- OK: `git diff --check`, solo warnings CRLF.

## 2026-05-27 - AUTH-J3 dashboard visual de auditoria

Tipo: frontend protegido, seguridad, soporte operativo.

Objetivo:

- Mostrar un resumen visual compacto de auditoria en `/system-security-audit`.

Cambios realizados:

- Se agrego `getSecurityAuditSummary` en `services/securityAuditService.ts`.
- La pantalla `/system-security-audit` ahora consulta `GET /api/security/audit-events/summary`.
- Se agregaron tarjetas de Total eventos, Total 401 y Total 403.
- Se agregaron secciones de eventos por tipo, eventos por status, top usuarios, top endpoints y eventos criticos recientes.
- El error del resumen queda aislado y no rompe el listado de eventos.
- Se creo `docs/AUTH_J3_SECURITY_AUDIT_DASHBOARD.md`.

Restricciones respetadas:

- No se agregaron librerias.
- No se expone `metadataJson`, tokens, passwords ni cuerpos de request.
- No se tocaron backend, migraciones, pagos, ventas ni reportes funcionales.

## 2026-05-27 - AUTH-J2 resumen estadistico de auditoria

Tipo: backend, seguridad, analitica operativa.

Objetivo:

- Consultar un resumen de eventos de seguridad sin revisar evento por evento.

Cambios realizados:

- Se creo `GET /api/security/audit-events/summary`.
- El endpoint exige `VIEW_SECURITY_AUDIT`.
- Se agrego `SecurityAuditSummaryResponse`.
- Se agregaron totales `totalEvents`, `total401` y `total403`.
- Se agregaron agrupaciones por evento, status, company, branch, email y path.
- Se agregaron eventos criticos recientes sin `metadataJson`.
- Se creo `docs/qa/13-auth-j2-security-audit-summary-smoke.sh`.
- Se creo `docs/AUTH_J2_SECURITY_AUDIT_SUMMARY.md`.
- Se ampliaron pruebas backend de `SecurityAuditEventQueryServiceTests`.

Restricciones respetadas:

- No se expusieron tokens, passwords ni metadata sensible.
- No se cambio la limpieza AUTH-J1.
- No se tocaron pagos, ventas ni reportes funcionales.

Validaciones ejecutadas:

- OK: `.\mvnw.cmd test`, 60 tests, 0 failures, 0 errors.
- OK: `docs/qa/13-auth-j2-security-audit-summary-smoke.sh`, `PASS=9`, `FAIL=0`, `SKIP=0`.
- OK: `git diff --check`, solo warnings CRLF.

## 2026-05-27 - AUTH-J1 retencion y limpieza segura de auditoria

Tipo: backend, seguridad, retencion operativa.

Objetivo:

- Controlar el crecimiento de `security_audit_events` con una politica configurable y segura.

Cambios realizados:

- Se agregaron propiedades:
  - `security.audit.retention-days=180`
  - `security.audit.cleanup.enabled=true`
  - `security.audit.cleanup-cron=0 0 3 * * *`
- Se creo `SecurityAuditRetentionProperties`.
- Se creo `SecurityAuditCleanupService` transaccional.
- Se creo `SecurityAuditCleanupJob` programado.
- Se habilito scheduling de forma acotada para limpieza de auditoria.
- Se agrego `deleteByOccurredAtBefore` en `SecurityAuditEventRepository`.
- Se agregaron pruebas unitarias para limpieza habilitada, deshabilitada y configuracion insegura.
- Se creo `docs/AUTH_J1_SECURITY_AUDIT_RETENTION.md`.

Restricciones respetadas:

- No se creo endpoint manual de purge.
- No se agrego migracion.
- No se cambio la forma de registrar ni consultar eventos.
- No se tocaron pagos, ventas ni reportes funcionales.

## 2026-05-27 - AUTH-I2 permiso dedicado para auditoria de seguridad

Tipo: RBAC, backend protegido, frontend protegido, QA automatizado.

Objetivo:

- Separar la consulta de auditoria de seguridad de la administracion de configuracion de seguridad.

Cambios realizados:

- Se creo la migracion `V46__auth_i2_view_security_audit_permission.sql`.
- Se agrego el permiso `VIEW_SECURITY_AUDIT` al catalogo backend.
- `GET /api/security/audit-events` ahora requiere `VIEW_SECURITY_AUDIT`.
- La ruta `/system-security-audit` y el tile de Sistema ahora usan `VIEW_SECURITY_AUDIT`.
- Se creo `docs/qa/12-auth-i2-view-security-audit-qa.sql` para asignacion QA controlada a soporte.
- Se creo `docs/qa/12-auth-i2-view-security-audit-smoke.sh` con reportes Markdown/CSV.
- Se creo `docs/AUTH_I2_VIEW_SECURITY_AUDIT_PERMISSION.md`.

Pendientes:

- Ejecutar smoke visual en navegador con `qa.soporte@local.test` y prueba negativa con `qa.a.admin@local.test`.
- Definir asignacion productiva formal del permiso antes de exponerlo fuera de QA.

## 2026-05-27 - AUTH-I UI minima de auditoria de seguridad

Tipo: frontend protegido, seguridad, soporte operativo.

Objetivo:

- Consultar eventos de `security_audit_events` desde Sistema sin usar Workbench ni curl.

Cambios realizados:

- Se creo la ruta `/system-security-audit`.
- Se agrego el tile `Auditoria de seguridad` en Sistema. AUTH-I2 lo cambia a `VIEW_SECURITY_AUDIT`.
- Se creo `services/securityAuditService.ts`.
- La pantalla consume `GET /api/security/audit-events` usando `apiClient`.
- Se agregaron filtros por evento, email, status, ruta y rango de fechas.
- Se agrego listado paginado con fecha, evento, email, company, branch, metodo, ruta, status y motivo.
- No se muestra `metadataJson` por default.
- Se creo `docs/AUTH_I_SECURITY_AUDIT_UI.md`.

Validaciones ejecutadas:

- OK: `npm.cmd run lint` sin errores; warnings preexistentes.
- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`.

Pendientes:

- Smoke visual real con `qa.soporte@local.test` y prueba negativa con `qa.a.admin@local.test`.
- AUTH-I2 implementa el permiso dedicado `VIEW_SECURITY_AUDIT`.

## 2026-05-26 - AUTH-H consola protegida de auditoria de seguridad

Tipo: seguridad backend, consulta administrativa, smoke automatizado.

Objetivo:

- Consultar `security_audit_events` desde un endpoint protegido y automatizar evidencia de eventos de seguridad.

Cambios realizados:

- Se creo `GET /api/security/audit-events`.
- El endpoint exige `MANAGE_SECURITY_SETTINGS`.
- Se agregaron filtros por `eventType`, `email`, `companyId`, `branchId`, `statusCode`, `dateFrom`, `dateTo` y `path`.
- Se agrego paginacion basica y orden descendente por `occurred_at`.
- Se creo `docs/qa/11-auth-h-security-audit-smoke.sh`.
- El smoke genera reportes Markdown/CSV en `qa-reports/`.
- Se creo `docs/AUTH_H_SECURITY_AUDIT_CONSOLE.md`.

Validaciones ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado backend: `BUILD SUCCESS`, 50 tests, 0 failures, 0 errors.
- OK: `bash docs/qa/11-auth-h-security-audit-smoke.sh`.
- Resultado smoke: `PASS=9`, `FAIL=0`, `SKIP=0`.

Pendientes:

- UI administrativa futura para consultar auditoria desde Sistema/Seguridad.
- Evaluar permiso dedicado `VIEW_SECURITY_AUDIT` en RBAC avanzado.

## 2026-05-26 - AUTH-G auditoria de eventos de seguridad

Tipo: seguridad backend, auditoria, trazabilidad de accesos bloqueados.

Objetivo:

- Registrar eventos relevantes cuando el backend bloquea accesos por token invalido/revocado, falta de permisos, login bloqueado o intento cross-tenant/cross-branch.

Cambios realizados:

- Se creo la migracion `V45__auth_g_security_audit_events.sql`.
- Se creo la tabla `security_audit_events` con indices por fecha, usuario, company y tipo de evento.
- Se agregaron `SecurityAuditEvent`, `SecurityAuditEventRepository`, `SecurityAuditService` y `SecurityAuditEventType`.
- `ApiTokenFilter` registra `TOKEN_INVALID`, `TOKEN_REVOKED` o `SESSION_REVOKED` sin almacenar tokens completos.
- `AuthService` registra login bloqueado por `NO_ACCESS`, login sin permisos efectivos, company activa no resoluble y sesiones previas revocadas por nuevo login.
- `AccessService` registra `PERMISSION_DENIED`.
- `TenantAccessGuard` registra `BRANCH_DENIED` y `COMPANY_DENIED`.
- Se creo `docs/AUTH_G_SECURITY_AUDIT_EVENTS.md`.
- Se agregaron pruebas para token revocado, permiso faltante y branch/company denegada.

Pruebas ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 49 tests, 0 failures, 0 errors.

Pendientes:

- Crear consulta administrativa protegida para revisar eventos.
- Definir retencion/archivado y alertas de eventos repetidos.

## 2026-05-26 - AUTH-F6 suite de regresion negativa SaaS

Tipo: QA seguridad, smoke reproducible, regresion cross-tenant.

Objetivo:

- Crear una suite ejecutable para evitar regresiones de fuga SaaS entre QA_A, QA_B y DEFAULT.

Cambios realizados:

- Se creo `docs/AUTH_F6_SAAS_NEGATIVE_REGRESSION_SUITE.md`.
- Se creo `docs/qa/10-auth-f6-saas-negative-regression-smoke.sh`.
- El smoke usa `API_BASE_URL` configurable, login QA_A/QA_B, extraccion de `sessionToken` con `sed`, validaciones `PASS/FAIL/SKIP` y `exit 1` si un dato ajeno responde `200`.
- AUTH-F6B agrega generacion automatica de reportes Markdown y CSV en `qa-reports/` con test, endpoint, usuario/token, esperado, recibido, resultado, observacion, timestamp y API.
- Se cubren clientes, items, batches, pagos, ventas, reportes, reservaciones, direcciones, saldos y casos opcionales de paquetes/envios/refunds.
- Se valida token revocado con segundo login del mismo usuario.
- Smoke runtime local ejecutado con Git Bash explicito: `PASS=20`, `FAIL=0`, `SKIP=5`; reportes generados en `qa-reports/AUTH-F6-smoke-report-20260526-090627.md` y `.csv`.

Pendientes:

- Ejecutar smoke completo con IDs reales de paquetes, envios, refunds y folios de lote cuando el dataset QA los tenga disponibles.

## 2026-05-25 - AUTH-F5 hardening consumidores secundarios y financieros derivados

Tipo: seguridad backend, tenant validation secundaria, hardening financiero derivado.

Objetivo:

- Extender el bloqueo cross-tenant/cross-branch a reportes, reservaciones, paquetes, envios, saldos, devoluciones, pedidos, direcciones e historial propietario.

Cambios realizados:

- Se creo `TenantAccessGuard` para centralizar validacion de company activa y branch activa.
- `ReservationService` valida branch activa para branch, reserva, item, cliente, caja y transmision.
- `CustomerAddressService` y `CustomerOwnerHistoryService` validan el cliente contra la branch activa.
- `BalanceService` valida customer/order/movement/package/branch antes de consultar o aplicar saldo.
- `CustomerOrderService` valida orden y listados por branch contra branch activa.
- `CustomerPackageService` valida paquete, folio, cliente, item, venta y reserva; lookups code/QR usan company activa.
- `ShipmentService` valida envio, folio, paquete, direccion y branch activa.
- `RefundService` valida refund/return/customer/status por branch activa y lookups de item por company activa.
- Reportes diarios, remisiones, control live e historial de movimientos validan branch activa antes de calcular.
- Se creo `docs/AUTH_F5_SECONDARY_FINANCIAL_HARDENING.md`.

Pruebas ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 47 tests, 0 failures, 0 errors.

Riesgos pendientes:

- Ejecutar smoke curl completo QA_A/QA_B sobre cada endpoint secundario con datos reales.
- Crear permisos finos futuros para reportes/paquetes/envios/saldos si el negocio requiere diferenciacion por rol.

## 2026-05-25 - AUTH-F4 runtime cross-tenant hardening P0

Tipo: seguridad backend, runtime QA, tenant validation P0.

Objetivo:

- Validar runtime real QA_A/QA_B y bloquear fugas cross-tenant/cross-branch en clientes, items, batches, pagos y ventas.

Cambios realizados:

- `CustomerService`: `findById`, `update` y `deactivate` validan branch activa del token.
- `ItemService`: `findById`, `findByCode`, `lookupByCode`, `lookupByQrCode`, `update` y `changeLocation` validan branch activa.
- `BatchService`: `validateBatchBranch` valida contra tenant activo, company activa y branch activa.
- `PaymentService`: `findByCustomer`, `findByReservation`, `voidPayment`, `createByItemCode`, `createByQrCode` y target de venta/reserva validan tenant/branch activa.
- `SaleService`: `create` valida branch activa para branch solicitada, item y customer.
- Se creo `docs/AUTH_F4_CROSS_TENANT_RUNTIME_HARDENING.md` con comandos reproducibles y evidencia HTTP.

Evidencia runtime:

- QA_A branch `6` pudo consultar datos propios.
- QA_A contra branch `7` devolvio `403` en listados.
- QA_A contra customer QA_B devolvio `404`.
- QA_A contra pago/venta DEFAULT id `1` devolvio `403`.
- QA_A y QA_B resuelven codigo/QR/folio duplicados a su propio tenant.

Pruebas ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 44 tests, 0 failures, 0 errors.

Riesgos pendientes:

- Reportes, reservaciones, paquetes, envios, saldos y devoluciones aun requieren hardening equivalente antes de declarar SaaS financiero completo.

## 2026-05-25 - AUTH-F3 fix robustez cliente legacy status null

Tipo: robustez backend, datos legacy.

Objetivo:

- Corregir 500 en `PUT /api/customers/{id}` cuando un cliente legacy tiene `status = NULL`.

Cambios realizados:

- `CustomerService.update` conserva el status existente cuando el request no trae status.
- Si el cliente legacy tenia status nulo, `update` lo normaliza a `Status.ACTIVE` al guardar.
- `CustomerService.toResponse` usa fallback seguro `ACTIVE` si recibe status nulo.
- Se mantuvieron sin cambios `EDIT_CUSTOMER`, tenant validation y scope por company.

Pruebas ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 40 tests, 0 failures, 0 errors.

Riesgos pendientes:

- Revisar si existen otros registros legacy con columnas obligatorias nulas en tablas P0 antes de avanzar a enforcement mas fino.

## 2026-05-25 - AUTH-F3 fix tenant en pagos/ventas por ID

Tipo: seguridad backend, tenant validation P0.

Objetivo:

- Corregir fuga detectada en smoke runtime donde un usuario QA_A con permisos `VIEW_PAYMENTS`/`VIEW_SALES` podia consultar por id pagos o ventas de otra branch/company.

Cambios realizados:

- `PaymentService.findById` mantiene `VIEW_PAYMENTS` y ahora valida que el pago pertenece a la company/branch activa del token.
- `SaleService.findById` mantiene `VIEW_SALES` y ahora valida que la venta pertenece a la company/branch activa del token.
- `SaleService.findByBranch` tambien valida branch activa para evitar listados cross-branch por URL.
- Se agregaron pruebas negativas y positivas para pagos/ventas por id con branch activa vs branch ajena.

Pruebas ejecutadas:

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 38 tests, 0 failures, 0 errors.

Riesgos pendientes:

- Mantener smoke runtime con `qa.a.vendedor@local.test` para confirmar que `GET /api/payments/1` y `GET /api/sales/1` ya no devuelven datos de `QA_CTR` cuando la branch activa es `QA_A_CTR`.
- Revisar en fases siguientes otros endpoints financieros/reportes por id o por branch explicita.

## 2026-05-11 - Fase 0

Tipo: documentacion inicial ERP.

Cambios:

- Se genero inventario inicial de modulos, pantallas, endpoints, permisos, riesgos y roadmap.
- No se modifico codigo.
- No se modifico base de datos.
- No se generaron migraciones.

Hallazgos:

- Estado general MEDIO con flujos FRAGILES.
- Seguridad dispersa por servicios.
- UX y validaciones no homologadas.
- Proveedores/lotes/calidad existen, pero requieren consolidacion.
- Codificacion de textos con acentos rota en varios archivos.

Pendiente:

- Validar pruebas automatizadas reales.
- Validar cada endpoint contra permiso esperado.
- Validar cada pantalla en web y mobile.
- Confirmar control release sobre Git en cada fase.

## 2026-05-12 - Fase 1A

Tipo: estabilizacion UX minima y preparacion de regresion.

Objetivo:

- Corregir textos visibles con codificacion rota.
- Reducir exposicion de mensajes tecnicos al usuario.
- Documentar estandar minimo de UX para mensajes, validaciones y acceso denegado.
- Preparar base de QA para regresion.

Cambios realizados:

- Se creo `docs/ERP_FASE_1A_PLAN.md`.
- Se actualizaron reglas UX en `docs/ERP_GUIA_UI_UX.md`.
- Se actualizaron reglas de presentacion en `docs/ERP_MATRIZ_VALIDACIONES.md`.
- Se corrigieron mensajes visibles en `services/apiClient.ts`.
- Se verifico que no quedaran patrones de mojibake en `app`, `components`, `services`, backend Java y docs ERP.
- Se actualizo el resumen ejecutivo y riesgos operativos para reflejar que Git ya existe y que la rama de trabajo fue verificada.

Archivos modificados:

- `services/apiClient.ts`
- `docs/ERP_FASE_1A_PLAN.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_DEFINICION_DE_HECHO.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`.
- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.

Riesgos pendientes:

- `.tmp-pdf-images/` aparece como no rastreado en Git; no se toco.
- Aun existen muchas alertas nativas que deben homologarse en fases posteriores.
- Seguridad y permisos quedan fuera de alcance en Fase 1A.
- `.\mvnw.cmd test` emitio advertencias de Logback al rotar `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`; no bloqueo el build.
- `.\mvnw.cmd test` emitio advertencias por MySQL 5.7 fuera del soporte comunitario de Hibernate/Flyway y por Mockito dynamic agent; quedan para revision tecnica posterior.

Siguiente fase recomendada:

- Iniciar Fase 1B para checklist de regresion por flujo critico y limpieza de artefactos no rastreados.

## 2026-05-12 - Fase 1B

Tipo: gobernanza ERP, release control y criterios de terminado.

Objetivo:

- Formalizar Definition of Done por tamano de cambio.
- Formalizar checklist release ERP.
- Definir ownership por modulo.
- Definir arquitectura objetivo.
- Clasificar riesgos operativos con severidad, probabilidad, mitigacion y rollback.
- Mejorar roadmap con dependencias, criterios de salida, esfuerzo y riesgo.

Documentos creados:

- `docs/ERP_DEFINITION_OF_DONE.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_OWNERSHIP_MATRIX.md`
- `docs/ERP_TARGET_ARCHITECTURE.md`

Documentos actualizados:

- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Riesgos detectados:

- `.tmp-pdf-images/` y `cambios_fase1a.diff` aparecen como no rastreados; no se tocaron.
- Persisten riesgos criticos en permisos, ventas/pagos, auditoria de negocio y ausencia de regresion automatizada amplia.
- La seguridad sigue fuera de alcance hasta Fase 4.
- Existia `ERP_DEFINICION_DE_HECHO.md`; se conserva como alias historico y el documento canonico queda como `ERP_DEFINITION_OF_DONE.md`.

Siguiente fase sugerida:

- Fase 1C: limpieza de artefactos Git, checklist de regresion manual inicial y matriz endpoint-permiso preliminar sin cambios de seguridad.

## 2026-05-12 - Fase 1C

Tipo: regresion operacional, smoke tests, release flow e incident response.

Objetivo:

- Formalizar regresion operacional ERP.
- Definir smoke tests minimos pre/post-release.
- Documentar flujo feature -> develop -> QA -> main.
- Definir ambientes DEV/QA/STAGING/PROD.
- Documentar respuesta a incidentes operativos.
- Preparar matriz endpoint-permiso preliminar sin modificar seguridad real.

Documentos creados:

- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_RELEASE_FLOW.md`
- `docs/ERP_ENVIRONMENTS.md`
- `docs/ERP_INCIDENT_RESPONSE.md`

Documentos actualizados:

- `docs/ERP_MATRIZ_PERMISOS.md`
- `docs/ERP_MATRIZ_ENDPOINTS.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff` y `cambios_fase1b.diff` aparecen como no rastreados; no se tocaron.
- La matriz endpoint-permiso sigue siendo preliminar y debe validarse en Fase 4 contra codigo/servicios.
- Los flujos de pagos, ventas, live y lotes siguen siendo criticos y requieren regresion operacional antes de cualquier release.

Siguiente fase sugerida:

- Fase 1D: preparar datos QA y plantilla de evidencia de regresion por usuario/rol, sin tocar logica.

## 2026-05-12 - Fase 1D

Tipo: datos QA, usuarios por rol y evidencia de regresion.

Objetivo:

- Definir dataset QA repetible para smoke/regresion.
- Definir usuarios QA por perfil operativo.
- Crear plantilla de evidencia y bitacora de ejecucion.
- Crear scripts QA complementarios sin modificar migraciones Flyway ni comportamiento productivo.
- Referenciar dataset/evidencia en smoke, regresion y release checklist.

Documentos creados:

- `docs/ERP_QA_DATASET.md`
- `docs/ERP_QA_USERS_ROLES.md`
- `docs/ERP_QA_EVIDENCE_TEMPLATE.md`
- `docs/ERP_QA_EXECUTION_LOG.md`

Scripts QA creados:

- `docs/qa/03-datos-base-qa.sql`
- `docs/qa/04-usuarios-roles-qa.sql`

Documentos actualizados:

- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff` y `cambios_fase1c.diff` aparecen como no rastreados; no se tocaron.
- `docs/qa/01-preparacion-datos-qa.sql` ya contiene datos QA amplios, pero debe validarse contra el esquema actual antes de usarlo como prerequisito formal.
- Los scripts Fase 1D dependen de que existan sucursales/usuarios base creados por `01-preparacion-datos-qa.sql`.
- Los usuarios QA con `{noop}Qa12345!` deben validarse contra la configuracion real de autenticacion del ambiente.

Pruebas ejecutadas:

- Revision documental y de esquema mediante lectura de migraciones Flyway y scripts QA existentes.
- No se ejecutaron pruebas de frontend/backend porque esta fase no modifica codigo funcional.

Siguiente fase sugerida:

- Fase 1E: ejecutar dataset QA en ambiente controlado, capturar primera evidencia real y limpiar/decidir artefactos Git no rastreados antes de release candidato.

## 2026-05-12 - Fase 1E

Tipo: preparacion de ejecucion QA controlada.

Objetivo:

- Preparar la primera ejecucion QA real sin tocar comportamiento productivo.
- Crear plan de fase y runbook operativo.
- Documentar riesgos de scripts QA existentes.
- Actualizar checklist release, execution log y roadmap.

Documentos creados:

- `docs/ERP_FASE_1E_PLAN.md`
- `docs/ERP_QA_RUNBOOK_1E.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff`, `cambios_fase1c.diff` y `cambios_fase1d.diff` aparecen como no rastreados; no se tocaron.
- `docs/qa/03-datos-base-qa.sql` depende de `QA_CTR`, `qa.admin@local.test` y migracion `V37__suppliers_and_batch_quality.sql`.
- `docs/qa/04-usuarios-roles-qa.sql` reasigna roles/permisos solo de usuarios QA especificos; debe ejecutarse exclusivamente en ambiente QA.
- La ejecucion real queda pendiente; esta fase solo prepara el control.

Pruebas ejecutadas:

- Revision documental de dataset, usuarios, evidencia, smoke, checklist y scripts QA.
- No se ejecutaron SQL ni pruebas funcionales.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1F: ejecutar el runbook en ambiente QA, capturar evidencias y decidir si el release candidato queda aprobado, rechazado o bloqueado.

## 2026-05-12 - Fase 1F

Tipo: hardening de gobernanza QA y release candidate.

Objetivo:

- Fortalecer gobernanza QA antes de ejecutar la primera corrida real.
- Definir severidades de defectos y su relacion con bloqueo/rollback.
- Definir flujos criticos ERP y su obligatoriedad QA.
- Definir estandar de evidencias.
- Definir politica de release candidate.
- Crear registro de known issues.
- Mejorar smoke tests y release checklist con control RC.

Documentos creados:

- `docs/ERP_DEFECT_SEVERITY.md`
- `docs/ERP_CRITICAL_FLOWS.md`
- `docs/ERP_EVIDENCE_STANDARD.md`
- `docs/ERP_RELEASE_CANDIDATE_POLICY.md`
- `docs/ERP_KNOWN_ISSUES.md`

Documentos actualizados:

- `docs/ERP_SMOKE_TESTS.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_QA_REGRESION_OPERACIONAL.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Riesgos detectados:

- `.tmp-pdf-images/`, `cambios_fase1a.diff`, `cambios_fase1b.diff`, `cambios_fase1c.diff`, `cambios_fase1d.diff` y `cambios_fase1e.diff` aparecen como no rastreados; no se tocaron.
- La primera ejecucion QA real sigue pendiente por instruccion de fase.
- Las severidades y tiempos SLA deben calibrarse con responsables reales.
- Known issues queda inicializado y debe alimentarse durante la corrida real.

Pruebas ejecutadas:

- Revision documental de runbook, checklist, smoke, regresion, roadmap y bitacora.
- No se ejecutaron pruebas reales, SQL ni comandos de build.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1G: ejecutar la primera corrida QA real controlada, registrar evidencias bajo el estandar definido y decidir si existe release candidate.

## 2026-05-12 - Fase 1G

Tipo: primera corrida QA real controlada.

Objetivo:

- Ejecutar validacion operacional real usando proceso QA definido.
- Registrar resultados por flujo, severidad, impacto y bloqueo RC.
- Alimentar known issues con defectos reales.
- Decidir estado de release candidate.

Documento creado:

- `docs/ERP_QA_EXECUTION_1G.md`

Documentos actualizados:

- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Resultados principales:

- OK: login/logout operativo, dashboard API, clientes API, inventario API, lotes API, live lectura API, venta QA controlada, pago QA controlado, reporte diario tienda API, usuarios/roles admin API.
- BLOCKED: frontend web local, health check publico, usuario sin permisos, usuarios reportes/soporte.
- Venta QA creada: `saleId=1`, item `QA-CTR-001`, total `125.00`.
- Pago QA creado: `paymentId=1`, `saleId=1`, total `125.00`.

Known issues agregados:

- `KI-002`: `/api/health` responde 401.
- `KI-003`: frontend web `localhost:8081` no disponible.
- `KI-004`: `qa.sinpermisos@local.test` no valida login.
- `KI-005`: `qa.reportes@local.test` y `qa.soporte@local.test` no validan login.

Decision:

- `RC RECHAZADO`.

Pruebas ejecutadas:

- Pruebas reales API contra `http://localhost:8090`.
- No se ejecuto SQL.
- No se corrigieron bugs.
- No se modifico codigo productivo.

Siguiente fase sugerida:

- Fase 1H: preparar correcciones acotadas o preparacion de ambiente/dataset para desbloquear RC, sin mezclar refactors.

## 2026-05-12 - Fase 1H / KI-002

Tipo: correccion acotada de healthcheck backend.

Objetivo:

- Desbloquear el smoke tecnico de release para `/api/health`.
- Mantener el cambio limitado al filtro de token sin alterar seguridad general ni flujos operativos.

Causa encontrada:

- `SecurityConfig` permitia las rutas, pero `ApiTokenFilter` validaba todo `/api/*` antes del controlador.
- `/api/health` no estaba dentro de las excepciones publicas del filtro y por eso respondia `401`.

Cambios realizados:

- Se excluyo unicamente `/api/health` de la validacion de token en `ApiTokenFilter`.
- Se agrego prueba automatizada para confirmar que `GET /api/health` no requiere token y responde `status=OK`.
- Se actualizo known issue y checklist de release para exigir validacion de healthcheck sin token.

Archivos modificados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/health/HealthControllerSecurityTests.java`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test` en `backend/control-ropa`: exitoso.
- Prueba agregada: `HealthControllerSecurityTests.healthEndpointDoesNotRequireSessionToken`.

Riesgos pendientes:

- El backend QA en ejecucion debe reiniciarse/desplegarse con esta rama y repetirse el smoke tecnico runtime.
- `KI-002` queda en validacion hasta confirmar `/api/health` en el ambiente QA real.

Rollback:

- Revertir la excepcion de `/api/health` en `ApiTokenFilter`.
- Remover la prueba automatizada asociada si se decide que el healthcheck debe volver a requerir token.

Siguiente bloqueo recomendado:

- `KI-003`: frontend web `localhost:8081` no disponible durante la corrida QA.

## 2026-05-12 - Fase 1H / KI-004 y KI-005

Tipo: correccion acotada de dataset QA para usuarios de regresion.

Objetivo:

- Desbloquear smoke de permisos negativos, reportes y soporte tecnico.
- Corregir solo usuarios QA sin tocar seguridad global, frontend, backend productivo, ventas, pagos, live, lotes ni migraciones Flyway.

Causa probable:

- Los usuarios `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test` dependian de `docs/qa/04-usuarios-roles-qa.sql`.
- Ese script activaba usuarios existentes, pero no actualizaba `password_hash` cuando ya existian.
- Tambien era posible que quedaran bloqueados en `user_login_security` por intentos fallidos previos.

Cambios realizados:

- Se creo `docs/qa/05-fix-usuarios-qa-login.sql` como script SOLO QA.
- El script resetea password `{noop}Qa12345!`, estado `ACTIVE`, sucursal `QA_CTR`, roles, permisos esperados y bloqueo temporal de login para los tres usuarios QA.
- `NO_ACCESS` queda sin permisos efectivos para validar acceso denegado.
- `REPORTS` queda con permisos de consulta.
- `SUPPORT_TECH` queda con permisos minimos de soporte existentes.

Documentos actualizados:

- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_DATASET.md`
- `docs/ERP_QA_USERS_ROLES.md`
- `docs/ERP_QA_RUNBOOK_1E.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- No se ejecuto SQL.
- No aplica `.\mvnw.cmd test` porque no se modifico codigo Java productivo ni tests.
- Validacion pendiente: ejecutar `docs/qa/05-fix-usuarios-qa-login.sql` en QA y repetir login real.

Riesgos pendientes:

- Si `QA_CTR` no existe, el script no podra crear/actualizar usuarios; debe ejecutarse primero `docs/qa/01-preparacion-datos-qa.sql`.
- `KI-004` y `KI-005` quedan en validacion hasta probar login real con `Qa12345!`.

Rollback:

- No ejecutar el script si no se requiere.
- Si ya se ejecuto, revertir restaurando backup QA previo o desactivando los tres usuarios QA especificos.

Siguiente validacion recomendada:

- Ejecutar en QA: `01-preparacion-datos-qa.sql` si falta base, luego `04-usuarios-roles-qa.sql`, luego `05-fix-usuarios-qa-login.sql`.
- Repetir login de `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test`.
- Repetir `SMK-SEC-01`, `SMK-SEC-02` y reportes con perfil `qa.reportes@local.test`.

## 2026-05-12 - Validacion runtime KI-004/KI-005 y separacion KI-006

Tipo: documentacion de evidencia QA runtime.

Validacion reportada:

- `qa.sinpermisos@local.test` inicia sesion y queda sin accesos operativos.
- `qa.reportes@local.test` inicia sesion con accesos esperados a reportes.
- `qa.soporte@local.test` inicia sesion con accesos tecnicos/admin esperados.
- `/api/health` ya no responde `401`, pero responde `404`.

Cambios documentales:

- `KI-004` marcado como `Resuelto validado`.
- `KI-005` marcado como `Resuelto validado`.
- `KI-002` actualizado como bloqueo original de token avanzado/cerrado parcialmente.
- Se crea `KI-006` para separar el nuevo problema runtime: `/api/health` devuelve `404` por posible mapping, context-path o artefacto en ejecucion.

Decision release:

- RC sigue no aprobado.
- Bloqueos vigentes: `KI-003` frontend web sin evidencia y `KI-006` healthcheck 404.

Siguiente fase recomendada:

- Corregir `KI-006` de forma acotada revisando mapping/runtime de healthcheck.
- Despues repetir smoke tecnico `GET /api/health`.


## 2026-05-12 - Fase 1H / KI-006

Tipo: correccion acotada de mapping healthcheck backend.

Objetivo:

- Hacer accesible el healthcheck para smoke tecnico pre/post-release.
- Mantener el cambio limitado a healthcheck, sin tocar modulos operativos, datos, frontend, ventas, pagos, live, lotes ni migraciones.

Causa encontrada:

- En codigo, `HealthController` existe bajo paquete escaneado y no hay `server.servlet.context-path` configurado; la ruta esperada es `GET /api/health`.
- La prueba automatizada registra correctamente el mapping.
- El 404 reportado en runtime indica probable artefacto/proceso QA desactualizado, ruta con slash/contexto distinto o despliegue que no contiene el controlador actualizado.

Cambios realizados:

- `HealthController` registra explicitamente `GET /api/health` y `GET /api/health/`.
- `ApiTokenFilter` permite ambas variantes sin token.
- Se amplio la prueba automatizada para validar ambas rutas.
- Se actualizo known issue, release checklist y execution log.

Archivos modificados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/health/HealthController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/health/HealthControllerSecurityTests.java`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test` en `backend/control-ropa`: exitoso.
- `HealthControllerSecurityTests`: `GET /api/health` y `GET /api/health/` responden `200 OK` con `status=OK`.

Riesgos pendientes:

- `KI-006` queda en validacion hasta reiniciar/desplegar backend QA y confirmar por curl contra runtime real.
- Si runtime sigue respondiendo `404`, revisar contexto de despliegue, puerto usado y artefacto/JAR activo.

Rollback:

- Revertir el mapping explicito en `HealthController`.
- Revertir la excepcion de `/api/health/` en `ApiTokenFilter`.
- Revertir la prueba adicional si se decide no soportar trailing slash.

Comando recomendado para validar runtime:

- `curl -i http://localhost:8090/api/health`
- `curl -i http://localhost:8090/api/health/`
## 2026-05-12 - Fase 1I / cierre runtime KI-006

Tipo: cierre documental con evidencia runtime real.

Validacion reportada:

- Comando ejecutado: `curl -i http://localhost:8090/api/health`.
- Resultado: `HTTP/1.1 200 OK`.
- Respuesta JSON: `status=OK` y `timestamp`.

Causa raiz real:

- El `404` anterior fue provocado por validacion contra puerto incorrecto `8080`.
- El backend QA correcto corre en `8090`.

Cambios documentales:

- `KI-002` queda como `Resuelto validado`.
- `KI-006` queda como `Resuelto validado`.
- Se actualiza execution log con smoke tecnico exitoso.
- Se actualiza resumen ejecutivo para reflejar backend/API tecnicamente validado.

Decision release:

- Backend/API queda desbloqueado tecnicamente para RC.
- RC completo no queda aprobado todavia porque `KI-003` frontend web/visual sigue abierto.

Siguiente fase recomendada:

- Resolver `KI-003`: levantar frontend QA, capturar evidencia visual y repetir smoke visual/navegacion principal.

## 2026-05-12 - Fase 1J / frontend visual QA

Tipo: validacion frontend runtime y decision RC visual.

Validaciones ejecutadas:

- Rama: `feature/fase1j-frontend-visual-qa`.
- `npm run web` falla antes de levantar Expo por `Acceso denegado` al escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- Workaround de QA: `npx.cmd expo start --web --port 8081`.
- `http://localhost:8081` responde `200`.
- Rutas verificadas por HTTP runtime: `/login`, `/dashboard`, `/customers`, `/items`, `/batches`, `/reports`, `/users`, `/system-roles`.

Resultado visual/UX:

- Frontend web ya esta disponible en `localhost:8081`, por lo que `KI-003` avanza a `En validacion`.
- Se detecto texto visible con codificacion rota en `/login`: `Iniciar sesiÃ³n`, `ContraseÃ±a`.
- Se detecto mojibake tambien en `/reports`.
- No se pudo aprobar RC visual por calidad de texto visible y arranque QA no repetible con el script oficial.

Issues nuevos:

- `KI-007`: textos visibles con codificacion rota en frontend web.
- `KI-008`: `npm run web` falla por permisos/ruta de log frontend.

Decision:

- `NO-GO` para RC visual.
- Backend/API sigue desbloqueado.
- RC completo sigue rechazado hasta resolver `KI-007` y `KI-008`, y completar evidencia visual interactiva.

Siguiente fase recomendada:

- Fase 1K: correccion acotada de codificacion visible y arranque frontend QA, sin tocar logica de negocio.

## 2026-05-12 - Fase 1K / frontend encoding y logs

Tipo: correccion acotada frontend QA.

Objetivo:

- Resolver `KI-007` mojibake/codificacion visible.
- Resolver `KI-008` arranque web bloqueado por permisos de logs/cache.
- Mantener el cambio limitado a frontend runtime y documentacion, sin tocar backend, APIs, seguridad ni logica ERP.

Causa encontrada:

- Los fuentes visibles revisados (`app/login.tsx`, `app/reports.tsx`) ya estan guardados en UTF-8 correcto; el mojibake reportado venia de evidencia runtime/lectura sin decodificacion UTF-8 y cache/arranque web inestable.
- `npm run web` fallaba porque `scripts/start-web-logs.ps1` detenia el proceso al no poder escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- Expo tambien intentaba escribir cache bajo el perfil de Windows y podia fallar con `EPERM`; se aislo el home de Expo a `%TEMP%\control-ropa-expo-home` durante el arranque web.

Cambios realizados:

- `scripts/start-web-logs.ps1` ahora usa un home temporal escribible para Expo.
- El log frontend rota/escribe en C: cuando tiene permiso, pero si Windows lo bloquea muestra advertencia y continua en consola.
- No se modificaron pantallas, backend, endpoints, base de datos ni seguridad.

Archivos modificados:

- `scripts/start-web-logs.ps1`
- `docs/ERP_KNOWN_ISSUES.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Pruebas ejecutadas:

- `npm.cmd run web`: levanta Metro hasta `Waiting on http://localhost:8081`; el intento queda vivo y la herramienta lo corta por timeout, sin error fatal por logs/cache.
- Runtime HTTP con servidor Expo: `/login`, `/`, `/reports`, `/branches`, `/system-roles` responden `200` y decodifican UTF-8 sin patrones `Ã`, `Â`, `â€` ni `�`.
- OK: `npx.cmd tsc --noEmit`.
- `npx.cmd eslint scripts/start-web-logs.ps1`: no aplica porque ESLint ignora `.ps1`; resultado sin errores de codigo frontend.

Riesgos pendientes:

- El archivo `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log` sigue requiriendo correccion de permisos Windows si se desea persistencia en esa ruta exacta.
- RC completo no queda aprobado automaticamente; requiere checklist RC y evidencia visual formal.

Decision:

- `KI-007` queda `Resuelto validado`.
- `KI-008` queda `Resuelto validado`.
- `KI-003` queda tecnicamente desbloqueado para RC candidato completo, pendiente aprobacion formal de release.

## 2026-05-12 - Fase 1L / revision final RC

Tipo: revision documental final de Release Candidate.

Objetivo:

- Revisar evidencia disponible antes de recomendar GO/NO-GO.
- Confirmar estado de backend, frontend, usuarios QA, healthcheck y known issues.
- Decidir si el sistema puede considerarse RC candidato aprobable sin aprobar release final automaticamente.

Documento creado:

- `docs/ERP_RC_FINAL_REVIEW.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Resultado:

- No hay `SEV-1` ni `SEV-2` abiertos.
- `KI-001` queda abierto como `SEV-3` no bloqueante para RC candidato.
- Backend/API, healthcheck, usuarios QA y frontend web quedan documentados como validados para RC.

Decision:

- `GO PARA RC CANDIDATO APROBABLE`.
- No se aprueba release final automatico.

Riesgos pendientes:

- Adjuntar evidencia visual formal completa antes de release final.
- Revisar artefactos Git/`KI-001` antes de merge/tag.
- Repetir smoke tecnico y visual en ventana final de release.

## 2026-05-12 - Fase 2A / diseno multi-compania

Tipo: arquitectura SaaS y seguridad multi-tenant.

Objetivo:

- Disenar multi-compania antes de implementar.
- Evitar fuga de datos entre clientes/empresas.
- Mantener una sola aplicacion y una sola base en un solo servidor.
- No modificar codigo, base de datos, migraciones, frontend, backend ni SQL.

Analisis realizado:

- Backend actual modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`.
- Esquema actual basado en `branches`, `users.branch_id` y `user_branches`.
- Seguridad actual con `ApiTokenFilter`, `CurrentUser` y `AccessService`.
- Frontend actual basado en `session.branchId` y servicios por `/branch/{branchId}`.
- Reportes actuales reciben `branchId` y requieren tenant scope futuro.

Documentos creados:

- `docs/ERP_MULTICOMPANY_ARCHITECTURE.md`
- `docs/ERP_MULTICOMPANY_DATA_MODEL.md`
- `docs/ERP_MULTICOMPANY_SECURITY.md`
- `docs/ERP_MULTICOMPANY_MIGRATION_PLAN.md`
- `docs/ERP_MULTICOMPANY_QA_PLAN.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decision arquitectonica sugerida:

- Usar una sola base de datos y una sola aplicacion.
- Agregar `company_id` obligatorio en tablas tenant-scoped.
- Mantener `branch_id` como scope operativo subordinado a `company_id`.
- Resolver tenant en backend desde token/sesion; no confiar en frontend.

Riesgos criticos:

- Fuga de datos entre companias si se usa solo `branch_id`.
- Permisos globales aplicados indebidamente a varias empresas.
- Reportes financieros sin filtro `company_id`.
- Soporte tecnico HPSQ-SOFT sin auditoria por compania.

Siguiente fase recomendada:

- Fase 2B: crear matriz endpoint-tabla-tenant y matriz de migracion por tabla antes de escribir codigo o SQL.

## 2026-05-12 - Fase 2A / ampliacion consola SaaS HPSQ-SOFT

Tipo: arquitectura SaaS, product ownership y seguridad de plataforma.

Objetivo:

- Ampliar el diseno multi-compania para incluir consola privada HPSQ-SOFT.
- Separar administracion SaaS de operacion ERP cliente.
- Definir roles HPSQ-SOFT, roles cliente, planes, limites, suspension, soporte y auditoria.
- Mantener la regla de no implementar codigo, migraciones ni cambios funcionales.

Documentos creados:

- `docs/ERP_SAAS_ADMIN_CONSOLE.md`
- `docs/ERP_SAAS_ROLES_PERMISSIONS.md`
- `docs/ERP_SAAS_BILLING_AND_PLANS.md`

Documentos actualizados:

- `docs/ERP_MULTICOMPANY_ARCHITECTURE.md`
- `docs/ERP_MULTICOMPANY_DATA_MODEL.md`
- `docs/ERP_MULTICOMPANY_SECURITY.md`
- `docs/ERP_MULTICOMPANY_MIGRATION_PLAN.md`
- `docs/ERP_MULTICOMPANY_QA_PLAN.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TARGET_ARCHITECTURE.md`
- `docs/ERP_OWNERSHIP_MATRIX.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decision:

- Mantener una sola aplicacion y una sola base con `company_id`.
- Crear consola SaaS privada HPSQ-SOFT en fases futuras, no visible para clientes.
- Separar roles `SAAS_*` y roles HPSQ-SOFT de roles ERP cliente.
- No implementar billing automatico todavia; primero controles administrativos, limites, suspension/reactivacion y auditoria.

Riesgos agregados:

- Consola SaaS visible a clientes.
- Soporte HPSQ-SOFT con acceso excesivo.
- Suspension comercial mal aplicada.
- Limites de plan validados solo en frontend.
- Modificacion de ventas/pagos desde soporte sin proceso formal.

Siguiente fase recomendada:

- Fase 2B: matriz endpoint-tabla-tenant, matriz roles SaaS/ERP y matriz de acciones auditables HPSQ-SOFT antes de implementar.

## 2026-05-13 - Fase 2B / matrices tenant y backlog tecnico

Tipo: analisis tecnico documental, sin codigo ni migraciones.

Objetivo:

- Preparar implementacion multi-compania segura.
- Identificar endpoints P0 que requieren validacion `company_id`.
- Identificar tablas P0 que requieren `company_id`, indices y unicidad por compania.
- Clasificar acciones HPSQ-SOFT que deben auditarse.
- Convertir hallazgos en backlog tecnico ordenado.

Documentos creados:

- `docs/ERP_TENANT_ENDPOINT_MATRIX.md`
- `docs/ERP_TENANT_TABLE_MATRIX.md`
- `docs/ERP_SAAS_AUDIT_ACTIONS_MATRIX.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Analisis realizado:

- Revision de controladores backend con rutas `/api/*`.
- Revision de servicios frontend en `services/` y uso de `session.branchId`.
- Revision de migraciones Flyway actuales para tablas, FKs, unicidades e indices.
- Revision de documentos Fase 2A multi-compania y SaaS HPSQ-SOFT.

Hallazgos principales:

- Muchos endpoints P0 reciben `branchId`, ids directos, folios, codigos o QR sin un `company_id` explicito en el modelo actual.
- Las tablas raiz mas criticas son `branches`, `users`, `customers`, `items`, `batches`, `sales`, `payments`, `reservations`, `lives`, `customer_orders`, `customer_packages`, `shipments`, `cash_closures` y `system_movement_audit_log`.
- Reportes y dashboard son criticos porque agregan multiples fuentes y podrian mezclar datos silenciosamente.
- Acciones HPSQ-SOFT como suspender empresa, cambiar plan, soporte delegado, consultar/exportar logs y reset de usuarios requieren auditoria estricta.

Siguiente fase recomendada:

- Fase 2C: preparar modelo base `companies`, compania default, diseno tecnico de `CurrentTenantContext` y plan de migracion por tabla antes de tocar flujos operativos.

## 2026-05-13 - Fase 2C / tenant core foundation

Tipo: diseno tecnico avanzado, sin codigo ni migraciones.

Objetivo:

- Definir el nucleo tenant-aware antes de implementar.
- Documentar `CurrentTenantContext`.
- Documentar auth/security tenant-aware.
- Documentar estrategia de migracion incremental.
- Definir reglas obligatorias de enforcement.
- Documentar escenarios de riesgo SaaS.

Documentos creados:

- `docs/ERP_TENANT_CORE_FOUNDATION.md`
- `docs/ERP_CURRENT_TENANT_CONTEXT_DESIGN.md`
- `docs/ERP_TENANT_AUTH_SECURITY.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_TENANT_ENFORCEMENT_RULES.md`
- `docs/ERP_TENANT_RISK_SCENARIOS.md`

Documentos actualizados:

- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Decisiones documentadas:

- El backend sera la unica autoridad tenant.
- `CurrentTenantContext` debe propagarse controller -> service -> query -> auditoria/logs.
- Company y branch se validan en cada request P0.
- Auth debe preferir resolver permisos server-side para evitar tokens stale.
- No iniciar implementacion por ventas/pagos/reportes; primero foundation tenant.

Riesgos destacados:

- Query sin `company_id`.
- Lookup global por QR/codigo.
- Reporte sin filtro tenant.
- Cache contaminado.
- Company suspendida operando con token previo.
- Soporte HPSQ-SOFT sin auditoria o sin expiracion.

Siguiente fase recomendada:

- Fase 2D: disenar/implementar en rama separada el modelo minimo `companies`, company default y validacion branch-company, con migraciones controladas y QA de login/dashboard antes de tocar flujos financieros.

## 2026-05-13 - Fase 2D / tenant bootstrap minimo

Tipo: implementacion backend y migracion minima, sin tocar ventas, pagos, live ni reportes.

Objetivo:

- Crear base minima multi-compania compatible con el sistema actual.
- Agregar company default para datos existentes.
- Vincular sucursales existentes con company default.
- Introducir contexto tenant backend sin activar multi-compania funcional completa.

Cambios realizados:

- Migracion `V38__tenant_bootstrap_companies.sql`.
- Tabla `companies`.
- Company default `DEFAULT / HPSQ-SOFT Default Company`.
- Columna `branches.company_id` con backfill.
- FK `branches.company_id -> companies.id`.
- Indice `idx_branches_company_status`.
- Unicidad `uq_branches_company_code`.
- Entidad `Company`.
- `CompanyRepository` y `CompanyService`.
- `CurrentTenantContext`.
- `TenantContextHolder`.
- `TenantResolver`.
- Endpoint autenticado `GET /api/tenant/current`.
- Validacion minima `assertBranchBelongsToCompany`.
- `BranchService` asigna company default si el alta actual no envia company.

Fuera de alcance respetado:

- No se migraron ventas.
- No se migraron pagos.
- No se migro live.
- No se migraron reportes.
- No se implemento consola SaaS HPSQ-SOFT.
- No se cambio frontend operativo.

Riesgos pendientes:

- `user_api_sessions` aun no guarda company/branch activa.
- Roles y permisos siguen globales.
- Tablas P0 operativas aun no tienen `company_id`.
- Reportes y dashboard siguen mono-compania por `branch_id`.
- Se requiere validacion runtime QA de Flyway sobre base real.

Siguiente fase recomendada:

- Fase 2E: validar runtime del bootstrap tenant, smoke login/sucursales/dashboard y preparar diseno/implementacion de `user_companies` y sesiones tenant-aware antes de migrar tablas P0.

## 2026-05-13 - Fase 2E / validacion runtime tenant

Tipo: validacion y documentacion, sin cambios funcionales.

Objetivo:

- Confirmar bootstrap tenant antes de migrar tablas P0.
- Documentar evidencia manual y tecnica.
- Identificar riesgos runtime.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Validacion manual reportada:

- Flyway `V38`.
- Company default `DEFAULT / HPSQ-SOFT Default Company`.
- Sucursales actuales con `company_id = 1`.
- Backend, dashboard, navegacion frontend y sucursales operativas.
- RC previo sin ruptura visible.

Validacion tecnica Codex:

- Revision de `TenantResolver`, `CurrentTenantContext`, `TenantController` y `BranchService`.
- `.\mvnw.cmd test` exitoso: `8 tests`, `0 failures`, `0 errors`.
- Intento HTTP contra `localhost:8090` detecto runtime no sincronizado con rama actual: `/api/tenant/current` no registrado y login QA devolvio `500`.

Decision:

- Bootstrap tenant queda `GO condicionado`.
- Migracion de tablas P0 queda `NO-GO` hasta reiniciar/desplegar backend y capturar evidencia JSON de `/api/tenant/current`.

Siguiente fase recomendada:

- Fase 2F: redeploy/reinicio controlado, smoke tenant runtime autenticado y preparacion de `user_companies`/sesiones tenant-aware.

## 2026-05-13 - Fase 2F / tenant runtime hardening

Tipo: implementacion minima backend/base de datos.

Objetivo:

- Preparar sesiones tenant-aware sin migrar ventas, pagos, live, reportes ni tablas P0.
- Crear relacion usuario-company.
- Guardar company/branch activa en sesiones nuevas.
- Mantener fallback compatible con el RC actual.

Cambios realizados:

- Creada migracion `V39__tenant_user_company_sessions.sql`.
- Creada tabla `user_companies`.
- Agregadas columnas `user_api_sessions.active_company_id` y `active_branch_id`.
- Agregado backfill de usuarios actuales hacia company default.
- Agregado backfill de sesiones actuales cuando aplica.
- Agregado `UserCompany`, `UserCompanyId`, `UserCompanyRepository` y `UserCompanyService`.
- `AuthService` crea sesiones nuevas con tenant activo.
- `ApiTokenFilter` valida company/branch activa cuando la sesion las trae.
- `TenantResolver` resuelve tenant desde sesion activa y conserva fallback temporal.
- Agregadas pruebas unitarias de user-company/branch y tenant current protegido.

Documentos creados:

- `docs/ERP_TENANT_RUNTIME_HARDENING.md`

Documentos actualizados:

- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- `.\mvnw.cmd test`
- Resultado: `BUILD SUCCESS`, `14 tests`, `0 failures`, `0 errors`.
- Flyway valido `39 migrations`.

Fuera de alcance respetado:

- No se tocaron ventas.
- No se tocaron pagos.
- No se tocaron reportes.
- No se toco live.
- No se modifico frontend.
- No se implemento consola SaaS.
- No se implemento selector de tenant.

Riesgos pendientes:

- Roles y permisos siguen globales.
- Tablas P0 operativas siguen sin `company_id`.
- Selector/cambio de tenant para usuarios multi-company queda pendiente.
- Fallback por usuario/sucursal debe retirarse cuando las sesiones tenant-aware esten estabilizadas.

Siguiente fase recomendada:

- Fase 2G: validacion runtime real de login, `/api/tenant/current`, `user_companies`, sesiones con `active_company_id`, dashboard y sucursales antes de migrar tablas P0.

## 2026-05-13 - Fase 2G / validacion runtime tenant-aware

Tipo: validacion runtime y documentacion.

Objetivo:

- Confirmar que el backend reiniciado desde la rama actual crea sesiones tenant-aware.
- Validar `/api/tenant/current` sin token y con token valido.
- Validar compatibilidad con dashboard y sucursales.
- Decidir GO/NO-GO antes de migrar tablas P0.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION_2G.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Validacion ejecutada:

- Flyway V39 confirmado por SQL.
- Company `DEFAULT` activa confirmada.
- `branches`: `5/5` con `company_id`.
- `user_companies`: `14` registros.
- Reinicio backend de proceso viejo a proceso nuevo en `8090`.
- `/api/health`: `200`.
- `/api/tenant/current` sin token: `401`.
- Login `qa.admin@local.test`: OK.
- Login `qa.vendedor.centro@local.test`: OK.
- `/api/tenant/current` con token admin: `companyId=1`, `branchId=4`, `branchCode=QA_CTR`.
- Dashboard: OK.
- Branches activas: OK.
- Sesion nueva `qa.admin` confirmada con `active_company_id=1` y `active_branch_id=4`.
- `.\mvnw.cmd test`: `BUILD SUCCESS`, `14 tests`.

Hallazgos:

- El runtime previo en `8090` no estaba sincronizado con Fase 2F; generaba sesiones con tenant null.
- Despues del reinicio limpio, sesiones nuevas ya guardan tenant activo.
- `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test` no existen en la base runtime actual; por eso fallan con 403.
- Existen sesiones antiguas con `active_company_id=NULL`; fallback compatible aceptado temporalmente.

Decision:

- `GO tecnico condicionado` para runtime tenant-aware.
- `NO-GO` para migrar primera tabla P0 hasta completar dataset QA y repetir smoke de permisos/reportes/soporte.

Siguiente fase recomendada:

- Fase 2H: completar dataset QA de usuarios faltantes, asegurar `user_companies` para usuarios creados despues de V39, revocar/expirar sesiones legacy si se requiere, y repetir validacion runtime antes de tocar P0.

## 2026-05-13 - Fase 2H / usuarios QA tenant-aware

Tipo: SQL QA y documentacion, sin cambios productivos.

Objetivo:

- Completar dataset QA tenant-aware para perfiles faltantes.
- Preparar usuarios `qa.sinpermisos`, `qa.reportes` y `qa.soporte` antes de migrar tablas P0.
- Asegurar company DEFAULT, branch QA_CTR, `user_companies` y sesiones legacy revocadas.

Archivos creados:

- `docs/qa/06-usuarios-tenant-qa.sql`

Archivos actualizados:

- `docs/qa/README.md`
- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_RUNTIME_VALIDATION_2G.md`

Alcance del script:

- Crea/reactiva `qa.reportes@local.test`, `qa.sinpermisos@local.test`, `qa.soporte@local.test`.
- Resetea password QA `{noop}Qa12345!`.
- Asigna sucursal `QA_CTR`.
- Asegura branches QA bajo company `DEFAULT`.
- Inserta/actualiza `user_companies`.
- Inserta/actualiza `user_branches`.
- Reasigna roles `REPORTS`, `NO_ACCESS`, `SUPPORT_TECH`.
- Revoca sesiones legacy de esos correos para forzar nuevo login tenant-aware.

Pruebas:

- No aplica `.\mvnw.cmd test`: solo se modificaron docs y SQL QA.
- SQL no ejecutado en esta fase para evitar modificar runtime sin aprobacion explicita.

Riesgos pendientes:

- Ejecutar el script en QA y capturar evidencia SQL.
- Repetir login de usuarios faltantes.
- Confirmar que nuevas sesiones tengan `active_company_id` y `active_branch_id`.

Decision:

- P0 sigue `NO-GO` hasta ejecutar `06-usuarios-tenant-qa.sql` y repetir smoke 2G.

## 2026-05-13 - Fase 2I / runtime smoke tenant users

Tipo: validacion runtime real con SQL QA aplicado.

Objetivo:

- Ejecutar `docs/qa/06-usuarios-tenant-qa.sql`.
- Validar usuarios QA tenant-aware.
- Confirmar sesiones con `active_company_id` y `active_branch_id`.
- Validar permisos negativos, reportes y soporte antes de P0.

Documento creado:

- `docs/ERP_TENANT_RUNTIME_VALIDATION_2I.md`

Documentos actualizados:

- `docs/ERP_QA_EXECUTION_LOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`

Validacion ejecutada:

- SQL QA `06-usuarios-tenant-qa.sql` aplicado correctamente.
- Usuarios `qa.sinpermisos`, `qa.reportes`, `qa.soporte` activos.
- Los tres usuarios quedan en `QA_CTR`, company `DEFAULT`, con `user_companies=YES`.
- Sesiones legacy de esos tres usuarios revocadas.
- Login OK para `qa.admin`, `qa.sinpermisos`, `qa.reportes`, `qa.soporte`.
- `/api/tenant/current` OK para los cuatro usuarios.
- Dashboard y sucursales OK.
- `/api/users` devuelve 403 esperado para `qa.sinpermisos` y `qa.reportes`.
- `/api/users` OK para `qa.admin` y `qa.soporte`.
- Reportes OK para `qa.reportes` y `qa.soporte`.
- Reportes 403 esperado para `qa.sinpermisos`.
- Sesiones nuevas de usuarios QA con `active_company_id=1`, `active_branch_id=4`.
- Logs backend sin `500`, `ERROR`, CORS, auth inesperado ni errores tenant en tramo revisado.
- Logs frontend sin errores relevantes en tramo revisado.
- `.\mvnw.cmd test`: `BUILD SUCCESS`, `14 tests`.

Riesgos pendientes:

- Existen sesiones legacy de `qa.admin` con tenant null.
- Todavia no existe dataset Empresa A/B para afirmar aislamiento cross-company real.
- Branches/reportes aun no deben considerarse tenant P0 final.

Decision:

- `GO condicionado` para iniciar primera P0 de bajo riesgo.
- Mantener fuera de alcance ventas, pagos, live y reportes.

Siguiente fase recomendada:

- Fase 2J: seleccionar primera tabla P0 de bajo riesgo, proponer migracion/backfill/rollback y preparar QA Empresa A/B antes de declarar aislamiento SaaS real.

## 2026-05-13 - Fase 2J / customers tenant-aware

Tipo: implementacion incremental P0 de bajo riesgo.

Objetivo:

- Convertir `customers` en primera tabla operativa tenant-aware.
- Agregar `company_id` obligatorio con backfill desde `branches.company_id`.
- Filtrar endpoints directos de clientes por company activa.
- Mantener ventas, pagos, live y reportes fuera de alcance.

Cambios realizados:

- Migracion `V40__customers_tenant_company.sql`.
- `Customer` ahora referencia `Company`.
- `CustomerRepository` agrega consultas tenant-aware y conserva metodos legacy.
- `CustomerService` resuelve tenant activo, valida branch-company y usa consultas por `company_id`.
- Pruebas unitarias `CustomerServiceTests`.
- Documento `docs/ERP_CUSTOMERS_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, `18 tests`.
- Runtime local `localhost:8090`: health OK, login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime customers: crear/listar/buscar/actualizar/desactivar cliente QA en branch `QA_CTR`.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- Direcciones/historial de cliente siguen P1.
- Modulos que referencian `customers` desde ventas/pagos/reportes siguen fuera de alcance.

Decision:

- `GO condicionado` para siguiente P0 de bajo riesgo.
- `NO-GO` para ventas, pagos, live y reportes.

## 2026-05-13 - Fase 2K / items tenant-aware

Tipo: implementacion incremental P0 de inventario.

Objetivo:

- Convertir `items` en segunda tabla operativa tenant-aware.
- Agregar `company_id` obligatorio con backfill desde `branches.company_id`.
- Filtrar endpoints directos de inventario por company activa.
- Mantener ventas, pagos, live y reportes fuera de alcance.

Cambios realizados:

- Migracion `V41__items_tenant_company.sql`.
- Migracion `V42__items_company_unique_scope.sql`.
- `Item` ahora referencia `Company`.
- `ItemRepository` agrega consultas tenant-aware y conserva metodos legacy.
- `ItemService` resuelve tenant activo, valida branch-company y usa consultas por `company_id`.
- Pruebas unitarias `ItemServiceTests`.
- Documento `docs/ERP_ITEMS_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, `22 tests`.
- Runtime local `localhost:8090`: login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime items: crear item QA previo, actualizar item `27`, lookup por codigo, lookup por QR y listar inventario de branch `QA_CTR`.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- Consumidores legacy de items en ventas/pagos/live/reportes/paquetes/envios siguen fuera de alcance.
- Tablas relacionadas como `batches`, `storage_locations` y catalogos aun requieren decision tenant por modulo.

Decision:

- `GO condicionado` para siguiente P0 no financiera de bajo riesgo.
- `NO-GO` para ventas, pagos, live y reportes.

## 2026-05-17 - Fase 2L / batches tenant-aware plan

Tipo: diseno tecnico/documentacion, sin implementacion.

Objetivo:

- Preparar implementacion futura de lotes tenant-aware.
- Analizar riesgos de `batches`, `batch_classification_details` e integracion con `items`.
- Definir migracion propuesta `V43__batches_tenant_company.sql`.
- Mantener fuera de alcance ventas, pagos, live, reportes, frontend y migraciones reales.

Documento creado:

- `docs/ERP_BATCHES_TENANT_IMPLEMENTATION_PLAN.md`

Documentos actualizados:

- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_TENANT_MIGRATION_STRATEGY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`

Hallazgos:

- `batches` no tiene `company_id`.
- `batches.folio` mantiene unicidad global.
- `BatchRepository.findByFolio`, `existsByFolio` y `findByBranchIdOrderByCreatedAtDesc` no filtran company.
- `BatchService.findEntity` usa `findById` global.
- `itemCount` y cancelacion usan items por `batch_id` sin filtro company.
- `batch_classification_details` puede mantenerse sin `company_id` si solo se accede desde batch tenant-validado.

Pruebas:

- No aplica `.\mvnw.cmd test`: no se modifico codigo ni migraciones.

Decision:

- `GO documental` para preparar Fase 2M.
- `NO-GO` para implementacion hasta crear rama/runtime especifico y ejecutar QA.

## 2026-05-17 - Fase 2M / batches tenant-aware runtime

Tipo: implementacion incremental P0 no financiera.

Objetivo:

- Convertir `batches` en tabla tenant-aware con `company_id`.
- Reemplazar folio global por folio unico por company.
- Tenantizar endpoints directos de lotes sin tocar ventas, pagos, live, reservaciones ni reportes.
- Mantener compatibilidad con company `DEFAULT`.

Cambios realizados:

- Migracion `V43__batches_tenant_company.sql`.
- `Batch` ahora referencia `Company`.
- `BatchRepository` agrega consultas por `company_id`.
- `BatchService` resuelve tenant activo, valida branch-company y usa batch-company para id/folio/listados.
- `generateUniqueFolio` ahora es scoped por company.
- `itemCount` usa `items.company_id`.
- Cancelacion bloquea mismatch `item.company_id != batch.company_id`.
- `batch_classification_details` se mantiene sin `company_id`, accediendo solo desde batch tenant-validado.
- Se agregaron pruebas `BatchServiceTests`.
- Se creo `docs/ERP_BATCHES_TENANT_MIGRATION.md`.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`.
- Resultado Maven: `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`.
- Flyway valido `43 migrations`.
- Runtime local `localhost:8090`: login `qa.admin` OK, `/api/tenant/current` OK.
- Runtime batches: crear lote, recibir, clasificar, reconciliar, buscar por id, buscar por folio, listar por branch y cancelar lote sin items.
- Runtime compatibilidad: customers/items siguen respondiendo.

Riesgos pendientes:

- Falta dataset Empresa A/B para fuga cross-company real.
- `suppliers` sigue sin `company_id`.
- `batch_classification_details` depende de acceso indirecto desde batch tenant-validado.
- Consumidores legacy de batches en ventas/pagos/live/reportes siguen fuera de alcance.

Decision:

- `GO condicionado` para batches tenant-aware dentro de `DEFAULT`.
- `NO-GO` para declarar SaaS real o tocar ventas/pagos/live/reportes.

## 2026-05-17 - Fase 2N / dataset Empresa A-B tenant QA

Tipo: dataset QA documental/SQL, sin Java ni migraciones Flyway.

Objetivo:

- Crear dataset controlado Empresa A/B para validar aislamiento real multi-company.
- Mantener `DEFAULT` intacto.
- Preparar datos duplicados por company en customers, items y batches.
- No tocar ventas, pagos, live, reportes ni reservaciones.

Cambios realizados:

- Se creo `docs/qa/07-empresa-ab-tenant-qa.sql`.
- Se creo `docs/ERP_TENANT_COMPANY_AB_QA_PLAN.md`.
- Se actualizo `docs/qa/README.md` y se corrigio mojibake visible en ese archivo.
- Se documentaron usuarios QA A/B, branches A/B, customers/items/batches duplicados y validaciones esperadas.

Usuarios QA agregados:

- `qa.a.admin@local.test`
- `qa.b.admin@local.test`
- `qa.a.vendedor@local.test`
- `qa.b.vendedor@local.test`

Password:

- `Qa12345!`

Pruebas:

- No se ejecuto SQL en esta fase.
- No aplica `.\mvnw.cmd test`: no se modifico Java ni migraciones Flyway.

Riesgos pendientes:

- Ejecutar script solo en QA, nunca PROD.
- Validar runtime real A/B en fase posterior.
- `DEFAULT` debe verificarse despues de aplicar el script.

Decision:

- `GO documental` para ejecutar dataset A/B en QA.
- `NO-GO` para declarar aislamiento SaaS hasta validar runtime real.

## 2026-05-18 - Fase 2O / validacion runtime Empresa A-B

Tipo: validacion QA runtime y documentacion, sin cambios de codigo.

Objetivo:

- Validar aislamiento real entre `QA_A` y `QA_B`.
- Confirmar que `DEFAULT` sigue funcionando.
- Probar customers, items, lookup code/QR y batches por folio.
- Mantener ventas, pagos, live, reportes y reservaciones fuera de alcance.

Cambios realizados:

- Se creo `docs/ERP_TENANT_COMPANY_AB_RUNTIME_VALIDATION.md`.
- Se actualizaron bitacoras y matrices ERP con evidencia de Fase 2O.
- No se modifico Java.
- No se modifico frontend.
- No se crearon migraciones Flyway.

Validaciones:

- SQL: `DEFAULT`, `QA_A`, `QA_B` activos.
- SQL: branches `QA_A_CTR` y `QA_B_CTR` activas.
- SQL: customers duplicados `24/25`.
- SQL: items duplicados `28/29`.
- SQL: batches duplicados `7/8`.
- API: login OK para usuarios A/B admin/vendedor.
- API: `/api/tenant/current` OK para A/B y `DEFAULT`.
- API: A no ve datos B; B no ve datos A.
- API: lookup por code/QR resuelve dentro de la company activa.
- CORS preflight basico OK.
- Logs sin 500 en ventana revisada.

Riesgos pendientes:

- Persisten sesiones legacy `NULL/NULL` para `qa.admin`.
- Proveedores aun no son tenant-aware.
- Roles/permisos no estan completamente scoped por company.
- Ventas/pagos/live/reportes siguen fuera de alcance.

Decision:

- `GO condicionado` para siguiente fase tenant no financiera o hardening de sesiones/permisos.
- `NO-GO` para declarar SaaS real completo.

## 2026-05-18 - Fase LIVE-A / base i18n frontend y UX LIVE

Tipo: implementacion frontend incremental, sin cambios backend ni base de datos.

Objetivo:

- Crear base minima multi idioma en frontend.
- Preparar LIVE para traducciones ES/EN.
- Mantener reglas operativas LIVE sin cambios.

Cambios realizados:

- Se instalaron `i18next`, `react-i18next` y `expo-localization`.
- Se creo `services/i18n.ts`.
- Se crearon `locales/es/common.json` y `locales/en/common.json`.
- Se integro `I18nextProvider` en `app/_layout.tsx`.
- Se migraron textos principales de `app/live.tsx` a traducciones.
- Se agrego selector minimo ES/EN en LIVE para validar la base tecnica.
- Se crearon `docs/ERP_FRONTEND_I18N_BASE.md` y `docs/ERP_LIVE_UX_I18N_PREPARATION.md`.

Validaciones:

- `npm.cmd run lint`: ejecutado sin errores; conserva 55 warnings historicos fuera de alcance.
- `npx.cmd tsc --noEmit`: ejecutado correctamente.
- `npx.cmd expo export --platform web --output-dir C:\tmp\control-ropa-web-export`: ejecutado correctamente; genero ruta estatica `/live`.
- `npm.cmd run web`: no pudo tomar `8081` porque el puerto ya estaba ocupado por un proceso `node` y Expo aborto en modo no interactivo.

Riesgos pendientes:

- Traduccion global del ERP queda fuera de alcance.
- Persistencia de idioma queda pendiente.
- Mensajes backend y etiquetas de estatus requieren estrategia posterior.
- Validacion runtime en `localhost:8081` queda pendiente hasta liberar el proceso `node` que ocupa el puerto.

Decision:

- `GO tecnico condicionado`: compilacion/export web correctos; runtime interactivo en `8081` pendiente por puerto ocupado.

## 2026-05-18 - Fase LIVE-B / arquitectura metricas y engagement

Tipo: diseno producto/arquitectura, sin cambios de runtime.

Objetivo:

- Disenar arquitectura futura LIVE para metricas, engagement y tracking.
- Preparar integracion futura Facebook/Meta sin implementarla.
- Mantener ventas, pagos, reportes y reservaciones fuera de alcance.

Cambios realizados:

- Se creo `docs/ERP_LIVE_ARCHITECTURE_METRICS_ENGAGEMENT.md`.
- Se creo `docs/ERP_LIVE_FACEBOOK_INTEGRATION_DESIGN.md`.
- Se creo `docs/ERP_LIVE_EVENTS_TRACKING_MODEL.md`.
- Se documentaron estados futuros `DRAFT`, `SCHEDULED`, `OPEN`, `ACTIVE`, `PAUSED`, `CLOSED`, `CANCELLED`.
- Se definio modelo conceptual de eventos LIVE tenant-aware.
- Se definio diseno futuro de adapter Facebook por company.

Validaciones:

- No aplica build/test: fase solo documental.
- Se revisaron `app/live.tsx`, `services/liveService.ts`, `LiveController`, `LiveService`, `Live`, `LiveRepository` y backlog tenant.

Riesgos pendientes:

- LIVE todavia no es tenant-aware completo.
- Integracion Facebook requiere validacion futura de permisos Meta vigentes.
- Eventos/metricas no deben implementarse antes de normalizar estados y QA tenant.

Decision:

- `GO documental` para avanzar a LIVE-C normalizacion de estados/UX.
- `NO-GO` para Facebook runtime, ventas, pagos o reservaciones.

## 2026-05-18 - Fase LIVE-C / normalizacion UX de estados LIVE

Tipo: frontend incremental y documentacion, sin backend ni migraciones.

Objetivo:

- Hacer mas claro el estado operativo de LIVE.
- Diferenciar sin live, live abierto, activo y cerrado.
- Mantener i18n ES/EN.
- Mejorar confirmaciones de activar/cerrar sin cambiar reglas de negocio.

Cambios realizados:

- Se agrego tarjeta de estado operativo en `app/live.tsx`.
- Se agregaron instrucciones de siguiente paso para operador/QA.
- Se agrego modal de confirmacion para activar live.
- Se reforzo modal de cierre con advertencia previa.
- Se agregaron llaves i18n nuevas en `locales/es/common.json` y `locales/en/common.json`.
- Se creo `docs/ERP_LIVE_UX_FLOW_NORMALIZATION.md`.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes en otras pantallas.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app\live.tsx locales\es\common.json locales\en\common.json`: sin coincidencias.
- Runtime local `http://localhost:8081/live`: se intento levantar web para smoke manual, pero no quedo servidor escuchando en `8081`; queda validacion interactiva pendiente en ambiente QA levantado.

Riesgos pendientes:

- Runtime web en `8081` puede seguir bloqueado si existe proceso stale.
- LIVE sigue fuera de alcance para tenant completo, Facebook, ventas, pagos y reportes.

Decision:

- `GO tecnico acotado` para LIVE-C. No aprueba cambios de backend, Facebook, ventas, pagos, reportes ni reservaciones.

## 2026-05-18 - Fase LIVE-D / smoke visual i18n UX

Tipo: QA frontend/documentacion, sin backend ni migraciones.

Objetivo:

- Validar LIVE visualmente en navegador real con i18n ES/EN.
- Confirmar que UX normalizada de LIVE-C no rompe build/export frontend.
- Mantener fuera de alcance ventas, pagos, reportes, reservaciones y Facebook.

Cambios realizados:

- Se creo `docs/ERP_LIVE_SMOKE_VISUAL_I18N_UX.md`.
- Se actualizo `docs/ERP_QA_EXECUTION_LOG.md`.
- Se actualizo `docs/ERP_BITACORA_CAMBIOS.md`.
- Se actualizo `docs/ERP_RIESGOS_OPERATIVOS.md`.
- Se actualizo `docs/ERP_RESUMEN_EJECUTIVO.md`.

Validaciones:

- Rama: `feature/live-d-smoke-visual-i18n-ux`.
- `git status --short` inicial: limpio.
- `netstat -ano | findstr :8081`: sin proceso escuchando antes de iniciar.
- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app\live.tsx locales\es\common.json locales\en\common.json`: sin coincidencias.

Hallazgos:

- `npx expo start --web --port 8081` no dejo servidor accesible en `http://localhost:8081`.
- `npm run web` inicio Metro, pero mostro warning de permisos al escribir en `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- No se detectaron errores JS por build/export, pero no se completo smoke visual real de navegador.

Decision:

- `GO tecnico` para build/export frontend.
- `NO-GO visual pendiente` para cerrar LIVE-D hasta repetir smoke en navegador real con `8081` accesible.

## 2026-05-18 - Fase LIVE-E / demo metricas engagement

Tipo: frontend/demo controlado, sin backend ni migraciones.

Objetivo:

- Crear una experiencia visual fuerte para presentacion comercial de LIVE.
- Mostrar engagement y actividad simulada sin Facebook, WebSockets ni backend realtime.
- Mantener i18n ES/EN.

Cambios realizados:

- Se agrego panel `Metricas demo` en `app/live.tsx`.
- Se agregaron tarjetas visuales de viewers, viewers pico, engagement, comentarios, reacciones y productos destacados.
- Se agrego grafica simple de actividad por minuto.
- Se agrego lista de productos destacados demo.
- Se agrego timeline visual con eventos LIVE simulados.
- Se agrego toggle para ocultar/mostrar demo.
- Se agregaron llaves i18n en `locales/es/common.json` y `locales/en/common.json`.
- Se creo `docs/ERP_LIVE_DEMO_METRICS_MODE.md`.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes en otras pantallas.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app\live.tsx locales\es\common.json locales\en\common.json`: sin coincidencias.
- Runtime local `http://localhost:8081/live`: pendiente; `npx expo start --web --port 8081` no dejo servidor accesible desde esta sesion.

Riesgos pendientes:

- El panel es demo visual, no metrica real.
- Smoke visual en navegador sigue pendiente hasta tener `8081` accesible.
- Facebook, ventas, pagos, reportes y reservaciones siguen fuera de alcance.

Decision:

- `GO tecnico` para build/export del modo demo.
- `NO-GO visual pendiente` hasta repetir smoke en navegador real con `8081` accesible.

## 2026-05-18 - Fase DEMO-A / presentacion LIVE SaaS

Tipo: documentacion comercial/tecnica/demo, sin cambios de codigo.

Objetivo:

- Preparar guion de presentacion para mostrar avance SaaS multi-compania.
- Mostrar LIVE commerce como diferenciador.
- Explicar i18n, metricas demo y roadmap sin prometer funcionalidades no terminadas.

Cambios realizados:

- Se creo `docs/DEMO_LIVE_SAAS_PRESENTATION_SCRIPT.md`.
- Se creo `docs/DEMO_LIVE_SAAS_CHECKLIST.md`.
- Se creo `docs/DEMO_LIVE_SAAS_TALK_TRACK.md`.
- Se actualizo `docs/ERP_BITACORA_CAMBIOS.md`.
- Se actualizo `docs/ERP_RESUMEN_EJECUTIVO.md`.

Validaciones:

- Rama: `feature/demo-a-live-saas-presentation`.
- `git status --short` inicial: limpio.
- No aplica build/test: fase solo documental.

Riesgos pendientes:

- La demo debe aclarar que metricas LIVE son simuladas.
- No prometer Facebook real, ventas LIVE finales, pagos LIVE, billing automatico ni SaaS productivo completo.
- Smoke visual de LIVE sigue pendiente hasta tener `8081` accesible.

Decision:

- `GO documental` para usar el material como base de presentacion/demo.

## 2026-05-18 - Refinamiento LIVE i18n global + datos reales

Tipo: frontend acotado, UX/i18n y correccion de carga visible en LIVE, sin backend ni migraciones.

Objetivo:

- Mover el selector de idioma desde LIVE hacia `Configuracion -> Sistema`.
- Persistir idioma global para pantallas preparadas con i18n.
- Eliminar terminologia tecnica visible en espanol dentro de LIVE.
- Mostrar eventos demo traducidos en lugar de codigos tecnicos.
- Evitar que fallas de carga de clientes/prendas se oculten como listas vacias.

Cambios realizados:

- Se actualizo `services/i18n.ts` para persistir idioma global con `AsyncStorage` y proteger export web estatico.
- Se actualizo `app/system.tsx` con selector ES/EN global y textos corregidos.
- Se removio el selector local de idioma en `app/live.tsx`.
- Se ajustaron filtros y mensajes de carga para clientes y prendas en LIVE.
- Se actualizaron `locales/es/common.json` y `locales/en/common.json`.
- Se actualizo `app/(tabs)/index.tsx` para evitar terminos visibles como `Live`/`Dashboard` en espanol.
- Se creo `docs/ERP_LIVE_I18N_GLOBAL_REFINEMENT.md`.
- Se creo `docs/ERP_LIVE_CUSTOMERS_ITEMS_FIXES.md`.

Validaciones:

- `rg -n "Ã|Â|�" app services locales`: sin coincidencias.
- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.

Causa raiz documentada:

- Clientes: la carga fallida se convertia en arreglo vacio por `Promise.allSettled`, ocultando errores reales de API/token/tenant/branch.
- Prendas: el filtro dependia de `item.status === 'AVAILABLE'` exacto y podia ocultar prendas por casing, mapeo incompleto o carga fallida.

Riesgos pendientes:

- i18n global aun no cubre todo el ERP; esta fase centraliza idioma y corrige LIVE/Sistema.
- El fallback de prendas sin `status` debe revisarse cuando el contrato API garantice estatus normalizado.
- Falta smoke visual runtime con backend activo para confirmar clientes y prendas reales visibles.

Decision:

- `GO tecnico` para build/export e i18n LIVE.
- `GO runtime pendiente` hasta capturar evidencia visual de clientes/prendas reales en navegador.

## 2026-05-18 - Correccion LIVE / permisos y errores secundarios

Tipo: frontend acotado, manejo UX de errores en LIVE, sin backend ni migraciones.

Objetivo:

- Evitar modal duplicado de permisos en movil.
- Diferenciar acceso denegado real a En vivo de errores secundarios de clientes, prendas o reservaciones.
- Mantener la pantalla usable cuando falla un recurso no bloqueante.

Cambios realizados:

- Se actualizo `app/live.tsx` para detectar `ApiError.status === 403`.
- Se elimino el `Alert.alert` global que concatenaba errores de `Promise.allSettled`.
- Se agregaron mensajes por recurso para clientes, prendas y reservaciones.
- Se agrego aviso no bloqueante para error de reservaciones.
- Se actualizaron claves i18n en `locales/es/common.json` y `locales/en/common.json`.
- Se creo `docs/ERP_LIVE_PERMISSION_ERROR_HANDLING.md`.

Causa raiz:

- Varias llamadas paralelas podian devolver el mismo 403; LIVE juntaba los mensajes y los mostraba en un unico modal, generando duplicados.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app services locales docs/ERP_LIVE_PERMISSION_ERROR_HANDLING.md`: sin coincidencias.

Decision:

- `GO tecnico` para build/export.
- `GO runtime pendiente` hasta validar en movil que no se duplica el modal y registrar endpoint 403 real.

## 2026-05-18 - LIVE-I / revision permisos QA y control 403 clientes

Tipo: revision frontend/backend/security + SQL QA, sin backend Java ni migraciones.

Objetivo:

- Diagnosticar `No tienes permisos para cargar clientes` en LIVE.
- Confirmar permisos/endpoints involucrados.
- Preparar script QA seguro para corregir relaciones tenant/permisos/sesiones sin debilitar seguridad.

Hallazgos:

- `GET /api/customers/branch/{branchId}` usa `CustomerService.findByBranch` y no ejecuta `assertCan(VIEW_CUSTOMERS)`.
- `GET /api/items/branch/{branchId}` usa `ItemService.findByBranch` y no ejecuta `assertCan(VIEW_INVENTORY)`.
- El 403 en clientes/prendas probablemente viene de `TenantResolver.assertBranchBelongsToCompany` o de sesion tenant-aware inconsistente.
- LIVE requiere para operar: canal `LIVE`, permiso `DO_LIVE_RESERVATION`, `user_companies`, `user_branches`, branch/company activa y sesion nueva.

Cambios realizados:

- Se creo `docs/ERP_LIVE_QA_PERMISSION_REVIEW.md`.
- Se creo `docs/qa/08-live-qa-permissions-fix.sql`.
- Se actualizo `docs/ERP_LIVE_PERMISSION_ERROR_HANDLING.md`.
- Se actualizo `docs/ERP_QA_EXECUTION_LOG.md`.
- Se actualizo `docs/ERP_RIESGOS_OPERATIVOS.md`.
- Se actualizo `docs/ERP_RESUMEN_EJECUTIVO.md`.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- No aplica `mvnw test`: no se modifico Java backend.

Decision:

- `GO documental/SQL QA`.
- `GO runtime pendiente` hasta ejecutar SQL en QA/local, relogin y validar usuario afectado.

## 2026-05-18 - LIVE-J / notificaciones y detalle de cobro

Tipo: ajuste UX frontend, sin backend, migraciones ni logica financiera.

Objetivo:

- Reemplazar avisos grandes de En vivo por un modal compacto.
- Mejorar la legibilidad del detalle de cobro de reserva en `Pagos / Cobros`.
- Mantener i18n ES/EN y terminologia en espanol como `En vivo`.

Cambios realizados:

- `app/live.tsx`: nuevo modal compacto para notificaciones de exito/error de acciones de En vivo.
- `app/live.tsx`: se elimino el `Alert.alert` duplicado al crear una transmision.
- `app/payments.tsx`: detalle de reserva agrupado en tarjetas responsive.
- `locales/es/common.json` y `locales/en/common.json`: claves nuevas para avisos de En vivo y detalle de pagos.
- `docs/ERP_LIVE_PAYMENTS_UX_REFINEMENT.md`: documento de alcance y QA.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Live|Dashboard|Timeline" app/live.tsx app/payments.tsx locales/es/common.json`: devuelve coincidencias en nombres de claves/variables y textos ingleses; los valores visibles en espanol agregados usan `En vivo`.
- `rg -n "Ã|Â|�" app locales`: sin coincidencias.
- `rg -n "Ã|Â|�" app locales docs`: devuelve coincidencias historicas documentales previas, no introducidas por esta fase.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO runtime pendiente` hasta smoke visual en web/movil.

## 2026-05-19 - LIVE-K / responsive tablet commerce UI

Tipo: UX frontend tablet-first, sin backend, migraciones, pagos reales ni reportes.

Objetivo:

- Reorganizar `En vivo` hacia una experiencia live commerce moderna.
- Optimizar visualmente tablet horizontal, desktop y demo comercial.
- Mantener reservas/cobros actuales sin tocar reglas de negocio.

Cambios realizados:

- `app/live.tsx`: layout responsive por columnas para tablet/desktop con `useResponsiveLayout`.
- `app/live.tsx`: columna visual con producto destacado, badge `En vivo`, espectadores y comentarios demo.
- `app/live.tsx`: columna central enfocada en captura y CTA `Reservar ahora`.
- `app/live.tsx`: columna derecha para reservas recientes y cierre.
- `locales/es/common.json` y `locales/en/common.json`: nuevas claves i18n para producto visual y CTA.
- `docs/ERP_LIVE_TABLET_COMMERCE_UI.md`: documentacion de alcance, validacion y riesgos.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app locales`: sin coincidencias.
- `rg -n "\bDashboard\b|\bTimeline\b" app/live.tsx locales/es/common.json`: sin coincidencias.
- `rg -n '": ".*Live' locales/es/common.json`: sin coincidencias; `Live` aparece solo en claves/identificadores tecnicos o textos ingleses.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO runtime pendiente` hasta smoke visual tablet/desktop/movil.

## 2026-05-19 - LIVE-L / layouts y flujo operativo Live Commerce

Tipo: frontend UX acotado + documentacion producto/arquitectura, sin backend ni integraciones externas.

Objetivo:

- Separar visualmente `En vivo` por desktop, tablet y movil.
- Documentar flujo operativo real de Live Commerce.
- Disenar estrategia futura de adaptadores por plataforma.
- Definir reporte final deseado sin tocar reportes runtime.

Cambios realizados:

- `components/live/LiveDesktopLayout.tsx`: layout tres columnas para desktop.
- `components/live/LiveTabletLayout.tsx`: layout dos columnas para tablet.
- `components/live/LiveMobileLayout.tsx`: layout apilado para movil.
- `app/live.tsx`: usa layout por dispositivo manteniendo la logica principal.
- `docs/ERP_LIVE_RESPONSIVE_LAYOUTS.md`: documenta PC/tablet/movil.
- `docs/ERP_LIVE_OPERATIONAL_FLOW_DESIGN.md`: documenta presentadora, operador, clientes, prendas y metricas.
- `docs/ERP_LIVE_PLATFORM_ADAPTERS_STRATEGY.md`: documenta adaptadores Facebook/YouTube/Instagram/TikTok sin runtime.
- `docs/ERP_LIVE_FINAL_REPORT_DESIGN.md`: define reporte final deseado.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Live|Dashboard|Timeline" app/live.tsx components/live locales/es/common.json`: devuelve coincidencias en claves/identificadores tecnicos y valores aceptables como `En vivo`; no se detectaron textos visibles nuevos en espanol usando `Dashboard` o `Timeline`.
- Busqueda de mojibake en `app`, `components`, `locales` y documentos LIVE-L: sin coincidencias nuevas; las coincidencias amplias corresponden a referencias historicas documentales previas.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO runtime pendiente` hasta smoke visual por dispositivo fisico o navegador con viewports tablet/movil.

## 2026-05-19 - LIVE-M / rediseño UX tablet En vivo

Tipo: UX frontend tablet-first, sin backend, migraciones, pagos reales ni reportes.

Objetivo:

- Corregir el layout tablet detectado como incomodo en prueba real.
- Priorizar reservas rapidas, captura operacional, producto visual y reservas recientes.
- Evitar que tablet se sienta como desktop comprimido.

Cambios realizados:

- `components/live/LiveTabletLayout.tsx`: reordena tablet para poner operacion/reservas como columna principal y producto/metricas como soporte.
- `app/live.tsx`: compacta metricas demo en tablet, limita ayudas largas y resume la linea de tiempo.
- `app/live.tsx`: limita visualmente reservas recientes en tablet y muestra contador de reservas adicionales.
- `app/live.tsx`: reduce altura del producto visual en tablet.
- `locales/es/common.json` y `locales/en/common.json`: agrega texto para reservas recientes adicionales.
- `docs/ERP_LIVE_TABLET_UX_REDESIGN.md`: documenta antes/despues, validacion y riesgos.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app components locales docs`: solo devuelve coincidencias historicas documentales previas; `app`, `components`, `locales` y `docs/ERP_LIVE_TABLET_UX_REDESIGN.md` no tienen coincidencias nuevas.
- `rg -n "Live|Dashboard|Timeline" app/live.tsx components/live locales/es/common.json`: devuelve claves/identificadores tecnicos y valores aceptables como `En vivo`; no se detectaron textos visibles nuevos en espanol usando `Dashboard` o `Timeline`.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO runtime pendiente` hasta smoke visual en Galaxy Tab/iPad y viewports 1024x768, 1280x800.

## 2026-05-19 - LIVE-N / microcopy y design system live-commerce

Tipo: UX/product design frontend, sin backend, migraciones, pagos reales, reportes ni integraciones.

Objetivo:

- Convertir `En vivo` hacia una experiencia live-commerce profesional.
- Crear base inicial de tarjetas reutilizables para LIVE.
- Definir microcopy comercial por dispositivo.
- Reducir lenguaje ERP/tecnico visible en fases posteriores.

Cambios realizados:

- `components/live/LiveCommerceCards.tsx`: agrega `LiveInfoCard`, `LiveMetricCard`, `LiveActionCard`, `LiveStatusCard`, `LiveWarningCard`, `LiveSuccessCard` y `LiveCompactCard`.
- `app/live.tsx`: usa `LiveMetricCard` para homologar tarjetas de metricas demostrativas.
- `locales/es/common.json`: ajusta microcopy visible para sustituir lenguaje tecnico como `Capturar`, `Alta`, `Sesion` y `Timeline`.
- `docs/ERP_LIVE_UX_COPY_GUIDE.md`: guia de microcopy y terminos preferidos.
- `docs/ERP_LIVE_DESIGN_SYSTEM.md`: base de design system LIVE.
- `docs/ERP_LIVE_DEVICE_EXPERIENCE_STRATEGY.md`: estrategia desktop/tablet/mobile.

Validaciones:

- `npm run lint`: ejecutado, sin errores; quedan 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `rg -n "Ã|Â|�" app components locales docs`: solo devuelve coincidencias historicas documentales previas; no se detectan coincidencias nuevas en el componente ni documentos de esta fase.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO UX runtime pendiente` hasta smoke visual mobile/tablet/desktop.

## 2026-05-20 - LIVE-T / LAN, CORS y safe area Android

Tipo: hardening QA red/mobile/frontend/backend minimo; sin pagos, ventas, reportes, SQL ni migraciones.

Objetivo:

- Permitir acceso QA LAN desde `http://192.168.0.128:8081` hacia backend `http://192.168.0.128:8090`.
- Evitar uso residual de `localhost`/`127.0.0.1` en frontend para QA remoto.
- Corregir preflight CORS LAN sin debilitar autenticacion.
- Reforzar safe area Android/Samsung para que headers no se empalmen con hora, senal o bateria.

Cambios realizados:

- `constants/api.ts`: mantiene host API dinamico basado en el hostname web y fallback LAN configurable.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/CorsConfig.java`: agrega origen QA LAN `http://192.168.0.128:8081`.
- `components/ui/AppScreen.tsx`: agrega guard adicional para Android y web touch device sobre el safe area existente.
- `docs/ERP_LIVE_LAN_CONNECTIVITY.md`: documenta DEV `192.168.0.128`, QA cliente `192.168.0.149`, puertos `8081/8090`, CORS y causa del preflight.
- `docs/ERP_LIVE_ANDROID_SAFE_AREA_HARDENING.md`: documenta el hardening Android.
- `docs/ERP_LIVE_RESPONSIVE_OVERLAP_FIXES.md`: documenta ajustes de solapamiento.
- `docs/ERP_LIVE_QA_MULTI_DEVICE_RESULTS.md`: registra evidencia LAN y pendientes.

Validaciones:

- `POST /api/auth/login` directo contra `192.168.0.128:8090` con usuario QA valido: `200`.
- `OPTIONS /api/auth/login` con origen `http://192.168.0.128:8081` antes del ajuste CORS: `403`.
- `rg -n "localhost|127.0.0.1|192.168.0.149" app services components constants`: sin coincidencias.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF.
- `.\mvnw.cmd test`: OK, 28 tests, `BUILD SUCCESS`.
- `rg -n "Ã|Â|�" app components locales docs`: solo coincidencias historicas documentales previas.

Decision:

- `GO tecnico` para LAN/safe area/build/test.
- `GO runtime QA` condicionado a reiniciar backend con CORS actualizado y repetir smoke fisico en equipo QA, Android y tablet.

## 2026-05-20 - LIVE-U / producto activo real y presentadora

Tipo: UX/frontend LIVE, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Evitar que `Producto en pantalla` muestre datos demo cuando hay prenda seleccionada o reservas recientes.
- Hacer que `Vista para presentadora` y `Estado operativo` reflejen transmision/producto real.
- Aclarar que las tarjetas de roles son informativas, no botones.

Cambios realizados:

- `app/live.tsx`: el producto visible se resuelve por prenda seleccionada, ultima prenda reservada o fallback `Sin producto en pantalla`.
- `app/live.tsx`: precio, codigo, talla, estado y sucursal usan datos reales disponibles o fallbacks claros.
- `app/live.tsx`: vista para presentadora muestra mensaje segun transmision/producto actual.
- `app/live.tsx`: estado operativo reduce microcopy y evita texto largo.
- `app/live.tsx`: roles se agrupan en `Roles del equipo` y usan tarjetas compactas informativas.
- `locales/es/common.json` y `locales/en/common.json`: se agregan textos localizados para producto real, estado presentadora y roles.
- `docs/ERP_LIVE_ACTIVE_PRODUCT_REAL_DATA.md`: documenta fuentes y fallbacks del producto activo.
- `docs/ERP_LIVE_PRESENTER_VIEW_STATE.md`: documenta estado de presentadora.
- `docs/ERP_LIVE_ROLE_CARDS_CLARITY.md`: documenta decision UX de roles informativos.

Pendiente:

- `npm.cmd run lint`: OK sin errores; persisten warnings historicos fuera de LIVE-U.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF.
- `rg -n "Blusa verde|Demostración|Producto destacado para demostración comercial" app components locales`: sin coincidencias.
- `rg -n "Ã|Â|�" app components locales docs`: solo coincidencias historicas documentales previas.
- Pendiente smoke visual mobile/tablet/desktop.

Decision:

- `GO tecnico` para build/export.
- `GO UX runtime` condicionado a smoke visual con datos reales QA.

## 2026-05-20 - LIVE-V / widgets configurables En vivo

Tipo: frontend/UX SaaS, persistencia local; sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Hacer configurables los widgets principales de En vivo.
- Reducir peso visual de roles cuando el usuario/equipo no los necesita.
- Preparar arquitectura futura para preferencias por usuario, empresa, rol y layout.

Cambios realizados:

- `services/liveLayoutPreferences.ts`: nuevo servicio local con preferencias por usuario o fallback por dispositivo.
- `app/system.tsx`: agrega seccion `Experiencia En vivo` con toggles para spotlight, presentadora, estado operativo, roles, analiticos y actividad.
- `app/live.tsx`: todos los widgets principales respetan preferencias; mobile oculta roles, analiticos y actividad automaticamente.
- `locales/es/common.json` y `locales/en/common.json`: textos ES/EN para configuracion de widgets.
- `docs/ERP_LIVE_WIDGET_CONFIGURATION.md`: documenta persistencia y evolucion backend futura.
- `docs/ERP_LIVE_ROLE_VISIBILITY_STRATEGY.md`: documenta roles informativos y visibilidad.
- `docs/ERP_LIVE_DEVICE_WIDGET_STRATEGY.md`: documenta comportamiento desktop/tablet/mobile.

Pendiente:

- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF.
- `rg -n "Ã|Â|�" app components services locales docs`: solo coincidencias historicas documentales previas.
- Pendiente smoke runtime para confirmar persistencia tras reload en web/mobile.
- Futura persistencia backend por usuario/company/layout.

Decision:

- `GO tecnico`.
- `GO runtime QA` condicionado a validar Sistema -> Experiencia En vivo y reload en desktop/tablet/mobile.

## 2026-05-20 - LIVE-W / captura operacional guiada

Tipo: UX/frontend LIVE, sin backend, SQL, migraciones, pagos, ventas, reportes ni integraciones.

Objetivo:

- Reducir confusion en captura de cliente y prenda durante transmisiones.
- Separar acciones principales, secundarias y terciarias.
- Hacer que la consola se sienta mas operativa y menos formulario ERP.

Cambios realizados:

- `app/live.tsx`: bloque cliente separa cliente existente y cliente nuevo.
- `app/live.tsx`: bloque prenda prioriza input `Codigo o QR de la prenda` y CTA `Agregar prenda`.
- `app/live.tsx`: busqueda/QR quedan en bloque secundario `¿No tienes codigo?`.
- `app/live.tsx`: `Crear cliente rapido` y `Crear prenda rapida` quedan como acciones terciarias.
- `locales/es/common.json` y `locales/en/common.json`: textos nuevos ES/EN para flujo guiado.
- Documentacion LIVE-W creada para captura operacional, prenda, operador y mobile.

Pendiente:

- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF.
- `rg -n "Ã|Â|�" app components services locales docs`: solo coincidencias historicas documentales previas.
- Pendiente validar visualmente mobile Android, tablet landscape y desktop ancho.

Decision:

- `GO tecnico`.
- `GO UX runtime` condicionado a smoke visual operacional.

## 2026-05-20 - LIVE-S / operacion QA, analiticos y producto activo

Tipo: UX/frontend acotado para En vivo, sin backend, migraciones, ventas, pagos, reportes ni integraciones externas.

Objetivo:

- Atender feedback QA operativo sin ampliar el alcance tecnico.
- Permitir ocultar analiticos visuales desde Sistema.
- Hacer mas claro el producto activo para presentadora/operador.
- Dar salida operativa al cliente nuevo durante En vivo.
- Documentar controles contra reservas falsas sin bloquear operacion normal.

Cambios realizados:

- `services/liveAnalyticsPreference.ts`: nueva preferencia local para analiticos de En vivo.
- `app/system.tsx`: agrega control en Sistema para mostrar/ocultar analiticos.
- `app/live.tsx`: respeta la preferencia global y oculta metricas/actividad demo cuando esta desactivada.
- `app/live.tsx`: Product Spotlight muestra codigo, talla y estado de producto al aire.
- `app/live.tsx`: agrega accion `Crear cliente rapido` desde el flujo de reserva.
- `app/live.tsx`: agrega aviso compacto de verificacion para reducir reservas falsas.
- `app/customers-create.tsx`: respeta `returnTo=/live` para regresar al flujo En vivo.
- `locales/es/common.json` y `locales/en/common.json`: agrega microcopy ES/EN para analiticos, producto activo, cliente rapido y verificacion.
- Se crean documentos LIVE-S de analiticos, producto activo, cliente nuevo, reservas falsas y feedback QA.

Validaciones:

- `npx.cmd tsc --noEmit`: OK durante implementacion.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-S.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.
- `rg -n "Ã|Â|�" app components locales docs`: solo coincidencias historicas documentales previas.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO operativo condicionado` a smoke visual mobile/tablet/desktop con backend QA activo.

## 2026-05-20 - LIVE-T / LAN, safe area Android y responsive hardening

Tipo: hardening frontend/red QA, sin backend funcional nuevo, SQL, ventas, pagos, reportes ni integraciones externas.

Objetivo:

- Corregir consumo API desde equipos QA LAN.
- Reforzar safe area Android/Samsung/tablet.
- Reducir riesgos de empalmes responsive en En vivo.

Cambios realizados:

- `constants/api.ts`: elimina fallback web a `localhost` y resuelve API por `window.location.hostname`.
- `constants/api.ts`: actualiza fallback LAN configurable a `192.168.0.128`.
- `components/ui/AppScreen.tsx`: usa `StatusBar.currentHeight` como fallback Android para evitar encimado superior.
- `services/apiClient.ts`: se valida que mensajes visibles esten sin mojibake.
- Se crean documentos de conectividad LAN, safe area Android, overlap responsive y resultados QA multi-dispositivo.

Validaciones:

- `http://192.168.0.128:8081`: HTTP 200.
- `http://192.168.0.128:8090/api/health`: HTTP 200.
- `netstat`: `8081` escucha en `0.0.0.0` y registra conexiones `ESTABLISHED` desde `192.168.0.149`.
- `rg -n "localhost|127.0.0.1" app services components constants`: sin coincidencias.
- `rg -n "Ã|Â|�" app services components constants locales`: sin coincidencias.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-T.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.

Decision:

- `GO tecnico` para base LAN/safe-area.
- `GO demo multi-dispositivo condicionado` a smoke real desde equipo QA, Android y tablet.

## 2026-05-19 - LIVE-Q / hardening UX y demo candidate

Tipo: UX frontend LIVE, sin backend, APIs, migraciones, pagos, ventas, reportes, realtime ni integraciones externas.

Objetivo:

- Corregir empalme reportado con status bar Android/tablet.
- Reducir texto y lenguaje tecnico.
- Fortalecer jerarquia visual mobile/tablet/desktop.
- Documentar feedback QA y estado demo candidate.

Cambios realizados:

- `app/live.tsx`: agrega resguardo superior local para header de LIVE usando `useSafeAreaInsets` y `Platform`.
- `app/live.tsx`: reemplaza encabezado simple por header contextual por dispositivo.
- `app/live.tsx`: oculta tarjetas multirol en movil para reducir ruido.
- `app/live.tsx`: limita textos de tarjetas de rol para lectura rapida.
- `locales/es/common.json` y `locales/en/common.json`: ajusta microcopy comercial/operativo.
- `docs/ERP_LIVE_QA_FEEDBACK_REVIEW.md`: matriz de feedback QA.
- `docs/ERP_LIVE_SAFE_AREA_MOBILE_FIXES.md`: documenta safe area local.
- `docs/ERP_LIVE_USABILITY_HARDENING.md`: documenta endurecimiento UX.
- `docs/ERP_LIVE_DEMO_CANDIDATE_STATUS.md`: estado demo candidate.

Validaciones:

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-Q.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `rg -n "Ã|Â|�" app components locales docs`: solo devuelve coincidencias historicas documentales previas; no se detectan coincidencias nuevas en `app`, `components` ni `locales`.
- `git diff --check`: OK; solo avisos LF/CRLF normales.

Decision:

- `GO tecnico` para lint, TypeScript, export web y diff check.
- `GO demo candidate condicionado` hasta smoke visual en Android/tablet/iPad.

## 2026-05-20 - LIVE-R / smoke demo candidate

Tipo: QA frontend LIVE, sin backend, APIs, migraciones, pagos, ventas, reportes, SQL, realtime, IA ni integraciones externas.

Objetivo:

- Validar estado tras reinicio abrupto.
- Confirmar Expo/web en `8081`.
- Ejecutar validacion tecnica final.
- Documentar smoke por dispositivo y checklist final.

Prechecks:

- Rama actual: `feature/live-r-smoke-demo-candidate`.
- `git status --short` inicial: limpio.
- Puerto `8081`: libre antes de iniciar.
- Procesos `node`: no detectados antes de iniciar.
- Expo web: `http://localhost:8081`, `/login` y `/live` responden `200`.

Cambios realizados:

- `docs/ERP_LIVE_DEMO_CANDIDATE_VALIDATION.md`: evidencia y decision de demo candidate.
- `docs/ERP_LIVE_DEVICE_SMOKE_RESULTS.md`: resultado por mobile/tablet/desktop.
- `docs/ERP_LIVE_QA_FINAL_CHECKLIST.md`: checklist ejecutable de cierre.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.
- `rg -n "Ã|Â|�" app components locales docs`: solo coincidencias historicas documentales previas.
- `rg -n "Live|Dashboard|Timeline" app components locales/es/common.json`: coincidencias por nombres internos/legacy; valores visibles LIVE en espanol no usan esos terminos.

Decision:

- `GO tecnico` para demo candidate frontend.
- `GO demo candidate condicionado` hasta smoke visual fisico y flujo funcional completo con backend QA activo.

## 2026-05-19 - LIVE-P / flujo runtime multioperador

Tipo: UX frontend live-commerce, sin backend, migraciones, pagos reales, ventas reales, reportes backend ni integraciones externas.

Objetivo:

- Hacer que `En vivo` se sienta como operacion multiusuario y no como formulario ERP.
- Separar visualmente presentadora, operador y supervisor.
- Dar sensacion de actividad viva sin sockets ni backend realtime.
- Mejorar tablet como consola operativa principal.

Cambios realizados:

- `app/live.tsx`: agrega tarjetas de roles para presentadora, operador y supervisor.
- `app/live.tsx`: agrega pulso de transmision compacto para tablet y desktop.
- `app/live.tsx`: mejora Product Spotlight con prompt de producto al aire y urgencia visual.
- `app/live.tsx`: reemplaza activity feed plano por filas con badge, timestamp y jerarquia visual.
- `app/live.tsx`: agrega acciones rapidas del operador sobre el flujo de reserva.
- `components/live/LiveTabletLayout.tsx`: ajusta proporciones para que producto y operacion respiren mejor en tablet.
- `locales/es/common.json` y `locales/en/common.json`: agrega microcopy multirol, activity feed y pulso streaming.
- `docs/ERP_LIVE_MULTI_OPERATOR_FLOW.md`: documenta flujo multioperador.
- `docs/ERP_LIVE_RUNTIME_SIMULATION.md`: documenta simulacion runtime sin backend realtime.
- `docs/ERP_LIVE_TABLET_OPERATION_GUIDE.md`: documenta uso operativo en tablet.

Validaciones:

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-P.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `rg -n "Ã|Â|�" app components locales docs`: solo devuelve coincidencias historicas documentales previas; no se detectan coincidencias nuevas en `app`, `components` ni `locales`.
- `rg -n "Live|Dashboard|Timeline|Capturar|Alta|Demo visual" app/live.tsx components/live locales/es/common.json`: las coincidencias restantes son nombres tecnicos internos o textos historicos no usados por el nuevo flujo.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO UX runtime pendiente` hasta smoke visual mobile/tablet/desktop.

## 2026-05-19 - LIVE-O / operator console y product spotlight

Tipo: UX frontend live-commerce, sin backend, migraciones, pagos reales, ventas reales ni integraciones externas.

Objetivo:

- Hacer que el producto sea protagonista visual.
- Crear una consola de operador mas clara.
- Reemplazar timeline/log por actividad humana.
- Compactar metricas hacia formato streaming.

Cambios realizados:

- `app/live.tsx`: agrega Product Spotlight con precio, badges comerciales y urgencia visual.
- `app/live.tsx`: agrega `Consola del operador` sobre el bloque de registro de reserva.
- `app/live.tsx`: reemplaza eventos tipo timeline por `Actividad reciente` con mensajes humanos.
- `app/live.tsx`: reservas recientes se muestran con `LiveCompactCard`.
- `locales/es/common.json` y `locales/en/common.json`: agrega microcopy para spotlight, consola y activity feed.
- `docs/ERP_LIVE_OPERATOR_CONSOLE.md`: documenta la consola del operador.
- `docs/ERP_LIVE_PRODUCT_SPOTLIGHT.md`: documenta el producto protagonista.
- `docs/ERP_LIVE_ACTIVITY_FEED.md`: documenta el feed humano.

Validaciones:

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-O.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `rg -n "Ã|Â|�" app components locales docs`: solo devuelve coincidencias historicas documentales previas; no se detectan coincidencias nuevas en `app`, `components` ni `locales`.
- `rg -n "Dashboard|Timeline|Capturar|Alta|Demo visual|\bLive\b" app/live.tsx components/live locales/es/common.json`: las coincidencias restantes son nombres tecnicos de tipos/estilos o claves internas; no se agrego terminologia visible nueva en espanol.

Decision:

- `GO tecnico` para lint, TypeScript y export web.
- `GO UX runtime pendiente` hasta smoke visual mobile/tablet/desktop.

## 2026-05-21 - LIVE-W / refinamiento operacional compacto

Tipo: UX frontend En vivo, sin backend, SQL, migraciones, pagos, ventas, reportes ni integraciones externas.

Objetivo:

- Rebalancear el layout cuando widgets configurables estan ocultos.
- Reducir ruido visual y competencia entre acciones.
- Hacer que la consola del operador domine el flujo principal.
- Separar acciones primarias, secundarias y terciarias.

Cambios realizados:

- `components/live/LiveDesktopLayout.tsx`: modo `compact` para eliminar columna vacia y redistribuir consola/reservas.
- `components/live/LiveTabletLayout.tsx`: modo `compact` de una columna operativa amplia.
- `components/live/LiveMobileLayout.tsx`: omite columna vacia en modo compacto.
- `app/live.tsx`: activa layout compacto cuando no hay widgets de contexto visibles.
- `app/live.tsx`: altas rapidas de cliente/prenda pasan a estilo discreto tipo ghost.
- `app/live.tsx`: `Crear prenda rapida` queda separado bajo `La prenda no existe?`.
- `locales/es/common.json` y `locales/en/common.json`: agrega microcopy para bloque operacional y excepcion de prenda inexistente.
- `docs/ERP_LIVE_OPERATIONAL_LAYOUT_REBALANCE.md`: documenta redistribucion de layout.
- `docs/ERP_LIVE_CAPTURE_VISUAL_HIERARCHY.md`: documenta jerarquia primaria/secundaria/terciaria.
- `docs/ERP_LIVE_COMPACT_OPERATOR_FLOW.md`: documenta flujo compacto del operador.
- `docs/ERP_LIVE_WIDGET_COLLAPSE_STRATEGY.md`: documenta colapso de widgets.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten 55 warnings historicos fuera del alcance LIVE-W adicional.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.
- `rg -n "Ã|Â|�" app components locales docs`: solo coincidencias historicas documentales previas; no se detectan coincidencias nuevas en `app`, `components` ni `locales`.

Decision:

- `GO tecnico condicionado` hasta completar smoke visual mobile/tablet/desktop con widgets ocultos.

## 2026-05-21 - LIVE-X / permisos por rol presentadora-operador-supervisor

Tipo: hardening frontend de permisos y documentacion de seguridad, sin backend funcional, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Diferenciar experiencia En vivo por rol/permisos.
- Evitar que usuarios sin permisos naveguen directo a secciones sensibles.
- Documentar brechas backend antes de AUTH-A.

Cambios realizados:

- `services/livePermissionGuards.ts`: helpers `canViewLive`, `canOperateLive`, `canCreateLiveCustomer`, `canCreateLiveItem`, `canViewLiveAnalytics`, `canConfigureSystem`, `canManageUsers`.
- `app/live.tsx`: acciones de cliente, prenda, reserva, crear/activar/cerrar transmision y analiticos respetan permisos.
- `app/live.tsx`: usuarios sin permiso de operacion ven mensajes claros y no botones de acciones no permitidas.
- `app/system.tsx`: guard frontend para navegacion directa a Sistema.
- `app/users.tsx`: guard frontend para navegacion directa a Usuarios.
- `docs/ERP_LIVE_ROLE_PERMISSION_MATRIX.md`: matriz presentadora/operador/supervisor.
- `docs/ERP_LIVE_OPERATOR_PRESENTER_ACCESS.md`: experiencia esperada por usuario QA.
- `docs/ERP_PERMISSION_GUARDS_REVIEW.md`: diagnostico de guards frontend/backend.
- `docs/ERP_QA_ROLE_ACCESS_VALIDATION.md`: checklist de validacion QA por usuario.

Hallazgos:

- `LiveService.create/activate/close` y `ReservationService.create` ya validan permisos backend.
- `LiveService.findByBranch/findById`, `CustomerService` e `ItemService` tienen validaciones tenant, pero falta completar permiso funcional backend en lecturas/altas.

Decision:

- `GO tecnico frontend`.
- `NO-GO seguridad SaaS completa` hasta AUTH-A/backend permission hardening.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten warnings historicos fuera del alcance LIVE-X.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.
- `rg -n "Ã|Â|�" app components services locales docs`: solo coincidencias historicas documentales previas; no se detectan coincidencias nuevas en `app`, `components`, `services` ni `locales`.
- Maven no se ejecuto porque no se modifico Java/backend.

## 2026-05-22 - AUTH-A / RBAC login y sesion unica

Tipo: hardening backend/frontend de autorizacion y sesiones, sin pagos, ventas, reportes, SQL destructivo ni migraciones Flyway.

Objetivo:

- Bloquear login de usuarios sin permisos efectivos o con rol `NO_ACCESS`.
- Exigir company/branch activa y asignacion `user_branches` antes de crear sesion.
- Revocar sesiones activas anteriores del mismo usuario al iniciar sesion.
- Exponer company activa en login y `/api/me`.
- Agregar helpers frontend de permisos y guards directos en pantallas P0.

Cambios realizados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/auth/AuthService.java`: valida roles/permisos/company/branch antes de crear sesion y revoca sesiones previas.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/auth/LoginResponse.java`: agrega `company`.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`: diferencia token revocado por sesion iniciada en otro dispositivo.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/me/MeService.java`: devuelve tenant activo.
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/me/MeResponse.java`: agrega `company`.
- `services/sessionStorage.ts` y `services/authService.ts`: almacenan company activa.
- `services/accessControl.ts`: agrega `can`, `hasAnyPermission` e `isNoAccess`.
- `app/customers.tsx`, `app/items.tsx`, `app/batches.tsx`: bloquean navegacion directa si faltan permisos.
- `docs/AUTH_RBAC_LOGIN_GUARDS.md`, `docs/AUTH_SINGLE_ACTIVE_SESSION.md`, `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`, `docs/AUTH_QA_VALIDATION_PLAN.md`: documentacion AUTH-A.

Validaciones:

- `.\mvnw.cmd test`: OK, 28 pruebas, Flyway valida 43 migraciones.
- `npm.cmd run lint`: OK sin errores; persisten 59 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.
- `rg -n "NO_ACCESS|revoked_at|user_api_sessions|permissions" backend/control-ropa/src app services components docs`: OK, confirma trazas esperadas.
- `rg -n "Ã|Â|�" app components services locales docs`: solo coincidencias historicas documentales previas.

Decision:

- `GO tecnico`.
- `GO release condicionado` hasta completar smoke runtime con usuarios QA y confirmar revocacion multi-dispositivo.

## 2026-05-23 - AUTH-A ajuste / cierre frontend por sesion revocada

Tipo: hardening frontend de autenticacion, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Evitar que un equipo siga navegando cuando su token ya fue revocado por login del mismo usuario en otro equipo.
- Mostrar mensaje claro en `/login`.

Cambios realizados:

- `services/apiClient.ts`: todo request protegido con `401` limpia sesion, guarda aviso y redirige a `/login`.
- `services/sessionStorage.ts`: agrega aviso temporal de autenticacion.
- `app/login.tsx`: consume el aviso y muestra `Tu sesión se cerró porque iniciaste sesión en otro equipo.`.
- `docs/AUTH_SINGLE_ACTIVE_SESSION.md` y `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: documentan comportamiento esperado.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten 59 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.

Decision:

- `GO tecnico`.
- `GO runtime condicionado` a smoke multi-dispositivo real.

## 2026-05-23 - AUTH-A ajuste / sincronizacion session branch

Tipo: hardening frontend de sesion tenant-aware, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Evitar que una sesion local vieja siga usando branch anterior, por ejemplo `/api/items/branch/4`, cuando `/api/me` ya resuelve branch activa 6.
- Evitar que `NetworkError` quede como estado final en pantallas protegidas.

Cambios realizados:

- `services/sessionStorage.ts`: `clearSession` elimina `user_session`, posibles keys legacy y seleccion local `selected_live_*`.
- `services/apiClient.ts`: valida `/api/me` antes de requests protegidos, sincroniza company/branch/permisos y reescribe rutas `/branch/{old}` a `/branch/{active}`.
- `services/apiClient.ts`: si `/api/me` no se puede validar por red en request protegido, limpia sesion y redirige a `/login` con aviso.
- `docs/AUTH_SINGLE_ACTIVE_SESSION.md`: documenta sincronizacion y manejo de branch vieja.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten 59 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.

Decision:

- `GO tecnico`.
- `GO runtime condicionado` a smoke multi-dispositivo.

## 2026-05-23 - AUTH-A ajuste backend / rechazo runtime de token revocado

Tipo: hardening backend de sesion API, sin pagos, ventas, reportes, SQL destructivo ni migraciones.

Objetivo:

- Corregir escenario donde SQL mostraba una sola sesion activa pero el token anterior seguia recibiendo `200` en runtime.
- Forzar `401` real para token revocado o no correspondiente a la ultima sesion activa del usuario.

Cambios realizados:

- `ApiTokenFilter`: reemplaza validacion por conteo con validacion explicita de fila `user_api_sessions`.
- `ApiTokenFilter`: valida `revoked_at`, `expires_at`, `absolute_expires_at`, usuario activo, company/branch activa y ultima sesion activa.
- `ApiTokenFilter`: agrega logs temporales con `sessionId`, `userId`, hash parcial, timestamps de sesion y resultado.
- `ApiTokenFilter.refreshSession`: solo refresca sesiones no revocadas y no expiradas.
- `CurrentUser`: exige que el token pertenezca a la ultima sesion activa.
- `TenantResolver`: exige que el token pertenezca a la ultima sesion activa.
- `AuthService.revokeActiveSessionsForUser`: revoca cualquier sesion no revocada del usuario antes de crear una nueva, aunque ya estuviera expirada.

Validaciones:

- `.\mvnw.cmd test`: OK, 28 pruebas, Flyway valida 43 migraciones.

Decision:

- `GO backend tecnico`.
- `GO runtime condicionado` a repetir smoke multi-dispositivo y confirmar que equipo 1 recibe `401` en `/api/me`.

## 2026-05-23 - AUTH-A ajuste UX / mensaje de sesion cerrada

Tipo: refinamiento frontend de UX de autenticacion, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Evitar que el equipo viejo muestre `NetworkError` cuando la validacion de sesion ya esta redirigiendo a `/login`.
- Priorizar el mensaje `Tu sesión se cerró porque iniciaste sesión en otro equipo.`.

Cambios realizados:

- `services/apiClient.ts`: agrega `SessionRedirectError` y marca errores de redireccion de sesion con `suppressUserNotification`.
- `services/apiClient.ts`: si falla la validacion protegida de `/api/me`, limpia sesion y redirige con mensaje de sesion cerrada por otro equipo.
- `app/items.tsx`, `app/customers.tsx`, `app/batches.tsx`: ignoran errores suprimibles de redireccion de sesion para no mostrar toast/alert secundario.

Validaciones:

- `npm.cmd run lint`: OK sin errores; persisten 59 warnings historicos.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `git diff --check`: OK; solo avisos LF/CRLF normales.

Decision:

- `GO tecnico`.
- `GO runtime condicionado` a repetir smoke multi-dispositivo.

## 2026-05-23 - AUTH-A ajuste UX / permisos y dependencias sugeridas

Tipo: refinamiento frontend/documental de permisos, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Mostrar permisos con descripcion humana como texto principal y codigo tecnico como referencia secundaria.
- Agregar advertencias no bloqueantes para dependencias sugeridas de permisos.

Cambios realizados:

- `app/users-form.tsx`: selector de permisos directos adicionales muestra descripcion primero, codigo en minusculas y estado `Agregar`/`Incluido`.
- `app/system-roles.tsx`: selector de permisos del rol usa la misma jerarquia visual.
- `services/permissionDependencies.ts`: matriz local de dependencias sugeridas, solo para advertencia visual.
- `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: documenta que las dependencias son frontend/documentales y no enforcement backend.

Riesgos:

- Las dependencias aun no bloquean guardado ni se validan en backend.
- La matriz debe confirmarse con negocio antes de convertirla en regla fuerte.

Decision:

- `GO UX tecnico`.
- `GO seguridad condicionado` a implementar enforcement backend en una fase posterior si se aprueba la matriz RBAC.

## 2026-05-23 - AUTH-A ajuste UX / roles homologados y revision crear clientes

Tipo: refinamiento frontend/documental de seguridad, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Homologar la jerarquia visual de roles y permisos.
- Revisar si existe permiso funcional especifico para crear clientes.

Cambios realizados:

- `app/users-form.tsx`: selector de roles muestra nombre humano, codigo tecnico en minusculas y estado `Agregar`/`Seleccionado`.
- `app/users.tsx`: resumen de roles muestra nombre humano con codigo tecnico secundario.
- `app/system-roles.tsx`: tarjetas de roles muestran nombre humano, codigo tecnico secundario y permisos incluidos.
- `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: documenta el hallazgo sobre alta de clientes.
- `docs/AUTH_RBAC_LOGIN_GUARDS.md`: registra que AUTH-A no agrega permisos nuevos.

Hallazgo crear clientes:

- No se encontro permiso persistido `CREATE_CUSTOMER`, `CREATE_CUSTOMERS`, `ADD_CUSTOMER` ni `MANAGE_CUSTOMERS` en migraciones/datasets revisados.
- `PermissionCode.java` no define permiso especifico de alta de clientes.
- `CustomerController.create` y `CustomerService.create` validan tenant/company/branch y datos, pero no ejecutan `accessService.assertCan(...)` para un permiso funcional de creacion.
- Frontend `customers.tsx` protege la pantalla con `VIEW_CUSTOMERS`; `customers-create.tsx` no tiene guard especifico de creacion.

Riesgo:

- No declarar RBAC fino de clientes completo hasta definir permiso funcional de alta/edicion y enforcement backend.

Decision:

- `GO UX tecnico`.
- `NO-GO` para declarar separacion lectura/creacion de clientes hasta fase posterior de hardening RBAC backend.

## 2026-05-23 - AUTH-A ajuste UX / filtros, grupos y dependencias RBAC

Tipo: refinamiento frontend/documental de administracion RBAC, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Homologar listados de roles/permisos con nombre humano, codigo tecnico y estado.
- Agregar filtro a permisos directos adicionales del usuario.
- Ordenar permisos por grupo inferido y descripcion humana.
- Ampliar advertencias no bloqueantes de dependencias sugeridas.

Cambios realizados:

- `services/permissionDependencies.ts`: agrega agrupacion visual, filtro por grupo/codigo/nombre, orden por modulo y dependencias con descripcion humana.
- `app/users-form.tsx`: permisos directos adicionales ahora tienen buscador y grupos visuales.
- `app/system-roles.tsx`: permisos existentes en rol se agrupan y ordenan igual que los permisos directos.
- `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: agrega hallazgos del catalogo RBAC, permisos faltantes probables y pendientes backend.

Dependencias agregadas como advertencia:

- `REASSIGN_CUSTOMERS` -> `VIEW_CUSTOMERS`.
- `APPLY_CUSTOMER_BALANCE` -> `VIEW_CUSTOMERS`.
- `CREATE_CLOSE_CUSTOMER_PACKAGE` -> `VIEW_CUSTOMERS`.
- `VIEW_CUSTOMER_ORDERS` -> `VIEW_CUSTOMERS`.
- `REGISTER_PAYMENTS` -> `VIEW_PAYMENTS`.
- `VOID_PAYMENT` -> `VIEW_PAYMENTS`.
- `MANAGE_INVENTORY` -> `VIEW_INVENTORY`.
- `CREATE_ITEM` -> `VIEW_INVENTORY`.
- `EDIT_ITEM` -> `VIEW_INVENTORY`.
- `VIEW_REPORT_*` -> `VIEW_REPORTS`.

Decision:

- `GO UX tecnico`.
- `NO-GO` para enforcement RBAC fino hasta AUTH-F/backend.

## 2026-05-23 - AUTH-A ajuste UX / estados y dependencias visibles

Tipo: refinamiento frontend/documental RBAC, sin backend, SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Homologar visualmente los estados `Agregar`, `Incluido` y `Seleccionado`.
- Mostrar dependencias sugeridas con lenguaje humano cuando existan en catalogo.
- Distinguir dependencias huerfanas que todavia no existen como permisos reales.

Cambios realizados:

- `app/system-roles.tsx`: el estado `Incluido`/`Agregar` queda dentro del mismo bloque visual del permiso, igual que permisos directos.
- `app/users-form.tsx`: mantiene la misma estructura visual en permisos directos y roles asignables.
- `services/permissionDependencies.ts`: ahora valida si la dependencia existe en el catalogo visible antes de construir el mensaje.
- `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: documenta dependencias validas y huerfanas.

Hallazgos:

- `VIEW_PAYMENTS` no se encontro en `PermissionCode.java` ni en migraciones revisadas.
- `VIEW_DEPOSIT_REPORTS` existe, pero no reemplaza a `VIEW_PAYMENTS`.
- Dependencias validas actualmente: `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `VIEW_REPORTS`.
- Dependencia huerfana actual: `VIEW_PAYMENTS`.

Decision:

- `GO UX tecnico`.
- `NO-GO` para tratar `VIEW_PAYMENTS` como permiso accionable hasta definirlo formalmente.

## 2026-05-23 - AUTH-A cierre controlado

Tipo: cierre tecnico/documental de AUTH-A, sin SQL, migraciones, pagos, ventas ni reportes.

Objetivo:

- Congelar AUTH-A como fase de login seguro, sesion unica, tenant/session en frontend y guards basicos.
- Evitar seguir ampliando AUTH-A hacia RBAC avanzado.
- Dejar permisos finos, matriz permiso-endpoint y enforcement backend para AUTH-F/RBAC avanzado.

Estado:

- Login seguro validado.
- Usuarios `NO_ACCESS` y usuarios con 0 permisos efectivos bloqueados.
- Sesion unica por usuario implementada.
- Tokens viejos revocados rechazados por backend.
- Frontend limpia sesion y vuelve a `/login` con mensaje claro.
- Company/branch activa se propaga en login y `/api/me`.
- Guards frontend basicos implementados en pantallas P0.
- Dependencias de permisos quedan como advertencias frontend/documentales.

Deuda aceptada:

- No existe `VIEW_PAYMENTS` en catalogo actual.
- No existe permiso funcional especifico de alta de clientes.
- No declarar RBAC fino completo.
- Enforcement backend por endpoint queda pendiente para AUTH-F.

Cambio menor de cierre:

- `ApiTokenFilter`: logs temporales de validacion de sesion bajan de `INFO` a `DEBUG` para reducir ruido operativo sin perder trazabilidad tecnica.

Decision:

- `GO tecnico condicionado` para merge a `develop`.
- Siguiente fase recomendada: `AUTH-F matriz permiso-endpoint y enforcement backend`.

## 2026-05-24 - AUTH-F inicio matriz RBAC permiso-endpoint

Tipo: diagnostico documental RBAC, sin SQL, migraciones, cambios productivos, pagos, ventas ni reportes.

Objetivo:

- Crear matriz formal de permisos existentes, pantallas frontend, endpoints backend y huecos de enforcement.
- Confirmar permisos faltantes o ambiguos antes de proponer migraciones o enforcement backend.

Cambios realizados:

- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`: nueva matriz AUTH-F con inventario de permisos, endpoints, pantallas, huecos y recomendaciones.
- `docs/AUTH_FRONTEND_PERMISSION_GUARDS.md`: referencia a AUTH-F como fuente de matriz completa.
- `docs/ERP_RIESGOS_OPERATIVOS.md`: se agrega riesgo operativo de RBAC fino pendiente.
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`: se agrega backlog AUTH-F.

Hallazgos:

- `VIEW_PAYMENTS` no existe en catalogo revisado.
- No existe permiso funcional especifico para alta de clientes (`CREATE_CUSTOMER` o equivalente).
- `CREATE_ITEM` y `EDIT_ITEM` aparecen como dependencias preparatorias frontend, no como permisos persistidos confirmados.
- Hay pantallas con guard frontend donde el backend aun debe confirmar enforcement funcional fino.

Decision:

- `GO diagnostico`.
- `NO-GO` para crear permisos o enforcement masivo hasta aprobar matriz AUTH-F.

## 2026-05-24 - AUTH-F2 propuesta de catalogo RBAC minimo

Tipo: aprobacion documental de catalogo RBAC, sin Java, frontend funcional, SQL, migraciones, roles reales, pagos, ventas ni reportes.

Objetivo:

- Convertir la matriz AUTH-F1 en una propuesta formal de permisos minimos candidatos.
- Separar permisos a crear primero, permisos a postergar y dependencias RBAC validas/huerfanas.

Cambios realizados:

- `docs/AUTH_F2_RBAC_CATALOG_APPROVAL.md`: nuevo documento de propuesta de catalogo RBAC minimo.
- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`: referencia a AUTH-F2 como documento de aprobacion de catalogo.
- `docs/ERP_RIESGOS_OPERATIVOS.md`: se documenta que AUTH-F2 no implementa permisos todavia.
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`: se agrega backlog AUTH-F2.

Decision recomendada:

- MVP candidato: `CREATE_CUSTOMER`, `EDIT_CUSTOMER`, `VIEW_PAYMENTS`.
- `VIEW_SALES` queda recomendado de forma condicionada por su relacion con pagos/ventas/reportes.
- No incluir todavia permisos finos de items, batches, reservas o LIVE hasta cerrar pruebas y roles.

Estado:

- `GO documental condicionado`.
- `NO-GO` para migraciones/enforcement hasta aprobacion de catalogo y plan AUTH-F2B/F2E.

## 2026-05-24 - AUTH-F3 catalogo RBAC y enforcement P0 inicial

Tipo: cambio controlado de seguridad RBAC, con migracion Flyway, script QA, enforcement backend P0, frontend alineado y documentacion.

Objetivo:

- Crear permisos aprobados `CREATE_CUSTOMER`, `EDIT_CUSTOMER`, `VIEW_PAYMENTS`, `VIEW_SALES`.
- Aplicar enforcement inicial en clientes, consultas de pagos y consultas de ventas.
- Mantener intacta la logica funcional de pagos, ventas y reportes.

Cambios realizados:

- `V44__auth_f3_rbac_catalog_permissions.sql`: crea permisos RBAC minimos sin asignarlos a roles productivos.
- `PermissionCode.java`: agrega codigos nuevos.
- `CustomerService`: lectura requiere `VIEW_CUSTOMERS`, alta `CREATE_CUSTOMER`, edicion/desactivacion `EDIT_CUSTOMER`.
- `PaymentService`: consultas `GET` requieren `VIEW_PAYMENTS`; registro/anulacion conservan permisos existentes.
- `SaleService`: consultas `GET` requieren `VIEW_SALES`; crear/cancelar conservan permisos existentes.
- `OperationMenuService`: clientes usa `VIEW_CUSTOMERS` y pagos usa `VIEW_PAYMENTS`.
- Frontend clientes/pagos/LIVE alinea guards con permisos nuevos.
- `docs/qa/09-auth-f3-rbac-permissions-qa.sql`: asigna permisos nuevos solo a roles QA A/B.
- `docs/AUTH_F3_RBAC_PERMISSIONS_ENFORCEMENT.md`: documenta alcance, endpoints protegidos, riesgos y rollback.

Pruebas:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, 34 tests, 0 failures, Flyway V44 validada/aplicada localmente.
- `npm.cmd run lint`: exitoso con warnings preexistentes.
- `npx.cmd tsc --noEmit`: exitoso.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: exitoso.
- `git diff --check`: sin errores, solo warnings CRLF.

Decision:

- `GO tecnico condicionado`.
- Pendiente ejecutar script QA y smoke QA con roles A/B antes de declarar cierre runtime final AUTH-F3.

## 2026-06-09 - LIVE-PERM-A1 permisos LIVE minimos reales

Tipo: cambio controlado RBAC/LIVE con migracion Flyway, enforcement minimo backend, capacidades frontend y documentacion.

Objetivo:

- Crear permisos reales minimos para separar visualizacion, operacion, preparacion de prenda y control de prenda al aire.
- Mantener `DO_LIVE_RESERVATION` como compatibilidad para apartados LIVE.
- No tocar precio LIVE, pagos, caja, devoluciones ni autorizaciones complejas.

Cambios realizados:

- `V50__live_minimal_permissions.sql`: inserta `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM` y `REMOVE_LIVE_ACTIVE_ITEM`.
- `PermissionCode.java`: agrega constantes de permisos LIVE minimos.
- `LiveService`: aplica enforcement minimo con fallback legacy.
- `OperationMenuService`: muestra LIVE con `VIEW_LIVE`, `OPERATE_LIVE` o `DO_LIVE_RESERVATION`.
- `services/liveCapabilities.ts`: alinea capacidades frontend con permisos minimos.
- `docs/LIVE_PERM_A1_MINIMAL_LIVE_PERMISSIONS.md`: documenta alcance, permisos creados y exclusiones.

Decision:

- `GO tecnico` si backend/frontend pasan validaciones.
- `PENDING_QA_VISUAL` hasta validar roles y pantalla LIVE con evidencia real.

## 2026-06-09 - ITEM-Z2 elegibilidad de prenda al aire LIVE

Tipo: hardening backend minimo de inventario LIVE, sin migracion, endpoints nuevos, pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.

Objetivo:

- Reforzar `LiveService.setActiveItem` para que solo prendas `AVAILABLE` puedan ponerse o cambiarse como prenda al aire.
- Mantener `lives.active_item_id` como referencia LIVE sin cambiar `items.status`.
- Conservar `ReservationService` como responsable de bloquear inventario al apartar.

Cambios realizados:

- `LiveService`: valida `ItemStatus.AVAILABLE` antes de asignar active item.
- `LiveServiceTests`: agrega cobertura para `RESERVED`, `SOLD`, `DISABLED`, `ON_CONSIGNMENT` y retiro sin cambio de inventario.
- `docs/ITEM_Z2_LIVE_ACTIVE_ITEM_ELIGIBILITY.md`: documenta alcance, reglas, exclusiones y QA.

Decision:

- `GO tecnico` si backend/frontend pasan validaciones.
- `PENDING_QA_VISUAL` hasta validar en pantalla o API con datos reales.

## 2026-06-09 - ITEM-Z3B reserva atomica de apartados

Tipo: hardening backend minimo de reservas, sin migracion, endpoints nuevos, pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.

Objetivo:

- Proteger la transicion `AVAILABLE -> RESERVED` ante doble submit o concurrencia.
- Mantener `ReservationService.create` como flujo unico de bloqueo de inventario al apartar.
- Conservar `DO_LIVE_RESERVATION` para apartados LIVE.

Cambios realizados:

- `ItemRepository`: agrega update atomico condicional `reserveIfAvailable(...)`.
- `ReservationService`: crea la reserva solo si el update atomico afecta una fila.
- `ReservationServiceTests`: cubre exito `AVAILABLE`, rechazo por estados no disponibles, fallo atomico con cero filas y apartado LIVE.
- `docs/ITEM_Z3B_RESERVATION_ATOMIC_UPDATE.md`: documenta alcance, rollback, riesgos y QA.

Decision:

- `GO tecnico` si backend/frontend pasan validaciones.
- `PENDING_QA_VISUAL` hasta validar doble submit/API con datos reales.

## 2026-06-09 - ITEM-Z4 consistencia visual de prenda al aire

Tipo: mejora frontend/UI, sin backend, migraciones, endpoints, permisos, RBAC, pagos, caja, precio LIVE, devoluciones ni autorizaciones.

Objetivo:

- Evitar que una prenda actualmente al aire aparezca en el selector LIVE solamente como `Libre`.
- Mantener `items.status = AVAILABLE` como disponibilidad real de inventario.
- Distinguir `lives.active_item_id` como estado operativo visual.

Cambios realizados:

- `app/live.tsx`: el selector muestra panel `Actualmente al aire` para la prenda activa.
- `app/live.tsx`: la prenda activa queda deshabilitada en el selector para no prepararla como reemplazo de si misma.
- `AppOptionRow`: agrega soporte opcional `disabled`.
- Locales ES/EN/PT-BR/FR/JA/ZH/KO: agregan microcopy del selector.
- `docs/ITEM_Z4_LIVE_ACTIVE_ITEM_UX_CONSISTENCY.md`: documenta alcance, restricciones y QA.

Decision:

- `GO tecnico` si frontend pasa validaciones.
- `PENDING_QA_VISUAL` hasta validar en `/live` con navegador/capturas reales.
## 2026-06-10 - LIVE-AUTH-B1 autorizaciones operativas LIVE MVP

Tipo: backend MVP de autorizaciones operativas LIVE, con migracion aditiva y sin pagos/caja/precio/devoluciones/venta financiera.

Objetivo:

- Crear solicitudes persistentes de autorizacion operativa LIVE.
- Permitir solicitud, listado, aprobacion, rechazo, cancelacion y aplicacion controlada.
- Aplicar solo `UNDO_LIVE_OPERATIONAL_SALE` cuando no hay pago activo y el snapshot sigue consistente.

Cambios realizados:

- `V55__live_operational_authorizations_mvp.sql`: crea permisos y tabla `operational_authorization_requests`.
- `PermissionCode.java`: agrega permisos de autorizacion operativa y acciones sensibles.
- Nuevo paquete backend `operationauth`: entidad, repositorio, service, controller y DTOs.
- `LiveEventType`: agrega `LIVE_OPERATIONAL_SOLD_UNDONE`.
- `OperationalAuthorizationServiceTests`: cubre permisos, self-approval, rechazo y aplicacion segura.
- `docs/LIVE_AUTH_B1_OPERATIONAL_AUTHORIZATIONS_MVP.md`: documenta alcance, endpoints, permisos, rollback y QA.

Decision:

- `GO_TECNICO` si backend/frontend pasan validaciones.
- `PARTIAL_GO_BACKEND` porque la UI de cola/solicitud queda para fase posterior.
- `PENDING_QA_VISUAL` hasta validar con navegador/screenshots reales.
