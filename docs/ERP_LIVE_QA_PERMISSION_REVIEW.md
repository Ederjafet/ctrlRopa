# Revision QA de permisos para LIVE

Fecha: 2026-05-18

Rama: `feature/live-i-permisos-qa-error-control`

## Objetivo

Diagnosticar el mensaje `No tienes permisos para cargar clientes` visto en LIVE movil/web y dejar un control QA seguro sin debilitar seguridad ni ocultar errores `403`.

## Endpoints revisados

| Endpoint | Frontend | Backend | Permiso funcional directo detectado | Riesgo real de 403 |
|---|---|---|---|---|
| `GET /api/lives/branch/{branchId}` | `getLivesByBranch` | `LiveService.findByBranch` | No aplica en listado; crear/activar/cerrar exige `DO_LIVE_RESERVATION` | Bajo para listado; alto si branch/session no coincide en acciones. |
| `GET /api/customers/branch/{branchId}` | `getCustomersByBranch` | `CustomerService.findByBranch` | No hay `assertCan(VIEW_CUSTOMERS)` en el servicio actual | Alto por tenant/branch mismatch. |
| `GET /api/items/branch/{branchId}` | `getItemsByBranch` | `ItemService.findByBranch` | No hay `assertCan(VIEW_INVENTORY)` en el servicio actual | Alto por tenant/branch mismatch. |
| `GET /api/reservations/branch/{branchId}` | `getReservationsByBranch` | `ReservationService.findByBranch` | No hay `assertCan` en listado actual | Medio/alto por consumidores legacy y sesion tenant. |

## Permisos esperados para operar LIVE

Para que un usuario QA pueda operar LIVE de forma completa en esta etapa se recomienda:

- Canal `LIVE` habilitado en la sucursal.
- Permiso `DO_LIVE_RESERVATION`.
- Permiso `VIEW_CUSTOMERS` para coherencia de menu/UX.
- Permiso `VIEW_INVENTORY` para coherencia de menu/UX y seleccion de prendas.
- `user_companies` activo para la company de la sucursal.
- `user_branches` con la sucursal activa.
- Sesion nueva con `active_company_id` y `active_branch_id` correctos.

## Causa raiz probable

El mensaje visible `No tienes permisos para cargar clientes` se genera en frontend cuando `GET /api/customers/branch/{branchId}` devuelve `403`.

Por revision del backend, ese endpoint no valida `VIEW_CUSTOMERS` directamente en `CustomerService.findByBranch`. Por tanto, el 403 mas probable no es permiso funcional de clientes, sino una validacion tenant-aware:

- usuario sin `user_companies` activo,
- usuario sin `user_branches`,
- sesion anterior con `active_company_id` / `active_branch_id` inconsistente,
- `branch_id` de la sesion no pertenece a la company activa,
- sucursal o company inactiva.

Tambien puede fallar si el usuario QA no tiene permisos/canal `LIVE` y entra por una sesion o ruta desactualizada.

## Frontend LIVE

Estado revisado:

- LIVE ya no concatena errores secundarios en un modal duplicado.
- Clientes, prendas y reservaciones tienen mensajes por recurso.
- Un 403 real no se convierte en exito silencioso.
- Si falla el recurso principal de En vivo con 403, se muestra un solo mensaje claro.

## SQL QA correctivo

Se creo:

- `docs/qa/08-live-qa-permissions-fix.sql`

El script es solo QA, idempotente y:

- no crea migraciones Flyway,
- no trunca tablas,
- no borra datos historicos,
- no toca usuarios productivos,
- cubre usuarios QA de DEFAULT y Empresa A/B,
- asegura `user_companies`,
- asegura `user_branches`,
- asegura permisos minimos directos QA,
- habilita canal `LIVE` por sucursal,
- revoca sesiones activas de esos usuarios para forzar login tenant-aware limpio.

## Validaciones SQL recomendadas

Despues de ejecutar `docs/qa/08-live-qa-permissions-fix.sql`, validar:

```sql
SELECT u.email, b.code AS branch_code, c.code AS company_code
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
WHERE u.email LIKE 'qa.%@local.test';
```

```sql
SELECT u.email, s.active_company_id, s.active_branch_id, s.revoked_at, s.expires_at
FROM user_api_sessions s
JOIN users u ON u.id = s.user_id
WHERE u.email IN (
  'qa.admin@local.test',
  'qa.supervisor.centro@local.test',
  'qa.vendedor.centro@local.test',
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
)
ORDER BY s.id DESC;
```

## Validacion runtime recomendada

1. Ejecutar el SQL QA.
2. Cerrar sesion en movil/web.
3. Iniciar sesion nuevamente con el usuario QA afectado.
4. Abrir `/api/tenant/current` y confirmar company/branch esperados.
5. Abrir En vivo.
6. Abrir selector de cliente.
7. Abrir selector de prenda.
8. Revisar logs backend para identificar endpoint 403 si persiste.

## Validaciones tecnicas ejecutadas

- `npm run lint`: ejecutado sin errores; quedan warnings preexistentes fuera del alcance de esta fase.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- `.\\mvnw.cmd test`: no aplica porque no se modifico Java backend.

## Decision

Estado: `GO tecnico` para control QA y manejo frontend.

`GO runtime` queda pendiente de ejecutar SQL QA y validar en movil/web con el usuario exacto afectado.
