-- LIVE-Z4: bitacora operacional de En vivo separada de auditoria de seguridad.
-- No registra tokens, passwords ni eventos AUTH.

CREATE TABLE IF NOT EXISTS live_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  live_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NULL,
  entity_id BIGINT UNSIGNED NULL,
  payload_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_live_events_live_created (live_id, created_at),
  KEY idx_live_events_company_branch (company_id, branch_id),
  KEY idx_live_events_type (event_type),
  KEY idx_live_events_actor (actor_user_id),
  CONSTRAINT fk_live_events_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_live_events_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_live_events_live FOREIGN KEY (live_id) REFERENCES lives(id),
  CONSTRAINT fk_live_events_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
