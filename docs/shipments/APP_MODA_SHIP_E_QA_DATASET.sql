-- APP_MODA_SHIP_E_QA_DATASET.sql
-- Dataset QA minimo para SHIP-E sobre schema limpio V75.
-- Uso exclusivo local/staging QA. No ejecutar en produccion.
-- Compatible con MySQL 5.7.
-- Antes de ejecutar SOURCE, definir @qa_password_hash en la misma sesion MySQL.
-- Este archivo no almacena passwords ni credenciales.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS = 1;

DROP TEMPORARY TABLE IF EXISTS qa_dataset_required_ids;
CREATE TEMPORARY TABLE qa_dataset_required_ids (
  label VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  required_id BIGINT UNSIGNED NOT NULL
) ENGINE=MEMORY;

DROP TEMPORARY TABLE IF EXISTS qa_dataset_required_values;
CREATE TEMPORARY TABLE qa_dataset_required_values (
  label VARCHAR(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  required_value VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=MEMORY;

SET @qa_password_hash_value := CASE
  WHEN @qa_password_hash IS NULL THEN NULL
  WHEN CHAR_LENGTH(CAST(@qa_password_hash AS CHAR CHARACTER SET utf8mb4)) = 0 THEN NULL
  ELSE CAST(@qa_password_hash AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
END;

SELECT IF(@qa_password_hash_value IS NULL, 'MISSING_qa_password_hash', 'OK_qa_password_hash') AS guard_qa_password_hash;
INSERT INTO qa_dataset_required_values (label, required_value)
VALUES (_utf8mb4'qa_password_hash' COLLATE utf8mb4_unicode_ci, @qa_password_hash_value);

START TRANSACTION;

SET @company_code := _utf8mb4'MARLA_BOUTIQUE' COLLATE utf8mb4_unicode_ci;
SET @branch_code := _utf8mb4'TUXTLAN' COLLATE utf8mb4_unicode_ci;
SET @admin_email := _utf8mb4'qa.admin@local.test' COLLATE utf8mb4_unicode_ci;
SET @seller_email := _utf8mb4'qa.vendedor.centro@local.test' COLLATE utf8mb4_unicode_ci;
SET @no_access_email := _utf8mb4'qa.sinpermisos@local.test' COLLATE utf8mb4_unicode_ci;
SET @customer_email := _utf8mb4'shipe.qa.customer@local.test' COLLATE utf8mb4_unicode_ci;
SET @shipment_folio := _utf8mb4'SHIPE-QA-ENV-001' COLLATE utf8mb4_unicode_ci;
SET @package_folio := _utf8mb4'SHIPE-QA-PKG-001' COLLATE utf8mb4_unicode_ci;
SET @item_code := _utf8mb4'SHIPE-QA-ITEM-001' COLLATE utf8mb4_unicode_ci;
SET @payment_reference := _utf8mb4'SHIPE-QA-MERCANCIA-001' COLLATE utf8mb4_unicode_ci;

INSERT INTO companies (code, name, status)
VALUES (@company_code, _utf8mb4'Marla Boutique QA' COLLATE utf8mb4_unicode_ci, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

SET @company_id := (SELECT id FROM companies WHERE code COLLATE utf8mb4_unicode_ci = @company_code LIMIT 1);
SELECT IF(@company_id IS NULL, 'MISSING_company_id', 'OK_company_id') AS guard_company_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'company_id' COLLATE utf8mb4_unicode_ci, @company_id);

INSERT INTO branches (company_id, code, name, status, address_line1, city, state, postal_code, country)
VALUES (
  @company_id, @branch_code, _utf8mb4'Marla Boutique - Tuxtlan QA' COLLATE utf8mb4_unicode_ci,
  'ACTIVE', _utf8mb4'Sucursal QA' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Tuxtla Gutierrez' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Chiapas' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'29000' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Mexico' COLLATE utf8mb4_unicode_ci
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), status = 'ACTIVE', address_line1 = VALUES(address_line1),
  city = VALUES(city), state = VALUES(state), postal_code = VALUES(postal_code), country = VALUES(country);

SET @branch_id := (
  SELECT id FROM branches
  WHERE company_id = @company_id AND code COLLATE utf8mb4_unicode_ci = @branch_code
  LIMIT 1
);
SELECT IF(@branch_id IS NULL, 'MISSING_branch_id', 'OK_branch_id') AS guard_branch_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'branch_id' COLLATE utf8mb4_unicode_ci, @branch_id);

INSERT INTO roles (code, name) VALUES
  (_utf8mb4'ADMIN' COLLATE utf8mb4_unicode_ci, _utf8mb4'Administrador' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'QA_SELLER_NO_SHIPMENTS' COLLATE utf8mb4_unicode_ci, _utf8mb4'QA vendedor sin gestion de envios' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'NO_ACCESS' COLLATE utf8mb4_unicode_ci, _utf8mb4'Sin acceso' COLLATE utf8mb4_unicode_ci)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO permissions (code, name) VALUES
  (_utf8mb4'MANAGE_SHIPMENTS' COLLATE utf8mb4_unicode_ci, _utf8mb4'Gestionar envios' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'VIEW_CUSTOMERS' COLLATE utf8mb4_unicode_ci, _utf8mb4'Ver clientes' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'VIEW_INVENTORY' COLLATE utf8mb4_unicode_ci, _utf8mb4'Ver inventario' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'VIEW_PAYMENTS' COLLATE utf8mb4_unicode_ci, _utf8mb4'Ver pagos' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'CREATE_CUSTOMER_PACKAGE' COLLATE utf8mb4_unicode_ci, _utf8mb4'Crear paquete' COLLATE utf8mb4_unicode_ci),
  (_utf8mb4'CREATE_CLOSE_CUSTOMER_PACKAGE' COLLATE utf8mb4_unicode_ci, _utf8mb4'Cerrar paquete' COLLATE utf8mb4_unicode_ci)
ON DUPLICATE KEY UPDATE name = VALUES(name);

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code COLLATE utf8mb4_unicode_ci IN (
  _utf8mb4'QA_SELLER_NO_SHIPMENTS' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'NO_ACCESS' COLLATE utf8mb4_unicode_ci
);

INSERT INTO product_types (code, name, status)
VALUES (_utf8mb4'SHIPE_QA_TYPE' COLLATE utf8mb4_unicode_ci, _utf8mb4'SHIP-E QA Tipo' COLLATE utf8mb4_unicode_ci, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT INTO payment_methods (code, name, status)
VALUES (_utf8mb4'SHIPE_QA_PAYMENT' COLLATE utf8mb4_unicode_ci, _utf8mb4'SHIP-E QA Payment' COLLATE utf8mb4_unicode_ci, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT INTO sales_channels (code, name, status)
VALUES (_utf8mb4'SHIPE_QA_CHANNEL' COLLATE utf8mb4_unicode_ci, _utf8mb4'SHIP-E QA Channel' COLLATE utf8mb4_unicode_ci, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

SET @product_type_id := (SELECT id FROM product_types WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'SHIPE_QA_TYPE' COLLATE utf8mb4_unicode_ci LIMIT 1);
SET @payment_method_id := (SELECT id FROM payment_methods WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'SHIPE_QA_PAYMENT' COLLATE utf8mb4_unicode_ci LIMIT 1);
SET @sales_channel_id := (SELECT id FROM sales_channels WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'SHIPE_QA_CHANNEL' COLLATE utf8mb4_unicode_ci LIMIT 1);

SELECT IF(@product_type_id IS NULL, 'MISSING_product_type_id', 'OK_product_type_id') AS guard_product_type_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'product_type_id' COLLATE utf8mb4_unicode_ci, @product_type_id);
SELECT IF(@payment_method_id IS NULL, 'MISSING_payment_method_id', 'OK_payment_method_id') AS guard_payment_method_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'payment_method_id' COLLATE utf8mb4_unicode_ci, @payment_method_id);
SELECT IF(@sales_channel_id IS NULL, 'MISSING_sales_channel_id', 'OK_sales_channel_id') AS guard_sales_channel_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'sales_channel_id' COLLATE utf8mb4_unicode_ci, @sales_channel_id);

INSERT INTO users (branch_id, name, email, phone, password_hash, password_change_required, password_updated_at, status)
VALUES
  (@branch_id, _utf8mb4'QA Admin ShipE' COLLATE utf8mb4_unicode_ci, @admin_email, _utf8mb4'5550000001' COLLATE utf8mb4_unicode_ci, @qa_password_hash_value, 0, CURRENT_TIMESTAMP, 'ACTIVE'),
  (@branch_id, _utf8mb4'QA Vendedor Centro' COLLATE utf8mb4_unicode_ci, @seller_email, _utf8mb4'5550000002' COLLATE utf8mb4_unicode_ci, @qa_password_hash_value, 0, CURRENT_TIMESTAMP, 'ACTIVE'),
  (@branch_id, _utf8mb4'QA Sin Permisos' COLLATE utf8mb4_unicode_ci, @no_access_email, _utf8mb4'5550000003' COLLATE utf8mb4_unicode_ci, @qa_password_hash_value, 0, CURRENT_TIMESTAMP, 'ACTIVE')
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id), name = VALUES(name), phone = VALUES(phone),
  password_hash = VALUES(password_hash), password_change_required = 0,
  password_updated_at = CURRENT_TIMESTAMP, status = 'ACTIVE';

SET @admin_user_id := (SELECT id FROM users WHERE email COLLATE utf8mb4_unicode_ci = @admin_email LIMIT 1);
SET @seller_user_id := (SELECT id FROM users WHERE email COLLATE utf8mb4_unicode_ci = @seller_email LIMIT 1);
SET @no_access_user_id := (SELECT id FROM users WHERE email COLLATE utf8mb4_unicode_ci = @no_access_email LIMIT 1);
SET @admin_role_id := (SELECT id FROM roles WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'ADMIN' COLLATE utf8mb4_unicode_ci LIMIT 1);
SET @seller_role_id := (SELECT id FROM roles WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'QA_SELLER_NO_SHIPMENTS' COLLATE utf8mb4_unicode_ci LIMIT 1);
SET @no_access_role_id := (SELECT id FROM roles WHERE code COLLATE utf8mb4_unicode_ci = _utf8mb4'NO_ACCESS' COLLATE utf8mb4_unicode_ci LIMIT 1);

SELECT IF(@admin_user_id IS NULL, 'MISSING_admin_user_id', 'OK_admin_user_id') AS guard_admin_user_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'admin_user_id' COLLATE utf8mb4_unicode_ci, @admin_user_id);
SELECT IF(@seller_user_id IS NULL, 'MISSING_seller_user_id', 'OK_seller_user_id') AS guard_seller_user_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'seller_user_id' COLLATE utf8mb4_unicode_ci, @seller_user_id);
SELECT IF(@no_access_user_id IS NULL, 'MISSING_no_access_user_id', 'OK_no_access_user_id') AS guard_no_access_user_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'no_access_user_id' COLLATE utf8mb4_unicode_ci, @no_access_user_id);
SELECT IF(@admin_role_id IS NULL, 'MISSING_admin_role_id', 'OK_admin_role_id') AS guard_admin_role_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'admin_role_id' COLLATE utf8mb4_unicode_ci, @admin_role_id);
SELECT IF(@seller_role_id IS NULL, 'MISSING_seller_role_id', 'OK_seller_role_id') AS guard_seller_role_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'seller_role_id' COLLATE utf8mb4_unicode_ci, @seller_role_id);
SELECT IF(@no_access_role_id IS NULL, 'MISSING_no_access_role_id', 'OK_no_access_role_id') AS guard_no_access_role_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'no_access_role_id' COLLATE utf8mb4_unicode_ci, @no_access_role_id);

INSERT INTO user_companies (user_id, company_id, is_primary, status)
VALUES
  (@admin_user_id, @company_id, 1, 'ACTIVE'),
  (@seller_user_id, @company_id, 1, 'ACTIVE'),
  (@no_access_user_id, @company_id, 1, 'ACTIVE')
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary), status = 'ACTIVE';

INSERT IGNORE INTO user_branches (user_id, branch_id, is_primary)
VALUES
  (@admin_user_id, @branch_id, 1),
  (@seller_user_id, @branch_id, 1),
  (@no_access_user_id, @branch_id, 1);

UPDATE user_branches
SET is_primary = 1
WHERE user_id IN (@admin_user_id, @seller_user_id, @no_access_user_id)
  AND branch_id = @branch_id;

DELETE FROM user_roles WHERE user_id IN (@admin_user_id, @seller_user_id, @no_access_user_id);
INSERT INTO user_roles (user_id, role_id) VALUES
  (@admin_user_id, @admin_role_id),
  (@seller_user_id, @seller_role_id),
  (@no_access_user_id, @no_access_role_id);

DELETE FROM user_permissions WHERE user_id IN (@admin_user_id, @seller_user_id, @no_access_user_id);

INSERT INTO user_permissions (user_id, permission_id)
SELECT @admin_user_id, p.id
FROM permissions p
WHERE p.code COLLATE utf8mb4_unicode_ci IN (
  _utf8mb4'MANAGE_SHIPMENTS' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'VIEW_CUSTOMERS' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'VIEW_INVENTORY' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'VIEW_PAYMENTS' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'CREATE_CUSTOMER_PACKAGE' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'CREATE_CLOSE_CUSTOMER_PACKAGE' COLLATE utf8mb4_unicode_ci
);

INSERT INTO user_permissions (user_id, permission_id)
SELECT @seller_user_id, p.id
FROM permissions p
WHERE p.code COLLATE utf8mb4_unicode_ci IN (
  _utf8mb4'VIEW_CUSTOMERS' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'VIEW_INVENTORY' COLLATE utf8mb4_unicode_ci
);

DELETE FROM user_login_security WHERE user_id IN (@admin_user_id, @seller_user_id, @no_access_user_id);
UPDATE user_api_sessions
SET revoked_at = CURRENT_TIMESTAMP
WHERE user_id IN (@admin_user_id, @seller_user_id, @no_access_user_id)
  AND revoked_at IS NULL;

INSERT INTO branch_sales_channels (branch_id, sales_channel_id, is_enabled, updated_by_user_id)
VALUES (@branch_id, @sales_channel_id, 1, @admin_user_id)
ON DUPLICATE KEY UPDATE is_enabled = 1, updated_by_user_id = VALUES(updated_by_user_id);

INSERT INTO company_modules (company_id, module_code, enabled)
VALUES
  (@company_id, _utf8mb4'INVENTORY' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'DOOR_SALES' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'RESERVATIONS' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'CUSTOMER_PACKAGES' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'SHIPMENTS' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'PAYMENTS' COLLATE utf8mb4_unicode_ci, 1),
  (@company_id, _utf8mb4'MULTI_BRANCH' COLLATE utf8mb4_unicode_ci, 1)
ON DUPLICATE KEY UPDATE enabled = VALUES(enabled);

INSERT INTO company_limits (company_id)
VALUES (@company_id)
ON DUPLICATE KEY UPDATE company_id = VALUES(company_id);

-- Reset controlado de registros operativos QA.
SET @existing_shipment_id := (SELECT id FROM shipments WHERE folio COLLATE utf8mb4_unicode_ci = @shipment_folio LIMIT 1);
SET @existing_package_id := (SELECT id FROM customer_packages WHERE folio COLLATE utf8mb4_unicode_ci = @package_folio LIMIT 1);
SET @existing_item_id := (SELECT id FROM items WHERE company_id = @company_id AND code COLLATE utf8mb4_unicode_ci = @item_code LIMIT 1);

DELETE FROM shipment_payments WHERE shipment_id = @existing_shipment_id OR package_id = @existing_package_id;
DELETE FROM shipment_cost_shares WHERE shipment_id = @existing_shipment_id OR customer_package_id = @existing_package_id;
DELETE FROM shipment_packages WHERE shipment_id = @existing_shipment_id OR customer_package_id = @existing_package_id;
DELETE FROM shipments WHERE id = @existing_shipment_id;
DELETE FROM customer_package_items WHERE customer_package_id = @existing_package_id OR item_id = @existing_item_id;

DELETE pa
FROM payment_allocations pa
LEFT JOIN payments p ON p.id = pa.payment_id
LEFT JOIN sales s ON s.id = pa.sale_id
LEFT JOIN items i ON i.id = s.item_id
WHERE pa.customer_package_id = @existing_package_id
   OR p.reference COLLATE utf8mb4_unicode_ci = @payment_reference
   OR i.id = @existing_item_id;

DELETE FROM payments WHERE reference COLLATE utf8mb4_unicode_ci = @payment_reference;
DELETE FROM sales WHERE item_id = @existing_item_id;
DELETE FROM customer_packages WHERE id = @existing_package_id;
DELETE FROM items WHERE id = @existing_item_id;

DELETE ca
FROM customer_addresses ca
JOIN customers c ON c.id = ca.customer_id
WHERE c.company_id = @company_id
  AND c.email COLLATE utf8mb4_unicode_ci = @customer_email;

DELETE FROM customers
WHERE company_id = @company_id
  AND email COLLATE utf8mb4_unicode_ci = @customer_email;

-- Cliente, direccion, mercancia y paquete QA.
INSERT INTO customers (company_id, branch_id, owner_user_id, created_by_user_id, name, phone, email, is_generic, generic_type, status)
VALUES (@company_id, @branch_id, @seller_user_id, @admin_user_id, _utf8mb4'Cliente QA SHIP-E' COLLATE utf8mb4_unicode_ci, _utf8mb4'5551112233' COLLATE utf8mb4_unicode_ci, @customer_email, 0, NULL, 'ACTIVE');
SET @customer_id := LAST_INSERT_ID();
SELECT IF(@customer_id IS NULL OR @customer_id = 0, 'MISSING_customer_id', 'OK_customer_id') AS guard_customer_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'customer_id' COLLATE utf8mb4_unicode_ci, @customer_id);

INSERT INTO customer_addresses (customer_id, label, line1, line2, city, state, postal_code, country, is_default, status)
VALUES (@customer_id, _utf8mb4'Casa QA' COLLATE utf8mb4_unicode_ci, _utf8mb4'Calle QA 123' COLLATE utf8mb4_unicode_ci, NULL, _utf8mb4'Tuxtla Gutierrez' COLLATE utf8mb4_unicode_ci, _utf8mb4'Chiapas' COLLATE utf8mb4_unicode_ci, _utf8mb4'29000' COLLATE utf8mb4_unicode_ci, _utf8mb4'Mexico' COLLATE utf8mb4_unicode_ci, 1, 'ACTIVE');
SET @address_id := LAST_INSERT_ID();
SELECT IF(@address_id IS NULL OR @address_id = 0, 'MISSING_address_id', 'OK_address_id') AS guard_address_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'address_id' COLLATE utf8mb4_unicode_ci, @address_id);

INSERT INTO items (company_id, code, qr_code, branch_id, batch_id, product_type_id, brand_id, size_id, comments, price, status, storage_location_id, created_by_user_id)
VALUES (@company_id, @item_code, _utf8mb4'QR-SHIPE-QA-ITEM-001' COLLATE utf8mb4_unicode_ci, @branch_id, NULL, @product_type_id, NULL, NULL, _utf8mb4'Prenda QA SHIP-E' COLLATE utf8mb4_unicode_ci, 300.00, 'RESERVED', NULL, @admin_user_id);
SET @item_id := LAST_INSERT_ID();
SELECT IF(@item_id IS NULL OR @item_id = 0, 'MISSING_item_id', 'OK_item_id') AS guard_item_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'item_id' COLLATE utf8mb4_unicode_ci, @item_id);

INSERT INTO sales (item_id, customer_id, branch_id, seller_user_id, customer_order_id, sales_channel_id, price, status, payment_status, created_by_user_id)
VALUES (@item_id, @customer_id, @branch_id, @seller_user_id, NULL, @sales_channel_id, 300.00, 'ACTIVE', 'PAID', @admin_user_id);
SET @sale_id := LAST_INSERT_ID();
SELECT IF(@sale_id IS NULL OR @sale_id = 0, 'MISSING_sale_id', 'OK_sale_id') AS guard_sale_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'sale_id' COLLATE utf8mb4_unicode_ci, @sale_id);

INSERT INTO customer_packages (
  folio, customer_id, branch_id, status, notes,
  shipping_cost_amount, shipping_cost_confirmed, shipping_cost_waived,
  shipping_carrier, tracking_number, shipping_notes, delivery_type,
  shipping_address_source, shipping_address_confirmed, source_customer_address_id,
  ship_to_name, ship_to_phone, ship_to_line1, ship_to_line2,
  ship_to_city, ship_to_state, ship_to_postal_code, ship_to_country,
  ship_to_references, shipping_collect, customer_provided_label, created_by_user_id,
  closed_at, closed_by_user_id
)
VALUES (
  @package_folio, @customer_id, @branch_id, 'READY', _utf8mb4'QA SHIP-E: mercancia pagada completa; envio separado.' COLLATE utf8mb4_unicode_ci,
  NULL, 0, 0, NULL, NULL, NULL, NULL,
  _utf8mb4'CUSTOMER_SAVED_ADDRESS' COLLATE utf8mb4_unicode_ci, 1, @address_id,
  _utf8mb4'Cliente QA SHIP-E' COLLATE utf8mb4_unicode_ci, _utf8mb4'5551112233' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Calle QA 123' COLLATE utf8mb4_unicode_ci, NULL,
  _utf8mb4'Tuxtla Gutierrez' COLLATE utf8mb4_unicode_ci, _utf8mb4'Chiapas' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'29000' COLLATE utf8mb4_unicode_ci, _utf8mb4'Mexico' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Referencia QA' COLLATE utf8mb4_unicode_ci, 0, 0, @admin_user_id,
  CURRENT_TIMESTAMP, @admin_user_id
);
SET @package_id := LAST_INSERT_ID();
SELECT IF(@package_id IS NULL OR @package_id = 0, 'MISSING_package_id', 'OK_package_id') AS guard_package_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'package_id' COLLATE utf8mb4_unicode_ci, @package_id);

INSERT INTO customer_package_items (customer_package_id, item_id, reservation_id, sale_id)
VALUES (@package_id, @item_id, NULL, @sale_id);

INSERT INTO payments (customer_id, branch_id, received_amount, payment_method_id, reference, status, created_by_user_id)
VALUES (@customer_id, @branch_id, 300.00, @payment_method_id, @payment_reference, 'ACTIVE', @admin_user_id);
SET @payment_id := LAST_INSERT_ID();
SELECT IF(@payment_id IS NULL OR @payment_id = 0, 'MISSING_payment_id', 'OK_payment_id') AS guard_payment_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'payment_id' COLLATE utf8mb4_unicode_ci, @payment_id);

INSERT INTO payment_allocations (payment_id, reservation_id, sale_id, customer_package_id, amount)
VALUES (@payment_id, NULL, @sale_id, NULL, 300.00);

INSERT INTO shipments (
  folio, branch_id, delivery_type, status, guide_reference,
  recipient_name, recipient_phone, destination_summary, destination_city,
  destination_state, destination_postal_code, shipping_carrier,
  real_shipping_cost, shipping_notes, quoted_at, ready_at, created_by_user_id
)
VALUES (
  @shipment_folio, @branch_id, 'CARRIER', 'OPEN', _utf8mb4'GUIA-SHIPE-QA-001' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Cliente QA SHIP-E' COLLATE utf8mb4_unicode_ci, _utf8mb4'5551112233' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Calle QA 123, Tuxtla Gutierrez, Chiapas, 29000, Mexico' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Tuxtla Gutierrez' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Chiapas' COLLATE utf8mb4_unicode_ci, _utf8mb4'29000' COLLATE utf8mb4_unicode_ci,
  _utf8mb4'Paqueteria QA' COLLATE utf8mb4_unicode_ci,
  120.00, _utf8mb4'QA SHIP-E: envio con saldo pendiente inicial.' COLLATE utf8mb4_unicode_ci,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @admin_user_id
);
SET @shipment_id := LAST_INSERT_ID();
SELECT IF(@shipment_id IS NULL OR @shipment_id = 0, 'MISSING_shipment_id', 'OK_shipment_id') AS guard_shipment_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'shipment_id' COLLATE utf8mb4_unicode_ci, @shipment_id);

INSERT INTO shipment_packages (shipment_id, customer_package_id, customer_id, delivery_address_id, payment_mode, expected_cod_amount, result_status, collected_amount, result_notes)
VALUES (@shipment_id, @package_id, @customer_id, @address_id, 'PREPAID', NULL, 'PENDING', NULL, NULL);

INSERT INTO shipment_cost_shares (shipment_id, customer_package_id, customer_id, assigned_amount, share_method, notes, created_by_user_id, updated_by_user_id)
VALUES (@shipment_id, @package_id, @customer_id, 120.00, _utf8mb4'MANUAL' COLLATE utf8mb4_unicode_ci, _utf8mb4'QA SHIP-E costo asignado para smoke.' COLLATE utf8mb4_unicode_ci, @admin_user_id, @admin_user_id);
SET @cost_share_id := LAST_INSERT_ID();
SELECT IF(@cost_share_id IS NULL OR @cost_share_id = 0, 'MISSING_cost_share_id', 'OK_cost_share_id') AS guard_cost_share_id;
INSERT INTO qa_dataset_required_ids (label, required_id) VALUES (_utf8mb4'cost_share_id' COLLATE utf8mb4_unicode_ci, @cost_share_id);

COMMIT;

-- SELECTs de validacion para smoke SHIP-E.
SELECT c.id AS company_id, c.code AS company_code, b.id AS branch_id, b.code AS branch_code, b.status AS branch_status
FROM companies c
JOIN branches b ON b.company_id = c.id
WHERE c.code COLLATE utf8mb4_unicode_ci = @company_code
  AND b.code COLLATE utf8mb4_unicode_ci = @branch_code;

SELECT
  u.email,
  u.status AS user_status,
  b.code AS branch_code,
  c.code AS company_code,
  GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS roles,
  GROUP_CONCAT(DISTINCT pd.code ORDER BY pd.code SEPARATOR ',') AS direct_permissions,
  CASE WHEN EXISTS (
    SELECT 1
    FROM user_permissions up2
    JOIN permissions p2 ON p2.id = up2.permission_id
    WHERE up2.user_id = u.id
      AND p2.code COLLATE utf8mb4_unicode_ci = _utf8mb4'MANAGE_SHIPMENTS' COLLATE utf8mb4_unicode_ci
  ) OR EXISTS (
    SELECT 1
    FROM user_roles ur2
    JOIN role_permissions rp2 ON rp2.role_id = ur2.role_id
    JOIN permissions p3 ON p3.id = rp2.permission_id
    WHERE ur2.user_id = u.id
      AND p3.code COLLATE utf8mb4_unicode_ci = _utf8mb4'MANAGE_SHIPMENTS' COLLATE utf8mb4_unicode_ci
  ) THEN 1 ELSE 0 END AS has_manage_shipments
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN user_permissions upd ON upd.user_id = u.id
LEFT JOIN permissions pd ON pd.id = upd.permission_id
WHERE u.email COLLATE utf8mb4_unicode_ci IN (@admin_email, @seller_email, @no_access_email)
GROUP BY u.id, u.email, u.status, b.code, c.code
ORDER BY u.email;

SELECT
  sh.id AS shipment_id,
  sh.folio AS shipment_folio,
  sh.status AS shipment_status,
  sh.real_shipping_cost,
  cp.id AS package_id,
  cp.folio AS package_folio,
  cp.status AS package_status,
  scs.id AS cost_share_id,
  scs.assigned_amount,
  COALESCE(SUM(CASE WHEN sp.status = 'REGISTERED' THEN sp.amount ELSE 0 END), 0.00) AS shipping_paid,
  scs.assigned_amount - COALESCE(SUM(CASE WHEN sp.status = 'REGISTERED' THEN sp.amount ELSE 0 END), 0.00) AS shipping_balance
FROM shipments sh
JOIN shipment_packages shp ON shp.shipment_id = sh.id
JOIN customer_packages cp ON cp.id = shp.customer_package_id
JOIN shipment_cost_shares scs ON scs.shipment_id = sh.id AND scs.customer_package_id = cp.id
LEFT JOIN shipment_payments sp ON sp.shipment_id = sh.id AND sp.cost_share_id = scs.id
WHERE sh.folio COLLATE utf8mb4_unicode_ci = @shipment_folio
GROUP BY sh.id, sh.folio, sh.status, sh.real_shipping_cost, cp.id, cp.folio, cp.status, scs.id, scs.assigned_amount;

SELECT
  cp.folio AS package_folio,
  cp.status AS package_status,
  s.price AS merchandise_total,
  COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0.00) AS merchandise_paid,
  s.price - COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN pa.amount ELSE 0 END), 0.00) AS merchandise_balance,
  s.payment_status,
  i.status AS item_status
FROM customer_packages cp
JOIN customer_package_items cpi ON cpi.customer_package_id = cp.id
JOIN sales s ON s.id = cpi.sale_id
JOIN items i ON i.id = cpi.item_id
LEFT JOIN payment_allocations pa ON pa.sale_id = s.id
LEFT JOIN payments p ON p.id = pa.payment_id
WHERE cp.folio COLLATE utf8mb4_unicode_ci = @package_folio
GROUP BY cp.folio, cp.status, s.id, s.price, s.payment_status, i.status;

SELECT
  cp.folio AS package_folio,
  cp.shipping_address_source,
  cp.source_customer_address_id,
  cp.shipping_address_confirmed
FROM customer_packages cp
WHERE cp.folio COLLATE utf8mb4_unicode_ci = @package_folio;
