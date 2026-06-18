# ERP - Ejecucion QA 1G

Fecha de ejecucion: 2026-05-12 10:53 -06:00  
Fase: 1G - primera corrida QA real controlada  
Rama: `feature/fase1g-primera-corrida-qa-real`  
Commit: `61cb26c`  
Ambiente usado: QA local/API `http://localhost:8090`, web esperada `http://localhost:8081`  
Usuario principal: `qa.admin@local.test`

## Objetivo

Ejecutar la primera validacion operacional real del ERP usando el proceso QA definido, sin corregir bugs ni modificar comportamiento productivo.

## Prerequisitos verificados

| Prerequisito | Resultado | Observacion |
|---|---|---|
| Rama esperada | OK | `feature/fase1g-primera-corrida-qa-real` |
| Estado Git | WARNING | Existen artefactos no rastreados de fases previas. |
| Backend disponible | WARNING | Login/API funcionan, pero `/api/health` respondio 401. |
| Frontend web local | BLOCKED | `http://localhost:8081` no respondio desde esta sesion. |
| Dataset QA | PARCIAL | Usuarios operativos existen; usuarios `qa.sinpermisos`, `qa.reportes`, `qa.soporte` no validaron login. |
| SQL ejecutado | No aplica | No se ejecuto SQL en esta fase. |

## Smoke tests ejecutados

| Smoke | Flujo | Resultado | Severidad | Bloquea RC | Evidencia esperada | Detalle |
|---|---|---|---|---|---|---|
| `SMK-TECH-01` | Backend health | BLOCKED | `SEV-2` | Si | Log HTTP | `GET /api/health` respondio 401. Backend opera, pero health no sirve para monitoreo anonimo. |
| `SMK-TECH-02` | Frontend web | BLOCKED | `SEV-1` | Si | Screenshot/web response | `http://localhost:8081` no respondio. |
| `SMK-LOGIN-01` | Login/logout | OK |  | No | Log API | Login/logout OK con `qa.admin`, `qa.vendedor`, `qa.caja`, `qa.inventario`. |
| `SMK-DASH-01` | Dashboard | OK |  | No | Log API | `GET /api/dashboard/me` OK, branchId efectivo `4`. |
| `SMK-CUS-01` | Clientes | OK |  | No | Log API | `GET /api/customers/branch/4` OK. |
| `SMK-INV-01` | Inventario | OK |  | No | Log API | `GET /api/items/branch/4` OK. |
| `SMK-BAT-01` | Lotes | OK |  | No | Log API | `GET /api/batches/branch/4` OK. |
| `SMK-LIVE-01` | Live | OK parcial |  | No | Log API | `GET /api/lives/branch/4` OK; no se valido UX visual ni cierre live. |
| `SMK-SALE-01` | Ventas | OK |  | No | Log API | Venta QA registrada: `saleId=1`, item `QA-CTR-001`, cliente `QA Cliente Existente Centro Ana`, total `125.00`. |
| `SMK-PAY-01` | Pagos | OK |  | No | Log API | Pago QA registrado: `paymentId=1`, `saleId=1`, monto `125.00`. |
| `SMK-REP-01` | Reportes | OK |  | No | Log API | `GET /api/reports/daily-store?branchId=4&date=2026-05-12` OK. |
| `SMK-SEC-01` | Usuario sin permisos | BLOCKED | `SEV-2` | Si | Log API | `qa.sinpermisos@local.test` no pudo iniciar sesion: 403 credenciales invalidas/bloqueo. |
| `SMK-SEC-02` | Logs ocultos a operativo | BLOCKED | `SEV-2` | Si | Screenshot/log | No se pudo validar por falta de usuario sin permisos/soporte y frontend web. |

## Flujos minimos solicitados

| Flujo | Resultado | Errores encontrados | Severidad | Reproducibilidad | Impacto operacional | Bloqueo RC |
|---|---|---|---|---|---|---|
| Login/logout | OK | Ninguno para usuarios operativos base. |  | Reproducible | Permite operar. | No |
| Dashboard | OK | Sin error API. |  | Reproducible | Indicadores accesibles via API. | No |
| Navegacion principal | BLOCKED | Frontend web local no disponible. | `SEV-1` | Reproducible en esta sesion | No se puede evidenciar navegacion visual. | Si |
| Inventario | OK | Sin error API. |  | Reproducible | Inventario consultable. | No |
| Lotes | OK | Sin error API. |  | Reproducible | Lotes consultables. | No |
| Clientes | OK | Sin error API. |  | Reproducible | Clientes consultables. | No |
| Ventas | OK | Venta QA creada correctamente. |  | Reproducible con datos QA | Flujo transaccional funcional en API. | No |
| Pagos | OK | Pago QA creado correctamente. |  | Reproducible con venta QA | Flujo financiero funcional en API. | No |
| Reportes | OK | Reporte diario tienda responde. |  | Reproducible | Reporte principal consultable. | No |
| Usuarios/permisos | WARNING/BLOCKED | Admin/users/roles OK; usuarios sin permisos/reportes/soporte no validan login. | `SEV-2` | Reproducible | No se puede evidenciar seguridad negativa ni soporte. | Si |

## Issues detectados

| ID | Modulo | Severidad | Impacto | RC |
|---|---|---|---|---|
| `KI-002` | Backend/Health | `SEV-2` | Health check responde 401; monitoreo/release no puede validar salud anonima. | Bloquea hasta definir si `/api/health` debe ser publico o smoke debe autenticarse. |
| `KI-003` | Frontend/Web | `SEV-1` | Web local `8081` no disponible para navegacion visual. | Bloquea RC por falta de evidencia UI. |
| `KI-004` | Dataset QA/Permisos | `SEV-2` | `qa.sinpermisos@local.test` no puede iniciar sesion; no se valida acceso denegado. | Bloquea RC de seguridad. |
| `KI-005` | Dataset QA/Roles | `SEV-2` | `qa.reportes@local.test` y `qa.soporte@local.test` no pueden iniciar sesion. | Bloquea validacion completa de reportes/soporte. |

## Resumen QA final

Flujos OK:

- Login/logout operativo.
- Dashboard API.
- Clientes API.
- Inventario API.
- Lotes API.
- Live API lectura.
- Venta QA controlada.
- Pago QA controlado.
- Reporte diario tienda API.
- Usuarios/roles admin API.

Flujos WARNING:

- Live: solo lectura API; no se valido UX ni cierre.
- Usuarios/permisos: admin OK, perfiles negativos incompletos.

Flujos BLOCKED:

- Frontend web/navegacion principal.
- Health check publico.
- Usuario sin permisos.
- Usuarios reportes/soporte.

## Decision

Decision QA: `RC RECHAZADO`.

Motivo:

- Existe bloqueo `SEV-1` por frontend web no disponible para evidencia visual.
- Existen bloqueos `SEV-2` en health check y dataset de usuarios requeridos para seguridad/soporte.
- No hay evidencia visual suficiente para aprobar RC.

## Recomendacion posterior

Crear fase correctiva/preparatoria para:

1. Confirmar si `/api/health` debe ser publico o ajustar smoke autenticado.
2. Levantar y evidenciar frontend web/mobile en ambiente QA.
3. Ejecutar o corregir dataset de usuarios `qa.sinpermisos`, `qa.reportes`, `qa.soporte`.
4. Repetir `SMK-TECH`, `SMK-UI` y `SMK-SEC`.

No se corrigio ningun bug en esta fase.
