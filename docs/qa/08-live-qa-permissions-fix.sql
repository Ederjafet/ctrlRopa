-- SOLO QA - Fix controlado para permisos/tenant de LIVE.
-- No es migracion Flyway. No ejecutar en PROD.
--
-- Objetivo:
-- - Asegurar que usuarios QA usados en LIVE tengan:
--   - company activa
--   - branch activa
--   - user_companies activo
--   - user_branches activo
--   - permisos mínimos para operar LIVE demo/QA
--   - canal LIVE habilitado en su sucursal
-- - Revocar sesiones activas de esos usuarios para forzar login limpio tenant-aware.
--
-- Usuarios cubiertos:
--   qa.admin@local.test
--   qa.supervisor.centro@local.test
--   qa.vendedor.centro@local.test
--   qa.a.admin@local.test
--   qa.b.admin@local.test
--   qa.a.vendedor@local.test
--   qa.b.vendedor@local.test
--
-- Script idempotente: se puede ejecutar varias veces.

SET NAMES utf8mb4;
START TRANSACTION;

SET @default_company_id := NULL;
SET @qa_actor_user_id := NULL;

INSERT IGNORE INTO permissions (code, name) VALUES
  ('VIEW_CUSTOMERS', 'Ver clientes'),
  ('VIEW_INVENTORY', 'Ver inventario'),
  ('DO_LIVE_RESERVATION', 'Crear reservas en live');

INSERT IGNORE INTO sales_channels (code, name, status, global_enabled) VALUES
  ('LIVE', 'Live', 'ACTIVE', 1);

UPDATE sales_channels
SET status = 'ACTIVE',
    global_enabled = 1
WHERE code = 'LIVE';

-- Mantener las sucursales QA activas si existen.
UPDATE branches
SET status = 'ACTIVE'
WHERE code IN ('QA_CTR', 'QA_A_CTR', 'QA_B_CTR');

-- Asegurar company DEFAULT para QA_CTR si aplica.
SELECT id INTO @default_company_id
FROM companies
WHERE code = 'DEFAULT'
LIMIT 1;

UPDATE branches
SET company_id = @default_company_id
WHERE code = 'QA_CTR'
  AND @default_company_id IS NOT NULL;

-- Usuarios QA objetivo existentes. No crea usuarios nuevos para evitar contaminar QA.
DROP TEMPORARY TABLE IF EXISTS tmp_live_qa_users;
CREATE TEMPORARY TABLE tmp_live_qa_users (
  email VARCHAR(190) NOT NULL PRIMARY KEY
) ENGINE=Memory;

INSERT INTO tmp_live_qa_users (email) VALUES
  ('qa.admin@local.test'),
  ('qa.supervisor.centro@local.test'),
  ('qa.vendedor.centro@local.test'),
  ('qa.a.admin@local.test'),
  ('qa.b.admin@local.test'),
  ('qa.a.vendedor@local.test'),
  ('qa.b.vendedor@local.test');

-- Activar usuarios QA existentes sin cambiar password ni datos historicos.
UPDATE users u
JOIN tmp_live_qa_users q ON q.email = u.email
SET u.status = 'ACTIVE',
    u.password_change_required = 0;

-- Asegurar user_companies segun branch principal del usuario.
INSERT IGNORE INTO user_companies (user_id, company_id, is_primary, status)
SELECT u.id, b.company_id, 1, 'ACTIVE'
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
JOIN branches b ON b.id = u.branch_id
WHERE b.company_id IS NOT NULL;

UPDATE user_companies uc
JOIN users u ON u.id = uc.user_id
JOIN tmp_live_qa_users q ON q.email = u.email
JOIN branches b ON b.id = u.branch_id AND b.company_id = uc.company_id
SET uc.status = 'ACTIVE',
    uc.is_primary = 1;

-- Asegurar user_branches para branch principal.
INSERT IGNORE INTO user_branches (user_id, branch_id, is_primary)
SELECT u.id, u.branch_id, 1
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
WHERE u.branch_id IS NOT NULL;

UPDATE user_branches ub
JOIN users u ON u.id = ub.user_id AND u.branch_id = ub.branch_id
JOIN tmp_live_qa_users q ON q.email = u.email
SET ub.is_primary = 1;

-- Habilitar canal LIVE por sucursal QA de los usuarios cubiertos.
SELECT MIN(u.id) INTO @qa_actor_user_id
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
WHERE u.status = 'ACTIVE';

INSERT INTO branch_sales_channels (
  branch_id, sales_channel_id, is_enabled, updated_by_user_id
)
SELECT DISTINCT b.id, sc.id, 1, @qa_actor_user_id
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
JOIN branches b ON b.id = u.branch_id
JOIN sales_channels sc ON sc.code = 'LIVE'
WHERE @qa_actor_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  is_enabled = 1,
  updated_by_user_id = VALUES(updated_by_user_id);

-- Permisos directos solo para usuarios QA que deben operar LIVE.
-- No incluye qa.sinpermisos@local.test por diseno de pruebas negativas.
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
JOIN permissions p ON p.code IN (
  'VIEW_CUSTOMERS',
  'VIEW_INVENTORY',
  'DO_LIVE_RESERVATION'
);

-- Reset de bloqueo de login solo de usuarios QA cubiertos.
DELETE uls FROM user_login_security uls
JOIN users u ON u.id = uls.user_id
JOIN tmp_live_qa_users q ON q.email = u.email;

-- Revocar sesiones para forzar login nuevo con active_company_id/active_branch_id correctos.
UPDATE user_api_sessions s
JOIN users u ON u.id = s.user_id
JOIN tmp_live_qa_users q ON q.email = u.email
SET s.revoked_at = CURRENT_TIMESTAMP
WHERE s.revoked_at IS NULL;

COMMIT;

-- Validacion posterior: usuarios, tenant, branch, permisos y canal LIVE.
SELECT
  u.email,
  u.status AS user_status,
  b.code AS branch_code,
  b.status AS branch_status,
  c.code AS company_code,
  c.status AS company_status,
  CASE WHEN uc.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_company,
  CASE WHEN ub.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_branch,
  MAX(CASE WHEN p.code = 'DO_LIVE_RESERVATION' THEN 'YES' ELSE 'NO' END) AS can_live,
  MAX(CASE WHEN p.code = 'VIEW_CUSTOMERS' THEN 'YES' ELSE 'NO' END) AS can_customers,
  MAX(CASE WHEN p.code = 'VIEW_INVENTORY' THEN 'YES' ELSE 'NO' END) AS can_inventory,
  CASE WHEN bsc.id IS NULL THEN 'NO' ELSE 'YES' END AS live_channel_enabled
FROM users u
JOIN tmp_live_qa_users q ON q.email = u.email
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_companies uc
  ON uc.user_id = u.id
 AND uc.company_id = c.id
 AND uc.status = 'ACTIVE'
LEFT JOIN user_branches ub
  ON ub.user_id = u.id
 AND ub.branch_id = b.id
LEFT JOIN user_permissions up ON up.user_id = u.id
LEFT JOIN permissions p ON p.id = up.permission_id
LEFT JOIN sales_channels sc ON sc.code = 'LIVE'
LEFT JOIN branch_sales_channels bsc
  ON bsc.branch_id = b.id
 AND bsc.sales_channel_id = sc.id
 AND bsc.is_enabled = 1
GROUP BY
  u.email,
  u.status,
  b.code,
  b.status,
  c.code,
  c.status,
  has_user_company,
  has_user_branch,
  live_channel_enabled
ORDER BY u.email;
