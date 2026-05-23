# ERP LIVE - Rebalanceo operacional del layout

Fecha: 2026-05-21  
Fase: LIVE-W refinamiento adicional  
Alcance: frontend En vivo, sin backend, SQL, migraciones, pagos, ventas, reportes ni integraciones externas.

## Objetivo

Evitar que la consola En vivo deje huecos visuales cuando el usuario oculta widgets como spotlight, roles, analiticos, actividad o vista presentadora. La pantalla debe redistribuir el espacio hacia la operacion principal.

## Cambios aplicados

- `LiveDesktopLayout` acepta modo `compact` y elimina la columna izquierda cuando no hay widgets operativos visibles.
- `LiveTabletLayout` acepta modo `compact` y convierte la pantalla en una columna operativa amplia.
- `LiveMobileLayout` omite la columna vacia cuando el modo compacto esta activo.
- `app/live.tsx` calcula si existen widgets de columna izquierda y activa el layout compacto cuando no hay contenido util.

## Comportamiento esperado

- Desktop: la consola del operador gana prioridad visual y se balancea con reservas recientes.
- Tablet: el flujo operativo sube y evita sensacion de dashboard comprimido.
- Mobile: se reduce espacio muerto y se conserva stack tactil.

## Riesgos

- El modo compacto depende de las preferencias locales de widgets.
- La validacion final requiere smoke visual con widgets ocultos en mobile, tablet y desktop.

## Decision

GO tecnico condicionado a smoke visual real.
