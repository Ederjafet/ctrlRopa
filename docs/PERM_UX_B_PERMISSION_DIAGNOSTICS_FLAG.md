# PERM-UX-B - Control global para diagnostico tecnico de permisos

## Objetivo

Agregar una bandera centralizada para activar o desactivar el diagnostico tecnico de permisos sin retirar el resumen de capacidades de negocio.

## Bandera

Archivo:

- `constants/permissionDiagnostics.ts`

Variable publica Expo:

- `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS`

Valores activos:

- `1`
- `true`
- `yes`
- `on`
- `enabled`

Valores inactivos:

- `0`
- `false`
- `no`
- `off`
- `disabled`

## Comportamiento por defecto

- Si la variable no existe, el diagnostico tecnico queda activo cuando `NODE_ENV !== 'production'`.
- Si la variable no existe y `NODE_ENV === 'production'`, queda desactivado.
- En QA/dev puede activarse de forma explicita con `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS=true`.
- En produccion queda apagado por defecto.

## Alcance UX

El resumen de capacidades sigue visible para el usuario final:

- Puede ver pagos.
- Puede registrar abonos.
- No puede aplicar saldo a favor.

El diagnostico tecnico expandible solo aparece cuando:

1. La bandera global esta activa.
2. El perfil es Platform Owner, Admin, Tenant Admin, QA o tiene permisos administrativos de usuarios/roles.

Vendedor/caja no deben ver codigos tecnicos aunque la bandera este activa.

## Mensajes bloqueados

`PermissionBlockedHint` y los `disabledReason` de botones siguen funcionando siempre. La bandera solo controla el panel tecnico expandible, no los mensajes de permisos faltantes.

## Pantallas afectadas

Primera aplicacion:

- `/payments`

Backlog:

- Paquete.
- Apartado.
- Envios.
- Usuarios.
- Roles.
- Apariencia.
