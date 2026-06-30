ALTER TABLE shipment_payments
    ADD KEY idx_shipment_payments_shipment_status (shipment_id, status),
    ADD KEY idx_shipment_payments_cost_share_status (cost_share_id, status);
