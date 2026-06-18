# RELEASE-LIVE-GO / Cierre formal de release LIVE con APK Android

## 1. Resumen ejecutivo

RELEASE-LIVE-GO consolida el estado real del release LIVE con APK Android generado, instalado y probado de forma basica.

Resultado:

- `RELEASE_GO_CONDICIONADO`
- `PENDING_QA_VISUAL`
- `PENDING_ROLE_SMOKE`

El release queda tecnicamente listo para entrega controlada interna, con APK Android disponible y smoke basico confirmado. No se declara `QA_PASS` completo porque faltan screenshots, evidencia visual completa y smoke por roles desde APK instalado.

## 2. Alcance del release

Incluido:

- LIVE base.
- Permisos LIVE minimos.
- Control de prenda al aire.
- Inventario/reservas con atomicidad, idempotencia, constraint y trazabilidad.
- Cancelacion segura de reservas.
- Vendido operativo LIVE.
- Autorizaciones operativas LIVE.
- Cambio de precio LIVE autorizado.
- Pago minimo para apartados LIVE.
- Card de LIVE activo en home.
- APK Android interno generado con EAS.
- Smoke Android basico.

Excluido:

- QA visual completo con screenshots.
- Smoke completo por roles desde APK instalado.
- Validacion de usuario sin permisos desde APK.
- Release en tienda.
- Caja productiva completa.
- Devoluciones productivas sobre pagos LIVE.
- Venta financiera real desde LIVE.

## 3. APK generado y build EAS

- APK: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil: `preview-apk`
- Estado: `FINISHED`
- Distribucion: `INTERNAL`
- Commit APK-RC1: `97e13d1 APK-RC1 prepara build android apk`

## 4. Instalacion Android

Estado confirmado por evidencia manual del usuario:

- APK descargado: OK.
- APK instalado: OK.
- App abre desde APK: OK.
- Usuario puede entrar/login: OK.
- No depende de Expo Go.
- No depende de Metro.

## 5. Estado de smoke APK

| Fase | Resultado |
| --- | --- |
| APK-RC1 | `APK_BUILD_OK` |
| APK-QA-A | `GO_TECNICO_ANDROID_SMOKE`, `APK_INSTALLED_OK`, `APK_CONNECTION_OK` |
| APK-QA-B | `APK_ANDROID_BASIC_OK`, `PENDING_QA_VISUAL`, `PENDING_ROLE_SMOKE` |

No se marca `APK_ANDROID_ROLE_SMOKE_OK` porque no hay evidencia nueva por roles.

## 6. Funcionalidades cerradas

### LIVE base

La base LIVE queda consolidada por `RELEASE-LIVE-BASE-RC1` con resultado tecnico `GO_TECNICO_RC` y pendiente visual.

### Permisos LIVE

Se implementaron permisos minimos LIVE y correccion de enforcement para retirar prenda al aire, incluyendo validacion donde seller sin `REMOVE_LIVE_ACTIVE_ITEM` queda bloqueado por backend.

### Reservas e inventario

Incluye:

- Solo prendas `AVAILABLE` pueden ponerse al aire.
- Reserva atomica `AVAILABLE -> RESERVED`.
- Idempotencia por `X-Idempotency-Key`.
- Constraint de reserva activa por item.
- Trazabilidad de rechazos.
- Cancelacion/liberacion segura.

### Autorizacion operativa

Existe backend y UI minima para autorizaciones operativas. Apply real se mantiene controlado para `UNDO_LIVE_OPERATIONAL_SALE` segun alcance documentado.

### Cambio de precio LIVE

Existe cambio de precio LIVE autorizado sobre `reservations.price`, sin tocar `items.price`, `sales.price`, pagos, caja ni venta financiera.

### Pago minimo LIVE

Existe pago minimo de apartados LIVE usando pagos por reserva. El flujo no convierte la reserva a venta ni toca caja como cierre financiero completo.

### APK Android

APK generado por EAS con perfil `preview-apk`, instalado y abierto en Android con login/entrada confirmados.

## 7. Evidencia disponible

- `docs/APK_RC1_ANDROID_BUILD.md`
- `docs/APK_QA_A_ANDROID_SMOKE.md`
- `docs/APK_QA_B_ANDROID_ROLE_SMOKE.md`
- `qa-reports/APK-RC1-android-build-report-20260610-190254.md`
- `qa-reports/APK-QA-A-android-smoke-report-20260610-194242.md`
- `qa-reports/APK-QA-B-android-role-smoke-report-20260610-195432.md`
- `docs/PAY_LIVE_A_MINIMAL_LIVE_PAYMENT.md`
- `docs/PAY_LIVE_B_VISUAL_PAYMENT_QA.md`
- `docs/LIVE_PRICE_D_PRICE_QA.md`
- `docs/LIVE_AUTH_B3_OPERATIONAL_AUTHORIZATIONS_QA.md`
- `docs/RELEASE_LIVE_BASE_RC1.md`

## 8. Pendientes reales

- Screenshots reales desde APK instalado.
- Smoke visual completo.
- Smoke por roles desde APK instalado.
- Validacion con vendedor.
- Validacion con usuario sin permisos.
- Validacion de Home, menu principal, LIVE, autorizaciones y pagos/reservas con capturas.
- Validacion de cliente final en su red/dispositivo real.

## 9. Riesgos aceptados

- Entrega interna controlada con `PENDING_QA_VISUAL`.
- Entrega interna controlada con `PENDING_ROLE_SMOKE`.
- APK de distribucion interna, no firmado como release de tienda.
- URL de artefacto EAS puede expirar.

## 10. Riesgos no aceptados

- No liberar como release productivo final sin screenshots y smoke por roles.
- No declarar `QA_PASS` completo.
- No declarar cobertura de usuario sin permisos desde APK.
- No declarar pruebas de pagos/caja/devoluciones productivas completas.

## 11. Rollback

Si el APK instalado presenta fallo critico:

1. Detener distribucion del APK interno.
2. Conservar APK, build ID y logs EAS para diagnostico.
3. Revertir el merge de la rama de release en develop si ya fue integrado y se confirma regresion documental/configuracional.
4. Si la regresion es funcional, abrir fase de fix focalizado sobre el modulo afectado.
5. No borrar datos ni migraciones sin plan explicito.

El rollback de migraciones previas de LIVE/autorizaciones/precio/pagos debe tratarse como operacion de base de datos con plan especifico; no se recomienda rollback manual destructivo.

## 12. Guia de instalacion APK

1. Descargar el APK desde el artefacto EAS.
2. Transferirlo al dispositivo Android o abrir la URL desde el dispositivo.
3. Permitir instalacion desde fuente confiable si Android lo solicita.
4. Instalar.
5. Abrir la app desde el icono instalado.
6. Confirmar que no se usa Expo Go ni Metro.
7. Validar backend LAN con `http://192.168.0.128:8090/api/health`.
8. Entrar con usuario QA definido sin compartir secretos en evidencia.

## 13. Checklist QA manual

- Captura de pantalla de app instalada.
- Captura de login.
- Captura de Home.
- Captura de menu principal.
- Captura de LIVE como admin.
- Captura de autorizaciones operativas.
- Captura de pago/reserva si el dataset es seguro.
- Cierre de sesion.
- Login vendedor.
- LIVE vendedor.
- Validacion de restricciones de vendedor.
- Usuario sin permisos.
- Evidencia de error o ausencia de error de conexion.

## 14. Criterio GO/NO-GO

GO condicionado:

- APK generado e instalado.
- App abre desde APK.
- Login/entrada confirmado.
- Backend LAN responde.
- Validaciones tecnicas pasan.
- Pendientes visuales y por rol quedan documentados.

NO-GO:

- APK no instala.
- APK no abre.
- Login falla por conexion o error funcional reproducible.
- Backend LAN no responde.
- Se detecta regresion critica en pagos/LIVE/autorizaciones.

## 15. Siguiente paso recomendado

Ejecutar `RELEASE-LIVE-GO-QA-VISUAL` o fase equivalente con screenshots reales desde Android instalado y smoke por roles admin/vendedor/sin permisos.

## Actualizacion 2026-06-16 - APK-QA-C

APK-QA-C audito `qa-evidence/APK-QA-C/android/` y no encontro screenshots ni evidencia visual nueva por roles.

Estado actualizado:

- `PENDING_QA_VISUAL`.
- `PENDING_ROLE_SMOKE`.
- Sin `NO_GO_APK` porque no se detecto error critico reproducible.
