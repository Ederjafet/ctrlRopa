# ERP - Definicion de hecho

Una mejora ERP solo se considera terminada si cumple:

1. Analisis documentado.
2. Impacto identificado en frontend, backend, base de datos, permisos, QA y reportes.
3. Implementacion pequena y reversible.
4. Validaciones frontend/backend alineadas.
5. Mensajes UX homologados.
6. Permisos probados con usuario permitido y usuario no permitido.
7. Auditoria definida para acciones sensibles.
8. Pruebas ejecutadas y registradas.
9. Regresion de flujos relacionados ejecutada.
10. Documentacion actualizada.
11. Checklist de release completado.

## Criterios por tipo

Pantalla:

- Responsive web/mobile.
- Sin textos tecnicos.
- Sin botones que "no hagan nada".
- Estados vacio/cargando/error/listo.

Endpoint:

- Valida token, usuario activo, permiso y reglas de negocio.
- Devuelve errores claros.
- Tiene prueba o caso QA documentado.

Base de datos:

- Migracion reversible o segura.
- Indices/llaves evaluados.
- Impacto en datos existentes documentado.

