# ERP LIVE - Controles contra reservas falsas o maliciosas

Fecha: 2026-05-20  
Fase: LIVE-S

## Objetivo

Reducir riesgo operativo de reservas falsas sin bloquear ventas reales ni agregar reglas agresivas.

## Implementacion aplicada

Se agrego un aviso compacto en el flujo de reserva:

- confirmar telefono o nombre antes de reservar,
- si hay duda, registrar como interesado.

No se agregaron bloqueos backend ni reglas duras.

## Controles futuros propuestos

- limite de reservas pendientes por cliente,
- marca manual de cliente en riesgo,
- bloqueo temporal auditado,
- vencimiento/liberacion de reserva,
- historial de cancelaciones/no pago,
- reputacion operativa,
- confirmacion por telefono antes de apartar productos de alta demanda.

## Riesgos

- Bloqueos agresivos pueden afectar clientes legitimos.
- Sin auditoria, una marca de riesgo podria usarse mal.
- Sin vencimiento automatico, las reservas falsas siguen ocupando inventario.

## Criterio recomendado

Implementar primero controles manuales auditados y despues automatizar reglas con evidencia operacional.
