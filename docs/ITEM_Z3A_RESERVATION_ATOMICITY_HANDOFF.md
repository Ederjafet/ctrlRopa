# ITEM-Z3A - Handoff tecnico de atomicidad de reservas LIVE

## Resumen ejecutivo

ITEM-Z3A audita el flujo real de reservas e inventario antes de tocar atomicidad de base de datos. La fase no implementa cambios funcionales.

Resultado esperado:

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z3B`

La recomendacion para ITEM-Z3B es proteger la transicion `AVAILABLE -> RESERVED` en backend con una operacion atomica condicionada por estado, manteniendo `@Transactional` y sin mezclar pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.

## Estado previo validado

Commits relevantes encontrados en historial:

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `5c7aced LIVE-PERM-A2 ajusta capacidades live por rol`
- `c818cb1 LIVE-PERM-A3 documenta smoke visual por rol`

Estado funcional previo:

- `items.status` es la fuente real de disponibilidad.
- `ReservationService.create` bloquea si el item no esta `AVAILABLE`.
- Al reservar, `ReservationService.create` cambia el item a `RESERVED`.
- `LiveService.setActiveItem` ya solo permite poner/cambiar como prenda al aire items `AVAILABLE`.
- `lives.active_item_id` representa "prenda al aire" y no bloquea inventario.
- `OPERATIONAL_SOLD` es cierre operativo LIVE, no venta financiera.

## Estado actual real

### Como `ReservationService.create` obtiene el item

El flujo actual:

1. Resuelve `userId`.
2. Valida branch del request con `TenantAccessGuard`.
3. Carga item con `itemRepository.findById(request.getItemId())`.
4. Valida que el item pertenezca a la branch activa con `TenantAccessGuard`.
5. Valida `item.getStatus() == ItemStatus.AVAILABLE`.
6. Carga customer, branch, sales channel y live si aplica.
7. Valida permisos por canal:
   - LIVE: `DO_LIVE_RESERVATION`.
   - Door reservation: `DO_DOOR_RESERVATION`.
8. Busca reserva activa existente con `repository.findByItemIdAndStatus(item.getId(), ReservationStatus.ACTIVE)`.
9. Ajusta precio si se envio en request.
10. Crea `Reservation`.
11. Ejecuta `item.setStatus(ItemStatus.RESERVED)`.
12. Ejecuta `itemRepository.save(item)`.
13. Ejecuta `repository.save(entity)`.
14. Crea/actualiza orden abierta.
15. Registra evento LIVE si aplica.

### Transaccion

`ReservationService` esta anotado a nivel clase con `@Transactional`. Por tanto, `create` corre dentro de una transaccion.

Esto ayuda a rollback si falla una operacion posterior, pero no elimina por si solo la carrera entre:

- leer `AVAILABLE`;
- validar que no hay reserva activa;
- escribir `RESERVED`;
- crear la reserva.

### Locking / versionado / updates condicionales

Hallazgos:

- No se encontro `@Version` en `Item` ni `Reservation`.
- No se encontro locking pesimista en `ItemRepository` ni `ReservationRepository`.
- No se encontro metodo `find...ForUpdate`.
- No se encontro update condicional `WHERE status = 'AVAILABLE'` para reservar item.
- `ReservationRepository.findByItemIdAndStatus` no usa lock.
- La tabla `reservations` tiene indices por `item_id` y `status`, pero no constraint unica para reserva activa por item.
- La tabla `items` tiene indice por `status` y `idx_items_company_branch_status`, pero no version column.

### Tests existentes

Se encontro:

- `ReservationServiceLiveOperationalStatusTests`: cubre cambios de estado operacional LIVE.
- `LiveServiceTests`: cubre prenda al aire y elegibilidad de ITEM-Z2.

No se encontro test de:

- creacion de reserva feliz/no disponible;
- doble submit;
- concurrencia;
- update atomico;
- lock pesimista;
- reserva LIVE vs reserva puerta compitiendo por el mismo item.

## Riesgos detectados

| Riesgo | Severidad | Hallazgo |
| --- | --- | --- |
| Doble submit frontend | Alta | Dos clicks o retries pueden llegar antes de que UI refresque estado. |
| Dos usuarios reservando misma prenda | Critica | Dos transacciones pueden leer `AVAILABLE` antes de guardar `RESERVED`. |
| Race entre validar y guardar | Critica | `@Transactional` no bloquea el row por si solo. |
| Reserva LIVE vs reserva normal | Critica | Ambos usan `ReservationService.create`; compiten por el mismo item. |
| Active item vs status | Media | `lives.active_item_id` no bloquea inventario; esto es correcto, pero debe seguir documentado. |
| Tenant/company/branch | Alta | `create` valida branch despues de cargar item por id global; la validacion existe, pero Z3B debe preferir queries con company/branch cuando sea posible. |
| Rollback parcial | Media | `@Transactional` mitiga rollback, pero la solucion Z3B debe conservar una sola transaccion. |
| UX por competencia | Media | El segundo usuario debe recibir mensaje claro: la prenda ya no esta disponible. |

## Opciones tecnicas evaluadas

### Opcion 1 - `@Transactional` solamente

Estado: ya existe.

Ventajas:

- Sin cambio tecnico.
- Rollback de operaciones dentro del metodo.

Desventajas:

- No serializa dos transacciones concurrentes sobre el mismo item.
- No evita que dos usuarios lean `AVAILABLE` al mismo tiempo.

Decision: insuficiente para ITEM-Z3B.

### Opcion 2 - Lock pesimista `SELECT FOR UPDATE`

Propuesta:

- Agregar metodo en `ItemRepository` con `@Lock(PESSIMISTIC_WRITE)`.
- Cargar el item dentro de la transaccion con lock.
- Validar status y continuar.

Ventajas:

- Serializa el acceso al row del item.
- No requiere migracion si el proveedor JPA genera el lock correctamente.
- Mantiene entidad manejada por JPA.

Desventajas:

- Puede generar waits/timeouts si hay alta concurrencia.
- Requiere tests de integracion para confirmar SQL y comportamiento real en MySQL.
- Si se mantiene `findById` global, podria conservar deuda tenant; conviene incluir company/branch en el metodo.

Decision: viable, pero con riesgo operativo de locks y necesidad de smoke DB.

### Opcion 3 - Lock optimista con `@Version`

Propuesta:

- Agregar columna `version` a `items`.
- Agregar `@Version` en `Item`.
- Manejar `OptimisticLockException` como item ya no disponible.

Ventajas:

- Evita lost updates.
- Escala mejor que lock pesimista en algunos escenarios.

Desventajas:

- Requiere migracion.
- Afecta todos los updates de items, no solo reservas.
- Requiere manejo de excepciones y regresion amplia de inventario.

Decision: no recomendado como MVP de ITEM-Z3B; candidato posterior si inventario necesita control de version general.

### Opcion 4 - Update atomico condicional `AVAILABLE -> RESERVED`

Propuesta:

Agregar metodo de repositorio o servicio que ejecute una transicion atomica:

```sql
UPDATE items
SET status = 'RESERVED'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'AVAILABLE'
```

El metodo debe devolver filas afectadas:

- `1`: reserva puede continuar.
- `0`: la prenda ya no esta disponible o no pertenece al alcance esperado.

Ventajas:

- Protege exactamente la transicion critica.
- No requiere migracion.
- Evita que dos transacciones ganen la misma prenda.
- Mantiene el bloqueo en backend, no en UI.
- Es facil de probar con unit test de filas afectadas y con integracion.

Desventajas:

- Hay que cuidar el estado de la entidad JPA cargada antes del update.
- Debe mantener `@Transactional`.
- Debe devolver error claro si filas afectadas es `0`.
- Debe conservar validaciones tenant/branch/permisos.

Decision: opcion recomendada para ITEM-Z3B.

### Opcion 5 - Constraint o indice unico

Propuesta posible:

- Crear restriccion que impida mas de una reserva activa por item.

Ventajas:

- Defensa adicional en base de datos.
- Protege incluso si un flujo omite la validacion de servicio.

Desventajas:

- MySQL no soporta indices parciales simples tipo `WHERE status = ACTIVE`.
- Requeriria columna generada o diseno alterno.
- Puede impactar datos existentes y necesita auditoria previa.

Decision: no recomendado como primer cambio; evaluar como defensa adicional despues del update atomico.

### Opcion 6 - Idempotency key

Propuesta:

- Enviar una llave por intento de reserva para reconocer doble submit del mismo cliente.

Ventajas:

- Mejora UX y reintentos.
- Evita duplicar operaciones del mismo submit.

Desventajas:

- Requiere modelo de persistencia o contrato adicional.
- No reemplaza la proteccion backend de `AVAILABLE -> RESERVED`.

Decision: complemento futuro, no MVP de ITEM-Z3B.

### Opcion 7 - Bloqueo frontend temporal

Propuesta:

- Deshabilitar boton al enviar reserva.
- Mostrar estado de envio y evitar doble click.

Ventajas:

- Mejora UX.
- Reduce doble submit accidental.

Desventajas:

- No protege dos dispositivos, dos usuarios, refreshes ni retries.
- No sustituye backend.

Decision: recomendable como complemento, nunca como proteccion principal.

## Recomendacion para ITEM-Z3B

Implementar un MVP backend con update atomico condicional.

### Secuencia sugerida

1. Mantener `ReservationService.create` bajo `@Transactional`.
2. Resolver tenant/company/branch activa.
3. Cargar item de forma tenant-aware para validaciones visibles, precio y sucursal.
4. Validar customer, branch, sales channel, live y permisos.
5. Mantener check defensivo de reserva activa existente.
6. Ejecutar transicion atomica `AVAILABLE -> RESERVED` con company/branch/item.
7. Si filas afectadas es `0`, lanzar error claro:

```text
La prenda ya no esta disponible para apartar
```

8. Crear y guardar `Reservation`.
9. Crear/actualizar orden abierta.
10. Registrar evento LIVE si aplica.
11. Si cualquier paso posterior falla, la transaccion debe hacer rollback del update de item.

### Archivos probables

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java` o nuevo test equivalente
- `docs/ITEM_Z3B_RESERVATION_ATOMICITY.md`
- `qa-reports/ITEM-Z3B-...`
- `git-diffs/ITEM-Z3B-...`

### Migracion

No deberia requerir migracion para el MVP con update atomico condicional.

Si arquitectura decide agregar constraint/columna/version, abrir fase separada o ampliar Z3B con aprobacion explicita.

### Pruebas necesarias

Minimas:

- Reserva exitosa con item `AVAILABLE`.
- Rechazo si item `RESERVED`.
- Rechazo si item `SOLD`.
- Rechazo si item `DISABLED`.
- Rechazo si item `ON_CONSIGNMENT`.
- Si el update atomico devuelve `0`, no se crea reserva.
- Si falla crear orden/evento despues del update, rollback conserva item no reservado en DB de integracion.
- Reserva LIVE y reserva puerta usan la misma proteccion.
- Tenant/branch equivocados no actualizan items fuera de alcance.

Deseables:

- Test de integracion con dos transacciones simuladas sobre el mismo item.
- Test de doble submit desde el mismo usuario.
- Test de mensaje de error accionable en frontend si el backend devuelve conflicto/no disponible.

### Mensajes de error esperados

Backend:

```text
La prenda ya no esta disponible para apartar
```

Frontend:

```text
La prenda ya fue apartada o dejo de estar disponible. Actualiza la pantalla y selecciona otra prenda.
```

### Rollback

Si Z3B falla:

- Revertir cambios en `ReservationService` y `ItemRepository`.
- No deberia haber migracion que revertir si se sigue la opcion recomendada.
- Mantener ITEM-Z2 porque protege prenda al aire y no depende de Z3B.

## Alcance explicito de ITEM-Z3B

Permitido:

- Proteger `AVAILABLE -> RESERVED`.
- Mantener `ReservationService.create` como unico punto de reserva.
- Ajustar mensaje de error si es necesario.
- Agregar pruebas backend.

No permitido sin aprobacion nueva:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- permisos;
- RBAC;
- endpoints nuevos;
- venta financiera;
- conversion real a venta;
- persistencia de prenda preparada;
- cambios en `lives.active_item_id`.

## Criterio GO / NO-GO para ITEM-Z3B

`GO` si:

- El update atomico evita que dos reservas ganen el mismo item.
- Los tests backend pasan.
- No hay migracion innecesaria.
- No se toca pago/caja/precio/autorizaciones/RBAC.
- El error al segundo intento es accionable.
- `git diff --check` queda limpio.

`NO-GO` si:

- La solucion depende solo de frontend.
- La solucion crea permisos/endpoints/migraciones no aprobadas.
- La solucion toca pagos/caja/precio/autorizaciones.
- No hay prueba que cubra el caso de update atomico fallido.
- Se detecta riesgo de romper reservas existentes sin rollback claro.
