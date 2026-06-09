SET NAMES utf8mb4;
START TRANSACTION;

-- LIVE-PERM-A1B: every role that can create LIVE holds must also be able to view LIVE.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp_live.role_id, p_view.id
FROM role_permissions rp_live
JOIN permissions p_live ON p_live.id = rp_live.permission_id
JOIN permissions p_view ON p_view.code = 'VIEW_LIVE'
WHERE p_live.code = 'DO_LIVE_RESERVATION';

COMMIT;
