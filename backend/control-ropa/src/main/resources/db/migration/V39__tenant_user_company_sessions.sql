CREATE TABLE user_companies (
  user_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, company_id),
  KEY idx_user_companies_company_status (company_id, status),
  CONSTRAINT fk_user_companies_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_companies_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO user_companies (user_id, company_id, is_primary, status)
SELECT u.id, b.company_id, 1, 'ACTIVE'
FROM users u
JOIN branches b ON b.id = u.branch_id;

ALTER TABLE user_api_sessions
  ADD COLUMN active_company_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD COLUMN active_branch_id BIGINT UNSIGNED NULL AFTER active_company_id,
  ADD KEY idx_user_api_sessions_active_company (active_company_id),
  ADD KEY idx_user_api_sessions_active_branch (active_branch_id),
  ADD CONSTRAINT fk_user_api_sessions_active_company FOREIGN KEY (active_company_id) REFERENCES companies(id),
  ADD CONSTRAINT fk_user_api_sessions_active_branch FOREIGN KEY (active_branch_id) REFERENCES branches(id);

UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
JOIN branches b ON b.id = u.branch_id
SET s.active_company_id = b.company_id,
    s.active_branch_id = b.id
WHERE s.active_company_id IS NULL
  AND s.active_branch_id IS NULL;
