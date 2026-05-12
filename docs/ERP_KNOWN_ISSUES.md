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
| KI-003 | Frontend/Web | `SEV-1` | Frontend QA responde en `http://localhost:8081`; rutas base validadas en Fase 1K: `/login`, `/`, `/reports`, `/branches`, `/system-roles` devuelven `200` y contenido UTF-8 sin mojibake al decodificar runtime. | RC visual queda tecnicamente desbloqueado; release final aun requiere evidencia formal completa y checklist RC. | Resuelto validado | Frontend Lead / QA Director | No |
| KI-004 | Dataset QA/Permisos | `SEV-2` | Validado manualmente en runtime: `qa.sinpermisos@local.test` inicia sesion y queda sin accesos operativos. | El smoke negativo de permisos ya puede ejecutarse. | Resuelto validado | QA/Data Owner | No |
| KI-005 | Dataset QA/Roles | `SEV-2` | Validado manualmente en runtime: `qa.reportes@local.test` y `qa.soporte@local.test` inician sesion con accesos esperados. | La validacion de reportes y soporte tecnico ya puede continuar. | Resuelto validado | QA/Data Owner | No |
| KI-006 | Backend/Health mapping runtime | `SEV-2` | Validado por runtime: `curl -i http://localhost:8090/api/health` devuelve `HTTP/1.1 200 OK` con JSON `status=OK`. Causa raiz del 404 anterior: validacion contra puerto incorrecto `8080`; el puerto correcto del backend QA es `8090`. | Smoke tecnico backend desbloqueado. | Resuelto validado | Backend Lead / Release Manager | No |
| KI-007 | Frontend/Textos visibles | `SEV-2` | Validado en Fase 1K: los fuentes visibles revisados estan en UTF-8 y las rutas `/login`, `/`, `/reports`, `/branches`, `/system-roles` devuelven HTML que decodifica sin patrones `Ã`, `Â`, `â€` ni `�`. | Texto visible desbloqueado para smoke visual inicial; queda pendiente evidencia visual final por navegador en checklist RC. | Resuelto validado | Frontend Lead / UX Lead | No |
| KI-008 | Frontend/Arranque QA | `SEV-2` | `scripts/start-web-logs.ps1` ahora usa home temporal de Expo en `%TEMP%\control-ropa-expo-home` y no detiene el arranque si no puede escribir `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`; continua en consola. | `npm run web` levanta Metro hasta `Waiting on http://localhost:8081`; el log en C: sigue pendiente de permisos Windows, pero ya no bloquea QA. | Resuelto validado | Frontend Lead / Release Manager | No |

## Plantilla

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|

## Reglas

- Todo `SEV-1` bloquea release.
- Todo `SEV-2` requiere workaround aprobado para no bloquear.
- Todo issue aceptado temporalmente debe tener responsable y fecha de revision.
- No usar known issues para normalizar fallas de dinero, seguridad o datos.
