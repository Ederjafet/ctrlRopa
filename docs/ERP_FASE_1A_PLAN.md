# ERP - Fase 1A Plan

Fecha: 2026-05-12  
Rama esperada: `feature/fase1a-estabilizacion-ux`  
Rama verificada: `feature/fase1a-estabilizacion-ux`

## Objetivo

Reducir riesgo de regresion con cambios minimos de UX y documentacion, corrigiendo textos visibles con codificacion rota y dejando una base clara para pruebas de regresion.

## Alcance

- Corregir textos visibles al usuario con caracteres rotos.
- Mejorar mensajes genericos de error HTTP en `services/apiClient.ts`.
- Documentar estandar minimo de UX para alertas, modales y notificaciones.
- Actualizar matriz de validaciones con reglas de presentacion.
- Registrar bitacora de cambios de Fase 1A.

## Fuera de alcance

- No modulos nuevos.
- No cambios de logica de negocio.
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
- Mensajes backend con acentos requieren compilacion Java para validar codificacion.
- El arbol Git no estaba completamente limpio al inicio: `.tmp-pdf-images/` aparece como carpeta no rastreada. No se modifica.

## Pruebas QA

- `npx.cmd tsc --noEmit`
- `npx.cmd eslint services/apiClient.ts components/ui/AppNoticeDropdown.tsx`
- `.\mvnw.cmd test` desde `backend/control-ropa`

Si una prueba no aplica por ambiente, se registra el comando, error, causa probable y accion pendiente.

## Criterios de aceptacion

- No quedan caracteres rotos tipo mojibake en `app`, `components`, `services` ni backend Java.
- Los mensajes genericos 400/401/403/404/409/500 son amigables.
- La documentacion UX indica cuando usar `AppBottomModal`, `AppNoticeDropdown` y alerta bloqueante.
- La matriz de validaciones indica como mostrar validaciones accionables y acceso denegado.
- No se toca base de datos ni seguridad.
- Pruebas ejecutadas o documentadas con causa si fallan.

## Estrategia de rollback

- Revertir unicamente los archivos modificados en esta fase.
- No hay migraciones ni cambios persistentes de datos que revertir.
- Si el frontend presenta regresion por `apiClient.ts`, regresar el constructor de `ApiError` y el fallback de errores al estado anterior.
- Si backend falla por codificacion, revertir solo cadenas de texto corregidas.

