# AUTH-A - Sesion unica activa

Fecha: 2026-05-22  
Rama: `feature/auth-a-rbac-single-session`

## Objetivo

Mantener una sola sesion API activa por usuario para reducir sesiones zombie, uso compartido de credenciales y confusion multi-dispositivo.

## Tabla usada

Se usa la tabla existente `user_api_sessions`.

Columnas relevantes:

- `user_id`
- `token_hash`
- `expires_at`
- `absolute_expires_at`
- `revoked_at`
- `active_company_id`
- `active_branch_id`

No se creo migracion porque `revoked_at`, `active_company_id` y `active_branch_id` ya existen. No existe columna `revocation_reason`; la razon se documenta por comportamiento.

## Regla implementada

Cuando un usuario inicia sesion correctamente:

1. Se revocan sesiones activas anteriores del mismo usuario.
2. Se inserta la nueva sesion con company/branch activa.
3. Solo el ultimo token queda usable.

Sesion activa significa:

- `revoked_at IS NULL`
- `expires_at > CURRENT_TIMESTAMP`
- `absolute_expires_at IS NULL OR absolute_expires_at > CURRENT_TIMESTAMP`

## Request autenticado

`ApiTokenFilter` ya valida token no revocado. En AUTH-A el mensaje para token revocado queda diferenciado:

`Tu sesion se cerro porque iniciaste sesion en otro dispositivo.`

El filtro ahora valida explicitamente la fila de `user_api_sessions` del token:

- `revoked_at IS NULL`
- `expires_at > CURRENT_TIMESTAMP`
- `absolute_expires_at IS NULL OR absolute_expires_at > CURRENT_TIMESTAMP`
- usuario `ACTIVE`
- company/branch activa si existen en la sesion
- la sesion corresponde a la ultima sesion activa del usuario

Tambien se agregaron logs temporales de diagnostico:

- `sessionId`
- `userId`
- hash parcial del token
- `revoked_at`
- `expires_at`
- `absolute_expires_at`
- resultado de validacion

`CurrentUser` y `TenantResolver` repiten la regla de ultima sesion activa como defensa adicional si una ruta llega a resolver usuario/tenant.

## Ajuste frontend multi-dispositivo

Antes de ejecutar requests protegidos, `services/apiClient.ts` valida la sesion local contra `/api/me`.

Si `/api/me` devuelve una branch activa distinta a la guardada localmente, el cliente:

1. Actualiza `user_session` con company/branch/permisos actuales.
2. Reescribe rutas del tipo `/branch/{branchIdAnterior}` hacia `/branch/{branchIdActual}`.
3. Evita seguir consultando datos con branch vieja.

Cuando `services/apiClient.ts` recibe `401` en `/api/me` o en un request protegido:

1. Limpia `user_session`.
2. Guarda un aviso temporal de autenticacion.
3. Redirige a `/login`.
4. `app/login.tsx` consume el aviso y muestra:

`Tu sesión se cerró porque iniciaste sesión en otro equipo.`

Si la validacion previa de `/api/me` falla por red mientras existe una sesion local, el cliente usa el mismo flujo de cierre controlado para evitar mostrar `NetworkError` como mensaje final en pantallas protegidas. Las pantallas P0 `Items`, `Customers` y `Batches` ignoran errores marcados como redireccion de sesion para no duplicar avisos mientras `/login` muestra el mensaje principal.

Esto evita que el primer equipo siga navegando con token revocado y pantallas vacias.

## QA esperado

| Prueba | Resultado esperado |
|---|---|
| Login usuario A en equipo 1 | Sesion activa |
| Login usuario A en equipo 2 | Sesion equipo 1 queda revocada |
| Request equipo 1 con token viejo | 401 con mensaje de sesion cerrada |
| Frontend equipo 1 con token viejo | Limpia sesion, vuelve a `/login` y muestra aviso |
| Storage con branch vieja | `/api/me` corrige branch antes de pedir datos |
| Login usuario B | No afecta sesiones de usuario A |

## Rollback

Revertir la llamada a revocacion previa en `AuthService.createApiSession`. No hay rollback de base porque no hubo migracion.
