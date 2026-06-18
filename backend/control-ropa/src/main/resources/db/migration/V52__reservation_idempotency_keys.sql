-- ITEM-Z5B: idempotencia minima para creacion de reservas.
-- No toca pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.

CREATE TABLE IF NOT EXISTS reservation_idempotency_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  operation VARCHAR(80) NOT NULL,
  idempotency_key VARCHAR(120) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  reservation_id BIGINT UNSIGNED NULL,
  status ENUM('IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
  error_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservation_idempotency_scope (
    company_id,
    branch_id,
    user_id,
    operation,
    idempotency_key
  ),
  KEY idx_reservation_idempotency_reservation (reservation_id),
  KEY idx_reservation_idempotency_expires (expires_at),
  CONSTRAINT fk_reservation_idempotency_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_reservation_idempotency_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_reservation_idempotency_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reservation_idempotency_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);
