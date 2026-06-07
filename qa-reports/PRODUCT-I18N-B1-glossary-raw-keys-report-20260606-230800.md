# PRODUCT-I18N-B.1 - Glosario i18n, prestamos linguisticos y claves crudas

Fecha: 2026-06-06 23:08:00 America/Mexico_City
Rama: feature/product-i18n-b1-glossary-raw-keys

## Alcance

- Corregir la clave cruda visible `live.size` en LIVE.
- Revisar claves i18n usadas estaticamente en `app/` y `components/`.
- Agregar la clave faltante `live.noCustomerSelected`.
- Definir glosario de terminos traducibles y prestamos linguisticos controlados.
- Mantener `UI Kit` como prestamo tecnico, con `UIキット` en japones por legibilidad.

## Correcciones

| Clave | ES | EN | PT-BR | FR | JA | ZH | KO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `live.size` | Talla | Size | Tamanho | Taille | サイズ | 尺码 | 사이즈 |
| `live.noCustomerSelected` | Cliente no seleccionado | No customer selected | Nenhum cliente selecionado | Aucun client sélectionné | 顧客未選択 | 未选择客户 | 선택된 고객 없음 |

## Auditoria i18n

Estructura de locales:

- es: leaves=1087 missing=0 extra=0
- en: leaves=1087 missing=0 extra=0
- pt-BR: leaves=1087 missing=0 extra=0
- fr: leaves=1087 missing=0 extra=0
- ja: leaves=1087 missing=0 extra=0
- zh: leaves=1087 missing=0 extra=0
- ko: leaves=1087 missing=0 extra=0

Uso estatico de `t('...')` en `app/` y `components/`:

- static i18n keys=948
- missing=0

## Glosario

Prestamos linguisticos controlados:

- LIVE
- QR
- URL
- UI Kit
- API
- ID
- CSV
- Excel
- SKU
- AppShell solo en documentacion tecnica

Terminos operativos traducibles:

- Size / Talla
- Customer / Cliente
- Hold / Apartado
- Item / Prenda
- Price / Precio
- Branch / Sucursal
- Status / Estado
- Refresh / Actualizar
- Sign out / Cerrar sesion
- Light / Claro
- Dark / Oscuro
- Available / Disponible
- Reserved / Reservada

## Validaciones ejecutadas

- `npm.cmd run lint`: PASS, 0 errores, 53 advertencias preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `backend/control-ropa/.\\mvnw.cmd test`: PASS, 73 tests, 0 fallas, 0 errores.
- `backend/control-ropa/.\\mvnw.cmd -q -DskipTests package`: PASS.
- `git --no-pager diff --check`: PASS.

## Validacion manual esperada

1. Abrir `/system`.
2. Cambiar a japones.
3. Abrir `/live`.
4. Confirmar que no aparece `live.size`.
5. Confirmar que talla aparece como `サイズ`.
6. Confirmar que `UIキット` no se ve roto en sidebar.
7. Repetir revision de talla en chino (`尺码`) y coreano (`사이즈`).
8. Confirmar que LIVE, QR y URL se mantienen como prestamos tecnicos.
9. Validar light/dark.

## Resultado

GO tecnico para QA manual de PRODUCT-I18N-B.1. Las traducciones base siguen requiriendo revision humana/nativa antes de release internacional.
