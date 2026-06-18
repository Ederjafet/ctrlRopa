# LIVE-Z9J - Sincronizacion de apartados para operador/admin

## Objetivo

Permitir que operador/admin vea apartados creados por otros usuarios durante `/live` sin salir y volver a entrar, manteniendo endpoints existentes y sin implementar WebSocket/SSE.

## Problema QA

El vendedor podia crear un apartado mientras operador/admin seguia en LIVE. La vista operador no recibia polling automatico y podia quedarse con apartados/eventos anteriores hasta un refresh manual o reentrada.

## Que se sincroniza

El refresh liviano de LIVE ahora tambien aplica a operador/admin:

- lista de lives de la sucursal;
- estado del live seleccionado;
- prenda al aire proveniente del backend;
- apartados recientes del live;
- eventos/actividad del live;
- indicador de ultima actualizacion;
- errores de refresh con el mapper accionable de PRODUCT-ERR-A.

## Que no se sobrescribe

Para no romper captura local del operador, el refresh automatico conserva:

- cliente seleccionado;
- prenda preparada para cambio;
- precio que el operador esta editando;
- busquedas, filtros y modales abiertos;
- formularios temporales de captura.

Si hay captura local en curso, la prenda al aire se actualiza en estado visual pero no se recalcula el `priceText` local.

## Frecuencia

- Polling controlado cada 15 segundos.
- Se pausa cuando `AppState` no esta activo.
- Se refresca al volver a foco.
- Se evita duplicar requests con un guard de refresh en curso.
- No consulta pagos ni caja durante polling.

## Aviso de nuevo apartado

Cuando el operador/admin recibe un apartado que no estaba en su lista previa, se muestra un aviso no bloqueante:

- titulo: `Nuevo apartado recibido`;
- mensaje: `Se agrego un apartado durante el LIVE.`;
- accion: `Ver apartados`.

El aviso no usa modal y no interrumpe la captura.

## Relacion con PRODUCT-ERR-A

Los fallos de refresh usan `getActionableApiError`, por lo que no se muestran mensajes genericos como `Ocurrio un error interno inesperado` ni detalles tecnicos.

## Limites

- No hay sincronizacion instantanea en tiempo real.
- WebSocket/SSE queda para una fase futura con contrato backend, tenant/security y estrategia de reconexion.
- No se agregan endpoints.
- No se cambian permisos, capacidades, pagos, caja ni reglas LIVE profundas.

## Validacion manual esperada

1. Admin/operador abre `/live`.
2. Vendedor abre `/live` en otro navegador/dispositivo.
3. Vendedor crea apartado.
4. Operador debe verlo sin salir/entrar.
5. Confirmar aviso `Nuevo apartado recibido`.
6. Confirmar que no se borra cliente seleccionado, prenda preparada ni precio en edicion.
7. Confirmar boton `Actualizar`.
8. Confirmar `Ultima actualizacion`.
9. Confirmar que `NO_ACCESS` no hace polling util.
10. Validar light/dark y mobile/tablet.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual multiusuario.
