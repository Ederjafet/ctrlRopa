# ERP LIVE-N - UX Copy Guide

Fecha: 2026-05-19

## Objetivo

Definir microcopy para que `En vivo` se perciba como live-commerce profesional y no como una pantalla ERP adaptada.

## Principios

- Texto corto.
- Accion clara.
- Menos explicacion, mas guia.
- Lenguaje comercial y operativo.
- Evitar jerga tecnica visible.
- Ajustar tono por dispositivo.

## Terminos preferidos

| Evitar | Usar |
|---|---|
| Live | En vivo |
| Dashboard | Panel |
| Timeline | Eventos |
| Capturar | Registrar |
| Alta | Crear |
| Demo | Demostracion |
| Sesion | Transmision |

## Tono por dispositivo

### Desktop

- Tono ejecutivo.
- Enfocado en resultado comercial.
- Puede mostrar mas contexto y metricas.

Ejemplos:

- `Resumen comercial`
- `Productos con mas interes`
- `Participacion estimada`

### Tablet

- Tono operativo.
- Enfocado en rapidez.
- Botones directos y claros.

Ejemplos:

- `Reservar ahora`
- `Seleccionar cliente`
- `Buscar prenda`

### Mobile

- Tono minimo.
- Una accion principal por bloque.
- Evitar explicaciones largas.

Ejemplos:

- `Registrar reserva`
- `Cambiar prenda`
- `Cobrar`

## Mensajes de error

- Deben decir que paso y que hacer.
- No duplicar permisos.
- No ocultar 403 reales.

Ejemplos:

- `No tienes permisos para cargar clientes.`
- `No fue posible cargar prendas. Intenta de nuevo.`
- `Selecciona cliente, prenda y precio para reservar.`

## Estados

- `Sin transmision`
- `Transmision abierta`
- `Transmision activa`
- `Transmision cerrada`

## Eventos

Los eventos visibles deben ser descripciones, no codigos:

- `Inicio de transmision`
- `Espectador conectado`
- `Producto destacado`
- `Comentario recibido`
- `Reaccion recibida`
- `Transmision finalizada`

## Pendiente

- Migrar textos historicos largos de `app/live.tsx` a microcopy mas corto por dispositivo.
- Revisar toda la app para retirar lenguaje tecnico fuera de LIVE.
