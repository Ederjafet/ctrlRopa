ALTER TABLE items
  DROP INDEX uq_items_code,
  DROP INDEX uq_items_qr_code,
  ADD UNIQUE KEY uq_items_company_code (company_id, code),
  ADD UNIQUE KEY uq_items_company_qr_code (company_id, qr_code);
