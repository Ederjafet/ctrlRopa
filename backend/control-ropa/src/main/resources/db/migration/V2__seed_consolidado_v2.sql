-- Seed consolidado v2
-- Ejecutar después de schema_consolidado_v2.sql
-- MySQL 8+

SET NAMES utf8mb4;
START TRANSACTION;

-- =========================================================
-- 1. SUCURSAL BASE
-- =========================================================
INSERT INTO branches (
  code, name, status,
  address_line1, address_line2, city, state, postal_code, country
) VALUES (
  'CTR', 'Centro', 'ACTIVE',
  'Dirección principal', NULL, 'Ciudad', 'Estado', '00000', 'México'
);

SET @branch_centro_id := LAST_INSERT_ID();

-- =========================================================
-- 2. USUARIO ADMIN INICIAL
-- =========================================================
-- NOTA:
-- password_hash usa prefijo {noop} para arranque inicial.
-- Cambiar contraseña al primer acceso o sustituir por BCrypt si así lo prefieres.
INSERT INTO users (
  branch_id, name, email, phone, password_hash, status
) VALUES (
  @branch_centro_id,
  'Administrador General',
  'admin@local.test',
  NULL,
  '{noop}Admin123!',
  'ACTIVE'
);

SET @admin_user_id := LAST_INSERT_ID();

-- =========================================================
-- 3. ROLES BASE
-- =========================================================
INSERT INTO roles (code, name) VALUES
  ('ADMIN', 'Administrador'),
  ('SUPERVISOR', 'Supervisor'),
  ('SELLER', 'Vendedor'),
  ('CASHIER', 'Caja'),
  ('INVENTORY', 'Inventario'),
  ('PACKING', 'Empaque'),
  ('LOGISTICS', 'Logística'),
  ('COURIER', 'Mensajero');

INSERT INTO user_roles (user_id, role_id)
SELECT @admin_user_id, id FROM roles WHERE code = 'ADMIN';

-- =========================================================
-- 4. PERMISOS ADICIONALES
-- =========================================================
INSERT INTO permissions (code, name) VALUES
  ('REGISTER_PAYMENTS', 'Registrar pagos'),
  ('APPLY_CUSTOMER_BALANCE', 'Aplicar saldo a favor'),
  ('DO_DOOR_SALE', 'Realizar venta puerta'),
  ('CREATE_CLOSE_CUSTOMER_PACKAGE', 'Crear y cerrar paquetes de cliente'),
  ('CANCEL_RESERVATION', 'Cancelar reservas'),
  ('EXECUTE_REFUND', 'Ejecutar devoluciones'),
  ('VOID_PAYMENT', 'Anular pagos'),
  ('CANCEL_SALE', 'Cancelar ventas'),
  ('REASSIGN_CUSTOMERS', 'Reasignar clientes');

-- Opcional: dar todos los permisos extra al admin
INSERT INTO user_permissions (user_id, permission_id)
SELECT @admin_user_id, id FROM permissions;

-- =========================================================
-- 5. CATÁLOGOS BASE
-- =========================================================
INSERT INTO product_types (code, name, status) VALUES
  ('PLAYERA', 'Playera', 'ACTIVE'),
  ('PANTALON', 'Pantalón', 'ACTIVE'),
  ('SUDADERA', 'Sudadera', 'ACTIVE'),
  ('BLUSA', 'Blusa', 'ACTIVE'),
  ('FALDA', 'Falda', 'ACTIVE'),
  ('VESTIDO', 'Vestido', 'ACTIVE'),
  ('SHORT', 'Short', 'ACTIVE'),
  ('CHAQUETA', 'Chaqueta', 'ACTIVE');

INSERT INTO brands (code, name, status) VALUES
  ('NIKE', 'Nike', 'ACTIVE'),
  ('ZARA', 'Zara', 'ACTIVE'),
  ('LEVIS', 'Levi''s', 'ACTIVE'),
  ('ADIDAS', 'Adidas', 'ACTIVE'),
  ('PUMA', 'Puma', 'ACTIVE'),
  ('MANGO', 'Mango', 'ACTIVE'),
  ('BERSHKA', 'Bershka', 'ACTIVE');

INSERT INTO sizes (code, name, sort_order, status) VALUES
  ('CH', 'Chica', 10, 'ACTIVE'),
  ('M', 'Mediana', 20, 'ACTIVE'),
  ('G', 'Grande', 30, 'ACTIVE'),
  ('XL', 'Extra Grande', 40, 'ACTIVE'),
  ('XXL', 'Doble Extra Grande', 50, 'ACTIVE'),
  ('28', 'Talla 28', 60, 'ACTIVE'),
  ('30', 'Talla 30', 70, 'ACTIVE'),
  ('32', 'Talla 32', 80, 'ACTIVE'),
  ('34', 'Talla 34', 90, 'ACTIVE'),
  ('36', 'Talla 36', 100, 'ACTIVE'),
  ('UNI', 'Unitalla', 110, 'ACTIVE');

INSERT INTO payment_methods (code, name, status) VALUES
  ('CASH', 'Efectivo', 'ACTIVE'),
  ('TRANSFER', 'Transferencia', 'ACTIVE'),
  ('CARD', 'Tarjeta', 'ACTIVE');

INSERT INTO sales_channels (code, name, status) VALUES
  ('LIVE', 'Live', 'ACTIVE'),
  ('DOOR_SALE', 'Venta puerta', 'ACTIVE'),
  ('DOOR_RESERVATION', 'Apartado puerta', 'ACTIVE'),
  ('CONSIGNMENT', 'Consignación', 'ACTIVE');

-- =========================================================
-- 6. CANALES HABILITADOS POR SUCURSAL
-- =========================================================
INSERT INTO branch_sales_channels (
  branch_id, sales_channel_id, is_enabled, updated_by_user_id
)
SELECT @branch_centro_id, id, 1, @admin_user_id
FROM sales_channels;

-- =========================================================
-- 7. UBICACIONES FÍSICAS BASE
-- =========================================================
INSERT INTO storage_locations (branch_id, code, name, status) VALUES
  (@branch_centro_id, 'ALM_GEN', 'Almacén general', 'ACTIVE'),
  (@branch_centro_id, 'RACK_A', 'Rack A', 'ACTIVE'),
  (@branch_centro_id, 'RACK_B', 'Rack B', 'ACTIVE'),
  (@branch_centro_id, 'ZONA_LIVE', 'Zona live', 'ACTIVE');

-- =========================================================
-- 8. CAJAS BASE
-- =========================================================
INSERT INTO boxes (branch_id, code, description, qr_code, status) VALUES
  (@branch_centro_id, 'A', 'Inicial A', 'BX-CTR-A', 'ACTIVE'),
  (@branch_centro_id, 'B', 'Inicial B', 'BX-CTR-B', 'ACTIVE'),
  (@branch_centro_id, 'C', 'Inicial C', 'BX-CTR-C', 'ACTIVE');

-- =========================================================
-- 9. CLIENTES GENÉRICOS OBLIGATORIOS POR SUCURSAL
-- =========================================================
INSERT INTO customers (
  branch_id, owner_user_id, created_by_user_id,
  name, phone, email,
  is_generic, generic_type, status
) VALUES
  (
    @branch_centro_id,
    NULL,
    @admin_user_id,
    'CLIENTE GENÉRICO PUERTA',
    NULL,
    NULL,
    1,
    'DOOR',
    'ACTIVE'
  ),
  (
    @branch_centro_id,
    NULL,
    @admin_user_id,
    'CLIENTE GENÉRICO CONSIGNACIÓN',
    NULL,
    NULL,
    1,
    'CONSIGNMENT',
    'ACTIVE'
  );

COMMIT;
