SET NAMES utf8mb4;

ALTER TABLE sales_channels
  ADD COLUMN global_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER status;

UPDATE sales_channels
SET global_enabled = 1
WHERE global_enabled IS NULL;
