-- LIVE-Z2: producto activo oficial por transmision.
-- Mantiene la estructura existente de lives y agrega una referencia nullable a items.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lives'
    AND COLUMN_NAME = 'active_item_id'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE lives ADD COLUMN active_item_id BIGINT UNSIGNED NULL AFTER ended_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lives'
    AND INDEX_NAME = 'idx_lives_active_item'
);

SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE lives ADD KEY idx_lives_active_item (active_item_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'lives'
    AND CONSTRAINT_NAME = 'fk_lives_active_item'
);

SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE lives ADD CONSTRAINT fk_lives_active_item FOREIGN KEY (active_item_id) REFERENCES items(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
