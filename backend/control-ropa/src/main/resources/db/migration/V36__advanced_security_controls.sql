SET NAMES utf8mb4;

INSERT INTO system_security_settings (setting_key, setting_value, description) VALUES
  ('password_expiration_days', '90', 'Dias antes de exigir cambio de contrasena; 0 desactiva'),
  ('password_history_count', '5', 'Cantidad de contrasenas recientes que no se pueden reutilizar'),
  ('absolute_session_timeout_hours', '12', 'Horas maximas de sesion aunque exista actividad; 0 desactiva')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

ALTER TABLE user_api_sessions
  ADD COLUMN absolute_expires_at TIMESTAMP NULL AFTER expires_at,
  ADD COLUMN ip_address VARCHAR(64) NULL AFTER last_seen_at,
  ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip_address;

ALTER TABLE user_login_security
  ADD COLUMN last_login_ip VARCHAR(64) NULL AFTER last_success_login_at,
  ADD COLUMN last_login_user_agent VARCHAR(500) NULL AFTER last_login_ip;

CREATE TABLE IF NOT EXISTS user_password_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_password_history_user_changed (user_id, changed_at),
  CONSTRAINT fk_user_password_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);
