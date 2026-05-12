# ERP - Guia UI/UX

## Estado actual

Componentes base reales:

- `components/ui/AppButton.tsx`
- `components/ui/AppBottomModal.tsx`
- `components/ui/AppCard.tsx`
- `components/ui/AppDateField.tsx`
- `components/ui/AppInfoCard.tsx`
- `components/ui/AppInput.tsx`
- `components/ui/AppNoticeDropdown.tsx`
- `components/ui/AppOptionRow.tsx`
- `components/ui/AppResponsiveGrid.tsx`
- `components/ui/AppScreen.tsx`
- `components/ui/AppSelectorField.tsx`
- `components/ui/AppText.tsx`

## Problemas detectados

- Alertas mezcladas: `Alert.alert` nativo, `AppBottomModal`, `AppNoticeDropdown`.
- Mensajes tecnicos llegan al usuario cuando hay 403 o errores API.
- Textos con acentos rotos aparecen en archivos fuente.
- Algunas pantallas tienen botones largos de ancho completo sin jerarquia clara.
- Secciones operativas largas como `app/live.tsx` pueden crecer sin paginacion o separacion.

## Estandar propuesto

- Confirmacion destructiva: `AppBottomModal`.
- Validacion accionable: modal con lista de faltantes y botones directos.
- Exito/no bloqueante: `AppNoticeDropdown` desplegable.
- Error tecnico: traducido por `apiClient.ts` a mensaje operativo.
- Acceso denegado: pantalla/alerta amigable, nunca pantalla roja.
- Botones: primario para accion principal, secundario para navegacion, danger para cancelar.

## Estándar mínimo Fase 1A

Usar `AppBottomModal` cuando:

- La acción sea destructiva o irreversible para el usuario: cancelar, cerrar, anular, conciliar, procesar.
- La validación requiera que el usuario escoja una acción directa para corregir: seleccionar cliente, seleccionar prenda, elegir método de pago, capturar precio.
- El usuario debe confirmar antes de continuar.

Usar `AppNoticeDropdown` cuando:

- El resultado no bloquee el trabajo: guardado correcto, reserva creada, paquete actualizado.
- Se quiera dejar visible un aviso plegable que el usuario puede cerrar.
- La información sea contextual y no requiera decisión inmediata.

Usar alerta bloqueante (`Alert.alert`) solo cuando:

- Sea una validación puntual y segura que no amerita flujo completo todavía.
- Sea un error de carga inicial que impide usar la pantalla.
- Sea una confirmación temporal en pantallas que todavía no fueron homologadas.

Error técnico visible:

- No mostrar `FORBIDDEN`, `Error HTTP`, stack trace, URL completa o payload técnico al usuario operativo.
- Traducir 400 como datos por revisar.
- Traducir 401 como sesión expirada.
- Traducir 403 como falta de permiso.
- Traducir 404 como información no encontrada.
- Traducir 409 como conflicto con el estado actual.
- Traducir 500 como error del servidor con indicación de intentar más tarde.

Validaciones accionables:

- Mostrar qué falta.
- Mostrar botones para ir directo a corregirlo.
- Conservar datos ya capturados.
- Evitar que el botón parezca no hacer nada.

Acceso denegado:

- Mostrar pantalla o modal amigable.
- Explicar si falta permiso o canal/sucursal habilitada.
- Ofrecer volver al menú principal.
- No exponer nombres técnicos de permisos al usuario operativo, salvo perfil técnico.

## Pantallas prioritarias de homologacion

1. `app/door-sale.tsx`
2. `app/live.tsx`
3. `app/batch-detail.tsx`
4. `app/payments.tsx`
5. `app/customer-package-detail.tsx`
