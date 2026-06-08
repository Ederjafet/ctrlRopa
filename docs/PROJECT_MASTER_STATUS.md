# PROJECT_MASTER_STATUS

## Resumen ejecutivo

Este tablero centraliza el estado tecnico, QA y pendientes del proyecto Control Ropa.

El corte actual consolida fases cerradas de AUTH, LIVE, PRODUCT-C, PRODUCT-D, I18N, PRODUCT-ERR y PRODUCT-C2.x. La mayor parte del trabajo reciente esta tecnicamente cerrada con commits, reportes QA tecnicos y artefactos de diff. La validacion visual/manual de QA sigue siendo el principal pendiente transversal: ningun caso debe marcarse como `QA_PASS` sin evidencia verificable.

## Ultima rama integrada a develop

| Rama | Merge commit | Fase | Observacion |
| --- | --- | --- | --- |
| `feature/sec-config-a1-dev-startup-script` | `fdce443` | SEC-CONFIG-A1 | Se agrego arranque DEV seguro con `.env` local no versionado. |

## Ultimas fases cerradas

| Fase | Commit | Estado tecnico | Estado QA |
| --- | --- | --- | --- |
| PROJECT-GOV-B1 | commit PROJECT-GOV-B1 | DONE_TECH | PENDING_QA |
| SEC-CONFIG-A1 | `5fe5c38` | DONE_TECH | PENDING_QA |
| SEC-CONFIG-A | commit PROJECT-GOV-B | DONE_TECH | PENDING_QA |
| LIVE-Z10A | `61b7ba8` | DONE_TECH | PENDING_QA |
| LIVE-Z9J | `f92aa24` | DONE_TECH | PENDING_QA |
| PRODUCT-ERR-A | `d97668b` | DONE_TECH | PENDING_QA |
| LIVE-Z9I.1 | `6a4b26c` | DONE_TECH | PENDING_QA |
| LIVE-Z9I | `d258e20` | DONE_TECH | PENDING_QA |
| PRODUCT-C2.6 | `39b35fd` | DONE_TECH | PENDING_QA |
| PRODUCT-C2.5 | `c11f630` | DONE_TECH | PENDING_QA |
| PRODUCT-C2.4 | `1ad2d3e` | DONE_TECH | PENDING_QA |
| PRODUCT-C2.3 | `31260a7` | DONE_TECH | PENDING_QA |

## Estado por bloque

| Bloque | Estado tecnico | Estado QA | Comentario |
| --- | --- | --- | --- |
| AUTH | DONE_TECH | QA_PASS | Hay smokes y reportes AUTH con resultados automatizados; mantener QA manual de roles y regresion. |
| LIVE | DONE_TECH | PENDING_QA | LIVE-Z0 a LIVE-Z10A estan documentados; falta corrida manual multiusuario/multidispositivo completa. |
| PRODUCT-C / Diseno | DONE_TECH | PENDING_QA | Sistema visual, UI Kit y editor de marca cerrados tecnicamente; falta validacion visual formal. |
| PRODUCT-D / QA visual | DONE_TECH | PENDING_QA | Navegacion/AppShell migrados; PRODUCT-D4 mantiene evidencia manual pendiente. |
| I18N | DONE_TECH | PENDING_QA | Soporte multidioma base y limpieza de claves; falta revision humana/nativa. |
| ERROR HANDLING | DONE_TECH | PENDING_QA | PRODUCT-ERR-A aplicado en pantallas criticas; quedan dominios restantes. |
| Seguridad | DONE_TECH | PENDING_QA | AUTH y auditoria tienen evidencia tecnica; SEC-CONFIG-A externaliza secrets/config y SEC-CONFIG-A1 agrega arranque DEV seguro; queda hardening y validacion por ambiente. |
| Refactor | PENDING_DECISION | PENDING_QA | `app/live.tsx` requiere particion por mantenibilidad. |
| Gobierno | DONE_TECH | PENDING_QA | PROJECT-GOV-B1 agrega compuerta de aprobacion arquitectonica para backlog autonomo sensible. |

## Tabla de fases

| Fase | Objetivo | Rama | Commit | Estado tecnico | Estado QA | Pendiente |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-F a AUTH-Z | RBAC, tenant isolation, single session y auditoria | varias | varios | DONE_TECH | QA_PASS | Repetir smoke en QA remoto y completar datos opcionales. |
| LIVE-Z0 a LIVE-Z5 | Base operativa LIVE y actor operador | varias | varios | DONE_TECH | PENDING_QA | Retestar flujo completo en QA actual. |
| LIVE-Z6 | Reglas operativas y AppShell | `feature/live-z6-*` | varios | DONE_TECH | PENDING_QA | Validar AppShell, permisos y no regresion de captura. |
| LIVE-Z7/Z8 | Precio/autorizacion preliminar | varias | varios | ACCEPTED_RISK | PENDING_QA | Reemplazado por decision LIVE-Z10A; backend real queda pendiente. |
| LIVE-Z9A-Z9F.1 | Claridad operativa, dialogos y paneles accionables | varias | varios | DONE_TECH | PENDING_QA | Validacion visual LIVE de mensajes y paneles. |
| LIVE-Z9G | Capacidades reales del vendedor | `feature/live-z9g-seller-capabilities` | no listado en log reciente | DONE_TECH | PENDING_QA | Confirmar vendedor con `DO_LIVE_RESERVATION`. |
| LIVE-Z9H | Refresh vendedor/supervisor | `feature/live-z9h-view-refresh` | no listado en log reciente | DONE_TECH | PENDING_QA | Confirmar polling, foco y ultima actualizacion. |
| LIVE-Z9I | Filtros disponibilidad selector prendas | `feature/live-z9i-item-selector-availability-filters` | `d258e20` | DONE_TECH | PENDING_QA | Validar disponibles/apartadas/vendidas. |
| LIVE-Z9I.1 | Layout responsive acciones tarjetas LIVE | `feature/live-z9i-1-card-action-layout` | `6a4b26c` | DONE_TECH | PENDING_QA | Validar desktop/tablet/mobile. |
| LIVE-Z9J | Sincronizacion apartados operador/admin | `feature/live-z9j-operator-reservation-sync` | `f92aa24` | DONE_TECH | PENDING_QA | Vendedor crea apartado y operador lo ve sin salir. |
| LIVE-Z10A | Auditoria autorizacion precio LIVE | `feature/live-z10a-price-authorization-audit` | `61b7ba8` | DONE_TECH | PENDING_QA | Validar que no hay solicitud pendiente simulada. |
| PRODUCT-C/C1 | Sistema visual premium global | varias | varios | DONE_TECH | PENDING_QA | Validar light/dark/presets en rutas principales. |
| PRODUCT-C2.1-C2.6 | Editor visual, paletas, contraste y marca | varias | `31c3a4f` a `39b35fd` | DONE_TECH | PENDING_QA | Validar /ui-kit y /appearance con mobile/tablet. |
| PRODUCT-D5/D6.x | Navegacion, AppShell, legacy routes e i18n visible | varias | varios | DONE_TECH | PENDING_QA | Confirmar ausencia de layouts legacy en rutas priorizadas. |
| PRODUCT-I18N-A/B/B.1 | Multidioma, limpieza de mezclas y glosario | varias | `cb89fa0` y relacionados | DONE_TECH | PENDING_QA | Revision humana/nativa y no claves crudas. |
| PRODUCT-ERR-A | Errores accionables | `feature/product-err-a-actionable-errors` | `d97668b` | DONE_TECH | PENDING_QA | Simular error red/backend y validar mensajes. |
| PRODUCT-D4 | QA manual con evidencia | `feature/product-d4-*` | varios | DONE_TECH | PENDING_QA | Ejecutar corrida real con screenshots/evidencia. |
| PROJECT-GOV-B1 | Compuerta arquitectura para backlog autonomo | `feature/project-gov-b1-architectural-approval-gate` | commit PROJECT-GOV-B1 | DONE_TECH | PENDING_QA | Revisar que Codex detenga bloques sensibles y entregue handoff antes de ejecutar. |
| SEC-CONFIG-A | Configuracion/secrets fuera de repo | `feature/project-gov-b-autonomous-backlog-runner` | commit PROJECT-GOV-B | DONE_TECH | PENDING_QA | Validar arranque local/QA con `CONTROL_ROPA_DB_PASSWORD` fuera del repo. |
| SEC-CONFIG-A1 | Script local seguro de arranque DEV | `feature/sec-config-a1-dev-startup-script` | `5fe5c38` | DONE_TECH | PENDING_QA | DEV_VALIDATED: backend 8090, `/api/me` 401 esperado, `.env` no versionado; falta QA formal. |

## GO/NO-GO general

| Area | Resultado |
| --- | --- |
| Desarrollo tecnico reciente | GO |
| Backlog autonomo de bajo riesgo | GO condicionado a alcance documental/visual/no sensible |
| Backlog autonomo sensible | NO-GO sin aprobacion arquitectonica |
| Merge automatico a develop desde este tablero | NO-GO |
| Release funcional amplio | NO-GO hasta QA manual |
| Demo controlada con riesgos conocidos | GO condicionado |
| Internacionalizacion comercial | NO-GO hasta revision nativa |

## Proximas 5 prioridades

1. PRODUCT-D4 REAL: corrida QA manual con evidencia.
2. LIVE-Z10B: backend real para autorizacion de cambio de precio, o decision de producto formal.
3. ITEM-Z1: edicion/correccion segura de prendas capturadas.
4. PRODUCT-ERR-B: extender errores accionables a dominios restantes.
5. SECURITY-A: hardening CORS/sesion/headers por ambiente.

## Riesgos abiertos

| Riesgo | Impacto | Estado |
| --- | --- | --- |
| QA manual insuficiente | Regresiones visuales o de permisos no detectadas | PENDING_QA |
| Autorizacion de precio sin backend | Usuarios esperan un flujo no disponible | ACCEPTED_RISK |
| `app/live.tsx` muy grande | Mantenibilidad y riesgo de regresion | PENDING_DECISION |
| Traducciones no nativas | Experiencia internacional inconsistente | PENDING_QA |
| Branding solo local | No sirve aun para tenant/backend productivo | PENDING_DECISION |
| Configuracion por ambiente | QA/staging deben definir env vars requeridas; DEV ya cuenta con scripts seguros para cargar `.env` local | PENDING_QA |
| Autonomia sin compuerta | Mitigado tecnicamente por PROJECT-GOV-B1; pendiente revision de proceso | PENDING_QA |

## Ultima actualizacion

2026-06-08, `feature/project-gov-b1-architectural-approval-gate`.
