SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS system_security_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  updated_by_user_id BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key),
  CONSTRAINT fk_security_settings_updated_by
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

INSERT INTO system_security_settings (setting_key, setting_value, description) VALUES
  ('session_timeout_minutes', '30', 'Minutos de inactividad antes de cerrar sesion'),
  ('max_login_attempts', '5', 'Intentos fallidos permitidos antes del bloqueo'),
  ('login_lockout_minutes', '15', 'Minutos de bloqueo temporal por intentos fallidos')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

CREATE TABLE IF NOT EXISTS user_login_security (
  user_id BIGINT UNSIGNED NOT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_failed_login_at TIMESTAMP NULL,
  last_success_login_at TIMESTAMP NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_login_security_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_api_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_seen_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_api_sessions_token_hash (token_hash),
  KEY idx_user_api_sessions_user (user_id),
  KEY idx_user_api_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_api_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_SECURITY_SETTINGS', 'Administrar parametros de seguridad');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'MANAGE_SECURITY_SETTINGS'
WHERE r.code = 'SUPPORT_TECH';
