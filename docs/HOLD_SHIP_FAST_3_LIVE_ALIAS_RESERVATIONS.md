# HOLD-SHIP-FAST-3 - Alias de interesado en LIVE y apartados

## Resumen ejecutivo

HOLD-SHIP-FAST-3 habilita el caso operativo de live-commerce donde una prenda se aparta antes de tener un cliente formal registrado. El flujo LIVE ahora permite crear una reserva con cliente formal seleccionado o con un alias/nick temporal del interesado.

El cambio no crea clientes falsos automaticamente. El alias queda guardado en la reserva y se expone en `/reservations` para que el equipo pueda identificar, buscar y dar seguimiento al apartado.

## Problema operativo resuelto

Antes de esta fase, `Apartar ahora` exigia `customerId`. En operacion real de LIVE muchas ventas empiezan con un identificador rapido, como usuario de Facebook, Instagram, TikTok o WhatsApp. Forzar la creacion previa de cliente hacia lento el flujo y podia producir clientes incompletos.

## Cambios en LIVE

En la seccion `Cliente / interesado` se agrego un campo visible:

- Label: `Alias o nick:`
- Placeholder: `Escribe alias del cliente`

La seleccion de cliente formal sigue disponible y conserva prioridad visual. Si el operador escribe alias sin seleccionar cliente, la reserva puede crearse como interesado temporal.

## Cambios en Apartar ahora

La validacion de reserva ahora permite:

- prenda al aire valida;
- precio de reserva valido;
- cliente formal seleccionado o alias/nick valido.

Mensajes aplicados:

- Sin cliente ni alias: `Selecciona un cliente o escribe un alias/nick del interesado.`
- Alias corto: `El alias debe tener al menos 2 caracteres.`
- Alias largo: `El alias no debe superar 80 caracteres.`

El alias se limpia con `trim()` antes de enviarse. El rango valido es de 2 a 80 caracteres.

## Cambios backend

Se agrego `interestedAlias` al contrato de reserva y se hizo opcional `customerId` solo cuando existe alias valido.

Reglas backend:

- `customerId` puede ser nulo si `interestedAlias` existe.
- `interestedAlias` puede ser nulo si `customerId` existe.
- ambos no pueden estar vacios.
- no se crea cliente automaticamente.
- la reserva mantiene branch/company por las relaciones existentes de item, branch y LIVE.
- la idempotencia incluye el alias cuando existe, y conserva el hash historico cuando no existe alias.

Las reservas con alias no se agregan automaticamente a una orden de cliente, porque todavia no existe cliente formal. La creacion de paquete para reservas con alias queda protegida hasta que se vincule o convierta el interesado.

## Migracion creada

`V58__reservations_interested_alias.sql`

La migracion:

- agrega `reservations.interested_alias VARCHAR(80) NULL` si no existe;
- convierte `reservations.customer_id` a nullable si aun era obligatorio;
- no borra datos;
- no crea clientes;
- no toca pagos, caja, devoluciones, venta financiera, LIVE funcional ni Android/EAS.

## Cambios en /reservations

La pantalla de apartados muestra ahora:

- con cliente formal: `Cliente: <nombre>`;
- sin cliente y con alias: `Interesado: <alias>`;
- sin datos: `Sin cliente/interesado`.

La busqueda de `/reservations` incluye `interestedAlias`, ademas de cliente, prenda, caja, canal y LIVE. La UI compacta de HOLD-SHIP-FAST-2 se conserva y no se agrego polling automatico.

## Reglas de negocio

1. Una reserva puede tener cliente formal o alias.
2. No se deben crear clientes fake automaticamente.
3. El alias representa un interesado temporal.
4. El alias debe poder buscarse desde `/reservations`.
5. El alias podra usarse como punto de partida para paquetes HOLD-SHIP.
6. Posteriormente el alias podra convertirse o vincularse a cliente formal.
7. Si existe cliente formal, ese cliente tiene prioridad visual.
8. Si no existe cliente formal, se muestra `Interesado: alias`.
9. El alias queda trazado en la reserva y en el evento LIVE de creacion.
10. El alias respeta sucursal/tenant mediante la reserva.

## Acciones futuras

- Convertir alias en cliente formal.
- Vincular alias a cliente existente.
- Editar alias con auditoria.
- Buscar reservas por alias desde vistas operativas avanzadas.
- Crear paquete usando alias despues de definir cliente formal o reglas de paquete temporal.

## Validaciones

Validaciones tecnicas esperadas:

- `npm run lint`
- `npx tsc --noEmit`
- `./mvnw.cmd test`
- `git --no-pager diff --check`

Pruebas backend agregadas:

- crea reserva LIVE con alias sin crear cliente fake ni orden de cliente;
- rechaza reserva sin cliente y sin alias;
- rechaza alias menor a 2 caracteres.

## Smoke QA recomendado

Caso cliente formal:

1. Entrar a LIVE.
2. Poner prenda al aire.
3. Seleccionar cliente formal.
4. Apartar ahora.
5. Confirmar en `/reservations`: `Cliente: <nombre>`.

Caso alias:

1. Entrar a LIVE.
2. Poner prenda al aire.
3. No seleccionar cliente formal.
4. Escribir `@maria_live`.
5. Apartar ahora.
6. Confirmar en `/reservations`: `Interesado: @maria_live`.
7. Buscar `@maria_live` y confirmar que aparece el apartado.

Caso validacion:

1. Entrar a LIVE.
2. Poner prenda al aire.
3. No seleccionar cliente ni alias.
4. Confirmar el mensaje: `Selecciona un cliente o escribe un alias/nick del interesado.`

## Riesgos

- Las reservas con alias no pueden crear paquete automaticamente hasta definir la regla de cliente formal o paquete temporal.
- La migracion hace nullable `customer_id` en reservas; las rutas que crean paquetes quedan protegidas para evitar NPE o paquetes sin cliente.
- La conversion de alias a cliente formal requiere fase posterior con auditoria.

## Siguiente fase recomendada

HOLD-SHIP-FAST-4: vincular o convertir alias en cliente formal desde `/reservations`, con auditoria y reglas para habilitar paquete/envio.

## Resultado

GO_TECNICO si pasan lint, TypeScript y pruebas backend.
