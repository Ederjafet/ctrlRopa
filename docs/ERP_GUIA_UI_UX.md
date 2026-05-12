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

## Pantallas prioritarias de homologacion

1. `app/door-sale.tsx`
2. `app/live.tsx`
3. `app/batch-detail.tsx`
4. `app/payments.tsx`
5. `app/customer-package-detail.tsx`

