SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  included_max_users INT NULL,
  included_max_branches INT NULL,
  includes_live TINYINT(1) NOT NULL DEFAULT 0,
  includes_reports TINYINT(1) NOT NULL DEFAULT 0,
  includes_shipments TINYINT(1) NOT NULL DEFAULT 0,
  includes_packages TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_plans_code (code),
  KEY idx_subscription_plans_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_plan_prices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id BIGINT UNSIGNED NOT NULL,
  billing_period VARCHAR(32) NOT NULL,
  price_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'MXN',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscription_plan_prices_period (plan_id, billing_period),
  KEY idx_subscription_plan_prices_status (status),
  CONSTRAINT fk_subscription_plan_prices_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  billing_model VARCHAR(32) NOT NULL DEFAULT 'SUBSCRIPTION',
  billing_period VARCHAR(32) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'TRIAL',
  started_at DATETIME NULL,
  ends_at DATETIME NULL,
  next_billing_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_subscriptions_company (company_id),
  KEY idx_company_subscriptions_status (status),
  KEY idx_company_subscriptions_plan (plan_id),
  CONSTRAINT fk_company_subscriptions_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_company_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS company_usage_rates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  usage_type VARCHAR(64) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'MXN',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_company_usage_rates_company_type (company_id, usage_type),
  KEY idx_company_usage_rates_enabled (company_id, enabled),
  CONSTRAINT fk_company_usage_rates_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_PLATFORM_BILLING', 'Ver cobranza SaaS de plataforma'),
  ('MANAGE_SUBSCRIPTION_PLANS', 'Administrar planes de suscripcion SaaS'),
  ('MANAGE_COMPANY_SUBSCRIPTIONS', 'Administrar suscripciones por cliente'),
  ('MANAGE_USAGE_RATES', 'Administrar tarifas por consumo SaaS'),
  ('VIEW_PLATFORM_USAGE', 'Ver uso por cliente de plataforma'),
  ('MANAGE_COMPANY_MODULES', 'Administrar modulos activos por cliente'),
  ('MANAGE_COMPANY_LIMITS', 'Administrar limites por cliente');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_PLATFORM_BILLING',
  'MANAGE_SUBSCRIPTION_PLANS',
  'MANAGE_COMPANY_SUBSCRIPTIONS',
  'MANAGE_USAGE_RATES',
  'VIEW_PLATFORM_USAGE',
  'MANAGE_COMPANY_MODULES',
  'MANAGE_COMPANY_LIMITS'
)
WHERE r.code = 'PLATFORM_OWNER';

INSERT IGNORE INTO subscription_plans (
  code,
  name,
  description,
  status,
  included_max_users,
  included_max_branches,
  includes_live,
  includes_reports,
  includes_shipments,
  includes_packages
) VALUES (
  'STARTER',
  'Starter AppModa',
  'Plan base para cliente nuevo AppModa.',
  'ACTIVE',
  5,
  1,
  1,
  1,
  1,
  1
);

INSERT IGNORE INTO subscription_plan_prices (plan_id, billing_period, price_amount, currency, status)
SELECT id, 'MONTHLY', 799.00, 'MXN', 'ACTIVE'
FROM subscription_plans
WHERE code = 'STARTER';

INSERT IGNORE INTO subscription_plan_prices (plan_id, billing_period, price_amount, currency, status)
SELECT id, 'QUARTERLY', 2199.00, 'MXN', 'ACTIVE'
FROM subscription_plans
WHERE code = 'STARTER';

INSERT IGNORE INTO subscription_plan_prices (plan_id, billing_period, price_amount, currency, status)
SELECT id, 'SEMIANNUAL', 4199.00, 'MXN', 'ACTIVE'
FROM subscription_plans
WHERE code = 'STARTER';

INSERT IGNORE INTO subscription_plan_prices (plan_id, billing_period, price_amount, currency, status)
SELECT id, 'ANNUAL', 7999.00, 'MXN', 'ACTIVE'
FROM subscription_plans
WHERE code = 'STARTER';

COMMIT;
