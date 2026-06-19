# LIVE-HOLD-UX-FAST-6 - Aviso compacto y vinculacion de interesado

## Resumen ejecutivo

Esta fase mejora dos puntos operativos de LIVE:

- compacta el aviso de prenda ya apartada para que no repita texto ni muestre un boton grande deshabilitado;
- habilita la accion Vincular cliente para asociar un apartado creado con alias/interesado a un cliente formal existente.

No se crean clientes falsos, no se agregan migraciones y no se modifica Android/EAS.

## Prenda ya apartada

El bloque anterior mostraba el mensaje de prenda ya apartada dos veces y mantenia Apartar ahora como boton grande deshabilitado.

Ahora, cuando la prenda al aire ya tiene apartado activo, LIVE muestra un aviso compacto:

- titulo: Prenda ya apartada - Apartado #id;
- ayuda corta: cambia o retira la prenda del aire para continuar;
- accion compacta: Ver apartado.

Apartar ahora se oculta en ese estado porque la accion no aplica.

## Vincular cliente

Para apartados recientes con interestedAlias y sin customerId, la accion Vincular cliente ahora abre un modal operativo.

El modal permite:

- ver el alias/interesado actual;
- buscar clientes existentes;
- seleccionar un cliente;
- confirmar la vinculacion;
- mostrar loading y prevenir doble clic;
- cerrar con mensaje de exito o error claro.

La accion Convertir alias en cliente formal queda preparada como pendiente, sin crear clientes automaticamente.

## Endpoint creado

Se agrego el endpoint minimo:

```text
PATCH /api/reservations/{reservationId}/customer
```

Body:

```json
{
  "customerId": 123
}
```

El backend valida:

- reserva existente;
- usuario con acceso al canal/sucursal del apartado;
- cliente existente;
- cliente dentro del tenant/sucursal activa;
- misma sucursal entre cliente y apartado.

## interestedAlias

El campo interestedAlias se conserva como referencia historica. Si el apartado ya tiene customerId, la UI prioriza el cliente formal en LIVE y en /reservations.

## Cambios en LIVE

- Apartados recientes muestra Vincular cliente como accion principal cuando el apartado tiene alias y el usuario puede seleccionar cliente.
- Mas acciones mantiene Convertir alias en cliente formal como pendiente.
- Despues de vincular, el estado local de LIVE se actualiza sin polling.

## Cambios en /reservations

No fue necesario modificar /reservations: el read-model de reserva ya devuelve customerId/customerName y la pantalla prioriza cliente formal cuando existe.

## Pendientes

- Convertir alias en cliente formal desde el propio alias.
- Editar alias despues de creado el apartado.
- Mostrar alias historico solo en detalle/auditoria cuando ya esta vinculado a cliente.

## Validaciones

Validaciones requeridas:

- npm run lint;
- npx tsc --noEmit;
- ./mvnw.cmd test;
- git --no-pager diff --check.

## Smoke QA recomendado

1. Crear o ubicar apartado LIVE con alias.
2. Abrir Mas acciones o usar Vincular cliente desde Apartados recientes.
3. Buscar y seleccionar cliente existente.
4. Confirmar Vincular cliente.
5. Ver mensaje Cliente vinculado al apartado.
6. Confirmar que LIVE muestra Cliente - nombre.
7. Abrir /reservations y confirmar que se muestra como cliente formal.
8. Confirmar que no se creo cliente automatico desde el alias.
9. Confirmar que al tener una prenda ya apartada el aviso es compacto y no aparece Apartar ahora gigante.

## Riesgos

- Si el usuario no tiene permiso para administrar reservas LIVE, el backend bloquea la vinculacion.
- Si cliente y apartado pertenecen a sucursales distintas, la vinculacion se rechaza.
- Convertir alias en cliente formal requiere una fase posterior para definir datos minimos del cliente.

## Resultado

GO_TECNICO si lint, typecheck y pruebas backend pasan.

Siguiente fase recomendada: implementar conversion controlada de alias a cliente formal con campos minimos y QA visual.
