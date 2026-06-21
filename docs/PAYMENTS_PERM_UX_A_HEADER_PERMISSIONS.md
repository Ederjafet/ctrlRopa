# PAYMENTS-PERM-UX-A - Cabecera unificada de Pagos y diagnostico reusable

## Resumen ejecutivo

Se unifico la experiencia superior de `/payments` para evitar dos cabeceras con el mismo titulo. La pantalla ahora usa la cabecera del AppShell como unico encabezado de modulo y agrega un bloque compacto de capacidades de usuario sin repetir `Pagos`.

Tambien se creo una primera base reusable para diagnosticar permisos por pantalla.

## Problema detectado

La pantalla mostraba:

- Cabecera del layout: `PANEL OPERATIVO / Pagos / empresa y sucursal`.
- Tarjeta adicional: `FINANZAS / Pagos / descripcion / badges tecnicos`.

Esto duplicaba el titulo, mezclaba codigos tecnicos con copy de usuario final y no explicaba de forma uniforme que acciones estaban permitidas o bloqueadas.

## Cabecera unificada

`/payments` ahora usa:

- Eyebrow: `FINANZAS`.
- Titulo: `Pagos`.
- Contexto: empresa y sucursal de la sesion.
- Metadata: descripcion corta de pagos, abonos y saldo a favor.

La tarjeta secundaria ya no repite el titulo. El primer bloque de contenido es `Tu acceso en esta pantalla`.

## Matriz de permisos por pantalla

Se agrego `services/screenPermissions.ts` con la primera definicion:

Pantalla: `payments`

- `viewPayments`: `VIEW_PAYMENTS`.
- `registerPayment`: `REGISTER_PAYMENTS`.
- `applyCustomerBalance`: `APPLY_CUSTOMER_BALANCE`.
- `viewPaymentDetail`: `VIEW_PAYMENTS`.

Helpers creados:

- `getScreenPermissionSummary`.
- `canAccessScreen`.
- `canDoScreenAction`.
- `findScreenPermissionAction`.
- `getMissingPermissionMessage`.
- `canViewScreenPermissionDiagnostics`.

## Componentes creados

- `ScreenCapabilitySummary`: muestra capacidades en lenguaje de negocio y un diagnostico expandible si el perfil puede verlo.
- `PermissionBlockedHint`: muestra una explicacion compacta de acciones bloqueadas por permiso.

## Aplicacion en `/payments`

- La pantalla se sigue protegiendo con `VIEW_PAYMENTS`.
- `Registrar pago` queda bloqueado si falta `REGISTER_PAYMENTS`.
- `Cobrar` en pendientes queda bloqueado si falta `REGISTER_PAYMENTS`.
- `Aplicar saldo a favor` muestra permiso faltante si falta `APPLY_CUSTOMER_BALANCE`; si el permiso existe, sigue indicando que el flujo trazable queda para siguiente fase.
- El diagnostico tecnico se muestra colapsado y solo para perfiles admin/QA/platform owner o perfiles con administracion de usuarios/roles.

## Permisos y dinero

Esta fase no cambia backend. El backend ya conserva guards para endpoints financieros:

- Ver pagos requiere `VIEW_PAYMENTS`.
- Registrar pagos requiere `REGISTER_PAYMENTS`.
- Aplicar saldo a favor requiere `APPLY_CUSTOMER_BALANCE`.

La UI ahora refleja esos permisos de forma mas clara, pero no sustituye la proteccion backend.

## Backlog

- `PERM-UX-B`: aplicar diagnostico de permisos a paquete, apartado, envios, usuarios, roles y apariencia.
- Evaluar tooltip nativo en web si se quiere hover real; esta fase usa hint visible/alerta de `AppButton`.
- Integrar diagnostico con catalogo de permisos por rol cuando exista una vista QA mas formal.

## Validaciones esperadas

- `/payments` no muestra dos cabeceras con `Pagos`.
- El resumen de capacidades no muestra codigos tecnicos como vista principal.
- El diagnostico expandible muestra accion, estado y permiso requerido.
- Usuarios sin `REGISTER_PAYMENTS` no pueden registrar dinero desde UI.
- Usuarios sin `APPLY_CUSTOMER_BALANCE` ven la razon del bloqueo.
- `Actualizar` no aparece fuera de LIVE.
