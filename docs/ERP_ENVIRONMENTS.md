# ERP - Ambientes

Fecha: 2026-05-12

## DEV

Objetivo:

- Desarrollo local y pruebas rapidas.

Estabilidad esperada:

- Variable.

Datos permitidos:

- Datos ficticios.
- Datos semilla.

Restricciones:

- No usar datos reales sensibles.
- Puede tener logs verbosos.
- No se considera evidencia final de release.

## QA

Objetivo:

- Validacion funcional y regresion operacional.

Estabilidad esperada:

- Alta durante ciclo de pruebas.

Datos permitidos:

- Datos QA controlados.
- Usuarios por rol.
- Escenarios de venta, pago, lote, live y permisos.

Restricciones:

- No cambiar datos manualmente sin registrar.
- No liberar si QA esta inestable.

## STAGING

Objetivo:

- Ensayo de release con configuracion cercana a produccion.

Estabilidad esperada:

- Muy alta.

Datos permitidos:

- Copia anonimizada o dataset representativo.

Restricciones:

- Cambios solo por release candidato.
- Migraciones probadas antes.
- Logs/auditoria activos.

## PROD

Objetivo:

- Operacion real.

Estabilidad esperada:

- Maxima.

Datos permitidos:

- Datos reales operativos.

Restricciones:

- No pruebas destructivas.
- No hotfix sin rollback.
- No migraciones sin backup.
- No logs tecnicos expuestos a usuarios operativos.
- Acceso limitado por rol.

