-- ITEM-Z5D: trazabilidad operativa de intentos de reserva rechazados.
-- No toca pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.
-- No guarda payload completo ni secretos; la llave de idempotencia se registra solo como hash.

CREATE TABLE IF NOT EXISTS reservation_rejection_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  item_id BIGINT UNSIGNED NULL,
  live_id BIGINT UNSIGNED NULL,
  reservation_id BIGINT UNSIGNED NULL,
  reason_code VARCHAR(60) NOT NULL,
  message VARCHAR(255) NOT NULL,
  idempotency_key_hash VARCHAR(64) NULL,
  request_hash VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reservation_rejection_branch_created (branch_id, created_at),
  KEY idx_reservation_rejection_item_created (item_id, created_at),
  KEY idx_reservation_rejection_live_created (live_id, created_at),
  KEY idx_reservation_rejection_user_created (user_id, created_at),
  KEY idx_reservation_rejection_reason_created (reason_code, created_at)
);
