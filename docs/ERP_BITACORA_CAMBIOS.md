# ERP - Bitacora de cambios

## 2026-05-11 - Fase 0

Tipo: documentacion inicial ERP.

Cambios:

- Se genero inventario inicial de modulos, pantallas, endpoints, permisos, riesgos y roadmap.
- No se modifico codigo.
- No se modifico base de datos.
- No se generaron migraciones.

Hallazgos:

- Estado general MEDIO con flujos FRAGILES.
- Seguridad dispersa por servicios.
- UX y validaciones no homologadas.
- Proveedores/lotes/calidad existen, pero requieren consolidacion.
- Codificacion de textos con acentos rota en varios archivos.

Pendiente:

- Validar pruebas automatizadas reales.
- Validar cada endpoint contra permiso esperado.
- Validar cada pantalla en web y mobile.
- Confirmar control release sobre Git en cada fase.

## 2026-05-12 - Fase 1A

Tipo: estabilizacion UX minima y preparacion de regresion.

Objetivo:

- Corregir textos visibles con codificacion rota.
- Reducir exposicion de mensajes tecnicos al usuario.
- Documentar estandar minimo de UX para mensajes, validaciones y acceso denegado.
- Preparar base de QA para regresion.

Cambios realizados:

- Se creo `docs/ERP_FASE_1A_PLAN.md`.
- Se actualizaron reglas UX en `docs/ERP_GUIA_UI_UX.md`.
- Se actualizaron reglas de presentacion en `docs/ERP_MATRIZ_VALIDACIONES.md`.
- Se corrigieron mensajes visibles en `services/apiClient.ts`.
- Se verifico que no quedaran patrones de mojibake en `app`, `components`, `services`, backend Java y docs ERP.
- Se actualizo el resumen ejecutivo y riesgos operativos para reflejar que Git ya existe y que la rama de trabajo fue verificada.

Archivos modificados:

- `services/apiClient.ts`
- `docs/ERP_FASE_1A_PLAN.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_DEFINICION_DE_HECHO.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`.
- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.

Riesgos pendientes:

- `.tmp-pdf-images/` aparece como no rastreado en Git; no se toco.
- Aun existen muchas alertas nativas que deben homologarse en fases posteriores.
- Seguridad y permisos quedan fuera de alcance en Fase 1A.
- `.\mvnw.cmd test` emitio advertencias de Logback al rotar `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`; no bloqueo el build.
- `.\mvnw.cmd test` emitio advertencias por MySQL 5.7 fuera del soporte comunitario de Hibernate/Flyway y por Mockito dynamic agent; quedan para revision tecnica posterior.

Siguiente fase recomendada:

- Iniciar Fase 1B para checklist de regresion por flujo critico y limpieza de artefactos no rastreados.

## 2026-05-12 - Fase 1B

Tipo: gobernanza ERP, release control y criterios de terminado.

Objetivo:

- Formalizar Definition of Done por tamano de cambio.
- Formalizar checklist release ERP.
- Definir ownership por modulo.
- Definir arquitectura objetivo.
- Clasificar riesgos operativos con severidad, probabilidad, mitigacion y rollback.
- Mejorar roadmap con dependencias, criterios de salida, esfuerzo y riesgo.

Documentos creados:

- `docs/ERP_DEFINITION_OF_DONE.md`
- `docs/ERP_RELEASE_CHECKLIST.md`
- `docs/ERP_OWNERSHIP_MATRIX.md`
- `docs/ERP_TARGET_ARCHITECTURE.md`

Documentos actualizados:

- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_ROADMAP_FASES.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

Riesgos detectados:

- `.tmp-pdf-images/` y `cambios_fase1a.diff` aparecen como no rastreados; no se tocaron.
- Persisten riesgos criticos en permisos, ventas/pagos, auditoria de negocio y ausencia de regresion automatizada amplia.
- La seguridad sigue fuera de alcance hasta Fase 4.
- Existia `ERP_DEFINICION_DE_HECHO.md`; se conserva como alias historico y el documento canonico queda como `ERP_DEFINITION_OF_DONE.md`.

Siguiente fase sugerida:

- Fase 1C: limpieza de artefactos Git, checklist de regresion manual inicial y matriz endpoint-permiso preliminar sin cambios de seguridad.
