# ERP LIVE - Usability hardening

Fecha: 2026-05-19  
Fase: LIVE-Q - usability hardening

## Objetivo

Reducir friccion visual antes de declarar el modulo como candidato de demo.

## Cambios UX

- Header contextual por dispositivo:
  - desktop: panel comercial,
  - tablet: consola operativa,
  - mobile: accion rapida.
- Franja de roles visible solo en tablet/desktop.
- Textos de rol reducidos a lectura rapida.
- Microcopy menos tecnico:
  - `Sesion en vivo` -> `Transmision activa`.
  - `Crear otra transmision` -> `Abrir nueva transmision`.
  - `Capturando en esta transmision` -> `Las reservas se registraran aqui`.
- Ayudas largas reemplazadas por instrucciones cortas.

## Criterios de aceptacion UX

- No debe empalmarse con status bar en Android/tablet.
- Mobile no debe mostrar tarjetas de roles.
- Tablet debe mantener foco en reserva rapida y producto.
- Desktop debe seguir mostrando lectura comercial mas amplia.
- No se debe tocar backend ni logica financiera.

## Pendientes

- Smoke visual real en Galaxy Tab/iPad.
- Ajustes finos tras observar a operador real usando la pantalla.
- Reemplazar actividad demo por eventos reales cuando exista backend realtime.
