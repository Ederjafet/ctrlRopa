# ERP LIVE-D - Smoke visual i18n UX

Fecha: 2026-05-18  
Rama: `feature/live-d-smoke-visual-i18n-ux`

## Objetivo

Validar visualmente el flujo LIVE con i18n ES/EN y UX normalizada antes de avanzar a metricas runtime, Facebook o flujos comerciales.

## Alcance

- Frontend web Expo.
- Pantalla `app/live.tsx`.
- Selector de idioma ES/EN.
- Textos i18n de `locales/es/common.json` y `locales/en/common.json`.
- Smoke base de rutas relacionadas: login, dashboard, customers, items y batches.

## Fuera de alcance

- Backend Java.
- Migraciones Flyway.
- Ventas.
- Pagos.
- Reportes.
- Reservaciones.
- Integracion Facebook/Meta.
- Instalacion de paquetes.

## Validaciones Tecnicas Ejecutadas

| Validacion | Resultado | Evidencia |
|---|---|---|
| Rama esperada | OK | `feature/live-d-smoke-visual-i18n-ux` |
| `git status --short` inicial | OK | Arbol limpio |
| Puerto `8081` libre antes de iniciar | OK | `netstat -ano \| findstr :8081` sin salida |
| `npm run lint` | OK con warnings | 0 errores, 55 warnings preexistentes fuera del alcance |
| `npx tsc --noEmit` | OK | Sin errores |
| `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | OK | Exporto 71 rutas, incluyendo `/live`, `/customers`, `/items`, `/batches`, `/dashboard` y `/login` |
| Busqueda de mojibake en LIVE/locales | OK | `rg -n "Ã\|Â\|�" app\live.tsx locales\es\common.json locales\en\common.json` sin coincidencias |

## Intento de Runtime Web

Se intento levantar Expo con:

```powershell
npx expo start --web --port 8081
npm run web
```

Resultado observado:

- `npx expo start --web --port 8081` no dejo servidor accesible en `http://localhost:8081`.
- `npm run web` llego a iniciar Metro, pero mostro advertencia de permisos al escribir en `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- Despues del arranque, `http://localhost:8081/live` no quedo disponible desde esta sesion.
- No quedaron procesos `node`, `npm` o `npx` abiertos al cierre de la validacion.

## Smoke Visual Pendiente

No se pudo completar smoke visual en navegador real desde esta sesion porque el servidor web no quedo escuchando en `8081`.

Checklist pendiente cuando el ambiente QA web este levantado:

- Login.
- Dashboard.
- LIVE.
- Selector ES/EN.
- Estado operativo LIVE.
- Mensajes de siguiente paso.
- Confirmacion de activar live.
- Confirmacion de cerrar live.
- Customers abre.
- Items abre.
- Batches abre.
- Sin mojibake.
- Sin errores JS criticos.

## Hallazgos

- No se detectaron errores de TypeScript ni errores de lint asociados a LIVE-D.
- El export web confirma que `/live` y rutas base se empaquetan correctamente.
- Persiste un bloqueo ambiental para smoke visual real en `8081`.
- Persiste warning operativo de escritura de log frontend en `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.

## Riesgos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| No hay evidencia visual real de navegador en esta fase | MEDIO | Repetir smoke en maquina QA con Expo web levantado y capturar evidencia |
| Permiso de escritura de log frontend bloquea evidencia operacional | MEDIO | Revisar permisos de `C:\HPSQ-SOFT\control-ropa\logs\frontend` o ejecutar como usuario con acceso |
| LIVE visualmente compila, pero no se valido click real ES/EN | MEDIO | Ejecutar checklist visual antes de metricas/Facebook |

## Decision

`NO-GO visual pendiente` para cerrar LIVE-D como validado en navegador real.

`GO tecnico` para build/export frontend: lint sin errores, TypeScript OK y export web OK.

No se corrige codigo en esta fase porque no se detecto falla funcional de LIVE/i18n; el bloqueo observado es de arranque/acceso runtime local.
