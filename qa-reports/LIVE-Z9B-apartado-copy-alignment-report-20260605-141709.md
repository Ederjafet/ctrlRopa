# LIVE-Z9B - Reporte de alineacion de copy a Apartado

## Objetivo

Unificar el lenguaje visible de LIVE para usar `Apartado` como termino operativo principal y corregir el estado frontend que ocultaba la prenda preparada despues de apartar la prenda al aire.

## Cambios implementados

- `Reservas recientes` pasa a `Apartados recientes`.
- `Reservar ahora` pasa a `Apartar ahora`.
- `Ultima reserva` pasa a `Ultimo apartado`.
- `Confirmar venta LIVE` / vendido operativo se alinea como `Cerrar como venta LIVE`.
- `Marcar pendiente` pasa a `Mantener apartado`.
- Se refuerza que pago/caja no se registra desde LIVE.
- Se refuerza que retirar prenda, cambiar por preparada y finalizar en vivo son acciones distintas.
- Se conserva la prenda preparada al crear el apartado de la prenda al aire.

## Correccion frontend

En `persistReservation`, la seleccion de prenda ya no se limpia siempre. Ahora se limpia solo si la seleccion corresponde a la misma prenda apartada. Esto evita perder la prenda preparada para cambio.

## Validaciones tecnicas

Ejecutadas el 2026-06-05:

- OK - `npm.cmd run lint` (sin errores; 60 warnings preexistentes de lint).
- OK - `npx.cmd tsc --noEmit`.
- OK - `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` (73 rutas exportadas).
- OK - `cd backend/control-ropa; ./mvnw.cmd test` (73 tests, 0 fallas, 0 errores).
- OK - `cd backend/control-ropa; ./mvnw.cmd -q -DskipTests package`.
- Pendiente de cierre - `git diff --check` se ejecuta al generar evidencia final.

Warnings observados:

- Lint conserva 60 warnings ya existentes, no introducidos por esta fase.
- Maven test muestra warnings de entorno conocidos: MySQL 5.7 fuera de soporte comunitario, Mockito dynamic agent y password generado por Spring Security en contexto de test.

## Riesgos

- `Reserva` puede seguir apareciendo en rutas o nombres tecnicos fuera del flujo visible de operador.
- No se ejecuto validacion manual en navegador en esta fase.

## GO/NO-GO

GO tecnico condicionado a `git diff --check` final.
