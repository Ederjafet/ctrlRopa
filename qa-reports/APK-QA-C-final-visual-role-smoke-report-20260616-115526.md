# APK-QA-C / Final visual role smoke report

## Resumen

- Rama: `feature/apk-qa-c-final-visual-role-smoke`
- Resultado: `PENDING_QA_VISUAL`, `PENDING_ROLE_SMOKE`
- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`

## Comandos ejecutados

```powershell
git branch --show-current
git status
git log --oneline -180
git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-GO"
git --no-pager log --oneline --all --decorate --grep="APK-QA-B"
git --no-pager log --oneline --all --decorate --grep="APK-QA-A"
git --no-pager log --oneline --all --decorate --grep="APK-RC1"
git --no-pager log --oneline --all --decorate --grep="PAY-LIVE-B"
git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-D"
Get-ChildItem -Path qa-evidence -Recurse -File
Get-ChildItem -Path qa-evidence\APK-QA-C\android -Recurse -File
Get-ChildItem -Path docs -File
Get-ChildItem -Path qa-reports -File
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

- `8d6c331 RELEASE-LIVE-GO documenta cierre apk live`
- `fd92569 APK-QA-B valida smoke android por roles`
- `58e2131 APK-QA-A documenta smoke android`
- `97e13d1 APK-RC1 prepara build android apk`
- `fcc4fd9 PAY-LIVE-B valida pago live visual`
- `3676d2b LIVE-PRICE-D valida cambio precio live`

## Evidencia visual encontrada

| Ruta | Resultado |
| --- | --- |
| `qa-evidence/` | Solo `qa-evidence/PRODUCT-D4/README.md` |
| `qa-evidence/APK-QA-C/android/` | Sin archivos encontrados |

No hay screenshots APK-QA-C disponibles.

## Screenshots por pantalla

| Pantalla | Evidencia |
| --- | --- |
| Home | Pendiente |
| Menu principal | Pendiente |
| LIVE | Pendiente |
| Autorizaciones operativas | Pendiente |
| Reserva/pago | Pendiente |
| Restricciones por permisos | Pendiente |

## Usuarios/roles probados

| Rol | Resultado |
| --- | --- |
| Admin | Pendiente de evidencia visual |
| Vendedor | Pendiente de evidencia visual |
| Usuario sin permisos | Pendiente de evidencia visual |

## Backend LAN

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

## Validaciones

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS con 53 warnings preexistentes y 0 errores |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS |
| `backend/control-ropa/.mvnw.cmd test` | PASS, 125 tests, 0 failures, 0 errors |
| `git --no-pager diff --check` | PASS |
| `git --no-pager diff --cached --check` | PASS |

## Resultado

`PENDING_QA_VISUAL`

`PENDING_ROLE_SMOKE`

No se marca `APK_VISUAL_ROLE_SMOKE_OK` ni `APK_VISUAL_BASIC_OK`.
