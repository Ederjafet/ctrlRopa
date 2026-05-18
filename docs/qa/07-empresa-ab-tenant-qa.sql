-- SOLO QA - Dataset Empresa A/B tenant-aware.
-- No es migracion Flyway. No ejecutar en PROD.
-- Objetivo: preparar datos duplicados por company para validar aislamiento SaaS real.
-- Password de usuarios creados aqui: Qa12345!
-- Script idempotente y acotado a:
--   companies QA_A / QA_B
--   branches QA_A_CTR / QA_B_CTR
--   usuarios qa.a.*@local.test / qa.b.*@local.test
--   customers/items/batches QA duplicados por company

SET NAMES utf8mb4;
START TRANSACTION;

-- Companies A/B.
INSERT INTO companies (code, name, status)
VALUES
  ('QA_A', 'QA Empresa A', 'ACTIVE'),
  ('QA_B', 'QA Empresa B', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = 'ACTIVE';

SELECT id INTO @qa_a_company_id FROM companies WHERE code = 'QA_A' LIMIT 1;
SELECT id INTO @qa_b_company_id FROM companies WHERE code = 'QA_B' LIMIT 1;

-- Branches A/B.
INSERT INTO branches (
  company_id, code, name, status,
  address_line1, address_line2, city, state, postal_code, country
)
VALUES
  (@qa_a_company_id, 'QA_A_CTR', 'QA Empresa A Centro', 'ACTIVE',
   'Sucursal QA Empresa A', NULL, 'Ciudad QA', 'Estado QA', '00001', 'Mexico'),
  (@qa_b_company_id, 'QA_B_CTR', 'QA Empresa B Centro', 'ACTIVE',
   'Sucursal QA Empresa B', NULL, 'Ciudad QA', 'Estado QA', '00002', 'Mexico')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = 'ACTIVE',
  address_line1 = VALUES(address_line1),
  city = VALUES(city),
  state = VALUES(state),
  postal_code = VALUES(postal_code),
  country = VALUES(country);

SELECT id INTO @qa_a_branch_id FROM branches WHERE company_id = @qa_a_company_id AND code = 'QA_A_CTR' LIMIT 1;
SELECT id INTO @qa_b_branch_id FROM branches WHERE company_id = @qa_b_company_id AND code = 'QA_B_CTR' LIMIT 1;

-- Roles y permisos minimos para navegar customers/items/batches.
INSERT IGNORE INTO roles (code, name) VALUES
  ('QA_TENANT_ADMIN', 'QA Tenant Admin'),
  ('QA_TENANT_SELLER', 'QA Tenant Vendedor');

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_INVENTORY', 'Ver inventario'),
  ('MANAGE_INVENTORY', 'Administrar inventario'),
  ('DO_DOOR_SALE', 'Realizar venta puerta'),
  ('DO_DOOR_RESERVATION', 'Crear apartados puerta'),
  ('REGISTER_PAYMENTS', 'Registrar pagos');

-- Asegurar permisos minimos por rol QA sin modificar roles operativos existentes.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY'
)
WHERE r.code = 'QA_TENANT_ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_INVENTORY',
  'MANAGE_INVENTORY',
  'DO_DOOR_SALE',
  'DO_DOOR_RESERVATION'
)
WHERE r.code = 'QA_TENANT_SELLER';

-- Usuarios A/B.
INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
VALUES
  (@qa_a_branch_id, 'QA A Admin', 'qa.a.admin@local.test', '5551000001', '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'),
  (@qa_b_branch_id, 'QA B Admin', 'qa.b.admin@local.test', '5552000001', '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'),
  (@qa_a_branch_id, 'QA A Vendedor', 'qa.a.vendedor@local.test', '5551000002', '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'),
  (@qa_b_branch_id, 'QA B Vendedor', 'qa.b.vendedor@local.test', '5552000002', '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE')
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

-- Relaciones tenant estrictas para estos usuarios.
DELETE uc FROM user_companies uc
JOIN users u ON u.id = uc.user_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

INSERT INTO user_companies (user_id, company_id, is_primary, status)
SELECT u.id,
       CASE
         WHEN u.email LIKE 'qa.a.%' THEN @qa_a_company_id
         ELSE @qa_b_company_id
       END,
       1,
       'ACTIVE'
FROM users u
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

DELETE ub FROM user_branches ub
JOIN users u ON u.id = ub.user_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

INSERT INTO user_branches (user_id, branch_id, is_primary)
SELECT u.id,
       CASE
         WHEN u.email LIKE 'qa.a.%' THEN @qa_a_branch_id
         ELSE @qa_b_branch_id
       END,
       1
FROM users u
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON
  (u.email IN ('qa.a.admin@local.test', 'qa.b.admin@local.test') AND r.code = 'QA_TENANT_ADMIN')
  OR (u.email IN ('qa.a.vendedor@local.test', 'qa.b.vendedor@local.test') AND r.code = 'QA_TENANT_SELLER')
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

-- Evitar permisos directos que contaminen la validacion por rol.
DELETE up FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

-- Reset de login/lock y revocacion de sesiones legacy solo de usuarios A/B.
DELETE uls FROM user_login_security uls
JOIN users u ON u.id = uls.user_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
);

UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
SET s.revoked_at = CURRENT_TIMESTAMP
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
)
  AND s.revoked_at IS NULL;

SELECT id INTO @qa_a_admin_id FROM users WHERE email = 'qa.a.admin@local.test' LIMIT 1;
SELECT id INTO @qa_b_admin_id FROM users WHERE email = 'qa.b.admin@local.test' LIMIT 1;

-- Customers duplicados por company.
INSERT INTO customers (
  company_id, branch_id, owner_user_id, created_by_user_id,
  name, phone, email, is_generic, generic_type, status
)
SELECT @qa_a_company_id, @qa_a_branch_id, @qa_a_admin_id, @qa_a_admin_id,
       'Cliente Duplicado QA', '5550000001', 'cliente.duplicado@qa-a.local.test',
       0, NULL, 'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1 FROM customers
  WHERE company_id = @qa_a_company_id
    AND phone = '5550000001'
    AND name = 'Cliente Duplicado QA'
);

INSERT INTO customers (
  company_id, branch_id, owner_user_id, created_by_user_id,
  name, phone, email, is_generic, generic_type, status
)
SELECT @qa_b_company_id, @qa_b_branch_id, @qa_b_admin_id, @qa_b_admin_id,
       'Cliente Duplicado QA', '5550000001', 'cliente.duplicado@qa-b.local.test',
       0, NULL, 'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1 FROM customers
  WHERE company_id = @qa_b_company_id
    AND phone = '5550000001'
    AND name = 'Cliente Duplicado QA'
);

UPDATE customers
SET branch_id = @qa_a_branch_id,
    owner_user_id = @qa_a_admin_id,
    created_by_user_id = @qa_a_admin_id,
    email = 'cliente.duplicado@qa-a.local.test',
    status = 'ACTIVE'
WHERE company_id = @qa_a_company_id
  AND phone = '5550000001'
  AND name = 'Cliente Duplicado QA';

UPDATE customers
SET branch_id = @qa_b_branch_id,
    owner_user_id = @qa_b_admin_id,
    created_by_user_id = @qa_b_admin_id,
    email = 'cliente.duplicado@qa-b.local.test',
    status = 'ACTIVE'
WHERE company_id = @qa_b_company_id
  AND phone = '5550000001'
  AND name = 'Cliente Duplicado QA';

-- Items duplicados por company.
INSERT IGNORE INTO product_types (code, name, status)
VALUES ('QA_TENANT', 'QA Tenant', 'ACTIVE');

SELECT id INTO @qa_product_type_id
FROM product_types
WHERE status = 'ACTIVE'
ORDER BY id
LIMIT 1;

INSERT INTO items (
  company_id, code, qr_code, branch_id, batch_id, product_type_id,
  brand_id, size_id, comments, price, status, storage_location_id, created_by_user_id
)
VALUES
  (@qa_a_company_id, 'QA-DUP-001', 'QR-QA-DUP-001', @qa_a_branch_id, NULL, @qa_product_type_id,
   NULL, NULL, 'Item duplicado para aislamiento tenant Empresa A', 111.00, 'AVAILABLE', NULL, @qa_a_admin_id),
  (@qa_b_company_id, 'QA-DUP-001', 'QR-QA-DUP-001', @qa_b_branch_id, NULL, @qa_product_type_id,
   NULL, NULL, 'Item duplicado para aislamiento tenant Empresa B', 222.00, 'AVAILABLE', NULL, @qa_b_admin_id)
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  product_type_id = VALUES(product_type_id),
  comments = VALUES(comments),
  price = VALUES(price),
  status = 'AVAILABLE',
  created_by_user_id = VALUES(created_by_user_id);

-- Batches con folio duplicado por company para prueba futura de folio scoped.
INSERT INTO batches (
  company_id, branch_id, supplier_id, folio, expected_quantity,
  received_quantity, status, quality_score, quality_notes, notes, created_by_user_id
)
SELECT @qa_a_company_id, @qa_a_branch_id, NULL, 'QA-DUP-BATCH-001', 1,
       NULL, 'ANNOUNCED', NULL, NULL, 'Batch duplicado QA Empresa A', @qa_a_admin_id
WHERE NOT EXISTS (
  SELECT 1 FROM batches
  WHERE company_id = @qa_a_company_id
    AND folio = 'QA-DUP-BATCH-001'
);

INSERT INTO batches (
  company_id, branch_id, supplier_id, folio, expected_quantity,
  received_quantity, status, quality_score, quality_notes, notes, created_by_user_id
)
SELECT @qa_b_company_id, @qa_b_branch_id, NULL, 'QA-DUP-BATCH-001', 1,
       NULL, 'ANNOUNCED', NULL, NULL, 'Batch duplicado QA Empresa B', @qa_b_admin_id
WHERE NOT EXISTS (
  SELECT 1 FROM batches
  WHERE company_id = @qa_b_company_id
    AND folio = 'QA-DUP-BATCH-001'
);

COMMIT;

SELECT
  c.code AS company_code,
  b.code AS branch_code,
  u.email,
  u.status,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code) AS roles,
  CASE WHEN uc.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_company,
  CASE WHEN ub.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_branch
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.company_id = c.id AND uc.status = 'ACTIVE'
LEFT JOIN user_branches ub ON ub.user_id = u.id AND ub.branch_id = b.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
)
GROUP BY c.code, b.code, u.email, u.status, has_user_company, has_user_branch
ORDER BY c.code, u.email;

SELECT company_id, code, COUNT(*) AS item_count
FROM items
WHERE code = 'QA-DUP-001'
GROUP BY company_id, code
ORDER BY company_id;

SELECT company_id, folio, COUNT(*) AS batch_count
FROM batches
WHERE folio = 'QA-DUP-BATCH-001'
GROUP BY company_id, folio
ORDER BY company_id;
