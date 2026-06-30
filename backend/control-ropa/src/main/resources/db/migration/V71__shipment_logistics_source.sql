ALTER TABLE shipments
  ADD COLUMN recipient_name VARCHAR(120) NULL AFTER guide_reference,
  ADD COLUMN recipient_phone VARCHAR(40) NULL AFTER recipient_name,
  ADD COLUMN destination_summary TEXT NULL AFTER recipient_phone,
  ADD COLUMN destination_city VARCHAR(120) NULL AFTER destination_summary,
  ADD COLUMN destination_state VARCHAR(120) NULL AFTER destination_city,
  ADD COLUMN destination_postal_code VARCHAR(20) NULL AFTER destination_state,
  ADD COLUMN shipping_carrier VARCHAR(100) NULL AFTER destination_postal_code,
  ADD COLUMN real_shipping_cost DECIMAL(12,2) NULL AFTER shipping_carrier,
  ADD COLUMN shipping_notes TEXT NULL AFTER real_shipping_cost,
  ADD COLUMN quoted_at DATETIME NULL AFTER shipping_notes,
  ADD COLUMN ready_at DATETIME NULL AFTER quoted_at,
  ADD COLUMN received_at DATETIME NULL AFTER ready_at;
