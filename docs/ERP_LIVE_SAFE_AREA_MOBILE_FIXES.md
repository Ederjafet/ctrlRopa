# ERP LIVE - Safe area y fixes mobile/tablet

Fecha: 2026-05-19  
Fase: LIVE-Q - usability hardening

## Problema

En Android/tablet se reporto que la barra de sistema invadia o empalmaba el header de `En vivo`.

## Estado tecnico

- La app ya usa `SafeAreaProvider` en `app/_layout.tsx`.
- `AppScreen` ya aplica `useSafeAreaInsets`.
- Para no afectar todo el ERP, LIVE-Q agrega proteccion local al header de `app/live.tsx`.

## Cambio aplicado

- `app/live.tsx` importa `useSafeAreaInsets` y `Platform`.
- Se calcula `liveHeaderSafeTop` para Android.
- El encabezado de LIVE queda dentro de `styles.liveHeader` con padding superior dinamico.

## Alcance

Solo afecta `En vivo`.

## QA requerido

- Android telefono.
- Android tablet.
- iPad.
- Web desktop.
- Web responsive mobile/tablet.

## Riesgo

Si el dispositivo ya reporta safe area amplia y `AppScreen` tambien la aplica, podria quedar un poco mas de aire arriba. Es preferible para demo candidate frente a contenido empalmado con la status bar.
