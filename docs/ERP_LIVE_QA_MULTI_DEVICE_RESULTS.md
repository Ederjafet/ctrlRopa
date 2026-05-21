# ERP LIVE - Resultados QA multi-dispositivo

Fecha: 2026-05-20  
Fase: LIVE-T

## Resultado tecnico local

| Validacion | Resultado |
|---|---|
| Rama esperada | OK: `feature/live-t-lan-safearea-responsive-hardening` |
| Arbol limpio inicial | OK |
| Frontend LAN `192.168.0.128:8081` | OK: HTTP 200 |
| Backend health `192.168.0.128:8090/api/health` | OK: HTTP 200 |
| Conexion QA a frontend | OK: `ESTABLISHED` desde `192.168.0.149` hacia `8081` |
| Referencias `localhost/127.0.0.1` en frontend | OK: sin coincidencias en app/services/components/constants |
| Mojibake en app/services/components/constants/locales | OK: sin coincidencias |
| Login directo backend LAN con usuario QA | OK: `POST /api/auth/login` HTTP 200 |
| Preflight LAN antes de CORS | Detectado: `OPTIONS /api/auth/login` con origen `192.168.0.128:8081` devolvia 403 |
| CORS LAN | Ajustado para permitir `http://192.168.0.128:8081` en QA/dev |
| `npm run lint` | OK sin errores; 55 warnings historicos |
| `npx tsc --noEmit` | OK |
| `npx expo export --platform web` | OK |
| `.\mvnw.cmd test` | OK: `BUILD SUCCESS`, 28 tests |
| `git diff --check` | OK; solo avisos LF/CRLF |
| Mojibake en app/components/locales/docs | Solo coincidencias historicas documentales previas |

## Smoke QA externo pendiente

No se ejecuto desde el equipo QA fisico ni desde Android dentro de esta sesion despues del ajuste CORS. Queda pendiente validar:

- login,
- En vivo,
- reservas,
- producto activo,
- navegacion,
- cambio idioma,
- regreso desde crear cliente.

## Decision

`GO tecnico` para demo multi-dispositivo base con CORS LAN y safe area reforzados.  
`GO runtime QA` condicionado a reiniciar/desplegar backend con el ajuste CORS y repetir smoke fisico desde equipo QA, Android y tablet.
