# ERP LIVE - Revision de feedback QA

Fecha: 2026-05-19  
Fase: LIVE-Q - usability hardening

## Objetivo

Consolidar feedback visual/operativo antes de declarar `En vivo` como demo candidate.

## Matriz de feedback

| Feedback | Severidad | Accion | Decision | Backlog futuro |
|---|---|---|---|---|
| Status bar Android/tablet invade contenido | ALTO | Agregar resguardo superior local en header de `app/live.tsx` usando safe area e insets. | Atendido en frontend LIVE. | Validar en Android fisico y iPad. |
| Algunas cards no se entienden | MEDIO | Reducir textos, ocultar tarjetas de roles en movil y limitar lineas en tablet/desktop. | Atendido parcialmente. | Continuar simplificacion tras smoke con operador real. |
| Wording tecnico/ERP | MEDIO | Cambiar microcopy a lenguaje comercial: transmision activa, abrir nueva transmision, reservas aqui. | Atendido en LIVE/i18n. | Barrido completo del ERP queda pendiente. |
| Mobile muestra demasiado contenido | MEDIO | Ocultar franja de roles en movil y dejar header corto. | Atendido. | Futuro: modo mobile con secciones plegables. |
| Tablet parece responsive web | ALTO | Mantener tablet como consola, ajustar header, reducir ayudas y reforzar acciones rapidas. | Atendido parcialmente. | Validar 1024x768, 1280x800, Galaxy Tab/iPad. |
| Falta jerarquia visual | MEDIO | Header por dispositivo, cards mas compactas y textos con maximo de lineas. | Atendido. | Futuro: imagen real de producto y eventos reales. |

## Resultado

El modulo queda mejor preparado para demo visual, pero no debe declararse listo para produccion live-commerce real hasta validar en dispositivo fisico y reemplazar datos simulados por eventos reales.
