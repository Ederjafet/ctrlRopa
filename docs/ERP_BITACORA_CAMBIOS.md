# ERP - Bitácora de cambios

## 2026-05-11 - Fase 0

Tipo: documentación inicial ERP.

Cambios:

- Se generó inventario inicial de módulos, pantallas, endpoints, permisos, riesgos y roadmap.
- No se modificó código.
- No se modificó base de datos.
- No se generaron migraciones.

Hallazgos:

- Estado general MEDIO con flujos FRÁGILES.
- Seguridad dispersa por servicios.
- UX y validaciones no homologadas.
- Proveedores/lotes/calidad existen, pero requieren consolidación.
- Codificación de textos con acentos rota en varios archivos.

Pendiente:

- Validar pruebas automatizadas reales.
- Validar cada endpoint contra permiso esperado.
- Validar cada pantalla en web y mobile.
- Confirmar control release sobre Git en cada fase.

## 2026-05-12 - Fase 1A

Tipo: estabilización UX mínima y preparación de regresión.

Objetivo:

- Corregir textos visibles con codificación rota.
- Reducir exposición de mensajes técnicos al usuario.
- Documentar estándar mínimo de UX para mensajes, validaciones y acceso denegado.
- Preparar base de QA para regresión.

Cambios realizados:

- Se creó `docs/ERP_FASE_1A_PLAN.md`.
- Se actualizaron reglas UX en `docs/ERP_GUIA_UI_UX.md`.
- Se actualizaron reglas de presentación en `docs/ERP_MATRIZ_VALIDACIONES.md`.
- Se corrigieron mensajes visibles en `services/apiClient.ts`.
- Se verificó que no quedaran patrones de mojibake en `app`, `components`, `services`, backend Java y docs ERP.
- Se actualizó el resumen ejecutivo y riesgos operativos para reflejar que Git ya existe y que la rama de trabajo fue verificada.

Archivos modificados:

- `services/apiClient.ts`
- `docs/ERP_FASE_1A_PLAN.md`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RESUMEN_EJECUTIVO.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Pruebas ejecutadas:

- OK: `npx.cmd tsc --noEmit`.
- OK: `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`.
- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.

Riesgos pendientes:

- `.tmp-pdf-images/` aparece como no rastreado en Git; no se tocó.
- Aún existen muchas alertas nativas que deben homologarse en fases posteriores.
- Seguridad y permisos quedan fuera de alcance en Fase 1A.
- `.\mvnw.cmd test` emitió advertencias de Logback al rotar `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`; no bloqueó el build.
- `.\mvnw.cmd test` emitió advertencias por MySQL 5.7 fuera del soporte comunitario de Hibernate/Flyway y por Mockito dynamic agent; quedan para revisión técnica posterior.

Siguiente fase recomendada:

- Iniciar Fase 1B para checklist de regresión por flujo crítico y limpieza de artefactos no rastreados.
