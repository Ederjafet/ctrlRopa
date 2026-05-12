-- Preparacion de datos QA para jornada operativa completa.
-- Base objetivo: MySQL. Ejecutar con respaldo previo.
-- Password de todos los usuarios QA: Qa12345!

SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO branches (
  code, name, status, address_line1, address_line2, city, state, postal_code, country
) VALUES
  ('QA_CTR', 'QA Centro', 'ACTIVE', 'Av. QA Centro 100', NULL, 'Ciudad QA', 'Estado QA', '01000', 'Mexico'),
  ('QA_VER', 'QA Veracruz', 'ACTIVE', 'Blvd. QA Veracruz 200', NULL, 'Veracruz', 'Veracruz', '91700', 'Mexico')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  status = 'ACTIVE',
  address_line1 = VALUES(address_line1),
  city = VALUES(city),
  state = VALUES(state),
  postal_code = VALUES(postal_code),
  country = VALUES(country);

SELECT id INTO @qa_centro_id FROM branches WHERE code = 'QA_CTR';
SELECT id INTO @qa_veracruz_id FROM branches WHERE code = 'QA_VER';

INSERT IGNORE INTO roles (code, name) VALUES
  ('ADMIN', 'Administrador'),
  ('SUPERVISOR', 'Supervisor'),
  ('SELLER', 'Vendedor'),
  ('CASHIER', 'Caja'),
  ('INVENTORY', 'Inventario'),
  ('PACKING', 'Empaque'),
  ('LOGISTICS', 'Logistica'),
  ('COURIER', 'Mensajero');

INSERT IGNORE INTO permissions (code, name) VALUES
  ('MANAGE_USERS', 'Administrar usuarios'),
  ('MANAGE_ROLES', 'Administrar roles'),
  ('MANAGE_BRANCHES', 'Administrar sucursales'),
  ('MANAGE_BRANCH_CHANNELS', 'Administrar canales por sucursal'),
  ('MANAGE_CATALOGS', 'Administrar catalogos'),
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_INVENTORY', 'Ver inventario'),
  ('MANAGE_INVENTORY', 'Administrar inventario'),
  ('DO_LIVE_RESERVATION', 'Crear reservas en live'),
  ('DO_DOOR_SALE', 'Realizar venta puerta'),
  ('DO_DOOR_RESERVATION', 'Crear apartados puerta'),
  ('REGISTER_PAYMENTS', 'Registrar pagos'),
  ('APPLY_CUSTOMER_BALANCE', 'Aplicar saldo a favor'),
  ('VOID_PAYMENT', 'Anular pagos'),
  ('CREATE_CLOSE_CUSTOMER_PACKAGE', 'Crear y cerrar paquetes'),
  ('MANAGE_CUSTOMER_PACKAGES', 'Administrar paquetes'),
  ('MANAGE_SHIPMENTS', 'Administrar envios'),
  ('CANCEL_RESERVATION', 'Cancelar reservas'),
  ('CANCEL_SALE', 'Cancelar ventas'),
  ('REQUEST_REFUND', 'Solicitar refund'),
  ('APPROVE_REFUND', 'Aprobar refund'),
  ('PROCESS_REFUND', 'Procesar refund'),
  ('CANCEL_REFUND', 'Cancelar refund'),
  ('MANAGE_REFUNDS', 'Administrar refunds'),
  ('MANAGE_RETURNS', 'Administrar devoluciones'),
  ('MANAGE_BRANDING', 'Administrar apariencia'),
  ('MANAGE_TRANSFERS', 'Administrar transferencias'),
  ('SEND_TRANSFERS', 'Enviar transferencias'),
  ('RECEIVE_TRANSFERS', 'Recibir transferencias'),
  ('CANCEL_TRANSFERS', 'Cancelar transferencias'),
  ('MANAGE_CONSIGNMENTS', 'Administrar consignaciones'),
  ('SETTLE_CONSIGNMENTS', 'Liquidar consignaciones'),
  ('CANCEL_CONSIGNMENTS', 'Cancelar consignaciones'),
  ('VIEW_REPORTS', 'Ver reportes'),
  ('VIEW_DEPOSIT_REPORTS', 'Ver reporte de depositos'),
  ('MANAGE_CASH_CLOSURES', 'Administrar cierres de caja'),
  ('MANAGE_INCIDENTS', 'Administrar incidencias');

INSERT INTO users (branch_id, name, email, phone, password_hash, status) VALUES
  (@qa_centro_id, 'QA Admin General', 'qa.admin@local.test', '5550000001', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Supervisor Centro', 'qa.supervisor.centro@local.test', '5550000002', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Vendedor Centro', 'qa.vendedor.centro@local.test', '5550000003', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Caja Centro', 'qa.caja.centro@local.test', '5550000004', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Inventario Centro', 'qa.inventario.centro@local.test', '5550000005', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Empaque Centro', 'qa.empaque.centro@local.test', '5550000006', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Logistica Centro', 'qa.logistica.centro@local.test', '5550000007', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_centro_id, 'QA Mensajero Centro', 'qa.mensajero.centro@local.test', '5550000008', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_veracruz_id, 'QA Vendedor Veracruz', 'qa.vendedor.veracruz@local.test', '5550000009', '{noop}Qa12345!', 'ACTIVE'),
  (@qa_veracruz_id, 'QA Caja Veracruz', 'qa.caja.veracruz@local.test', '5550000010', '{noop}Qa12345!', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  branch_id = VALUES(branch_id),
  name = VALUES(name),
  phone = VALUES(phone),
  password_hash = VALUES(password_hash),
  status = 'ACTIVE';

DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email LIKE 'qa.%@local.test';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON (
  (u.email = 'qa.admin@local.test' AND r.code = 'ADMIN') OR
  (u.email LIKE 'qa.supervisor.%' AND r.code = 'SUPERVISOR') OR
  (u.email LIKE 'qa.vendedor.%' AND r.code = 'SELLER') OR
  (u.email LIKE 'qa.caja.%' AND r.code = 'CASHIER') OR
  (u.email LIKE 'qa.inventario.%' AND r.code = 'INVENTORY') OR
  (u.email LIKE 'qa.empaque.%' AND r.code = 'PACKING') OR
  (u.email LIKE 'qa.logistica.%' AND r.code = 'LOGISTICS') OR
  (u.email LIKE 'qa.mensajero.%' AND r.code = 'COURIER')
)
WHERE u.email LIKE 'qa.%@local.test';

DELETE up FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email LIKE 'qa.%@local.test';

-- Admin QA: todos los permisos.
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p
WHERE u.email = 'qa.admin@local.test';

-- Supervisor QA: todos los permisos operativos y reportes.
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS','VIEW_INVENTORY','MANAGE_INVENTORY',
  'DO_LIVE_RESERVATION','DO_DOOR_SALE','DO_DOOR_RESERVATION',
  'REGISTER_PAYMENTS','APPLY_CUSTOMER_BALANCE','VOID_PAYMENT',
  'CREATE_CLOSE_CUSTOMER_PACKAGE','MANAGE_CUSTOMER_PACKAGES','MANAGE_SHIPMENTS',
  'CANCEL_RESERVATION','CANCEL_SALE','REQUEST_REFUND','APPROVE_REFUND','PROCESS_REFUND',
  'MANAGE_REFUNDS','MANAGE_RETURNS','MANAGE_TRANSFERS','SEND_TRANSFERS','RECEIVE_TRANSFERS',
  'MANAGE_CONSIGNMENTS','SETTLE_CONSIGNMENTS','VIEW_REPORTS','MANAGE_CASH_CLOSURES','MANAGE_INCIDENTS'
)
WHERE u.email LIKE 'qa.supervisor.%';

-- Roles operativos con permisos acotados.
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('VIEW_CUSTOMERS','VIEW_INVENTORY','DO_DOOR_SALE','DO_DOOR_RESERVATION','DO_LIVE_RESERVATION')
WHERE u.email LIKE 'qa.vendedor.%';

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('VIEW_CUSTOMERS','VIEW_INVENTORY','REGISTER_PAYMENTS','APPLY_CUSTOMER_BALANCE','VOID_PAYMENT','VIEW_REPORTS','MANAGE_CASH_CLOSURES')
WHERE u.email LIKE 'qa.caja.%';

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('VIEW_INVENTORY','MANAGE_INVENTORY','MANAGE_TRANSFERS','SEND_TRANSFERS','RECEIVE_TRANSFERS')
WHERE u.email LIKE 'qa.inventario.%';

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('VIEW_CUSTOMERS','VIEW_INVENTORY','CREATE_CLOSE_CUSTOMER_PACKAGE','MANAGE_CUSTOMER_PACKAGES')
WHERE u.email LIKE 'qa.empaque.%';

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('VIEW_CUSTOMERS','MANAGE_SHIPMENTS','MANAGE_TRANSFERS','SEND_TRANSFERS','RECEIVE_TRANSFERS','MANAGE_INCIDENTS')
WHERE u.email LIKE 'qa.logistica.%';

INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id FROM users u JOIN permissions p ON p.code IN
('MANAGE_SHIPMENTS','MANAGE_INCIDENTS')
WHERE u.email LIKE 'qa.mensajero.%';

SELECT id INTO @qa_admin_id FROM users WHERE email = 'qa.admin@local.test';

INSERT INTO product_types (code, name, status) VALUES
  ('QA_PLAYERA', 'QA Playera', 'ACTIVE'),
  ('QA_PANTALON', 'QA Pantalon', 'ACTIVE'),
  ('QA_VESTIDO', 'QA Vestido', 'ACTIVE'),
  ('QA_BOLSA', 'QA Bolsa', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT INTO brands (code, name, status) VALUES
  ('QA_NOVA', 'QA Nova', 'ACTIVE'),
  ('QA_LUNA', 'QA Luna', 'ACTIVE'),
  ('QA_SOL', 'QA Sol', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT INTO sizes (code, name, sort_order, status) VALUES
  ('QA_CH', 'QA Chica', 10, 'ACTIVE'),
  ('QA_M', 'QA Mediana', 20, 'ACTIVE'),
  ('QA_G', 'QA Grande', 30, 'ACTIVE'),
  ('QA_UNI', 'QA Unitalla', 40, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order), status = 'ACTIVE';

INSERT INTO payment_methods (code, name, status) VALUES
  ('QA_CASH', 'QA Efectivo', 'ACTIVE'),
  ('QA_CARD', 'QA Tarjeta', 'ACTIVE'),
  ('QA_TRANSFER', 'QA Transferencia', 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT IGNORE INTO sales_channels (code, name, status) VALUES
  ('LIVE', 'Live', 'ACTIVE'),
  ('DOOR_SALE', 'Venta puerta', 'ACTIVE'),
  ('DOOR_RESERVATION', 'Apartado puerta', 'ACTIVE'),
  ('CONSIGNMENT', 'Consignacion', 'ACTIVE');

INSERT INTO branch_sales_channels (branch_id, sales_channel_id, is_enabled, updated_by_user_id)
SELECT b.id, sc.id, 1, @qa_admin_id
FROM branches b
JOIN sales_channels sc ON sc.code IN ('LIVE','DOOR_SALE','DOOR_RESERVATION','CONSIGNMENT')
WHERE b.code IN ('QA_CTR','QA_VER')
ON DUPLICATE KEY UPDATE is_enabled = 1, updated_by_user_id = @qa_admin_id;

INSERT INTO storage_locations (branch_id, code, name, status)
SELECT b.id, x.code, x.name, 'ACTIVE'
FROM branches b
JOIN (
  SELECT 'QA_RACK_A' code, 'QA Rack A' name UNION ALL
  SELECT 'QA_RACK_B', 'QA Rack B' UNION ALL
  SELECT 'QA_LIVE', 'QA Zona Live'
) x
WHERE b.code IN ('QA_CTR','QA_VER')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE';

INSERT INTO boxes (branch_id, code, description, qr_code, status)
SELECT b.id, x.code, x.description, CONCAT('QA-', b.code, '-', x.code), 'ACTIVE'
FROM branches b
JOIN (
  SELECT 'QA_BOX_A' code, 'QA Caja A' description UNION ALL
  SELECT 'QA_BOX_B', 'QA Caja B'
) x
WHERE b.code IN ('QA_CTR','QA_VER')
ON DUPLICATE KEY UPDATE description = VALUES(description), status = 'ACTIVE';

INSERT INTO batches (branch_id, folio, expected_quantity, received_quantity, status, notes, created_by_user_id)
SELECT b.id, CONCAT('QA-LOTE-', b.code, '-001'), 14, 14, 'RECEIVED', 'Lote QA para jornada operativa', @qa_admin_id
FROM branches b
WHERE b.code IN ('QA_CTR','QA_VER')
ON DUPLICATE KEY UPDATE received_quantity = 14, status = 'RECEIVED', notes = VALUES(notes);

-- Clientes iniciales existentes.
INSERT INTO customers (
  branch_id, owner_user_id, created_by_user_id, name, phone, email, is_generic, generic_type, status
) VALUES
  (@qa_centro_id, @qa_admin_id, @qa_admin_id, 'QA Cliente Existente Centro Ana', '5511111111', 'qa.ana@cliente.test', 0, NULL, 'ACTIVE'),
  (@qa_centro_id, @qa_admin_id, @qa_admin_id, 'QA Cliente Existente Centro Bruno', '5522222222', 'qa.bruno@cliente.test', 0, NULL, 'ACTIVE'),
  (@qa_veracruz_id, @qa_admin_id, @qa_admin_id, 'QA Cliente Existente Veracruz Carla', '5533333333', 'qa.carla@cliente.test', 0, NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), status = 'ACTIVE';

-- Direcciones para envios.
INSERT INTO customer_addresses (customer_id, label, line1, line2, city, state, postal_code, country, is_default, status)
SELECT c.id, 'Casa QA', 'Calle QA 123', 'Colonia QA', 'Ciudad QA', 'Estado QA', '01010', 'Mexico', 1, 'ACTIVE'
FROM customers c
WHERE c.email IN ('qa.ana@cliente.test','qa.bruno@cliente.test','qa.carla@cliente.test')
  AND NOT EXISTS (
    SELECT 1 FROM customer_addresses ca WHERE ca.customer_id = c.id AND ca.label = 'Casa QA'
  );

-- Inventario base: 14 prendas en Centro y 8 en Veracruz.
INSERT INTO items (
  code, qr_code, branch_id, batch_id, product_type_id, brand_id, size_id, comments, price, status, storage_location_id, created_by_user_id
)
SELECT
  CONCAT('QA-CTR-', LPAD(n.n, 3, '0')),
  CONCAT('QR-QA-CTR-', LPAD(n.n, 3, '0')),
  @qa_centro_id,
  (SELECT id FROM batches WHERE folio = 'QA-LOTE-QA_CTR-001'),
  (SELECT id FROM product_types WHERE code = IF(n.n % 4 = 0, 'QA_BOLSA', IF(n.n % 3 = 0, 'QA_VESTIDO', IF(n.n % 2 = 0, 'QA_PANTALON', 'QA_PLAYERA')))),
  (SELECT id FROM brands WHERE code = IF(n.n % 3 = 0, 'QA_SOL', IF(n.n % 2 = 0, 'QA_LUNA', 'QA_NOVA'))),
  (SELECT id FROM sizes WHERE code = IF(n.n % 4 = 0, 'QA_UNI', IF(n.n % 3 = 0, 'QA_G', IF(n.n % 2 = 0, 'QA_M', 'QA_CH')))),
  'Prenda QA Centro',
  100 + (n.n * 25),
  'AVAILABLE',
  (SELECT id FROM storage_locations WHERE branch_id = @qa_centro_id AND code = 'QA_RACK_A'),
  @qa_admin_id
FROM (
  SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
  UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
) n
ON DUPLICATE KEY UPDATE status = 'AVAILABLE', price = VALUES(price), comments = VALUES(comments);

INSERT INTO items (
  code, qr_code, branch_id, batch_id, product_type_id, brand_id, size_id, comments, price, status, storage_location_id, created_by_user_id
)
SELECT
  CONCAT('QA-VER-', LPAD(n.n, 3, '0')),
  CONCAT('QR-QA-VER-', LPAD(n.n, 3, '0')),
  @qa_veracruz_id,
  (SELECT id FROM batches WHERE folio = 'QA-LOTE-QA_VER-001'),
  (SELECT id FROM product_types WHERE code = IF(n.n % 3 = 0, 'QA_VESTIDO', IF(n.n % 2 = 0, 'QA_PANTALON', 'QA_PLAYERA'))),
  (SELECT id FROM brands WHERE code = IF(n.n % 2 = 0, 'QA_LUNA', 'QA_NOVA')),
  (SELECT id FROM sizes WHERE code = IF(n.n % 3 = 0, 'QA_G', IF(n.n % 2 = 0, 'QA_M', 'QA_CH'))),
  'Prenda QA Veracruz',
  120 + (n.n * 20),
  'AVAILABLE',
  (SELECT id FROM storage_locations WHERE branch_id = @qa_veracruz_id AND code = 'QA_RACK_A'),
  @qa_admin_id
FROM (
  SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
) n
ON DUPLICATE KEY UPDATE status = 'AVAILABLE', price = VALUES(price), comments = VALUES(comments);

INSERT INTO consignees (branch_id, name, phone, email, notes, status)
VALUES (@qa_centro_id, 'QA Consignatario Moda Norte', '5599990000', 'qa.consignatario@local.test', 'Consignatario QA', 'ACTIVE');

COMMIT;

SELECT 'Datos QA preparados. Usuarios QA password: Qa12345!' AS resultado;
