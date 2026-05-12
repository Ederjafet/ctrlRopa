ALTER TABLE shipment_packages
ADD COLUMN collection_difference DECIMAL(12,2) NULL AFTER collected_amount,
ADD COLUMN collection_status ENUM('BALANCED','SHORT','OVER') NULL AFTER collection_difference,
ADD COLUMN delivery_confirmed_by_user_id BIGINT UNSIGNED NULL AFTER collection_status,
ADD COLUMN delivered_at DATETIME NULL AFTER delivery_confirmed_by_user_id,
ADD COLUMN returned_at DATETIME NULL AFTER delivered_at;

ALTER TABLE incidents
ADD COLUMN shipment_package_id BIGINT UNSIGNED NULL AFTER shipment_id,
ADD COLUMN title VARCHAR(255) NULL AFTER status,
ADD KEY idx_incidents_shipment_package (shipment_package_id),
ADD CONSTRAINT fk_incidents_shipment_package
    FOREIGN KEY (shipment_package_id) REFERENCES shipment_packages(id);