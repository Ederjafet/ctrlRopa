# ERP - Fase 1A Plan

Fecha: 2026-05-12  
Rama esperada: `feature/fase1a-estabilizacion-ux`  
Rama verificada: `feature/fase1a-estabilizacion-ux`

## Objetivo

Reducir riesgo de regresión con cambios mínimos de UX y documentación, corrigiendo textos visibles con codificación rota y dejando una base clara para pruebas de regresión.

## Alcance

- Corregir textos visibles al usuario con caracteres rotos.
- Mejorar mensajes genéricos de error HTTP en `services/apiClient.ts`.
- Documentar estándar mínimo de UX para alertas, modales y notificaciones.
- Actualizar matriz de validaciones con reglas de presentación.
- Registrar bitácora de cambios de Fase 1A.

## Fuera de alcance

- No módulos nuevos.
- No cambios de lógica de negocio.
- No cambios de seguridad.
- No cambios de base de datos.
- No migraciones.
- No refactor masivo.
- No cambios profundos en pagos, ventas, live o lotes.

## Archivos candidatos

- `services/apiClient.ts`
- `components/ui/AppNoticeDropdown.tsx`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/catalog/SupplierService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/web/error/ApiExceptionHandler.java`
- `docs/ERP_GUIA_UI_UX.md`
- `docs/ERP_MATRIZ_VALIDACIONES.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

## Riesgos

- Cambiar `services/apiClient.ts` impacta todo el frontend; se limita a mensajes visibles y no a transporte.
- Mensajes backend con acentos requieren compilación Java para validar codificación.
- El árbol Git no estaba completamente limpio al inicio: `.tmp-pdf-images/` aparece como carpeta no rastreada. No se modifica.

## Pruebas QA

- `npx.cmd tsc --noEmit`
- `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`
- `.\mvnw.cmd test` desde `backend/control-ropa`

Si una prueba no aplica por ambiente, se registra el comando, error, causa probable y acción pendiente.

## Criterios de aceptación

- No quedan caracteres rotos tipo mojibake en `app`, `components`, `services` ni backend Java.
- Los mensajes genéricos 400/401/403/404/409/500 son amigables.
- La documentación UX indica cuándo usar `AppBottomModal`, `AppNoticeDropdown` y alerta bloqueante.
- La matriz de validaciones indica cómo mostrar validaciones accionables y acceso denegado.
- No se toca base de datos ni seguridad.
- Pruebas ejecutadas o documentadas con causa si fallan.

## Estrategia de rollback

- Revertir únicamente los archivos modificados en esta fase.
- No hay migraciones ni cambios persistentes de datos que revertir.
- Si el frontend presenta regresión por `apiClient.ts`, regresar el constructor de `ApiError` y el fallback de errores al estado anterior.
- Si backend falla por codificación, revertir solo cadenas de texto corregidas.

