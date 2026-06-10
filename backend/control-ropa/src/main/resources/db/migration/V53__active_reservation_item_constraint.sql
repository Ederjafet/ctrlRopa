-- ITEM-Z5C: proteccion estructural para una sola reserva ACTIVE por item.
-- No toca pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.
--
-- Prevalidacion recomendada antes de aplicar en ambientes con datos legacy:
-- SELECT branch_id, item_id, COUNT(*) AS active_count
-- FROM reservations
-- WHERE status = 'ACTIVE'
-- GROUP BY branch_id, item_id
-- HAVING COUNT(*) > 1;
--
-- MySQL 5.7 no soporta indices parciales tipo WHERE status = 'ACTIVE'.
-- Se usa columna generada nullable: solo contiene item_id cuando status = ACTIVE.
-- Los status historicos CANCELLED/CONVERTED_TO_SALE quedan en NULL y no colisionan.

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND COLUMN_NAME = 'active_reservation_item_id'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE reservations ADD COLUMN active_reservation_item_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = ''ACTIVE'' THEN item_id ELSE NULL END) STORED AFTER item_id',
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
    AND INDEX_NAME = 'uq_reservations_active_item'
);

SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE reservations ADD UNIQUE KEY uq_reservations_active_item (branch_id, active_reservation_item_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
