# ERP - Release flow

Fecha: 2026-05-12

## Flujo

`feature/*` -> `develop` -> QA -> `main`

## Feature branch

- Una fase o cambio acotado por rama.
- Debe tener objetivo y fuera de alcance.
- No mezclar refactor con cambio funcional.
- Debe cerrar Definition of Done proporcional.

Antes de merge a `develop`:

- `git status --short` revisado.
- Diff revisado.
- Smoke/QA aplicable ejecutado.
- Bitacora ERP actualizada.
- Sin artefactos no rastreados que afecten release.

## Develop

- Integra features aprobadas.
- Se despliega a QA.
- Se ejecuta regresion operacional minima.
- Se corrigen defectos en nueva rama o hotfix controlado.

## QA

- Ambiente para validar release candidato.
- Debe usar datos de prueba controlados.
- Debe ejecutar `ERP_SMOKE_TESTS.md` y flujos de `ERP_QA_REGRESION_OPERACIONAL.md`.

## Main

- Solo recibe release candidato validado.
- Debe estar asociado a tag.
- Debe tener rollback documentado.

## Tags

Crear tag cuando:

- El release candidato paso QA.
- Se conoce version/fecha.
- La bitacora esta actualizada.
- El rollback esta definido.

Formato sugerido:

- `vYYYY.MM.DD-faseX`
- `vYYYY.MM.DD-hotfixN`

## Rollback

Hacer rollback cuando:

- Login falla.
- Backend no arranca.
- Error 500 masivo.
- Venta/pago/caja queda inconsistente.
- Usuario sin permiso ejecuta accion critica.
- Migracion rompe arranque o datos.

## Bloquear release

Bloquear si:

- Falla smoke critico.
- Hay cambios de seguridad sin matriz.
- Hay migraciones no probadas.
- Hay errores tecnicos visibles en flujo critico.
- Hay artefactos no rastreados que alteran build.
- No existe plan de rollback.

