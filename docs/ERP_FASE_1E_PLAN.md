# ERP - Fase 1E Plan

Fecha: 2026-05-12  
Rama esperada: `feature/fase1e-ejecucion-qa-controlada`

## Objetivo

Preparar la primera ejecucion QA real controlada del ERP, usando dataset QA, usuarios por rol, smoke tests y evidencia formal, sin modificar comportamiento productivo.

## Alcance

- Documentar prerequisitos para ejecutar QA real.
- Documentar runbook operativo paso a paso.
- Actualizar checklist release, bitacora y roadmap.
- Revisar riesgos de scripts QA existentes.
- Preparar criterios de aprobado/rechazado para una corrida controlada.

## Fuera de alcance

- No modificar frontend funcional.
- No modificar backend funcional.
- No modificar seguridad real.
- No modificar migraciones Flyway.
- No ejecutar SQL destructivo.
- No ejecutar scripts sobre datos productivos.
- No corregir defectos funcionales detectados durante QA; deben abrirse como fase/issue separado.

## Prerequisitos

- Rama verificada: `feature/fase1e-ejecucion-qa-controlada`.
- `git status --short` revisado antes de ejecutar QA.
- Ambiente QA aislado con base no productiva.
- Backup de base QA antes de aplicar cualquier script.
- Migraciones Flyway aplicadas hasta `V37__suppliers_and_batch_quality.sql` como minimo.
- Dataset base revisado: `docs/ERP_QA_DATASET.md`.
- Usuarios por rol revisados: `docs/ERP_QA_USERS_ROLES.md`.
- Plantilla de evidencia disponible: `docs/ERP_QA_EVIDENCE_TEMPLATE.md`.
- Smoke tests disponibles: `docs/ERP_SMOKE_TESTS.md`.

## Ambiente requerido

| Elemento | Requisito |
|---|---|
| Base de datos | QA o DEV aislado; nunca PROD. |
| Backend | Arrancado contra base QA, con logs activos. |
| Frontend web/mobile | Apuntando al backend QA correcto. |
| Usuarios | Perfiles QA activos con password de prueba documentado. |
| Evidencia | Carpeta o repositorio de evidencias definido antes de iniciar. |
| Red | IP/API estable durante la corrida. |

## Riesgos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Ejecutar SQL QA en PROD | CRITICO | Validar ambiente, base y respaldo antes de ejecutar. |
| `01-preparacion-datos-qa.sql` desalineado con esquema actual | ALTO | Ejecutar primero en copia QA y revisar errores antes de smoke. |
| Usuarios `{noop}Qa12345!` no aceptados por autenticacion actual | ALTO | Validar login de `qa.admin@local.test` antes de continuar. |
| SQL 04 reasigna roles/permisos de usuarios QA especificos | MEDIO | Ejecutar solo sobre correos `qa.*@local.test`; no usar usuarios reales. |
| Artefactos Git no rastreados confunden release | MEDIO | No liberar hasta documentar/limpiar `.tmp-pdf-images/` y diffs de fases. |
| Smoke genera ventas/pagos reales en QA | MEDIO | Usar solo datos QA y registrar evidencia antes de limpiar. |

## Rollback

- Si un script QA falla antes de `COMMIT`, ejecutar `ROLLBACK` en la misma sesion.
- Si ya hizo `COMMIT`, restaurar backup QA o ejecutar limpieza QA solo si fue aprobada.
- Si falla backend/frontend durante smoke, detener corrida y registrar `BLOQUEADO`.
- No intentar arreglos en caliente dentro de esta fase.

## Criterios de aceptacion

- Runbook 1E creado y entendible para ejecutar QA.
- Checklist release referencia la corrida 1E.
- Execution log tiene entrada inicial de Fase 1E.
- Riesgos de scripts QA quedan documentados.
- No hay cambios en `app/`, `services/`, `backend/control-ropa/src/main/` ni migraciones Flyway.
- Siguiente paso de ejecucion real queda claro.
