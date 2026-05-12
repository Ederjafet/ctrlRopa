ALTER TABLE appearance_settings
  ADD COLUMN operation_button_color VARCHAR(20) NOT NULL DEFAULT '#0F172A' AFTER secondary_button_text_color,
  ADD COLUMN operation_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER operation_button_color;
