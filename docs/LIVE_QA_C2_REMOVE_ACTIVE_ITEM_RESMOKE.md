# LIVE-QA-C2 / Re-smoke focalizado REMOVE_LIVE_ACTIVE_ITEM

Fecha: 2026-06-10
Rama: feature/live-qa-c2-remove-active-item-resmoke

## Alcance

Validacion focalizada del fix de LIVE-PERM-FIX-A1 para confirmar que retirar la prenda al aire exige estrictamente `REMOVE_LIVE_ACTIVE_ITEM` en backend.

Esta fase no implementa logica nueva y no modifica backend funcional, frontend funcional, RBAC, permisos, endpoints ni migraciones.

## Historial confirmado

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `88e55ed LIVE-PERM-FIX-A0 documenta autorizacion retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Ambiente usado

- Backend: `http://localhost:8090`
- `/api/health`: 200
- `/api/me` sin token: 401
- Frontend local: `http://localhost:8081` respondio 200
- Frontend LAN: `http://192.168.0.128:8081` respondio 200

No se ejecuto smoke visual con navegador real ni screenshots. Resultado visual: `PENDING_QA_VISUAL`.

## Dataset usado

Dataset desechable reutilizado desde LIVE-QA-C:

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE: `15`
- Cliente: `32`
- Item A: `105`
- Item B: `106`
- Reserva A: `44`
- Reserva B: `45`

Estado observado antes del smoke focalizado:

- `GET /api/lives/15`: 200
- Estado LIVE: `ACTIVE`
- Prenda al aire inicial: item `106`

## Usuarios probados

Se usaron usuarios QA documentados. Las credenciales y tokens se mantuvieron solo en variables temporales y no se documentan.

| Usuario | Login | `/api/me` | Permiso relevante |
| --- | --- | --- | --- |
| `qa.admin@local.test` | 200 | 200 | `REMOVE_LIVE_ACTIVE_ITEM=true` |
| `qa.supervisor.centro@local.test` | 200 | 200 | `REMOVE_LIVE_ACTIVE_ITEM=true` |
| `qa.vendedor.centro@local.test` | 200 | 200 | `REMOVE_LIVE_ACTIVE_ITEM=false` |
| `qa.sinpermisos@local.test` | 403 | 401 sin token valido | Sin acceso operativo LIVE confirmado por bloqueo de login |

El vendedor conserva permisos LIVE no equivalentes a retirar prenda:

- `DO_LIVE_RESERVATION=true`
- `CHANGE_LIVE_ACTIVE_ITEM=true`
- `REMOVE_LIVE_ACTIVE_ITEM=false`

## Smoke API focalizado

### Caso negativo principal

Usuario: `qa.vendedor.centro@local.test`

Operacion:

```http
PATCH /api/lives/15/active-item
Content-Type: application/json

{ "itemId": null }
```

Resultado:

- Status: 403
- Resultado: `EXPECTED_403`

Conclusion: el hallazgo de LIVE-QA-C no se reproduce. `DO_LIVE_RESERVATION` y `CHANGE_LIVE_ACTIVE_ITEM` ya no habilitan retirar la prenda al aire.

### Caso positivo

Usuario: `qa.admin@local.test`

Operacion:

```http
PATCH /api/lives/15/active-item
Content-Type: application/json

{ "itemId": null }
```

Resultado:

- Status: 200
- Resultado: `EXPECTED_ALLOWED`

Mutacion realizada sobre dataset desechable: se retiro la prenda activa `106` del LIVE `15`.

## Validaciones relacionadas

- `GET /api/lives/15` antes del smoke confirmo LIVE activo y prenda al aire.
- La auditoria de codigo confirmo que `LiveService.assertCanRemoveLiveActiveItem(...)` exige `PermissionCode.REMOVE_LIVE_ACTIVE_ITEM`.
- No se ejecuto flujo de pagos, caja, precio LIVE, devoluciones, autorizaciones complejas ni venta financiera.

## Resultado

Resultado API: `GO_TECNICO_API`

Resultado visual: `PENDING_QA_VISUAL`

GO/NO-GO: `GO_TECNICO_API`

## Pendientes

- Ejecutar QA visual real con navegador/screenshot si se requiere evidencia UI.
- Continuar con la siguiente fase funcional sobre LIVE solo despues de merge manual de esta rama.
