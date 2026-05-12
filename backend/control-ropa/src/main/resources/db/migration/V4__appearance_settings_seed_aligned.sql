INSERT INTO appearance_settings (
  id,
  app_name,
  logo_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color,
  theme_mode,
  density_mode,
  button_style,
  show_logo_on_prints,
  print_footer_text,
  package_thank_you_text,
  updated_by_user_id
)
SELECT
  1,
  'Sistema de Gestión',
  NULL,
  NULL,
  '#2563EB',
  '#0F172A',
  '#F59E0B',
  'AUTO',
  'NORMAL',
  'ROUNDED',
  1,
  NULL,
  '¡Gracias por tu compra!',
  MIN(id)
FROM users
HAVING NOT EXISTS (
  SELECT 1 FROM appearance_settings WHERE id = 1
);
