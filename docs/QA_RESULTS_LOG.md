# QA_RESULTS_LOG

## Objetivo

Bitacora central para registrar resultados reales de QA. Este documento inicia sin resultados ejecutados por PROJECT-GOV-A.

## Estados permitidos

- `PASS`: caso ejecutado y evidencia adjunta.
- `FAIL`: caso ejecutado con resultado incorrecto y evidencia.
- `BLOCKED`: caso no ejecutable por bloqueo verificable.
- `NA`: no aplica por permiso, ambiente o alcance documentado.

## Bitacora

| Fecha | Tester | Ambiente | Usuario | Ruta | Caso | Resultado | Evidencia | Comentario QA | Severidad | Fase correctiva sugerida | Estado de correccion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Sin ejecucion registrada por PROJECT-GOV-A | Pendiente | Pendiente | Pendiente |

## Plantilla para nuevo resultado

| Fecha | Tester | Ambiente | Usuario | Ruta | Caso | Resultado | Evidencia | Comentario QA | Severidad | Fase correctiva sugerida | Estado de correccion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Nombre QA | local/qa/staging | usuario | ruta | ID de `QA_TODO_HANDOFF` | PASS/FAIL/BLOCKED/NA | ruta o link | detalle | S1/S2/S3/S4 | fase | OPEN/FIXED/RETEST/PENDING |

## Reglas

- Todo `FAIL` debe tener severidad.
- Todo `FAIL` debe tener fase correctiva sugerida.
- Todo `PASS` debe apuntar a evidencia.
- No editar resultados historicos sin agregar nota de correccion.
- Si Codex corrige un fallo, debe agregar commit/fase y dejar estado `RETEST`.
