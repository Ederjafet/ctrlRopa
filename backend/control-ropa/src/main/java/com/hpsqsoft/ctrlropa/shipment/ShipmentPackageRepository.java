package com.hpsqsoft.ctrlropa.shipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentPackageRepository extends JpaRepository<ShipmentPackage, Long> {

    List<ShipmentPackage> findByShipmentIdOrderByIdAsc(Long shipmentId);

    List<ShipmentPackage> findByCustomerPackageIdOrderByIdDesc(Long customerPackageId);

    Optional<ShipmentPackage> findByShipmentIdAndId(Long shipmentId, Long id);

    long countByShipmentId(Long shipmentId);
}
