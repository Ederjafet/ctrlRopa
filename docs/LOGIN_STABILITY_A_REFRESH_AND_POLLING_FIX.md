# LOGIN-STABILITY-A / Estabilidad de login y polling

Fecha: 2026-06-18

## Resumen

Se diagnostico una inestabilidad visible en `/login` y llamadas repetidas observadas en backend a endpoints de sesion, apariencia, LIVE, reservas, pagos y autorizaciones.

La correccion aplicada es minima y frontend-only. No se tocaron backend, base de datos, migraciones, apartados, paquetes, envios, cobros nuevos, LIVE funcional, APK ni EAS.

## Evidencia observada

Logs reportados durante la investigacion:

- `GET /api/me -> 200`
- `GET /api/lives/branch/4 -> 200`
- `GET /api/lives/22/events -> 200`
- `GET /api/reservations/branch/4 -> 200`
- `GET /api/payments/reservation/{id} -> 200`
- `GET /api/operational-authorizations/branch/4 -> 200`
- `POST /api/auth/logout -> 200`
- `GET /api/appearance -> 200`

Interpretacion:

- LIVE tiene polling controlado en `app/live.tsx` y limpia intervalo con `clearInterval`.
- Home carga resumen LIVE una vez cuando hay sesion y permisos, con cancelacion al desmontar.
- Reservas, pagos y autorizaciones usan carga por foco o seleccion, no intervalos globales detectados.
- `/api/appearance` se consultaba desde providers globales y login usando el cliente autenticado por defecto.
- Al usar cliente autenticado, una consulta de apariencia podia disparar validacion previa a `/api/me`.

## Causa encontrada

La causa probable principal era la combinacion de:

1. `getAppearanceSettings()` usaba `apiRequest('/api/appearance')` con `includeSession` por defecto.
2. `apiRequest` validaba sesion contra `/api/me` antes de casi cualquier endpoint autenticado.
3. Login y `AppThemeProvider` podian solicitar apariencia en la misma carga.
4. El layout raiz podia hacer `router.replace('/login')` al reactivar la app incluso si ya estaba en `/login`.

Eso no era un polling funcional de LIVE desde login, pero si podia producir revalidaciones y re-render visibles en la pantalla de login, especialmente despues de logout o con sesion local stale.

## Archivos modificados

- `services/appearanceService.ts`
- `services/apiClient.ts`
- `app/login.tsx`
- `app/_layout.tsx`

## Correccion aplicada

1. `GET /api/appearance` ahora se ejecuta sin sesion (`includeSession: false`).
2. `/api/appearance` queda excluido de la revalidacion previa contra `/api/me`.
3. `getAppearanceSettings()` ahora deduplica peticiones concurrentes y cachea el resultado por 5 minutos.
4. `updateAppearanceSettings()` actualiza la cache local despues de guardar cambios de branding.
5. Login cancela el `setLogoUrl` si la pantalla se desmonta antes de terminar la carga.
6. El layout raiz evita `router.replace('/login')` redundante cuando la ruta actual ya es `/login`.

## Pollings revisados

- `app/live.tsx`: existe polling de vista LIVE con `setInterval`, condicionado a permiso/actor y con `clearInterval`.
- `app/index.tsx`: carga resumen LIVE solo con sesion, branch y permiso; no usa intervalos.
- `app/operational-authorizations.tsx`: carga por foco; no usa intervalo.
- `app/reservations.tsx`: carga por foco; no usa intervalo.
- `app/payments.tsx`: detectado patron N+1 potencial al consultar pagos por reserva de una orden, pero queda fuera de este fix porque ocurre dentro de pantalla de pagos y requiere fase especifica.

## Validaciones ejecutadas

- `npm run lint`: PASS sin errores; quedan 53 warnings preexistentes en pantallas no tocadas.
- `npx tsc --noEmit`: PASS.

No se ejecuta `mvn test` porque no se toco backend.

## Smoke manual recomendado

Con backend y frontend levantados:

1. Abrir `http://localhost:8081/login`.
2. Abrir DevTools > Network con Preserve log.
3. Esperar 60 segundos sin escribir.
4. Confirmar que no hay refresh visual.
5. Confirmar que no se disparan llamadas LIVE/reservas/pagos/autorizaciones desde `/login`.
6. Confirmar que `/api/appearance` aparece una vez o de forma controlada.
7. Escribir correo y contrasena; confirmar que no se pierde texto.
8. Hacer login con usuario QA valido.
9. Hacer logout.
10. Esperar 60 segundos en `/login` y confirmar que no quedan pollings protegidos activos.

## Riesgos

- La cache de apariencia dura 5 minutos para reducir ruido en login; cambios hechos por otro cliente podrian tardar ese tiempo en reflejarse si no se fuerza recarga.
- Las llamadas N+1 de pagos por reserva se documentan como hallazgo tecnico separado y no se corrigen en esta fase.

## GO / NO-GO

GO_TECNICO si lint y TypeScript pasan.

PENDING_SMOKE_MANUAL hasta confirmar visualmente en navegador que `/login` permanece estable durante 60 segundos antes y despues de logout.
