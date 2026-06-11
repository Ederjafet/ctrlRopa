# APK-QA-B / Android role smoke report

## Resumen

- Rama: `feature/apk-qa-b-android-role-smoke`
- Resultado: `APK_ANDROID_BASIC_OK`, `PENDING_QA_VISUAL`, `PENDING_ROLE_SMOKE`
- APK probado: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build EAS: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`

## Comandos ejecutados

```powershell
git branch --show-current
git status
git log --oneline -140
git --no-pager log --oneline --all --decorate --grep="APK-QA-A"
git --no-pager log --oneline --all --decorate --grep="APK-RC1"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-B"
git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-D"
git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"
Get-ChildItem -Path qa-evidence -Recurse -File
Get-ChildItem -Path qa-reports -File
Get-ChildItem -Path docs -File
git grep -n "EXPO_PUBLIC_API_HOST|EXPO_PUBLIC_API_PORT|API_BASE|baseURL|apiUrl|localhost|127.0.0.1|192.168.0.128|preview-apk|buildType|apk" -- app services components app.json app.config.* eas.json package.json docs qa-reports
curl.exe -i http://localhost:8090/api/health
curl.exe -i http://192.168.0.128:8090/api/health
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
.\mvnw.cmd test
git --no-pager diff --check
git --no-pager diff --cached --check
git status
```

## Historial confirmado

- `58e2131 APK-QA-A documenta smoke android`
- `97e13d1 APK-RC1 prepara build android apk`
- `fcc4fd9 PAY-LIVE-B valida pago live visual`
- `3676d2b LIVE-PRICE-D valida cambio precio live`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`

## Evidencia visual encontrada

- No se encontraron archivos en `qa-evidence/APK-QA-B/android/`.
- No se recibieron screenshots nuevos para esta fase.
- Se encontro solo evidencia previa no relacionada directamente: `qa-evidence/PRODUCT-D4/README.md`.

Resultado: `PENDING_QA_VISUAL`.

## Backend LAN

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

## Resultado por pantalla

| Pantalla/flujo | Resultado |
| --- | --- |
| Instalacion APK | OK, confirmado previamente |
| Apertura app | OK, confirmado previamente |
| Entrada/login | OK, confirmado previamente |
| Home | Pendiente |
| Menu principal | Pendiente |
| LIVE | Pendiente |
| Autorizaciones operativas | Pendiente |
| Reserva/pago | Pendiente |
| Cierre de sesion | Pendiente |

## Resultado por rol

| Rol | Resultado |
| --- | --- |
| Admin | Pendiente de screenshot/evidencia nueva |
| Vendedor | Pendiente de screenshot/evidencia nueva |
| Sin permisos | Pendiente de screenshot/evidencia nueva |

Resultado: `PENDING_ROLE_SMOKE`.

## Validaciones tecnicas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS con 53 warnings preexistentes y 0 errores |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS |
| `backend/control-ropa/.mvnw.cmd test` | PASS, 125 tests, 0 failures, 0 errors |
| `git --no-pager diff --check` | PASS |
| `git --no-pager diff --cached --check` | PASS |

## Confirmacion de no cambios funcionales

Esta fase solo agrega documentacion, QA report y evidencia git.

No se tocaron:

- Backend funcional.
- LIVE funcional.
- Pagos.
- Caja.
- Precio LIVE.
- Devoluciones.
- Autorizaciones.
- RBAC.
- Permisos.
- Migraciones.
- Configuracion Android/EAS.

## GO/NO-GO

`APK_ANDROID_BASIC_OK`

`PENDING_QA_VISUAL`

`PENDING_ROLE_SMOKE`

No se marca `APK_ANDROID_ROLE_SMOKE_OK` porque falta evidencia real por screenshots o confirmacion manual detallada por rol.
