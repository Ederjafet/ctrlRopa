# RELEASE-LIVE-GO / Handoff de entrega

## Que entregar

- APK Android interno.
- Documentacion de release.
- Checklist QA manual.
- Evidencia de backend LAN.
- Lista de pendientes reales.

## APK

- URL: `https://expo.dev/artifacts/eas/l_IlEZtHvOu4wJ2gIlOKMhJaP9AGzrfJs6LXKwse4sw.apk`
- Build ID: `f9e59a44-6fa7-4c13-bd8f-9d1dafc7318b`
- Perfil: `preview-apk`
- Distribucion: `INTERNAL`

## Usuarios QA sugeridos

Usar usuarios QA documentados, sin imprimir passwords ni tokens:

- `qa.admin@local.test`
- `qa.supervisor.centro@local.test`
- `qa.vendedor.centro@local.test`
- `qa.sinpermisos@local.test`

Si alguna credencial no esta disponible en el ambiente local, documentar bloqueo y no inventar password.

## Instalacion

1. Descargar el APK desde la URL de EAS.
2. Instalar en Android.
3. Confirmar que la app abre desde el icono instalado.
4. Confirmar que no se usa Expo Go.
5. Confirmar que no se usa Metro.

## Smoke minimo

1. Abrir app instalada.
2. Login admin.
3. Home.
4. Menu principal.
5. LIVE.
6. Autorizaciones operativas.
7. Reserva/pago si hay dataset seguro.
8. Cierre de sesion.
9. Login vendedor.
10. Validar restricciones de vendedor.
11. Login usuario sin permisos o validacion de bloqueo.

## Validar backend

Desde PC:

```powershell
curl.exe -i http://localhost:8090/api/health
curl.exe -i http://192.168.0.128:8090/api/health
```

Resultado esperado: `HTTP 200`.

Desde Android, si hay problema de conexion:

- Confirmar que el telefono esta en la misma red LAN.
- Confirmar que el backend escucha en `192.168.0.128:8090`.
- Confirmar firewall Windows.
- Confirmar que la app no esta apuntando a `localhost`.
- Revisar `.env`/build usado si se genera un APK nuevo.

## Evidencias a pedir

- Screenshot de login.
- Screenshot de Home.
- Screenshot de menu principal.
- Screenshot de LIVE admin.
- Screenshot de autorizaciones operativas.
- Screenshot de pago/reserva si aplica.
- Screenshot de LIVE vendedor.
- Screenshot de bloqueo o restriccion.
- Screenshot de usuario sin permisos.
- Nota del dispositivo usado.
- Fecha/hora de prueba.

## Criterios de aceptacion

Aceptar como release interno condicionado si:

- APK instala.
- APK abre.
- Login funciona.
- Backend LAN responde.
- No hay error critico reproducible.
- Pendientes visuales/roles quedan documentados.

Aceptar como release completo solo si:

- Hay screenshots reales.
- Hay smoke por roles.
- Admin, vendedor y sin permisos quedan validados.
- No hay regresion critica de LIVE, pagos, precio ni autorizaciones.

Rechazar si:

- APK no instala o no abre.
- Login falla por conexion o error funcional.
- Backend LAN no responde.
- Vendedor accede a acciones no permitidas.
- Usuario sin permisos opera LIVE/pagos/autorizaciones.
- Pago/reserva descuadra datos.

## Actualizacion 2026-06-16 - APK-QA-C

Se intento cerrar el pendiente visual revisando `qa-evidence/APK-QA-C/android/`, pero no se encontraron screenshots.

El handoff mantiene como requisito pedir evidencia visual real antes de aceptar el release como completo.
