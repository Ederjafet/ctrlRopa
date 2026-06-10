# LIVE-AUTH-B3 - QA autorizaciones operativas LIVE

Fecha: 2026-06-10
Rama: `feature/live-auth-b3-operational-auth-qa`

## Resumen ejecutivo

LIVE-AUTH-B3 valida por API real el flujo MVP de autorizaciones operativas LIVE entregado en B1/B1A y expuesto en UI por B2.

Resultado:

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`

No se marca `QA_PASS` porque no hubo navegador real ni screenshots.

## Alcance

Incluido:

- health backend;
- frontend web local y LAN disponible por HTTP;
- login de usuarios QA sin imprimir password ni token;
- permisos efectivos de autorizaciones por rol;
- lectura de cola y solicitudes propias;
- bloqueo de aprobacion por vendedor;
- bloqueo de usuario sin permisos;
- mutacion controlada sobre dataset desechable para `UNDO_LIVE_OPERATIONAL_SALE`;
- aprobacion y aplicacion real de autorizacion aprobada.

Excluido:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- venta financiera;
- cambios de RBAC/permisos;
- migraciones;
- endpoints nuevos.

## Usuarios y roles

| Usuario | Resultado | Rol | Permisos de autorizacion observados |
|---|---|---|---|
| `qa.admin@local.test` | Login OK | `ADMIN` | `REQUEST`, `VIEW`, `APPROVE`, `APPLY`, permisos finos sensibles |
| `qa.supervisor.centro@local.test` | Login OK | `SUPERVISOR` | `REQUEST`, `VIEW`, `APPROVE`, `APPLY`, permisos finos sensibles |
| `qa.vendedor.centro@local.test` | Login OK | `SELLER` | `REQUEST_LIVE_OPERATION_AUTHORIZATION`, `UNDO_LIVE_OPERATIONAL_SALE`; sin `APPROVE` ni `APPLY` |
| `qa.sinpermisos@local.test` | Login bloqueado | N/A | Sin permisos |

La password QA se obtuvo de documentacion/local env y no se imprimio.

## Endpoints probados

| Endpoint | Rol | Resultado |
|---|---|---|
| `GET /api/health` | sin token | `200` |
| `GET /api/me` | sin token | `401` |
| `GET /api/operational-authorizations/branch/4` | admin | `200` |
| `GET /api/operational-authorizations/pending/branch/4` | admin | `200` |
| `GET /api/operational-authorizations/pending/branch/4` | supervisor | `200` |
| `GET /api/operational-authorizations/mine/branch/4` | vendedor | `200` |
| `GET /api/operational-authorizations/branch/4` | sin permisos | bloqueado por login `403`; sin token operativo |
| `PATCH /api/operational-authorizations/999999/approve` | vendedor | `403` |
| `POST /api/operational-authorizations` | vendedor | `200` |
| `PATCH /api/operational-authorizations/1/approve` | vendedor | `403` |
| `PATCH /api/operational-authorizations/1/approve` | admin | `200` |
| `POST /api/operational-authorizations/1/apply` | admin | `200`, status `APPLIED` |

## Dataset usado

Se reutilizo dataset desechable documentado en LIVE-QA-C:

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- Branch: `4`
- LIVE: `15`
- Reserva: `45`
- Operacion: `UNDO_LIVE_OPERATIONAL_SALE`

La reserva `45` estaba documentada como `OPERATIONAL_SOLD`, sin venta/pago/caja asociados en la evidencia de LIVE-QA-C.

## Smoke API mutante

Flujo ejecutado:

1. Seller crea solicitud para deshacer vendido operativo sobre reserva desechable `45`.
2. Seller intenta aprobar la solicitud creada.
3. Backend responde `403`.
4. Admin aprueba la solicitud.
5. Admin aplica la solicitud aprobada.
6. Backend responde `200` y deja la solicitud en `APPLIED`.

Solicitud creada:

- `operational_authorization_requests.id = 1`
- Estado final: `APPLIED`

## Resultados por escenario

| Escenario | Resultado |
|---|---|
| Seller puede crear solicitud si tiene `REQUEST_LIVE_OPERATION_AUTHORIZATION` | PASS |
| Seller no puede aprobar | PASS |
| Admin/supervisor puede ver solicitudes | PASS |
| Admin puede aprobar | PASS |
| Usuario sin permisos no puede operar | PASS |
| Apply real solo para `UNDO_LIVE_OPERATIONAL_SALE` | PASS en API sobre dataset desechable |
| Operaciones no implementadas muestran mensaje claro | Cubierto por UI B2; sin navegador real en B3 |
| Estados visibles | Cubierto por UI B2; API confirma `APPLIED` |

## QA visual

No se ejecuto QA visual real.

Motivo:

- No hubo herramienta de navegador/screenshot real disponible en esta sesion.
- Se verifico que el frontend responde por HTTP en:
  - `http://localhost:8081`
  - `http://192.168.0.128:8081`

Estado visual: `PENDING_QA_VISUAL`.

## Fixes aplicados

No se aplicaron fixes.

No se detecto evidencia suficiente de bug menor de UI/microcopy que justificara tocar frontend en esta fase.

## GO / NO-GO

Resultado:

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`

No hay `NO_GO` de permisos/flujo en el smoke API ejecutado.

## Pendientes

1. QA visual real con screenshots de `/operational-authorizations` por rol.
2. Validar en navegador que seller no vea acciones de aprobacion/aplicacion.
3. Validar microcopy de estados `REQUESTED`, `APPROVED`, `REJECTED`, `APPLIED`, `EXPIRED`, `CANCELLED`.
4. Crear UI contextual futura desde LIVE/reservas para solicitudes prellenadas.
5. Mantener operaciones no implementadas como pendientes hasta contrato funcional.
