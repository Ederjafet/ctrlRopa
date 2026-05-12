# Analisis QA - roles, errores y logs

## Objetivo

Validar que cada rol vea datos coherentes con su operacion, que los errores sean mensajes controlados para el usuario y que exista log tecnico para diagnostico.

## Roles y datos esperados

| Rol | Debe ver/operar | Riesgo detectado |
| --- | --- | --- |
| ADMIN | Configuración, usuarios, sucursales, catálogos, apariencia, operacion completa, reportes e historico | Correcto para QA; en ambiente limpio depende de que todos los permisos existan antes de asignar ADMIN |
| SUPERVISOR | Operacion amplia, reportes, historico, transferencias, consignacion, devoluciones/refunds segun flujo | Debe confirmarse que tenga permisos directos o por rol para refunds/devoluciones si se espera operar esos modulos |
| SELLER | Clientes, inventario visible, venta puerta, apartado puerta, Live | Correcto; debe validar que no vea reportes/caja/logistica |
| CASHIER | Pagos, saldo, cierres de caja y reportes de caja | Correcto para pagos/caja; si debe procesar refunds, el menu debe darle entrada controlada a refunds |
| INVENTORY | Inventario, lotes, alta masiva, ubicaciones, transferencias | Correcto; debe validar que no pueda vender/cobrar si no tiene esos permisos |
| PACKING | Clientes, inventario visible y paquetes | Alineado: el menu usa `CREATE_CLOSE_CUSTOMER_PACKAGE`, igual que backend |
| LOGISTICS | Envíos, transferencias e incidencias | Correcto para QA; ya se mejoro listado de envíos vacios |
| COURIER | Solo entregas en ruta e incidencias relacionadas | Riesgo: debe ver solo envíos `OUT_FOR_DELIVERY`; ya se filtro en app, pero backend aun no restringe por rol |

## Hallazgos de permisos

Hay permisos usados por la app o por QA que no estan todos centralizados en `PermissionCode.java` ni en migraciones base:

- `VIEW_CUSTOMERS`
- `MANAGE_BRANCHES`
- `MANAGE_CATALOGS`
- `VIEW_CUSTOMER_ORDERS`
- `MANAGE_RETURNS`
- `MANAGE_REFUNDS`
- `MANAGE_INCIDENTS`

Estado aplicado: se agrego `V28__align_role_menu_permissions.sql` para centralizar estos permisos en base limpia y asignarlos por rol operativo. Tambien se agregaron constantes faltantes en `PermissionCode.java`.

Nota QA: si la base ya tenia algunos permisos por scripts manuales, Flyway puede mostrar avisos de duplicado durante la primera ejecucion de la migracion; son tolerados con `INSERT IGNORE`.

## Errores controlados

Ya existe `ApiExceptionHandler` con manejo para:

- `400 BAD_REQUEST`: validaciónes y cuerpo invalido.
- `403 FORBIDDEN`: permisos insuficientes.
- `404 NOT_FOUND`: registros no encontrados.
- `409 CONFLICT`: estados invalidos o duplicados.
- `500 INTERNAL_SERVER_ERROR`: error inesperado.

Mejora aplicada: los `500` ahora se registran con stacktrace tecnico en log, incluyendo metodo y ruta.

## Logs

Se configuro archivo:

```text
backend/control-ropa/logs/control-ropa.log
```

Para revisar errores:

```powershell
Get-Content backend\control-ropa\logs\control-ropa.log -Tail 200
```

Buscar errores recientes:

```powershell
Select-String -Path backend\control-ropa\logs\control-ropa.log -Pattern "Error interno no controlado|Exception|ERROR"
```

## Validaciónes recomendadas por QA

1. Iniciar sesión con cada usuario QA y capturar screenshot del menu principal.
2. Confirmar que cada rol solo vea modulos esperados.
3. Intentar abrir manualmente una ruta no permitida y esperar mensaje controlado, no pantalla rota.
4. Forzar validaciónes conocidas: envio paqueteria sin guia, envio sin paquetes, catalogo sin resultados, pago incompleto, transferencia sin pedido.
5. Al aparecer un error inesperado, registrar hora, usuario, ruta y revisar `logs/control-ropa.log`.

## Pendiente recomendado

Agregar validaciónes backend por rol/sucursal en modulos que hoy dependen mucho del menu movil, especialmente devoluciones e incidencias.
