# HOLD-SHIP-UX-FAST-9 - Apartados alineados con LIVE

## Resumen ejecutivo

Se alineo la vista de `/reservations` con el patron visual ya usado en LIVE / Apartados recientes. Cada apartado ahora se muestra como una fila/card compacta con identidad, cliente o interesado, seguimiento operativo, monto y acciones en una estructura similar a LIVE.

No se tocaron backend, migraciones, Android/EAS ni polling.

## Problema corregido

`/reservations` seguia usando una card distinta a LIVE: mas badges, bloque visual separado para interesado y acciones con jerarquia diferente. Eso hacia que el operador viera el mismo apartado como si perteneciera a dos modulos distintos.

## Alineacion con LIVE

- Se retiro el badge fuerte de estado dentro de cada card.
- Se elimino el bloque visual tipo alerta para alias/interesado.
- Se adopto una estructura de tres zonas:
  - identidad: `Apartado #... - canal`;
  - seguimiento: caja, prenda y sucursal;
  - operacion: pago en detalle, monto y acciones compactas.
- `Detalle` y `Mas` quedan como acciones consistentes con LIVE.

## Cliente formal

Los apartados con cliente formal se muestran como:

```text
Apartado #80 - Live #22
Cliente - Florencia
En caja: QA_BOX_A
Blusa - QA Centro - Caja: QA_BOX_A
[Crear paquete] [Detalle] [Mas]
```

La accion principal sigue saliendo del estado operativo actual; para cliente formal puede ser `Crear paquete`, `Asignar caja` u otra accion existente.

## Interesado / alias

Los apartados con alias se muestran como:

```text
Apartado #81 - Live #22
Interesado - Prueba de alias
Pendiente: vincular cliente
Falda - QA Centro - Caja: Sin caja
[Vincular cliente] [Detalle] [Mas]
```

El interesado conserva mayor enfasis visual con color de acento, pero sin alerta fuerte ni exceso de etiquetas.

## Acciones principales

- Interesado sin cliente formal: `Vincular cliente`.
- Cliente formal: accion operativa vigente, como `Crear paquete` o `Asignar caja`.
- Si no hay accion operativa clara: se conserva `Detalle` como accion visible.
- No se habilita `Crear paquete` para interesado sin cliente formal.

## Mas acciones

`Mas` conserva el modal de acciones secundarias existente:

- detalle;
- asignar o cambiar caja;
- vincular cliente;
- crear paquete;
- ver pagos;
- registrar abono;
- Venta inmediata LIVE;
- cancelar apartado;
- acciones pendientes deshabilitadas con explicacion.

No se reintrodujo `Cerrar como venta LIVE`.

## Busqueda, tabs y carga

Se conservaron:

- busqueda por cliente, interesado/alias, prenda, caja y canal;
- tabs operativos;
- KPIs compactos;
- limite inicial de 25 apartados;
- `Cargar mas`;
- boton manual `Actualizar`.

## Componente comun

No se extrajo un componente compartido en esta fase para evitar ampliar el alcance. La estructura visual de `/reservations` replica el patron de LIVE con cambios focalizados. Queda recomendado extraer un componente comun si el mismo patron se usa en una tercera pantalla.

## Validaciones

Comandos obligatorios de la fase:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

Backend test no aplica porque no se modifico backend.

Resultado de esta corrida:

- `npm run lint`: PASS sin errores, con 53 warnings preexistentes del proyecto.
- `npx tsc --noEmit`: PASS.
- `git --no-pager diff --check`: PASS.

## Smoke visual recomendado

1. Abrir LIVE y revisar `Apartados recientes`.
2. Abrir `/reservations`.
3. Confirmar que cliente formal se ve como `Cliente - nombre`.
4. Confirmar que interesado se ve como `Interesado - alias`.
5. Confirmar que no hay exceso de badges.
6. Confirmar que no aparece un bloque grande de `Siguiente accion`.
7. Confirmar que botones `Detalle` y `Mas` son consistentes con LIVE.
8. Confirmar que `Crear paquete` solo aplica a cliente formal.
9. Confirmar que busqueda por alias, tabs y `Cargar mas` siguen funcionando.
10. Confirmar que no hay polling automatico.
11. Confirmar mobile sin scroll horizontal.

## Riesgos

- El listado sigue mostrando `Pago en detalle` porque no hay resumen agregado de pagos por reserva sin caer en N+1.
- El componente comun queda pendiente para reducir duplicacion futura.
- La validacion visual final debe hacerse con datos reales de cliente formal e interesado.

## Siguiente fase recomendada

HOLD-SHIP-UX-FAST-10: extraer un componente comun de apartado si se confirma que LIVE, `/reservations` y paquetes comparten el mismo patron visual.
