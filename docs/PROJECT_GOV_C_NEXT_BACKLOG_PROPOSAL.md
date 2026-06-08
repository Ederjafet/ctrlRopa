# PROJECT-GOV-C - Propuesta del siguiente bloque del backlog

## Objetivo

Proponer el siguiente bloque de trabajo a partir de `PROJECT_MASTER_STATUS.md`, `PROJECT_BACKLOG_PRIORITIZED.md`, `QA_TODO_HANDOFF.md`, `QA_RESULTS_LOG.md` y `CODEX_AUTONOMOUS_CLOSURE_RUNBOOK.md`.

Esta fase es solo propuesta. No se implementa codigo, no se modifica backend/frontend/configuracion y no se ejecuta ningun pendiente.

## Estado revisado

- Rama actual: `feature/project-gov-c-next-backlog-proposal`.
- Worktree inicial: limpio.
- PROJECT-GOV-B1 ya esta integrado en develop.
- La compuerta arquitectonica exige detener cambios sensibles antes de ejecutar.
- `QA_RESULTS_LOG.md` no contiene resultados reales; no hay `QA_PASS` nuevo.
- SEC-CONFIG-A1 esta registrado como `DEV_VALIDATED / PENDING_QA`, no como QA formal.

## Candidatos evaluados

| Candidato | Prioridad | Sensibilidad | Impacto | Dependencia | Decision |
| --- | --- | --- | --- | --- | --- |
| PRODUCT-D4 REAL | P0 | Bajo riesgo tecnico; requiere QA humano | Alto: desbloquea release confiable | Ambiente, usuarios, dataset y evidencia QA | Recomendado como siguiente bloque general |
| LIVE-Z10B | P0 | Sensible: LIVE critico, precio, backend probable | Alto: autorizacion real de precio | Arquitectura, backend, reglas de aprobacion | No ejecutar sin handoff/aprobacion |
| ITEM-Z1 | P0 | Sensible: inventario critico, auditoria, permisos | Alto: correccion de capturas | Arquitectura, RBAC, reglas de edicion | No ejecutar sin handoff/aprobacion |
| PRODUCT-ERR-B | P1 | Bajo/medio: frontend no sensible si se limita a mapper/UI | Medio-alto: reduce errores genericos restantes | Auditoria de dominios y QA de errores | Segundo candidato si QA no esta disponible |
| SECURITY-A | P1 | Sensible: seguridad, CORS, sesion, headers | Alto | Arquitectura de seguridad y pruebas negativas | No ejecutar sin handoff/aprobacion |
| LIVE-REF-A | P1 | Sensible por refactor grande LIVE | Medio: mantenibilidad | Plan de particion y regresion LIVE | No ejecutar sin handoff/aprobacion |

## Recomendacion

El siguiente bloque recomendado es:

```text
PRODUCT-D4 REAL - Corrida QA manual real con evidencia
```

Motivo:

- Es el primer P0 del backlog.
- El tablero marca `Release funcional amplio` como NO-GO hasta QA manual.
- No requiere tocar codigo ni arquitectura productiva.
- Genera evidencia para decidir si el siguiente fix debe ser LIVE, errores, UI, permisos o navegacion.
- Reduce el riesgo de seguir implementando sin saber que esta roto en el ambiente real.

## Alternativa si QA no esta disponible

Si QA manual no puede ejecutarse en este momento, el siguiente bloque Codex-friendly recomendado es:

```text
PRODUCT-ERR-B - Errores accionables en dominios restantes
```

Condicion: mantenerlo acotado a frontend no sensible, sin backend, sin endpoints, sin pagos/caja y sin AUTH/RBAC. Si durante auditoria aparecen dominios sensibles, Codex debe detenerse y entregar handoff adicional.

## HANDOFF PARA ARQUITECTURA

Rama actual:
`feature/project-gov-c-next-backlog-proposal`

Fase sugerida:
`PRODUCT-D4 REAL - Corrida QA manual real con evidencia`

Tipo de cambio:
QA / Gobierno / Evidencia. No requiere cambio funcional.

Dominio:
QA transversal: LIVE, UI, I18N, errores, navegacion, seguridad DEV y permisos.

Sensibilidad:
Baja sensibilidad tecnica porque no modifica codigo. Alta importancia operativa porque decide GO/NO-GO de release.

Motivo:
El proyecto acumula muchas fases `DONE_TECH / PENDING_QA`. Ejecutar mas cambios sin QA real puede esconder regresiones de permisos, LIVE, AppShell, i18n, visual o errores.

Riesgo:

- Riesgo bajo de implementacion: no toca codigo.
- Riesgo operativo alto si se pospone: se siguen cerrando fases tecnicas sin evidencia real.
- Riesgo de agenda: requiere usuarios QA, ambiente, datos y evidencia.

Archivos estimados:

- `docs/QA_TODO_HANDOFF.md`
- `docs/QA_RESULTS_LOG.md`
- `docs/PROJECT_MASTER_STATUS.md`
- `docs/PROJECT_BACKLOG_PRIORITIZED.md`
- `qa-reports/PRODUCT-D4-real-...md`
- Evidencia externa o rutas a screenshots/videos si QA las provee.

Validaciones requeridas:

- Validacion manual por casos QA.
- Evidencia por caso visual/operativo.
- Registro PASS/FAIL/BLOCKED/NA en `QA_RESULTS_LOG.md`.
- No marcar `QA_PASS` sin evidencia.
- Si hay fallos, abrir fase correctiva puntual, no corregir dentro de PRODUCT-D4 REAL.

Impacto QA:
Alto. Es la corrida que confirma si el conjunto LIVE, UI, navegacion, i18n y errores esta listo para release o demo controlada.

Decisiones requeridas:

1. Confirmar ambiente QA/local/staging a usar.
2. Confirmar usuarios disponibles: `qa.admin`, `qa.vendedor.centro`, `qa.supervisor.centro`, `qa.sinpermisos`.
3. Confirmar dataset minimo: LIVE activo, prendas disponibles/apartadas/vendidas, clientes, permisos.
4. Confirmar formato de evidencia: screenshots, video, markdown, carpeta compartida.
5. Confirmar si Codex solo registra resultados recibidos o tambien guia la ejecucion paso a paso.

Recomendacion:
GO para planificar y ejecutar PRODUCT-D4 REAL antes de nuevas implementaciones sensibles.

Ejecutar ahora:
SI, si hay ambiente y QA disponibles. NO requiere modificar codigo. Si no hay QA disponible, pasar temporalmente a PRODUCT-ERR-B como bloque de bajo/medio riesgo.

Motivo para detenerse:
Codex no puede inventar resultados QA ni marcar PASS sin evidencia. Debe esperar ejecucion real o instrucciones de captura verificable.

Prompt de ejecucion sugerido:

```text
Quiero iniciar PRODUCT-D4 REAL.
Usa docs/QA_TODO_HANDOFF.md como fuente.
No implementes fixes.
Registra solo resultados reales con evidencia.
Si aparece un FAIL, documenta severidad, evidencia y fase correctiva sugerida.
No marques QA_PASS sin evidencia.
Actualiza QA_RESULTS_LOG, PROJECT_MASTER_STATUS y PROJECT_BACKLOG_PRIORITIZED solo con resultados reales.
Genera reporte y commit documental.
```

## GO/NO-GO

GO para proponer PRODUCT-D4 REAL como siguiente bloque.

NO-GO para ejecutar LIVE-Z10B, ITEM-Z1, SECURITY-A o LIVE-REF-A sin aprobacion arquitectonica explicita.

## Resultado de PROJECT-GOV-C

Se entrega propuesta y handoff. No se ejecuta ningun pendiente del backlog.
