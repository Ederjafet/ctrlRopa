# APK-QA-B / Smoke Android real con screenshots y roles desde APK instalado

## Resumen ejecutivo

APK-QA-B documenta el intento de cierre de smoke Android por roles desde el APK instalado.

Resultado:

- `APK_ANDROID_BASIC_OK`
- `PENDING_QA_VISUAL`
- `PENDING_ROLE_SMOKE`

No se encontraron screenshots en `qa-evidence/APK-QA-B/android/` ni evidencia visual nueva para validar pantallas/roles adicionales. Se conserva como evidencia confirmada lo ya declarado por el usuario en APK-QA-A: APK descargado, instalado, app abre, usuario puede entrar y ya no depende de Expo Go ni Metro.

## APK probado

- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build EAS: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil EAS: `preview-apk`
- Fase origen: `APK-RC1`
- Commit APK-RC1: `97e13d1 APK-RC1 prepara build android apk`
- Commit APK-QA-A: `58e2131 APK-QA-A documenta smoke android`

## Backend LAN

Validado desde PC durante APK-QA-B:

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

## Evidencia visual disponible

Auditoria local:

- `qa-evidence/APK-QA-B/android/`: no existe o no contiene archivos.
- `qa-evidence/`: solo se encontro evidencia previa de `PRODUCT-D4`.
- No se recibieron screenshots nuevos en esta fase.

Resultado visual: `PENDING_QA_VISUAL`.

## Checklist

| Punto | Resultado | Fuente |
| --- | --- | --- |
| APK instalado | OK | Confirmado previamente por usuario en APK-QA-A |
| App abre | OK | Confirmado previamente por usuario en APK-QA-A |
| Login/entrada | OK | Confirmado previamente por usuario en APK-QA-A |
| Login admin | Pendiente | Sin screenshot/evidencia nueva |
| Home admin | Pendiente | Sin screenshot/evidencia nueva |
| Menu principal | Pendiente | Sin screenshot/evidencia nueva |
| LIVE admin | Pendiente | Sin screenshot/evidencia nueva |
| Autorizaciones operativas admin | Pendiente | Sin screenshot/evidencia nueva |
| Reserva/pago desde APK | Pendiente | Sin screenshot/evidencia nueva |
| Cierre de sesion | Pendiente | Sin screenshot/evidencia nueva |
| Login vendedor | Pendiente | Sin screenshot/evidencia nueva |
| LIVE vendedor | Pendiente | Sin screenshot/evidencia nueva |
| Restriccion de permisos vendedor | Pendiente | Sin screenshot/evidencia nueva |
| Usuario sin permisos | Pendiente | Sin screenshot/evidencia nueva |
| Error de conexion | No observado | Backend LAN responde 200; sin evidencia de error |

## Roles

No se puede marcar smoke por roles como aprobado porque no hay evidencia visual o manual nueva para:

- Admin.
- Vendedor.
- Usuario sin permisos.

Resultado por roles: `PENDING_ROLE_SMOKE`.

## Configuracion movil/API auditada

La auditoria confirma que la base ya contiene configuracion movil/LAN documentada:

- `EXPO_PUBLIC_API_HOST`.
- `EXPO_PUBLIC_API_PORT`.
- `EXPO_PUBLIC_API_BASE_URL`.
- Perfil EAS `preview-apk`.
- `android.buildType: apk`.

No se cambio configuracion Android/EAS en esta fase.

## Alcance no tocado

No se modifico:

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

## Riesgos y pendientes

- Falta evidencia visual real de Android instalado.
- Falta smoke por roles desde APK instalado.
- Falta captura de Home, menu principal, LIVE, autorizaciones operativas y pago/reserva.
- No se puede declarar `APK_ANDROID_ROLE_SMOKE_OK` sin screenshots o evidencia manual especifica por rol.

## Resultado

`APK_ANDROID_BASIC_OK`

`PENDING_QA_VISUAL`

`PENDING_ROLE_SMOKE`

Siguiente fase recomendada: repetir APK-QA-B cuando existan screenshots en `qa-evidence/APK-QA-B/android/` o una confirmacion manual detallada por pantalla y rol.
