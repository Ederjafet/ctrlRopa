# PRODUCT-I18N-B - Translation cleanup QA report

Fecha: 2026-06-06 22:44:29 America/Mexico_City

## Alcance

Se limpiaron mezclas visibles de idioma para `pt-BR`, `fr`, `ja`, `zh` y `ko`, priorizando `/live`, AppShell, navegacion, sistema, formularios y pantallas cercanas al shell.

No se modifico backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Hallazgo inicial

La auditoria automatica comparo los nuevos idiomas contra `en/common.json` y `es/common.json`.

Hallazgos principales:

- `live.*` mantenia cerca de 487-488 valores heredados de ingles en los idiomas nuevos.
- `operationalScreens.*`, `usersForm.*`, `appearance.*`, `systemRoles.*`, `systemChannels.*`, `securityAudit.*`, `securitySettings.*` y `securitySessions.*` tenian valores copiados de ingles.
- `/system` conservaba `system.liveAnalytics*` en ingles.
- En japones, QA podia ver mezclas como `Last hold`, `Search by code, name, or category`, `Price of the item on air` y `Quick customer`.

## Correcciones aplicadas

- Se localizaron claves visibles de LIVE para prenda al aire, prenda preparada, cliente, apartado, precio, refresh, apartados recientes, estados y actividad.
- Se aplico limpieza tecnica a valores que seguian identicos a ingles en grupos priorizados.
- Se tradujo manualmente `system.liveAnalytics*` en los cinco idiomas nuevos.
- Se conservaron placeholders `{{id}}`, `{{price}}`, `{{customer}}`, `{{status}}` y terminos tecnicos como `LIVE`, `QR`, `URL`.
- Se excluyo `payments.*` por restriccion explicita de no tocar pagos/caja.

## Auditoria posterior

Estructura de claves:

```text
es: leaves=1085 missing=0 extra=0
en: leaves=1085 missing=0 extra=0
pt-BR: leaves=1085 missing=0 extra=0
fr: leaves=1085 missing=0 extra=0
ja: leaves=1085 missing=0 extra=0
zh: leaves=1085 missing=0 extra=0
ko: leaves=1085 missing=0 extra=0
```

Resultados relevantes:

- `ja/zh/ko`: `live.*`, `operationalScreens.*`, `usersForm.*`, `appearance.*`, `systemRoles.*`, `systemChannels.*`, `securityAudit.*`, `securitySettings.*` y `securitySessions.*` quedaron con `sameEn=0` y `sameEs=0`.
- `pt-BR`: `live.*`, `operationalScreens.*`, `reports.*`, `itemsCreate.*`, `systemChannels.*`, `securitySettings.*` quedaron con `sameEn=0`.
- `fr`: `system.*`, `operationalScreens.*`, `reports.*`, `itemsCreate.*`, `appearance.*`, `systemChannels.*`, `securitySettings.*`, `securitySessions.*` quedaron con `sameEn=0`.

Las coincidencias restantes en `pt-BR/fr` corresponden principalmente a nombres propios o terminos compartidos (`English`, `UI Kit`, `Status`, `Code`, `Page`) y a `payments.*`, fuera de alcance.

## Ejemplos validados en japones

```text
live.operatorLatestReservation = ultimo apartado localizado en japones
live.searchItemActionHelp = busqueda por codigo, nombre o categoria en japones
live.activeItemPriceLabel = precio de prenda al aire en japones
live.quickCustomer = cliente rapido en japones
live.priceConfirmedForReservation = precio confirmado para apartado en japones
live.itemStatusAvailable = disponible en japones
live.productOnAirChip = on air en japones
navigation.signOut = sign out en japones
theme.light/theme.dark = light/dark en japones
```

## Validaciones ejecutadas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS, 0 errores. Persisten 53 warnings preexistentes fuera del alcance. |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS, 73 rutas exportadas |
| `./mvnw.cmd test` | PASS, 73 tests, 0 fallas, 0 errores |
| `./mvnw.cmd -q -DskipTests package` | PASS |
| `git --no-pager diff --check` | PASS |

## Flujo manual recomendado

1. Entrar con `qa.admin`.
2. Abrir `/system`.
3. Cambiar a japones y abrir `/live`.
4. Confirmar que el flujo principal no mezcla ingles/espanol.
5. Repetir en chino simplificado y coreano.
6. Repetir navegacion + LIVE en frances y portugues Brasil.
7. Confirmar que no aparecen `undefined`, `null` ni claves crudas.
8. Validar light/dark.

## Resultado

GO tecnico para commit, condicionado a QA visual y revision humana/nativa antes de release internacional.
