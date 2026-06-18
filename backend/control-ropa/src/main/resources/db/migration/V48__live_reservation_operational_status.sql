-- LIVE-Z3: estado operativo persistido para reservas de En vivo.
-- Este estado no procesa pagos, caja, ventas ni reportes financieros.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'live_operational_status'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN live_operational_status ENUM(''PENDING'',''RESERVED'',''OPERATIONAL_SOLD'',''CANCELLED'') NULL AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'live_operational_status_updated_at'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN live_operational_status_updated_at DATETIME NULL AFTER live_operational_status',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'live_operational_status_updated_by_user_id'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN live_operational_status_updated_by_user_id BIGINT UNSIGNED NULL AFTER live_operational_status_updated_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'live_operational_status_reason'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN live_operational_status_reason VARCHAR(255) NULL AFTER live_operational_status_updated_by_user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND INDEX_NAME = 'idx_reservations_live_operational_status'
);

SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE reservations ADD KEY idx_reservations_live_operational_status (live_id, live_operational_status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND CONSTRAINT_NAME = 'fk_reservations_live_operational_updated_by'
);

SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE reservations ADD CONSTRAINT fk_reservations_live_operational_updated_by FOREIGN KEY (live_operational_status_updated_by_user_id) REFERENCES users(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE reservations
SET live_operational_status = 'RESERVED',
    live_operational_status_updated_at = COALESCE(created_at, NOW()),
    live_operational_status_updated_by_user_id = seller_user_id
WHERE live_id IS NOT NULL
  AND live_operational_status IS NULL;
