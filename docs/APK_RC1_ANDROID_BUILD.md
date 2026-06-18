# APK-RC1 / Preparacion y generacion APK Android

## Resumen ejecutivo

APK-RC1 deja preparada y ejecutada la generacion de APK Android para `control-ropa-app` mediante EAS Build.

Resultado: `APK_BUILD_OK`.

Build EAS generado:

- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil: `preview-apk`
- Plataforma: `ANDROID`
- Distribucion: `INTERNAL`
- Estado: `FINISHED`
- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Proyecto EAS: `@hpsq-soft/control-ropa-app`
- Project ID: `d3f12b07-41a0-4166-af9b-47800ab63175`

## Alcance

Incluido:

- Validacion de rama e historial previo.
- Auditoria de configuracion Expo/EAS.
- Alineacion de dependencias Expo requeridas por `expo-doctor`.
- Perfil EAS explicito `preview-apk` para generar APK Android interno.
- Ejecucion de build remoto EAS.
- Validaciones frontend/backend completas.

Excluido:

- Backend funcional.
- Pagos, caja, precio LIVE, devoluciones, autorizaciones operativas, RBAC, permisos y migraciones.
- Cambios de logica de negocio.
- Publicacion en tiendas.

## Configuracion aplicada

`eas.json` agrega el perfil:

```json
"preview-apk": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

`package.json` queda alineado con Expo SDK 54 segun `expo-doctor`:

- `expo`: `~54.0.35`
- `expo-font`: `~14.0.12`
- `expo-localization`: `~17.0.9`
- `expo-router`: `~6.0.24`

`app.json` incluye los config plugins `expo-font` y `expo-localization`, agregados por `npx expo install` para compatibilidad de build nativo.

## Comandos clave

Comandos ejecutados para diagnostico y build:

```powershell
git branch --show-current
git status
git log --oneline -120
npx.cmd expo-doctor
npx.cmd expo install expo@~54.0.35 expo-font@~14.0.12 expo-localization@~17.0.9 expo-router@~6.0.24
npx.cmd eas-cli --version
npx.cmd eas-cli whoami
npx.cmd eas-cli project:info
npx.cmd eas-cli build --platform android --profile preview-apk --non-interactive
npx.cmd eas-cli build:list --platform android --limit 1 --json
```

Validaciones ejecutadas:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
.\mvnw.cmd test
git --no-pager diff --check
git --no-pager diff --cached --check
```

## Resultado de validaciones

- `expo-doctor`: PASS, 18/18 checks.
- EAS CLI: disponible, `eas-cli/20.1.0`.
- EAS auth: usuario autenticado.
- EAS project info: `@hpsq-soft/control-ropa-app`.
- EAS build: `FINISHED`, APK generado.
- `npm.cmd run lint`: PASS con warnings preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web`: PASS.
- Backend `mvnw test`: PASS, 125 tests, 0 failures, 0 errors.

## Instalacion manual del APK

Para descargar e instalar en Android:

1. Abrir el APK generado:
   `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
2. Descargar desde el dispositivo Android o transferir el APK.
3. Permitir instalacion desde fuente confiable si Android lo solicita.
4. Instalar y validar login/conexion LAN o backend configurado.

Comando para revisar builds recientes:

```powershell
npx.cmd eas-cli build:list --platform android --limit 5
```

## Riesgos y pendientes

- El APK es de distribucion interna, no de tienda.
- La URL de artefacto EAS puede expirar segun la politica del build.
- La validacion visual en dispositivo fisico queda como siguiente paso de QA manual.
- `npm audit` reporto vulnerabilidades durante instalacion de paquetes; no se ejecuto `npm audit fix` por estar fuera de alcance y poder introducir cambios mayores.

## GO/NO-GO

Resultado: `APK_BUILD_OK`.

La configuracion APK esta lista y el build real fue generado por EAS.
