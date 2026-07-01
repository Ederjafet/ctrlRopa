package com.hpsqsoft.ctrlropa.shipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentCostShareRepository extends JpaRepository<ShipmentCostShare, Long> {

    List<ShipmentCostShare> findByShipmentIdOrderByIdAsc(Long shipmentId);

    void deleteByShipmentId(Long shipmentId);
}