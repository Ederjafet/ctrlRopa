SET NAMES utf8mb4;

START TRANSACTION;

ALTER TABLE customer_packages
  ADD COLUMN delivery_type VARCHAR(30) NULL AFTER shipping_notes,
  ADD COLUMN shipping_address_source VARCHAR(40) NULL AFTER delivery_type,
  ADD COLUMN shipping_address_confirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_address_source,
  ADD COLUMN source_customer_address_id BIGINT UNSIGNED NULL AFTER shipping_address_confirmed,
  ADD COLUMN ship_to_name VARCHAR(120) NULL AFTER source_customer_address_id,
  ADD COLUMN ship_to_phone VARCHAR(40) NULL AFTER ship_to_name,
  ADD COLUMN ship_to_line1 VARCHAR(255) NULL AFTER ship_to_phone,
  ADD COLUMN ship_to_line2 VARCHAR(255) NULL AFTER ship_to_line1,
  ADD COLUMN ship_to_city VARCHAR(120) NULL AFTER ship_to_line2,
  ADD COLUMN ship_to_state VARCHAR(120) NULL AFTER ship_to_city,
  ADD COLUMN ship_to_postal_code VARCHAR(20) NULL AFTER ship_to_state,
  ADD COLUMN ship_to_country VARCHAR(120) NULL AFTER ship_to_postal_code,
  ADD COLUMN ship_to_references TEXT NULL AFTER ship_to_country,
  ADD COLUMN shipping_collect TINYINT(1) NOT NULL DEFAULT 0 AFTER ship_to_references,
  ADD COLUMN customer_provided_label TINYINT(1) NOT NULL DEFAULT 0 AFTER shipping_collect,
  ADD KEY idx_customer_packages_source_address (source_customer_address_id),
  ADD CONSTRAINT fk_customer_packages_source_address
    FOREIGN KEY (source_customer_address_id) REFERENCES customer_addresses(id);

ALTER TABLE shipment_packages
  MODIFY COLUMN delivery_address_id BIGINT UNSIGNED NULL;

COMMIT;
