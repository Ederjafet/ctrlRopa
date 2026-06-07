# PRODUCT-D4 - Ejecucion manual QA visual con evidencia real

## Objetivo

PRODUCT-D4 existe para convertir los casos `PENDIENTE_MANUAL` de PRODUCT-D2/D3 en resultados reales: `PASS`, `FAIL`, `BLOQUEADO` o `NO_APLICA`, siempre con evidencia capturada.

## Fuentes revisadas

- `docs/PRODUCT_D_ROLE_BASED_QA_MATRIX.md`
- `docs/PRODUCT_D_QA_CHECKLIST.md`
- `docs/PRODUCT_D_ROLE_BASED_QA_HANDOFF.md`
- `docs/PRODUCT_D2_VISUAL_QA_EXECUTION_HANDOFF.md`
- `docs/PRODUCT_D3_VISUAL_QA_RESULTS.md`
- `qa-reports/PRODUCT-D2-visual-qa-execution-smoke-20260605-122258.csv`
- `qa-reports/PRODUCT-D3-visual-qa-results-report-20260605-124421.md`

## Estado encontrado

El CSV base de PRODUCT-D2 contiene 28 casos y todos siguen en `PENDIENTE_MANUAL`.

No se encontraron resultados reales ni referencias de evidencia visual capturada:

- `PASS`: 0
- `FAIL`: 0
- `BLOQUEADO`: 0
- `NO_APLICA`: 0
- `PENDIENTE_MANUAL`: 28
- casos con evidencia referenciada: 0
- casos con resultado real: 0

## Estructura de evidencia

Se preparo la carpeta:

- `qa-evidence/PRODUCT-D4/`

Con subcarpetas por perfil:

- `admin/`
- `vendedor/`
- `supervisor/`
- `sin-permisos/`

Y por combinacion inicial de dispositivo/tema:

- `desktop-light/`
- `desktop-dark/`
- `mobile-light/`
- `mobile-dark/`

## CSV operativo

Se creo:

- `qa-reports/PRODUCT-D4-manual-qa-evidence-smoke-20260605-125218.csv`

El archivo se basa en el smoke de PRODUCT-D2 y agrega la columna `Fecha ejecucion`.

Regla de uso:

- no cambiar `Estado` a `PASS` sin evidencia;
- no cambiar `Estado` a `FAIL` sin resultado real y evidencia;
- usar `BLOQUEADO` solo si el caso no puede ejecutarse por bloqueo verificable;
- usar `NO_APLICA` solo cuando la ruta/permiso/condicion no corresponda y quede explicado en notas;
- conservar `PENDIENTE_MANUAL` cuando no se haya ejecutado.

## Resumen por severidad potencial

Como no hay hallazgos confirmados, esta tabla representa severidad potencial de los casos pendientes:

| Severidad | Casos pendientes |
| --- | ---: |
| S1 | 6 |
| S2 | 11 |
| S3 | 10 |
| S4 | 1 |

## Evidencias faltantes

Falta evidencia para los 28 casos del smoke PRODUCT-D4, incluyendo:

- capturas de `/`, `/live`, `/ui-kit`, `/customers`, `/reservations`, `/users`, `/system`, `/reports`, `/appearance` si existe y `reservation-detail`;
- ejecucion con usuarios `qa.admin@local.test`, `qa.vendedor.centro@local.test`, `qa.supervisor.centro@local.test` y `qa.sinpermisos@local.test`;
- validacion light/dark;
- validacion de presets visuales;
- validacion de prenda reservada rojo premium;
- validacion responsive desktop/tablet/mobile;
- validacion de permisos, bloqueo y ausencia de acciones indebidas.

## Criterio GO/NO-GO

- GO tecnico: depende de validaciones automaticas.
- NO-GO visual: mientras todos los casos sigan `PENDIENTE_MANUAL`.
- NO-GO obligatorio: si se confirma algun S1 o S2.
- GO condicionado: si solo existen S3/S4 aceptados por negocio y documentados.
- GO visual: solo cuando los casos criticos tengan evidencia real suficiente.

## Recomendacion

Ejecutar la corrida manual real y llenar el CSV PRODUCT-D4. Si aparecen S1/S2 confirmados, abrir PRODUCT-D5 para correcciones puntuales. Si solo quedan S3/S4 aceptables, se puede evaluar avanzar a PRODUCT-E con riesgo documentado.

## Nota LIVE-Z9B

La validacion manual posterior debe revisar tambien:

- uso consistente de `Apartado` en la pantalla LIVE;
- `Apartar ahora`;
- `Cerrar como venta LIVE`;
- `Mantener apartado`;
- diferencia entre `Retirar prenda del aire`, `Cambiar por prenda preparada` y `Finalizar en vivo`;
- que apartar la prenda al aire no oculte la prenda preparada para cambio.

## Nota LIVE-Z9E

La corrida manual desde LIVE debe agregar el caso `Crear prenda rapida`:

- abrir `/items-create?returnTo=/live`;
- dejar un campo obligatorio vacio, especialmente `Talla`;
- presionar `Generar prendas`;
- confirmar que aparece resumen de validacion y error visible por campo;
- completar datos validos;
- confirmar que la creacion correcta mantiene el regreso a LIVE.

## Nota PRODUCT-D6.4

La siguiente corrida manual debe confirmar AppShell/sidebar/drawer y ausencia de navegacion legacy en:

- `/door-sale`;
- `/door-reservation`;
- `/items`;
- `/items-create?returnTo=%2Flive`;
- `/batches`.

Validar tambien active state correcto, idioma Espanol/English, light/dark, presets visuales y responsive desktop/tablet/mobile.
