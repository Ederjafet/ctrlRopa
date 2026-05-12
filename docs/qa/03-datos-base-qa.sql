-- SOLO QA - Extension Fase 1D: proveedores, lotes y calidad.
-- No es migracion Flyway. No ejecutar en PROD.
-- Requiere respaldo previo y migraciones aplicadas hasta V37__suppliers_and_batch_quality.sql.
-- Script idempotente: crea/actualiza datos con prefijo QA sin borrar informacion.

SET NAMES utf8mb4;
START TRANSACTION;

-- Proveedores QA para validar origen y calidad de lotes.
INSERT INTO suppliers (code, name, description, status) VALUES
  ('QA_SUP_FAST', 'QA Proveedor Rapido', 'Proveedor QA para lotes con entrega correcta', 'ACTIVE'),
  ('QA_SUP_REVIEW', 'QA Proveedor Revision', 'Proveedor QA para validar notas y calidad baja', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  status = 'ACTIVE';

SELECT id INTO @qa_supplier_fast_id FROM suppliers WHERE code = 'QA_SUP_FAST';
SELECT id INTO @qa_supplier_review_id FROM suppliers WHERE code = 'QA_SUP_REVIEW';
SELECT id INTO @qa_admin_id FROM users WHERE email = 'qa.admin@local.test';

-- Vincula proveedor/calidad a lotes creados por el script historico 01.
UPDATE batches
SET
  supplier_id = @qa_supplier_fast_id,
  received_at = COALESCE(received_at, NOW()),
  quality_score = COALESCE(quality_score, 5),
  quality_notes = COALESCE(quality_notes, 'QA: lote recibido completo y en buen estado.')
WHERE folio = 'QA-LOTE-QA_CTR-001';

UPDATE batches
SET
  supplier_id = @qa_supplier_review_id,
  received_at = COALESCE(received_at, NOW()),
  quality_score = COALESCE(quality_score, 3),
  quality_notes = COALESCE(quality_notes, 'QA: lote con observaciones para validar seguimiento de calidad.')
WHERE folio = 'QA-LOTE-QA_VER-001';

-- Lote pendiente por recibir para validar filtros y estatus sin tocar inventario.
INSERT INTO batches (
  branch_id, supplier_id, folio, expected_quantity, received_quantity, status,
  notes, created_by_user_id, quality_score, quality_notes
)
SELECT
  b.id, @qa_supplier_review_id, 'QA-LOTE-PENDIENTE-001', 20, NULL, 'ANNOUNCED',
  'QA: lote pendiente por recibir para regresion operacional.',
  @qa_admin_id, NULL, NULL
FROM branches b
WHERE b.code = 'QA_CTR'
  AND @qa_admin_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM batches bx WHERE bx.folio = 'QA-LOTE-PENDIENTE-001');

COMMIT;

SELECT 'Extension QA 03 aplicada: proveedores y calidad de lotes preparados.' AS resultado;
