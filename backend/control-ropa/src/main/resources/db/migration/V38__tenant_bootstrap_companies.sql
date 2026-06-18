CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  status ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_code (code),
  KEY idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO companies (code, name, status)
SELECT 'DEFAULT', 'HPSQ-SOFT Default Company', 'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE code = 'DEFAULT'
);

ALTER TABLE branches
  ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;

UPDATE branches
SET company_id = (SELECT id FROM companies WHERE code = 'DEFAULT')
WHERE company_id IS NULL;

ALTER TABLE branches
  MODIFY company_id BIGINT UNSIGNED NOT NULL,
  ADD KEY idx_branches_company_status (company_id, status),
  ADD CONSTRAINT fk_branches_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE branches
  DROP INDEX uq_branches_code,
  ADD UNIQUE KEY uq_branches_company_code (company_id, code);
