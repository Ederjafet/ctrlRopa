-- LIVE-AUTH-B1: MVP de autorizaciones operativas LIVE.
-- Aditiva: crea permisos, tabla de solicitudes y asignacion minima por rol.
-- No toca pagos, caja, precio LIVE, devoluciones ni venta financiera.

SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('REQUEST_LIVE_OPERATION_AUTHORIZATION', 'Solicitar autorizacion operativa LIVE'),
  ('APPROVE_LIVE_OPERATION_AUTHORIZATION', 'Aprobar autorizacion operativa LIVE'),
  ('VIEW_LIVE_OPERATION_AUTHORIZATIONS', 'Ver autorizaciones operativas LIVE'),
  ('APPLY_LIVE_OPERATION_AUTHORIZATION', 'Aplicar autorizacion operativa LIVE'),
  ('CANCEL_RESERVATION_WITH_PAYMENT', 'Cancelar apartado con pago'),
  ('RELEASE_RESERVED_ITEM', 'Liberar prenda apartada'),
  ('UNDO_LIVE_OPERATIONAL_SALE', 'Deshacer vendido operativo LIVE'),
  ('REASSIGN_RESERVATION', 'Reasignar apartado'),
  ('EDIT_LOCKED_ITEM', 'Editar prenda bloqueada');

CREATE TABLE IF NOT EXISTS operational_authorization_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  operation_type VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
  company_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  requested_by_user_id BIGINT UNSIGNED NOT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_by_user_id BIGINT UNSIGNED NULL,
  decided_at DATETIME NULL,
  applied_by_user_id BIGINT UNSIGNED NULL,
  applied_at DATETIME NULL,
  expires_at DATETIME NOT NULL,
  target_type VARCHAR(40) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  live_id BIGINT UNSIGNED NULL,
  reservation_id BIGINT UNSIGNED NULL,
  item_id BIGINT UNSIGNED NULL,
  payment_id BIGINT UNSIGNED NULL,
  sale_id BIGINT UNSIGNED NULL,
  reason TEXT NOT NULL,
  decision_reason TEXT NULL,
  current_state_hash VARCHAR(64) NULL,
  snapshot_json TEXT NULL,
  payload_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_op_auth_company_branch_created (company_id, branch_id, created_at),
  KEY idx_op_auth_branch_status_created (branch_id, status, created_at),
  KEY idx_op_auth_requester_created (requested_by_user_id, created_at),
  KEY idx_op_auth_target_status (company_id, branch_id, operation_type, target_type, target_id, status),
  KEY idx_op_auth_reservation_created (reservation_id, created_at),
  KEY idx_op_auth_item_created (item_id, created_at),
  KEY idx_op_auth_live_created (live_id, created_at)
);

-- ADMIN y SUPERVISOR pueden solicitar, ver, aprobar y aplicar el MVP.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'REQUEST_LIVE_OPERATION_AUTHORIZATION',
  'APPROVE_LIVE_OPERATION_AUTHORIZATION',
  'VIEW_LIVE_OPERATION_AUTHORIZATIONS',
  'APPLY_LIVE_OPERATION_AUTHORIZATION',
  'CANCEL_RESERVATION_WITH_PAYMENT',
  'RELEASE_RESERVED_ITEM',
  'UNDO_LIVE_OPERATIONAL_SALE',
  'REASSIGN_RESERVATION',
  'EDIT_LOCKED_ITEM'
)
WHERE r.code IN ('ADMIN', 'SUPERVISOR');

-- SELLER puede solicitar deshacer vendido operativo; no puede ver cola completa, aprobar ni aplicar.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'REQUEST_LIVE_OPERATION_AUTHORIZATION',
  'UNDO_LIVE_OPERATIONAL_SALE'
)
WHERE r.code = 'SELLER';

COMMIT;
