# LIVE-HOLD-UX-FAST-2 - Destacar interesados en apartados recientes LIVE

## Resumen ejecutivo

Se mejoro la seccion `Apartados recientes` de `/live` para que los apartados creados con alias/interesado destaquen como seguimiento operativo prioritario. El alias ahora es protagonista, `Sin telefono` deja de ocupar la linea principal y `Vincular cliente` queda como accion principal preparada.

## Problema visual corregido

Antes un apartado con alias se leia como texto normal:

```text
Interesado: Prueba de alias
Sin telefono
```

Esto no comunicaba que faltaba seguimiento operativo ni que ese alias debe vincularse a un cliente formal.

## Como se destaca ahora INTERESADO

Cuando una reserva no tiene cliente formal y si tiene alias:

- se muestra badge `INTERESADO`;
- el alias se muestra en una linea fuerte;
- aparece el texto `Pendiente: vincular cliente`;
- la card recibe un tratamiento visual sutil de advertencia;
- la linea de resumen prioriza prenda, monto, estado de pago y sucursal.

Formato esperado:

```text
Apartado LIVE · En vivo #22
[INTERESADO] Prueba de alias
Pendiente: vincular cliente
Falda · $500.00 · Sin pago · QA Centro
[Vincular cliente] [Ver detalle] [Mas acciones]
```

## Como se muestra cliente formal

Cuando la reserva tiene cliente formal:

- se muestra badge `CLIENTE`;
- el nombre del cliente se mantiene limpio y compacto;
- no aparece `Vincular cliente`;
- conserva `Ver detalle` y `Mas acciones`.

Formato esperado:

```text
Apartado LIVE · En vivo #22
[CLIENTE] Florencia
Falda · $599.00 · Sin pago · QA Centro
[Ver detalle] [Mas acciones]
```

## Accion principal para interesado

`Vincular cliente` queda como accion principal visible para reservas con alias/interesado. En esta fase queda deshabilitada con mensaje claro porque el backend auditado para vincular alias a cliente formal todavia no existe.

No se crean clientes fake automaticamente.

## Sin telefono

`Sin telefono` deja de mostrarse como linea principal en `Apartados recientes`. Ese dato queda fuera de la vista rapida para reducir ruido visual y puede revisarse en detalle cuando aplique.

## Mas acciones

`Mas acciones` conserva acciones secundarias o avanzadas:

- Ver detalle.
- Vincular cliente.
- Venta inmediata LIVE.
- Cancelar apartado.
- Acciones de retorno/deshacer segun estado y permisos.

`Venta inmediata LIVE` sigue siendo accion avanzada y no vuelve a ser accion principal.

## Texto prohibido

Se verifico que la interfaz objetivo no use:

```text
Cerrar como venta LIVE
```

La copia vigente es:

```text
Venta inmediata LIVE
```

## Validaciones

Validaciones requeridas:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

Backend test no aplica porque no se toca backend.

## Smoke visual recomendado

1. Abrir `/live`.
2. Ubicar o crear apartado con alias/interesado.
3. Confirmar badge `INTERESADO`.
4. Confirmar que el alias destaca sobre datos secundarios.
5. Confirmar texto `Pendiente: vincular cliente`.
6. Confirmar que `Sin telefono` no aparece como linea principal.
7. Confirmar que `Vincular cliente` aparece como accion principal deshabilitada con explicacion.
8. Confirmar que `Ver detalle` y `Mas acciones` siguen visibles.
9. Confirmar que un apartado con cliente formal se muestra como `CLIENTE`.
10. Confirmar que no aparece `Cerrar como venta LIVE`.
11. Confirmar que `/reservations` sigue funcionando.

## Riesgos

- La vinculacion real de alias a cliente formal sigue pendiente de backend y auditoria.
- La card reciente evita mostrar datos secundarios para mantener foco operativo; esos datos deben consultarse en detalle.

## Siguiente fase recomendada

Implementar el flujo real de `Vincular cliente` para alias/interesado, con seleccion de cliente formal, auditoria y sin crear clientes fake automaticamente.
