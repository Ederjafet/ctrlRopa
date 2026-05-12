package com.hpsqsoft.ctrlropa.shipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByFolio(String folio);

    boolean existsByFolio(String folio);

    List<Shipment> findByBranchIdOrderByCreatedAtDesc(Long branchId);
}