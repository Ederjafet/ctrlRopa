ALTER TABLE appearance_settings
  ADD COLUMN primary_button_color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
  ADD COLUMN primary_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN secondary_button_color VARCHAR(20) NOT NULL DEFAULT '#0F172A',
  ADD COLUMN secondary_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN danger_button_color VARCHAR(20) NOT NULL DEFAULT '#B00020',
  ADD COLUMN danger_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF';