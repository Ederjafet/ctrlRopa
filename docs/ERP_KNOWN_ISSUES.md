# ERP - Known issues

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Registrar defectos conocidos, riesgos aceptados y workarounds antes de aprobar un release candidate.

## Issues conocidos

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|
| KI-001 | Release/Git | `SEV-3` | No incluir artefactos no rastreados en release; decidir limpiar/ignorar antes de RC. | Puede confundir el diff y el paquete de release. | Abierto | Release Manager | No, salvo que afecte build |
| KI-002 | Backend/Health | `SEV-2` | Correccion minima aplicada en `ApiTokenFilter` para excluir `/api/health` de token; prueba automatizada agregada. Pendiente reiniciar/desplegar backend QA y repetir smoke tecnico runtime. | El smoke tecnico y monitoreo de release recibian 401 en `/api/health`. | En validacion | Backend Lead / Release Manager | Si, hasta validar runtime en QA |
| KI-003 | Frontend/Web | `SEV-1` | Levantar frontend QA y repetir smoke visual antes de RC. | No hay evidencia de navegacion principal ni UX web desde `localhost:8081`. | Abierto | Frontend Lead / QA Director | Si |
| KI-004 | Dataset QA/Permisos | `SEV-2` | Ejecutar `docs/qa/05-fix-usuarios-qa-login.sql` en QA y repetir `SMK-SEC-01`. | No se puede validar acceso denegado con `qa.sinpermisos@local.test`; causa probable: password/bloqueo/login security desalineado en dataset QA. | En validacion | QA/Data Owner | Si, hasta validar login real en QA |
| KI-005 | Dataset QA/Roles | `SEV-2` | Ejecutar `docs/qa/05-fix-usuarios-qa-login.sql` en QA y repetir login de `qa.reportes@local.test` y `qa.soporte@local.test`. | No se valida perfil reportes ni soporte tecnico; causa probable: password/bloqueo/login security desalineado en dataset QA. | En validacion | QA/Data Owner | Si, hasta validar login real en QA |

## Plantilla

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|
| KI-___ |  | `SEV-1/2/3/4` |  |  | Abierto/En revision/Cerrado/Aceptado temporalmente |  | Si/No |

## Reglas

- Todo `SEV-1` bloquea release.
- Todo `SEV-2` requiere workaround aprobado para no bloquear.
- Todo issue aceptado temporalmente debe tener responsable y fecha de revision.
- No usar known issues para normalizar fallas de dinero, seguridad o datos.
