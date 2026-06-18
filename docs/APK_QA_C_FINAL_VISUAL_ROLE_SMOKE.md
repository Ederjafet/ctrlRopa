# APK-QA-C / QA visual final desde APK instalado con roles

## Resumen ejecutivo

APK-QA-C audito la evidencia visual esperada para cerrar el pendiente del release LIVE con APK Android instalado.

Resultado:

- `PENDING_QA_VISUAL`
- `PENDING_ROLE_SMOKE`

No se encontraron screenshots en `qa-evidence/APK-QA-C/android/` ni evidencia visual nueva de roles. Por lo tanto, no se marca `APK_VISUAL_ROLE_SMOKE_OK`, no se marca `APK_VISUAL_BASIC_OK` y no se inventa `QA_PASS`.

## 1. APK probado

- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Origen: `APK-RC1`
- Estado previo confirmado: APK descargado, instalado, app abre y login/entrada funciona segun APK-QA-A.

## 2. Build ID

- Build EAS: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil: `preview-apk`
- Distribucion: `INTERNAL`

## 3. Backend LAN

Validado desde PC durante APK-QA-C:

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

## 4. Screenshots encontrados

Auditoria local:

| Ruta | Resultado |
| --- | --- |
| `qa-evidence/` | Solo contiene `qa-evidence/PRODUCT-D4/README.md` |
| `qa-evidence/APK-QA-C/android/` | No existe o no contiene archivos |

No hay screenshots disponibles para APK-QA-C.

## 5. Pantallas validadas

No se validaron pantallas nuevas por evidencia visual en esta fase.

Se conserva evidencia previa de APK-QA-A:

- APK instalado.
- App abre.
- Usuario puede entrar/login.

Pendiente por falta de screenshots:

- Home.
- Menu principal.
- LIVE.
- Autorizaciones operativas.
- Reserva/pago.
- Restricciones por permisos.

## 6. Roles validados

No se validaron roles nuevos por evidencia visual en esta fase.

## 7. Roles pendientes

- Admin.
- Vendedor.
- Usuario sin permisos.
- Restricciones por permisos.

Resultado: `PENDING_ROLE_SMOKE`.

## 8. Hallazgos

- No hay evidencia visual local para APK-QA-C.
- Backend LAN sigue disponible.
- No se detecto error critico reproducible de APK durante esta auditoria documental.

## 9. Riesgos

- El release LIVE sigue condicionado por falta de screenshots.
- No se puede afirmar validacion visual de Home, LIVE, autorizaciones ni pago/reserva.
- No se puede afirmar validacion por roles desde APK instalado.

## 10. Resultado GO/NO-GO

Resultado: `PENDING_QA_VISUAL` y `PENDING_ROLE_SMOKE`.

No hay `NO_GO_APK` porque no se detecto error critico reproducible, pero tampoco hay evidencia suficiente para cerrar visual/roles.

Siguiente paso recomendado: recopilar screenshots reales en `qa-evidence/APK-QA-C/android/` y repetir esta fase.
