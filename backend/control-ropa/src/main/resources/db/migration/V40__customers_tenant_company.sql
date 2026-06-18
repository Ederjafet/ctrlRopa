ALTER TABLE customers
  ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;

UPDATE customers c
JOIN branches b ON b.id = c.branch_id
SET c.company_id = b.company_id
WHERE c.company_id IS NULL;

ALTER TABLE customers
  MODIFY company_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id),
  ADD INDEX idx_customers_company_branch (company_id, branch_id),
  ADD INDEX idx_customers_company_branch_status (company_id, branch_id, status),
  ADD INDEX idx_customers_company_phone (company_id, phone);
