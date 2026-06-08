# PROJECT_BACKLOG_PRIORITIZED

## Criterio de priorizacion

El backlog se ordena por:

1. Bloqueos QA.
2. Riesgo operativo.
3. Seguridad.
4. Mantenibilidad.
5. Branding/UX.

No se debe cerrar un pendiente sin evidencia, validaciones y commit de fase.

## Backlog priorizado

| Prioridad | Bloque | Pendiente | Origen | Impacto | Severidad | Fase sugerida | Criterio de cierre | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | QA | Corrida QA manual real con evidencia | PRODUCT-D4 | Sin QA formal no hay release confiable | S1 | PRODUCT-D4 REAL | Casos ejecutados, evidencia adjunta, PASS/FAIL/BLOCKED documentado | PENDING_QA |
| P0 | LIVE | Autorizacion real de cambio de precio | LIVE-Z10A | Vendedor no puede solicitar aprobacion dentro del sistema | S1 | LIVE-Z10B | Backend + UI real de solicitud/aprobacion/auditoria o decision producto firmada | PENDING_DECISION |
| P0 | Inventario | Edicion/correccion de prendas capturadas | QA/operacion | Errores de captura quedan sin correccion clara | S1 | ITEM-Z1 | Editar campos permitidos con permisos, auditoria y QA | PENDING_DECISION |
| P1 | Error handling | Errores accionables en dominios restantes | PRODUCT-ERR-A | Mensajes genericos pueden seguir apareciendo fuera de pantallas criticas | S2 | PRODUCT-ERR-B | Mapper aplicado a dominios restantes y QA de errores | PENDING_QA |
| P1 | Seguridad | Limpieza de configuracion/secrets | Riesgo operativo | Posible exposicion o configuracion debil en despliegue | S1 | SEC-CONFIG-A | Inventario de env vars, secrets fuera de repo, docs de despliegue seguro | PENDING_DECISION |
| P1 | Seguridad | Hardening CORS/sesion/headers | AUTH/Security | Riesgo de sesion o acceso en ambientes reales | S1 | SECURITY-A | Revision config, pruebas negativas, evidencia | PENDING_DECISION |
| P1 | LIVE | Refactor de `app/live.tsx` | Mantenibilidad | Archivo grande eleva costo de cambios LIVE | S2 | LIVE-REF-A | Separar hooks/componentes sin cambiar comportamiento; pruebas pasan | PENDING_DECISION |
| P1 | I18N | Revision humana/nativa de traducciones | I18N-A/B/B.1 | Riesgo de copy poco natural en pt/fr/ja/zh/ko | S2 | PRODUCT-I18N-B-NATIVE | Revision por idioma y correcciones aprobadas | PENDING_QA |
| P2 | UX | Ergonomia diestro/zurdo, densidad y acciones | LIVE-Z9F.1/C2.x | Mobile/tablet puede requerir ajustes finos | S3 | PRODUCT-UX-A | Acciones configurables o layout validado por QA | PENDING_DECISION |
| P2 | Branding | Persistencia branding por tenant/backend | PRODUCT-C2.x | Branding actual es local por dispositivo | S2 | PRODUCT-C3 | Backend/tenant config, permisos y QA de persistencia | PENDING_DECISION |
| P2 | Branding | Pulido pendiente editor visual | PRODUCT-C2.6 | Si QA detecta saturacion o contraste bajo | S3 | PRODUCT-C2.7 | Ajuste visual puntual con evidencia | PENDING_QA |
| P2 | Navegacion | Legacy routes restantes no priorizadas | PRODUCT-D6.5/D6.6 | Pantallas menos usadas pueden verse legacy | S3 | PRODUCT-D6.7 | Auditar/migrar siguiente lote por dominio | PENDING_QA |
| P3 | Reportes | Validacion manual de reportes y permisos | PRODUCT-D/QA | Reportes requieren dataset real para QA | S3 | REPORT-QA-A | Casos con datos, permisos y evidencia | PENDING_QA |
| P3 | Operacion | Caja/pagos no tocados por LIVE-Z9/Z10 | Alcance excluido | Riesgo de deuda funcional futura | S2 | PAYMENTS-QA-A | Smoke de pagos/caja separado, sin mezclar con LIVE | PENDING_DECISION |

## Reglas de cierre de backlog

- `DONE_TECH`: implementado, validaciones tecnicas pasan, commit existe.
- `PENDING_QA`: falta ejecucion manual o evidencia.
- `QA_PASS`: solo con evidencia real y referencia en `docs/QA_RESULTS_LOG.md`.
- `QA_FAIL`: registrar severidad, evidencia y fase correctiva sugerida.
- `BLOCKED`: documentar bloqueo y quien debe desbloquear.
- `ACCEPTED_RISK`: permitido solo con decision explicita en docs.

## Pendientes que no deben mezclarse

- No mezclar LIVE-Z10B con pagos/caja.
- No mezclar PRODUCT-C3 con cambios visuales de /ui-kit.
- No mezclar LIVE-REF-A con cambios funcionales LIVE.
- No mezclar PRODUCT-D4 REAL con fixes; si QA falla, abrir fase correctiva puntual.
