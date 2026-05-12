-- Limpieza opcional de datos QA.
-- Ejecutar solo despues de respaldar. Borra registros relacionados con prefijos QA.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

DELETE csi FROM consignment_settlement_items csi
JOIN consignment_items ci ON ci.id = csi.consignment_item_id
JOIN items i ON i.id = ci.item_id
WHERE i.code LIKE 'QA-%';

DELETE cs FROM consignment_settlements cs
JOIN consignments c ON c.id = cs.consignment_id
WHERE c.folio LIKE 'QA-%';

DELETE ci FROM consignment_items ci
JOIN items i ON i.id = ci.item_id
WHERE i.code LIKE 'QA-%';

DELETE c FROM consignments c WHERE c.folio LIKE 'QA-%';
DELETE cg FROM consignees cg WHERE cg.name LIKE 'QA %' OR cg.email LIKE 'qa.%';

DELETE i FROM incidents i
LEFT JOIN customers c ON c.id = i.customer_id
LEFT JOIN items it ON it.id = i.item_id
WHERE c.name LIKE 'QA %' OR it.code LIKE 'QA-%' OR i.description LIKE '%QA%';

DELETE bti FROM branch_transfer_items bti
JOIN items i ON i.id = bti.item_id
WHERE i.code LIKE 'QA-%';

DELETE bt FROM branch_transfers bt
WHERE bt.folio LIKE 'QA-%'
   OR bt.from_branch_id IN (SELECT id FROM branches WHERE code IN ('QA_CTR','QA_VER'))
   OR bt.to_branch_id IN (SELECT id FROM branches WHERE code IN ('QA_CTR','QA_VER'));

DELETE sp FROM shipment_packages sp
JOIN customer_packages cp ON cp.id = sp.customer_package_id
WHERE cp.folio LIKE 'QA-%';

DELETE s FROM shipments s
WHERE s.folio LIKE 'QA-%'
   OR s.branch_id IN (SELECT id FROM branches WHERE code IN ('QA_CTR','QA_VER'));

DELETE cpi FROM customer_package_items cpi
JOIN customer_packages cp ON cp.id = cpi.customer_package_id
WHERE cp.folio LIKE 'QA-%';

DELETE cp FROM customer_packages cp
WHERE cp.folio LIKE 'QA-%'
   OR cp.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');

DELETE cbm FROM customer_balance_movements cbm
WHERE cbm.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');

DELETE pa FROM payment_allocations pa
JOIN payments p ON p.id = pa.payment_id
WHERE p.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');

DELETE p FROM payments p
WHERE p.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%')
   OR p.reference LIKE 'QA-%';

DELETE coi FROM customer_order_items coi
JOIN items i ON i.id = coi.item_id
WHERE i.code LIKE 'QA-%';

DELETE co FROM customer_orders co
WHERE co.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');

DELETE s FROM sales s
JOIN items i ON i.id = s.item_id
WHERE i.code LIKE 'QA-%';

DELETE r FROM reservations r
JOIN items i ON i.id = r.item_id
WHERE i.code LIKE 'QA-%';

DELETE l FROM lives l
WHERE l.notes LIKE '%QA%'
   OR l.branch_id IN (SELECT id FROM branches WHERE code IN ('QA_CTR','QA_VER'));

DELETE i FROM items i WHERE i.code LIKE 'QA-%' OR i.qr_code LIKE 'QR-QA-%';
DELETE bcd FROM batch_classification_details bcd
JOIN batches b ON b.id = bcd.batch_id
WHERE b.folio LIKE 'QA-%';
DELETE b FROM batches b WHERE b.folio LIKE 'QA-%';

DELETE coh FROM customer_owner_history coh
WHERE coh.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');
DELETE ca FROM customer_addresses ca
WHERE ca.customer_id IN (SELECT id FROM customers WHERE name LIKE 'QA %' OR email LIKE 'qa.%');
DELETE c FROM customers c WHERE c.name LIKE 'QA %' OR c.email LIKE 'qa.%';

DELETE bx FROM boxes bx WHERE bx.code LIKE 'QA_%' OR bx.qr_code LIKE 'QA-%';
DELETE sl FROM storage_locations sl WHERE sl.code LIKE 'QA_%';
DELETE bsc FROM branch_sales_channels bsc
WHERE bsc.branch_id IN (SELECT id FROM branches WHERE code IN ('QA_CTR','QA_VER'));

DELETE up FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email LIKE 'qa.%@local.test';
DELETE ur FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE u.email LIKE 'qa.%@local.test';
DELETE u FROM users u WHERE u.email LIKE 'qa.%@local.test';

DELETE br FROM branches br WHERE br.code IN ('QA_CTR','QA_VER');

DELETE FROM product_types WHERE code LIKE 'QA_%';
DELETE FROM brands WHERE code LIKE 'QA_%';
DELETE FROM sizes WHERE code LIKE 'QA_%';
DELETE FROM payment_methods WHERE code LIKE 'QA_%';

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Datos QA limpiados' AS resultado;
