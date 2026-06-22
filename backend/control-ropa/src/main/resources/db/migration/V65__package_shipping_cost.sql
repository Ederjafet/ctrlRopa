SET NAMES utf8mb4;

START TRANSACTION;

ALTER TABLE customer_packages
  ADD COLUMN shipping_cost_amount DECIMAL(12,2) NULL AFTER notes,
  ADD COLUMN shipping_cost_confirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_cost_amount,
  ADD COLUMN shipping_cost_waived TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_cost_confirmed,
  ADD COLUMN shipping_carrier VARCHAR(100) NULL AFTER shipping_cost_waived,
  ADD COLUMN tracking_number VARCHAR(100) NULL AFTER shipping_carrier,
  ADD COLUMN shipping_notes TEXT NULL AFTER tracking_number;

ALTER TABLE payment_allocations
  ADD COLUMN customer_package_id BIGINT UNSIGNED NULL AFTER sale_id,
  ADD KEY idx_payment_allocations_customer_package (customer_package_id),
  ADD CONSTRAINT fk_payment_allocations_customer_package
    FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id);

COMMIT;
