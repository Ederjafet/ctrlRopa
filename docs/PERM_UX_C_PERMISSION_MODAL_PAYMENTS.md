# PERM-UX-C - Modal reusable de permisos iniciando en Pagos

## Objetivo

Mover el diagnostico de permisos de `/payments` fuera del cuerpo de la pantalla y llevarlo a una modal reusable. El resumen de capacidades de negocio permanece visible.

## Problema corregido

El diagnostico tecnico anterior era un panel expandible dentro del contenido. Aunque estaba controlado por bandera y perfil, ocupaba espacio en una pantalla financiera que debe mantenerse compacta.

## Solucion aplicada

Se agrego:

- `components/ui/ScreenPermissionModal.tsx`

Se ajusto:

- `components/ui/ScreenCapabilitySummary.tsx`
- `app/payments.tsx`

El resumen visible conserva:

- Ver pagos.
- Registrar abonos.
- Aplicar saldo a favor.
- Ver detalle de pago.

El boton compacto `Ver permisos` abre la modal solo cuando `canViewScreenPermissionDiagnostics()` lo permite.

## Comportamiento en `/payments`

- El resumen simple sigue visible para quien accede a la pantalla.
- Ya no hay panel tecnico expandible en el cuerpo.
- El boton `Ver permisos` aparece solo si:
  - `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS` esta activo.
  - El perfil es Platform Owner, Admin, Tenant Admin, QA o tiene permisos administrativos permitidos.
- La modal muestra capacidades de negocio.
- La seccion `Diagnostico tecnico` dentro de la modal muestra codigos como `VIEW_PAYMENTS`, `REGISTER_PAYMENTS` y `APPLY_CUSTOMER_BALANCE` solo si el guard lo permite.

## Reuso futuro

Para usar la modal en otra pantalla:

1. Definir la pantalla en `services/screenPermissions.ts`.
2. Calcular `getScreenPermissionSummary(screenKey, session, language)`.
3. Renderizar `ScreenCapabilitySummary` con `showPermissionButton` y `onOpenPermissions`.
4. Renderizar `ScreenPermissionModal` con `screenTitle`, `evaluations` y `showTechnicalDetails`.

## Seguridad

No se toco backend. Los guards financieros siguen igual:

- `VIEW_PAYMENTS` para entrar/ver.
- `REGISTER_PAYMENTS` para registrar pagos.
- `APPLY_CUSTOMER_BALANCE` para aplicar saldo a favor.

Los hints de permisos faltantes siguen activos aunque la bandera tecnica este apagada.

## Backlog

- `PERM-UX-D`: replicar modal de permisos en paquete, apartado, envios, usuarios, roles, apariencia y Panel Owner.
- Evaluar si la modal debe incluir links administrativos para solicitar permisos en una fase futura.
