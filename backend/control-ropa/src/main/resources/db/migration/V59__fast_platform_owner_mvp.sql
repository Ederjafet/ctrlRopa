SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO companies (code, name, status)
SELECT 'APPMODA_PLATFORM', 'AppModa Platform', 'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE code = 'APPMODA_PLATFORM'
);

SET @platform_company_id := (
  SELECT id FROM companies WHERE code = 'APPMODA_PLATFORM' LIMIT 1
);

INSERT INTO branches (
  company_id, code, name, status,
  address_line1, address_line2, city, state, postal_code, country
)
SELECT
  @platform_company_id,
  'HQ',
  'AppModa HQ',
  'ACTIVE',
  'AppModa Platform',
  NULL,
  'AppModa',
  'Platform',
  '00000',
  'Mexico'
WHERE NOT EXISTS (
  SELECT 1 FROM branches
  WHERE company_id = @platform_company_id
    AND code = 'HQ'
);

SET @platform_branch_id := (
  SELECT id FROM branches
  WHERE company_id = @platform_company_id
    AND code = 'HQ'
  LIMIT 1
);

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_PLATFORM', 'Ver plataforma AppModa'),
  ('MANAGE_COMPANIES', 'Administrar empresas cliente'),
  ('MANAGE_TENANT_ADMINS', 'Administrar admins iniciales de clientes');

INSERT IGNORE INTO roles (code, name) VALUES
  ('PLATFORM_OWNER', 'Dueno de plataforma AppModa');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_PLATFORM',
  'MANAGE_COMPANIES',
  'MANAGE_TENANT_ADMINS'
)
WHERE r.code = 'PLATFORM_OWNER';

INSERT INTO users (
  branch_id,
  name,
  email,
  phone,
  password_hash,
  password_change_required,
  password_updated_at,
  status
)
VALUES (
  @platform_branch_id,
  'Platform Owner AppModa',
  'platform@appmoda.local',
  NULL,
  '{noop}Platform123!',
  0,
  CURRENT_TIMESTAMP,
  'ACTIVE'
)
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  status = 'ACTIVE',
  password_change_required = 0;

SET @platform_user_id := (
  SELECT id FROM users WHERE email = 'platform@appmoda.local' LIMIT 1
);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT @platform_user_id, r.id
FROM roles r
WHERE r.code = 'PLATFORM_OWNER'
  AND @platform_user_id IS NOT NULL;

INSERT IGNORE INTO user_companies (user_id, company_id, is_primary, status)
SELECT @platform_user_id, @platform_company_id, 1, 'ACTIVE'
WHERE @platform_user_id IS NOT NULL
  AND @platform_company_id IS NOT NULL;

INSERT INTO user_branches (user_id, branch_id, is_primary)
SELECT @platform_user_id, @platform_branch_id, 1
WHERE @platform_user_id IS NOT NULL
  AND @platform_branch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary);

COMMIT;
