# ERP LIVE UX I18N Preparation

Fecha: 2026-05-18  
Rama: `feature/live-a-i18n-base-live-ux`

## Objetivo

Preparar el flujo LIVE para textos traducibles, corregir textos principales visibles y reducir riesgo de mojibake sin cambiar reglas operativas.

## Textos LIVE Cubiertos

- Titulo principal.
- Selector de idioma.
- Lives abiertos.
- Sesion de live.
- Crear otro live.
- Capturar reserva.
- Seleccion de cliente.
- Seleccion/busqueda de prenda.
- Agregar reserva.
- Reservas recientes.
- Cierre del live.
- Modales principales.
- Alertas principales de validacion.
- Mensajes de exito/error principales.

## UX Aplicada

- Se conserva el layout actual.
- Se agrega un selector pequeno ES/EN en la pantalla LIVE para validar la base tecnica.
- Se mantiene `AppNoticeDropdown` para notificaciones de LIVE.
- Se mantienen `AppBottomModal` y `Alert.alert` existentes, solo cambiando textos visibles por traducciones.

## No Se Modifico

- Logica de creacion/cierre/activacion de live.
- Logica de reservas.
- Servicios `liveService`, `reservationService`, `paymentService`, `itemService` o `customerService`.
- Backend.
- Migraciones.
- Ventas, pagos, reportes, reservaciones externas o integracion Facebook.

## Riesgos Pendientes

- `getLiveStatusLabel` sigue viniendo de `services/liveService.ts`; si se requiere ingles completo, ese servicio debe exponer codigos y dejar la etiqueta al i18n.
- Algunos textos dinamicos del sistema y errores backend pueden llegar ya traducidos o tecnicos; se requiere estrategia global de errores.
- El selector de idioma aun no persiste preferencia.

## Criterio GO/NO-GO

GO si:

- `npx.cmd tsc --noEmit` pasa.
- `npm run lint` no reporta errores bloqueantes.
- La app web inicia.
- LIVE abre con textos en espanol sin mojibake visible.

NO-GO si:

- LIVE rompe al abrir.
- El proveedor i18n afecta navegacion global.
- Aparece error JS critico o pantalla en blanco.
