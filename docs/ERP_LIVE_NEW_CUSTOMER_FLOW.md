# ERP LIVE - Flujo para cliente nuevo

Fecha: 2026-05-20  
Fase: LIVE-S

## Objetivo

Permitir que el operador resuelva el caso de un espectador que no existe como cliente durante En vivo.

## Implementacion aplicada

- `app/live.tsx` agrega accion `Crear cliente rapido`.
- La accion abre `customers-create` con `returnTo=/live`.
- `app/customers-create.tsx` respeta `returnTo` y regresa a En vivo despues de guardar.

## Alcance

No se implemento cliente temporal ni modelo de interesado porque requiere reglas de datos, duplicados y auditoria. Queda documentado para fase futura.

## Flujo recomendado actual

1. Operador busca cliente en En vivo.
2. Si no existe, usa `Crear cliente rapido`.
3. Captura nombre y telefono.
4. Regresa a En vivo.
5. Selecciona el cliente recien creado desde la lista.

## Riesgos de datos

- Puede haber duplicados si el telefono/nombre se captura distinto.
- No hay reputacion de cliente ni historial de no pago en esta fase.
- No hay categoria formal `interesado`.

## Recomendacion futura

Crear flujo backend para:

- cliente temporal/interesado,
- deduplicacion por telefono normalizado,
- conversion a cliente,
- historial de interacciones,
- reputacion operativa.
