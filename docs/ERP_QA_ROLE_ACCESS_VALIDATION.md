# ERP QA - Validacion de acceso por rol

Fecha: 2026-05-21  
Fase: LIVE-X

## Usuarios objetivo

| Usuario | Rol esperado | Company/branch |
|---|---|---|
| `qa.a.admin@local.test` | `QA_TENANT_ADMIN` | `QA_A` / `QA_A_CTR` |
| `qa.a.vendedor@local.test` | `QA_TENANT_SELLER` | `QA_A` / `QA_A_CTR` |
| `qa.b.admin@local.test` | `QA_TENANT_ADMIN` | `QA_B` / `QA_B_CTR` |
| `qa.b.vendedor@local.test` | `QA_TENANT_SELLER` | `QA_B` / `QA_B_CTR` |
| `qa.sinpermisos@local.test` | Sin accesos operativos | DEFAULT/QA segun dataset |

## Checklist runtime pendiente

- Login con `qa.a.admin@local.test`.
- Validar `/api/tenant/current` con `QA_A`.
- Abrir En vivo y confirmar consola completa segun permisos.
- Login con `qa.a.vendedor@local.test`.
- Confirmar que no ve administracion si no tiene permisos.
- Confirmar que analiticos se ocultan si no tiene permiso de supervision.
- Login con `qa.sinpermisos@local.test`.
- Confirmar que En vivo, Sistema y Usuarios redirigen a `access-denied`.
- Repetir en `QA_B` y confirmar que no se ve informacion `QA_A`.

## Evidencia requerida

- Captura desktop.
- Captura tablet.
- Captura mobile.
- JSON o captura de permisos efectivos del usuario.
- Resultado GO/NO-GO por usuario.

## Decision actual

GO tecnico frontend. GO seguridad runtime pendiente por validacion manual y por hardening backend futuro.
