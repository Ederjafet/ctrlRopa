# PRODUCT-D4 REAL - Plan de corrida QA manual real

## Objetivo

Preparar una corrida QA manual real con evidencia verificable para validar los principales flujos del sistema antes de cualquier release amplio.

La corrida no implementa fixes. Si aparece un fallo, se registra con severidad, evidencia y fase correctiva sugerida.

## Alcance

- Arranque DEV/backend.
- Login y sesion.
- Navegacion, AppShell y permisos.
- LIVE operador, vendedor, supervisor y sin permisos.
- Apartados/reservas.
- Prendas/inventario.
- UI Kit y diseno visual.
- I18n e idiomas.
- Errores accionables.
- Configuracion segura y `.env`.

## Fuera de alcance

- Cambios de codigo.
- Cambios backend/frontend.
- Migraciones.
- Cambios de permisos o reglas de negocio.
- Correcciones dentro de la corrida.
- Marcar `QA_PASS` sin evidencia.
- Incluir passwords reales en documentos o capturas.

## Ambiente requerido

- Ambiente local, QA o staging definido antes de iniciar.
- Commit/build bajo prueba registrado.
- Navegador desktop y al menos un viewport mobile/tablet.
- Tema claro y oscuro disponibles.
- Acceso a evidencia: screenshots, videos o carpeta compartida.

## Backend requerido

- Backend levantado en puerto esperado, normalmente `8090`.
- Base de datos con datos minimos.
- `.env` local no versionado con `CONTROL_ROPA_DB_PASSWORD`.
- `/api/me` sin token debe responder `401` esperado.

## Frontend requerido

- App web o Expo web levantada contra el backend seleccionado.
- Rutas principales disponibles.
- Selector de idioma operativo.
- Light/dark operativo.

## Usuarios QA

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

No incluir passwords reales en este documento ni en evidencia.

## Datos minimos

- Un LIVE que pueda iniciarse por admin/operador.
- Prendas disponibles.
- Prendas apartadas/reservadas.
- Prendas vendidas/no disponibles.
- Cliente/interesado seleccionable.
- Permisos activos para vendedor con `DO_LIVE_RESERVATION`.
- Usuario sin permisos para pruebas negativas.
- Datos de catalogo suficientes para alta rapida de prenda.

## Orden recomendado de prueba

1. Arranque DEV/backend y `.env`.
2. Login/sesion por usuarios QA.
3. Navegacion, AppShell y permisos.
4. LIVE operador/admin.
5. LIVE vendedor.
6. LIVE supervisor.
7. LIVE sin permisos.
8. Apartados/reservas.
9. Prendas/inventario.
10. UI Kit/diseno visual.
11. I18n.
12. Errores accionables.
13. Consolidacion de resultados.

## Criterios PASS / FAIL / BLOCKED / NA

- `PASS`: caso ejecutado, resultado esperado cumplido y evidencia adjunta.
- `FAIL`: caso ejecutado, resultado incorrecto y evidencia adjunta.
- `BLOCKED`: caso no ejecutable por bloqueo verificable.
- `NA`: caso no aplica por permiso, ambiente o alcance documentado.
- `PENDING_QA`: caso aun no ejecutado.

## Criterio GO / NO-GO

- `GO QA`: casos criticos S1/S2 pasan con evidencia o tienen riesgo aceptado formalmente.
- `NO-GO QA`: cualquier S1 confirmado sin correccion o sin decision de riesgo.
- `GO condicionado`: solo quedan S3/S4 documentados y aceptados.
- `NO-GO release amplio`: no hay evidencia suficiente o la corrida esta incompleta.

## Evidencia requerida

Para cada caso ejecutado:

- ID del caso.
- Usuario.
- Ruta.
- Fecha/hora.
- Tema y viewport si aplica.
- Resultado real.
- Screenshot, video o referencia de evidencia.
- Comentario QA.

## Como reportar hallazgos

Cada hallazgo debe incluir:

- ID del caso.
- Resultado `FAIL` o `BLOCKED`.
- Pasos exactos.
- Resultado esperado.
- Resultado real.
- Severidad S1/S2/S3/S4.
- Evidencia.
- Fase correctiva sugerida.

## Como agrupar fallas

- Seguridad/AUTH/RBAC: fase sensible con handoff arquitectonico.
- LIVE critico/precio/inventario: fase sensible con handoff arquitectonico.
- Errores frontend no sensibles: PRODUCT-ERR-B o fase puntual.
- UI/i18n/copy visual: fase de bajo/medio riesgo si no toca backend.
- Navegacion/AppShell: fase PRODUCT-D6.x puntual.

## Estado

READY_FOR_QA. La ejecucion real queda pendiente de QA humano con evidencia.
