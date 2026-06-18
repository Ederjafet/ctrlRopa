# APK-QA-A / Android smoke report

## Resumen

- Rama: `feature/apk-qa-a-android-smoke`
- Resultado: `APK_INSTALLED_OK`, `APK_CONNECTION_OK`, `PENDING_QA_VISUAL`, `PENDING_ROLE_SMOKE`
- APK probado: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil: `preview-apk`
- Estado build: `FINISHED`

## Comandos ejecutados

```powershell
git branch --show-current
git status
git log --oneline -120
git --no-pager log --oneline --all --decorate --grep="APK-RC1"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-B"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-A"
git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-D"
git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"
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

- `97e13d1 APK-RC1 prepara build android apk`
- `fcc4fd9 PAY-LIVE-B valida pago live visual`
- `4b1435e PAY-LIVE-A implementa pago minimo live`
- `3676d2b LIVE-PRICE-D valida cambio precio live`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`

## Evidencia manual confirmada por usuario

| Prueba | Resultado |
| --- | --- |
| APK descargado | OK |
| APK instalado en Android | OK |
| App abre desde APK instalado | OK |
| Usuario puede entrar a la app | OK |
| No depende de Expo Go | OK |
| No depende de Metro | OK |

## Backend LAN

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

La entrada/login confirmada desde APK instalado y el health LAN correcto permiten documentar `APK_CONNECTION_OK`.

## Screenshots

No se proporcionaron screenshots en esta fase.

Resultado visual: `PENDING_QA_VISUAL`.

## Validaciones tecnicas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS con 53 warnings preexistentes y 0 errores |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS |
| `backend/control-ropa/.mvnw.cmd test` | PASS, 125 tests, 0 failures, 0 errors |
| `git --no-pager diff --check` | PASS |
| `git --no-pager diff --cached --check` | PASS |

## Checklist probado

Probado:

- Instalacion APK.
- Apertura de app instalada.
- Entrada/login.

Pendiente:

- Home.
- Menu principal.
- LIVE.
- Autorizaciones operativas.
- Pago/reserva.
- Login vendedor.
- Usuario sin permisos.
- Restricciones por permisos.
- Cierre de sesion.

## Confirmacion de no cambios funcionales

Esta fase solo agrega documentacion, reporte y evidencia git.

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

## Resultado GO/NO-GO

`GO_TECNICO_ANDROID_SMOKE`

`APK_INSTALLED_OK`

`APK_CONNECTION_OK`

`PENDING_QA_VISUAL`

`PENDING_ROLE_SMOKE`

Siguiente fase recomendada: ejecutar APK-QA-B con screenshots reales y smoke por roles desde APK instalado.
