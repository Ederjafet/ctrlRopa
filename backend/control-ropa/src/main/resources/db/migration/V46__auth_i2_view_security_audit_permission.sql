SET NAMES utf8mb4;
START TRANSACTION;

-- AUTH-I2: permiso dedicado para consultar auditoria de seguridad.
-- No asigna permisos a roles productivos.
INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_SECURITY_AUDIT', 'Ver auditoria de seguridad');

COMMIT;
