# ERP LIVE - Analiticos activables desde Sistema

Fecha: 2026-05-20  
Fase: LIVE-S - operacion QA, analiticos y producto activo

## Objetivo

Permitir que el equipo operativo active u oculte los analiticos visuales de En vivo sin tocar backend ni cambiar el flujo de reservas.

## Implementacion aplicada

- Se agrego una preferencia local en `services/liveAnalyticsPreference.ts`.
- `app/system.tsx` muestra la opcion en `Sistema`.
- `app/live.tsx` lee la preferencia al entrar a la pantalla.
- Cuando la preferencia esta apagada:
  - se ocultan metricas demo,
  - se ocultan comentarios/actividad visual demostrativa,
  - se mantiene la seleccion de transmision, cliente, prenda, precio y reserva.

## Decision tecnica

No se creo endpoint backend porque la fase requiere cambio acotado. La preferencia queda local al dispositivo y documentada como control temporal.

## Riesgos

- La preferencia no se sincroniza entre dispositivos.
- Un operador puede tener analiticos visibles y otro ocultos.
- Para SaaS real se recomienda persistir por company/user en backend con auditoria.

## QA esperado

- En `Sistema`, apagar analiticos.
- Abrir `En vivo`.
- Confirmar que el flujo de reservas sigue disponible.
- Confirmar que las metricas demo y actividad visual no aparecen.
- Volver a `Sistema`, encender analiticos.
- Confirmar que metricas y actividad visual vuelven a mostrarse.
