ALTER TABLE appearance_settings
  ADD COLUMN info_card_background_color VARCHAR(20) NOT NULL DEFAULT '#EEF2FF',
  ADD COLUMN info_card_text_color VARCHAR(20) NOT NULL DEFAULT '#1E293B',
  ADD COLUMN info_card_border_color VARCHAR(20) NOT NULL DEFAULT '#93C5FD';
