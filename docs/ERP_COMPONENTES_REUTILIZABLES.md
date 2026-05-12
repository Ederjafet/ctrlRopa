# ERP - Componentes reutilizables

## Componentes UI existentes

| Componente | Uso ERP recomendado |
|---|---|
| `AppScreen` | Layout base de pantalla con espaciado consistente. |
| `AppButton` | Boton primario/secundario/menu/danger. |
| `AppCard` | Contenedor para entidades o bloques operativos. |
| `AppBottomModal` | Confirmaciones, validaciones accionables, selectores compactos. |
| `AppNoticeDropdown` | Avisos de exito, advertencia o error no bloqueante. |
| `AppInput` | Captura textual/numerica. |
| `AppSelectorField` | Seleccion de catalogo o entidad. |
| `AppDateField` | Captura de fecha con modal. |
| `AppResponsiveGrid` | Listas de tarjetas adaptables. |
| `AppInfoCard` | Indicadores de dashboard. |

## Servicios reutilizables

- `services/apiClient.ts`: cliente HTTP con sesion y logs.
- `services/sessionStorage.ts`: sesion local.
- `services/routeGuard.ts`: validacion de ruta por permisos.
- `services/accessControl.ts`: evaluacion de permisos efectivos.
- `services/*Service.ts`: clientes por modulo.

## Brechas

- Falta componente estandar de "ValidationActionModal".
- Falta componente estandar de "EntitySearchModal".
- Falta componente estandar de "PaginatedHistorySection".
- Falta componente estandar de "PermissionDeniedNotice".
- Falta convencion para errores API 401/403/500.

