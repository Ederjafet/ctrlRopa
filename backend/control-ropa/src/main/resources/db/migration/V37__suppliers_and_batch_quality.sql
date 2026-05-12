CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(250) NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_code (code),
  UNIQUE KEY uq_suppliers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE batches
  ADD COLUMN supplier_id BIGINT UNSIGNED NULL AFTER branch_id,
  ADD COLUMN received_at DATETIME NULL AFTER received_quantity,
  ADD COLUMN quality_score TINYINT UNSIGNED NULL AFTER status,
  ADD COLUMN quality_notes VARCHAR(500) NULL AFTER quality_score,
  ADD KEY idx_batches_supplier (supplier_id),
  ADD CONSTRAINT fk_batches_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
