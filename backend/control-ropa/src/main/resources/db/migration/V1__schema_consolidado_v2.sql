-- Schema consolidado v2
-- MySQL 8+
-- Baseline limpio integrado con reglas finales del negocio

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS consignment_settlement_items;
DROP TABLE IF EXISTS consignment_settlements;
DROP TABLE IF EXISTS consignment_items;
DROP TABLE IF EXISTS consignments;
DROP TABLE IF EXISTS consignees;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS branch_transfer_items;
DROP TABLE IF EXISTS branch_transfers;
DROP TABLE IF EXISTS shipment_packages;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS customer_package_items;
DROP TABLE IF EXISTS customer_packages;
DROP TABLE IF EXISTS customer_balance_movements;
DROP TABLE IF EXISTS payment_allocations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS customer_order_items;
DROP TABLE IF EXISTS customer_orders;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS lives;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS batch_classification_details;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS customer_owner_history;
DROP TABLE IF EXISTS customer_addresses;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS boxes;
DROP TABLE IF EXISTS storage_locations;
DROP TABLE IF EXISTS branch_sales_channels;
DROP TABLE IF EXISTS sales_channels;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS sizes;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS product_types;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS branches;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE branches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  postal_code VARCHAR(32) NOT NULL,
  country VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branches_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_branch (branch_id),
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  KEY idx_user_permissions_permission (permission_id),
  CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_types_code (code),
  UNIQUE KEY uq_product_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_code (code),
  UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sizes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sizes_code (code),
  UNIQUE KEY uq_sizes_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_methods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_methods_code (code),
  UNIQUE KEY uq_payment_methods_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_channels (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_channels_code (code),
  UNIQUE KEY uq_sales_channels_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branch_sales_channels (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  sales_channel_id BIGINT UNSIGNED NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by_user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branch_sales_channels (branch_id, sales_channel_id),
  KEY idx_branch_sales_channels_channel (sales_channel_id),
  KEY idx_branch_sales_channels_updated_by (updated_by_user_id),
  CONSTRAINT fk_branch_sales_channels_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_branch_sales_channels_channel FOREIGN KEY (sales_channel_id) REFERENCES sales_channels(id),
  CONSTRAINT fk_branch_sales_channels_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE storage_locations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_storage_locations_branch_code (branch_id, code),
  UNIQUE KEY uq_storage_locations_branch_name (branch_id, name),
  CONSTRAINT fk_storage_locations_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE boxes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  qr_code VARCHAR(128) NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_boxes_branch_code (branch_id, code),
  UNIQUE KEY uq_boxes_qr_code (qr_code),
  CONSTRAINT fk_boxes_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  is_generic TINYINT(1) NOT NULL DEFAULT 0,
  generic_type ENUM('DOOR','CONSIGNMENT') NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customers_branch (branch_id),
  KEY idx_customers_owner (owner_user_id),
  KEY idx_customers_created_by (created_by_user_id),
  CONSTRAINT fk_customers_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_customers_owner FOREIGN KEY (owner_user_id) REFERENCES users(id),
  CONSTRAINT fk_customers_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(64) NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255) NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  postal_code VARCHAR(32) NOT NULL,
  country VARCHAR(120) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_addresses_customer (customer_id),
  CONSTRAINT fk_customer_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_owner_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(255) NOT NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by_user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_customer_owner_history_customer (customer_id),
  KEY idx_customer_owner_history_from_user (from_user_id),
  KEY idx_customer_owner_history_to_user (to_user_id),
  KEY idx_customer_owner_history_changed_by (changed_by_user_id),
  CONSTRAINT fk_customer_owner_history_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_customer_owner_history_from_user FOREIGN KEY (from_user_id) REFERENCES users(id),
  CONSTRAINT fk_customer_owner_history_to_user FOREIGN KEY (to_user_id) REFERENCES users(id),
  CONSTRAINT fk_customer_owner_history_changed_by FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  folio VARCHAR(64) NOT NULL,
  expected_quantity INT NOT NULL,
  received_quantity INT NULL,
  status ENUM('ANNOUNCED','RECEIVED','RECONCILED','CANCELLED') NOT NULL DEFAULT 'ANNOUNCED',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_batches_folio (folio),
  KEY idx_batches_branch (branch_id),
  KEY idx_batches_created_by (created_by_user_id),
  CONSTRAINT fk_batches_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_batches_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE batch_classification_details (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  product_type_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_batch_classification_details (batch_id, product_type_id),
  KEY idx_batch_classification_product_type (product_type_id),
  CONSTRAINT fk_batch_classification_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_batch_classification_product_type FOREIGN KEY (product_type_id) REFERENCES product_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  qr_code VARCHAR(128) NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  batch_id BIGINT UNSIGNED NULL,
  product_type_id BIGINT UNSIGNED NOT NULL,
  brand_id BIGINT UNSIGNED NULL,
  size_id BIGINT UNSIGNED NULL,
  comments TEXT NULL,
  price DECIMAL(12,2) NULL,
  status ENUM('AVAILABLE','RESERVED','SOLD','DISABLED','ON_CONSIGNMENT') NOT NULL DEFAULT 'AVAILABLE',
  storage_location_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_items_code (code),
  UNIQUE KEY uq_items_qr_code (qr_code),
  KEY idx_items_branch (branch_id),
  KEY idx_items_batch (batch_id),
  KEY idx_items_product_type (product_type_id),
  KEY idx_items_brand (brand_id),
  KEY idx_items_size (size_id),
  KEY idx_items_status (status),
  KEY idx_items_storage_location (storage_location_id),
  KEY idx_items_created_by (created_by_user_id),
  CONSTRAINT fk_items_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_items_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_items_product_type FOREIGN KEY (product_type_id) REFERENCES product_types(id),
  CONSTRAINT fk_items_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT fk_items_size FOREIGN KEY (size_id) REFERENCES sizes(id),
  CONSTRAINT fk_items_storage_location FOREIGN KEY (storage_location_id) REFERENCES storage_locations(id),
  CONSTRAINT fk_items_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lives (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  status ENUM('OPEN','ACTIVE','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_lives_branch (branch_id),
  KEY idx_lives_status (status),
  KEY idx_lives_created_by (created_by_user_id),
  CONSTRAINT fk_lives_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_lives_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  live_id BIGINT UNSIGNED NULL,
  seller_user_id BIGINT UNSIGNED NULL,
  box_id BIGINT UNSIGNED NULL,
  sales_channel_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  notes TEXT NULL,
  status ENUM('ACTIVE','CANCELLED','CONVERTED_TO_SALE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at DATETIME NULL,
  cancel_reason VARCHAR(255) NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_reservations_item (item_id),
  KEY idx_reservations_customer (customer_id),
  KEY idx_reservations_branch (branch_id),
  KEY idx_reservations_live (live_id),
  KEY idx_reservations_seller (seller_user_id),
  KEY idx_reservations_box (box_id),
  KEY idx_reservations_channel (sales_channel_id),
  KEY idx_reservations_status (status),
  KEY idx_reservations_cancelled_by (cancelled_by_user_id),
  CONSTRAINT fk_reservations_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_reservations_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_reservations_live FOREIGN KEY (live_id) REFERENCES lives(id),
  CONSTRAINT fk_reservations_seller FOREIGN KEY (seller_user_id) REFERENCES users(id),
  CONSTRAINT fk_reservations_box FOREIGN KEY (box_id) REFERENCES boxes(id),
  CONSTRAINT fk_reservations_channel FOREIGN KEY (sales_channel_id) REFERENCES sales_channels(id),
  CONSTRAINT fk_reservations_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  status ENUM('OPEN','CONSOLIDATING','READY_TO_PACK','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancel_reason VARCHAR(255) NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_customer_orders_customer (customer_id),
  KEY idx_customer_orders_branch (branch_id),
  KEY idx_customer_orders_status (status),
  KEY idx_customer_orders_cancelled_by (cancelled_by_user_id),
  CONSTRAINT fk_customer_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_customer_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_customer_orders_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  seller_user_id BIGINT UNSIGNED NULL,
  customer_order_id BIGINT UNSIGNED NULL,
  sales_channel_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  status ENUM('ACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  cancelled_at DATETIME NULL,
  cancel_reason VARCHAR(255) NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_sales_item (item_id),
  KEY idx_sales_customer (customer_id),
  KEY idx_sales_branch (branch_id),
  KEY idx_sales_seller (seller_user_id),
  KEY idx_sales_customer_order (customer_order_id),
  KEY idx_sales_channel (sales_channel_id),
  KEY idx_sales_status (status),
  KEY idx_sales_created_by (created_by_user_id),
  KEY idx_sales_cancelled_by (cancelled_by_user_id),
  CONSTRAINT fk_sales_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_sales_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_sales_seller FOREIGN KEY (seller_user_id) REFERENCES users(id),
  CONSTRAINT fk_sales_customer_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
  CONSTRAINT fk_sales_channel FOREIGN KEY (sales_channel_id) REFERENCES sales_channels(id),
  CONSTRAINT fk_sales_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_sales_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_order_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  reservation_id BIGINT UNSIGNED NULL,
  sale_id BIGINT UNSIGNED NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customer_order_items_order (customer_order_id),
  KEY idx_customer_order_items_item (item_id),
  KEY idx_customer_order_items_reservation (reservation_id),
  KEY idx_customer_order_items_sale (sale_id),
  CONSTRAINT fk_customer_order_items_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
  CONSTRAINT fk_customer_order_items_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_customer_order_items_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  CONSTRAINT fk_customer_order_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  received_amount DECIMAL(12,2) NOT NULL,
  payment_method_id BIGINT UNSIGNED NOT NULL,
  reference VARCHAR(255) NULL,
  status ENUM('ACTIVE','VOIDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  voided_at DATETIME NULL,
  void_reason VARCHAR(255) NULL,
  voided_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_payments_customer (customer_id),
  KEY idx_payments_branch (branch_id),
  KEY idx_payments_method (payment_method_id),
  KEY idx_payments_status (status),
  KEY idx_payments_created_by (created_by_user_id),
  KEY idx_payments_voided_by (voided_by_user_id),
  CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_payments_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_payments_voided_by FOREIGN KEY (voided_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id BIGINT UNSIGNED NOT NULL,
  reservation_id BIGINT UNSIGNED NULL,
  sale_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payment_allocations_payment (payment_id),
  KEY idx_payment_allocations_reservation (reservation_id),
  KEY idx_payment_allocations_sale (sale_id),
  CONSTRAINT fk_payment_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_payment_allocations_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  CONSTRAINT fk_payment_allocations_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_balance_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  type ENUM('PAYMENT_OVERAGE','APPLIED_TO_ORDER','MANUAL_ADJUSTMENT') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  customer_order_id BIGINT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_customer_balance_movements_customer (customer_id),
  KEY idx_customer_balance_movements_branch (branch_id),
  KEY idx_customer_balance_movements_type (type),
  KEY idx_customer_balance_movements_payment (payment_id),
  KEY idx_customer_balance_movements_order (customer_order_id),
  KEY idx_customer_balance_movements_created_by (created_by_user_id),
  CONSTRAINT fk_customer_balance_movements_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_customer_balance_movements_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_customer_balance_movements_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_customer_balance_movements_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
  CONSTRAINT fk_customer_balance_movements_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_packages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(64) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  status ENUM('OPEN','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  closed_at DATETIME NULL,
  closed_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_packages_folio (folio),
  KEY idx_customer_packages_customer (customer_id),
  KEY idx_customer_packages_branch (branch_id),
  KEY idx_customer_packages_status (status),
  KEY idx_customer_packages_created_by (created_by_user_id),
  KEY idx_customer_packages_closed_by (closed_by_user_id),
  CONSTRAINT fk_customer_packages_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_customer_packages_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_customer_packages_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_customer_packages_closed_by FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_package_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_package_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  reservation_id BIGINT UNSIGNED NULL,
  sale_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_package_items (customer_package_id, item_id),
  KEY idx_customer_package_items_item (item_id),
  KEY idx_customer_package_items_reservation (reservation_id),
  KEY idx_customer_package_items_sale (sale_id),
  CONSTRAINT fk_customer_package_items_package FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id),
  CONSTRAINT fk_customer_package_items_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_customer_package_items_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  CONSTRAINT fk_customer_package_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(64) NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  delivery_type ENUM('LOCAL','CARRIER') NOT NULL,
  status ENUM('OPEN','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  guide_reference VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  dispatched_at DATETIME NULL,
  dispatched_by_user_id BIGINT UNSIGNED NULL,
  cancelled_at DATETIME NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipments_folio (folio),
  KEY idx_shipments_branch (branch_id),
  KEY idx_shipments_status (status),
  KEY idx_shipments_created_by (created_by_user_id),
  KEY idx_shipments_dispatched_by (dispatched_by_user_id),
  KEY idx_shipments_cancelled_by (cancelled_by_user_id),
  CONSTRAINT fk_shipments_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_shipments_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_shipments_dispatched_by FOREIGN KEY (dispatched_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_shipments_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shipment_packages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shipment_id BIGINT UNSIGNED NOT NULL,
  customer_package_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  delivery_address_id BIGINT UNSIGNED NOT NULL,
  payment_mode ENUM('PREPAID','COD') NOT NULL,
  expected_cod_amount DECIMAL(12,2) NULL,
  result_status ENUM('PENDING','DELIVERED','NOT_DELIVERED','RETURNED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  collected_amount DECIMAL(12,2) NULL,
  result_notes VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipment_packages_customer_package (customer_package_id),
  KEY idx_shipment_packages_shipment (shipment_id),
  KEY idx_shipment_packages_customer (customer_id),
  KEY idx_shipment_packages_delivery_address (delivery_address_id),
  KEY idx_shipment_packages_result_status (result_status),
  CONSTRAINT fk_shipment_packages_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  CONSTRAINT fk_shipment_packages_customer_package FOREIGN KEY (customer_package_id) REFERENCES customer_packages(id),
  CONSTRAINT fk_shipment_packages_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_shipment_packages_delivery_address FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branch_transfers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(64) NOT NULL,
  from_branch_id BIGINT UNSIGNED NOT NULL,
  to_branch_id BIGINT UNSIGNED NOT NULL,
  customer_order_id BIGINT UNSIGNED NULL,
  status ENUM('OPEN','IN_TRANSIT','RECEIVED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  sent_at DATETIME NULL,
  received_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branch_transfers_folio (folio),
  KEY idx_branch_transfers_from_branch (from_branch_id),
  KEY idx_branch_transfers_to_branch (to_branch_id),
  KEY idx_branch_transfers_order (customer_order_id),
  KEY idx_branch_transfers_status (status),
  KEY idx_branch_transfers_created_by (created_by_user_id),
  CONSTRAINT fk_branch_transfers_from_branch FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  CONSTRAINT fk_branch_transfers_to_branch FOREIGN KEY (to_branch_id) REFERENCES branches(id),
  CONSTRAINT fk_branch_transfers_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
  CONSTRAINT fk_branch_transfers_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE branch_transfer_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_transfer_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  received_at DATETIME NULL,
  received_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branch_transfer_items (branch_transfer_id, item_id),
  KEY idx_branch_transfer_items_item (item_id),
  KEY idx_branch_transfer_items_received_by (received_by_user_id),
  CONSTRAINT fk_branch_transfer_items_transfer FOREIGN KEY (branch_transfer_id) REFERENCES branch_transfers(id),
  CONSTRAINT fk_branch_transfer_items_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_branch_transfer_items_received_by FOREIGN KEY (received_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE incidents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  customer_id BIGINT UNSIGNED NULL,
  item_id BIGINT UNSIGNED NULL,
  shipment_id BIGINT UNSIGNED NULL,
  customer_order_id BIGINT UNSIGNED NULL,
  expected_amount DECIMAL(12,2) NULL,
  received_amount DECIMAL(12,2) NULL,
  difference_amount DECIMAL(12,2) NULL,
  description TEXT NULL,
  evidence_url VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  in_progress_at DATETIME NULL,
  resolved_at DATETIME NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  cancelled_at DATETIME NULL,
  cancelled_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_incidents_branch (branch_id),
  KEY idx_incidents_type (type),
  KEY idx_incidents_status (status),
  KEY idx_incidents_customer (customer_id),
  KEY idx_incidents_item (item_id),
  KEY idx_incidents_shipment (shipment_id),
  KEY idx_incidents_order (customer_order_id),
  KEY idx_incidents_created_by (created_by_user_id),
  KEY idx_incidents_resolved_by (resolved_by_user_id),
  KEY idx_incidents_cancelled_by (cancelled_by_user_id),
  CONSTRAINT fk_incidents_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_incidents_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_incidents_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_incidents_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  CONSTRAINT fk_incidents_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id),
  CONSTRAINT fk_incidents_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_incidents_resolved_by FOREIGN KEY (resolved_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_incidents_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consignees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(190) NULL,
  notes TEXT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consignees_branch (branch_id),
  CONSTRAINT fk_consignees_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folio VARCHAR(64) NOT NULL,
  branch_id BIGINT UNSIGNED NOT NULL,
  consignee_id BIGINT UNSIGNED NOT NULL,
  status ENUM('OPEN','DELIVERED','IN_SETTLEMENT','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  delivered_at DATETIME NULL,
  closed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consignments_folio (folio),
  KEY idx_consignments_branch (branch_id),
  KEY idx_consignments_consignee (consignee_id),
  KEY idx_consignments_status (status),
  KEY idx_consignments_created_by (created_by_user_id),
  CONSTRAINT fk_consignments_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_consignments_consignee FOREIGN KEY (consignee_id) REFERENCES consignees(id),
  CONSTRAINT fk_consignments_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consignment_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  consignment_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  suggested_price DECIMAL(12,2) NULL,
  status ENUM('OUT_ON_CONSIGNMENT','SOLD','RETURNED') NOT NULL DEFAULT 'OUT_ON_CONSIGNMENT',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consignment_items (consignment_id, item_id),
  KEY idx_consignment_items_item (item_id),
  KEY idx_consignment_items_status (status),
  CONSTRAINT fk_consignment_items_consignment FOREIGN KEY (consignment_id) REFERENCES consignments(id),
  CONSTRAINT fk_consignment_items_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consignment_settlements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  consignment_id BIGINT UNSIGNED NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_consignment_settlements_consignment (consignment_id),
  KEY idx_consignment_settlements_created_by (created_by_user_id),
  CONSTRAINT fk_consignment_settlements_consignment FOREIGN KEY (consignment_id) REFERENCES consignments(id),
  CONSTRAINT fk_consignment_settlements_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consignment_settlement_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  consignment_settlement_id BIGINT UNSIGNED NOT NULL,
  consignment_item_id BIGINT UNSIGNED NOT NULL,
  result ENUM('SOLD','RETURNED') NOT NULL,
  sale_price DECIMAL(12,2) NULL,
  customer_id BIGINT UNSIGNED NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consignment_settlement_items (consignment_settlement_id, consignment_item_id),
  KEY idx_consignment_settlement_items_item (consignment_item_id),
  KEY idx_consignment_settlement_items_customer (customer_id),
  CONSTRAINT fk_consignment_settlement_items_settlement FOREIGN KEY (consignment_settlement_id) REFERENCES consignment_settlements(id),
  CONSTRAINT fk_consignment_settlement_items_item FOREIGN KEY (consignment_item_id) REFERENCES consignment_items(id),
  CONSTRAINT fk_consignment_settlement_items_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
