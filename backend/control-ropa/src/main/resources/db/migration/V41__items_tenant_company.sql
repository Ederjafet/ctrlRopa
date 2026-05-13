ALTER TABLE items
  ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;

UPDATE items i
JOIN branches b ON b.id = i.branch_id
SET i.company_id = b.company_id
WHERE i.company_id IS NULL;

ALTER TABLE items
  MODIFY company_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_items_company FOREIGN KEY (company_id) REFERENCES companies(id),
  ADD INDEX idx_items_company_branch_status (company_id, branch_id, status),
  ADD INDEX idx_items_company_code (company_id, code),
  ADD INDEX idx_items_company_qr (company_id, qr_code),
  ADD INDEX idx_items_company_batch (company_id, batch_id),
  ADD INDEX idx_items_company_storage_location (company_id, storage_location_id);
