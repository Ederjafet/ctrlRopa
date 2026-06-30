package com.hpsqsoft.ctrlropa.shipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentPaymentRepository extends JpaRepository<ShipmentPayment, Long> {

    List<ShipmentPayment> findByShipmentIdOrderByRegisteredAtDescIdDesc(Long shipmentId);

    List<ShipmentPayment> findByShipmentIdAndStatusOrderByRegisteredAtDescIdDesc(Long shipmentId, ShipmentPaymentStatus status);

    Optional<ShipmentPayment> findByShipmentIdAndId(Long shipmentId, Long id);
}
