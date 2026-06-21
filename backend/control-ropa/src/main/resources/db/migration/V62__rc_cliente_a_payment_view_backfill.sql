SET NAMES utf8mb4;
START TRANSACTION;

-- RC-CLIENTE-A:
-- Quien ya puede registrar, aplicar saldo o anular pagos debe poder ver pagos.
-- Sin este backfill, el ADMIN tenant recien creado puede operar dinero pero no ve
-- Finanzas/Pagos porque el menu se controla por VIEW_PAYMENTS.

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, p_view.id
FROM role_permissions rp
JOIN permissions p_existing ON p_existing.id = rp.permission_id
JOIN permissions p_view ON p_view.code = 'VIEW_PAYMENTS'
WHERE p_existing.code IN (
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'VOID_PAYMENT'
);

INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT DISTINCT up.user_id, p_view.id
FROM user_permissions up
JOIN permissions p_existing ON p_existing.id = up.permission_id
JOIN permissions p_view ON p_view.code = 'VIEW_PAYMENTS'
WHERE p_existing.code IN (
  'REGISTER_PAYMENTS',
  'APPLY_CUSTOMER_BALANCE',
  'VOID_PAYMENT'
);

COMMIT;
