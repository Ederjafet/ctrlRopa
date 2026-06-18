# AUTH-A - Plan QA de autorizacion y sesiones

Fecha: 2026-05-22  
Rama: `feature/auth-a-rbac-single-session`

## Usuarios a validar

| Usuario | Esperado |
|---|---|
| `qa.a.admin@local.test` | Entra en `QA_A / QA_A_CTR`, permisos admin tenant |
| `qa.a.vendedor@local.test` | Entra en `QA_A / QA_A_CTR`, permisos operativos limitados |
| `qa.b.admin@local.test` | Entra en `QA_B / QA_B_CTR`, permisos admin tenant |
| `qa.b.vendedor@local.test` | Entra en `QA_B / QA_B_CTR`, permisos operativos limitados |
| `qa.sinpermisos@local.test` | No debe iniciar sesion |

## Pruebas funcionales

1. Login con `qa.sinpermisos@local.test`.
2. Confirmar rechazo antes de crear sesion.
3. Login con `qa.a.admin@local.test`.
4. Confirmar menu con Sistema/Usuarios segun permisos.
5. Login con `qa.a.vendedor@local.test`.
6. Confirmar menu reducido.
7. Validar acceso directo a `/customers`, `/items`, `/batches`, `/live`, `/system`, `/users`.
8. Validar que QA_A no visualiza datos QA_B en endpoints ya tenant-aware.
9. Login del mismo usuario en dos dispositivos.
10. Confirmar que el primer dispositivo recibe rechazo por sesion revocada.

## Queries sugeridas

```sql
SELECT u.email, r.code AS role_code
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email LIKE 'qa.%@local.test';

SELECT u.email, COUNT(DISTINCT p.id) AS effective_permissions
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN role_permissions rp ON rp.role_id = ur.role_id
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE u.email LIKE 'qa.%@local.test'
GROUP BY u.email;

SELECT u.email, s.active_company_id, s.active_branch_id, s.revoked_at, s.expires_at
FROM user_api_sessions s
JOIN users u ON u.id = s.user_id
WHERE u.email LIKE 'qa.%@local.test'
ORDER BY s.id DESC;
```

## Decision

AUTH-A queda en `GO tecnico` si:

- Maven pasa.
- TypeScript/export frontend pasan.
- `qa.sinpermisos` no crea sesion.
- Sesion unica revoca tokens previos.
- Rutas directas P0 quedan bloqueadas por frontend y backend mantiene validacion token/tenant.
