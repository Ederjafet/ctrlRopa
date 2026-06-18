# APK-RC1 / Android build report

## Resumen

- Rama: `feature/apk-rc1-android-build`
- Resultado: `APK_BUILD_OK`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Estado EAS: `FINISHED`
- Perfil: `preview-apk`
- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`

## Historial confirmado

- `fcc4fd9 PAY-LIVE-B valida pago live visual`
- `4b1435e PAY-LIVE-A implementa pago minimo live`
- `3676d2b LIVE-PRICE-D valida cambio precio live`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`

## Comandos ejecutados

```powershell
git branch --show-current
git status
git log --oneline -120
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-B"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-A"
git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-D"
git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"
git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"
git grep -n "expo|eas|android|package|EXPO_PUBLIC|API" -- app.json eas.json package.json docs qa-reports
npx.cmd expo-doctor
npx.cmd expo install expo@~54.0.35 expo-font@~14.0.12 expo-localization@~17.0.9 expo-router@~6.0.24
npx.cmd eas-cli --version
npx.cmd eas-cli whoami
npx.cmd eas-cli project:info
npx.cmd eas-cli build --platform android --profile preview-apk --non-interactive
npx.cmd eas-cli build:list --platform android --limit 1 --json
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
.\mvnw.cmd test
git --no-pager diff --check
git --no-pager diff --cached --check
git status
```

## Configuracion detectada

- `app.json` existe.
- `eas.json` existe.
- `package.json` existe.
- No se detecto `app.config.js` ni `app.config.ts`.
- Android package: `com.gasperrrmx.controlropaapp`.
- Permisos Android existentes: `INTERNET`, `CAMERA`.
- EAS owner: `hpsq-soft`.
- EAS projectId: `d3f12b07-41a0-4166-af9b-47800ab63175`.

## Cambios realizados

- `eas.json`: agregado perfil `preview-apk` con `android.buildType: apk`.
- `package.json` y `package-lock.json`: dependencias Expo alineadas con `expo-doctor`.
- `app.json`: config plugins `expo-font` y `expo-localization` agregados por `npx expo install`.
- Documentacion, QA report y evidencia git de APK-RC1.

## Validaciones

- `npx.cmd expo-doctor`: PASS, 18/18.
- `npx.cmd eas-cli --version`: PASS, `eas-cli/20.1.0`.
- `npx.cmd eas-cli whoami`: PASS, cuenta autenticada.
- `npx.cmd eas-cli project:info`: PASS, proyecto `@hpsq-soft/control-ropa-app`.
- `npx.cmd eas-cli build --platform android --profile preview-apk --non-interactive`: encolo build remoto; el proceso local excedio timeout, pero EAS continuo.
- `npx.cmd eas-cli build:list --platform android --limit 1 --json`: PASS, build `FINISHED`.
- `npm.cmd run lint`: PASS con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `backend/control-ropa/.mvnw.cmd test`: PASS, 125 tests.

## APK

- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- App version: `1.0.0`
- Build version: `1`
- SDK: `54.0.0`
- Artifact: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`

## Confirmacion de alcance

No se tocaron:

- Backend funcional.
- Pagos.
- Caja.
- Precio LIVE.
- Devoluciones.
- Autorizaciones operativas.
- RBAC.
- Permisos.
- Migraciones.
- Logica LIVE.

## Resultado

`APK_BUILD_OK`.

Siguiente fase recomendada: instalar APK en dispositivo Android y ejecutar QA manual de login, navegacion principal, LIVE, pagos LIVE ya integrados y conexion a backend configurado.
