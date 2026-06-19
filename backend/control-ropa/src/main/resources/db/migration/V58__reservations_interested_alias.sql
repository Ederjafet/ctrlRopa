-- HOLD-SHIP-FAST-3: alias/nick temporal para apartados LIVE sin cliente formal.
-- No crea clientes automaticamente y mantiene customer_id opcional solo para reservas con interested_alias.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'interested_alias'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN interested_alias VARCHAR(80) NULL AFTER customer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @customer_id_required := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'customer_id'
    AND IS_NULLABLE = 'NO'
);

SET @sql := IF(
  @customer_id_required > 0,
  'ALTER TABLE reservations MODIFY COLUMN customer_id BIGINT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
