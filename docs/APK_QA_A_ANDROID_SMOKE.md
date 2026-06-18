# APK-QA-A / Smoke real de APK instalado en Android

## Resumen ejecutivo

APK-QA-A documenta el smoke real del APK Android generado en APK-RC1.

Resultado:

- `APK_INSTALLED_OK`
- `APK_CONNECTION_OK`
- `PENDING_QA_VISUAL`
- `PENDING_ROLE_SMOKE`

La evidencia manual confirmada por el usuario cubre descarga, instalacion, apertura de la app y entrada/login desde APK instalado. No se uso Expo Go ni Metro para abrir la app.

## APK probado

- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil EAS: `preview-apk`
- Estado build: `FINISHED`
- Distribucion: `INTERNAL`
- Fase origen: `APK-RC1`
- Commit origen: `97e13d1 APK-RC1 prepara build android apk`

## Evidencia manual confirmada

| Prueba | Resultado | Evidencia |
| --- | --- | --- |
| APK descargado desde artefacto EAS | OK | Confirmado por usuario |
| APK instalado en dispositivo Android | OK | Confirmado por usuario |
| App abre desde APK instalado | OK | Confirmado por usuario |
| Usuario puede entrar a la app | OK | Confirmado por usuario |
| No depende de Expo Go | OK | Confirmado por usuario |
| No depende de Metro | OK | Confirmado por usuario |

## Backend LAN

Validacion desde PC:

| Endpoint | Resultado |
| --- | --- |
| `http://localhost:8090/api/health` | `HTTP 200` |
| `http://192.168.0.128:8090/api/health` | `HTTP 200` |

Como la app instalada permite entrar y el backend LAN responde correctamente, esta fase documenta `APK_CONNECTION_OK`.

## Pantallas probadas

Probado y confirmado:

- Instalacion APK.
- Apertura de app instalada.
- Entrada/login a la app.

Pendiente por falta de evidencia visual adicional:

- Screenshots.
- Home.
- Menu principal.
- LIVE.
- Autorizaciones operativas.
- Pago/reserva.
- Login vendedor.
- Restricciones por permisos.
- Cierre de sesion.

## Configuracion movil/API auditada

La auditoria de configuracion confirma que existe soporte previo para API LAN:

- `EXPO_PUBLIC_API_HOST`
- `EXPO_PUBLIC_API_PORT`
- `EXPO_PUBLIC_API_BASE_URL`
- perfil EAS `preview-apk`
- `android.buildType: apk`

No se realizaron cambios de configuracion en esta fase.

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

## Riesgos y pendientes

- No hay screenshots adjuntos, por lo que no se marca QA visual completo.
- No se probaron roles vendedor/sin permisos en APK instalado.
- No se probo smoke funcional profundo de LIVE, pagos, reservas ni autorizaciones desde APK.
- La URL del artefacto EAS puede expirar segun politica de EAS.

## Resultado

`APK_INSTALLED_OK`

`APK_CONNECTION_OK`

`PENDING_QA_VISUAL`

`PENDING_ROLE_SMOKE`

Siguiente fase recomendada: QA Android B con checklist visual por screenshots y smoke por roles desde APK instalado.
