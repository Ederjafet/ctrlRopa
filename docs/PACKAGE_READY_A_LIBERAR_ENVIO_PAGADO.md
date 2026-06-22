# PACKAGE-READY-A - Liberar paquete pagado para envio

Fecha: 2026-06-22

## Problema detectado

En `/customer-package-detail?id=1` el paquete aparecia completamente pagado y con envio confirmado, pero la accion `Marcar listo para envio` no avanzaba de forma clara.

El caso revisado tenia:

- paquete en estado `OPEN`;
- prendas cargadas;
- costo de envio confirmado;
- pagos aplicados a prendas y al cargo de envio;
- saldo pendiente real `0.00`.

## Causa raiz

La causa fue principalmente de flujo frontend: la accion de liberar envio aun usaba confirmacion nativa con `Alert.alert`, que en web podia sentirse como boton bloqueado o no-op. Ademas, la pantalla duplicaba condiciones locales y no recibia del backend un campo explicito con `canMarkReadyForShipment` ni la razon de bloqueo.

Se corrigio tambien una brecha de consistencia monetaria: backend y frontend ahora normalizan el saldo a 2 decimales para decidir si existe pendiente. Esto evita que residuos sub-centavo produzcan contradicciones entre `$0.00` y estado parcial/bloqueado.

## Regla final

Un paquete puede marcarse listo para envio si:

- pertenece al tenant/sucursal del usuario;
- el usuario tiene `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- esta en estado `OPEN`;
- tiene al menos una prenda;
- el envio esta confirmado con costo mayor o igual a 0, o marcado como sin costo;
- el saldo pendiente normalizado a 2 decimales es `0.00`;
- no esta cancelado, enviado, entregado o cerrado.

## Backend

`CustomerPackageDetailResponse` expone:

- `canMarkReadyForShipment`
- `markReadyForShipmentBlockedReason`

`CustomerPackageService` calcula esos campos desde la misma regla que protege `markReady`.

El saldo se calcula como:

`pendingAmount = totalAmount - paidAmount`

Donde:

- `totalAmount = subtotal de prendas + costo de envio confirmado`
- `paidAmount = pagos aplicados a prendas + pagos aplicados al cargo de envio`
- `pendingAmount` se normaliza a 2 decimales antes de comparar.

Si bloquea por saldo, el mensaje incluye monto exacto:

`No puedes marcar listo para envio porque el paquete tiene saldo pendiente de $X.XX MXN.`

## Frontend

`/customer-package-detail` usa `canMarkReadyForShipment` y `markReadyForShipmentBlockedReason` del backend.

La accion `Marcar listo para envio` ya no depende de `Alert.alert`; ahora abre un `AppBottomModal` de confirmacion con:

- folio;
- estado;
- prendas;
- envio;
- subtotal;
- total;
- abonado;
- pendiente.

Si la accion esta bloqueada, la pantalla muestra la razon en un aviso visible. Si backend rechaza, el error se muestra en el modal y en el aviso superior.

## Mensajes de bloqueo

- Falta envio: `Antes de marcar listo para envio, captura el costo de paqueteria o marca envio sin costo.`
- Falta saldo: `No puedes marcar listo para envio porque el paquete tiene saldo pendiente de $X.XX MXN.`
- Falta permiso: `No tienes permiso para marcar listo para envio. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.`
- Estado no valido: `El paquete no puede prepararse para envio en su estado actual.`
- Sin prendas: `Agrega al menos una prenda antes de liberar envio.`

## Tests agregados

- paquete pagado completo con envio confirmado permite `markReady`;
- paquete pagado completo con envio sin costo permite `markReady`;
- paquete con saldo pendiente por envio bloquea con monto;
- residuo sub-centavo no bloquea si redondea a `0.00`.

## Validaciones

- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: OK.
- `./mvnw.cmd test` cargando `.env` local sin imprimir secretos: OK.
- `npm run lint`: OK, con 50 warnings historicos y 0 errores.
- `npx tsc --noEmit`: OK.
- `git diff --check`: OK.

## Decision

GO si las validaciones finales pasan: paquete pagado y envio confirmado puede liberarse; si falta algo, la UI y backend muestran causa clara.
