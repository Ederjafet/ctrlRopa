# PRODUCT-D4 - Reporte de ejecucion manual QA visual con evidencia real

## Objetivo

Preparar la corrida PRODUCT-D4 para capturar evidencia real por usuario, rol, ruta, tema, preset y dispositivo; consolidar resultados si ya existian; y dejar GO/NO-GO sin inventar evidencias.

## Alcance

Incluye:

- usuarios QA `qa.admin@local.test`, `qa.vendedor.centro@local.test`, `qa.supervisor.centro@local.test` y `qa.sinpermisos@local.test`;
- rutas `/`, `/live`, `/ui-kit`, `/customers`, `/reservations`, `/users`, `/system`, `/reports`, `/appearance` si existe y `/reservation-detail?id=<id valido>`;
- light/dark mode;
- presets `retailPremium`, `darkConsole`, `blueCorporate`, `boutique` y `classicErp`;
- desktop, tablet y mobile;
- permisos, vistas LIVE, prenda reservada rojo premium, editor controlado y ausencia de textos invisibles.

No incluye cambios funcionales, backend, AUTH/RBAC, pagos, caja, billing, reportes backend ni IA.

## Fuentes revisadas

- `qa-reports/PRODUCT-D2-visual-qa-execution-smoke-20260605-122258.csv`
- `qa-reports/PRODUCT-D2-visual-qa-execution-report-20260605-122258.md`
- `qa-reports/PRODUCT-D3-visual-qa-results-report-20260605-124421.md`
- `docs/PRODUCT_D2_VISUAL_QA_EXECUTION_HANDOFF.md`
- `docs/PRODUCT_D3_VISUAL_QA_RESULTS.md`

## Resumen de estados

No se encontraron resultados manuales reales capturados en la evidencia D2/D3. El CSV PRODUCT-D4 se genero listo para ejecutar y mantiene los casos en pendiente.

| Estado | Casos |
| --- | ---: |
| PASS | 0 |
| FAIL | 0 |
| BLOQUEADO | 0 |
| NO_APLICA | 0 |
| PENDIENTE_MANUAL | 28 |

## Resumen por severidad

No hay hallazgos confirmados. La severidad siguiente corresponde al riesgo potencial de los casos pendientes:

| Severidad | Casos pendientes |
| --- | ---: |
| S1 | 6 |
| S2 | 11 |
| S3 | 10 |
| S4 | 1 |

## Evidencias capturadas

No hay evidencia manual real capturada al cierre de esta preparacion.

## Evidencias faltantes

Faltan evidencias para los 28 casos:

- capturas o enlaces por caso;
- resultado real;
- fecha de ejecucion;
- estado final `PASS`, `FAIL`, `BLOQUEADO` o `NO_APLICA`;
- notas de desviacion cuando aplique;
- severidad confirmada en caso de falla.

## Hallazgos confirmados

No hay hallazgos confirmados. No se marcaron fallas sin evidencia.

## GO/NO-GO tecnico

GO tecnico. Las validaciones automaticas de esta fase terminaron correctamente.

## GO/NO-GO visual

NO-GO visual mientras los 28 casos sigan en `PENDIENTE_MANUAL`.

## Recomendacion

Ejecutar manualmente PRODUCT-D4 con navegador/AnyDesk y completar el CSV generado. Si se confirma algun S1/S2, abrir PRODUCT-D5 para correccion puntual. Si solo hay S3/S4 aceptables y documentados, se puede evaluar PRODUCT-E.

## Validaciones tecnicas

| Comando | Resultado | Notas |
| --- | --- | --- |
| `npm.cmd run lint` | OK | 0 errores, 60 warnings preexistentes fuera del alcance documental. |
| `npx.cmd tsc --noEmit` | OK | Sin errores. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | OK | Export web generado con 73 rutas estaticas. |
| `cd backend/control-ropa; ./mvnw.cmd test` | OK | 73 tests, 0 fallas, 0 errores. |
| `cd backend/control-ropa; ./mvnw.cmd -q -DskipTests package` | OK | Package generado correctamente. |
| `git diff --check` | Pendiente final | Se ejecuta nuevamente despues de generar evidencia git. |

Warnings observados:

- lint mantiene 60 warnings preexistentes en archivos de aplicacion no modificados por PRODUCT-D4;
- Maven reporta warnings conocidos de Mockito dynamic agent y MySQL 5.7 fuera de soporte comunitario.
