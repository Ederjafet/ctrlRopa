# PRODUCT-I18N-B.1 - Glosario i18n, prestamos linguisticos y claves crudas

Fecha: 2026-06-06

## Objetivo

Cerrar problemas visibles de i18n posteriores a PRODUCT-I18N-B:

- corregir claves crudas visibles en UI;
- definir un glosario de terminos traducibles y no traducibles;
- documentar prestamos linguisticos controlados;
- ajustar el caso visual de `UI Kit` sin cambiar logica funcional.

No se modifica backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Problema detectado

QA visual detecto que `/live` mostraba la clave cruda:

```text
live.size
```

La causa fue una clave usada en `app/live.tsx`:

```text
t('live.size')
```

pero no definida en `locales/*/common.json`.

Durante la auditoria estatica tambien se detecto otra clave faltante potencial:

```text
live.noCustomerSelected
```

## Correccion aplicada

Se agregaron las claves a los siete idiomas:

| Idioma | `live.size` | `live.noCustomerSelected` |
| --- | --- | --- |
| `es` | Talla | Cliente no seleccionado |
| `en` | Size | No customer selected |
| `pt-BR` | Tamanho | Nenhum cliente selecionado |
| `fr` | Taille | Aucun client sélectionné |
| `ja` | サイズ | 顧客未選択 |
| `zh` | 尺码 | 未选择客户 |
| `ko` | 사이즈 | 선택된 고객 없음 |

## Auditoria de claves crudas

Se auditaron claves estaticas usadas por `t('...')` e `i18n.t('...')` en `app/` y `components/`.

Resultado posterior:

```text
static i18n keys=948
missing=0
```

Se mantiene estructura completa:

```text
es: leaves=1087 missing=0 extra=0
en: leaves=1087 missing=0 extra=0
pt-BR: leaves=1087 missing=0 extra=0
fr: leaves=1087 missing=0 extra=0
ja: leaves=1087 missing=0 extra=0
zh: leaves=1087 missing=0 extra=0
ko: leaves=1087 missing=0 extra=0
```

## Glosario de prestamos linguisticos controlados

Estos terminos se pueden mantener sin traduccion cuando aparecen como marca, sigla o concepto tecnico universal:

| Termino | Decision |
| --- | --- |
| LIVE | Mantener. Es nombre operativo del modulo. |
| QR | Mantener. Sigla tecnica universal. |
| URL | Mantener. Sigla tecnica universal. |
| UI Kit | Mantener como prestamo tecnico; en japones se usa `UIキット` por consistencia visual. |
| API | Mantener. Sigla tecnica. |
| ID | Mantener. Identificador tecnico. |
| CSV | Mantener. Formato tecnico. |
| Excel | Mantener si aparece como producto/formato. |
| SKU | Mantener si aparece como codigo de inventario. |
| AppShell | Mantener solo en documentacion tecnica; evitarlo como label operativo de usuario. |

## Terminos operativos traducibles

Estos terminos si deben traducirse en UI visible porque describen acciones o conceptos operativos para usuarios:

| Ingles / tecnico | ES | PT-BR | FR | JA | ZH | KO |
| --- | --- | --- | --- | --- | --- | --- |
| Size | Talla | Tamanho | Taille | サイズ | 尺码 | 사이즈 |
| Customer | Cliente | Cliente | Client | 顧客 | 客户 | 고객 |
| Hold | Apartado | Apartado | Mise de côté | 取り置き | 预留 | 홀드 |
| Item | Prenda | Peça | Article | 商品 | 商品 | 상품 |
| Price | Precio | Preço | Prix | 価格 | 价格 | 가격 |
| Branch | Sucursal | Filial | Succursale | 店舗 | 门店 | 지점 |
| Status | Estado | Status | État | ステータス | 状态 | 상태 |
| Refresh | Actualizar | Atualizar | Actualiser | 更新 | 刷新 | 새로고침 |
| Sign out | Cerrar sesión | Sair | Se déconnecter | サインアウト | 退出登录 | 로그아웃 |
| Light | Claro | Claro | Clair | ライト | 浅色 | 라이트 |
| Dark | Oscuro | Escuro | Sombre | ダーク | 深色 | 다크 |
| Available | Disponible | Disponível | Disponible | 利用可能 | 可用 | 사용 가능 |
| Reserved | Reservada | Apartado | Mis de côté | 取り置き済み | 已预留 | 홀드됨 |

## Decision sobre UI Kit

`UI Kit` se mantiene como prestamo tecnico para `es`, `en`, `pt-BR`, `fr`, `zh` y `ko`.

Para `ja` se ajusto el label visible a:

```text
UIキット
```

Motivo:

- mantiene el prestamo tecnico `UI`;
- evita que el sidebar se vea como mezcla abrupta de latin + japones;
- conserva una forma comun y reconocible para usuarios tecnicos japoneses.

No se cambio layout ni logica del sidebar.

## Validacion manual esperada

1. Abrir `/system`.
2. Cambiar a japones.
3. Abrir `/live`.
4. Confirmar que no aparece `live.size`.
5. Confirmar que talla aparece como `サイズ`.
6. Confirmar que `UIキット` se ve correcto en el sidebar.
7. Repetir en chino y coreano.
8. Confirmar que `LIVE`, `QR` y `URL` se conservan como prestamos tecnicos.
9. Validar light/dark.

## Limitaciones

- Las traducciones siguen siendo base tecnica y requieren revision humana/nativa antes de release internacional.
- No se traducen codigos tecnicos, permisos, rutas, IDs ni estados backend cuando son datos.
- No se tocan pagos/caja en esta fase.

## Continuidad PRODUCT-C2.1

PRODUCT-C2.1 agrega claves `paletteGenerator.*` para el generador visual de paletas en los siete idiomas soportados. Se mantienen prestamos tecnicos controlados como `HEX`, `RGB`, `HSL`, `WCAG` y `UI Kit`, porque funcionan como siglas/terminos tecnicos universales dentro de una herramienta visual.

Los terminos operativos del generador si se traducen: color base, armonia, contraste, texto recomendado, paleta sugerida, aplicar localmente y preview.
