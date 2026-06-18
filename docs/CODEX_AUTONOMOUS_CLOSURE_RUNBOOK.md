# CODEX_AUTONOMOUS_CLOSURE_RUNBOOK

## Objetivo

Definir como Codex debe cerrar pendientes uno por uno, sin mezclar fases ni marcar avances sin evidencia.

## Flujo obligatorio

1. Tomar un pendiente de `docs/PROJECT_BACKLOG_PRIORITIZED.md`.
2. Crear o confirmar rama de fase.
3. Auditar contexto minimo: docs, codigo, servicios y reportes relacionados.
4. Clasificar sensibilidad del bloque.
5. Si el bloque es sensible, detenerse y entregar handoff para arquitectura antes de modificar codigo o configuracion.
6. Si el bloque no es sensible, implementar solo esa fase.
7. Ejecutar validaciones requeridas.
8. Corregir errores seguros dentro del alcance.
9. Generar documentacion y evidencia.
10. Hacer commit con mensaje de fase.
11. No hacer merge a develop.
12. Entregar GO/NO-GO.
13. Si QA falla, abrir fase correctiva puntual.
14. Actualizar tablero/backlog/log QA cuando aplique.

## Compuerta de aprobacion arquitectonica

Codex puede seleccionar y ejecutar directamente solo bloques de bajo riesgo. Ejemplos:

- documentacion;
- i18n y traducciones base;
- copy, microcopy y textos visibles;
- UI visual de bajo riesgo sin cambio funcional;
- evidencia QA;
- actualizacion de tableros;
- errores frontend no sensibles;
- refactors pequenos sin cambio de comportamiento.

Codex no debe ejecutar automaticamente bloques sensibles sin aprobacion previa. En esos casos debe detenerse antes de modificar codigo, configuracion o scripts y entregar solo una propuesta.

Bloques sensibles:

- seguridad;
- autenticacion;
- autorizacion;
- RBAC/permisos;
- backend funcional;
- base de datos y migraciones;
- configuracion sensible/secrets;
- infraestructura;
- despliegue;
- CORS/sesion/tokens;
- pagos/caja;
- LIVE critico;
- cambios de precio;
- inventario critico;
- borrado o modificacion masiva de datos;
- refactors grandes.

La propuesta previa debe incluir:

1. Fase sugerida.
2. Motivo.
3. Riesgo.
4. Archivos que tocaria.
5. Validaciones necesarias.
6. Plan de rollback.
7. Preguntas o decisiones necesarias.
8. Recomendacion GO/NO-GO.
9. Que debe revisar el arquitecto.
10. Prompt sugerido para ejecucion, sin ejecutarlo.

Codex no debe modificar codigo en fases sensibles hasta que el usuario confirme aprobacion arquitectonica.

## Handoff para arquitectura

Usar esta plantilla antes de ejecutar una fase sensible:

```text
HANDOFF PARA ARQUITECTURA

Rama actual:
Fase sugerida:
Tipo de cambio:
Dominio:
Sensibilidad:
Motivo:
Riesgo:
Archivos estimados:
Validaciones requeridas:
Impacto QA:
Decisiones requeridas:
Recomendacion:
Ejecutar ahora: SI/NO
Motivo para detenerse:
Prompt de ejecucion sugerido:
```

Este handoff se entrega antes de tocar codigo, configuracion, migraciones, permisos, seguridad, pagos, LIVE critico o inventario critico.

## Cuando Codex puede corregir autonomamente

Codex puede avanzar sin pedir confirmacion cuando:

- el alcance esta definido y no requiere decision de negocio nueva;
- el cambio no toca backend sensible;
- el cambio no cae en los bloques sensibles de la compuerta arquitectonica;
- no cambia contratos de API;
- no concede permisos nuevos sin permiso real;
- las validaciones fallan por errores directamente causados por la fase;
- la correccion queda dentro del mismo modulo o documento.

## Cuando debe detenerse

Codex debe detenerse y reportar decision requerida cuando:

- la fase cae en un bloque sensible y no existe aprobacion arquitectonica explicita;
- se necesita crear endpoints no solicitados;
- hay que cambiar reglas de negocio profundas;
- el fix requiere pagos/caja/billing/IA fuera del alcance;
- hay datos productivos o secretos involucrados;
- hay cambios del usuario que contradicen la fase;
- QA pide aceptar un riesgo sin responsable;
- no existe evidencia suficiente para marcar `QA_PASS`.

## Reglas para configuracion y secrets

En fases de configuracion local o seguridad:

- no versionar `.env`;
- no reintroducir passwords reales en `application.properties`;
- no imprimir secretos en consola ni evidencia;
- usar `.env.example` solo con placeholders;
- validar que los scripts fallen con mensajes claros si falta un secreto local;
- dejar QA en `PENDING_QA` hasta probar con variables reales fuera del repositorio.

## Validaciones base

Para cambios de codigo frontend:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
```

Para cambios backend:

```powershell
cd backend/control-ropa
.\mvnw.cmd test
.\mvnw.cmd -q -DskipTests package
cd /e/CtrlPan/2026/control-ropa-app
```

Para cambios solo documentales:

```powershell
git status
git --no-pager diff --stat
git --no-pager diff --name-only
git --no-pager diff --check
```

Lint/TypeScript pueden ejecutarse opcionalmente si el tablero o fase lo pide.

## Evidencia requerida por fase

- `qa-reports/<FASE>-report-YYYYMMDD-HHMMSS.md`
- `git-diffs/YYYYMMDD-<FASE>.diff`
- `git-diffs/YYYYMMDD-<FASE>-stat.txt`
- Documentacion de fase en `docs/`.

## Actualizacion de tablero

Al cerrar una fase:

1. En `PROJECT_MASTER_STATUS.md`, actualizar fase, commit y estado tecnico.
2. En `PROJECT_BACKLOG_PRIORITIZED.md`, mover el pendiente a `DONE_TECH` o `PENDING_QA`.
3. En `QA_TODO_HANDOFF.md`, agregar casos si se creo funcionalidad nueva.
4. En `QA_RESULTS_LOG.md`, solo registrar resultados reales recibidos de QA.

## Criterios de GO/NO-GO

GO:

- validaciones pasan;
- evidencia generada;
- commit creado;
- alcance respetado;
- no hay cambios fuera de fase.

NO-GO:

- validaciones fallan;
- falta evidencia;
- se requiere decision de negocio;
- hay riesgo de seguridad no resuelto;
- QA falla y no hay correccion segura dentro del alcance.

## Regla final

Codex no debe cerrar pendientes por optimismo. Cierra por evidencia.
