# ERP LIVE - Android safe area hardening

Fecha: 2026-05-20  
Fase: LIVE-T

## Objetivo

Evitar que headers/cards se encimen con hora, bateria, senal, notch o camara frontal en Android/Samsung/tablets.

## Cambio aplicado

- `components/ui/AppScreen.tsx` usa `StatusBar.currentHeight` en Android como fallback principal.
- El padding superior ahora considera:
  - `safeAreaInsets.top`,
  - altura real de status bar Android,
  - fallback minimo.
- Se agrega un guard adicional Android para Samsung/tablets donde `safeAreaInsets.top` puede llegar bajo.
- En web mobile/tablet se agrega un guard tactil pequeno para evitar empalmes al probar desde navegador/PWA.
- `app/_layout.tsx` ya mantiene `StatusBar` no translucida y color consistente con el tema.

## Alcance

El cambio es global para pantallas que usan `AppScreen`, incluido En vivo, sin tocar backend ni reglas de negocio.

## QA recomendado

- Android Samsung telefono.
- Android tablet/Galaxy Tab.
- iPad.
- Web desktop.

Validar:

- Header visible.
- Botones no cubiertos por barra del sistema.
- Scroll inicia debajo de status bar.
- Modales siguen centrados y accesibles.

## Riesgos

- Algunos navegadores Android en modo PWA/web pueden reportar safe area distinto a Expo Go.
- En dispositivos con notch extremo puede requerirse ajuste adicional por device lab.
- El ajuste global aumenta ligeramente el aire superior en pantallas compactas; validar que no genere scroll excesivo en telefonos pequenos.
