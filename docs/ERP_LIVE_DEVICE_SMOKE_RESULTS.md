# ERP LIVE - Resultados smoke por dispositivo

Fecha: 2026-05-20  
Fase: LIVE-R - smoke demo candidate

## Mobile Android

Estado: `GO condicionado`

Validado por codigo:

- `AppScreen` ya aplica safe area global.
- `app/live.tsx` agrega proteccion local de header con `useSafeAreaInsets`.
- La franja de roles se oculta en mobile para reducir ruido.
- Header mobile usa microcopy corto.

Pendiente:

- Validacion visual fisica en Android.
- Confirmar que status bar no invade contenido.
- Confirmar CTA tactil visible y scroll correcto.

## Tablet

Estado: `GO condicionado`

Validado por codigo:

- Layout tablet mantiene dos columnas.
- Consola operativa prioriza reserva rapida.
- Product Spotlight y reservas recientes quedan en el flujo principal.
- Microcopy reducido para lectura rapida.

Pendiente:

- Validacion tactil en Galaxy Tab.
- Validacion iPad.
- Confirmar ergonomia en 1024x768 y 1280x800.

## Desktop

Estado: `GO tecnico`

Validado:

- Expo web responde en `/`, `/login` y `/live`.
- Export web compila.
- TypeScript y lint sin errores.

Pendiente:

- Smoke visual con usuario real y backend QA activo.
- Validar flujo completo de reserva y cobro con datos reales.

## Hallazgos

| Hallazgo | Estado |
|---|---|
| Posible empalme status bar Android/tablet | Mitigado en frontend, pendiente evidencia fisica |
| Cards con exceso de texto | Mitigado con microcopy corto y ocultamiento mobile |
| Terminos no comerciales | Mitigado en LIVE; quedan textos legacy fuera de alcance |
| Flujo completo En vivo -> Cobro | Pendiente runtime con backend QA activo |
