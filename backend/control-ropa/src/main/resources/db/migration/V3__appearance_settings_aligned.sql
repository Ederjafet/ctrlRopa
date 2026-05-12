CREATE TABLE appearance_settings (
  id BIGINT UNSIGNED NOT NULL,
  app_name VARCHAR(150) NOT NULL,
  logo_url VARCHAR(500) NULL,
  favicon_url VARCHAR(500) NULL,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  accent_color VARCHAR(20) NOT NULL,
  theme_mode ENUM('LIGHT','DARK','AUTO') NOT NULL DEFAULT 'AUTO',
  density_mode ENUM('COMPACT','NORMAL') NOT NULL DEFAULT 'NORMAL',
  button_style ENUM('ROUNDED','STRAIGHT') NOT NULL DEFAULT 'ROUNDED',
  show_logo_on_prints TINYINT(1) NOT NULL DEFAULT 1,
  print_footer_text VARCHAR(500) NULL,
  package_thank_you_text VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_appearance_settings_updated_by_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
