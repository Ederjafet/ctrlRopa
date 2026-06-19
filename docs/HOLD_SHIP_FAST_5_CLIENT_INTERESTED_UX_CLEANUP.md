# HOLD-SHIP-FAST-5 - Limpieza UX de cliente/interesado y venta inmediata LIVE

## Resumen ejecutivo

Se ajusto la jerarquia visual de LIVE y `/reservations` para que el flujo operativo muestre una sola accion principal, reduzca ruido de badges y deje `Venta inmediata LIVE` como accion avanzada. No se implementaron reglas backend nuevas, no se crearon migraciones y no se agrego polling automatico.

## LIVE / Apartados recientes

- Se reemplazo la copia visible de `Cerrar como venta LIVE` por `Venta inmediata LIVE`.
- En `Apartados recientes`, la accion principal visible queda como `Ver detalle`.
- Las acciones secundarias se agrupan en `Mas acciones`.
- Dentro de `Mas acciones` quedan, segun estado/permisos:
  - `Vincular cliente` deshabilitado para alias/interesado, con mensaje de pendiente.
  - `Venta inmediata LIVE`.
  - `Deshacer cierre de venta LIVE`.
  - `Volver a apartado`.
  - `Cobrar`.
  - `Cancelar apartado`.
- `Venta inmediata LIVE` conserva la confirmacion existente y la proteccion de pago/caja; solo baja de jerarquia visual.

## /reservations

- Se redujo la combinacion de badges fuertes `INTERESADO`, `Sin caja` y `Falta cliente`.
- La card ahora prioriza:
  - folio;
  - tipo de persona: `Cliente` o `Interesado`;
  - nombre/alias;
  - linea operativa breve con pendiente, caja, monto y canal;
  - una accion principal.
- Para alias/interesado, la accion principal sigue siendo `Vincular cliente`.
- Para cliente formal, la accion principal sigue el flujo operativo vigente, principalmente `Crear paquete`.
- `Mas acciones` conserva acciones secundarias y pendientes sin presentarlas como flujo principal.

## Cliente vs Interesado

Cliente formal:

```text
Apartado #80 · Cliente
Florencia
Caja: QA_BOX_A · Monto: $599.00 · Canal: Live #22
[Crear paquete] [Mas acciones]
```

Interesado/alias:

```text
Apartado #81 · Interesado
Prueba de alias
Pendiente: vincular cliente · Caja: Sin caja · Monto: $500.00 · Canal: Live #22
[Vincular cliente] [Mas acciones]
```

## Acciones principales

- Interesado/alias sin cliente formal: `Vincular cliente`.
- Cliente formal activo: `Crear paquete`.
- Apartado no activo: `Ver detalle`.

## Acciones en Mas acciones

Se mantienen como acciones secundarias o avanzadas:

- Ver detalle.
- Asignar caja / Cambiar caja.
- Editar alias.
- Vincular cliente.
- Convertir a cliente formal.
- Crear paquete.
- Ver pagos.
- Registrar abono.
- Venta inmediata LIVE.
- Cancelar apartado.

Las acciones sin soporte backend completo quedan deshabilitadas con mensaje claro.

## Badges reducidos

- `INTERESADO` pasa a texto de tipo: `Apartado # · Interesado`.
- `Falta cliente` pasa a linea de seguimiento: `Pendiente: vincular cliente`.
- `Sin caja` pasa a dato operativo: `Caja: Sin caja`.
- Se conserva el estado general del apartado como badge compacto.

## Validaciones

Validaciones requeridas para esta fase:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

No se requiere `mvnw test` porque no se toca backend.

## Smoke QA recomendado

1. Abrir `/live`.
2. Revisar `Apartados recientes`.
3. Confirmar que no aparece `Cerrar como venta LIVE`.
4. Confirmar que `Venta inmediata LIVE` aparece solo en `Mas acciones`.
5. Confirmar que `Ver detalle` es la accion visible principal.
6. Abrir `/reservations`.
7. Confirmar que cliente formal se ve como `Apartado # · Cliente`.
8. Confirmar que interesado se ve como `Apartado # · Interesado`.
9. Confirmar que alias/interesado muestra `Pendiente: vincular cliente`.
10. Confirmar que no se repite un bloque grande de `Siguiente accion` junto al mismo boton.
11. Confirmar que `Cargar mas` sigue funcionando.
12. Confirmar que no existe polling automatico.

## Riesgos

- `Vincular cliente`, `Convertir a cliente formal` y `Editar alias` siguen pendientes de backend auditado.
- `Venta inmediata LIVE` sigue siendo una accion operativa sensible y debe mantenerse como excepcion, no como ruta normal del flujo HOLD-SHIP.
- La paginacion sigue siendo frontend; backend pagination queda como mejora futura si crece el volumen.

## Siguiente fase recomendada

HOLD-SHIP-FAST-6 deberia implementar el primer flujo real de vinculacion de alias a cliente formal, con auditoria y sin crear clientes fake automaticamente.

## Resultado

GO_TECNICO si lint, TypeScript y diff check pasan.
