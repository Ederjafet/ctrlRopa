# PRODUCT-I18N-B - Limpieza visual multi-idioma y revision de mezclas

Fecha: 2026-06-06

## Objetivo

Reducir mezclas visibles de ingles/espanol en los idiomas agregados por PRODUCT-I18N-A, priorizando `/live`, AppShell, navegacion, botones, formularios y pantallas cercanas al shell.

No se modifica backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Idiomas revisados

- `pt-BR`
- `fr`
- `ja`
- `zh`
- `ko`

## Problema detectado

PRODUCT-I18N-A creo archivos completos para evitar claves faltantes, pero muchos valores de dominio quedaron heredados de `en/common.json`. En QA visual esto se noto especialmente en `/live` con japones activo:

- `Last hold`
- `Search by code, name, or category`
- `Price of the item on air`
- `Quick customer`
- labels de estado y acciones en ingles.

## Auditoria automatica

Se compararon los idiomas nuevos contra `locales/en/common.json` y `locales/es/common.json` por grupos:

- `common`
- `navigation`
- `theme`
- `topBar`
- `system`
- `live`
- `itemsCreate`
- `operationalScreens`
- `reports`
- `usersForm`
- `appearance`
- `systemRoles`
- `systemChannels`
- `securityAudit`
- `securitySettings`
- `securitySessions`

Hallazgo inicial principal:

- `live.*` tenia cerca de 487-488 valores iguales a ingles en `ja/zh/ko/fr`.
- `operationalScreens.*`, `usersForm.*`, `appearance.*`, `systemRoles.*`, `systemChannels.*`, `securityAudit.*`, `securitySettings.*` y `securitySessions.*` tenian valores heredados de ingles.
- `/system` mantenia el bloque `liveAnalytics*` en ingles.

## Correcciones aplicadas

### LIVE

Se corrigieron traducciones visibles para:

- actor y vista LIVE;
- refresh y ultima actualizacion;
- prenda al aire;
- prenda preparada;
- busqueda de prenda;
- cliente rapido;
- apartado / hold;
- precio LIVE;
- estados de prenda;
- apartados recientes;
- actividad y confirmaciones principales.

Ejemplos corregidos en japones:

| Clave | Valor |
| --- | --- |
| `live.operatorLatestReservation` | `最後の取り置き: #{{id}}` |
| `live.searchItemActionHelp` | `コード、名前、カテゴリで検索` |
| `live.activeItemPriceLabel` | `オンエア商品の価格` |
| `live.quickCustomer` | `簡易顧客` |
| `live.priceConfirmedForReservation` | `取り置き確認価格: {{price}}` |
| `live.itemStatusAvailable` | `利用可能` |
| `live.productOnAirChip` | `オンエア` |

### AppShell y sistema

Se corrigieron mezclas visibles en:

- navegacion y categorias ya cubiertas por I18N-A;
- `theme.*`;
- `topBar.*`;
- `system.liveAnalytics*`.

### Formularios y pantallas cercanas

Se realizo una limpieza tecnica de valores heredados de ingles en:

- `operationalScreens.*`;
- `usersForm.*`;
- `appearance.*`;
- `systemRoles.*`;
- `systemChannels.*`;
- `securityAudit.*`;
- `securitySettings.*`;
- `securitySessions.*`.

La limpieza conserva placeholders como `{{id}}`, `{{price}}`, `{{customer}}` y `{{status}}`.

## Resultado de auditoria posterior

Se mantiene estructura completa:

```text
es: leaves=1085 missing=0 extra=0
en: leaves=1085 missing=0 extra=0
pt-BR: leaves=1085 missing=0 extra=0
fr: leaves=1085 missing=0 extra=0
ja: leaves=1085 missing=0 extra=0
zh: leaves=1085 missing=0 extra=0
ko: leaves=1085 missing=0 extra=0
```

En `ja/zh/ko`, los grupos priorizados quedan sin valores identicos a ingles o espanol, salvo terminos tecnicos compartidos como `LIVE`, `QR`, `URL` o nombres propios.

## Exclusiones

No se tocaron pagos/caja. Por eso `payments.*` puede seguir usando fallback de ingles en los idiomas nuevos; queda fuera de alcance por restriccion funcional de la fase.

## Limitaciones

- Las traducciones son base tecnica para coherencia visual, no traduccion comercial final.
- La limpieza de textos largos se hizo con enfoque de UX visible y consistencia, pero requiere revision humana/nativa antes de release internacional.
- Codigos tecnicos, rutas, permisos, IDs, placeholders y terminos como `LIVE`, `QR`, `URL` se conservaron cuando son parte del dominio tecnico.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/system`.
3. Cambiar a `日本語`.
4. Abrir `/live`.
5. Confirmar que el flujo principal no mezcla ingles/espanol.
6. Cambiar a `中文` y revisar `/live`.
7. Cambiar a `한국어` y revisar `/live`.
8. Cambiar a `Français` y revisar navegacion + LIVE.
9. Cambiar a `Português Brasil` y revisar navegacion + LIVE.
10. Confirmar que no aparecen `undefined`, `null` ni claves crudas.
11. Validar light/dark.

## Decision

GO tecnico condicionado a QA visual y revision humana/nativa de traducciones antes de release internacional.

## Continuidad PRODUCT-I18N-B.1

PRODUCT-I18N-B.1 corrige claves crudas detectadas despues de la limpieza, en particular `live.size` y `live.noCustomerSelected`, y define un glosario de prestamos linguisticos controlados. Se mantiene `LIVE`, `QR`, `URL`, `API`, `ID`, `CSV` y `UI Kit` como terminos tecnicos cuando aplica; en japones el item de navegacion queda como `UIキット` para mejorar consistencia visual.
