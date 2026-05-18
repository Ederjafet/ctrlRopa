ALTER TABLE batches
  ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;

UPDATE batches b
JOIN branches br ON br.id = b.branch_id
SET b.company_id = br.company_id
WHERE b.company_id IS NULL;

ALTER TABLE batches
  MODIFY company_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_batches_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE batches
  DROP INDEX uq_batches_folio,
  ADD UNIQUE KEY uq_batches_company_folio (company_id, folio);

ALTER TABLE batches
  ADD INDEX idx_batches_company_branch_status (company_id, branch_id, status),
  ADD INDEX idx_batches_company_folio (company_id, folio),
  ADD INDEX idx_batches_company_supplier (company_id, supplier_id);
