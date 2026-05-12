# ERP - Known issues

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Registrar defectos conocidos, riesgos aceptados y workarounds antes de aprobar un release candidate.

## Issues conocidos

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|
| KI-001 | Release/Git | `SEV-3` | No incluir artefactos no rastreados en release; decidir limpiar/ignorar antes de RC. | Puede confundir el diff y el paquete de release. | Abierto | Release Manager | No, salvo que afecte build |

## Plantilla

| ID | Modulo | Severidad | Workaround | Impacto | Estado | Responsable | Bloquea release |
|---|---|---|---|---|---|---|---|
| KI-___ |  | `SEV-1/2/3/4` |  |  | Abierto/En revision/Cerrado/Aceptado temporalmente |  | Si/No |

## Reglas

- Todo `SEV-1` bloquea release.
- Todo `SEV-2` requiere workaround aprobado para no bloquear.
- Todo issue aceptado temporalmente debe tener responsable y fecha de revision.
- No usar known issues para normalizar fallas de dinero, seguridad o datos.
