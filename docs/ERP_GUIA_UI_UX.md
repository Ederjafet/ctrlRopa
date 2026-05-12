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
- Textos con acentos rotos pueden reaparecer si no se valida codificacion.
- Algunas pantallas tienen botones largos de ancho completo sin jerarquia clara.
- Secciones operativas largas como `app/live.tsx` pueden crecer sin paginacion o separacion.

## Estandar propuesto

- Confirmacion destructiva: `AppBottomModal`.
- Validacion accionable: modal con lista de faltantes y botones directos.
- Exito/no bloqueante: `AppNoticeDropdown` desplegable.
- Error tecnico: traducido por `apiClient.ts` a mensaje operativo.
- Acceso denegado: pantalla/alerta amigable, nunca pantalla roja.
- Botones: primario para accion principal, secundario para navegacion, danger para cancelar.

## Estandar minimo Fase 1A/1B

Usar `AppBottomModal` cuando:

- La accion sea destructiva o irreversible para el usuario: cancelar, cerrar, anular, conciliar, procesar.
- La validacion requiera que el usuario escoja una accion directa para corregir: seleccionar cliente, seleccionar prenda, elegir metodo de pago, capturar precio.
- El usuario debe confirmar antes de continuar.

Usar `AppNoticeDropdown` cuando:

- El resultado no bloquee el trabajo: guardado correcto, reserva creada, paquete actualizado.
- Se quiera dejar visible un aviso plegable que el usuario puede cerrar.
- La informacion sea contextual y no requiera decision inmediata.

Usar alerta bloqueante (`Alert.alert`) solo cuando:

- Sea una validacion puntual y segura que no amerita flujo completo todavia.
- Sea un error de carga inicial que impide usar la pantalla.
- Sea una confirmacion temporal en pantallas que todavia no fueron homologadas.

Error tecnico visible:

- No mostrar `FORBIDDEN`, `Error HTTP`, stack trace, URL completa o payload tecnico al usuario operativo.
- Traducir 400 como datos por revisar.
- Traducir 401 como sesion expirada.
- Traducir 403 como falta de permiso.
- Traducir 404 como informacion no encontrada.
- Traducir 409 como conflicto con el estado actual.
- Traducir 500 como error del servidor con indicacion de intentar mas tarde.

Validaciones accionables:

- Mostrar que falta.
- Mostrar botones para ir directo a corregirlo.
- Conservar datos ya capturados.
- Evitar que el boton parezca no hacer nada.

Acceso denegado:

- Mostrar pantalla o modal amigable.
- Explicar si falta permiso o canal/sucursal habilitada.
- Ofrecer volver al menu principal.
- No exponer nombres tecnicos de permisos al usuario operativo, salvo perfil tecnico.

## Pantallas prioritarias de homologacion

1. `app/door-sale.tsx`
2. `app/live.tsx`
3. `app/batch-detail.tsx`
4. `app/payments.tsx`
5. `app/customer-package-detail.tsx`

