SET NAMES utf8mb4;

ALTER TABLE users
  ADD COLUMN password_change_required TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash,
  ADD COLUMN password_updated_at DATETIME NULL AFTER password_change_required;
