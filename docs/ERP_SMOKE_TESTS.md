# ERP - Smoke tests

Fecha: 2026-05-12

## Prerrequisitos QA

- Dataset preparado segun `docs/ERP_QA_DATASET.md`.
- Usuarios por rol disponibles segun `docs/ERP_QA_USERS_ROLES.md`.
- Evidencia registrada con `docs/ERP_QA_EVIDENCE_TEMPLATE.md`.
- Resultado resumido en `docs/ERP_QA_EXECUTION_LOG.md`.

## Antes de release

Referencia de severidad: `docs/ERP_DEFECT_SEVERITY.md`.  
Referencia de evidencia: `docs/ERP_EVIDENCE_STANDARD.md`.

## Smoke tecnico

| ID | Prueba | Prioridad | Tiempo estimado | Dependencia | Evidencia requerida | Bloquea release |
|---|---|---:|---:|---|---|---|
| `SMK-TECH-01` | Backend responde `/api/health`. | CRITICA | 2 min | Backend/API | Screenshot o log de respuesta OK. | Si |
| `SMK-TECH-02` | Frontend abre sin pantalla roja. | CRITICA | 3 min | Web/mobile, API configurada | Screenshot home/login. | Si |
| `SMK-TECH-03` | Logs backend sin errores nuevos al arranque. | ALTA | 5 min | Backend logs | Extracto de logs. | Si si hay error 500/arranque |

## Smoke operacional

| ID | Prueba | Prioridad | Tiempo estimado | Dependencia | Evidencia requerida | Bloquea release |
|---|---|---:|---:|---|---|---|
| `SMK-LOGIN-01` | Login valido, logout, login invalido. | CRITICA | 5 min | Usuarios QA | Screenshots login exitoso/error amigable. | Si |
| `SMK-DASH-01` | Dashboard carga indicadores y detalle. | ALTA | 5 min | Usuario operativo, datos QA | Screenshot dashboard/detalle. | Si |
| `SMK-CUS-01` | Buscar cliente y abrir detalle. | ALTA | 5 min | Clientes QA | Screenshot listado/detalle. | Si |
| `SMK-INV-01` | Buscar prenda y abrir detalle. | ALTA | 5 min | Inventario QA | Screenshot prenda/estado. | Si |
| `SMK-BAT-01` | Abrir lote y validar estado/proveedor/calidad. | ALTA | 7 min | Lotes/proveedores QA | Screenshot lote/proveedor/calidad. | Si |
| `SMK-LIVE-01` | Abrir live, seleccionar live, validar faltantes. | ALTA | 8 min | Live y prendas QA | Screenshot live/validacion. | Si |
| `SMK-SALE-01` | Venta puerta con validaciones y venta de prueba controlada. | CRITICA | 10 min | Cliente, prenda, metodo pago | Captura antes/despues y total. | Si |
| `SMK-PAY-01` | Pago controlado y validacion de faltantes. | CRITICA | 10 min | Deuda QA, metodo pago | Captura pago/confirmacion. | Si |
| `SMK-PKG-01` | Abrir paquete y validar prendas. | ALTA | 7 min | Cliente con prenda pagada/reservada | Screenshot paquete/prendas. | Si |
| `SMK-SHP-01` | Abrir envio y validar paquetes/estado. | ALTA | 7 min | Paquete QA | Screenshot envio/estado. | Si |
| `SMK-REP-01` | Ejecutar reporte diario/historico. | MEDIA | 8 min | Operaciones QA | Screenshot reporte/filtros. | No, salvo error 500 o dato financiero incorrecto |

## Smoke visual

| ID | Prueba | Prioridad | Tiempo estimado | Dependencia | Evidencia requerida | Bloquea release |
|---|---|---:|---:|---|---|---|
| `SMK-UI-01` | Modales, alertas y botones principales son legibles en web. | ALTA | 5 min | Pantallas criticas | Screenshots. | Si si impide operar |
| `SMK-UI-02` | Mobile no tapa botones criticos ni muestra error tecnico crudo. | ALTA | 8 min | Dispositivo/emulador | Screenshots mobile. | Si si afecta flujo critico |

## Smoke seguridad

| ID | Prueba | Prioridad | Tiempo estimado | Dependencia | Evidencia requerida | Bloquea release |
|---|---|---:|---:|---|---|---|
| `SMK-SEC-01` | Usuario sin permiso recibe acceso denegado amigable. | CRITICA | 8 min | `qa.sinpermisos@local.test` | Screenshot 403 amigable/log si aplica. | Si |
| `SMK-SEC-02` | Usuario operativo no ve logs tecnicos. | ALTA | 5 min | Usuario operativo | Screenshot menu/ruta bloqueada. | Si si expone informacion tecnica |

## Post-release rapido

1. Validar `/api/health`.
2. Login con usuario operativo.
3. Dashboard.
4. Venta/reserva no destructiva o prueba controlada.
5. Pago solo si hay dato QA.
6. Reporte diario.
7. Revisar logs backend.
8. Registrar resultado y evidencia si el ambiente es QA/STAGING.

## Checklist operacional

- No hay pantalla roja en mobile/web.
- No hay `Error HTTP`, stack trace o URL tecnica visible.
- Botones criticos responden o explican faltante.
- Usuario sin permiso no ejecuta accion.
- Logs backend no muestran errores nuevos.
- No hay migraciones inesperadas.
- Los datos usados pertenecen al dataset QA o estan documentados como prueba controlada.
- Cada fallo critico tiene evidencia y decision de bloqueo/rollback.

## Validaciones criticas web/mobile

Web:

- Layout no tapa botones.
- Modales cierran correctamente.
- Listas largas son navegables.

Mobile:

- Botones principales caben en pantalla.
- Modales son legibles.
- Error 401/403 es amigable.
- API apunta al host correcto del ambiente.

