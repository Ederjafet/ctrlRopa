# ERP - Deuda tecnica

## Deuda critica

1. Seguridad dispersa: `SecurityConfig.java` permite todo y se depende de `AccessService` en servicios.
2. Codificacion rota en textos con acentos en archivos TS/Java.
3. No hay evidencia de repositorio Git en el workspace actual.
4. UX de validaciones inconsistente entre pantallas.
5. Auditoria funcional insuficiente para ERP.

## Deuda alta

- Pantallas grandes con logica mezclada: `app/live.tsx`, `app/door-sale.tsx`, `app/payments.tsx`, `app/batch-detail.tsx`.
- Reportes con filtros basicos y permisos generales.
- Proveedores integrados recientemente, falta consolidacion en reportes y filtros.
- Validaciones duplicadas frontend/backend sin matriz fuente.

## Deuda media

- Nombres operativos todavia ambiguos en algunos modulos.
- Algunos modulos usan permisos demasiado generales.
- Historiales no claramente paginados.
- Logs tecnicos visibles como pantalla de sistema, requiere perfil tecnico.

## No tocar todavia

- No refactorizar servicios criticos antes de tener regresion.
- No cambiar modelo de datos financiero sin pruebas.
- No mover pantallas grandes sin mapa de flujos y capturas QA.

