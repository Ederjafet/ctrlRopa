# ERP LIVE - Validacion demo candidate

Fecha: 2026-05-20  
Fase: LIVE-R - smoke demo candidate

## Objetivo

Validar que `En vivo` puede avanzar como demo candidate estable desde frontend, sin tocar backend, APIs, migraciones, pagos reales, ventas, reportes, SQL, realtime, IA ni integraciones externas.

## Prechecks tras reinicio abrupto

| Validacion | Resultado |
|---|---|
| Rama actual | `feature/live-r-smoke-demo-candidate` |
| `git status --short` inicial | Limpio |
| Puerto `8081` | Libre antes de iniciar |
| Procesos `node` colgados | No detectados |
| Expo web `8081` | Levanto y respondio `HTTP 200` |

## Validacion tecnica ejecutada

| Comando | Resultado |
|---|---|
| `npm.cmd run lint` | OK sin errores; persisten 55 warnings historicos fuera del alcance |
| `npx.cmd tsc --noEmit` | OK |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | OK |
| `git diff --check` | OK; solo avisos LF/CRLF |
| `rg -n "Ã\|Â\|�" app components locales docs` | Solo coincidencias historicas documentales previas |
| `rg -n "Live\|Dashboard\|Timeline" app components locales/es/common.json` | Coincidencias por nombres internos/legacy fuera de LIVE; valores visibles LIVE en espanol no usan esos terminos |

## Rutas web validadas

| Ruta | Resultado |
|---|---|
| `http://localhost:8081/` | 200 |
| `http://localhost:8081/login` | 200 |
| `http://localhost:8081/live` | 200 |

## Resultado por alcance

| Area | Estado |
|---|---|
| Mobile Android | `GO condicionado`: safe area aplicado en codigo; falta captura en dispositivo fisico |
| Tablet | `GO condicionado`: layout y header preparados; falta validacion tactil en Galaxy Tab/iPad |
| Desktop | `GO tecnico`: export y rutas web OK; falta smoke visual con sesion real |

## Decision

`GO tecnico` para demo candidate frontend.

`GO demo candidate condicionado` hasta ejecutar smoke visual fisico o navegador con evidencia en mobile/tablet/desktop.

## Pendientes

- Captura real Android donde se confirme que el header no se empalma con status bar.
- Captura tablet horizontal 1024x768 y 1280x800.
- Flujo funcional completo con backend QA activo: login, dashboard, En vivo, reserva, cobro, regreso y cierre.
