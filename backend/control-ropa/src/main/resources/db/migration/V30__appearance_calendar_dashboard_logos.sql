ALTER TABLE appearance_settings
  ADD COLUMN login_logo_url VARCHAR(500) NULL AFTER favicon_url,
  ADD COLUMN print_logo_url VARCHAR(500) NULL AFTER login_logo_url,
  ADD COLUMN calendar_selected_color VARCHAR(20) NOT NULL DEFAULT '#0F172A' AFTER info_card_border_color,
  ADD COLUMN calendar_selected_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER calendar_selected_color,
  ADD COLUMN calendar_text_color VARCHAR(20) NOT NULL DEFAULT '#111111' AFTER calendar_selected_text_color,
  ADD COLUMN dashboard_metric_background_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER calendar_text_color,
  ADD COLUMN dashboard_metric_text_color VARCHAR(20) NOT NULL DEFAULT '#111111' AFTER dashboard_metric_background_color,
  ADD COLUMN dashboard_accent_color VARCHAR(20) NOT NULL DEFAULT '#2563EB' AFTER dashboard_metric_text_color;
