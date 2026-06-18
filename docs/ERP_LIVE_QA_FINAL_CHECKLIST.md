# ERP LIVE - Checklist final QA demo candidate

Fecha: 2026-05-20  
Fase: LIVE-R - smoke demo candidate

## Precheck

- [x] Rama correcta: `feature/live-r-smoke-demo-candidate`.
- [x] Arbol limpio antes de iniciar.
- [x] Puerto `8081` libre.
- [x] Sin procesos `node` colgados detectados.
- [x] Expo web responde `200`.

## Validacion tecnica

- [x] `npm.cmd run lint`.
- [x] `npx.cmd tsc --noEmit`.
- [x] `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`.
- [x] `git diff --check`.
- [x] Busqueda mojibake.
- [x] Busqueda terminos `Live/Dashboard/Timeline`.

## Smoke funcional requerido

- [ ] Login con usuario QA.
- [ ] Dashboard/Panel carga.
- [ ] En vivo carga.
- [ ] Abrir transmision.
- [ ] Seleccionar cliente.
- [ ] Seleccionar prenda.
- [ ] Registrar reserva.
- [ ] Ir a Cobro.
- [ ] Regresar a En vivo.
- [ ] Cambiar idioma.
- [ ] Cerrar transmision.

## Smoke visual requerido

- [ ] Android mobile: safe area, header visible, CTA accesible, scroll correcto.
- [ ] Tablet 1024x768: spotlight visible, consola usable, reservas visibles.
- [ ] Tablet 1280x800: spacing y ergonomia tactil.
- [ ] Desktop: layout comercial, metricas visibles, feed usable.

## Criterio GO/NO-GO

GO demo final solo si:

- No hay empalme con status bar.
- No hay errores JS criticos.
- Flujo reserva/cobro/regreso funciona.
- Microcopy en espanol no muestra `Live`, `Dashboard` ni `Timeline` como texto visible en LIVE.

Estado actual: `GO tecnico`, `GO demo condicionado`.
