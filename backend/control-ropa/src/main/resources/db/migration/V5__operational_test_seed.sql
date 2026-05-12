-- V5__operational_test_seed.sql
-- Semillas operativas adicionales para pruebas de desarrollo
-- Asume que ya corrieron V1..V4

SET NAMES utf8mb4;
START TRANSACTION;

-- =========================================================
-- 1. CONTEXTO BASE
-- =========================================================
SET @branch_centro_id := (SELECT id FROM branches WHERE code = 'CTR' LIMIT 1);
SET @admin_user_id    := (SELECT id FROM users WHERE email = 'admin@local.test' LIMIT 1);

SET @role_supervisor_id := (SELECT id FROM roles WHERE code = 'SUPERVISOR' LIMIT 1);
SET @role_seller_id     := (SELECT id FROM roles WHERE code = 'SELLER' LIMIT 1);
SET @role_cashier_id    := (SELECT id FROM roles WHERE code = 'CASHIER' LIMIT 1);

SET @product_type_playera_id  := (SELECT id FROM product_types WHERE code = 'PLAYERA' LIMIT 1);
SET @product_type_pantalon_id := (SELECT id FROM product_types WHERE code = 'PANTALON' LIMIT 1);
SET @brand_nike_id            := (SELECT id FROM brands WHERE code = 'NIKE' LIMIT 1);
SET @brand_zara_id            := (SELECT id FROM brands WHERE code = 'ZARA' LIMIT 1);
SET @size_m_id                := (SELECT id FROM sizes WHERE code = 'M' LIMIT 1);
SET @size_ch_id               := (SELECT id FROM sizes WHERE code = 'CH' LIMIT 1);
SET @location_rack_a_id       := (SELECT id FROM storage_locations WHERE branch_id = @branch_centro_id AND code = 'RACK_A' LIMIT 1);
SET @location_rack_b_id       := (SELECT id FROM storage_locations WHERE branch_id = @branch_centro_id AND code = 'RACK_B' LIMIT 1);
SET @box_a_id                 := (SELECT id FROM boxes WHERE branch_id = @branch_centro_id AND code = 'A' LIMIT 1);

-- =========================================================
-- 2. USUARIOS OPERATIVOS DE PRUEBA
-- =========================================================
INSERT INTO users (branch_id, name, email, phone, password_hash, status)
SELECT @branch_centro_id, 'Supervisor Centro', 'supervisor.centro@local.test', '5500000001', '{noop}Supervisor123!', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'supervisor.centro@local.test'
);
SET @supervisor_user_id := (SELECT id FROM users WHERE email = 'supervisor.centro@local.test' LIMIT 1);

INSERT INTO users (branch_id, name, email, phone, password_hash, status)
SELECT @branch_centro_id, 'Vendedor Centro', 'seller.centro@local.test', '5500000002', '{noop}Seller123!', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'seller.centro@local.test'
);
SET @seller_user_id := (SELECT id FROM users WHERE email = 'seller.centro@local.test' LIMIT 1);

INSERT INTO users (branch_id, name, email, phone, password_hash, status)
SELECT @branch_centro_id, 'Caja Centro', 'cashier.centro@local.test', '5500000003', '{noop}Cashier123!', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'cashier.centro@local.test'
);
SET @cashier_user_id := (SELECT id FROM users WHERE email = 'cashier.centro@local.test' LIMIT 1);

INSERT INTO user_roles (user_id, role_id)
SELECT @supervisor_user_id, @role_supervisor_id
WHERE @supervisor_user_id IS NOT NULL
  AND @role_supervisor_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = @supervisor_user_id AND role_id = @role_supervisor_id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT @seller_user_id, @role_seller_id
WHERE @seller_user_id IS NOT NULL
  AND @role_seller_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = @seller_user_id AND role_id = @role_seller_id
  );

INSERT INTO user_roles (user_id, role_id)
SELECT @cashier_user_id, @role_cashier_id
WHERE @cashier_user_id IS NOT NULL
  AND @role_cashier_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = @cashier_user_id AND role_id = @role_cashier_id
  );

-- =========================================================
-- 3. CLIENTE REAL DE PRUEBA
-- =========================================================
INSERT INTO customers (
    branch_id, owner_user_id, created_by_user_id,
    name, phone, email, is_generic, generic_type, status
)
SELECT
    @branch_centro_id,
    @seller_user_id,
    @admin_user_id,
    'Ana López',
    '5512345678',
    'ana.lopez@local.test',
    0,
    NULL,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE branch_id = @branch_centro_id AND phone = '5512345678'
);

SET @customer_ana_id := (SELECT id FROM customers WHERE branch_id = @branch_centro_id AND phone = '5512345678' LIMIT 1);

INSERT INTO customer_addresses (
    customer_id, label, line1, line2, city, state, postal_code, country, is_default, status
)
SELECT
    @customer_ana_id,
    'Casa',
    'Calle 1',
    'Interior 2',
    'CDMX',
    'CDMX',
    '01000',
    'México',
    1,
    'ACTIVE'
WHERE @customer_ana_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM customer_addresses WHERE customer_id = @customer_ana_id AND label = 'Casa'
  );

-- =========================================================
-- 4. LOTE DE PRUEBA
-- =========================================================
INSERT INTO batches (
    branch_id, folio, expected_quantity, received_quantity, status, notes, created_by_user_id
)
SELECT
    @branch_centro_id,
    'L-2026-000001',
    2,
    2,
    'RECEIVED',
    'Lote semilla de prueba',
    @admin_user_id
WHERE NOT EXISTS (
    SELECT 1 FROM batches WHERE folio = 'L-2026-000001'
);

SET @batch_test_id := (SELECT id FROM batches WHERE folio = 'L-2026-000001' LIMIT 1);

INSERT INTO batch_classification_details (batch_id, product_type_id, quantity)
SELECT @batch_test_id, @product_type_playera_id, 1
WHERE @batch_test_id IS NOT NULL
  AND @product_type_playera_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM batch_classification_details
      WHERE batch_id = @batch_test_id AND product_type_id = @product_type_playera_id
  );

INSERT INTO batch_classification_details (batch_id, product_type_id, quantity)
SELECT @batch_test_id, @product_type_pantalon_id, 1
WHERE @batch_test_id IS NOT NULL
  AND @product_type_pantalon_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM batch_classification_details
      WHERE batch_id = @batch_test_id AND product_type_id = @product_type_pantalon_id
  );

-- =========================================================
-- 5. ITEMS DE PRUEBA
-- =========================================================
INSERT INTO items (
    code, qr_code, branch_id, batch_id, product_type_id, brand_id, size_id,
    comments, price, status, storage_location_id, created_by_user_id
)
SELECT
    'IT-000001', 'IT-000001',
    @branch_centro_id, @batch_test_id, @product_type_playera_id, @brand_nike_id, @size_m_id,
    'Item semilla 1', 300.00, 'AVAILABLE', @location_rack_a_id, @admin_user_id
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE code = 'IT-000001'
);

INSERT INTO items (
    code, qr_code, branch_id, batch_id, product_type_id, brand_id, size_id,
    comments, price, status, storage_location_id, created_by_user_id
)
SELECT
    'IT-000002', 'IT-000002',
    @branch_centro_id, @batch_test_id, @product_type_pantalon_id, @brand_zara_id, @size_ch_id,
    'Item semilla 2', 450.00, 'AVAILABLE', @location_rack_b_id, @admin_user_id
WHERE NOT EXISTS (
    SELECT 1 FROM items WHERE code = 'IT-000002'
);

-- =========================================================
-- 6. RESUMEN DE UTILIDAD DE ESTE SEED
-- =========================================================
-- Queda listo para probar, sin crear datos manuales:
-- - customer_owner_history (ya existe user_id 2/3/4 aprox, según autoincrement)
-- - customer_addresses (cliente real con dirección)
-- - items (dos items disponibles)
-- - batches y clasificación
-- - reservations/live usando item 1 o 2, customer real o genéricos y box A

COMMIT;
