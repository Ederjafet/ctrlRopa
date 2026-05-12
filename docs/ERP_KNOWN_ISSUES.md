# ERP - Known issues

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Registrar defectos conocidos, riesgos aceptados y workarounds antes de aprobar un release candidate.

## Issues conocidos

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|
| KI-001 | Release/Git | `SEV-3` | No incluir artefactos no rastreados en release; decidir limpiar/ignorar antes de RC. | Puede confundir el diff y el paquete de release. | Abierto | Release Manager | No, salvo que afecte build |
| KI-002 | Backend/Health | `SEV-2` | Validado por runtime: `curl -i http://localhost:8090/api/health` devuelve `HTTP/1.1 200 OK`. | El bloqueo original por token fue corregido y validado; `/api/health` ya no responde 401. | Resuelto validado | Backend Lead / Release Manager | No |
| KI-003 | Frontend/Web | `SEV-1` | Frontend QA responde en `http://localhost:8081`; rutas base `/login`, `/dashboard`, `/customers`, `/items`, `/batches`, `/reports`, `/users`, `/system-roles` devuelven `200` salvo rutas inexistentes como `/inventory`. Falta evidencia visual interactiva completa y quedan bloqueos `KI-007/KI-008`. | La disponibilidad web avanzo, pero el RC visual no queda aprobado. | En validacion | Frontend Lead / QA Director | Si, hasta resolver evidencia visual |
| KI-004 | Dataset QA/Permisos | `SEV-2` | Validado manualmente en runtime: `qa.sinpermisos@local.test` inicia sesion y queda sin accesos operativos. | El smoke negativo de permisos ya puede ejecutarse. | Resuelto validado | QA/Data Owner | No |
| KI-005 | Dataset QA/Roles | `SEV-2` | Validado manualmente en runtime: `qa.reportes@local.test` y `qa.soporte@local.test` inician sesion con accesos esperados. | La validacion de reportes y soporte tecnico ya puede continuar. | Resuelto validado | QA/Data Owner | No |
| KI-006 | Backend/Health mapping runtime | `SEV-2` | Validado por runtime: `curl -i http://localhost:8090/api/health` devuelve `HTTP/1.1 200 OK` con JSON `status=OK`. Causa raiz del 404 anterior: validacion contra puerto incorrecto `8080`; el puerto correcto del backend QA es `8090`. | Smoke tecnico backend desbloqueado. | Resuelto validado | Backend Lead / Release Manager | No |
| KI-007 | Frontend/Textos visibles | `SEV-2` | Corregir textos con codificacion rota en pantallas web antes de RC visual. Evidencia en `/login`: `Iniciar sesiÃ³n`, `ContraseÃ±a`; `/reports` tambien contiene mojibake. | Texto visible no legible/profesional para usuario operativo; afecta login y calidad UX. | Abierto | Frontend Lead / UX Lead | Si |
| KI-008 | Frontend/Arranque QA | `SEV-2` | Corregir permisos/ruta de log de `scripts/start-web-logs.ps1` o agregar fallback seguro. Workaround temporal: levantar con `npx.cmd expo start --web --port 8081`. | `npm run web` falla por `Acceso denegado` al escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`, dificultando QA repetible. | Abierto | Frontend Lead / Release Manager | Si, salvo workaround aprobado |

## Plantilla

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|

## Reglas

- Todo `SEV-1` bloquea release.
- Todo `SEV-2` requiere workaround aprobado para no bloquear.
- Todo issue aceptado temporalmente debe tener responsable y fecha de revision.
- No usar known issues para normalizar fallas de dinero, seguridad o datos.
