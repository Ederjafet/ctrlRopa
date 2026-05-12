SET NAMES utf8mb4;

INSERT INTO system_security_settings (setting_key, setting_value, description) VALUES
  ('password_min_length', '8', 'Longitud minima de contrasena'),
  ('password_require_uppercase', '1', 'Requiere al menos una mayuscula'),
  ('password_require_lowercase', '1', 'Requiere al menos una minuscula'),
  ('password_require_number', '1', 'Requiere al menos un numero'),
  ('password_require_symbol', '1', 'Requiere al menos un simbolo')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
