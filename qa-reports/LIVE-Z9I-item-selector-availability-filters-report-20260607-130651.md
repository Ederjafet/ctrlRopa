# LIVE-Z9I - QA report

Fecha: 2026-06-07 13:06:51
Rama: `feature/live-z9i-item-selector-availability-filters`

## Alcance validado

- Selector `Buscar prenda` en `/live`.
- Filtro por defecto `Disponibles` al abrir el selector.
- Chips de disponibilidad con contador:
  - Disponibles;
  - Apartadas;
  - Vendidas / no disponibles;
  - Todas.
- Busqueda conservada por codigo, QR, tipo, marca y talla.
- Categorizacion reutilizando `getItemLiveAvailability`.
- Estados visuales con tokens semanticos del tema.
- Empty states diferenciados para busqueda y filtros.
- Textos i18n agregados en `es`, `en`, `pt-BR`, `fr`, `ja`, `zh` y `ko`.

## Validaciones ejecutadas

| Validacion | Resultado | Nota |
| --- | --- | --- |
| `npm.cmd run lint` | PASS | 0 errores, 53 warnings existentes del repo. |
| `npx.cmd tsc --noEmit` | PASS | Sin errores TypeScript. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS | Export web generado con 73 rutas estaticas, incluyendo `/live`. |
| `backend/control-ropa/.mvnw.cmd test` | PASS | 73 tests, 0 fallas, 0 errores. |
| `backend/control-ropa/.mvnw.cmd -q -DskipTests package` | PASS | Package generado sin errores. |
| `git --no-pager diff --check` | PASS | Sin whitespace errors. |

## I18N

Auditoria de estructura:

```text
es: leaves=1254 missing=0 extra=0
en: leaves=1254 missing=0 extra=0
pt-BR: leaves=1254 missing=0 extra=0
fr: leaves=1254 missing=0 extra=0
ja: leaves=1254 missing=0 extra=0
zh: leaves=1254 missing=0 extra=0
ko: leaves=1254 missing=0 extra=0
```

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/live`.
3. Abrir `Buscar prenda`.
4. Confirmar filtro por defecto `Disponibles`.
5. Confirmar que vendidas/reservadas no aparecen por defecto.
6. Cambiar a `Todas`.
7. Confirmar que aparecen vendidas/reservadas con motivo.
8. Buscar por codigo, tipo, marca o talla.
9. Confirmar que los filtros siguen aplicando.
10. Intentar seleccionar vendida/no disponible.
11. Confirmar que no permite operacion o muestra bloqueo claro.
12. Validar light/dark y mobile/tablet.

## Resultado

GO tecnico para commit si el diff staged queda dentro de alcance.
