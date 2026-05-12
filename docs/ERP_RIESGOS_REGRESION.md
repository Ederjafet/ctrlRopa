# ERP - Riesgos de regresion

## Modulos con mayor riesgo

1. `app/live.tsx`: cambios UX pueden afectar captura de reservas, seleccion de live e historial.
2. `app/door-sale.tsx`: cualquier validacion puede bloquear caja.
3. `app/payments.tsx`: multiples formas de pago y origen de deuda.
4. `app/batch-detail.tsx`: recepcion, clasificacion y conciliacion comparten estado.
5. `services/apiClient.ts`: cambios impactan todo el sistema.
6. `AccessService.java`: cambios impactan todos los permisos.

## Regresiones probables

- Usuario ve boton pero backend responde 403.
- Boton no hace nada si falta informacion.
- Modal tapa contenido o no es usable en mobile.
- Cambio de texto de estatus rompe filtros.
- Error API se muestra como texto tecnico.
- Datos capturados se pierden al corregir validacion.

## Control recomendado

- Pruebas smoke por modulo antes de release.
- Checklist de permisos por usuario QA.
- Datos semilla para cada flujo critico.
- Capturas web/mobile de pantallas criticas.

