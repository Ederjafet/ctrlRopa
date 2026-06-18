# ERP - Politica de Release Candidate

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Ambientes y estados

| Estado | Objetivo | Reglas |
|---|---|---|
| DEV | Desarrollo local/controlado. | Puede tener cambios incompletos; no genera aprobacion release. |
| QA | Validacion funcional y regresion operacional. | Usa dataset QA, usuarios por rol y evidencia. |
| RC | Release candidate congelado para validacion final. | No acepta cambios funcionales salvo fix aprobado. |
| PROD | Operacion real. | Solo releases aprobados, con rollback y evidencia. |
| HOTFIX | Correccion urgente sobre release. | Debe ser minima, con causa, evidencia y rollback. |

## Cuando un build se considera RC

Un build puede marcarse como RC cuando:

- Rama/diff revisados.
- No hay `SEV-1` abierto.
- `SEV-2` abiertos tienen aprobacion formal o estan resueltos.
- Smoke tecnico, operacional, visual y seguridad estan ejecutados o justificados.
- Evidencia cumple `docs/ERP_EVIDENCE_STANDARD.md`.
- Known issues revisados en `docs/ERP_KNOWN_ISSUES.md`.
- Rollback definido.

## Requisitos minimos

- `docs/ERP_RELEASE_CHECKLIST.md` completo.
- `docs/ERP_QA_EXECUTION_LOG.md` actualizado.
- Evidencia de flujos criticos.
- Logs revisados.
- Sin cambios no rastreados que afecten build.
- Version/tag planificado.

## Aprobacion

| Rol | Aprueba |
|---|---|
| QA Director | Evidencia, severidades, decision QA. |
| Release Manager | Checklist, RC, rollback y ventana release. |
| Product Owner Tecnico | Riesgo funcional y aceptacion de known issues. |
| ERP Governance Lead | Cumplimiento documental y trazabilidad. |

## Bloqueo de release

Bloquear si:

- Existe `SEV-1` abierto.
- Existe `SEV-2` sin workaround aprobado.
- Falta evidencia de flujo critico.
- Login, ventas, pagos, permisos o backend fallan.
- Hay migracion no probada.
- Hay archivos no rastreados que cambian build.
- No hay rollback.

## Hotfix

Un hotfix solo procede si:

- Corrige un `SEV-1` o `SEV-2`.
- Tiene alcance minimo.
- No mezcla mejoras.
- Tiene evidencia del fallo y del fix.
- Tiene rollback inmediato.
