# PROJECT-GOV-B1 - Control de aprobacion arquitectonica para backlog autonomo

## Problema detectado

PROJECT-GOV-B permitio que Codex eligiera autonomamente `SEC-CONFIG-A`. El cambio fue util y quedo validado tecnicamente, pero expuso un riesgo de gobierno: una seleccion autonoma puede tocar seguridad, configuracion sensible o backend sin revision arquitectonica previa.

## Riesgo

Sin compuerta, Codex podria ejecutar cambios sensibles que requieren criterio de arquitectura, seguridad o negocio antes de modificar archivos. Esto puede afectar:

- seguridad;
- configuracion/secrets;
- autenticacion/autorizacion;
- backend funcional;
- migraciones;
- pagos/caja;
- LIVE critico;
- inventario critico.

## Regla nueva

Codex puede proponer y ejecutar cambios de bajo riesgo. Si el pendiente es sensible, debe detenerse y entregar un handoff para arquitectura antes de tocar codigo, configuracion o scripts.

## Bloques que Codex puede ejecutar directamente

- Documentacion.
- I18n y traducciones base.
- Copy/microcopy.
- UI visual de bajo riesgo sin cambio funcional.
- Evidencia QA.
- Actualizacion de tableros.
- Errores frontend no sensibles.
- Refactors pequenos sin cambio de comportamiento.

## Bloques que Codex debe proponer sin ejecutar

- Seguridad.
- Autenticacion.
- Autorizacion.
- RBAC/permisos.
- Backend funcional.
- Base de datos/migraciones.
- Configuracion sensible/secrets.
- Infraestructura/despliegue.
- CORS/sesion/tokens.
- Pagos/caja.
- LIVE critico.
- Cambios de precio.
- Inventario critico.
- Borrado o modificacion masiva de datos.
- Refactors grandes.

## Plantilla de handoff para arquitectura

```text
HANDOFF PARA ARQUITECTURA

Rama actual:
Fase sugerida:
Tipo de cambio:
Dominio:
Sensibilidad:
Motivo:
Riesgo:
Archivos estimados:
Validaciones requeridas:
Impacto QA:
Decisiones requeridas:
Recomendacion:
Ejecutar ahora: SI/NO
Motivo para detenerse:
Prompt de ejecucion sugerido:
```

## Flujo recomendado

1. Codex lee backlog y detecta si el bloque es sensible.
2. Si no es sensible, Codex puede ejecutar dentro del alcance.
3. Si es sensible, Codex entrega handoff y no toca codigo.
4. El usuario comparte el handoff con arquitectura.
5. Arquitectura aprueba, ajusta o rechaza.
6. Con aprobacion explicita, Codex ejecuta la fase aprobada.
7. Codex documenta, valida, genera evidencia y hace commit.
8. El usuario decide merge; Codex no hace merge a develop.

## Validacion local registrada de SEC-CONFIG-A1

Se registra como validacion DEV, no como QA formal:

- Backend vivo en puerto `8090`.
- `/api/me` respondio `401` esperado para sesion invalida/vencida.
- `git status` quedo limpio.
- `.env` no se versiono.

Estado: `DEV_VALIDATED` como nota operativa y `PENDING_QA` para QA formal.

## GO/NO-GO

GO documental para PROJECT-GOV-B1.

NO-GO para ejecucion autonoma de bloques sensibles sin aprobacion arquitectonica previa.

## Que sigue

En la siguiente corrida de backlog, Codex debe clasificar sensibilidad antes de ejecutar. Si el siguiente pendiente es `SECURITY-A`, `LIVE-Z10B`, `ITEM-Z1` o similar, debe entregar handoff para arquitectura y detenerse.
