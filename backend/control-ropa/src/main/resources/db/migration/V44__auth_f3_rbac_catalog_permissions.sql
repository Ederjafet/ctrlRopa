SET NAMES utf8mb4;
START TRANSACTION;

-- AUTH-F3 catalogo RBAC minimo aprobado.
-- Solo crea permisos. No asigna permisos a roles productivos.
INSERT IGNORE INTO permissions (code, name) VALUES
  ('CREATE_CUSTOMER', 'Crear clientes'),
  ('EDIT_CUSTOMER', 'Editar clientes'),
  ('VIEW_PAYMENTS', 'Ver pagos'),
  ('VIEW_SALES', 'Ver ventas');

COMMIT;
