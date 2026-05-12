SET NAMES utf8mb4;
START TRANSACTION;

ALTER TABLE appearance_settings
  ADD COLUMN cancel_button_color VARCHAR(20) NOT NULL DEFAULT '#6B7280' AFTER danger_button_text_color,
  ADD COLUMN cancel_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER cancel_button_color,
  ADD COLUMN back_button_color VARCHAR(20) NOT NULL DEFAULT '#374151' AFTER cancel_button_text_color,
  ADD COLUMN back_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER back_button_color,
  ADD COLUMN menu_button_color VARCHAR(20) NOT NULL DEFAULT '#2563EB' AFTER back_button_text_color,
  ADD COLUMN menu_button_text_color VARCHAR(20) NOT NULL DEFAULT '#FFFFFF' AFTER menu_button_color;

COMMIT;
