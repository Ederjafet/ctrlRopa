# RELEASE-LIVE-GO / QA report

## Resumen

- Rama: `feature/release-live-go`
- Resultado: `RELEASE_GO_CONDICIONADO`
- Pendientes: `PENDING_QA_VISUAL`, `PENDING_ROLE_SMOKE`
- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`

## Historial confirmado

- `fd92569 APK-QA-B valida smoke android por roles`
- `58e2131 APK-QA-A documenta smoke android`
- `97e13d1 APK-RC1 prepara build android apk`
- `fcc4fd9 PAY-LIVE-B valida pago live visual`
- `4b1435e PAY-LIVE-A implementa pago minimo live`
- `3676d2b LIVE-PRICE-D valida cambio precio live`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`

## Comandos ejecutados

```powershell
git branch --show-current
git status
git log --oneline -180
git --no-pager log --oneline --all --decorate --grep="APK-QA-B"
git --no-pager log --oneline --all --decorate --grep="APK-QA-A"
git --no-pager log --oneline --all --decorate --grep="APK-RC1"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-B"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-A"
git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-D"
git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"
git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"
Get-ChildItem docs/qa-reports/git-diffs/qa-evidence
git grep -n "preview-apk|buildType|apk|f9e59a44|l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw|EXPO_PUBLIC_API_HOST|EXPO_PUBLIC_API_PORT|192.168.0.128" -- app.json app.config.* eas.json package.json docs qa-reports
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

## Backend LAN

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

## Estado APK-QA-A

- `GO_TECNICO_ANDROID_SMOKE`.
- `APK_INSTALLED_OK`.
- `APK_CONNECTION_OK`.
- App abre y login/entrada funciona segun evidencia manual.

## Estado APK-QA-B

- `APK_ANDROID_BASIC_OK`.
- `PENDING_QA_VISUAL`.
- `PENDING_ROLE_SMOKE`.
- No se encontraron screenshots para APK-QA-B.
- No hay evidencia nueva por roles.

## Pendientes

- Screenshots reales desde Android instalado.
- Smoke por roles admin/vendedor/sin permisos.
- Validacion Home/menu/LIVE/autorizaciones/pago-reserva con capturas.
- Validacion cliente final.

## Validaciones tecnicas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS con 53 warnings preexistentes y 0 errores |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS |
| `backend/control-ropa/.mvnw.cmd test` | PASS, 125 tests, 0 failures, 0 errors |
| `git --no-pager diff --check` | PASS |
| `git --no-pager diff --cached --check` | PASS |

## GO/NO-GO

`RELEASE_GO_CONDICIONADO`

No se marca `QA_PASS` completo ni `APK_ANDROID_ROLE_SMOKE_OK`.
