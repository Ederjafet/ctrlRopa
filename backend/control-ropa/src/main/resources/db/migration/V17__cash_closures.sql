SET NAMES utf8mb4;
START TRANSACTION;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_CASH_CLOSURES', 'Administrar cierres de caja');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code = 'MANAGE_CASH_CLOSURES';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'MANAGE_CASH_CLOSURES'
WHERE r.code IN ('SUPERVISOR', 'CASHIER');

CREATE TABLE IF NOT EXISTS cash_closures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  closure_date DATE NOT NULL,
  expected_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  expenses_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  delivered_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  difference DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  closed_at DATETIME NULL,
  closed_by_user_id BIGINT UNSIGNED NULL,
  cancelled_at DATETIME NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  cancel_reason TEXT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cash_closure_branch_date (branch_id, closure_date),
  KEY idx_cash_closures_branch (branch_id),
  KEY idx_cash_closures_created_by (created_by_user_id),
  KEY idx_cash_closures_closed_by (closed_by_user_id),
  KEY idx_cash_closures_cancelled_by (cancelled_by_user_id),

  CONSTRAINT fk_cash_closures_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),

  CONSTRAINT fk_cash_closures_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),

  CONSTRAINT fk_cash_closures_closed_by
    FOREIGN KEY (closed_by_user_id) REFERENCES users(id),

  CONSTRAINT fk_cash_closures_cancelled_by
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cash_expenses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cash_closure_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  expense_date DATE NOT NULL,
  concept VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  cancelled_at DATETIME NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  cancel_reason TEXT NULL,

  PRIMARY KEY (id),
  KEY idx_cash_expenses_closure (cash_closure_id),
  KEY idx_cash_expenses_branch (branch_id),
  KEY idx_cash_expenses_created_by (created_by_user_id),
  KEY idx_cash_expenses_cancelled_by (cancelled_by_user_id),

  CONSTRAINT fk_cash_expenses_closure
    FOREIGN KEY (cash_closure_id) REFERENCES cash_closures(id),

  CONSTRAINT fk_cash_expenses_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id),

  CONSTRAINT fk_cash_expenses_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id),

  CONSTRAINT fk_cash_expenses_cancelled_by
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
);

COMMIT;