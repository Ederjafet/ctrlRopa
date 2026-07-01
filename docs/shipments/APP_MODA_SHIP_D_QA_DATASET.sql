-- QA only - SHIP-D shipping payment smoke dataset.
-- Do not run in production.
-- Password for QA users: Qa12345!
--
-- Scope:
-- - qa.admin@local.test can manage shipments.
-- - qa.vendedor.centro@local.test can log in but cannot manage shipments.
-- - qa.sinpermisos@local.test is blocked by NO_ACCESS.
-- - Creates one shipment with one cost share and no shipping payments.
-- - Creates one customer package with merchandise balance independent from shipping balance.

SET NAMES utf8mb4;
START TRANSACTION;

SET @company_code := CAST('MARLA_BUTIQUE' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @branch_code := CAST('TUXTLAN' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @shipment_folio := CAST('SHIPD-QA-ENV-001' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @package_folio := CAST('SHIPD-QA-PKG-001' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @item_code := CAST('SHIPD-QA-ITEM-001' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @qa_customer_email := CAST('shipd.qa.customer@local.test' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;

SELECT id INTO @company_id
FROM companies
WHERE code = @company_code
  AND status = 'ACTIVE'
LIMIT 1;

SELECT id INTO @branch_id
FROM branches
WHERE company_id = @company_id
  AND code = @branch_code
  AND status = 'ACTIVE'
LIMIT 1;

INSERT IGNORE INTO roles (code, name) VALUES
  ('ADMIN', 'Administrador'),
  ('SELLER', 'Vendedor'),
  ('NO_ACCESS', 'Sin permisos');

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_SHIPMENTS', 'Administrar envios'),
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_INVENTORY', 'Ver inventario'),
  ('VIEW_PAYMENTS', 'Ver pagos');

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  @branch_id, 'QA Admin Local', 'qa.admin@local.test', '5550000101',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
WHERE @branch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  @branch_id, 'QA Vendedor Centro', 'qa.vendedor.centro@local.test', '5550000102',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
WHERE @branch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

INSERT INTO users (
  branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status
)
SELECT
  @branch_id, 'QA Usuario Sin Permisos', 'qa.sinpermisos@local.test', '5550000103',
  '{noop}Qa12345!', 0, CURRENT_TIMESTAMP, 'ACTIVE'
WHERE @branch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP,
  status = 'ACTIVE';

SELECT id INTO @admin_user_id FROM users WHERE email = 'qa.admin@local.test' LIMIT 1;
SELECT id INTO @seller_user_id FROM users WHERE email = 'qa.vendedor.centro@local.test' LIMIT 1;
SELECT id INTO @no_access_user_id FROM users WHERE email = 'qa.sinpermisos@local.test' LIMIT 1;

INSERT INTO user_companies (user_id, company_id, is_primary, status)
SELECT u.id, @company_id, 1, 'ACTIVE'
FROM users u
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test')
  AND @company_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary),
  status = VALUES(status);

INSERT INTO user_branches (user_id, branch_id, is_primary)
SELECT u.id, @branch_id, 1
FROM users u
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test')
  AND @branch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary);

DELETE ur
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON
  (u.email = 'qa.admin@local.test' AND r.code = 'ADMIN')
  OR (u.email = 'qa.vendedor.centro@local.test' AND r.code = 'SELLER')
  OR (u.email = 'qa.sinpermisos@local.test' AND r.code = 'NO_ACCESS')
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test');

DELETE up
FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test');

INSERT INTO user_permissions (user_id, permission_id)
SELECT @admin_user_id, p.id
FROM permissions p
WHERE p.code IN ('MANAGE_SHIPMENTS', 'VIEW_CUSTOMERS', 'VIEW_INVENTORY', 'VIEW_PAYMENTS')
  AND @admin_user_id IS NOT NULL;

INSERT INTO user_permissions (user_id, permission_id)
SELECT @seller_user_id, p.id
FROM permissions p
WHERE p.code IN ('VIEW_CUSTOMERS')
  AND @seller_user_id IS NOT NULL;

UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
SET s.revoked_at = CURRENT_TIMESTAMP
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test')
  AND s.revoked_at IS NULL;

DELETE uls
FROM user_login_security uls
JOIN users u ON u.id = uls.user_id
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test');

-- Reset only the SHIP-D QA operational case.
SELECT id INTO @existing_shipment_id FROM shipments WHERE folio = @shipment_folio LIMIT 1;
DELETE FROM shipment_payments WHERE shipment_id = @existing_shipment_id;
DELETE FROM shipment_cost_shares WHERE shipment_id = @existing_shipment_id;
DELETE FROM shipment_packages WHERE shipment_id = @existing_shipment_id;
DELETE FROM shipments WHERE id = @existing_shipment_id;

SELECT id INTO @existing_package_id FROM customer_packages WHERE folio = @package_folio LIMIT 1;
DELETE FROM customer_package_items WHERE customer_package_id = @existing_package_id;
DELETE pa
FROM payment_allocations pa
LEFT JOIN payments p ON p.id = pa.payment_id
LEFT JOIN sales s ON s.id = pa.sale_id
LEFT JOIN items i ON i.id = s.item_id
WHERE pa.customer_package_id = @existing_package_id
   OR p.reference LIKE 'SHIPD-QA-%'
   OR i.code = @item_code;
DELETE FROM payments WHERE reference LIKE 'SHIPD-QA-%';
DELETE s
FROM sales s
JOIN items i ON i.id = s.item_id
WHERE i.code = @item_code
  AND i.company_id = @company_id;
DELETE FROM customer_packages WHERE id = @existing_package_id;
DELETE FROM items WHERE code = @item_code AND company_id = @company_id;
DELETE ca
FROM customer_addresses ca
JOIN customers c ON c.id = ca.customer_id
WHERE c.email = @qa_customer_email;
DELETE FROM customers WHERE email = @qa_customer_email AND company_id = @company_id;

INSERT INTO product_types (company_id, code, name, normalized_name, status)
VALUES (@company_id, 'SHIPD_QA_TYPE', 'Prenda QA SHIP-D', 'PRENDA QA SHIP-D', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  normalized_name = VALUES(normalized_name),
  status = 'ACTIVE',
  updated_at = CURRENT_TIMESTAMP;

SELECT id INTO @product_type_id
FROM product_types
WHERE company_id = @company_id
  AND (code = 'SHIPD_QA_TYPE' OR normalized_name = 'PRENDA QA SHIP-D')
LIMIT 1;

SELECT id INTO @sales_channel_id
FROM sales_channels
WHERE code = 'DOOR_SALE'
LIMIT 1;

SELECT id INTO @payment_method_id
FROM payment_methods
WHERE code = 'TRANSFER'
LIMIT 1;

INSERT INTO customers (
  company_id, branch_id, owner_user_id, created_by_user_id, name, phone, email, is_generic, status
) VALUES (
  @company_id, @branch_id, @seller_user_id, @admin_user_id,
  'QA Cliente SHIP-D', '5551200001', @qa_customer_email, 0, 'ACTIVE'
);

SET @customer_id := LAST_INSERT_ID();

INSERT INTO customer_addresses (
  customer_id, label, line1, city, state, postal_code, country, is_default, status
) VALUES (
  @customer_id, 'SHIPD QA', 'Av. QA 123', 'Tuxtla Gutierrez', 'Chiapas', '29000', 'Mexico', 1, 'ACTIVE'
);

SET @address_id := LAST_INSERT_ID();

INSERT INTO items (
  company_id, code, qr_code, branch_id, product_type_id, comments, price, status, created_by_user_id
) VALUES (
  @company_id, @item_code, 'QR-SHIPD-QA-ITEM-001', @branch_id, @product_type_id,
  'Prenda QA para smoke SHIP-D', 300.00, 'SOLD', @admin_user_id
);

SET @item_id := LAST_INSERT_ID();

INSERT INTO sales (
  item_id, customer_id, branch_id, seller_user_id, sales_channel_id, price, status, payment_status, created_by_user_id
) VALUES (
  @item_id, @customer_id, @branch_id, @seller_user_id, @sales_channel_id,
  300.00, 'ACTIVE', 'PARTIALLY_PAID', @seller_user_id
);

SET @sale_id := LAST_INSERT_ID();

INSERT INTO customer_packages (
  folio, customer_id, branch_id, status, notes, created_by_user_id,
  shipping_cost_confirmed, shipping_cost_waived, shipping_address_confirmed,
  shipping_collect, customer_provided_label
) VALUES (
  @package_folio, @customer_id, @branch_id, 'READY',
  'Paquete QA SHIP-D con saldo de mercancia independiente.',
  @admin_user_id, 0, 0, 0, 0, 0
);

SET @package_id := LAST_INSERT_ID();

INSERT INTO customer_package_items (
  customer_package_id, item_id, sale_id
) VALUES (
  @package_id, @item_id, @sale_id
);

INSERT INTO payments (
  customer_id, branch_id, received_amount, payment_method_id, reference, status, created_by_user_id
) VALUES (
  @customer_id, @branch_id, 100.00, @payment_method_id,
  'SHIPD-QA-MERCH-001', 'ACTIVE', @admin_user_id
);

SET @merch_payment_id := LAST_INSERT_ID();

INSERT INTO payment_allocations (
  payment_id, sale_id, amount
) VALUES (
  @merch_payment_id, @sale_id, 100.00
);

INSERT INTO shipments (
  folio, branch_id, delivery_type, status, guide_reference,
  recipient_name, recipient_phone, destination_summary, destination_city,
  destination_state, destination_postal_code, shipping_carrier,
  real_shipping_cost, shipping_notes, quoted_at, ready_at, created_by_user_id
) VALUES (
  @shipment_folio, @branch_id, 'CARRIER', 'OPEN', 'SHIPD-QA-GUIA-001',
  'QA Cliente SHIP-D', '5551200001', 'Av. QA 123, Tuxtla Gutierrez, Chiapas, 29000',
  'Tuxtla Gutierrez', 'Chiapas', '29000', 'Paqueteria QA',
  120.00, 'Envio QA para validar pagos de envio separados.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
  @admin_user_id
);

SET @shipment_id := LAST_INSERT_ID();

INSERT INTO shipment_packages (
  shipment_id, customer_package_id, customer_id, delivery_address_id,
  payment_mode, result_status
) VALUES (
  @shipment_id, @package_id, @customer_id, @address_id,
  'PREPAID', 'PENDING'
);

INSERT INTO shipment_cost_shares (
  shipment_id, customer_package_id, customer_id, assigned_amount, share_method,
  notes, created_by_user_id, updated_by_user_id
) VALUES (
  @shipment_id, @package_id, @customer_id, 120.00, 'MANUAL',
  'Reparto QA inicial para SHIP-D.', @admin_user_id, @admin_user_id
);

COMMIT;

SELECT
  u.email,
  u.status,
  b.code AS branch_code,
  c.code AS company_code,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code) AS roles,
  GROUP_CONCAT(DISTINCT p.code ORDER BY p.code) AS direct_permissions
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN user_permissions up ON up.user_id = u.id
LEFT JOIN permissions p ON p.id = up.permission_id
WHERE u.email IN ('qa.admin@local.test', 'qa.vendedor.centro@local.test', 'qa.sinpermisos@local.test')
GROUP BY u.email, u.status, b.code, c.code
ORDER BY u.email;

SELECT
  sh.id AS shipment_id,
  sh.folio AS shipment_folio,
  cp.id AS package_id,
  cp.folio AS package_folio,
  scs.id AS cost_share_id,
  scs.assigned_amount,
  sh.real_shipping_cost
FROM shipments sh
JOIN shipment_packages sp ON sp.shipment_id = sh.id
JOIN customer_packages cp ON cp.id = sp.customer_package_id
JOIN shipment_cost_shares scs ON scs.shipment_id = sh.id AND scs.customer_package_id = cp.id
WHERE sh.folio = @shipment_folio;
